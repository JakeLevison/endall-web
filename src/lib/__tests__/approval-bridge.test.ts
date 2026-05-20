/**
 * Tests for resolveApprovalMetaViaBridge.
 *
 * The helper replaces the prior service-role-key shim and now resolves
 * customer approval tokens through the bridge's unauthenticated
 * `GET /public/approval/{token}` endpoint (R2-8c).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  isBookingMeta,
  resolveApprovalAnyViaBridge,
  resolveApprovalMetaViaBridge,
} from "../approval-bridge";

beforeEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.stubEnv("ASK_ENDALL_BRIDGE_URL", "http://bridge.test");
});

describe("resolveApprovalMetaViaBridge", () => {
  it("returns null for an empty token without calling fetch", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    expect(await resolveApprovalMetaViaBridge("")).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("returns null for a token shorter than 16 chars without calling fetch", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    expect(await resolveApprovalMetaViaBridge("short")).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("returns null when the bridge returns 404", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce(
        new Response(JSON.stringify({ detail: "not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );
    const result = await resolveApprovalMetaViaBridge("a".repeat(40));
    expect(result).toBeNull();
  });

  it("returns null on network failure (does not throw)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValueOnce(new Error("ECONNREFUSED")),
    );
    const result = await resolveApprovalMetaViaBridge("a".repeat(40));
    expect(result).toBeNull();
  });

  it("returns null when payload lacks estimate_id", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce(
        new Response(JSON.stringify({ tenant_slug: "alpha-electric" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );
    const result = await resolveApprovalMetaViaBridge("a".repeat(40));
    expect(result).toBeNull();
  });

  it("returns the parsed meta on a 200 response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            estimate_id: "11111111-1111-1111-1111-111111111111",
            tenant_slug: "alpha-electric",
            decision: null,
            expires_at: "2026-05-30T23:59:59+00:00",
            line_items_summary: [{ name: "Journeyman labor", extended: 760 }],
            contractor_name: "Alpha Electric",
            contractor_email: "owner@alpha.test",
            signature_already_captured: false,
            decided_at: null,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );
    const result = await resolveApprovalMetaViaBridge("a".repeat(40));
    expect(result).not.toBeNull();
    expect(result?.estimate_id).toBe("11111111-1111-1111-1111-111111111111");
    expect(result?.tenant_slug).toBe("alpha-electric");
  });

  it("URL-encodes the token in the request path", async () => {
    const fetchSpy = vi.fn().mockResolvedValueOnce(
      new Response(
        JSON.stringify({ estimate_id: "11111111-1111-1111-1111-111111111111" }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchSpy);

    const dirty = "abcdefghijklmnop has spaces/and?slashes";
    await resolveApprovalMetaViaBridge(dirty);

    const calledWith = fetchSpy.mock.calls[0][0] as URL;
    expect(calledWith.toString()).toContain(
      `/public/approval/${encodeURIComponent(dirty)}`,
    );
  });
});

describe("resolveApprovalAnyViaBridge", () => {
  it("returns a booking-shaped meta with status and estimate_id when present", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            kind: "booking",
            voice_job_id: "vj-1",
            tenant_slug: "cornerstone",
            tenant_name: "Cornerstone MEP",
            tenant_phone: "+15715550999",
            caller_name: "Dana",
            job_type: "Panel upgrade",
            job_address: "200 Oak Ave",
            scheduled_at: "2026-05-22T14:00:00+00:00",
            status: "cancelled",
            estimate_id: null,
            decision: null,
            expires_at: "2026-06-05T00:00:00+00:00",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );
    const result = await resolveApprovalAnyViaBridge("a".repeat(40));
    expect(result).not.toBeNull();
    expect(isBookingMeta(result)).toBe(true);
    if (!isBookingMeta(result)) throw new Error("expected booking meta");
    expect(result.status).toBe("cancelled");
    expect(result.estimate_id).toBeNull();
  });

  it("returns a booking meta with estimate_id when the resolver surfaces it", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            kind: "booking",
            voice_job_id: "vj-1",
            status: "pending",
            estimate_id: "est-abc",
            decision: null,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );
    const result = await resolveApprovalAnyViaBridge("a".repeat(40));
    if (!isBookingMeta(result)) throw new Error("expected booking meta");
    expect(result.estimate_id).toBe("est-abc");
  });
});
