import { describe, it, expect } from "vitest";
import { normalizePhone } from "../normalize-phone";

describe("normalizePhone", () => {
  it("returns empty for null, undefined, empty, or all-symbol input", () => {
    expect(normalizePhone(null)).toBe("");
    expect(normalizePhone(undefined)).toBe("");
    expect(normalizePhone("")).toBe("");
    expect(normalizePhone("()- ")).toBe("");
  });

  it("prefixes 10-digit US numbers with +1", () => {
    expect(normalizePhone("(555) 123-4567")).toBe("+15551234567");
    expect(normalizePhone("555.123.4567")).toBe("+15551234567");
    expect(normalizePhone("5551234567")).toBe("+15551234567");
  });

  it("keeps 11-digit numbers starting with 1 as +1XXXXXXXXXX", () => {
    expect(normalizePhone("1-555-123-4567")).toBe("+15551234567");
    expect(normalizePhone("+1 (555) 123-4567")).toBe("+15551234567");
  });

  it("treats other lengths as international and adds a leading +", () => {
    expect(normalizePhone("+44 20 7946 0958")).toBe("+442079460958");
    expect(normalizePhone("020 7946 0958")).toBe("+02079460958");
  });

  it("ignores whitespace and punctuation", () => {
    expect(normalizePhone("  +1 (555)  123 - 4567  ")).toBe("+15551234567");
  });
});
