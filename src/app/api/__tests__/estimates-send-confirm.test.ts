/**
 * Tests for:
 *   POST /api/estimates/[id]/send           (draft preparation proxy)
 *   POST /api/estimates/[id]/send/confirm   (dispatch proxy with input validation)
 *
 * Pattern: import the route handler directly and call it with a NextRequest,
 * matching the prior art in src/app/api/__tests__/tenant-guard.test.ts.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Tenant resolution mock -- same pattern as tenant-guard.test.ts
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
  vi.stubEnv("ASK_ENDALL_ADMIN_KEY", "secret");
  vi.stubEnv("ASK_ENDALL_BRIDGE_URL", "http://bridge.test");
});

// ---------------------------------------------------------------------------
// POST /api/estimates/[id]/send
// ---------------------------------------------------------------------------
describe("POST /api/estimates/[id]/send", () => {
  it("returns 403 when session is unresolved", async () => {
    mockResolution = { ok: false, code: "NO_SESSION" };
    const { POST } = await import("../estimates/[id]/send/route");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest("http://localhost/api/estimates/est-1/send", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const res = await POST(req, {
      params: Promise.resolve({ id: "est-1" }),
    });
    expect(res.status).toBe(403);
  });

  it("proxies the response status and body from the bridge", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            status: "draft_prepared",
            approval_id: "appr-1",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      ),
    );

    const { POST } = await import("../estimates/[id]/send/route");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest("http://localhost/api/estimates/est-1/send", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const res = await POST(req, {
      params: Promise.resolve({ id: "est-1" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.approval_id).toBe("appr-1");
  });

  it("returns 502 when the bridge is unreachable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValueOnce(new Error("ECONNREFUSED")),
    );
    const { POST } = await import("../estimates/[id]/send/route");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest("http://localhost/api/estimates/est-1/send", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const res = await POST(req, {
      params: Promise.resolve({ id: "est-1" }),
    });
    expect(res.status).toBe(502);
  });

  it("forwards X-Tenant-Id header to the bridge, never leaks admin_key", async () => {
    const fetchSpy = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify({}), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchSpy);

    const { POST } = await import("../estimates/[id]/send/route");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest("http://localhost/api/estimates/est-1/send", {
      method: "POST",
      body: JSON.stringify({}),
    });
    await POST(req, { params: Promise.resolve({ id: "est-1" }) });

    const sentHeaders = fetchSpy.mock.calls[0][1]?.headers as Record<
      string,
      string
    >;
    expect(sentHeaders["X-Tenant-Id"]).toBe("ten-abc");
    const lc = Object.keys(sentHeaders).map((k) => k.toLowerCase());
    expect(lc).not.toContain("admin_key");
  });
});

// ---------------------------------------------------------------------------
// POST /api/estimates/[id]/send/confirm
// ---------------------------------------------------------------------------
describe("POST /api/estimates/[id]/send/confirm", () => {
  it("returns 403 when session is unresolved", async () => {
    mockResolution = { ok: false, code: "NO_SESSION" };
    const { POST } = await import("../estimates/[id]/send/confirm/route");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest(
      "http://localhost/api/estimates/est-1/send/confirm",
      {
        method: "POST",
        body: JSON.stringify({
          approval_id: "a",
          to: "x@y.z",
          subject: "s",
          body: "b",
        }),
      },
    );
    const res = await POST(req, {
      params: Promise.resolve({ id: "est-1" }),
    });
    expect(res.status).toBe(403);
  });

  it("returns 400 when any required field is missing", async () => {
    const { POST } = await import("../estimates/[id]/send/confirm/route");
    const { NextRequest } = await import("next/server");

    // Missing 'body' field
    const req = new NextRequest(
      "http://localhost/api/estimates/est-1/send/confirm",
      {
        method: "POST",
        body: JSON.stringify({
          approval_id: "appr-1",
          to: "ops@acme.test",
          subject: "Estimate",
          // body intentionally omitted
        }),
      },
    );
    const res = await POST(req, {
      params: Promise.resolve({ id: "est-1" }),
    });
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid JSON body", async () => {
    const { POST } = await import("../estimates/[id]/send/confirm/route");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest(
      "http://localhost/api/estimates/est-1/send/confirm",
      {
        method: "POST",
        body: "not-json",
        headers: { "Content-Type": "application/json" },
      },
    );
    const res = await POST(req, {
      params: Promise.resolve({ id: "est-1" }),
    });
    expect(res.status).toBe(400);
  });

  it("proxies 409 from bridge straight through (idempotency already-sent signal)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce(
        new Response(JSON.stringify({ detail: "already sent" }), {
          status: 409,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    const { POST } = await import("../estimates/[id]/send/confirm/route");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest(
      "http://localhost/api/estimates/est-1/send/confirm",
      {
        method: "POST",
        body: JSON.stringify({
          approval_id: "appr-1",
          to: "ops@acme.test",
          subject: "Estimate",
          body: "Hi",
        }),
      },
    );
    const res = await POST(req, {
      params: Promise.resolve({ id: "est-1" }),
    });
    expect(res.status).toBe(409);
  });

  it("returns 502 when the bridge is unreachable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValueOnce(new Error("ECONNREFUSED")),
    );
    const { POST } = await import("../estimates/[id]/send/confirm/route");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest(
      "http://localhost/api/estimates/est-1/send/confirm",
      {
        method: "POST",
        body: JSON.stringify({
          approval_id: "appr-1",
          to: "ops@acme.test",
          subject: "Estimate",
          body: "Hi",
        }),
      },
    );
    const res = await POST(req, {
      params: Promise.resolve({ id: "est-1" }),
    });
    expect(res.status).toBe(502);
  });
});
