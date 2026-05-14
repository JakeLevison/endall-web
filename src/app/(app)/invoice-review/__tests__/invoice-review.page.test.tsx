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
      const [data, setData] = React.useState<unknown>([]);
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
        json: async () => [],
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
        json: async () => [],
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

  it("renders jobs grouped into Today and This week from the unified endpoint", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => [
          {
            id: "j-today",
            source: "voice_jobs",
            source_id: "vj-today",
            title: "Alice — AC repair",
            status: "pending",
            scheduled_at: todayIso(),
            address: null,
            customer_id: null,
            tenant_id: "t-1",
            created_at: todayIso(),
          },
          {
            id: "j-week",
            source: "jobs",
            source_id: "job-week",
            title: "Bob — Furnace",
            status: "confirmed",
            scheduled_at: daysFromTodayIso(3),
            address: null,
            customer_id: "cust-bob",
            tenant_id: "t-1",
            created_at: todayIso(),
          },
        ],
      } as Response))
    );
    render(<DispatchPage />);
    await waitFor(() => {
      expect(screen.getByText(/Alice — AC repair/)).toBeInTheDocument();
      expect(screen.getByText(/Bob — Furnace/)).toBeInTheDocument();
    });
    // Source badges render for both source types.
    expect(screen.getByTestId("source-badge-voice_jobs")).toBeInTheDocument();
    expect(screen.getByTestId("source-badge-jobs")).toBeInTheDocument();
  });

  it("renders voice_jobs rows with null customer_id without crashing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => [
          {
            id: "j-voice",
            source: "voice_jobs",
            source_id: "vj-1",
            title: "Caller booked via voice",
            status: "pending",
            scheduled_at: todayIso(),
            address: "123 Main",
            customer_id: null,
            tenant_id: "t-1",
            created_at: todayIso(),
          },
        ],
      } as Response))
    );
    render(<DispatchPage />);
    await waitFor(() => {
      expect(screen.getByText(/Caller booked via voice/)).toBeInTheDocument();
    });
    expect(screen.getByTestId("source-badge-voice_jobs")).toBeInTheDocument();
  });

  it("shows Generate invoice button only on completed jobs", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => [
          {
            id: "j-complete",
            source: "jobs",
            source_id: "job-c",
            title: "Carol",
            status: "completed",
            scheduled_at: todayIso(14),
            address: null,
            customer_id: "cust-carol",
            tenant_id: "t-1",
            created_at: todayIso(),
          },
          {
            id: "j-pending",
            source: "voice_jobs",
            source_id: "vj-p",
            title: "Dan",
            status: "pending",
            scheduled_at: todayIso(15),
            address: null,
            customer_id: null,
            tenant_id: "t-1",
            created_at: todayIso(),
          },
        ],
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
