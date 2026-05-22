/**
 * Tests for:
 *   POST /api/intelligence/competitive-intel/refresh
 *   POST /api/intelligence/competitive-brief/send
 *
 * Both bridge endpoints embed tenant_id in the URL path. The proxies must
 * resolve tenant from session and substitute it into the bridge path,
 * not trust a client-provided value.
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

describe("POST /api/intelligence/competitive-intel/refresh", () => {
  it("returns 403 when session is unresolved", async () => {
    mockResolution = { ok: false, code: "NO_SESSION" };
    const { POST } = await import(
      "../intelligence/competitive-intel/refresh/route"
    );
    const res = await POST();
    expect(res.status).toBe(403);
  });

  it("targets the bridge refresh path with the session tenant_id embedded", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ status: "accepted" }), { status: 202 }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const { POST } = await import(
      "../intelligence/competitive-intel/refresh/route"
    );
    const res = await POST();

    expect(res.status).toBe(202);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const calledUrl = fetchMock.mock.calls[0][0] as URL | string;
    expect(calledUrl.toString()).toBe(
      "http://bridge.test/intelligence/competitive-intel/ten-abc/refresh",
    );

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(init.method).toBe("POST");
    const headers = init.headers as Record<string, string>;
    expect(headers["X-Tenant-Id"]).toBe("ten-abc");
  });

  it("returns 502 when the bridge is unreachable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValueOnce(new Error("ECONNREFUSED")),
    );
    const { POST } = await import(
      "../intelligence/competitive-intel/refresh/route"
    );
    const res = await POST();
    expect(res.status).toBe(502);
  });
});

describe("POST /api/intelligence/competitive-brief/send", () => {
  it("returns 403 when session is unresolved", async () => {
    mockResolution = { ok: false, code: "NO_SESSION" };
    const { POST } = await import(
      "../intelligence/competitive-brief/send/route"
    );
    const res = await POST();
    expect(res.status).toBe(403);
  });

  it("targets the bridge brief path with the session tenant_id embedded", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ sent: true, recipient: "ops@example.com" }),
          { status: 200 },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    const { POST } = await import(
      "../intelligence/competitive-brief/send/route"
    );
    const res = await POST();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.sent).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const calledUrl = fetchMock.mock.calls[0][0] as URL | string;
    expect(calledUrl.toString()).toBe(
      "http://bridge.test/intelligence/competitive-brief/ten-abc/send",
    );

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(init.method).toBe("POST");
    const headers = init.headers as Record<string, string>;
    expect(headers["X-Tenant-Id"]).toBe("ten-abc");
  });

  it("returns 502 when the bridge is unreachable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValueOnce(new Error("ECONNREFUSED")),
    );
    const { POST } = await import(
      "../intelligence/competitive-brief/send/route"
    );
    const res = await POST();
    expect(res.status).toBe(502);
  });
});
