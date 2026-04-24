import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

describe("App layout navigation", () => {
  const source = readFileSync(
    path.resolve(__dirname, "../layout.tsx"),
    "utf8"
  );

  it("includes a Command Center link pointing to /command-center", () => {
    expect(source).toMatch(/href:\s*"\/command-center"/);
    expect(source).toMatch(/label:\s*"Command Center"/);
  });

  it("includes an Invoice review link pointing to /invoice-review", () => {
    expect(source).toMatch(/href:\s*"\/invoice-review"/);
    expect(source).toMatch(/label:\s*"Invoice review"/);
  });

  it("includes a disabled Dispatch nav slot with a Coming with D2 tooltip", () => {
    expect(source).toMatch(/href:\s*"\/dispatch"/);
    expect(source).toMatch(/label:\s*"Dispatch"/);
    expect(source).toMatch(/disabled:\s*true/);
    expect(source).toMatch(/tooltip:\s*"Coming with D2"/);
  });
});
