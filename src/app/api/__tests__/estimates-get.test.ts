/**
 * Tests for:
 *   GET /api/estimates/[id]   (single-estimate read proxy)
 *
 * Mirrors src/app/api/__tests__/estimates-send-confirm.test.ts.
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

describe("GET /api/estimates/[id]", () => {
  it("returns 403 when session is unresolved", async () => {
    mockResolution = { ok: false, code: "NO_SESSION" };
    const { GET } = await import("../estimates/[id]/route");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest("http://localhost/api/estimates/est-1");
    const res = await GET(req, {
      params: Promise.resolve({ id: "est-1" }),
    });
    expect(res.status).toBe(403);
  });

  it("proxies a 200 response from the bridge with the estimate body", async () => {
    const fixture = {
      id: "est-1",
      estimate_number: "EST-2026-0001",
      grand_total: 5295,
      line_items: [],
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

    const { GET } = await import("../estimates/[id]/route");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest("http://localhost/api/estimates/est-1");
    const res = await GET(req, {
      params: Promise.resolve({ id: "est-1" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe("est-1");
    expect(body.estimate_number).toBe("EST-2026-0001");
  });

  it("forwards a 404 from the bridge unchanged", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce(
        new Response(JSON.stringify({ detail: "estimate not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    const { GET } = await import("../estimates/[id]/route");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest("http://localhost/api/estimates/missing");
    const res = await GET(req, {
      params: Promise.resolve({ id: "missing" }),
    });
    expect(res.status).toBe(404);
  });

  it("sends X-Tenant-Id header and encodes the id into the bridge URL", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      new Response("{}", { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { GET } = await import("../estimates/[id]/route");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest(
      "http://localhost/api/estimates/abc%2F123",
    );
    // Path param with a slash exercises both UUID-style ids and the
    // encodeURIComponent guard that prevents path traversal into the
    // bridge URL space.
    await GET(req, { params: Promise.resolve({ id: "abc/123" }) });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const calledUrl = fetchMock.mock.calls[0][0] as URL | string;
    const urlString = calledUrl.toString();
    expect(urlString).toBe("http://bridge.test/estimates/abc%2F123");

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    const headers = init.headers as Record<string, string>;
    expect(headers["X-Tenant-Id"]).toBe("ten-abc");
  });

  it("returns 502 when the bridge is unreachable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValueOnce(new Error("ECONNREFUSED")),
    );
    const { GET } = await import("../estimates/[id]/route");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest("http://localhost/api/estimates/est-1");
    const res = await GET(req, {
      params: Promise.resolve({ id: "est-1" }),
    });
    expect(res.status).toBe(502);
  });
});
