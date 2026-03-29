/**
 * Contact Enrichment
 *
 * Extracts company info from email domain and attempts to enrich
 * using public data. Used when creating or updating contacts.
 */

import { SupabaseClient } from "@supabase/supabase-js";

type EnrichmentResult = {
  company_name?: string;
  domain?: string;
  company_id?: string; // if company already exists in CRM
};

/**
 * Given an email address, extract the domain and check if we already
 * have a company with that domain. If so, return the company info.
 * If not, derive the company name from the domain.
 */
export async function enrichFromEmail(
  supabase: SupabaseClient,
  tenantId: string,
  email: string
): Promise<EnrichmentResult> {
  if (!email || !email.includes("@")) return {};

  const domain = email.split("@")[1].toLowerCase();

  // Skip free email providers
  const freeProviders = [
    "gmail.com", "yahoo.com", "hotmail.com", "outlook.com",
    "aol.com", "icloud.com", "mail.com", "protonmail.com",
    "live.com", "msn.com",
  ];
  if (freeProviders.includes(domain)) return {};

  // Check if company with this domain already exists
  const { data: existing } = await supabase
    .from("companies")
    .select("id, name, domain")
    .eq("tenant_id", tenantId)
    .eq("domain", domain)
    .is("merged_into", null)
    .limit(1);

  if (existing?.length) {
    return {
      company_name: existing[0].name,
      domain: existing[0].domain,
      company_id: existing[0].id,
    };
  }

  // Derive company name from domain (capitalize, remove TLD)
  const namePart = domain.split(".")[0];
  const companyName = namePart
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    company_name: companyName,
    domain,
  };
}
