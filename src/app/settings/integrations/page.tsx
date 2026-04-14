"use client";

import { useCallback, useEffect, useState } from "react";

type QbStatus =
  | { connected: false }
  | {
      connected: true;
      company_name: string;
      environment: string;
      connected_at: string;
    };

const BRIDGE_URL =
  process.env.NEXT_PUBLIC_BRIDGE_URL ||
  "https://ask-endall-bridge-production.up.railway.app";

const FALLBACK_TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID || "";

function useQueryParams(): Record<string, string> | null {
  const [params, setParams] = useState<Record<string, string> | null>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const out: Record<string, string> = {};
    url.searchParams.forEach((v, k) => {
      out[k] = v;
    });
    setParams(out);
  }, []);
  return params;
}

export default function IntegrationsPage() {
  const params = useQueryParams();
  const adminKey = params?.admin_key || "";
  const tenantIdFromUrl = params?.tenant_id || "";
  const connectedFlag = params?.connected || "";
  const errorFlag = params?.error || "";

  const [status, setStatus] = useState<QbStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const tenantId = tenantIdFromUrl || FALLBACK_TENANT_ID;

  const fetchStatus = useCallback(async () => {
    if (!adminKey || !tenantId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const url = `${BRIDGE_URL}/integrations/quickbooks/status?tenant_id=${encodeURIComponent(
        tenantId,
      )}&admin_key=${encodeURIComponent(adminKey)}`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) {
        setLoadError(`status request failed (${res.status})`);
        setStatus(null);
      } else {
        const body = (await res.json()) as QbStatus;
        setStatus(body);
      }
    } catch (err) {
      setLoadError((err as Error).message || "status request failed");
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, [adminKey, tenantId]);

  useEffect(() => {
    if (params === null) return;
    fetchStatus();
  }, [params, fetchStatus]);

  const handleConnect = () => {
    if (!adminKey || !tenantId) return;
    const url = `${BRIDGE_URL}/integrations/quickbooks/authorize?tenant_id=${encodeURIComponent(
      tenantId,
    )}&admin_key=${encodeURIComponent(adminKey)}`;
    window.location.href = url;
  };

  const handleDisconnect = async () => {
    if (!adminKey || !tenantId) return;
    const url = `${BRIDGE_URL}/integrations/quickbooks/disconnect?tenant_id=${encodeURIComponent(
      tenantId,
    )}&admin_key=${encodeURIComponent(adminKey)}`;
    try {
      await fetch(url, { method: "POST" });
    } catch (err) {
      setLoadError((err as Error).message || "disconnect failed");
    }
    fetchStatus();
  };

  if (params === null) {
    return null;
  }

  if (!adminKey) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-lg border border-white/10 p-6 text-sm text-white/80">
          Unauthorized. Please include admin_key in the URL.
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-start justify-center p-6">
      <div className="w-full max-w-xl flex flex-col gap-4">
        <h1 className="text-xl font-medium text-white">Integrations</h1>

        {connectedFlag === "1" && (
          <div
            role="status"
            data-testid="success-banner"
            className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-200"
          >
            QuickBooks connected successfully.
          </div>
        )}

        {errorFlag && (
          <div
            role="alert"
            data-testid="error-banner"
            className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200"
          >
            Connection failed: {errorFlag.replace(/_/g, " ")}.
          </div>
        )}

        <section className="rounded-lg border border-white/10 p-6 bg-white/5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-medium text-white">QuickBooks Online</h2>
              <p className="text-sm text-white/60 mt-1">
                Sync invoices and customers with your QuickBooks account.
              </p>
            </div>
            {status && status.connected && (
              <span className="text-xs uppercase tracking-wide rounded-md border border-white/15 px-2 py-1 text-white/70">
                {status.environment}
              </span>
            )}
          </div>

          <div className="mt-5 flex items-center justify-between">
            <div className="text-sm text-white/80" data-testid="qb-status-line">
              {loading && "Checking connection..."}
              {!loading && loadError && `Error: ${loadError}`}
              {!loading && !loadError && status && !status.connected && "Not connected"}
              {!loading && !loadError && status && status.connected && (
                <span>
                  Connected as <strong>{status.company_name || "Unknown company"}</strong>
                </span>
              )}
              {!loading && !loadError && !status && !tenantId && "Tenant id missing."}
            </div>

            {!loading && status && !status.connected && (
              <button
                type="button"
                onClick={handleConnect}
                className="rounded-md bg-white text-black text-sm font-medium px-4 py-2 hover:bg-white/90"
              >
                Connect QuickBooks
              </button>
            )}
            {!loading && status && status.connected && (
              <button
                type="button"
                onClick={handleDisconnect}
                className="rounded-md border border-white/20 text-white text-sm font-medium px-4 py-2 hover:bg-white/5"
              >
                Disconnect
              </button>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
