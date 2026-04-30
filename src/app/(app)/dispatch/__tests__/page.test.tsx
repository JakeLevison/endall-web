import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock next/navigation so the page renders without an App-Router runtime.
const mockSearchParams = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useSearchParams: () => mockSearchParams,
}));

import DispatchPage from "../page";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const FIXTURE_PROPOSED = {
  id: "dp-1",
  tenant_id: "tenant-A",
  plan_date: "2026-04-25",
  status: "proposed",
  approved_at: null,
  tech_assignments: [
    {
      tech_id: "tech-1",
      tech_name: "Alex Carter",
      job_ids: ["job-1"],
      sequence_order: ["job-1"],
      travel_minutes_estimated: 12,
    },
  ],
  job_summaries: {
    "job-1": {
      title: "Bathroom GFCI",
      address: "123 Loudoun St, Leesburg, VA",
      customer_name: "Patricia Henson",
    },
  },
};

const FIXTURE_APPROVED = { ...FIXTURE_PROPOSED, status: "approved" };

const FIXTURE_EXPIRED = {
  ...FIXTURE_PROPOSED,
  status: "expired",
  tech_assignments: [],
  job_summaries: {},
};

beforeEach(() => {
  vi.restoreAllMocks();
  // Clear search params between tests.
  for (const k of Array.from(mockSearchParams.keys())) {
    mockSearchParams.delete(k);
  }
});

afterEach(() => {
  cleanup();
});

describe("DispatchPage", () => {
  it("shows loading state on first render", async () => {
    let resolveFetch: ((v: Response) => void) | null = null;
    vi.stubGlobal(
      "fetch",
      vi.fn(
        () =>
          new Promise<Response>((resolve) => {
            resolveFetch = resolve;
          }),
      ),
    );
    mockSearchParams.set("date", "2026-04-25");
    render(<DispatchPage />);
    expect(await screen.findByTestId("dispatch-loading")).toBeTruthy();
    // Resolve so React can clean up the in-flight effect.
    await act(async () => {
      resolveFetch?.(jsonResponse(FIXTURE_PROPOSED));
    });
  });

  it("renders proposed plan with Approve button and tech sections", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse(FIXTURE_PROPOSED)),
    );
    mockSearchParams.set("date", "2026-04-25");
    render(<DispatchPage />);

    expect(await screen.findByText("Alex Carter")).toBeTruthy();
    expect(screen.getByText("Bathroom GFCI")).toBeTruthy();
    expect(screen.getByText(/Patricia Henson/)).toBeTruthy();
    const button = screen.getByTestId("dispatch-approve");
    expect(button.textContent).toMatch(/Approve plan/);
  });

  it("hides Approve button when plan is approved and shows badge", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse(FIXTURE_APPROVED)),
    );
    mockSearchParams.set("date", "2026-04-25");
    render(<DispatchPage />);

    await waitFor(() =>
      expect(screen.getByTestId("dispatch-status-badge").textContent).toBe(
        "Approved",
      ),
    );
    expect(screen.queryByTestId("dispatch-approve")).toBeNull();
  });

  it("renders the expired terminal banner", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse(FIXTURE_EXPIRED)),
    );
    mockSearchParams.set("date", "2026-04-25");
    render(<DispatchPage />);

    expect(await screen.findByTestId("dispatch-expired")).toBeTruthy();
    expect(screen.getByText(/expired at 6am/i)).toBeTruthy();
    expect(screen.queryByTestId("dispatch-approve")).toBeNull();
  });

  it("renders the empty state with the 10pm message on 404", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ error: "not found" }, 404)),
    );
    mockSearchParams.set("date", "2026-04-25");
    render(<DispatchPage />);

    expect(await screen.findByTestId("dispatch-empty")).toBeTruthy();
    expect(screen.getByText(/Endall generates the next plan tonight at 10pm/))
      .toBeTruthy();
  });

  it("renders error state with retry button on network failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("offline");
      }),
    );
    mockSearchParams.set("date", "2026-04-25");
    render(<DispatchPage />);

    expect(await screen.findByTestId("dispatch-error")).toBeTruthy();
    expect(screen.getByText(/Network error/)).toBeTruthy();
    expect(screen.getByText(/Retry/)).toBeTruthy();
  });

  it("transitions proposed -> approved after Approve click", async () => {
    const fetchSpy = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(FIXTURE_PROPOSED))
      .mockResolvedValueOnce(jsonResponse(FIXTURE_APPROVED));
    vi.stubGlobal("fetch", fetchSpy);
    mockSearchParams.set("date", "2026-04-25");
    render(<DispatchPage />);

    const button = await screen.findByTestId("dispatch-approve");
    await userEvent.click(button);

    await waitFor(() =>
      expect(screen.getByTestId("dispatch-status-badge").textContent).toBe(
        "Approved",
      ),
    );
    expect(screen.queryByTestId("dispatch-approve")).toBeNull();
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(fetchSpy.mock.calls[1][0]).toMatch(/\/approve$/);
  });

  it("re-fetches plan when approve returns 409 (race with 6am expiry)", async () => {
    const fetchSpy = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(FIXTURE_PROPOSED))
      .mockResolvedValueOnce(jsonResponse({ detail: "expired" }, 409))
      .mockResolvedValueOnce(jsonResponse(FIXTURE_EXPIRED));
    vi.stubGlobal("fetch", fetchSpy);
    mockSearchParams.set("date", "2026-04-25");
    render(<DispatchPage />);

    const button = await screen.findByTestId("dispatch-approve");
    await userEvent.click(button);

    expect(await screen.findByTestId("dispatch-expired")).toBeTruthy();
    expect(fetchSpy).toHaveBeenCalledTimes(3);
  });

  it("surfaces the expand_partial warning when bridge sets the flag", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({ ...FIXTURE_PROPOSED, expand_partial: true }),
      ),
    );
    mockSearchParams.set("date", "2026-04-25");
    render(<DispatchPage />);
    expect(await screen.findByTestId("dispatch-partial-warning")).toBeTruthy();
  });

  it("renders error state when Approve returns 5xx", async () => {
    const fetchSpy = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(FIXTURE_PROPOSED))
      .mockResolvedValueOnce(jsonResponse({ detail: "boom" }, 500));
    vi.stubGlobal("fetch", fetchSpy);
    mockSearchParams.set("date", "2026-04-25");
    render(<DispatchPage />);

    const button = await screen.findByTestId("dispatch-approve");
    await userEvent.click(button);

    expect(await screen.findByTestId("dispatch-error")).toBeTruthy();
    expect(screen.getByText(/Approval failed/i)).toBeTruthy();
  });

  it("renders the overridden status without an Approve button", async () => {
    const overridden = { ...FIXTURE_PROPOSED, status: "overridden" };
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse(overridden)),
    );
    mockSearchParams.set("date", "2026-04-25");
    render(<DispatchPage />);

    await waitFor(() =>
      expect(screen.getByTestId("dispatch-status-badge").textContent).toBe(
        "Overridden",
      ),
    );
    expect(screen.queryByTestId("dispatch-approve")).toBeNull();
  });

  it("disables Approve and updates label while approving", async () => {
    let resolveApprove: ((v: Response) => void) | null = null;
    const fetchSpy = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(FIXTURE_PROPOSED))
      .mockImplementationOnce(
        () =>
          new Promise<Response>((resolve) => {
            resolveApprove = resolve;
          }),
      );
    vi.stubGlobal("fetch", fetchSpy);
    mockSearchParams.set("date", "2026-04-25");
    render(<DispatchPage />);

    const button = (await screen.findByTestId(
      "dispatch-approve",
    )) as HTMLButtonElement;
    expect(button.disabled).toBe(false);
    await userEvent.click(button);

    // While the approve fetch is in flight, the button must be disabled
    // and labeled "Approving..." so a fast double-click cannot fire a
    // second request.
    await waitFor(() => {
      const inflight = screen.getByTestId(
        "dispatch-approve",
      ) as HTMLButtonElement;
      expect(inflight.disabled).toBe(true);
      expect(inflight.textContent).toMatch(/Approving/);
    });

    await act(async () => {
      resolveApprove?.(jsonResponse({ ...FIXTURE_PROPOSED, status: "approved" }));
    });
    await waitFor(() =>
      expect(screen.getByTestId("dispatch-status-badge").textContent).toBe(
        "Approved",
      ),
    );
  });

  it("invalid ?date param falls through to default view date", async () => {
    const fetchSpy = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(FIXTURE_PROPOSED));
    vi.stubGlobal("fetch", fetchSpy);
    mockSearchParams.set("date", "not-a-date");
    withFrozenNow("2026-04-25T10:00:00", () => {
      render(<DispatchPage />);
    });
    await waitFor(() => expect(fetchSpy).toHaveBeenCalled());
    // Bad ?date= should not be passed through; default-view-date is
    // computed instead. At 10:00 local on 2026-04-25, default is today.
    expect(fetchSpy.mock.calls[0][0]).toContain("/api/day-plans/2026-04-25");
  });

  it("renders no-assignments message on a proposed plan with empty tech list", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({
          ...FIXTURE_PROPOSED,
          tech_assignments: [],
          job_summaries: {},
        }),
      ),
    );
    mockSearchParams.set("date", "2026-04-25");
    render(<DispatchPage />);

    expect(await screen.findByTestId("dispatch-no-assignments")).toBeTruthy();
    // Approve still surfaces because plan is proposed.
    expect(screen.getByTestId("dispatch-approve")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Default-view-date logic.
//
// Avoid vi.useFakeTimers() here -- it blocks the microtasks the React
// useEffect path depends on, so fetch never resolves under fake timers and
// the test times out. We override the Date constructor's no-arg behavior
// for the duration of each case instead, leaving the timer queue real so
// promise resolution works.
// ---------------------------------------------------------------------------

function withFrozenNow<T>(iso: string, fn: () => T): T {
  const Real = globalThis.Date;
  const fixed = new Real(iso).getTime();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  class Frozen extends Real {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      if (args.length === 0) {
        super(fixed);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return Reflect.construct(Real, args as any, Frozen) as Date;
      }
    }
    static now(): number {
      return fixed;
    }
  }
  globalThis.Date = Frozen as unknown as typeof Date;
  try {
    return fn();
  } finally {
    globalThis.Date = Real;
  }
}

describe("DispatchPage default date logic", () => {
  it("targets today before 4pm local", async () => {
    const fetchSpy = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(FIXTURE_PROPOSED));
    vi.stubGlobal("fetch", fetchSpy);
    withFrozenNow("2026-04-25T14:00:00", () => {
      render(<DispatchPage />);
    });
    await waitFor(() => expect(fetchSpy).toHaveBeenCalled());
    expect(fetchSpy.mock.calls[0][0]).toContain("/api/day-plans/2026-04-25");
  });

  it("targets tomorrow at or after 4pm local", async () => {
    const fetchSpy = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(FIXTURE_PROPOSED));
    vi.stubGlobal("fetch", fetchSpy);
    withFrozenNow("2026-04-25T16:30:00", () => {
      render(<DispatchPage />);
    });
    await waitFor(() => expect(fetchSpy).toHaveBeenCalled());
    expect(fetchSpy.mock.calls[0][0]).toContain("/api/day-plans/2026-04-26");
  });

  it("URL ?date param overrides the default", async () => {
    mockSearchParams.set("date", "2026-05-01");
    const fetchSpy = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(FIXTURE_PROPOSED));
    vi.stubGlobal("fetch", fetchSpy);
    withFrozenNow("2026-04-25T16:30:00", () => {
      render(<DispatchPage />);
    });
    await waitFor(() => expect(fetchSpy).toHaveBeenCalled());
    expect(fetchSpy.mock.calls[0][0]).toContain("/api/day-plans/2026-05-01");
  });
});
