import { describe, it, expect } from "vitest";
import {
  tierToPriorityLetter,
  priorityLetterToTier,
  mapProspectRow,
} from "@/lib/outreach";

describe("tierToPriorityLetter", () => {
  it("maps tier 1 to A", () => {
    expect(tierToPriorityLetter(1)).toBe("A");
  });

  it("maps tier 2 to B", () => {
    expect(tierToPriorityLetter(2)).toBe("B");
  });

  it("maps tier 3 to C", () => {
    expect(tierToPriorityLetter(3)).toBe("C");
  });

  it("treats null and undefined as C", () => {
    expect(tierToPriorityLetter(null)).toBe("C");
    expect(tierToPriorityLetter(undefined)).toBe("C");
  });

  it("treats out-of-range tiers as C", () => {
    expect(tierToPriorityLetter(0)).toBe("C");
    expect(tierToPriorityLetter(4)).toBe("C");
    expect(tierToPriorityLetter(99)).toBe("C");
  });
});

describe("priorityLetterToTier", () => {
  it("round-trips with tierToPriorityLetter for A/B/C", () => {
    expect(tierToPriorityLetter(priorityLetterToTier("A"))).toBe("A");
    expect(tierToPriorityLetter(priorityLetterToTier("B"))).toBe("B");
    expect(tierToPriorityLetter(priorityLetterToTier("C"))).toBe("C");
  });
});

describe("mapProspectRow", () => {
  it("reads the renamed DB columns into the frontend Prospect shape", () => {
    const row = {
      id: "abc",
      company_name: "Greenleaf Mechanical",
      contact_name: "Jane Doe",
      contact_title: "Owner",
      contact_email: "jane@greenleaf.com",
      contact_phone: "555-555-5555",
      city: "Austin",
      state: "TX",
      tier: 1,
      status: "contacted",
      last_contacted_at: "2026-05-01T12:00:00Z",
      next_followup_at: "2026-05-08T12:00:00Z",
      notes: "Interested in commercial expansion.",
    };

    const prospect = mapProspectRow(row);

    expect(prospect.id).toBe("abc");
    expect(prospect.contact_email).toBe("jane@greenleaf.com");
    expect(prospect.contact_phone).toBe("555-555-5555");
    expect(prospect.last_contacted_at).toBe("2026-05-01T12:00:00Z");
    expect(prospect.next_followup_at).toBe("2026-05-08T12:00:00Z");
    expect(prospect.priority).toBe("A");
    expect(prospect.status).toBe("contacted");
    expect(prospect.notes).toBe("Interested in commercial expansion.");
  });

  it("defaults missing fields to safe values", () => {
    const prospect = mapProspectRow({ id: "row-1" });
    expect(prospect.contact_email).toBe("");
    expect(prospect.contact_phone).toBe("");
    expect(prospect.last_contacted_at).toBeNull();
    expect(prospect.next_followup_at).toBeNull();
    expect(prospect.priority).toBe("C");
    expect(prospect.status).toBe("new");
  });

  it("does not read the legacy column names", () => {
    const row = {
      id: "row-2",
      email: "legacy@example.com",
      phone: "555-000-0000",
      last_contacted: "2026-05-01T12:00:00Z",
      next_follow_up: "2026-05-08T12:00:00Z",
      priority: "A",
    };
    const prospect = mapProspectRow(row);
    expect(prospect.contact_email).toBe("");
    expect(prospect.contact_phone).toBe("");
    expect(prospect.last_contacted_at).toBeNull();
    expect(prospect.next_followup_at).toBeNull();
    expect(prospect.priority).toBe("C");
  });
});
