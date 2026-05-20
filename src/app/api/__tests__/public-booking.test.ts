/**
 * Tests for GET /api/public/booking/[token].
 *
 * The booking endpoint reuses the shared bridge resolver but must only
 * surface booking-shaped responses — an estimate-shaped resolution must
 * collapse to 404 (the estimate flow lives at /approve/{token}).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import type {
  PublicApprovalMeta,
  PublicBookingMeta,
} from "@/lib/approval-bridge";

const resolveMock = vi.fn<
  () => Promise<PublicApprovalMeta | PublicBookingMeta | null>
>();

vi.mock("@/lib/approval-bridge", async () => {
  const actual = await vi.importActual<
    typeof import("@/lib/approval-bridge")
  >("@/lib/approval-bridge");
  return {
    ...actual,
    resolveApprovalAnyViaBridge: resolveMock,
  };
});

function bookingMeta(
  overrides: Partial<PublicBookingMeta> = {},
): PublicBookingMeta {
  return {
    kind: "booking",
    voice_job_id: "vj-1",
    tenant_slug: "alpha-electric",
    tenant_name: "Alpha Electric",
    tenant_phone: "(555) 123-0000",
    caller_name: "Sam Caller",
    job_type: "Panel service",
    job_address: "1 Main St",
    scheduled_at: "2026-06-01T15:00:00Z",
    status: "pending",
    estimate_id: null,
    decision: null,
    ...overrides,
  };
}

function estimateMeta(): PublicApprovalMeta {
  return {
    estimate_id: "est-1",
    tenant_slug: "alpha-electric",
    decision: null,
  };
}

beforeEach(() => {
  resolveMock.mockReset();
});

describe("GET /api/public/booking/[token]", () => {
  it("returns 404 when the token does not resolve", async () => {
    resolveMock.mockResolvedValueOnce(null);
    const { GET } = await import("../public/booking/[token]/route");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest("http://localhost/api/public/booking/bad-tok");
    const res = await GET(req, {
      params: Promise.resolve({ token: "bad-tok" }),
    });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body).toEqual({ error: "not found" });
  });

  it("returns 404 when the token resolves to an estimate (not a booking)", async () => {
    // /booking/{token} never surfaces estimate shape — that flow lives
    // at /approve/{token}.
    resolveMock.mockResolvedValueOnce(estimateMeta());
    const { GET } = await import("../public/booking/[token]/route");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest(
      "http://localhost/api/public/booking/some-tok",
    );
    const res = await GET(req, {
      params: Promise.resolve({ token: "some-tok" }),
    });
    expect(res.status).toBe(404);
  });

  it("returns the booking payload on a valid booking token", async () => {
    resolveMock.mockResolvedValueOnce(bookingMeta());
    const { GET } = await import("../public/booking/[token]/route");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest(
      "http://localhost/api/public/booking/valid-tok",
    );
    const res = await GET(req, {
      params: Promise.resolve({ token: "valid-tok" }),
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("private, no-store");
    const body = (await res.json()) as PublicBookingMeta;
    expect(body.kind).toBe("booking");
    expect(body.voice_job_id).toBe("vj-1");
    expect(body.job_type).toBe("Panel service");
    expect(body.scheduled_at).toBe("2026-06-01T15:00:00Z");
  });

  it("surfaces a cancelled booking through (page decides the copy)", async () => {
    resolveMock.mockResolvedValueOnce(
      bookingMeta({ status: "cancelled", scheduled_at: null }),
    );
    const { GET } = await import("../public/booking/[token]/route");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest(
      "http://localhost/api/public/booking/cancelled-tok",
    );
    const res = await GET(req, {
      params: Promise.resolve({ token: "cancelled-tok" }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as PublicBookingMeta;
    expect(body.status).toBe("cancelled");
  });
});
