"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { DayPlanView } from "./components/DayPlanView";
import { OverrideEditor } from "./components/OverrideEditor";
import type { DayPlan, OverrideRequest } from "./types";

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
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

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

  function enterEditMode() {
    setEditError(null);
    setMode("edit");
  }

  function cancelEditMode() {
    setEditError(null);
    setMode("view");
  }

  async function saveOverride(req: OverrideRequest) {
    if (state.kind !== "ready") return;
    setSaving(true);
    setEditError(null);
    try {
      const res = await fetch(
        `/api/day-plans/${encodeURIComponent(date)}/override`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(req),
        },
      );
      if (res.status === 409) {
        // Race with 6am expiry. Exit edit mode and refetch so the
        // terminal expired banner renders.
        setMode("view");
        setRetryToken((t) => t + 1);
        return;
      }
      if (!res.ok) {
        // 5xx and other errors: stay in edit mode so drafts are
        // preserved; surface the error inline.
        setEditError(`Save failed (${res.status}). Please retry.`);
        return;
      }
      // 200: backend response is the un-expanded DayPlanOut shape (no
      // tech_name / job_summaries on the override route). Exit edit mode
      // and refetch via GET ?expand=true to repopulate the joins.
      setMode("view");
      setRetryToken((t) => t + 1);
    } catch {
      setEditError("Network error during save. Try again.");
    } finally {
      setSaving(false);
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

      {state.kind === "ready" && mode === "view" && (
        <DayPlanView
          plan={state.plan}
          approving={approving}
          onApprove={approve}
          onOverride={enterEditMode}
        />
      )}

      {state.kind === "ready" && mode === "edit" && (
        <OverrideEditor
          plan={state.plan}
          saving={saving}
          errorMessage={editError}
          onSave={saveOverride}
          onCancel={cancelEditMode}
        />
      )}
    </div>
  );
}
