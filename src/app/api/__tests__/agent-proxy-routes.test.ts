/**
 * Tests for the same-origin agent proxy routes that repoint the command
 * center's client-direct bridge fetches (which the browser can't reach due
 * to missing CORS):
 *   GET /api/agent-logs
 *   GET /api/agent-status
 *   GET /api/agent-performance
 *   GET /api/command-center/stats
 *
 * Each resolves tenant from the SSR session and forwards tenant_id as a
 * query param to the bridge — never trusting a client-supplied tenant_id.
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

function req(url: string): Request {
  return new Request(url);
}

beforeEach(() => {
  mockResolution = { ok: true, tenant_id: "ten-abc", user_id: "u1" };
  vi.stubEnv("ASK_ENDALL_BRIDGE_URL", "http://bridge.test");
});

describe("GET /api/agent-logs", () => {
  it("returns 403 when session is unresolved", async () => {
    mockResolution = { ok: false, code: "NO_SESSION" };
    const { GET } = await import("../agent-logs/route");
    const res = await GET(req("http://app.test/api/agent-logs"));
    expect(res.status).toBe(403);
  });

  it("injects the session tenant, forwards agent_id+limit, ignores client tenant_id", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("[]", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const { GET } = await import("../agent-logs/route");
    await GET(
      req(
        "http://app.test/api/agent-logs?agent_id=front_desk&limit=50&tenant_id=HACKER",
      ),
    );

    const calledUrl = new URL(fetchMock.mock.calls[0][0].toString());
    expect(calledUrl.origin + calledUrl.pathname).toBe(
      "http://bridge.test/api/agent-logs",
    );
    expect(calledUrl.searchParams.get("tenant_id")).toBe("ten-abc");
    expect(calledUrl.searchParams.get("agent_id")).toBe("front_desk");
    expect(calledUrl.searchParams.get("limit")).toBe("50");
  });

  it("returns 502 when the bridge is unreachable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValueOnce(new Error("ECONNREFUSED")),
    );
    const { GET } = await import("../agent-logs/route");
    const res = await GET(req("http://app.test/api/agent-logs"));
    expect(res.status).toBe(502);
  });

  it("forwards a non-2xx bridge response unchanged", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce(new Response("{}", { status: 503 })),
    );
    const { GET } = await import("../agent-logs/route");
    const res = await GET(req("http://app.test/api/agent-logs"));
    expect(res.status).toBe(503);
  });
});

describe("GET /api/agent-status", () => {
  it("forwards agent_id and injects tenant", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const { GET } = await import("../agent-status/route");
    await GET(req("http://app.test/api/agent-status?agent_id=sdr"));
    const calledUrl = new URL(fetchMock.mock.calls[0][0].toString());
    expect(calledUrl.origin + calledUrl.pathname).toBe(
      "http://bridge.test/api/agent-status",
    );
    expect(calledUrl.searchParams.get("agent_id")).toBe("sdr");
    expect(calledUrl.searchParams.get("tenant_id")).toBe("ten-abc");
  });
});

describe("GET /api/agent-performance", () => {
  it("forwards agent_id and period", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const { GET } = await import("../agent-performance/route");
    await GET(
      req("http://app.test/api/agent-performance?agent_id=email&period=today"),
    );
    const calledUrl = new URL(fetchMock.mock.calls[0][0].toString());
    expect(calledUrl.origin + calledUrl.pathname).toBe(
      "http://bridge.test/api/agent-performance",
    );
    expect(calledUrl.searchParams.get("agent_id")).toBe("email");
    expect(calledUrl.searchParams.get("period")).toBe("today");
    expect(calledUrl.searchParams.get("tenant_id")).toBe("ten-abc");
  });
});

describe("GET /api/command-center/stats", () => {
  it("targets the bridge stats path with the session tenant", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const { GET } = await import("../command-center/stats/route");
    await GET(req("http://app.test/api/command-center/stats"));
    const calledUrl = new URL(fetchMock.mock.calls[0][0].toString());
    expect(calledUrl.origin + calledUrl.pathname).toBe(
      "http://bridge.test/command-center/stats",
    );
    expect(calledUrl.searchParams.get("tenant_id")).toBe("ten-abc");
  });
});
