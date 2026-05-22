/**
 * Tests for:
 *   GET    /api/prospects
 *   POST   /api/prospects
 *   POST   /api/prospects/import
 *   POST   /api/prospects/[id]/enrich
 *
 * Bridge endpoints embed tenant_id in the URL path. The proxies must
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

function makeReq(url: string, init: RequestInit = {}): Request {
  return new Request(url, init);
}

describe("GET /api/prospects", () => {
  it("returns 403 when session is unresolved", async () => {
    mockResolution = { ok: false, code: "NO_SESSION" };
    const { GET } = await import("../prospects/route");
    const res = await GET(makeReq("http://app.test/api/prospects") as never);
    expect(res.status).toBe(403);
  });

  it("targets the bridge path with the session tenant_id embedded", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ rows: [], total: 0 }), { status: 200 }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const { GET } = await import("../prospects/route");
    const res = await GET(makeReq("http://app.test/api/prospects") as never);

    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const calledUrl = fetchMock.mock.calls[0][0] as URL;
    expect(calledUrl.toString()).toBe("http://bridge.test/prospects/ten-abc");

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    const headers = init.headers as Record<string, string>;
    expect(headers["X-Tenant-Id"]).toBe("ten-abc");
  });

  it("forwards status/source/limit/offset query params", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const { GET } = await import("../prospects/route");
    await GET(
      makeReq(
        "http://app.test/api/prospects?status=new&source=manual&limit=25&offset=10",
      ) as never,
    );

    const calledUrl = fetchMock.mock.calls[0][0] as URL;
    expect(calledUrl.searchParams.get("status")).toBe("new");
    expect(calledUrl.searchParams.get("source")).toBe("manual");
    expect(calledUrl.searchParams.get("limit")).toBe("25");
    expect(calledUrl.searchParams.get("offset")).toBe("10");
  });

  it("returns 502 when the bridge is unreachable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValueOnce(new Error("ECONNREFUSED")),
    );
    const { GET } = await import("../prospects/route");
    const res = await GET(makeReq("http://app.test/api/prospects") as never);
    expect(res.status).toBe(502);
  });
});

describe("POST /api/prospects", () => {
  it("returns 403 when session is unresolved", async () => {
    mockResolution = { ok: false, code: "NO_SESSION" };
    const { POST } = await import("../prospects/route");
    const res = await POST(
      makeReq("http://app.test/api/prospects", {
        method: "POST",
        body: JSON.stringify({}),
      }) as never,
    );
    expect(res.status).toBe(403);
  });

  it("forwards JSON body to bridge with tenant_id embedded", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: "p1" }), { status: 201 }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const body = {
      company_name: "Acme",
      contact_name: "Jane",
      phone: "+15555550100",
      email: "jane@acme.com",
      notes: "warm",
    };
    const { POST } = await import("../prospects/route");
    const res = await POST(
      makeReq("http://app.test/api/prospects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }) as never,
    );

    expect(res.status).toBe(201);
    const calledUrl = fetchMock.mock.calls[0][0] as URL;
    expect(calledUrl.toString()).toBe("http://bridge.test/prospects/ten-abc");

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify(body));
  });

  it("returns 502 when the bridge is unreachable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValueOnce(new Error("ECONNREFUSED")),
    );
    const { POST } = await import("../prospects/route");
    const res = await POST(
      makeReq("http://app.test/api/prospects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company_name: "A", contact_name: "B" }),
      }) as never,
    );
    expect(res.status).toBe(502);
  });

  it("ignores a client-supplied tenant_id and uses the session tenant", async () => {
    // Defense-in-depth: even if a caller tries to spoof tenant_id via query
    // string or body, the proxy must embed only the session-resolved tenant
    // in the bridge URL.
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const { GET } = await import("../prospects/route");
    await GET(
      makeReq(
        "http://app.test/api/prospects?tenant_id=evil-tenant",
      ) as never,
    );

    const calledUrl = fetchMock.mock.calls[0][0] as URL;
    expect(calledUrl.pathname).toBe("/prospects/ten-abc");
    expect(calledUrl.searchParams.get("tenant_id")).toBeNull();
  });
});

describe("POST /api/prospects/import", () => {
  it("returns 403 when session is unresolved", async () => {
    mockResolution = { ok: false, code: "NO_SESSION" };
    const { POST } = await import("../prospects/import/route");
    const res = await POST(
      makeReq("http://app.test/api/prospects/import", {
        method: "POST",
        body: JSON.stringify({ rows: [] }),
      }) as never,
    );
    expect(res.status).toBe(403);
  });

  it("forwards a JSON body verbatim", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ inserted: 2 }), { status: 200 }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const body = {
      rows: [
        { company_name: "A", contact_name: "X" },
        { company_name: "B", contact_name: "Y" },
      ],
    };
    const { POST } = await import("../prospects/import/route");
    await POST(
      makeReq("http://app.test/api/prospects/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }) as never,
    );

    const calledUrl = fetchMock.mock.calls[0][0] as URL;
    expect(calledUrl.toString()).toBe(
      "http://bridge.test/prospects/ten-abc/import",
    );
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(init.body).toBe(JSON.stringify(body));
  });

  it("forwards a { csv } body verbatim", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ inserted: 1 }), { status: 200 }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const body = {
      csv: "company_name,contact_name\nAcme,Jane\n",
      source: "csv-upload",
    };
    const { POST } = await import("../prospects/import/route");
    const res = await POST(
      makeReq("http://app.test/api/prospects/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }) as never,
    );

    expect(res.status).toBe(200);
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(init.body).toBe(JSON.stringify(body));
  });

  it("returns 502 when the bridge is unreachable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValueOnce(new Error("ECONNREFUSED")),
    );
    const { POST } = await import("../prospects/import/route");
    const res = await POST(
      makeReq("http://app.test/api/prospects/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv: "a,b\n1,2" }),
      }) as never,
    );
    expect(res.status).toBe(502);
  });
});

describe("POST /api/prospects/[id]/enrich", () => {
  it("returns 403 when session is unresolved", async () => {
    mockResolution = { ok: false, code: "NO_SESSION" };
    const { POST } = await import("../prospects/[id]/enrich/route");
    const res = await POST(
      makeReq("http://app.test/api/prospects/p-1/enrich", {
        method: "POST",
      }) as never,
      { params: Promise.resolve({ id: "p-1" }) },
    );
    expect(res.status).toBe(403);
  });

  it("targets the bridge enrich path with tenant_id and prospect_id embedded", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ enriched: true }), { status: 200 }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const { POST } = await import("../prospects/[id]/enrich/route");
    const res = await POST(
      makeReq("http://app.test/api/prospects/p-1/enrich", {
        method: "POST",
      }) as never,
      { params: Promise.resolve({ id: "p-1" }) },
    );

    expect(res.status).toBe(200);
    const calledUrl = fetchMock.mock.calls[0][0] as URL;
    expect(calledUrl.toString()).toBe(
      "http://bridge.test/prospects/ten-abc/p-1/enrich",
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
    const { POST } = await import("../prospects/[id]/enrich/route");
    const res = await POST(
      makeReq("http://app.test/api/prospects/p-1/enrich", {
        method: "POST",
      }) as never,
      { params: Promise.resolve({ id: "p-1" }) },
    );
    expect(res.status).toBe(502);
  });
});
