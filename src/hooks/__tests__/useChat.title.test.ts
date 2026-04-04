import { describe, it, expect } from "vitest";
import { generateConversationTitle } from "../useChat";

describe("generateConversationTitle", () => {
  it("names preset actions after the action + date", () => {
    const title = generateConversationTitle("financial_model", "");
    expect(title).toMatch(/^Financial Model — /);
  });

  it("names budget action correctly", () => {
    const title = generateConversationTitle("generate_budget", "");
    expect(title).toMatch(/^Budget — /);
  });

  it("names all 8 preset actions", () => {
    const actions = [
      ["financial_model", "Financial Model"],
      ["generate_budget", "Budget"],
      ["npv_analysis", "NPV Analysis"],
      ["project_estimate", "Project Estimate"],
      ["proposal", "Proposal"],
      ["competitive_analysis", "Competitive Analysis"],
      ["review_financials", "Review Financials"],
      ["capabilities_doc", "Capabilities Doc"],
    ] as const;

    for (const [id, expected] of actions) {
      const title = generateConversationTitle(id, "");
      expect(title).toMatch(new RegExp(`^${expected} — `));
    }
  });

  it("uses first 40 chars for custom messages", () => {
    const title = generateConversationTitle(undefined, "What's my projected revenue for Q3 based on current pipeline?");
    expect(title).toBe("What's my projected revenue for Q3 based");
    expect(title.length).toBeLessThanOrEqual(40);
  });

  it("falls back to Chat + date when no action and no text", () => {
    const title = generateConversationTitle(undefined, "");
    expect(title).toMatch(/^Chat — /);
  });

  it("includes date for preset actions", () => {
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const title = generateConversationTitle("npv_analysis", "");
    expect(title).toBe(`NPV Analysis — ${dateStr}`);
  });
});
