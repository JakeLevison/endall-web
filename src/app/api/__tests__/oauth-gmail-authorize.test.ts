/**
 * Unit tests for GET /api/oauth/gmail/authorize. The proxy fetches the
 * bridge's `/integrations/gmail/authorize` (R2-8c JSON contract) with
 * `X-Admin-Key` server-side and returns `{ auth_url }` to the client.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const resolveTenantMock =
  vi.fn<
    () => Promise<
      | { ok: true; tenant_id: string; user_id: string }
      | { ok: false; code: "NO_SESSION" | "NO_TENANT_MEMBERSHIP" }
    >
  >();

vi.mock("@/lib/tenant-server", async () => {
  const actual = (await vi.importActual("@/lib/tenant-server")) as Record<
    string,
    unknown
  >;
  return {
    ...actual,
    resolveTenantFromSession: resolveTenantMock,
  };
});

beforeEach(() => {
  resolveTenantMock.mockReset();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.stubEnv("ASK_ENDALL_BRIDGE_URL", "http://bridge.test");
  vi.stubEnv("ASK_ENDALL_ADMIN_KEY", "test-admin-key");
});

describe("GET /api/oauth/gmail/authorize", () => {
  it("returns 500 when ASK_ENDALL_ADMIN_KEY is missing", async () => {
    vi.stubEnv("ASK_ENDALL_ADMIN_KEY", "");
    const { GET } = await import("../oauth/gmail/authorize/route");
    const res = await GET();
    expect(res.status).toBe(500);
  });

  it("returns 403 when the session does not resolve to a tenant", async () => {
    resolveTenantMock.mockResolvedValueOnce({
      ok: false,
      code: "NO_SESSION",
    });
    const { GET } = await import("../oauth/gmail/authorize/route");
    const res = await GET();
    expect(res.status).toBe(403);
  });

  it("sends X-Admin-Key header (never admin_key in URL) and returns auth_url", async () => {
    resolveTenantMock.mockResolvedValueOnce({
      ok: true,
      tenant_id: "ten-1",
      user_id: "u-1",
    });
    const fetchSpy = vi.fn().mockResolvedValueOnce(
      new Response(
        JSON.stringify({ auth_url: "https://accounts.google.test/oauth?s=1" }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchSpy);

    const { GET } = await import("../oauth/gmail/authorize/route");
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({
      auth_url: "https://accounts.google.test/oauth?s=1",
    });

    const calledUrl = fetchSpy.mock.calls[0][0] as URL;
    const init = fetchSpy.mock.calls[0][1] as RequestInit;
    expect(calledUrl.toString()).not.toContain("admin_key");
    expect(calledUrl.searchParams.get("tenant_id")).toBe("ten-1");
    expect((init.headers as Record<string, string>)["X-Admin-Key"]).toBe(
      "test-admin-key",
    );
    // admin_key must never leave the proxy in either direction.
    expect(JSON.stringify(body)).not.toContain("test-admin-key");
  });

  it("returns 502 when the bridge fetch throws", async () => {
    resolveTenantMock.mockResolvedValueOnce({
      ok: true,
      tenant_id: "ten-1",
      user_id: "u-1",
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValueOnce(new Error("ECONNREFUSED")),
    );
    const { GET } = await import("../oauth/gmail/authorize/route");
    const res = await GET();
    expect(res.status).toBe(502);
  });

  it("returns 502 when the bridge response omits auth_url", async () => {
    resolveTenantMock.mockResolvedValueOnce({
      ok: true,
      tenant_id: "ten-1",
      user_id: "u-1",
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce(
        new Response(JSON.stringify({}), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );
    const { GET } = await import("../oauth/gmail/authorize/route");
    const res = await GET();
    expect(res.status).toBe(502);
  });

  it("returns 502 when the bridge returns a non-2xx", async () => {
    resolveTenantMock.mockResolvedValueOnce({
      ok: true,
      tenant_id: "ten-1",
      user_id: "u-1",
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "bad admin key" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );
    const { GET } = await import("../oauth/gmail/authorize/route");
    const res = await GET();
    expect(res.status).toBe(502);
  });
});
