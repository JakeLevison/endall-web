"use client";

import * as React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import type SignatureCanvasType from "react-signature-canvas";
import { CommentThread } from "./CommentThread";

// react-signature-canvas reaches for `window` on import; gate the load so
// SSR never executes that path. The component is already "use client",
// so this only suppresses the initial server render.
type SignatureCanvasComponent = React.ComponentType<{
  ref?: (instance: SignatureCanvasType | null) => void;
  penColor?: string;
  canvasProps?: React.CanvasHTMLAttributes<HTMLCanvasElement>;
}>;

export type LineItem = {
  id: string;
  order_index: number;
  category: string | null;
  name: string | null;
  description: string | null;
  quantity: number;
  unit: string;
  unit_price: number;
  extended: number;
};

export type DecisionState =
  | null
  | { kind: "approved"; at: string }
  | { kind: "rejected"; at: string; reason?: string | null };

export type PublicEstimate = {
  estimate_id: string;
  estimate_number: string;
  status: string;
  customer_name: string | null;
  customer_email: string | null;
  project_address: string | null;
  project_description: string;
  payment_terms: string;
  timeline_weeks: number;
  valid_until: string | null;
  grand_total: number;
  line_items: LineItem[];
  pdf_storage_path: string | null;
  decision: DecisionState;
};

type Props = {
  token: string;
  initial: PublicEstimate;
  /** Tenant display label rendered in the contractor brand strip. */
  tenantLabel: string;
};

function formatUSD(n: number): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(n);
  } catch {
    return `$${n.toFixed(2)}`;
  }
}

function formatStamp(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function CustomerApprovalView({ token, initial, tenantLabel }: Props) {
  const [estimate, setEstimate] = useState<PublicEstimate>(initial);
  const [decision, setDecision] = useState<DecisionState>(initial.decision);
  const [submitting, setSubmitting] = useState(false);
  const [genericError, setGenericError] = useState<string | null>(null);
  const [confirmingReject, setConfirmingReject] = useState(false);
  const [signedName, setSignedName] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const sigPadRef = useRef<SignatureCanvasType | null>(null);
  const [SignatureCanvas, setSignatureCanvas] =
    useState<SignatureCanvasComponent | null>(null);

  useEffect(() => {
    let cancelled = false;
    import("react-signature-canvas").then((mod) => {
      if (!cancelled) {
        setSignatureCanvas(
          () => (mod.default || mod) as unknown as SignatureCanvasComponent,
        );
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const refetch = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/public/approval/${encodeURIComponent(token)}`,
        { cache: "no-store" },
      );
      if (!res.ok) return;
      const body = (await res.json()) as PublicEstimate;
      setEstimate(body);
      setDecision(body.decision);
    } catch (err) {
      console.error("refetch failed", err);
    }
  }, [token]);

  const handleApprove = useCallback(async () => {
    if (submitting) return;
    setGenericError(null);

    let signatureBlob: string | null = null;
    if (sigPadRef.current && !sigPadRef.current.isEmpty()) {
      try {
        signatureBlob = sigPadRef.current
          .getCanvas()
          .toDataURL("image/png");
      } catch {
        signatureBlob = null;
      }
    }
    if (!signatureBlob) {
      setGenericError("Please draw your signature before approving.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/public/approval/${encodeURIComponent(token)}/approve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            signature_blob: signatureBlob,
            signed_name: signedName || null,
          }),
        },
      );
      if (res.status === 404) {
        // Lost the race, already used, or expired.
        // Backend returns uniform 404. Refetch to render the truthful state.
        await refetch();
        return;
      }
      if (!res.ok) {
        setGenericError(`Could not approve right now. Please try again.`);
        return;
      }
      const body = (await res.json()) as { approved: true; approved_at: string };
      setDecision({ kind: "approved", at: body.approved_at });
    } catch (err) {
      setGenericError((err as Error).message || "network error");
    } finally {
      setSubmitting(false);
    }
  }, [refetch, signedName, submitting, token]);

  const handleReject = useCallback(async () => {
    if (submitting) return;
    setGenericError(null);
    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/public/approval/${encodeURIComponent(token)}/reject`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: rejectReason || null }),
        },
      );
      if (res.status === 404) {
        await refetch();
        return;
      }
      if (!res.ok) {
        setGenericError("Could not record rejection. Please try again.");
        return;
      }
      const body = (await res.json()) as { rejected: true; rejected_at: string };
      setDecision({ kind: "rejected", at: body.rejected_at, reason: rejectReason || null });
      setConfirmingReject(false);
    } catch (err) {
      setGenericError((err as Error).message || "network error");
    } finally {
      setSubmitting(false);
    }
  }, [refetch, rejectReason, submitting, token]);

  return (
    <div className="flex flex-col gap-6">
      <header className="border-b border-black/5 pb-4 dark:border-white/10">
        <p className="text-xs uppercase tracking-wide text-neutral-500">
          {tenantLabel}
        </p>
        <h1 className="mt-1 text-2xl font-medium text-neutral-900 dark:text-neutral-100">
          Estimate {estimate.estimate_number}
        </h1>
        {estimate.customer_name ? (
          <p className="mt-1 text-sm text-neutral-700 dark:text-neutral-300">
            For {estimate.customer_name}
          </p>
        ) : null}
        {estimate.project_address ? (
          <p className="text-sm text-neutral-500">{estimate.project_address}</p>
        ) : null}
      </header>

      {decision ? (
        <DecisionBanner decision={decision} />
      ) : (
        <p className="text-sm text-neutral-700 dark:text-neutral-300">
          Review the line items below. When you are ready, sign and approve, or
          let us know why you want to reject.
        </p>
      )}

      {estimate.project_description ? (
        <section className="rounded-lg border border-black/5 bg-white p-4 dark:border-white/10 dark:bg-white/5">
          <h2 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
            Scope of work
          </h2>
          <p className="mt-2 text-sm whitespace-pre-wrap text-neutral-800 dark:text-neutral-200">
            {estimate.project_description}
          </p>
        </section>
      ) : null}

      <section className="rounded-lg border border-black/5 bg-white p-4 dark:border-white/10 dark:bg-white/5">
        <h2 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
          Line items
        </h2>
        <ol
          data-testid="line-items"
          className="mt-3 flex flex-col gap-2 text-sm"
        >
          {estimate.line_items.length === 0 ? (
            <li className="text-xs text-neutral-500">
              No line items on this estimate.
            </li>
          ) : null}
          {estimate.line_items.map((row) => (
            <li
              key={row.id}
              className="flex items-baseline justify-between gap-3 border-b border-black/5 pb-2 dark:border-white/5"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-neutral-900 dark:text-neutral-100">
                  {row.name || row.category || "Line item"}
                </p>
                {row.description ? (
                  <p className="text-xs text-neutral-500">{row.description}</p>
                ) : null}
                <p className="text-xs text-neutral-400">
                  {row.quantity} {row.unit} × {formatUSD(row.unit_price)}
                </p>
              </div>
              <span className="font-medium tabular-nums text-neutral-900 dark:text-neutral-100">
                {formatUSD(row.extended)}
              </span>
            </li>
          ))}
        </ol>
        <div className="mt-4 flex items-baseline justify-between border-t border-black/10 pt-3 dark:border-white/15">
          <span className="text-sm text-neutral-700 dark:text-neutral-300">
            Total
          </span>
          <span
            data-testid="grand-total"
            className="text-lg font-medium tabular-nums text-neutral-900 dark:text-neutral-100"
          >
            {formatUSD(estimate.grand_total)}
          </span>
        </div>
        <p className="mt-2 text-xs text-neutral-500">
          Payment terms: {estimate.payment_terms.replace(/_/g, " ")}
          {estimate.timeline_weeks
            ? ` · Timeline ${estimate.timeline_weeks} weeks`
            : ""}
          {estimate.valid_until ? ` · Valid until ${estimate.valid_until}` : ""}
        </p>
      </section>

      {!decision ? (
        <section
          data-testid="signature-section"
          className="rounded-lg border border-black/5 bg-white p-4 dark:border-white/10 dark:bg-white/5"
        >
          <h2 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
            Sign to approve
          </h2>
          <p className="mt-1 text-xs text-neutral-500">
            Draw your signature in the box. Type your printed name underneath.
          </p>
          <div className="mt-3 rounded-md border border-black/10 bg-white dark:border-white/10 dark:bg-white">
            {SignatureCanvas ? (
              <SignatureCanvas
                ref={(ref: SignatureCanvasType | null) => {
                  sigPadRef.current = ref;
                }}
                penColor="#111111"
                canvasProps={
                  {
                    "data-testid": "signature-pad",
                    className: "block h-40 w-full",
                  } as React.CanvasHTMLAttributes<HTMLCanvasElement>
                }
              />
            ) : (
              <div
                data-testid="signature-pad"
                className="block h-40 w-full"
                aria-hidden="true"
              />
            )}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              data-testid="signature-clear"
              onClick={() => sigPadRef.current?.clear()}
              className="text-xs text-neutral-500 underline"
            >
              Clear
            </button>
          </div>
          <label className="mt-3 block text-xs text-neutral-700 dark:text-neutral-300">
            Printed name (optional)
            <input
              type="text"
              value={signedName}
              data-testid="signed-name"
              onChange={(e) => setSignedName(e.target.value.slice(0, 120))}
              maxLength={120}
              className="mt-1 block w-full rounded-md border border-black/10 bg-white p-2 text-sm dark:border-white/10 dark:bg-black/30 dark:text-neutral-100"
            />
          </label>

          {genericError ? (
            <p
              role="alert"
              data-testid="approval-error"
              className="mt-3 text-sm text-red-600 dark:text-red-400"
            >
              {genericError}
            </p>
          ) : null}

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              data-testid="reject-open"
              onClick={() => setConfirmingReject(true)}
              disabled={submitting}
              className="rounded-md border border-black/10 px-3 py-2 text-sm dark:border-white/15"
            >
              Reject
            </button>
            <button
              type="button"
              data-testid="approve-button"
              onClick={handleApprove}
              disabled={submitting}
              className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {submitting ? "Submitting…" : "Approve"}
            </button>
          </div>
        </section>
      ) : null}

      {confirmingReject ? (
        <RejectModal
          submitting={submitting}
          reason={rejectReason}
          onChange={setRejectReason}
          onCancel={() => setConfirmingReject(false)}
          onConfirm={handleReject}
        />
      ) : null}

      <CommentThread
        endpoint={`/api/public/approval/${encodeURIComponent(token)}/comments`}
        mode="read"
        title="Notes from your contractor"
      />
    </div>
  );
}

function DecisionBanner({ decision }: { decision: DecisionState }) {
  if (!decision) return null;
  if (decision.kind === "approved") {
    return (
      <div
        role="status"
        data-testid="decision-banner"
        className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200"
      >
        <p className="font-medium">Estimate approved.</p>
        <p className="mt-1 text-xs">
          Approved on {formatStamp(decision.at)}. Your contractor has been
          notified and will start scheduling.
        </p>
      </div>
    );
  }
  return (
    <div
      role="status"
      data-testid="decision-banner"
      className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-800 dark:border-white/15 dark:bg-white/5 dark:text-neutral-200"
    >
      <p className="font-medium">Estimate rejected.</p>
      <p className="mt-1 text-xs">
        Rejected on {formatStamp(decision.at)}.
        {decision.reason ? ` Reason: ${decision.reason}` : ""}
      </p>
    </div>
  );
}

function RejectModal({
  submitting,
  reason,
  onChange,
  onCancel,
  onConfirm,
}: {
  submitting: boolean;
  reason: string;
  onChange: (next: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      data-testid="reject-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-lg dark:bg-neutral-900">
        <h3 className="text-base font-medium text-neutral-900 dark:text-neutral-100">
          Reject this estimate?
        </h3>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Your contractor will see your response. You can include a reason so
          they can revise and resend.
        </p>
        <label className="mt-4 block text-sm">
          Reason (optional)
          <textarea
            data-testid="reject-reason"
            value={reason}
            onChange={(e) => onChange(e.target.value.slice(0, 1000))}
            rows={3}
            className="mt-1 block w-full rounded-md border border-black/10 bg-white p-2 text-sm dark:border-white/10 dark:bg-black/30 dark:text-neutral-100"
            placeholder="Why are you rejecting this estimate?"
          />
        </label>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="rounded-md border border-black/10 px-3 py-2 text-sm dark:border-white/15"
          >
            Cancel
          </button>
          <button
            type="button"
            data-testid="reject-confirm"
            onClick={onConfirm}
            disabled={submitting}
            className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Confirm rejection"}
          </button>
        </div>
      </div>
    </div>
  );
}
