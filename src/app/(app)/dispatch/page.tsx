"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type TechAssignment = {
  tech_id: string;
  tech_name?: string;
  job_ids: string[];
  sequence_order?: string[];
  travel_minutes_estimated?: number;
};

type JobSummary = {
  title: string;
  address: string;
  customer_name: string;
};

type DayPlan = {
  id: string;
  tenant_id: string;
  plan_date: string;
  status: "proposed" | "approved" | "expired" | "overridden";
  tech_assignments: TechAssignment[];
  job_summaries?: Record<string, JobSummary>;
  approved_at?: string | null;
  expand_partial?: boolean;
};

type FetchState =
  | { kind: "loading" }
  | { kind: "ready"; plan: DayPlan }
  | { kind: "empty" }
  | { kind: "error"; message: string };

// Default view date: tomorrow if local time is past 4pm, else today.
// Contractor planning happens in the late afternoon, so showing tomorrow
// once the clock crosses 16:00 saves a manual override on most days.
function defaultViewDate(now: Date = new Date()): string {
  const target = new Date(now);
  if (now.getHours() >= 16) {
    target.setDate(target.getDate() + 1);
  }
  const y = target.getFullYear();
  const m = String(target.getMonth() + 1).padStart(2, "0");
  const d = String(target.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function isValidDate(s: string | null): s is string {
  // Same shape as the API DATE_PATTERN; structurally-bad ?date= params
  // fall through to defaultViewDate() instead of being passed to the
  // proxy.
  return (
    !!s &&
    /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(s)
  );
}

function formatHumanDate(iso: string): string {
  try {
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function DispatchPage() {
  const searchParams = useSearchParams();
  const dateOverride = searchParams.get("date");
  const initialDate = isValidDate(dateOverride)
    ? dateOverride
    : defaultViewDate();

  const [date] = useState<string>(initialDate);
  const [state, setState] = useState<FetchState>({ kind: "loading" });
  const [approving, setApproving] = useState(false);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState({ kind: "loading" });
    (async () => {
      try {
        const res = await fetch(
          `/api/day-plans/${encodeURIComponent(date)}`,
          { cache: "no-store" },
        );
        if (cancelled) return;
        if (res.status === 404) {
          setState({ kind: "empty" });
          return;
        }
        if (!res.ok) {
          setState({
            kind: "error",
            message: `Could not load the day plan (${res.status}). Please retry.`,
          });
          return;
        }
        const body = (await res.json()) as DayPlan;
        if (cancelled) return;
        setState({ kind: "ready", plan: body });
      } catch {
        if (!cancelled) {
          setState({
            kind: "error",
            message: "Network error. Check your connection and try again.",
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [date, retryToken]);

  async function approve() {
    if (state.kind !== "ready") return;
    setApproving(true);
    try {
      const res = await fetch(
        `/api/day-plans/${encodeURIComponent(date)}/approve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        },
      );
      if (res.status === 409) {
        // Plan expired between page load and click. Re-fetch so the FE
        // shows the terminal expired banner instead of a stale Approve
        // button.
        setRetryToken((t) => t + 1);
        return;
      }
      if (!res.ok) {
        setState({
          kind: "error",
          message: `Approval failed (${res.status}). Please retry.`,
        });
        return;
      }
      const updated = (await res.json()) as DayPlan;
      setState({ kind: "ready", plan: updated });
    } catch {
      setState({
        kind: "error",
        message: "Network error during approval. Try again.",
      });
    } finally {
      setApproving(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl p-4 pb-32 sm:p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Dispatch</h1>
        <p
          className="mt-1 text-sm"
          style={{ color: "var(--text-muted)" }}
          data-testid="dispatch-date"
        >
          {formatHumanDate(date)}
        </p>
      </header>

      {state.kind === "loading" && (
        <div
          className="rounded-md border p-6 text-sm"
          style={{ borderColor: "var(--border-soft)", color: "var(--text-muted)" }}
          data-testid="dispatch-loading"
        >
          Loading plan...
        </div>
      )}

      {state.kind === "empty" && (
        <div
          className="rounded-md border p-6 text-sm"
          style={{ borderColor: "var(--border-soft)" }}
          data-testid="dispatch-empty"
        >
          <p className="font-medium">No plan for {formatHumanDate(date)}.</p>
          <p className="mt-2" style={{ color: "var(--text-muted)" }}>
            Endall generates the next plan tonight at 10pm.
          </p>
        </div>
      )}

      {state.kind === "error" && (
        <div
          className="rounded-md border p-6 text-sm"
          style={{ borderColor: "var(--border-soft)" }}
          data-testid="dispatch-error"
        >
          <p>{state.message}</p>
          <button
            type="button"
            onClick={() => setRetryToken((t) => t + 1)}
            className="mt-3 rounded-md border px-3 py-1.5 text-sm"
            style={{ borderColor: "var(--border-soft)" }}
          >
            Retry
          </button>
        </div>
      )}

      {state.kind === "ready" && (
        <DayPlanView
          plan={state.plan}
          approving={approving}
          onApprove={approve}
        />
      )}
    </div>
  );
}

function DayPlanView({
  plan,
  approving,
  onApprove,
}: {
  plan: DayPlan;
  approving: boolean;
  onApprove: () => void;
}) {
  const summaries = plan.job_summaries || {};

  if (plan.status === "expired") {
    return (
      <div
        className="rounded-md border p-6 text-sm"
        style={{ borderColor: "var(--border-soft)" }}
        data-testid="dispatch-expired"
      >
        <p className="font-medium">This plan expired at 6am.</p>
        <p className="mt-2" style={{ color: "var(--text-muted)" }}>
          Yesterday&apos;s assignments are in effect.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 flex items-center gap-2" data-testid="dispatch-status">
        <StatusBadge status={plan.status} />
        {plan.expand_partial && (
          <span
            className="text-xs"
            style={{ color: "var(--text-muted)" }}
            data-testid="dispatch-partial-warning"
          >
            Some details could not be loaded.
          </span>
        )}
      </div>

      <div className="space-y-4">
        {plan.tech_assignments.length === 0 ? (
          <div
            className="rounded-md border p-6 text-sm"
            style={{ borderColor: "var(--border-soft)" }}
            data-testid="dispatch-no-assignments"
          >
            <p style={{ color: "var(--text-muted)" }}>
              No technician assignments on this plan yet.
            </p>
          </div>
        ) : (
          plan.tech_assignments.map((entry, idx) => (
            <TechSection
              key={entry.tech_id || `tech-${idx}`}
              entry={entry}
              summaries={summaries}
            />
          ))
        )}
      </div>

      {plan.status === "proposed" && (
        <div
          className="fixed inset-x-0 bottom-0 border-t p-4 sm:static sm:mt-8 sm:border-t-0 sm:p-0"
          style={{
            borderColor: "var(--border-soft)",
            background: "var(--surface-canvas)",
          }}
        >
          <button
            type="button"
            onClick={onApprove}
            disabled={approving}
            className="w-full rounded-md px-4 py-3 text-sm font-medium sm:w-auto"
            style={{
              background: "var(--accent-primary)",
              color: "var(--on-accent)",
              opacity: approving ? 0.6 : 1,
            }}
            data-testid="dispatch-approve"
          >
            {approving ? "Approving..." : "Approve plan"}
          </button>
        </div>
      )}
    </>
  );
}

function StatusBadge({ status }: { status: DayPlan["status"] }) {
  const label =
    status === "approved"
      ? "Approved"
      : status === "overridden"
        ? "Overridden"
        : status === "expired"
          ? "Expired"
          : "Proposed";
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs"
      style={{
        background: "var(--overlay-soft)",
        color: "var(--text-primary)",
      }}
      data-testid="dispatch-status-badge"
    >
      {label}
    </span>
  );
}

function TechSection({
  entry,
  summaries,
}: {
  entry: TechAssignment;
  summaries: Record<string, JobSummary>;
}) {
  const sequence =
    entry.sequence_order && entry.sequence_order.length > 0
      ? entry.sequence_order
      : entry.job_ids;
  return (
    <section
      className="rounded-md border p-4"
      style={{ borderColor: "var(--border-soft)" }}
      data-testid="dispatch-tech-section"
    >
      <header className="mb-3 flex items-baseline justify-between">
        <h2 className="text-lg font-medium">
          {entry.tech_name || "Unassigned tech"}
        </h2>
        {typeof entry.travel_minutes_estimated === "number" && (
          <span
            className="text-xs"
            style={{ color: "var(--text-muted)" }}
          >
            {entry.travel_minutes_estimated} min travel
          </span>
        )}
      </header>
      {sequence.length === 0 ? (
        <p
          className="text-sm"
          style={{ color: "var(--text-muted)" }}
        >
          No jobs assigned.
        </p>
      ) : (
        <ol className="space-y-2">
          {sequence.map((jid, i) => {
            const summary = summaries[jid];
            return (
              <li
                key={jid}
                className="flex items-start gap-3 text-sm"
                data-testid="dispatch-job-row"
              >
                <span
                  className="mt-0.5 inline-block min-w-6 text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  {i + 1}.
                </span>
                <div className="flex-1">
                  <div className="font-medium">
                    {summary?.title || "Untitled job"}
                  </div>
                  <div
                    className="text-xs"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {summary?.customer_name || "Customer not loaded"}
                    {summary?.address ? ` (${summary.address})` : ""}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
