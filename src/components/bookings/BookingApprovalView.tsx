"use client";

/**
 * Customer-facing booking-confirmation view (migration 087, chief-of-staff
 * feat/email-pipeline). Rendered by the shared /approve/{token} page when
 * the bridge resolver returns kind === "booking".
 *
 * Two actions, no new dependencies (plain React + Tailwind, mirroring
 * CustomerApprovalView):
 *   - Confirm  -> POST /api/public/booking/{token}/confirm
 *   - Reschedule -> weekday picker (next 14 days, weekends skipped) ->
 *                   POST /api/public/booking/{token}/reschedule
 */

import * as React from "react";
import { useMemo, useState } from "react";
import type { PublicBookingMeta } from "@/lib/approval-bridge";

type Props = {
  token: string;
  initial: PublicBookingMeta;
};

function formatWhen(iso: string | null | undefined): string {
  if (!iso) return "the requested time";
  try {
    return new Date(iso).toLocaleString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function formatDay(iso: string): string {
  try {
    return new Date(`${iso}T12:00:00`).toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

// Next 14 calendar days, weekends dropped, as YYYY-MM-DD strings. Mirrors
// the bridge's server-side validation so the customer never picks a date
// the bridge will reject.
function nextWeekdays(): string[] {
  const out: string[] = [];
  const now = new Date();
  for (let i = 1; i <= 14; i += 1) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    const dow = d.getDay();
    if (dow === 0 || dow === 6) continue;
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

export function BookingApprovalView({ token, initial }: Props) {
  const decided = initial.decision;
  const [status, setStatus] = useState<
    "idle" | "confirmed" | "rescheduled"
  >(decided === "confirmed" ? "confirmed" : decided === "rescheduled" ? "rescheduled" : "idle");
  const [scheduledAt, setScheduledAt] = useState<string | null | undefined>(
    initial.scheduled_at,
  );
  const [mode, setMode] = useState<"summary" | "reschedule">("summary");
  const [picked, setPicked] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tenantName = initial.tenant_name || "Your contractor";
  const weekdays = useMemo(() => nextWeekdays(), []);

  async function doConfirm() {
    setBusy(true);
    setError(null);
    try {
      const resp = await fetch(
        `/api/public/booking/${encodeURIComponent(token)}/confirm`,
        { method: "POST", cache: "no-store" },
      );
      if (!resp.ok) {
        setError("We could not confirm that. Please call us instead.");
        return;
      }
      const data = (await resp.json()) as { scheduled_at?: string | null };
      setScheduledAt(data.scheduled_at ?? scheduledAt);
      setStatus("confirmed");
    } catch {
      setError("We could not confirm that. Please call us instead.");
    } finally {
      setBusy(false);
    }
  }

  async function doReschedule() {
    if (!picked) {
      setError("Pick a new date first.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const resp = await fetch(
        `/api/public/booking/${encodeURIComponent(token)}/reschedule`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ new_date: picked }),
          cache: "no-store",
        },
      );
      if (!resp.ok) {
        setError("That date did not work. Please pick another.");
        return;
      }
      const data = (await resp.json()) as { scheduled_at?: string | null };
      setScheduledAt(data.scheduled_at ?? picked);
      setStatus("rescheduled");
      setMode("summary");
    } catch {
      setError("That date did not work. Please pick another.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-wide text-blue-600">
          {tenantName}
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-gray-900">
          {status === "confirmed"
            ? "You're all set"
            : status === "rescheduled"
              ? "Your appointment was updated"
              : "Confirm your appointment"}
        </h1>

        <dl className="mt-6 space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-gray-500">Service</dt>
            <dd className="font-medium text-gray-900">
              {initial.job_type || "Service visit"}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-gray-500">When</dt>
            <dd className="font-medium text-gray-900">
              {formatWhen(scheduledAt)}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-gray-500">Where</dt>
            <dd className="font-medium text-gray-900">
              {initial.job_address || "The address on file"}
            </dd>
          </div>
          {initial.tenant_phone ? (
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">Questions?</dt>
              <dd className="font-medium text-gray-900">
                {initial.tenant_phone}
              </dd>
            </div>
          ) : null}
        </dl>

        {error ? (
          <p className="mt-5 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        {status === "confirmed" ? (
          <p className="mt-6 rounded-md bg-green-50 px-4 py-3 text-sm text-green-800">
            Confirmed. We&apos;ll see you on {formatWhen(scheduledAt)}.
          </p>
        ) : status === "rescheduled" ? (
          <p className="mt-6 rounded-md bg-green-50 px-4 py-3 text-sm text-green-800">
            Updated. Your appointment is now {formatWhen(scheduledAt)}.
          </p>
        ) : mode === "summary" ? (
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={doConfirm}
              disabled={busy}
              className="flex-1 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {busy ? "Confirming..." : "Confirm this appointment"}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("reschedule");
                setError(null);
              }}
              disabled={busy}
              className="flex-1 rounded-lg border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              Need to reschedule?
            </button>
          </div>
        ) : (
          <div className="mt-7">
            <p className="mb-3 text-sm font-medium text-gray-700">
              Pick a new day:
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {weekdays.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setPicked(d)}
                  className={`rounded-md border px-3 py-2 text-sm ${
                    picked === d
                      ? "border-blue-600 bg-blue-50 font-semibold text-blue-700"
                      : "border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {formatDay(d)}
                </button>
              ))}
            </div>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={doReschedule}
                disabled={busy || !picked}
                className="flex-1 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {busy ? "Updating..." : "Confirm new date"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("summary");
                  setPicked("");
                  setError(null);
                }}
                disabled={busy}
                className="rounded-lg border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              >
                Back
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
