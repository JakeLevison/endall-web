/**
 * Merge Token / Personalization Token Resolution
 *
 * Resolves nested tokens like {{contact.first_name}}, {{contact.company.name}},
 * {{deal.amount}}, {{owner.full_name}} against CRM records.
 *
 * Usage:
 *   const resolved = await resolveTokens(
 *     "Hi {{contact.first_name}}, your deal at {{contact.company.name}} is worth {{deal.amount}}.",
 *     { contact_id: "uuid", deal_id: "uuid" },
 *     supabase
 *   );
 */

import { SupabaseClient } from "@supabase/supabase-js";

// Token pattern: {{object.field}} or {{object.relation.field}}
const TOKEN_RE = /\{\{([a-zA-Z_]+(?:\.[a-zA-Z_]+)+)\}\}/g;

type TokenContext = {
  contact_id?: string;
  company_id?: string;
  deal_id?: string;
  owner_id?: string;
};

type RecordCache = Record<string, Record<string, unknown> | null>;

async function fetchRecord(
  supabase: SupabaseClient,
  objectType: string,
  id: string,
  cache: RecordCache
): Promise<Record<string, unknown> | null> {
  const cacheKey = `${objectType}:${id}`;
  if (cacheKey in cache) return cache[cacheKey];

  let query;
  switch (objectType) {
    case "contact":
      query = supabase.from("contacts").select("*, companies(*)").eq("id", id).single();
      break;
    case "company":
      query = supabase.from("companies").select("*").eq("id", id).single();
      break;
    case "deal":
      query = supabase.from("deals").select("*, contacts(*), companies(*)").eq("id", id).single();
      break;
    case "owner":
      query = supabase.from("profiles").select("*").eq("id", id).single();
      break;
    default:
      cache[cacheKey] = null;
      return null;
  }

  const { data, error } = await query;
  cache[cacheKey] = error ? null : (data as Record<string, unknown>);
  return cache[cacheKey];
}

function resolveNestedField(
  record: Record<string, unknown>,
  fieldPath: string[]
): string {
  let current: unknown = record;
  for (const segment of fieldPath) {
    if (current == null || typeof current !== "object") return "";
    current = (current as Record<string, unknown>)[segment];
  }
  if (current == null) return "";
  if (typeof current === "number") return current.toLocaleString("en-US");
  return String(current);
}

export async function resolveTokens(
  template: string,
  context: TokenContext,
  supabase: SupabaseClient
): Promise<string> {
  const cache: RecordCache = {};
  const tokens = [...template.matchAll(TOKEN_RE)];
  if (tokens.length === 0) return template;

  // Pre-fetch all needed records
  const objectIds: Record<string, string | undefined> = {
    contact: context.contact_id,
    company: context.company_id,
    deal: context.deal_id,
    owner: context.owner_id,
  };

  let result = template;

  for (const match of tokens) {
    const fullMatch = match[0]; // e.g., {{contact.company.name}}
    const path = match[1].split("."); // ["contact", "company", "name"]
    const objectType = path[0];
    const fieldPath = path.slice(1);

    const id = objectIds[objectType];
    if (!id) {
      result = result.replace(fullMatch, "");
      continue;
    }

    const record = await fetchRecord(supabase, objectType, id, cache);
    if (!record) {
      result = result.replace(fullMatch, "");
      continue;
    }

    const value = resolveNestedField(record, fieldPath);
    result = result.replace(fullMatch, value);
  }

  return result;
}

/**
 * Extract all token names from a template string.
 * Useful for validation and previewing available tokens.
 */
export function extractTokens(template: string): string[] {
  return [...template.matchAll(TOKEN_RE)].map((m) => m[1]);
}

/**
 * Available tokens by object type for the template editor UI.
 */
export const AVAILABLE_TOKENS = {
  contact: [
    "contact.first_name",
    "contact.last_name",
    "contact.email",
    "contact.phone",
    "contact.lifecycle_stage",
    "contact.lead_score",
    "contact.owner",
    "contact.company.name",
    "contact.company.domain",
    "contact.company.industry",
  ],
  deal: [
    "deal.name",
    "deal.amount",
    "deal.stage",
    "deal.close_date",
    "deal.owner",
    "deal.contacts.first_name",
    "deal.contacts.last_name",
    "deal.companies.name",
  ],
  owner: ["owner.full_name", "owner.avatar_url"],
} as const;
