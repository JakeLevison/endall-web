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

  it("includes an enabled Dispatch nav link pointing to /dispatch", () => {
    expect(source).toMatch(/href:\s*"\/dispatch"/);
    expect(source).toMatch(/label:\s*"Dispatch"/);
    // Now that R2-9b is live, the Dispatch slot must NOT carry the
    // disabled / tooltip flags. A regression that re-disables the link
    // should fail this test.
    expect(source).not.toMatch(
      /href:\s*"\/dispatch",[\s\S]{0,120}disabled:\s*true/,
    );
    expect(source).not.toMatch(/tooltip:\s*"Coming with D2"/);
  });
});
