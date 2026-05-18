/**
 * Tests for GET /api/quickbooks/status (bridge proxy).
 *
 * Regression: the QuickBooksTile on /settings reported
 * "status request failed (502)". Root cause was raw string interpolation
 * `${bridgeUrl}/integrations/...` — a trailing slash or surrounding
 * whitespace in ASK_ENDALL_BRIDGE_URL became an interior URL malformation
 * (e.g. a double slash) that the bridge 404s / fetch rejects. The working
 * sibling routes (gmail/status, quickbooks/authorize) build the URL with
 * `new URL()` + url.pathname + url.searchParams, which the WHATWG URL
 * parser normalizes. This pins that behavior.
 *
 * Pattern mirrors jobs-unified-route.test.ts.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

let mockResolution:
  | { ok: true; tenant_id: string; user_id: string }
  | { ok: false; code: "NO_SESSION" | "NO_TENANT_MEMBERSHIP" } = {
  ok: false,
  code: "NO_SESSION",
};

vi.mock("@/lib/tenant-server", async () => {
  const actual =
    await vi.importActual<typeof import("@/lib/tenant-server")>(
      "@/lib/tenant-server",
    );
  return {
    ...actual,
    resolveTenantFromSession: vi.fn(async () => mockResolution),
  };
});

beforeEach(() => {
  mockResolution = { ok: true, tenant_id: "ten-abc", user_id: "u1" };
  vi.stubEnv("ASK_ENDALL_ADMIN_KEY", "admin-secret");
});

describe("GET /api/quickbooks/status", () => {
  it("builds a normalized bridge URL even when the env value has a trailing slash", async () => {
    vi.stubEnv("ASK_ENDALL_BRIDGE_URL", "http://bridge.test/");
    const fetchSpy =
      vi.fn<(input: URL | string, init?: RequestInit) => Promise<Response>>();
    fetchSpy.mockResolvedValue(
      new Response(JSON.stringify({ connected: false }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchSpy);

    const { GET } = await import("../quickbooks/status/route");
    const res = await GET();
    expect(res.status).toBe(200);

    const calledUrl = fetchSpy.mock.calls[0][0];
    const urlStr =
      typeof calledUrl === "string" ? calledUrl : calledUrl.toString();
    // No double slash before the path segment.
    expect(urlStr).not.toContain("//integrations");
    expect(urlStr).toContain("/integrations/quickbooks/status");
    expect(urlStr).toContain("tenant_id=ten-abc");
    expect(urlStr).toContain("admin_key=admin-secret");
  });

  it("returns 403 when session is unresolved", async () => {
    vi.stubEnv("ASK_ENDALL_BRIDGE_URL", "http://bridge.test");
    mockResolution = { ok: false, code: "NO_SESSION" };
    const { GET } = await import("../quickbooks/status/route");
    const res = await GET();
    expect(res.status).toBe(403);
  });

  it("surfaces a non-200 bridge status verbatim (not 502)", async () => {
    vi.stubEnv("ASK_ENDALL_BRIDGE_URL", "http://bridge.test");
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify({ detail: "invalid admin key" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }),
      ),
    );
    const { GET } = await import("../quickbooks/status/route");
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns 502 only on genuine bridge unavailability", async () => {
    vi.stubEnv("ASK_ENDALL_BRIDGE_URL", "http://bridge.test");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("ECONNREFUSED");
      }),
    );
    const { GET } = await import("../quickbooks/status/route");
    const res = await GET();
    expect(res.status).toBe(502);
  });
});
