/**
 * CSV Import/Export Pipeline
 *
 * Handles bulk contact/company import with:
 * - Column mapping (CSV header → CRM field)
 * - Dedup checking (match on email/domain)
 * - Batch insert with error collection
 * - Export to CSV with custom column selection
 */

import { SupabaseClient } from "@supabase/supabase-js";

// ---- CSV Parsing ----

export function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };

  const headers = parseLine(lines[0]);
  const rows = lines.slice(1).map((line) => {
    const values = parseLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = values[i] || "";
    });
    return row;
  });

  return { headers, rows };
}

function parseLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

// ---- Column Mapping ----

export type ColumnMapping = {
  csvColumn: string;
  crmField: string;
}[];

export const CONTACT_FIELDS = [
  { value: "first_name", label: "First Name" },
  { value: "last_name", label: "Last Name" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "lifecycle_stage", label: "Lifecycle Stage" },
  { value: "owner", label: "Owner" },
  { value: "__skip", label: "Skip this column" },
] as const;

export const COMPANY_FIELDS = [
  { value: "name", label: "Company Name" },
  { value: "domain", label: "Domain" },
  { value: "industry", label: "Industry" },
  { value: "size", label: "Size" },
  { value: "website", label: "Website" },
  { value: "city", label: "City" },
  { value: "state", label: "State" },
  { value: "country", label: "Country" },
  { value: "owner", label: "Owner" },
  { value: "__skip", label: "Skip this column" },
] as const;

// ---- Import ----

export type ImportResult = {
  created: number;
  updated: number;
  skipped: number;
  errors: { row: number; message: string }[];
};

export async function importContacts(
  supabase: SupabaseClient,
  tenantId: string,
  rows: Record<string, string>[],
  mapping: ColumnMapping
): Promise<ImportResult> {
  const result: ImportResult = { created: 0, updated: 0, skipped: 0, errors: [] };

  for (let i = 0; i < rows.length; i++) {
    const csvRow = rows[i];
    const record: Record<string, unknown> = { tenant_id: tenantId };

    for (const map of mapping) {
      if (map.crmField === "__skip") continue;
      record[map.crmField] = csvRow[map.csvColumn]?.trim() || null;
    }

    if (!record.email && !record.first_name) {
      result.errors.push({ row: i + 2, message: "Missing email and name" });
      continue;
    }

    // Dedup: check if email already exists
    if (record.email) {
      const { data: existing } = await supabase
        .from("contacts")
        .select("id")
        .eq("tenant_id", tenantId)
        .eq("email", record.email)
        .is("merged_into", null)
        .limit(1);

      if (existing?.length) {
        // Update existing
        const { error } = await supabase
          .from("contacts")
          .update(record)
          .eq("id", existing[0].id);
        if (error) {
          result.errors.push({ row: i + 2, message: error.message });
        } else {
          result.updated++;
        }
        continue;
      }
    }

    // Insert new
    const { error } = await supabase.from("contacts").insert(record);
    if (error) {
      result.errors.push({ row: i + 2, message: error.message });
    } else {
      result.created++;
    }
  }

  return result;
}

// ---- Export ----

export function toCSV(
  records: Record<string, unknown>[],
  columns: string[]
): string {
  const header = columns.join(",");
  const rows = records.map((r) =>
    columns
      .map((col) => {
        const val = r[col];
        if (val == null) return "";
        const str = String(val);
        return str.includes(",") || str.includes('"') || str.includes("\n")
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      })
      .join(",")
  );
  return [header, ...rows].join("\n");
}
