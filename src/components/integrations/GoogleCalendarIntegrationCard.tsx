"use client";

import { useCallback, useEffect, useState } from "react";

type GcalStatus =
  | { connected: false }
  | {
      connected: true;
      calendar_id?: string;
      account_email?: string;
      connected_at?: string;
    };

// Session-mode Google Calendar card for /settings/integrations. Mirrors
// EmailIntegrationCard's structure and styling (status on mount /
// authorize / disconnect). Google Calendar was only wired into the
// /settings tab tile; this surfaces it on the standalone integrations
// page too, positioned between Email and Outlook.
export function GoogleCalendarIntegrationCard() {
  const [status, setStatus] = useState<GcalStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/gcal/status", { cache: "no-store" });
      if (!res.ok) {
        setLoadError(`status request failed (${res.status})`);
        setStatus(null);
        return;
      }
      setStatus((await res.json()) as GcalStatus);
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

  const handleConnect = useCallback(async () => {
    try {
      const res = await fetch("/api/oauth/gcal/authorize", {
        cache: "no-store",
      });
      if (!res.ok) {
        setLoadError(`Could not start Google Calendar connect (${res.status}).`);
        return;
      }
      const { auth_url } = (await res.json()) as { auth_url?: string };
      if (typeof auth_url !== "string" || !auth_url) {
        setLoadError("Could not start Google Calendar connect (no auth URL).");
        return;
      }
      window.location.href = auth_url;
    } catch (err) {
      setLoadError(
        (err as Error).message || "Could not start Google Calendar connect.",
      );
    }
  }, []);

  const handleDisconnect = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/gcal/disconnect", { method: "POST" });
      if (!res.ok) {
        setLoadError(`Disconnect failed (${res.status}).`);
      }
    } catch (err) {
      setLoadError((err as Error).message || "Disconnect failed.");
    } finally {
      setBusy(false);
      fetchStatus();
    }
  }, [busy, fetchStatus]);

  const connected = !!status && status.connected;
  const connectedLabel =
    status && status.connected
      ? status.account_email || status.calendar_id || "Google Calendar"
      : "";

  return (
    <section
      data-testid="gcal-integration-card"
      className="rounded-lg border border-white/10 bg-white/5 p-6"
    >
      <header className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-medium text-white">Google Calendar</h2>
          <p className="mt-1 text-sm text-white/60">
            Endall adds booked jobs to your calendar automatically so your
            schedule stays in sync.
          </p>
        </div>
        {connected ? (
          <span
            data-testid="gcal-status-pill"
            className="rounded-md border border-white/15 px-2 py-1 text-xs uppercase tracking-wide text-white/70"
          >
            Connected
          </span>
        ) : null}
      </header>

      <div className="mt-5 flex items-center justify-between gap-4">
        <div className="text-sm text-white/80" data-testid="gcal-status-line">
          {loading && "Checking connection…"}
          {!loading && loadError && `Error: ${loadError}`}
          {!loading && !loadError && status && !status.connected && "Not connected"}
          {!loading && !loadError && status && status.connected && (
            <span>
              Connected as <strong>{connectedLabel}</strong>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!loading && status && !status.connected ? (
            <button
              type="button"
              data-testid="gcal-connect"
              onClick={handleConnect}
              className="rounded-md bg-white px-4 py-2 text-sm font-medium text-black hover:bg-white/90"
            >
              Connect Google Calendar
            </button>
          ) : null}

          {!loading && status && status.connected ? (
            <button
              type="button"
              data-testid="gcal-disconnect"
              onClick={handleDisconnect}
              disabled={busy}
              className="rounded-md border border-white/20 px-4 py-2 text-sm font-medium text-white hover:bg-white/5 disabled:opacity-50"
            >
              {busy ? "…" : "Disconnect"}
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
