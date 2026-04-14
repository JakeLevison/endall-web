import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const SRC = readFileSync(
  path.resolve(__dirname, "../ValuePropSection.tsx"),
  "utf8"
);

describe("ValuePropSection — GTM reorder + savings copy", () => {
  it("bookkeeper card appears before office manager card", () => {
    const bookkeeperIdx = SRC.indexOf("Your bookkeeper");
    const officeIdx = SRC.indexOf("Your office manager");
    expect(bookkeeperIdx).toBeGreaterThan(-1);
    expect(officeIdx).toBeGreaterThan(-1);
    expect(bookkeeperIdx).toBeLessThan(officeIdx);
  });

  it("summary line names a concrete dollar or time saving", () => {
    expect(SRC).toMatch(/\$170K a year/);
    expect(SRC).toMatch(/30\+ hours a week/);
  });

  it("does not contain the old one-AI-team framing", () => {
    expect(SRC).not.toMatch(/One AI ops team\. A fraction of the cost\./);
  });

  it("uses no em dashes or banned copy", () => {
    expect(SRC).not.toMatch(/—/);
    expect(SRC).not.toMatch(/\bsoftware\b/i);
    expect(SRC).not.toMatch(/\bhandl(e|es|ing)\b/i);
  });
});
