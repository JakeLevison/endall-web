import { describe, it, expect } from "vitest";
import { parseTenantSlug, isTenantHost } from "../subdomain";

describe("parseTenantSlug", () => {
  it("returns null for null / empty / undefined hosts", () => {
    expect(parseTenantSlug(null)).toBeNull();
    expect(parseTenantSlug(undefined)).toBeNull();
    expect(parseTenantSlug("")).toBeNull();
  });

  it("returns null for endall.ai (root or any subdomain)", () => {
    expect(parseTenantSlug("endall.ai")).toBeNull();
    expect(parseTenantSlug("www.endall.ai")).toBeNull();
    expect(parseTenantSlug("demo.endall.ai")).toBeNull();
  });

  it("returns null for endall.app root", () => {
    expect(parseTenantSlug("endall.app")).toBeNull();
  });

  it("returns null for reserved subdomains", () => {
    expect(parseTenantSlug("www.endall.app")).toBeNull();
    expect(parseTenantSlug("api.endall.app")).toBeNull();
    expect(parseTenantSlug("admin.endall.app")).toBeNull();
    expect(parseTenantSlug("staging.endall.app")).toBeNull();
  });

  it("returns the slug for a valid kebab-case tenant", () => {
    expect(parseTenantSlug("cornerstone-mep.endall.app")).toBe("cornerstone-mep");
    expect(parseTenantSlug("alpha.endall.app")).toBe("alpha");
    expect(parseTenantSlug("tenant-123.endall.app")).toBe("tenant-123");
  });

  it("strips the port before matching", () => {
    expect(parseTenantSlug("acme.endall.app:443")).toBe("acme");
  });

  it("is case-insensitive on the host but returns lowercase", () => {
    expect(parseTenantSlug("Acme.Endall.App")).toBe("acme");
  });

  it("rejects multi-level subdomains", () => {
    expect(parseTenantSlug("a.b.endall.app")).toBeNull();
  });

  it("rejects slugs with leading/trailing hyphens or uppercase", () => {
    expect(parseTenantSlug("-acme.endall.app")).toBeNull();
    expect(parseTenantSlug("acme-.endall.app")).toBeNull();
    // Uppercase is folded to lowercase by the parser and then validated;
    // pure alphanumeric uppercase -> valid slug after folding.
    expect(parseTenantSlug("ACME.endall.app")).toBe("acme");
  });

  it("rejects unrelated hostnames", () => {
    expect(parseTenantSlug("vercel.app")).toBeNull();
    expect(parseTenantSlug("example.com")).toBeNull();
    expect(parseTenantSlug("acme.example.com")).toBeNull();
  });
});

describe("isTenantHost", () => {
  it("returns true when parseTenantSlug returns a slug", () => {
    expect(isTenantHost("cornerstone-mep.endall.app")).toBe(true);
  });

  it("returns false for marketing and reserved hosts", () => {
    expect(isTenantHost("endall.ai")).toBe(false);
    expect(isTenantHost("www.endall.app")).toBe(false);
    expect(isTenantHost("endall.app")).toBe(false);
  });
});
