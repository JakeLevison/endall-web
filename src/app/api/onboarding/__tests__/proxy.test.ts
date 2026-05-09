/**
 * Tests for the onboarding wizard bridge-forwarder.
 *
 * The proxy mounts at /api/onboarding/{step} and must:
 *   1. Reject requests without a Bearer token (401).
 *   2. Substitute body.tenantId into the bridge URL path.
 *   3. Strip body.tenantId before forwarding the rest of the body.
 *   4. Forward the Authorization header verbatim to the bridge.
 *   5. Pass bridge 2xx/4xx responses through unchanged.
 *   6. Collapse bridge 5xx and network errors to 502.
 *
 * Coverage centers on company-details (PATCH) as the canonical case;
 * the other six routes share the same helper, so one route's contract
 * exercises the full code path. Cross-route regressions are caught by
 * the dedicated bridge tests upstream.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

beforeEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
  vi.stubEnv("ASK_ENDALL_BRIDGE_URL", "http://bridge.test");
});

const ROUTE_URL = "http://localhost/api/onboarding/company-details";

async function importPatch() {
  const mod = await import("../company-details/route");
  return mod.PATCH;
}

async function buildRequest(init: {
  body?: unknown;
  headers?: Record<string, string>;
} = {}) {
  const { NextRequest } = await import("next/server");
  return new NextRequest(ROUTE_URL, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
}

describe("PATCH /api/onboarding/company-details", () => {
  it("returns 401 when Authorization header is missing", async () => {
    const PATCH = await importPatch();
    const req = await buildRequest({
      body: { tenantId: "abc", company: { legalName: "Acme" } },
    });
    const res = await PATCH(req);
    expect(res.status).toBe(401);
  });

  it("returns 401 when Authorization is not a Bearer scheme", async () => {
    const PATCH = await importPatch();
    const req = await buildRequest({
      headers: { Authorization: "Basic xyz" },
      body: { tenantId: "abc", company: { legalName: "Acme" } },
    });
    const res = await PATCH(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 when tenantId is missing from the body", async () => {
    const PATCH = await importPatch();
    const req = await buildRequest({
      headers: { Authorization: "Bearer good" },
      body: { company: { legalName: "Acme" } },
    });
    const res = await PATCH(req);
    expect(res.status).toBe(400);
  });

  it("forwards bearer + body to the bridge and strips tenantId from body", async () => {
    const fetchSpy =
      vi.fn<(input: URL | string, init?: RequestInit) => Promise<Response>>();
    fetchSpy.mockResolvedValue(
      new Response(JSON.stringify({ step_progress: { company: { completed_at: "x" } } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchSpy);

    const PATCH = await importPatch();
    const req = await buildRequest({
      headers: { Authorization: "Bearer top-secret-invite" },
      body: {
        tenantId: "tenant-123",
        company: { legalName: "Acme MEP", mailingAddress: "1 Main" },
      },
    });
    const res = await PATCH(req);

    expect(res.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    const calledUrl = fetchSpy.mock.calls[0][0];
    const urlStr = typeof calledUrl === "string" ? calledUrl : calledUrl.toString();
    expect(urlStr).toContain("http://bridge.test/tenants/tenant-123/company-details");

    const init = fetchSpy.mock.calls[0][1];
    expect(init?.method).toBe("PATCH");

    const headers = (init?.headers ?? {}) as Record<string, string>;
    expect(headers["Authorization"]).toBe("Bearer top-secret-invite");
    expect(headers["Content-Type"]).toBe("application/json");

    const sentBody = JSON.parse((init?.body as string) ?? "{}");
    expect(sentBody).toEqual({
      company: { legalName: "Acme MEP", mailingAddress: "1 Main" },
    });
    expect(sentBody.tenantId).toBeUndefined();
  });

  it("passes a 422 validator response through unchanged", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ detail: "EIN must match XX-XXXXXXX" }), {
          status: 422,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );
    const PATCH = await importPatch();
    const req = await buildRequest({
      headers: { Authorization: "Bearer t" },
      body: { tenantId: "t1", company: { legalName: "Acme", ein: "bad" } },
    });
    const res = await PATCH(req);
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.detail).toBe("EIN must match XX-XXXXXXX");
  });

  it("collapses a bridge 500 to a 502 with detail", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response("internal boom", {
          status: 500,
          headers: { "Content-Type": "text/plain" },
        }),
      ),
    );
    const PATCH = await importPatch();
    const req = await buildRequest({
      headers: { Authorization: "Bearer t" },
      body: { tenantId: "t1", company: { legalName: "Acme" } },
    });
    const res = await PATCH(req);
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error).toBe("bridge error");
    expect(body.status).toBe(500);
  });

  it("returns 502 when the bridge fetch throws", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("ECONNREFUSED");
      }),
    );
    const PATCH = await importPatch();
    const req = await buildRequest({
      headers: { Authorization: "Bearer t" },
      body: { tenantId: "t1", company: { legalName: "Acme" } },
    });
    const res = await PATCH(req);
    expect(res.status).toBe(502);
  });
});
