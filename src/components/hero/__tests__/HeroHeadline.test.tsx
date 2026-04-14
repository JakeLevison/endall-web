import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const SRC = readFileSync(
  path.resolve(__dirname, "../HeroHeadline.tsx"),
  "utf8"
);

describe("HeroHeadline — GTM savings-first rewrite", () => {
  it("has no rotating pain-word animation", () => {
    expect(SRC).not.toMatch(/cycle-words-px/);
    expect(SRC).not.toMatch(/const words\s*=/);
  });

  it("headline is savings-first", () => {
    expect(SRC).toMatch(/Save 90% on your back office/);
  });

  it("alternate candidates preserved for swap-in", () => {
    expect(SRC).toMatch(/Alt A:/);
    expect(SRC).toMatch(/Alt B:/);
  });

  it("contains no em dash, no 'software', no 'handles'", () => {
    expect(SRC).not.toMatch(/—/);
    expect(SRC).not.toMatch(/\bsoftware\b/i);
    expect(SRC).not.toMatch(/\bhandl(e|es|ing)\b/i);
  });
});
