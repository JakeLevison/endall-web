"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export type DraftPrepareResponse = {
  status: "draft_prepared";
  approval_id: string;
  approval_url: string;
  draft: { to: string; subject: string; body: string };
  pdf_storage_path: string | null;
  expires_at: string;
};

type Props = {
  /** The estimate to send. */
  estimateId: string;
  /** Controls visibility. Parent owns the open/close state. */
  open: boolean;
  /** Called after a successful confirm or after the user closes the modal. */
  onClose: (sent: boolean) => void;
};

type ModalState =
  | { kind: "preparing" }
  | { kind: "ready"; draft: DraftPrepareResponse }
  | { kind: "sending"; draft: DraftPrepareResponse }
  | { kind: "error"; message: string };

/**
 * Two-step send flow: POST /send to mint the draft + token, show it,
 * POST /send/confirm to actually dispatch the email. The user can edit
 * the draft fields in between.
 *
 * 409 from /send/confirm means a concurrent confirm already shipped this
 * approval row. We close the modal and show an info toast , the
 * contractor's UI should refetch the estimate status separately.
 */
export function EmailDraftReviewModal({ estimateId, open, onClose }: Props) {
  const [state, setState] = useState<ModalState>({ kind: "preparing" });
  const [draftEdits, setDraftEdits] = useState<{
    to: string;
    subject: string;
    body: string;
  } | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setState({ kind: "preparing" });
    setDraftEdits(null);

    (async () => {
      try {
        const res = await fetch(
          `/api/estimates/${encodeURIComponent(estimateId)}/send`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
          },
        );
        if (cancelled) return;
        if (res.status === 409) {
          // Backend signal: contractor must connect Gmail first.
          const detail = await res.json().catch(() => ({}));
          setState({
            kind: "error",
            message:
              (detail as { detail?: string }).detail ||
              "Connect Gmail in Settings before sending.",
          });
          return;
        }
        if (!res.ok) {
          setState({
            kind: "error",
            message: `Could not prepare the draft (${res.status}).`,
          });
          return;
        }
        const draft = (await res.json()) as DraftPrepareResponse;
        setDraftEdits({
          to: draft.draft.to,
          subject: draft.draft.subject,
          body: draft.draft.body,
        });
        setState({ kind: "ready", draft });
      } catch (err) {
        if (cancelled) return;
        setState({
          kind: "error",
          message: (err as Error).message || "network error",
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [estimateId, open]);

  const handleSend = useCallback(async () => {
    if (state.kind !== "ready" || !draftEdits) return;
    if (!draftEdits.to || !draftEdits.subject || !draftEdits.body) {
      toast.error("Recipient, subject, and body are all required.");
      return;
    }
    setState({ kind: "sending", draft: state.draft });
    try {
      const res = await fetch(
        `/api/estimates/${encodeURIComponent(estimateId)}/send/confirm`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            approval_id: state.draft.approval_id,
            to: draftEdits.to,
            subject: draftEdits.subject,
            body: draftEdits.body,
          }),
        },
      );
      if (res.status === 409) {
        toast.message("This estimate was already sent.");
        onClose(true);
        return;
      }
      if (res.status === 401) {
        toast.error(
          "Gmail authorization expired. Reconnect Gmail in Settings.",
        );
        onClose(false);
        return;
      }
      if (!res.ok) {
        const detail = await res.json().catch(() => ({}));
        toast.error(
          (detail as { detail?: string }).detail ||
            `Send failed (${res.status}).`,
        );
        setState({ kind: "ready", draft: state.draft });
        return;
      }
      toast.success("Estimate sent. Customer will receive it shortly.");
      onClose(true);
    } catch (err) {
      toast.error((err as Error).message || "network error");
      setState({ kind: "ready", draft: state.draft });
    }
  }, [draftEdits, estimateId, onClose, state]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      data-testid="email-draft-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <div className="w-full max-w-2xl overflow-hidden rounded-lg bg-white shadow-lg dark:bg-neutral-900">
        <header className="border-b border-black/5 p-5 dark:border-white/10">
          <h2 className="text-base font-medium text-neutral-900 dark:text-neutral-100">
            Review and send estimate
          </h2>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            This sends from your Gmail. The customer replies to you, not Endall.
          </p>
        </header>

        <div className="max-h-[60vh] overflow-y-auto p-5">
          {state.kind === "preparing" ? (
            <p
              data-testid="email-draft-loading"
              className="text-sm text-neutral-500"
            >
              Preparing draft…
            </p>
          ) : null}

          {state.kind === "error" ? (
            <p
              role="alert"
              data-testid="email-draft-error"
              className="text-sm text-red-600 dark:text-red-400"
            >
              {state.message}
            </p>
          ) : null}

          {(state.kind === "ready" || state.kind === "sending") &&
          draftEdits ? (
            <div className="flex flex-col gap-3 text-sm">
              <label className="flex flex-col gap-1">
                <span className="text-xs uppercase tracking-wide text-neutral-500">
                  To
                </span>
                <input
                  type="email"
                  data-testid="email-draft-to"
                  value={draftEdits.to}
                  onChange={(e) =>
                    setDraftEdits({ ...draftEdits, to: e.target.value })
                  }
                  className="rounded-md border border-black/10 bg-white p-2 dark:border-white/10 dark:bg-black/30 dark:text-neutral-100"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs uppercase tracking-wide text-neutral-500">
                  Subject
                </span>
                <input
                  type="text"
                  data-testid="email-draft-subject"
                  value={draftEdits.subject}
                  onChange={(e) =>
                    setDraftEdits({ ...draftEdits, subject: e.target.value })
                  }
                  className="rounded-md border border-black/10 bg-white p-2 dark:border-white/10 dark:bg-black/30 dark:text-neutral-100"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs uppercase tracking-wide text-neutral-500">
                  Body
                </span>
                <textarea
                  data-testid="email-draft-body"
                  value={draftEdits.body}
                  rows={10}
                  onChange={(e) =>
                    setDraftEdits({ ...draftEdits, body: e.target.value })
                  }
                  className="rounded-md border border-black/10 bg-white p-2 font-mono text-sm dark:border-white/10 dark:bg-black/30 dark:text-neutral-100"
                />
              </label>
              {state.draft.pdf_storage_path ? (
                <p
                  data-testid="email-draft-attachment"
                  className="text-xs text-neutral-500"
                >
                  Attachment: {state.draft.pdf_storage_path.split("/").pop()}
                </p>
              ) : (
                <p className="text-xs text-amber-600">
                  PDF rendering is pending. The customer will receive a link
                  to view the estimate online.
                </p>
              )}
              <p className="text-xs text-neutral-500">
                Approval link: {state.draft.approval_url}
              </p>
            </div>
          ) : null}
        </div>

        <footer className="flex justify-end gap-2 border-t border-black/5 bg-neutral-50 p-4 dark:border-white/10 dark:bg-white/5">
          <button
            type="button"
            data-testid="email-draft-cancel"
            onClick={() => onClose(false)}
            disabled={state.kind === "sending"}
            className="rounded-md border border-black/10 px-3 py-2 text-sm dark:border-white/15 dark:text-neutral-100"
          >
            Cancel
          </button>
          <button
            type="button"
            data-testid="email-draft-send"
            onClick={handleSend}
            disabled={state.kind !== "ready"}
            className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
          >
            {state.kind === "sending" ? "Sending…" : "Send"}
          </button>
        </footer>
      </div>
    </div>
  );
}

/**
 * Helper for the "Send estimate" button on a contractor estimate page. Uses
 * the Gmail status endpoint to gate. Renders a button that opens the modal
 * when Gmail is connected, or a disabled tooltip-bearing button otherwise.
 */
export function SendEstimateButton({ estimateId }: { estimateId: string }) {
  const [gmailConnected, setGmailConnected] = useState<boolean | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/oauth/gmail/status", {
          cache: "no-store",
        });
        if (!res.ok) {
          if (!cancelled) setGmailConnected(false);
          return;
        }
        const body = (await res.json()) as { connected: boolean; status?: string };
        if (!cancelled) {
          setGmailConnected(body.connected && body.status !== "reauth_required");
        }
      } catch {
        if (!cancelled) setGmailConnected(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const disabled = gmailConnected !== true;

  return (
    <>
      <button
        type="button"
        data-testid="send-estimate"
        onClick={() => setOpen(true)}
        disabled={disabled}
        title={
          disabled
            ? "Connect Gmail in Settings to send estimates."
            : "Send this estimate to the customer"
        }
        className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
      >
        Send estimate
      </button>
      <EmailDraftReviewModal
        estimateId={estimateId}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
