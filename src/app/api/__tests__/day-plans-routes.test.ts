/**
 * Tests for:
 *   GET  /api/day-plans/[date]            (read proxy with ?expand=true)
 *   POST /api/day-plans/[date]/approve    (approve proxy, 409 passthrough)
 *
 * Pattern mirrors src/app/api/__tests__/estimates-get.test.ts.
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

describe("GET /api/day-plans/[date]", () => {
  it("returns 403 when session is unresolved", async () => {
    mockResolution = { ok: false, code: "NO_SESSION" };
    const { GET } = await import("../day-plans/[date]/route");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest("http://localhost/api/day-plans/2026-04-25");
    const res = await GET(req, {
      params: Promise.resolve({ date: "2026-04-25" }),
    });
    expect(res.status).toBe(403);
  });

  it("rejects malformed date with 400", async () => {
    const { GET } = await import("../day-plans/[date]/route");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest("http://localhost/api/day-plans/not-a-date");
    const res = await GET(req, {
      params: Promise.resolve({ date: "not-a-date" }),
    });
    expect(res.status).toBe(400);
  });

  it("forwards X-Tenant-Id and ?expand=true to the bridge", async () => {
    const fetchSpy = vi.fn<(input: URL | string, init?: RequestInit) => Promise<Response>>();
    fetchSpy.mockResolvedValue(
      new Response(JSON.stringify({ id: "dp-1", status: "proposed" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchSpy);
    const { GET } = await import("../day-plans/[date]/route");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest("http://localhost/api/day-plans/2026-04-25");
    const res = await GET(req, {
      params: Promise.resolve({ date: "2026-04-25" }),
    });
    expect(res.status).toBe(200);
    const calledUrl = fetchSpy.mock.calls[0][0];
    const urlStr = typeof calledUrl === "string" ? calledUrl : calledUrl.toString();
    expect(urlStr).toContain("/day-plans/2026-04-25");
    expect(urlStr).toContain("expand=true");
    const init = fetchSpy.mock.calls[0][1];
    const headers = (init?.headers ?? {}) as Record<string, string>;
    expect(headers["X-Tenant-Id"]).toBe("ten-abc");
  });

  it("passes 404 from bridge through to client", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ detail: "day plan not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );
    const { GET } = await import("../day-plans/[date]/route");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest("http://localhost/api/day-plans/2026-04-25");
    const res = await GET(req, {
      params: Promise.resolve({ date: "2026-04-25" }),
    });
    expect(res.status).toBe(404);
  });

  it("returns 502 on bridge unavailability", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("ECONNREFUSED");
      }),
    );
    const { GET } = await import("../day-plans/[date]/route");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest("http://localhost/api/day-plans/2026-04-25");
    const res = await GET(req, {
      params: Promise.resolve({ date: "2026-04-25" }),
    });
    expect(res.status).toBe(502);
  });
});

describe("POST /api/day-plans/[date]/approve", () => {
  it("returns 403 when session is unresolved", async () => {
    mockResolution = { ok: false, code: "NO_SESSION" };
    const { POST } = await import("../day-plans/[date]/approve/route");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest(
      "http://localhost/api/day-plans/2026-04-25/approve",
      { method: "POST", body: "{}" },
    );
    const res = await POST(req, {
      params: Promise.resolve({ date: "2026-04-25" }),
    });
    expect(res.status).toBe(403);
  });

  it("forwards request body and X-Tenant-Id to the bridge", async () => {
    const fetchSpy = vi.fn<(input: URL | string, init?: RequestInit) => Promise<Response>>();
    fetchSpy.mockResolvedValue(
      new Response(JSON.stringify({ status: "approved" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchSpy);
    const { POST } = await import("../day-plans/[date]/approve/route");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest(
      "http://localhost/api/day-plans/2026-04-25/approve",
      {
        method: "POST",
        body: JSON.stringify({ notes: "ship it" }),
        headers: { "Content-Type": "application/json" },
      },
    );
    const res = await POST(req, {
      params: Promise.resolve({ date: "2026-04-25" }),
    });
    expect(res.status).toBe(200);
    const init = fetchSpy.mock.calls[0][1];
    expect(init?.method).toBe("POST");
    expect(((init?.headers ?? {}) as Record<string, string>)["X-Tenant-Id"]).toBe(
      "ten-abc",
    );
    expect(String(init?.body ?? "")).toContain("ship it");
  });

  it("passes 409 from bridge through to client (race with 6am expiry)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({ detail: "plan has expired; cannot approve" }),
          { status: 409, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );
    const { POST } = await import("../day-plans/[date]/approve/route");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest(
      "http://localhost/api/day-plans/2026-04-25/approve",
      { method: "POST", body: "{}" },
    );
    const res = await POST(req, {
      params: Promise.resolve({ date: "2026-04-25" }),
    });
    expect(res.status).toBe(409);
  });

  it("rejects malformed date with 400", async () => {
    const { POST } = await import("../day-plans/[date]/approve/route");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest("http://localhost/api/day-plans/foo/approve", {
      method: "POST",
      body: "{}",
    });
    const res = await POST(req, {
      params: Promise.resolve({ date: "foo" }),
    });
    expect(res.status).toBe(400);
  });
});

describe("POST /api/day-plans/[date]/override", () => {
  it("returns 403 when session is unresolved", async () => {
    mockResolution = { ok: false, code: "NO_SESSION" };
    const { POST } = await import("../day-plans/[date]/override/route");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest(
      "http://localhost/api/day-plans/2026-04-25/override",
      { method: "POST", body: "{}" },
    );
    const res = await POST(req, {
      params: Promise.resolve({ date: "2026-04-25" }),
    });
    expect(res.status).toBe(403);
  });

  it("rejects malformed date with 400", async () => {
    const { POST } = await import("../day-plans/[date]/override/route");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest(
      "http://localhost/api/day-plans/foo/override",
      { method: "POST", body: "{}" },
    );
    const res = await POST(req, {
      params: Promise.resolve({ date: "foo" }),
    });
    expect(res.status).toBe(400);
  });

  it("forwards X-Tenant-Id and request body to the bridge", async () => {
    const fetchSpy = vi.fn<(input: URL | string, init?: RequestInit) => Promise<Response>>();
    fetchSpy.mockResolvedValue(
      new Response(JSON.stringify({ status: "overridden" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchSpy);
    const { POST } = await import("../day-plans/[date]/override/route");
    const { NextRequest } = await import("next/server");
    const payload = {
      tech_assignments: [
        { tech_id: "tech-1", job_ids: ["job-1"], sequence_order: ["job-1"] },
      ],
      notes: "moved bath GFCI to Bea",
    };
    const req = new NextRequest(
      "http://localhost/api/day-plans/2026-04-25/override",
      {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
      },
    );
    const res = await POST(req, {
      params: Promise.resolve({ date: "2026-04-25" }),
    });
    expect(res.status).toBe(200);
    const calledUrl = fetchSpy.mock.calls[0][0];
    const urlStr = typeof calledUrl === "string" ? calledUrl : calledUrl.toString();
    expect(urlStr).toContain("/day-plans/2026-04-25/override");
    const init = fetchSpy.mock.calls[0][1];
    expect(init?.method).toBe("POST");
    expect(((init?.headers ?? {}) as Record<string, string>)["X-Tenant-Id"]).toBe(
      "ten-abc",
    );
    expect(String(init?.body ?? "")).toContain("moved bath GFCI to Bea");
  });

  it("passes 409 from bridge through to client (race with 6am expiry)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({ detail: "plan has expired; cannot override" }),
          { status: 409, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );
    const { POST } = await import("../day-plans/[date]/override/route");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest(
      "http://localhost/api/day-plans/2026-04-25/override",
      { method: "POST", body: "{}" },
    );
    const res = await POST(req, {
      params: Promise.resolve({ date: "2026-04-25" }),
    });
    expect(res.status).toBe(409);
  });
});
