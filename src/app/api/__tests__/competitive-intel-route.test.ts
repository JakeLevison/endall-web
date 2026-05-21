/**
 * Tests for:
 *   GET /api/intelligence/competitive-intel
 *
 * Bridge embeds tenant_id in the URL path (unlike most endpoints which
 * read X-Tenant-Id from headers). The proxy must resolve tenant from
 * session and substitute it into the bridge path, not trust a
 * client-provided value.
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
  vi.stubEnv("ASK_ENDALL_BRIDGE_URL", "http://bridge.test");
});

describe("GET /api/intelligence/competitive-intel", () => {
  it("returns 403 when session is unresolved", async () => {
    mockResolution = { ok: false, code: "NO_SESSION" };
    const { GET } = await import(
      "../intelligence/competitive-intel/route"
    );
    const res = await GET();
    expect(res.status).toBe(403);
  });

  it("proxies a 200 response from the bridge", async () => {
    const fixture = {
      competitors: [{ name: "Acme Electric", city: "Ashburn" }],
      total: 1,
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce(
        new Response(JSON.stringify(fixture), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );
    const { GET } = await import(
      "../intelligence/competitive-intel/route"
    );
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(1);
    expect(body.competitors[0].name).toBe("Acme Electric");
  });

  it("targets the bridge path with the session tenant_id embedded", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const { GET } = await import(
      "../intelligence/competitive-intel/route"
    );
    await GET();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const calledUrl = fetchMock.mock.calls[0][0] as URL | string;
    expect(calledUrl.toString()).toBe(
      "http://bridge.test/intelligence/competitive-intel/ten-abc",
    );

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    const headers = init.headers as Record<string, string>;
    expect(headers["X-Tenant-Id"]).toBe("ten-abc");
  });

  it("forwards a non-2xx bridge response unchanged", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce(
        new Response(JSON.stringify({ detail: "boom" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );
    const { GET } = await import(
      "../intelligence/competitive-intel/route"
    );
    const res = await GET();
    expect(res.status).toBe(500);
  });

  it("returns 502 when the bridge is unreachable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValueOnce(new Error("ECONNREFUSED")),
    );
    const { GET } = await import(
      "../intelligence/competitive-intel/route"
    );
    const res = await GET();
    expect(res.status).toBe(502);
  });
});
