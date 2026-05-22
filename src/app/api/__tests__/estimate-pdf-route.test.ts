/**
 * Tests for GET /api/estimates/[id]/pdf.
 *
 * The proxy follows the existing estimate pattern: tenant resolved from
 * the SSR session, embedded only in X-Tenant-Id (not the path); estimate
 * id flows through the URL path. Binary body is streamed through with
 * Content-Type / Content-Disposition surfaced from the bridge.
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

function makeReq(url: string, init: RequestInit = {}): Request {
  return new Request(url, init);
}

describe("GET /api/estimates/[id]/pdf", () => {
  it("returns 403 when session is unresolved", async () => {
    mockResolution = { ok: false, code: "NO_SESSION" };
    const { GET } = await import("../estimates/[id]/pdf/route");
    const res = await GET(
      makeReq("http://app.test/api/estimates/est-1/pdf") as never,
      { params: Promise.resolve({ id: "est-1" }) },
    );
    expect(res.status).toBe(403);
  });

  it("targets the bridge pdf path with tenant header", async () => {
    const pdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46]); // %PDF
    const fetchMock = vi.fn().mockResolvedValueOnce(
      new Response(pdfBytes, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": 'attachment; filename="est-1.pdf"',
        },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { GET } = await import("../estimates/[id]/pdf/route");
    const res = await GET(
      makeReq("http://app.test/api/estimates/est-1/pdf") as never,
      { params: Promise.resolve({ id: "est-1" }) },
    );

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/pdf");
    expect(res.headers.get("Content-Disposition")).toBe(
      'attachment; filename="est-1.pdf"',
    );

    const calledUrl = fetchMock.mock.calls[0][0] as URL;
    expect(calledUrl.toString()).toBe(
      "http://bridge.test/estimates/est-1/pdf",
    );
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    const headers = init.headers as Record<string, string>;
    expect(headers["X-Tenant-Id"]).toBe("ten-abc");
  });

  it("surfaces a bridge non-2xx verbatim", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );
    const { GET } = await import("../estimates/[id]/pdf/route");
    const res = await GET(
      makeReq("http://app.test/api/estimates/missing/pdf") as never,
      { params: Promise.resolve({ id: "missing" }) },
    );
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("not found");
  });

  it("returns 502 when the bridge is unreachable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValueOnce(new Error("ECONNREFUSED")),
    );
    const { GET } = await import("../estimates/[id]/pdf/route");
    const res = await GET(
      makeReq("http://app.test/api/estimates/est-1/pdf") as never,
      { params: Promise.resolve({ id: "est-1" }) },
    );
    expect(res.status).toBe(502);
  });

  it("uri-encodes the estimate id segment", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const { GET } = await import("../estimates/[id]/pdf/route");
    await GET(
      makeReq("http://app.test/api/estimates/a%2Fb/pdf") as never,
      { params: Promise.resolve({ id: "a/b" }) },
    );

    const calledUrl = fetchMock.mock.calls[0][0] as URL;
    expect(calledUrl.pathname).toBe("/estimates/a%2Fb/pdf");
  });
});
