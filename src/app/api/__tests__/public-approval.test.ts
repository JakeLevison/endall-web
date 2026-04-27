/**
 * Tests for:
 *   GET  /api/public/approval/[token]          (token resolver + bridge proxy)
 *   POST /api/public/approval/[token]/approve  (signature validation + bridge proxy)
 *
 * lookupApprovalByToken is mocked so no DB is required.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ApprovalRowSummary } from "@/lib/approval-token";

const lookupMock = vi.fn<() => Promise<ApprovalRowSummary | null>>();

vi.mock("@/lib/approval-token", () => ({
  lookupApprovalByToken: lookupMock,
  hashApprovalToken: (t: string) => t, // identity; not under test here
}));

function validSummary(): ApprovalRowSummary {
  return {
    estimate_id: "est-1",
    tenant_id: "ten-1",
    token_used_at: null,
    token_expires_at: new Date(Date.now() + 3600_000).toISOString(),
  };
}

beforeEach(() => {
  lookupMock.mockReset();
  vi.stubEnv("ASK_ENDALL_BRIDGE_URL", "http://bridge.test");
});

// ---------------------------------------------------------------------------
// GET /api/public/approval/[token]
// ---------------------------------------------------------------------------
describe("GET /api/public/approval/[token]", () => {
  it("returns 404 when the token is not found (uniform, no oracle)", async () => {
    lookupMock.mockResolvedValueOnce(null);
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

  it("returns 404 when the bridge 404s (after a valid token lookup)", async () => {
    lookupMock.mockResolvedValueOnce(validSummary());
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "not found" }), {
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
    lookupMock.mockResolvedValueOnce(validSummary());
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
    lookupMock.mockResolvedValueOnce(validSummary());
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
  it("returns 404 when the token lookup fails", async () => {
    lookupMock.mockResolvedValueOnce(null);
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
    lookupMock.mockResolvedValueOnce(validSummary());
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
    lookupMock.mockResolvedValueOnce(validSummary());
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
    lookupMock.mockResolvedValueOnce(validSummary());
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
    lookupMock.mockResolvedValueOnce(validSummary());
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
    lookupMock.mockResolvedValueOnce(validSummary());
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
