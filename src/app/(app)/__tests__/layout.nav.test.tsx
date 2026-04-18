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

  it("includes a Dispatch link pointing to /dispatch", () => {
    expect(source).toMatch(/href:\s*"\/dispatch"/);
    expect(source).toMatch(/label:\s*"Dispatch"/);
  });
});
