// Outreach prospect field mapping helpers.
//
// The DB stores `tier` as INT (1=highest, 3=lowest) but the UI renders priority
// as letters ("A" | "B" | "C"). Mapping: tier 1 -> "A", tier 2 -> "B",
// anything else (including 3, null, undefined, out-of-range) -> "C".
// Source schema: deploy/ask-endall-bridge/migrations/022_outreach.sql.

export type PriorityLetter = "A" | "B" | "C";

export type Prospect = {
  id: string;
  company_name: string;
  contact_name: string;
  contact_title: string;
  contact_email: string;
  contact_phone: string;
  city: string;
  state: string;
  priority: PriorityLetter;
  status: string;
  last_contacted_at: string | null;
  next_followup_at: string | null;
  notes: string;
};

export function tierToPriorityLetter(
  tier: number | null | undefined
): PriorityLetter {
  if (tier === 1) return "A";
  if (tier === 2) return "B";
  return "C";
}

export function priorityLetterToTier(letter: PriorityLetter): number {
  if (letter === "A") return 1;
  if (letter === "B") return 2;
  return 3;
}

export function mapProspectRow(row: Record<string, unknown>): Prospect {
  return {
    id: row.id as string,
    company_name: (row.company_name as string) || "",
    contact_name: (row.contact_name as string) || "",
    contact_title: (row.contact_title as string) || "",
    contact_email: (row.contact_email as string) || "",
    contact_phone: (row.contact_phone as string) || "",
    city: (row.city as string) || "",
    state: (row.state as string) || "",
    priority: tierToPriorityLetter(
      typeof row.tier === "number" ? (row.tier as number) : null
    ),
    status: (row.status as string) || "new",
    last_contacted_at: (row.last_contacted_at as string | null) ?? null,
    next_followup_at: (row.next_followup_at as string | null) ?? null,
    notes: (row.notes as string) || "",
  };
}
