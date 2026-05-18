/**
 * Tests for PATCH /api/quickbooks/auto-push (bridge proxy).
 *
 * Fast-follow to PR #67: auto-push had the same raw string interpolation
 * (`${bridgeUrl}/integrations/...`) that 502s when ASK_ENDALL_BRIDGE_URL
 * carries a trailing slash/whitespace. This is the most demo-critical
 * route — it fires on invoice creation when QB auto-push is ON. Pins the
 * normalized URL output and that a URL object reaches fetch.
 *
 * Pattern mirrors quickbooks-status-route.test.ts.
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

function patchReq(body: unknown) {
  return new Request("http://localhost/api/quickbooks/auto-push", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  mockResolution = { ok: true, tenant_id: "ten-abc", user_id: "u1" };
  vi.stubEnv("ASK_ENDALL_ADMIN_KEY", "admin-secret");
});

describe("PATCH /api/quickbooks/auto-push", () => {
  it("builds a normalized bridge URL even when the env value has a trailing slash", async () => {
    vi.stubEnv("ASK_ENDALL_BRIDGE_URL", "http://bridge.test/");
    const fetchSpy =
      vi.fn<(input: URL | string, init?: RequestInit) => Promise<Response>>();
    fetchSpy.mockResolvedValue(
      new Response(JSON.stringify({ auto_push_enabled: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchSpy);

    const { PATCH } = await import("../quickbooks/auto-push/route");
    const res = await PATCH(
      patchReq({ enabled: true }) as unknown as Parameters<typeof PATCH>[0],
    );
    expect(res.status).toBe(200);

    const calledUrl = fetchSpy.mock.calls[0][0];
    // A URL object (not a hand-built string) must reach fetch — the
    // mechanism that normalizes the env value and prevents a revert.
    expect(calledUrl).toBeInstanceOf(URL);
    const urlStr =
      typeof calledUrl === "string" ? calledUrl : calledUrl.toString();
    expect(urlStr).not.toContain("//integrations");
    expect(urlStr).toContain("/integrations/quickbooks/auto-push");
    // Headers (admin key, tenant, body) must be preserved.
    const init = fetchSpy.mock.calls[0][1];
    const headers = (init?.headers ?? {}) as Record<string, string>;
    expect(headers["X-Admin-Key"]).toBe("admin-secret");
    expect(headers["X-Tenant-Id"]).toBe("ten-abc");
    expect(String(init?.body)).toContain("true");
  });

  it("returns 403 when session is unresolved", async () => {
    vi.stubEnv("ASK_ENDALL_BRIDGE_URL", "http://bridge.test");
    mockResolution = { ok: false, code: "NO_SESSION" };
    const { PATCH } = await import("../quickbooks/auto-push/route");
    const res = await PATCH(
      patchReq({ enabled: true }) as unknown as Parameters<typeof PATCH>[0],
    );
    expect(res.status).toBe(403);
  });

  it("returns 500 when the server admin key is not configured", async () => {
    vi.stubEnv("ASK_ENDALL_BRIDGE_URL", "http://bridge.test");
    vi.stubEnv("ASK_ENDALL_ADMIN_KEY", "");
    const { PATCH } = await import("../quickbooks/auto-push/route");
    const res = await PATCH(
      patchReq({ enabled: true }) as unknown as Parameters<typeof PATCH>[0],
    );
    expect(res.status).toBe(500);
  });

  it("surfaces a non-200 bridge status verbatim (not 502)", async () => {
    vi.stubEnv("ASK_ENDALL_BRIDGE_URL", "http://bridge.test");
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify({ detail: "nope" }), {
            status: 409,
            headers: { "Content-Type": "application/json" },
          }),
      ),
    );
    const { PATCH } = await import("../quickbooks/auto-push/route");
    const res = await PATCH(
      patchReq({ enabled: false }) as unknown as Parameters<typeof PATCH>[0],
    );
    expect(res.status).toBe(409);
  });

  it("returns 502 only on genuine bridge unavailability", async () => {
    vi.stubEnv("ASK_ENDALL_BRIDGE_URL", "http://bridge.test");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("ECONNREFUSED");
      }),
    );
    const { PATCH } = await import("../quickbooks/auto-push/route");
    const res = await PATCH(
      patchReq({ enabled: true }) as unknown as Parameters<typeof PATCH>[0],
    );
    expect(res.status).toBe(502);
  });
});
