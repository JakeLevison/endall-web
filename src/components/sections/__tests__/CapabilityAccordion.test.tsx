import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const SRC = readFileSync(
  path.resolve(__dirname, "../CapabilityAccordion.tsx"),
  "utf8"
);

// Extract card ids in declaration order
function extractCardOrder(src: string): string[] {
  const matches = Array.from(src.matchAll(/id:\s*"([a-z-]+)"/g));
  return matches.map((m) => m[1]);
}

describe("CapabilityAccordion — GTM competitive intel promotion", () => {
  it("competitive intel is the second accordion card", () => {
    const ids = extractCardOrder(SRC);
    expect(ids.length).toBeGreaterThanOrEqual(6);
    expect(ids[1]).toBe("competitive-intel");
  });

  it("sales-outreach stays first", () => {
    const ids = extractCardOrder(SRC);
    expect(ids[0]).toBe("sales-outreach");
  });

  it("front desk copy uses '24/7, whatever comes up' tagline", () => {
    const frontDeskBlock = SRC.split(/id:\s*"front-desk"/)[1] || "";
    expect(frontDeskBlock).toMatch(/24\/7, whatever comes up/);
  });

  it("contains no em dashes or banned copy in card strings", () => {
    const stringLiterals = SRC.match(/"[^"]*"/g)?.join("\n") ?? "";
    expect(stringLiterals).not.toMatch(/—/);
    expect(stringLiterals).not.toMatch(/\bsoftware\b/i);
    expect(stringLiterals).not.toMatch(/\bhandl(e|es|ing)\b/i);
  });
});
