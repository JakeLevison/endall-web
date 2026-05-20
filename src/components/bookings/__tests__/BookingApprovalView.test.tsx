/**
 * Tests for BookingApprovalView's render branches.
 *
 * Focus: the cancelled branch and the pending branch differ enough that
 * the wrong one renders if `status` is mis-handled. The polling logic is
 * exercised indirectly via the pending branch (an interval is set up but
 * we let the test tear down before it fires).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { BookingApprovalView } from "../BookingApprovalView";
import type { PublicBookingMeta } from "@/lib/approval-bridge";

const TOKEN = "a".repeat(40);

function baseMeta(overrides: Partial<PublicBookingMeta> = {}): PublicBookingMeta {
  return {
    kind: "booking",
    voice_job_id: "vj-1",
    tenant_slug: "cornerstone",
    tenant_name: "Cornerstone MEP",
    tenant_phone: "+15715550999",
    caller_name: "Dana Lee",
    job_type: "Panel upgrade",
    job_address: "200 Oak Ave",
    scheduled_at: "2026-05-22T14:00:00+00:00",
    status: "pending",
    estimate_id: null,
    decision: null,
    expires_at: "2026-06-05T00:00:00+00:00",
    ...overrides,
  };
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("BookingApprovalView - cancelled state", () => {
  it("renders the cancelled message when status is cancelled", () => {
    render(
      <BookingApprovalView
        token={TOKEN}
        initial={baseMeta({ status: "cancelled" })}
      />,
    );
    expect(
      screen.getByRole("heading", { name: /this appointment was cancelled/i }),
    ).toBeInTheDocument();
    // Tenant phone is surfaced so the customer can rebook.
    expect(screen.getByText(/\+15715550999/)).toBeInTheDocument();
    // No confirm/reschedule affordances on a cancelled booking.
    expect(
      screen.queryByRole("button", { name: /confirm this appointment/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /need to reschedule/i }),
    ).not.toBeInTheDocument();
  });

  it("falls back to a generic rebook message when tenant_phone is empty", () => {
    render(
      <BookingApprovalView
        token={TOKEN}
        initial={baseMeta({ status: "cancelled", tenant_phone: "" })}
      />,
    );
    expect(
      screen.getByText(/if you need to reschedule, please call us back/i),
    ).toBeInTheDocument();
  });
});

describe("BookingApprovalView - pending state", () => {
  it("renders confirm + reschedule buttons for a pending booking", () => {
    // Fake fetch so the polling effect's first tick (if it ever fires)
    // does not blow up. We're testing render, not polling here.
    vi.stubGlobal("fetch", vi.fn());
    render(
      <BookingApprovalView token={TOKEN} initial={baseMeta()} />,
    );
    expect(
      screen.getByRole("heading", { name: /confirm your appointment/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /confirm this appointment/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /need to reschedule/i }),
    ).toBeInTheDocument();
  });
});

describe("BookingApprovalView - decided state", () => {
  it("renders the confirmed banner when decision is confirmed", () => {
    render(
      <BookingApprovalView
        token={TOKEN}
        initial={baseMeta({ decision: "confirmed", status: "confirmed" })}
      />,
    );
    expect(
      screen.getByRole("heading", { name: /you're all set/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/confirmed\. we'll see you on/i)).toBeInTheDocument();
  });

  it("renders the rescheduled banner when decision is rescheduled", () => {
    render(
      <BookingApprovalView
        token={TOKEN}
        initial={baseMeta({ decision: "rescheduled", status: "rescheduled" })}
      />,
    );
    expect(
      screen.getByRole("heading", { name: /your appointment was updated/i }),
    ).toBeInTheDocument();
  });
});
