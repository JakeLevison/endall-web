"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { posthog } from "@/lib/posthog";

export type InvoiceJobSummary = {
  job_id: string;
  caller_name: string | null;
  job_type: string | null;
  preferred_date: string | null;
};

type QbConnState =
  | { connected: false }
  | { connected: true; auto_push_enabled: boolean };

type QbInvoiceState = {
  qb_invoice_id: string | null;
  qb_push_error: string | null;
};

type Generated = {
  invoice_id: string;
  invoice_number: string;
};

export function InvoiceModal({
  job,
  open,
  onClose,
  onGenerated,
}: {
  job: InvoiceJobSummary;
  open: boolean;
  onClose: () => void;
  onGenerated?: (filename: string, downloadUrl: string) => void;
}) {
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [dueDays, setDueDays] = useState(30);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [generated, setGenerated] = useState<Generated | null>(null);
  const [qbConn, setQbConn] = useState<QbConnState | null>(null);
  const [qbState, setQbState] = useState<QbInvoiceState>({
    qb_invoice_id: null,
    qb_push_error: null,
  });
  const [pushing, setPushing] = useState(false);
  const toastedFor = useRef<{ pushed: string | null; error: string | null }>({
    pushed: null,
    error: null,
  });

  const reset = useCallback(() => {
    setAmount("");
    setMemo("");
    setDueDays(30);
    setSubmitting(false);
    setError(null);
    setGenerated(null);
    setQbConn(null);
    setQbState({ qb_invoice_id: null, qb_push_error: null });
    setPushing(false);
    toastedFor.current = { pushed: null, error: null };
  }, []);

  // Fire one toast per distinct outcome so the contractor sees push status
  // even if their attention is elsewhere when the polling settles. Tracking
  // the last-toasted value prevents duplicate toasts across re-renders.
  useEffect(() => {
    if (
      qbState.qb_invoice_id &&
      toastedFor.current.pushed !== qbState.qb_invoice_id
    ) {
      toastedFor.current.pushed = qbState.qb_invoice_id;
      toast.success(
        `Pushed to QuickBooks, invoice ${qbState.qb_invoice_id}`,
      );
    }
    if (
      qbState.qb_push_error &&
      !qbState.qb_invoice_id &&
      toastedFor.current.error !== qbState.qb_push_error
    ) {
      toastedFor.current.error = qbState.qb_push_error;
      toast.error(`QuickBooks push failed: ${qbState.qb_push_error}`);
    }
  }, [qbState.qb_invoice_id, qbState.qb_push_error]);

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  // After generation, fetch QB connection status then poll the invoice qb
  // fields up to 5 times (1s interval) to catch the background auto-push.
  useEffect(() => {
    if (!generated) return;
    let cancelled = false;

    async function loadStatus() {
      try {
        const res = await fetch("/api/quickbooks/status", { cache: "no-store" });
        if (!res.ok) {
          if (!cancelled) setQbConn({ connected: false });
          return;
        }
        const body = await res.json();
        if (cancelled) return;
        if (body.connected) {
          setQbConn({
            connected: true,
            auto_push_enabled: body.auto_push_enabled !== false,
          });
        } else {
          setQbConn({ connected: false });
        }
      } catch {
        if (!cancelled) setQbConn({ connected: false });
      }
    }

    async function pollInvoice() {
      if (!generated) return;
      for (let i = 0; i < 5; i += 1) {
        if (cancelled) return;
        try {
          const res = await fetch(
            `/api/quickbooks/invoices/${encodeURIComponent(generated.invoice_id)}/status`,
            { cache: "no-store" },
          );
          if (res.ok) {
            const body = await res.json();
            if (cancelled) return;
            setQbState({
              qb_invoice_id: body.qb_invoice_id || null,
              qb_push_error: body.qb_push_error || null,
            });
            if (body.qb_invoice_id || body.qb_push_error) return;
          }
        } catch {
          // swallow; next iteration retries
        }
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    loadStatus();
    pollInvoice();
    return () => {
      cancelled = true;
    };
  }, [generated]);

  if (!open) return null;

  const amountNum = parseFloat(amount);
  const valid = !Number.isNaN(amountNum) && amountNum > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) {
      setError("Amount is required and must be greater than 0.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const resp = await fetch("/api/invoices/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_id: job.job_id,
          amount: amountNum,
          memo: memo || null,
          due_days: dueDays,
        }),
      });
      if (!resp.ok) throw new Error(`status ${resp.status}`);
      const body = await resp.json();
      posthog.capture("invoice_generated", {
        job_id: job.job_id,
        amount: amountNum,
        due_days: dueDays,
      });
      const downloadUrl: string = body.download_url;
      const filename: string = body.filename;
      if (typeof window !== "undefined") {
        const base =
          process.env.NEXT_PUBLIC_BRIDGE_URL ||
          "https://ask-endall-bridge-production.up.railway.app";
        const fullUrl = downloadUrl.startsWith("http")
          ? downloadUrl
          : `${base}${downloadUrl}`;
        const a = document.createElement("a");
        a.href = fullUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
      onGenerated?.(filename, downloadUrl);
      if (body.invoice_id) {
        setGenerated({
          invoice_id: body.invoice_id,
          invoice_number: body.invoice_number,
        });
      } else {
        onClose();
      }
    } catch (err) {
      console.error("invoice generate failed:", err);
      setError("Could not generate invoice. Try again or email jake@endall.ai");
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePush() {
    if (!generated) return;
    setPushing(true);
    try {
      const resp = await fetch(
        `/api/quickbooks/invoices/${encodeURIComponent(generated.invoice_id)}/push`,
        { method: "POST" },
      );
      const body = await resp.json().catch(() => ({}));
      if (resp.ok && body.status === "pushed") {
        setQbState({
          qb_invoice_id: body.qb_invoice_id || null,
          qb_push_error: null,
        });
      } else {
        setQbState({
          qb_invoice_id: null,
          qb_push_error: body?.detail || `push failed (${resp.status})`,
        });
      }
    } catch (err) {
      setQbState({
        qb_invoice_id: null,
        qb_push_error: (err as Error).message || "push failed",
      });
    } finally {
      setPushing(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-label="Generate invoice"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="rounded-lg border p-5 w-full max-w-md space-y-3"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
          color: "var(--text-primary)",
        }}
      >
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-[14px] font-medium">
            {generated ? "Invoice generated" : "Generate invoice"}
          </h2>
          {generated && qbState.qb_invoice_id ? (
            <span
              data-testid="qb-header-pushed-badge"
              className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium"
              style={{
                background: "rgba(16, 185, 129, 0.15)",
                color: "#10b981",
                border: "1px solid rgba(16, 185, 129, 0.4)",
              }}
            >
              Pushed to QuickBooks, invoice {qbState.qb_invoice_id}
            </span>
          ) : null}
        </div>
        <div
          className="rounded-md border p-3 text-[12px] space-y-0.5"
          style={{
            background: "var(--overlay-soft)",
            borderColor: "var(--border)",
            color: "var(--text-tertiary)",
          }}
        >
          <div>
            <span className="text-[var(--text-muted)]">Caller: </span>
            {job.caller_name || "Unknown"}
          </div>
          <div>
            <span className="text-[var(--text-muted)]">Job: </span>
            {job.job_type || "Unspecified"}
          </div>
          <div>
            <span className="text-[var(--text-muted)]">Scheduled: </span>
            {job.preferred_date || "n/a"}
          </div>
        </div>

        {!generated && (
          <>
            <label className="block text-[12px] space-y-1">
              <span className="text-[var(--text-tertiary)]">Amount ($)</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-md border px-2 py-1.5 text-[13px]"
                style={{
                  background: "var(--overlay-soft)",
                  borderColor: "var(--border)",
                  color: "var(--text-primary)",
                }}
              />
            </label>

            <label className="block text-[12px] space-y-1">
              <span className="text-[var(--text-tertiary)]">Memo (optional)</span>
              <input
                type="text"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="What was the work? Leave blank to use job type."
                className="w-full rounded-md border px-2 py-1.5 text-[13px]"
                style={{
                  background: "var(--overlay-soft)",
                  borderColor: "var(--border)",
                  color: "var(--text-primary)",
                }}
              />
            </label>

            <label className="block text-[12px] space-y-1">
              <span className="text-[var(--text-tertiary)]">Due in</span>
              <select
                value={dueDays}
                onChange={(e) => setDueDays(parseInt(e.target.value, 10))}
                className="w-full rounded-md border px-2 py-1.5 text-[13px]"
                style={{
                  background: "var(--overlay-soft)",
                  borderColor: "var(--border)",
                  color: "var(--text-primary)",
                }}
              >
                <option value={15}>15 days</option>
                <option value={30}>30 days</option>
                <option value={45}>45 days</option>
                <option value={60}>60 days</option>
              </select>
            </label>
          </>
        )}

        {generated && !qbState.qb_invoice_id && qbState.qb_push_error && (
          <div
            role="alert"
            data-testid="qb-push-error-banner"
            className="rounded-md border p-3 text-[12px] space-y-2"
            style={{
              background: "rgba(239, 68, 68, 0.1)",
              borderColor: "rgba(239, 68, 68, 0.5)",
              color: "#ef4444",
            }}
          >
            <div className="font-medium">
              QuickBooks push failed: {qbState.qb_push_error}
            </div>
            <button
              type="button"
              data-testid="qb-retry-button"
              onClick={handlePush}
              disabled={pushing}
              className="rounded-md px-2 py-1 text-[11px] font-medium border"
              style={{
                borderColor: "rgba(239, 68, 68, 0.5)",
                color: "#ef4444",
                background: "transparent",
                opacity: pushing ? 0.6 : 1,
              }}
            >
              {pushing ? "Retrying..." : "Retry push"}
            </button>
          </div>
        )}

        {generated && (
          <div
            data-testid="qb-push-area"
            className="rounded-md border p-3 text-[12px] space-y-2"
            style={{
              background: "var(--overlay-soft)",
              borderColor: "var(--border)",
            }}
          >
            <div className="text-[var(--text-tertiary)]">
              Invoice <strong>{generated.invoice_number}</strong> created.
            </div>
            {!qbState.qb_invoice_id &&
              !qbState.qb_push_error &&
              qbConn?.connected && (
                <button
                  type="button"
                  data-testid="qb-push-button"
                  onClick={handlePush}
                  disabled={pushing}
                  className="rounded-md px-2 py-1 text-[11px] font-medium"
                  style={{
                    background: "#3b82f6",
                    color: "white",
                    opacity: pushing ? 0.6 : 1,
                  }}
                >
                  {pushing ? "Pushing..." : "Push to QuickBooks"}
                </button>
              )}
            {!qbState.qb_invoice_id &&
              !qbState.qb_push_error &&
              qbConn &&
              !qbConn.connected && (
                <div
                  data-testid="qb-not-connected"
                  className="text-[11px] text-[var(--text-muted)]"
                >
                  Connect QuickBooks in{" "}
                  <a
                    href="/settings/integrations"
                    className="underline"
                  >
                    Settings
                  </a>{" "}
                  to enable push.
                </div>
              )}
          </div>
        )}

        {error ? (
          <p role="alert" className="text-[12px]" style={{ color: "#ef4444" }}>
            {error}
          </p>
        ) : null}

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-3 py-1.5 text-[12px] border"
            style={{
              borderColor: "var(--border)",
              color: "var(--text-tertiary)",
              background: "transparent",
            }}
          >
            {generated ? "Close" : "Cancel"}
          </button>
          {!generated && (
            <button
              type="submit"
              disabled={submitting || !valid}
              className="rounded-md px-3 py-1.5 text-[12px] font-medium"
              style={{
                background: "var(--brand-accent-light)",
                color: "#1a1a1a",
                opacity: submitting || !valid ? 0.6 : 1,
              }}
            >
              {submitting ? "Generating..." : "Generate invoice"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
