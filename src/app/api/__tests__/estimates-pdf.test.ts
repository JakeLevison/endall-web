/**
 * Tests for:
 *   GET /api/estimates/[id]/pdf   (binary PDF download proxy)
 *
 * Mirrors src/app/api/__tests__/estimates-get.test.ts but verifies binary
 * passthrough (Content-Disposition, Content-Type) instead of JSON shape.
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

describe("GET /api/estimates/[id]/pdf", () => {
  it("returns 403 when session is unresolved", async () => {
    mockResolution = { ok: false, code: "NO_SESSION" };
    const { GET } = await import("../estimates/[id]/pdf/route");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest("http://localhost/api/estimates/est-1/pdf");
    const res = await GET(req, {
      params: Promise.resolve({ id: "est-1" }),
    });
    expect(res.status).toBe(403);
  });

  it("streams the PDF body and preserves Content-Disposition", async () => {
    const fakePdf = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31]); // %PDF-1
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce(
        new Response(fakePdf, {
          status: 200,
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": 'attachment; filename="EST-2026-0001.pdf"',
          },
        }),
      ),
    );

    const { GET } = await import("../estimates/[id]/pdf/route");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest("http://localhost/api/estimates/est-1/pdf");
    const res = await GET(req, {
      params: Promise.resolve({ id: "est-1" }),
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/pdf");
    expect(res.headers.get("content-disposition")).toBe(
      'attachment; filename="EST-2026-0001.pdf"',
    );
    expect(res.headers.get("cache-control")).toBe("no-store");
    const buf = new Uint8Array(await res.arrayBuffer());
    expect(buf.length).toBe(fakePdf.length);
    expect(buf[0]).toBe(0x25); // '%' of '%PDF-'
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

    const { GET } = await import("../estimates/[id]/pdf/route");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest(
      "http://localhost/api/estimates/missing/pdf",
    );
    const res = await GET(req, {
      params: Promise.resolve({ id: "missing" }),
    });
    expect(res.status).toBe(404);
  });

  it("falls back to <id>.pdf filename when bridge omits Content-Disposition", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce(
        new Response(new Uint8Array([0x25, 0x50, 0x44, 0x46]), {
          status: 200,
          headers: { "Content-Type": "application/pdf" },
        }),
      ),
    );

    const { GET } = await import("../estimates/[id]/pdf/route");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest("http://localhost/api/estimates/est-7/pdf");
    const res = await GET(req, {
      params: Promise.resolve({ id: "est-7" }),
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-disposition")).toBe(
      'attachment; filename="est-7.pdf"',
    );
  });

  it("sends X-Tenant-Id header and routes to /estimates/<id>/pdf on the bridge", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      new Response(new Uint8Array([0x25, 0x50, 0x44, 0x46]), {
        status: 200,
        headers: { "Content-Type": "application/pdf" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { GET } = await import("../estimates/[id]/pdf/route");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest(
      "http://localhost/api/estimates/abc%2F123/pdf",
    );
    await GET(req, { params: Promise.resolve({ id: "abc/123" }) });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const calledUrl = fetchMock.mock.calls[0][0] as URL | string;
    expect(calledUrl.toString()).toBe(
      "http://bridge.test/estimates/abc%2F123/pdf",
    );
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    const headers = init.headers as Record<string, string>;
    expect(headers["X-Tenant-Id"]).toBe("ten-abc");
  });

  it("returns 502 when the bridge is unreachable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValueOnce(new Error("ECONNREFUSED")),
    );
    const { GET } = await import("../estimates/[id]/pdf/route");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest("http://localhost/api/estimates/est-1/pdf");
    const res = await GET(req, {
      params: Promise.resolve({ id: "est-1" }),
    });
    expect(res.status).toBe(502);
  });
});
