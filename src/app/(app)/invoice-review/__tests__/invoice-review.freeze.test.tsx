import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { SWRConfig } from "swr";
import DispatchPage from "../page";

// Regression test for the May 19 demo blocker: visiting /invoice-review froze
// the entire browser tab. Cause was an inline `fallbackData: []` passed to
// useSWR — a fresh array literal every render — combined with a
// `useEffect(..., [data])` that mirrored `data` into local state. While the
// /api/jobs/unified request was pending (bridge slow or unreachable, exactly
// the demo case), SWR returned a NEW fallback reference every render, the
// effect re-fired every render, called setState, forced another render, and
// the loop pegged the main thread.
//
// This test uses the REAL swr module (no mock) with a fetch that never
// resolves, reproducing the pending-request condition. Against the buggy code
// React throws "Maximum update depth exceeded" and the render fails. With the
// fix the page renders its empty state exactly once.
const captureMock = vi.fn();
vi.mock("@/lib/posthog", () => ({
  posthog: { capture: (...args: unknown[]) => captureMock(...args) },
}));

describe("Invoice review — does not freeze on a pending request", () => {
  beforeEach(() => {
    captureMock.mockClear();
    // Request that never settles: the page must stay responsive and show its
    // empty state, not spin the render loop.
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise<Response>(() => {}))
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the empty state once without an infinite render loop", async () => {
    render(
      <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
        <DispatchPage />
      </SWRConfig>
    );

    expect(
      await screen.findByRole("heading", { name: /^today$/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/No jobs scheduled\. When Front Desk books/i)
    ).toBeInTheDocument();

    // The mount-only analytics effect must fire exactly once. Under the old
    // render loop this climbed unbounded before React aborted.
    await waitFor(() => {
      expect(captureMock).toHaveBeenCalledWith("invoice_review_page_viewed");
    });
    expect(
      captureMock.mock.calls.filter(
        (c) => c[0] === "invoice_review_page_viewed"
      )
    ).toHaveLength(1);
  });
});
