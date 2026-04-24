import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import DispatchPage from "../page";

const captureMock = vi.fn();
vi.mock("@/lib/posthog", () => ({
  posthog: { capture: (...args: unknown[]) => captureMock(...args) },
}));

// Avoid SWR's polling keeping the test event loop alive. Drive the component
// with a simple synchronous fetcher; no refreshInterval.
vi.mock("swr", () => {
  const React = require("react");
  return {
    default: (_key: string, fetcher: (url: string) => Promise<unknown>) => {
      const [data, setData] = React.useState<unknown>({
        jobs: [],
        grouped_by_date: {},
      });
      React.useEffect(() => {
        let cancelled = false;
        Promise.resolve(fetcher(_key))
          .then((d) => {
            if (!cancelled) setData(d);
          })
          .catch(() => {});
        return () => {
          cancelled = true;
        };
      }, []);
      return { data, mutate: () => {}, isValidating: false };
    },
  };
});

// Tuesday noon UTC. Freezing to this instant and building fixtures off of it
// via setUTCHours/setUTCDate keeps the "Today" / "This week" bucket math
// deterministic regardless of the runner's local timezone or wall-clock.
const FROZEN_NOW = new Date("2026-04-21T12:00:00Z");

function todayIso(hour = 10) {
  const d = new Date(FROZEN_NOW);
  d.setUTCHours(hour, 0, 0, 0);
  return d.toISOString();
}

function daysFromTodayIso(days: number, hour = 10) {
  const d = new Date(FROZEN_NOW);
  d.setUTCDate(d.getUTCDate() + days);
  d.setUTCHours(hour, 0, 0, 0);
  return d.toISOString();
}

describe("Dispatch page", () => {
  beforeEach(() => {
    captureMock.mockClear();
    // Fake only Date so setTimeout/setInterval (used by waitFor) keep real.
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(FROZEN_NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("fires invoice_review_page_viewed posthog event on mount", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ jobs: [], grouped_by_date: {} }),
      } as Response))
    );
    render(<DispatchPage />);
    await waitFor(() => {
      expect(captureMock).toHaveBeenCalledWith("invoice_review_page_viewed");
    });
  });

  it("renders Today and This week section headers and empty states", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ jobs: [], grouped_by_date: {} }),
      } as Response))
    );
    render(<DispatchPage />);
    expect(
      await screen.findByRole("heading", { name: /^today$/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /this week/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/No jobs scheduled\. When Front Desk books/i)
    ).toBeInTheDocument();
  });

  it("renders jobs grouped into Today and This week", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          jobs: [
            {
              id: "j-today",
              caller_name: "Alice",
              caller_phone: "555",
              job_type: "AC repair",
              preferred_date: todayIso(),
              address: null,
              status: "pending",
              notes: null,
            },
            {
              id: "j-week",
              caller_name: "Bob",
              caller_phone: "556",
              job_type: "Furnace",
              preferred_date: daysFromTodayIso(3),
              address: null,
              status: "confirmed",
              notes: null,
            },
          ],
          grouped_by_date: {},
        }),
      } as Response))
    );
    render(<DispatchPage />);
    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
      expect(screen.getByText("Bob")).toBeInTheDocument();
    });
  });

  it("shows Generate invoice button only on completed jobs", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          jobs: [
            {
              id: "j-complete",
              caller_name: "Carol",
              caller_phone: "557",
              job_type: "Tune-up",
              preferred_date: todayIso(14),
              address: null,
              status: "completed",
              notes: null,
            },
            {
              id: "j-pending",
              caller_name: "Dan",
              caller_phone: "558",
              job_type: "Inspection",
              preferred_date: todayIso(15),
              address: null,
              status: "pending",
              notes: null,
            },
          ],
          grouped_by_date: {},
        }),
      } as Response))
    );
    render(<DispatchPage />);
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /generate invoice for carol/i })
      ).toBeInTheDocument();
    });
    expect(
      screen.queryByRole("button", { name: /generate invoice for dan/i })
    ).not.toBeInTheDocument();
  });
});
