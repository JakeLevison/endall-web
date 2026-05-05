/**
 * Tests for Vercel-cron entrypoints:
 *   GET /api/cron/day-plans/tick-22h
 *   GET /api/cron/day-plans/tick-6am
 *
 * Both routes verify Vercel's `Authorization: Bearer ${CRON_SECRET}` header
 * and proxy to the Railway bridge with `x-cron-secret`.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

beforeEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
  vi.stubEnv("ASK_ENDALL_BRIDGE_URL", "http://bridge.test");
  vi.stubEnv("CRON_SECRET", "topsecret");
});

const ROUTES = [
  {
    label: "tick-22h",
    importPath: "../cron/day-plans/tick-22h/route",
    bridgePath: "/cron/day-plans/tick-22h",
    requestUrl: "http://localhost/api/cron/day-plans/tick-22h",
  },
  {
    label: "tick-6am",
    importPath: "../cron/day-plans/tick-6am/route",
    bridgePath: "/cron/day-plans/tick-6am",
    requestUrl: "http://localhost/api/cron/day-plans/tick-6am",
  },
] as const;

for (const route of ROUTES) {
  describe(`GET /api/cron/day-plans/${route.label}`, () => {
    it("returns 401 when Authorization header is missing", async () => {
      const { GET } = await import(route.importPath);
      const { NextRequest } = await import("next/server");
      const req = new NextRequest(route.requestUrl);
      const res = await GET(req);
      expect(res.status).toBe(401);
    });

    it("returns 401 when Authorization header has wrong secret", async () => {
      const { GET } = await import(route.importPath);
      const { NextRequest } = await import("next/server");
      const req = new NextRequest(route.requestUrl, {
        headers: { Authorization: "Bearer wrong" },
      });
      const res = await GET(req);
      expect(res.status).toBe(401);
    });

    it("returns 500 when CRON_SECRET env var is unset", async () => {
      vi.stubEnv("CRON_SECRET", "");
      const { GET } = await import(route.importPath);
      const { NextRequest } = await import("next/server");
      const req = new NextRequest(route.requestUrl, {
        headers: { Authorization: "Bearer anything" },
      });
      const res = await GET(req);
      expect(res.status).toBe(500);
    });

    it("forwards POST to bridge with x-cron-secret on valid Bearer", async () => {
      const fetchSpy =
        vi.fn<(input: URL | string, init?: RequestInit) => Promise<Response>>();
      fetchSpy.mockResolvedValue(
        new Response(JSON.stringify({ ran_at: "2026-05-04T22:00:00Z", results: [] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
      vi.stubGlobal("fetch", fetchSpy);
      const { GET } = await import(route.importPath);
      const { NextRequest } = await import("next/server");
      const req = new NextRequest(route.requestUrl, {
        headers: { Authorization: "Bearer topsecret" },
      });
      const res = await GET(req);
      expect(res.status).toBe(200);
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const calledUrl = fetchSpy.mock.calls[0][0];
      const urlStr =
        typeof calledUrl === "string" ? calledUrl : calledUrl.toString();
      expect(urlStr).toContain(route.bridgePath);
      const init = fetchSpy.mock.calls[0][1];
      expect(init?.method).toBe("POST");
      const headers = (init?.headers ?? {}) as Record<string, string>;
      expect(headers["x-cron-secret"]).toBe("topsecret");
    });

    it("returns 502 when bridge fetch throws", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn(async () => {
          throw new Error("ECONNREFUSED");
        }),
      );
      const { GET } = await import(route.importPath);
      const { NextRequest } = await import("next/server");
      const req = new NextRequest(route.requestUrl, {
        headers: { Authorization: "Bearer topsecret" },
      });
      const res = await GET(req);
      expect(res.status).toBe(502);
    });

    it("passes bridge status code through (e.g. 401 from bridge)", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn(async () =>
          new Response(JSON.stringify({ detail: "invalid cron secret" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }),
        ),
      );
      const { GET } = await import(route.importPath);
      const { NextRequest } = await import("next/server");
      const req = new NextRequest(route.requestUrl, {
        headers: { Authorization: "Bearer topsecret" },
      });
      const res = await GET(req);
      expect(res.status).toBe(401);
    });
  });
}
