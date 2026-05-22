/**
 * Tests for the metrics and reports proxy routes:
 *   GET  /api/metrics/summary
 *   GET  /api/metrics/timeseries
 *   GET  /api/metrics/roi
 *   POST /api/reports/weekly/send
 *   POST /api/reports/monthly/send
 *   GET  /api/reports/weekly/preview
 *   GET  /api/reports/monthly/preview
 *
 * Bridge endpoints embed tenant_id in the URL path. The proxies must resolve
 * tenant from session and substitute it into the bridge path; they must
 * never trust a client-provided tenant_id.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

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
  mockResolution = { ok: true, tenant_id: "ten-roi", user_id: "u1" };
  vi.stubEnv("ASK_ENDALL_BRIDGE_URL", "http://bridge.test");
});

describe("GET /api/metrics/summary", () => {
  it("returns 403 when session is unresolved", async () => {
    mockResolution = { ok: false, code: "NO_SESSION" };
    const { GET } = await import("../metrics/summary/route");
    const res = await GET();
    expect(res.status).toBe(403);
  });

  it("targets bridge /metrics/{tenant_id}/summary with tenant header", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const { GET } = await import("../metrics/summary/route");
    const res = await GET();

    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const calledUrl = fetchMock.mock.calls[0][0] as URL | string;
    expect(calledUrl.toString()).toBe(
      "http://bridge.test/metrics/ten-roi/summary",
    );
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    const headers = init.headers as Record<string, string>;
    expect(headers["X-Tenant-Id"]).toBe("ten-roi");
  });

  it("returns 502 when the bridge is unreachable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValueOnce(new Error("ECONNREFUSED")),
    );
    const { GET } = await import("../metrics/summary/route");
    const res = await GET();
    expect(res.status).toBe(502);
  });
});

describe("GET /api/metrics/timeseries", () => {
  it("returns 403 when session is unresolved", async () => {
    mockResolution = { ok: false, code: "NO_SESSION" };
    const { GET } = await import("../metrics/timeseries/route");
    const res = await GET(
      new NextRequest("http://localhost/api/metrics/timeseries"),
    );
    expect(res.status).toBe(403);
  });

  it("passes through query params to the bridge", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const { GET } = await import("../metrics/timeseries/route");
    await GET(
      new NextRequest(
        "http://localhost/api/metrics/timeseries?period=weekly&metric=calls",
      ),
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const calledUrl = fetchMock.mock.calls[0][0] as URL | string;
    expect(calledUrl.toString()).toBe(
      "http://bridge.test/metrics/ten-roi/timeseries?period=weekly&metric=calls",
    );
  });

  it("returns 502 when the bridge is unreachable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValueOnce(new Error("ECONNREFUSED")),
    );
    const { GET } = await import("../metrics/timeseries/route");
    const res = await GET(
      new NextRequest("http://localhost/api/metrics/timeseries"),
    );
    expect(res.status).toBe(502);
  });
});

describe("GET /api/metrics/roi", () => {
  it("returns 403 when session is unresolved", async () => {
    mockResolution = { ok: false, code: "NO_SESSION" };
    const { GET } = await import("../metrics/roi/route");
    const res = await GET();
    expect(res.status).toBe(403);
  });

  it("targets bridge /metrics/{tenant_id}/roi", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const { GET } = await import("../metrics/roi/route");
    await GET();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const calledUrl = fetchMock.mock.calls[0][0] as URL | string;
    expect(calledUrl.toString()).toBe("http://bridge.test/metrics/ten-roi/roi");
  });

  it("returns 502 when the bridge is unreachable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValueOnce(new Error("ECONNREFUSED")),
    );
    const { GET } = await import("../metrics/roi/route");
    const res = await GET();
    expect(res.status).toBe(502);
  });
});

describe("POST /api/reports/weekly/send", () => {
  it("returns 403 when session is unresolved", async () => {
    mockResolution = { ok: false, code: "NO_SESSION" };
    const { POST } = await import("../reports/weekly/send/route");
    const res = await POST();
    expect(res.status).toBe(403);
  });

  it("targets bridge /reports/{tenant_id}/weekly/send", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify({ sent: true }), {
        status: 200,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { POST } = await import("../reports/weekly/send/route");
    const res = await POST();

    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const calledUrl = fetchMock.mock.calls[0][0] as URL | string;
    expect(calledUrl.toString()).toBe(
      "http://bridge.test/reports/ten-roi/weekly/send",
    );
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(init.method).toBe("POST");
  });

  it("returns 502 when the bridge is unreachable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValueOnce(new Error("ECONNREFUSED")),
    );
    const { POST } = await import("../reports/weekly/send/route");
    const res = await POST();
    expect(res.status).toBe(502);
  });
});

describe("POST /api/reports/monthly/send", () => {
  it("returns 403 when session is unresolved", async () => {
    mockResolution = { ok: false, code: "NO_SESSION" };
    const { POST } = await import("../reports/monthly/send/route");
    const res = await POST();
    expect(res.status).toBe(403);
  });

  it("targets bridge /reports/{tenant_id}/monthly/send", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const { POST } = await import("../reports/monthly/send/route");
    await POST();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const calledUrl = fetchMock.mock.calls[0][0] as URL | string;
    expect(calledUrl.toString()).toBe(
      "http://bridge.test/reports/ten-roi/monthly/send",
    );
  });

  it("returns 502 when the bridge is unreachable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValueOnce(new Error("ECONNREFUSED")),
    );
    const { POST } = await import("../reports/monthly/send/route");
    const res = await POST();
    expect(res.status).toBe(502);
  });
});

describe("GET /api/reports/weekly/preview", () => {
  it("returns 403 when session is unresolved", async () => {
    mockResolution = { ok: false, code: "NO_SESSION" };
    const { GET } = await import("../reports/weekly/preview/route");
    const res = await GET();
    expect(res.status).toBe(403);
  });

  it("targets bridge /reports/{tenant_id}/weekly/preview", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      new Response("<html></html>", {
        status: 200,
        headers: { "Content-Type": "text/html" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { GET } = await import("../reports/weekly/preview/route");
    const res = await GET();

    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const calledUrl = fetchMock.mock.calls[0][0] as URL | string;
    expect(calledUrl.toString()).toBe(
      "http://bridge.test/reports/ten-roi/weekly/preview",
    );
  });
});

describe("GET /api/reports/monthly/preview", () => {
  it("returns 403 when session is unresolved", async () => {
    mockResolution = { ok: false, code: "NO_SESSION" };
    const { GET } = await import("../reports/monthly/preview/route");
    const res = await GET();
    expect(res.status).toBe(403);
  });

  it("targets bridge /reports/{tenant_id}/monthly/preview", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      new Response("<html></html>", {
        status: 200,
        headers: { "Content-Type": "text/html" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { GET } = await import("../reports/monthly/preview/route");
    const res = await GET();

    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const calledUrl = fetchMock.mock.calls[0][0] as URL | string;
    expect(calledUrl.toString()).toBe(
      "http://bridge.test/reports/ten-roi/monthly/preview",
    );
  });
});
