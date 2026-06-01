"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type GmailStatus =
  | { connected: false; provider: string }
  | {
      connected: true;
      provider: string;
      account_email: string;
      connected_at: string;
      scope: string;
      status: "connected" | "reauth_required" | "disconnected";
      last_refresh_error: string | null;
    };

const ERROR_LABELS: Record<string, string> = {
  user_denied: "You declined access. Try again to connect Gmail.",
  app_testing_mode:
    "Endall's Gmail app is still in testing. Please contact support to add your email to the allowlist.",
  token_exchange_failed: "Google rejected the connection. Please try again.",
  invalid_state:
    "Connection link expired. Please start the connect flow again.",
  state_expired:
    "Connection link expired. Please start the connect flow again.",
  state_lookup_failed: "We couldn't verify the connection. Please retry.",
  database_unavailable: "Database is offline. Please retry shortly.",
  encryption_misconfigured:
    "Endall's secrets are misconfigured. Contact support.",
  no_access_token: "Google did not return an access token. Please retry.",
  persist_failed: "We couldn't save the connection. Please retry.",
  provider_deferred: "Outlook is not yet available. Try Gmail.",
  missing_params: "Connection link was malformed. Please start over.",
};

function readableError(code: string): string {
  return ERROR_LABELS[code] || `Gmail connection failed (${code}).`;
}

type CallbackFlags = {
  connected: string | null;
  error: string | null;
  provider: string | null;
};

function consumeUrlFlags(): CallbackFlags | null {
  if (typeof window === "undefined") return null;
  const url = new URL(window.location.href);
  const connected = url.searchParams.get("connected");
  const error = url.searchParams.get("error");
  const provider = url.searchParams.get("provider");
  if (!connected && !error) return null;

  url.searchParams.delete("connected");
  url.searchParams.delete("error");
  url.searchParams.delete("provider");
  url.searchParams.delete("admin_key");
  url.searchParams.delete("session_id");
  const next =
    url.pathname + (url.searchParams.toString() ? `?${url.searchParams}` : "");
  window.history.replaceState({}, "", next);
  return { connected, error, provider };
}

export function EmailIntegrationCard() {
  const [status, setStatus] = useState<GmailStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pendingFlags, setPendingFlags] = useState<CallbackFlags | null>(null);
  const flagsHandledRef = useRef(false);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/oauth/gmail/status", { cache: "no-store" });
      if (!res.ok) {
        setLoadError(`status request failed (${res.status})`);
        setStatus(null);
        return;
      }
      const body = (await res.json()) as GmailStatus;
      setStatus(body);
    } catch (err) {
      setLoadError((err as Error).message || "status request failed");
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    setPendingFlags(consumeUrlFlags());
  }, []);

  useEffect(() => {
    if (!pendingFlags) return;
    if (loading) return;
    if (flagsHandledRef.current) return;
    flagsHandledRef.current = true;

    const isMicrosoft = pendingFlags.provider === "microsoft";
    const urlSaysConnected = pendingFlags.connected === "1";
    const statusSaysConnected =
      !!status &&
      status.connected &&
      status.status === "connected";

    // Trust the live status over URL params: the bridge can emit
    // ?error=session_mint_failed (or similar post-persist errors) AFTER
    // tokens are already stored. The connection is real; the URL error
    // reflects a downstream cookie-handshake hiccup the user does not
    // need to see as a failure. Showing the failure toast on a working
    // connection is the bug we are fixing.
    if ((urlSaysConnected || statusSaysConnected) && !isMicrosoft) {
      toast.success("Gmail connected successfully.");
    } else if (pendingFlags.error) {
      toast.error(readableError(pendingFlags.error));
    }
  }, [pendingFlags, loading, status]);

  const handleConnect = useCallback(async () => {
    try {
      const res = await fetch("/api/oauth/gmail/authorize", {
        cache: "no-store",
      });
      if (!res.ok) {
        toast.error(`Could not start Gmail connect (${res.status}).`);
        return;
      }
      const { auth_url } = (await res.json()) as { auth_url?: string };
      if (typeof auth_url !== "string" || !auth_url) {
        toast.error("Could not start Gmail connect (no auth URL).");
        return;
      }
      window.location.href = auth_url;
    } catch (err) {
      toast.error((err as Error).message || "Could not start Gmail connect.");
    }
  }, []);

  const handleDisconnect = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/oauth/gmail/disconnect", {
        method: "POST",
      });
      if (!res.ok) {
        toast.error(`Disconnect failed (${res.status}).`);
      } else {
        toast.success("Gmail disconnected.");
      }
    } catch (err) {
      toast.error((err as Error).message || "Disconnect failed.");
    } finally {
      setBusy(false);
      fetchStatus();
    }
  }, [busy, fetchStatus]);

  const reauthRequired =
    !!status && status.connected && status.status === "reauth_required";

  return (
    <section
      data-testid="email-integration-card"
      className="rounded-lg border border-[var(--border)] bg-[var(--overlay-soft)] p-6"
    >
      <header className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-medium text-[var(--text-primary)]">Email integration</h2>
          <p className="mt-1 text-sm text-[var(--text-tertiary)]">
            Endall sends estimate approval requests from your inbox. Customers
            see your name and reply to you, not to Endall.
          </p>
        </div>
        {status && status.connected ? (
          <span
            data-testid="gmail-status-pill"
            className="rounded-md border border-[var(--border)] px-2 py-1 text-xs uppercase tracking-wide text-[var(--text-tertiary)]"
          >
            {reauthRequired ? "Reauth required" : "Connected"}
          </span>
        ) : null}
      </header>

      <div className="mt-5 flex items-center justify-between gap-4">
        <div className="text-sm text-[var(--text-secondary)]" data-testid="gmail-status-line">
          {loading && "Checking connection…"}
          {!loading && loadError && `Error: ${loadError}`}
          {!loading && !loadError && status && !status.connected && "Not connected"}
          {!loading &&
            !loadError &&
            status &&
            status.connected &&
            !reauthRequired && (
              <span>
                Connected as <strong>{status.account_email || "Gmail user"}</strong>
              </span>
            )}
          {!loading && !loadError && reauthRequired && (
            <span className="text-[var(--brand-accent)]">
              Your Gmail authorization expired. Reconnect to continue sending
              estimates.
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!loading && status && !status.connected ? (
            <button
              type="button"
              data-testid="gmail-connect"
              onClick={handleConnect}
              className="rounded-md bg-[var(--surface-inverse)] px-4 py-2 text-sm font-medium text-[var(--text-inverse)] hover:opacity-90"
            >
              Connect Gmail
            </button>
          ) : null}

          {!loading && reauthRequired ? (
            <button
              type="button"
              data-testid="gmail-reconnect"
              onClick={handleConnect}
              className="rounded-md bg-amber-400 px-4 py-2 text-sm font-medium text-black hover:bg-amber-300"
            >
              Reconnect Gmail
            </button>
          ) : null}

          {!loading && status && status.connected && !reauthRequired ? (
            <button
              type="button"
              data-testid="gmail-disconnect"
              onClick={handleDisconnect}
              disabled={busy}
              className="rounded-md border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--overlay-weak)] disabled:opacity-50"
            >
              {busy ? "…" : "Disconnect"}
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export function OutlookComingSoonCard() {
  return (
    <section
      data-testid="outlook-coming-soon"
      aria-disabled="true"
      className="rounded-lg border border-[var(--border)] bg-[var(--overlay-soft)] p-6 opacity-60"
    >
      <header className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-medium text-[var(--text-primary)]">Outlook</h2>
          <p className="mt-1 text-sm text-[var(--text-tertiary)]">
            Microsoft 365 / Outlook send-from-your-inbox is coming soon.
          </p>
        </div>
        <span className="rounded-md border border-[var(--border)] px-2 py-1 text-xs uppercase tracking-wide text-[var(--text-tertiary)]">
          Coming soon
        </span>
      </header>
    </section>
  );
}
