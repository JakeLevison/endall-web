/**
 * CRM Context Assembler
 *
 * Given a user's natural language query, identifies mentioned entities
 * (contacts, companies, deals) and assembles all relevant CRM data
 * into a context string for the LLM.
 */

import { SupabaseClient } from "@supabase/supabase-js";

type AssembledContext = {
  summary: string;
  records: {
    contacts: Record<string, unknown>[];
    companies: Record<string, unknown>[];
    deals: Record<string, unknown>[];
    activities: Record<string, unknown>[];
  };
};

/**
 * Search CRM for entities mentioned in the query.
 * Uses fuzzy text matching against names, emails, and company domains.
 */
export async function assembleContext(
  supabase: SupabaseClient,
  tenantId: string,
  query: string
): Promise<AssembledContext> {
  const result: AssembledContext = {
    summary: "",
    records: { contacts: [], companies: [], deals: [], activities: [] },
  };

  // Search contacts by name fragments
  const { data: contacts } = await supabase
    .from("contacts")
    .select("*, companies(name, domain, industry)")
    .eq("tenant_id", tenantId)
    .is("merged_into", null)
    .or(`first_name.ilike.%${sanitize(query)}%,last_name.ilike.%${sanitize(query)}%,email.ilike.%${sanitize(query)}%`)
    .limit(5);

  if (contacts?.length) result.records.contacts = contacts;

  // Search companies by name or domain
  const { data: companies } = await supabase
    .from("companies")
    .select("*")
    .eq("tenant_id", tenantId)
    .is("merged_into", null)
    .or(`name.ilike.%${sanitize(query)}%,domain.ilike.%${sanitize(query)}%`)
    .limit(5);

  if (companies?.length) result.records.companies = companies;

  // Search deals by name
  const { data: deals } = await supabase
    .from("deals")
    .select("*, contacts(first_name, last_name, email), companies(name)")
    .eq("tenant_id", tenantId)
    .or(`name.ilike.%${sanitize(query)}%`)
    .limit(5);

  if (deals?.length) result.records.deals = deals;

  // Get recent activities for any matched contacts
  const contactIds = (contacts || []).map((c) => c.id);
  if (contactIds.length > 0) {
    const { data: activities } = await supabase
      .from("activities")
      .select("*")
      .eq("tenant_id", tenantId)
      .in("contact_id", contactIds)
      .order("created_at", { ascending: false })
      .limit(10);

    if (activities?.length) result.records.activities = activities;
  }

  // Build summary string for LLM context
  result.summary = buildSummary(result.records);
  return result;
}

/**
 * Assemble full context for a specific record (used by pre-built actions).
 */
export async function assembleRecordContext(
  supabase: SupabaseClient,
  tenantId: string,
  objectType: "contact" | "company" | "deal",
  recordId: string
): Promise<AssembledContext> {
  const result: AssembledContext = {
    summary: "",
    records: { contacts: [], companies: [], deals: [], activities: [] },
  };

  if (objectType === "contact") {
    const { data } = await supabase
      .from("contacts")
      .select("*, companies(name, domain, industry, size, website)")
      .eq("id", recordId)
      .single();
    if (data) result.records.contacts = [data];

    // Get their deals
    const { data: deals } = await supabase
      .from("deals")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("contact_id", recordId)
      .order("created_at", { ascending: false })
      .limit(10);
    if (deals) result.records.deals = deals;

    // Get their activities
    const { data: activities } = await supabase
      .from("activities")
      .select("*")
      .eq("contact_id", recordId)
      .order("created_at", { ascending: false })
      .limit(20);
    if (activities) result.records.activities = activities;

  } else if (objectType === "company") {
    const { data } = await supabase
      .from("companies")
      .select("*")
      .eq("id", recordId)
      .single();
    if (data) result.records.companies = [data];

    // Get contacts at this company
    const { data: contacts } = await supabase
      .from("contacts")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("company_id", recordId)
      .is("merged_into", null)
      .limit(20);
    if (contacts) result.records.contacts = contacts;

    // Get deals for this company
    const { data: deals } = await supabase
      .from("deals")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("company_id", recordId)
      .limit(10);
    if (deals) result.records.deals = deals;

  } else if (objectType === "deal") {
    const { data } = await supabase
      .from("deals")
      .select("*, contacts(*, companies(name)), companies(name, domain)")
      .eq("id", recordId)
      .single();
    if (data) {
      result.records.deals = [data];
      if (data.contacts) result.records.contacts = [data.contacts as Record<string, unknown>];
      if (data.companies) result.records.companies = [data.companies as Record<string, unknown>];
    }

    // Get activities for the deal's contact
    if (data?.contact_id) {
      const { data: activities } = await supabase
        .from("activities")
        .select("*")
        .eq("contact_id", data.contact_id as string)
        .order("created_at", { ascending: false })
        .limit(20);
      if (activities) result.records.activities = activities;
    }
  }

  result.summary = buildSummary(result.records);
  return result;
}

/**
 * Get a pipeline overview for general questions.
 */
export async function assemblePipelineContext(
  supabase: SupabaseClient,
  tenantId: string
): Promise<string> {
  const { data: deals } = await supabase
    .from("deals")
    .select("name, amount, stage, close_date, contacts(first_name, last_name), companies(name)")
    .eq("tenant_id", tenantId)
    .order("amount", { ascending: false })
    .limit(20);

  const { data: contacts } = await supabase
    .from("contacts")
    .select("id")
    .eq("tenant_id", tenantId)
    .is("merged_into", null);

  const { data: companies } = await supabase
    .from("companies")
    .select("id")
    .eq("tenant_id", tenantId)
    .is("merged_into", null);

  const totalContacts = contacts?.length || 0;
  const totalCompanies = companies?.length || 0;
  const totalDeals = deals?.length || 0;
  const totalPipeline = deals?.reduce((sum, d) => sum + (Number(d.amount) || 0), 0) || 0;

  const stageBreakdown: Record<string, { count: number; value: number }> = {};
  for (const d of deals || []) {
    const stage = d.stage || "Unknown";
    if (!stageBreakdown[stage]) stageBreakdown[stage] = { count: 0, value: 0 };
    stageBreakdown[stage].count++;
    stageBreakdown[stage].value += Number(d.amount) || 0;
  }

  let summary = `## CRM Overview\n`;
  summary += `- ${totalContacts} contacts, ${totalCompanies} companies, ${totalDeals} active deals\n`;
  summary += `- Total pipeline: $${totalPipeline.toLocaleString()}\n\n`;
  summary += `## Pipeline by Stage\n`;
  for (const [stage, info] of Object.entries(stageBreakdown)) {
    summary += `- ${stage}: ${info.count} deals, $${info.value.toLocaleString()}\n`;
  }

  if (deals?.length) {
    summary += `\n## Top Deals\n`;
    for (const d of deals.slice(0, 5)) {
      const contact = d.contacts as unknown as Record<string, unknown> | null;
      const company = d.companies as unknown as Record<string, unknown> | null;
      summary += `- ${d.name}: $${Number(d.amount).toLocaleString()} (${d.stage}) — ${contact?.first_name || ""} ${contact?.last_name || ""} at ${company?.name || "Unknown"}, closes ${d.close_date || "TBD"}\n`;
    }
  }

  return summary;
}

// ---- Helpers ----

function sanitize(input: string): string {
  return input.replace(/[%_'"\\]/g, "");
}

function buildSummary(records: AssembledContext["records"]): string {
  const parts: string[] = [];

  for (const c of records.contacts) {
    const co = c.companies as Record<string, unknown> | null;
    parts.push(
      `Contact: ${c.first_name} ${c.last_name} (${c.email}) — ${c.lifecycle_stage}, score: ${c.lead_score || 0}${co ? `, works at ${co.name}` : ""}`
    );
  }

  for (const co of records.companies) {
    parts.push(
      `Company: ${co.name} (${co.domain}) — ${co.industry || "Unknown industry"}, ${co.size || "Unknown size"}`
    );
  }

  for (const d of records.deals) {
    parts.push(
      `Deal: ${d.name} — $${Number(d.amount).toLocaleString()}, stage: ${d.stage}, closes: ${d.close_date || "TBD"}`
    );
  }

  if (records.activities.length > 0) {
    parts.push(`\nRecent Activity (${records.activities.length} items):`);
    for (const a of records.activities.slice(0, 10)) {
      parts.push(`  - [${a.type}] ${a.subject} (${new Date(a.created_at as string).toLocaleDateString()})`);
    }
  }

  return parts.join("\n");
}
