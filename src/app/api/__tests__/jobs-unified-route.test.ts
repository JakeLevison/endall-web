/**
 * Tests for GET /api/jobs/unified (bridge proxy).
 *
 * Pattern mirrors day-plans-routes.test.ts: tenant resolution mocked at
 * @/lib/tenant-server, fetch stubbed per case.
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

describe("GET /api/jobs/unified", () => {
  it("returns 403 when session is unresolved", async () => {
    mockResolution = { ok: false, code: "NO_SESSION" };
    const { GET } = await import("../jobs/unified/route");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest("http://localhost/api/jobs/unified");
    const res = await GET(req);
    expect(res.status).toBe(403);
  });

  it("forwards X-Tenant-Id and query params to the bridge", async () => {
    const fetchSpy =
      vi.fn<(input: URL | string, init?: RequestInit) => Promise<Response>>();
    fetchSpy.mockResolvedValue(
      new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchSpy);
    const { GET } = await import("../jobs/unified/route");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest(
      "http://localhost/api/jobs/unified?days=14&foo=bar",
    );
    const res = await GET(req);
    expect(res.status).toBe(200);
    const calledUrl = fetchSpy.mock.calls[0][0];
    const urlStr =
      typeof calledUrl === "string" ? calledUrl : calledUrl.toString();
    expect(urlStr).toContain("/jobs/unified");
    expect(urlStr).toContain("days=14");
    expect(urlStr).toContain("foo=bar");
    const init = fetchSpy.mock.calls[0][1];
    const headers = (init?.headers ?? {}) as Record<string, string>;
    expect(headers["X-Tenant-Id"]).toBe("ten-abc");
  });

  it("surfaces non-200 bridge status verbatim", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify({ detail: "nope" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }),
      ),
    );
    const { GET } = await import("../jobs/unified/route");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest("http://localhost/api/jobs/unified");
    const res = await GET(req);
    expect(res.status).toBe(404);
  });

  it("returns 502 on bridge unavailability", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("ECONNREFUSED");
      }),
    );
    const { GET } = await import("../jobs/unified/route");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest("http://localhost/api/jobs/unified");
    const res = await GET(req);
    expect(res.status).toBe(502);
  });
});
