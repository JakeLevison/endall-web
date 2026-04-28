/**
 * Tests for:
 *   GET  /api/public/approval/[token]          (token resolver + bridge proxy)
 *   POST /api/public/approval/[token]/approve  (signature validation + bridge proxy)
 *
 * resolveApprovalMetaViaBridge is mocked so no live bridge is required.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { PublicApprovalMeta } from "@/lib/approval-bridge";

const resolveMock = vi.fn<() => Promise<PublicApprovalMeta | null>>();

vi.mock("@/lib/approval-bridge", () => ({
  resolveApprovalMetaViaBridge: resolveMock,
}));

function validMeta(): PublicApprovalMeta {
  return {
    estimate_id: "est-1",
    tenant_slug: "alpha-electric",
    decision: null,
    expires_at: new Date(Date.now() + 3600_000).toISOString(),
    line_items_summary: [{ name: "Journeyman labor", extended: 760 }],
    contractor_name: "Alpha Electric",
    contractor_email: "owner@alpha.test",
    signature_already_captured: false,
    decided_at: null,
  };
}

beforeEach(() => {
  resolveMock.mockReset();
  vi.stubEnv("ASK_ENDALL_BRIDGE_URL", "http://bridge.test");
});

// ---------------------------------------------------------------------------
// GET /api/public/approval/[token]
// ---------------------------------------------------------------------------
describe("GET /api/public/approval/[token]", () => {
  it("returns 404 when the token does not resolve (uniform, no oracle)", async () => {
    resolveMock.mockResolvedValueOnce(null);
    const { GET } = await import("../public/approval/[token]/route");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest("http://localhost/api/public/approval/bad-tok");
    const res = await GET(req, {
      params: Promise.resolve({ token: "bad-tok" }),
    });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body).toEqual({ error: "not found" });
  });

  it("returns 404 when the per-estimate bridge call 404s (after a valid resolution)", async () => {
    resolveMock.mockResolvedValueOnce(validMeta());
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce(
        new Response(JSON.stringify({ detail: "not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );
    const { GET } = await import("../public/approval/[token]/route");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest(
      "http://localhost/api/public/approval/valid-tok",
    );
    const res = await GET(req, {
      params: Promise.resolve({ token: "valid-tok" }),
    });
    expect(res.status).toBe(404);
  });

  it("proxies 200 and sets Cache-Control: private, no-store", async () => {
    resolveMock.mockResolvedValueOnce(validMeta());
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce(
        new Response(
          JSON.stringify({ estimate_id: "est-1", grand_total: 5000 }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      ),
    );
    const { GET } = await import("../public/approval/[token]/route");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest(
      "http://localhost/api/public/approval/valid-tok",
    );
    const res = await GET(req, {
      params: Promise.resolve({ token: "valid-tok" }),
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("private, no-store");
    const body = await res.json();
    expect(body.grand_total).toBe(5000);
  });

  it("returns 404 (not 502) when the bridge is unreachable, to keep the public oracle uniform", async () => {
    resolveMock.mockResolvedValueOnce(validMeta());
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValueOnce(new Error("ECONNREFUSED")),
    );
    const { GET } = await import("../public/approval/[token]/route");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest(
      "http://localhost/api/public/approval/valid-tok",
    );
    const res = await GET(req, {
      params: Promise.resolve({ token: "valid-tok" }),
    });
    // R2-8b H3: public surface returns 404 on infra failure so an
    // attacker cannot distinguish "token resolves but bridge down" from
    // "token does not resolve".
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// POST /api/public/approval/[token]/approve
// ---------------------------------------------------------------------------
describe("POST /api/public/approval/[token]/approve", () => {
  it("returns 404 when the token resolution fails", async () => {
    resolveMock.mockResolvedValueOnce(null);
    const { POST } = await import("../public/approval/[token]/approve/route");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest(
      "http://localhost/api/public/approval/bad-tok/approve",
      {
        method: "POST",
        body: JSON.stringify({ signature_blob: "data:image/png;base64,ABC" }),
      },
    );
    const res = await POST(req, {
      params: Promise.resolve({ token: "bad-tok" }),
    });
    expect(res.status).toBe(404);
  });

  it("returns 413 when signature_blob exceeds the 200 KB limit", async () => {
    resolveMock.mockResolvedValueOnce(validMeta());
    const { POST } = await import("../public/approval/[token]/approve/route");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest(
      "http://localhost/api/public/approval/valid-tok/approve",
      {
        method: "POST",
        body: JSON.stringify({
          signature_blob: "x".repeat(200_001),
        }),
      },
    );
    const res = await POST(req, {
      params: Promise.resolve({ token: "valid-tok" }),
    });
    expect(res.status).toBe(413);
  });

  it("returns 400 when signature_blob is not a string", async () => {
    resolveMock.mockResolvedValueOnce(validMeta());
    const { POST } = await import("../public/approval/[token]/approve/route");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest(
      "http://localhost/api/public/approval/valid-tok/approve",
      {
        method: "POST",
        body: JSON.stringify({ signature_blob: 12345 }),
      },
    );
    const res = await POST(req, {
      params: Promise.resolve({ token: "valid-tok" }),
    });
    expect(res.status).toBe(400);
  });

  it("proxies a successful approve response from the bridge", async () => {
    resolveMock.mockResolvedValueOnce(validMeta());
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            approved: true,
            approved_at: "2026-04-27T12:00:00Z",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      ),
    );
    const { POST } = await import("../public/approval/[token]/approve/route");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest(
      "http://localhost/api/public/approval/valid-tok/approve",
      {
        method: "POST",
        body: JSON.stringify({
          signature_blob: "data:image/png;base64,ABC",
          signed_name: "Jane Doe",
        }),
      },
    );
    const res = await POST(req, {
      params: Promise.resolve({ token: "valid-tok" }),
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("private, no-store");
    const body = await res.json();
    expect(body.approved).toBe(true);
  });

  it("truncates signed_name to 120 characters before forwarding to bridge", async () => {
    resolveMock.mockResolvedValueOnce(validMeta());
    const fetchSpy = vi.fn().mockResolvedValueOnce(
      new Response(
        JSON.stringify({ approved: true, approved_at: "2026-04-27T12:00:00Z" }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchSpy);

    const { POST } = await import("../public/approval/[token]/approve/route");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest(
      "http://localhost/api/public/approval/valid-tok/approve",
      {
        method: "POST",
        body: JSON.stringify({
          signature_blob: "data:image/png;base64,ABC",
          signed_name: "N".repeat(200),
        }),
      },
    );
    await POST(req, { params: Promise.resolve({ token: "valid-tok" }) });

    const sentBody = JSON.parse(fetchSpy.mock.calls[0][1]?.body as string) as {
      signed_name: string;
    };
    expect(sentBody.signed_name.length).toBe(120);
  });

  it("returns 404 (not 502) when the bridge is unreachable, to keep the public oracle uniform", async () => {
    resolveMock.mockResolvedValueOnce(validMeta());
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValueOnce(new Error("ECONNREFUSED")),
    );
    const { POST } = await import("../public/approval/[token]/approve/route");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest(
      "http://localhost/api/public/approval/valid-tok/approve",
      {
        method: "POST",
        body: JSON.stringify({ signature_blob: "data:image/png;base64,ABC" }),
      },
    );
    const res = await POST(req, {
      params: Promise.resolve({ token: "valid-tok" }),
    });
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// POST /api/public/approval/[token]/reject
// ---------------------------------------------------------------------------
describe("POST /api/public/approval/[token]/reject", () => {
  it("returns 404 when the token resolution fails", async () => {
    resolveMock.mockResolvedValueOnce(null);
    const { POST } = await import("../public/approval/[token]/reject/route");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest(
      "http://localhost/api/public/approval/bad-tok/reject",
      { method: "POST", body: JSON.stringify({ reason: "too expensive" }) },
    );
    const res = await POST(req, {
      params: Promise.resolve({ token: "bad-tok" }),
    });
    expect(res.status).toBe(404);
  });

  it("returns 400 when reason is not a string", async () => {
    resolveMock.mockResolvedValueOnce(validMeta());
    const { POST } = await import("../public/approval/[token]/reject/route");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest(
      "http://localhost/api/public/approval/valid-tok/reject",
      { method: "POST", body: JSON.stringify({ reason: 12345 }) },
    );
    const res = await POST(req, {
      params: Promise.resolve({ token: "valid-tok" }),
    });
    expect(res.status).toBe(400);
  });

  it("proxies a successful reject response from the bridge", async () => {
    resolveMock.mockResolvedValueOnce(validMeta());
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce(
        new Response(
          JSON.stringify({ rejected: true, rejected_at: "2026-04-27T12:00:00Z" }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );
    const { POST } = await import("../public/approval/[token]/reject/route");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest(
      "http://localhost/api/public/approval/valid-tok/reject",
      { method: "POST", body: JSON.stringify({ reason: "scope changed" }) },
    );
    const res = await POST(req, {
      params: Promise.resolve({ token: "valid-tok" }),
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("private, no-store");
    const body = await res.json();
    expect(body.rejected).toBe(true);
  });

  it("returns 404 (not 502) when the bridge is unreachable", async () => {
    resolveMock.mockResolvedValueOnce(validMeta());
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValueOnce(new Error("ECONNREFUSED")),
    );
    const { POST } = await import("../public/approval/[token]/reject/route");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest(
      "http://localhost/api/public/approval/valid-tok/reject",
      { method: "POST", body: JSON.stringify({ reason: "n/a" }) },
    );
    const res = await POST(req, {
      params: Promise.resolve({ token: "valid-tok" }),
    });
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// GET / POST /api/public/approval/[token]/comments
// ---------------------------------------------------------------------------
describe("GET /api/public/approval/[token]/comments", () => {
  it("returns 404 when the token resolution fails", async () => {
    resolveMock.mockResolvedValueOnce(null);
    const { GET } = await import("../public/approval/[token]/comments/route");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest(
      "http://localhost/api/public/approval/bad-tok/comments",
    );
    const res = await GET(req, {
      params: Promise.resolve({ token: "bad-tok" }),
    });
    expect(res.status).toBe(404);
  });

  it("proxies a successful 200 from the bridge with private,no-store", async () => {
    resolveMock.mockResolvedValueOnce(validMeta());
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce(
        new Response(JSON.stringify({ comments: [{ id: "c-1", body: "hi" }] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );
    const { GET } = await import("../public/approval/[token]/comments/route");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest(
      "http://localhost/api/public/approval/valid-tok/comments",
    );
    const res = await GET(req, {
      params: Promise.resolve({ token: "valid-tok" }),
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("private, no-store");
    const body = await res.json();
    expect(body.comments[0].id).toBe("c-1");
  });
});

describe("POST /api/public/approval/[token]/comments", () => {
  it("returns 404 when the token resolution fails", async () => {
    resolveMock.mockResolvedValueOnce(null);
    const { POST } = await import("../public/approval/[token]/comments/route");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest(
      "http://localhost/api/public/approval/bad-tok/comments",
      { method: "POST", body: JSON.stringify({ body: "hello" }) },
    );
    const res = await POST(req, {
      params: Promise.resolve({ token: "bad-tok" }),
    });
    expect(res.status).toBe(404);
  });

  it("returns 400 when comment body is empty or whitespace", async () => {
    resolveMock.mockResolvedValueOnce(validMeta());
    const { POST } = await import("../public/approval/[token]/comments/route");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest(
      "http://localhost/api/public/approval/valid-tok/comments",
      { method: "POST", body: JSON.stringify({ body: "   " }) },
    );
    const res = await POST(req, {
      params: Promise.resolve({ token: "valid-tok" }),
    });
    expect(res.status).toBe(400);
  });

  it("proxies a successful 201 from the bridge", async () => {
    resolveMock.mockResolvedValueOnce(validMeta());
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce(
        new Response(
          JSON.stringify({ id: "c-2", body: "noted", created_at: "2026-04-27T12:00:00Z" }),
          { status: 201, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );
    const { POST } = await import("../public/approval/[token]/comments/route");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest(
      "http://localhost/api/public/approval/valid-tok/comments",
      { method: "POST", body: JSON.stringify({ body: "noted" }) },
    );
    const res = await POST(req, {
      params: Promise.resolve({ token: "valid-tok" }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBe("c-2");
  });
});
