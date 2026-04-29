"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTenant } from "@/lib/tenant-hook";
import {
  EmailIntegrationCard,
  OutlookComingSoonCard,
} from "@/components/integrations/EmailIntegrationCard";

type QbStatus =
  | { connected: false }
  | {
      connected: true;
      company_name: string;
      environment: string;
      connected_at: string;
      auto_push_enabled: boolean;
    };

const BRIDGE_URL =
  process.env.NEXT_PUBLIC_BRIDGE_URL ||
  "https://ask-endall-bridge-production.up.railway.app";

export default function IntegrationsPage() {
  return (
    <Suspense fallback={null}>
      <IntegrationsPageInner />
    </Suspense>
  );
}

function IntegrationsPageInner() {
  const router = useRouter();
  // useSearchParams reflects the routing-layer URL, which is what the
  // middleware rewrites server-side after consuming endall_session
  // cookie. The browser address bar stays clean (no admin_key); the
  // page reads admin_key + tenant_id from the rewritten URL only.
  const params = useSearchParams();
  const adminKey = params?.get("admin_key") || "";
  const tenantIdFromUrl = params?.get("tenant_id") || "";
  const providerFlag = params?.get("provider") || "";
  // Hide the QuickBooks success/error banners when an email-integration
  // callback lands here. The EmailIntegrationCard owns those toasts.
  const isEmailProviderCallback =
    providerFlag === "gmail" || providerFlag === "microsoft";
  const connectedFlag = isEmailProviderCallback ? "" : params?.get("connected") || "";
  const errorFlag = isEmailProviderCallback ? "" : params?.get("error") || "";

  const [status, setStatus] = useState<QbStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [autoPushBusy, setAutoPushBusy] = useState(false);
  const [showConnectedBanner, setShowConnectedBanner] = useState(false);

  const bypassMode = !!adminKey;
  const { tenant_id: sessionTenantId } = useTenant();
  const tenantId = tenantIdFromUrl || sessionTenantId || "";

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (params === null) return;
    if (!connectedFlag) return;
    setShowConnectedBanner(true);
    const clean = new URL(window.location.href);
    clean.searchParams.delete("connected");
    const qs = clean.searchParams.toString();
    router.replace(qs ? `/settings/integrations?${qs}` : "/settings/integrations");
  }, [params, connectedFlag, router]);

  const fetchStatus = useCallback(async () => {
    if (!tenantId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      let res: Response;
      if (bypassMode) {
        const url = `${BRIDGE_URL}/integrations/quickbooks/status?tenant_id=${encodeURIComponent(
          tenantId,
        )}&admin_key=${encodeURIComponent(adminKey)}`;
        res = await fetch(url, { cache: "no-store" });
      } else {
        res = await fetch("/api/quickbooks/status", { cache: "no-store" });
      }
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
  }, [bypassMode, adminKey, tenantId]);

  useEffect(() => {
    if (params === null) return;
    fetchStatus();
  }, [params, fetchStatus]);

  const handleConnect = async () => {
    if (!tenantId) return;
    try {
      let res: Response;
      if (bypassMode) {
        // Bypass mode (admin debugging): hit the bridge directly with
        // X-Admin-Key. The bridge returns { auth_url }; navigate to it.
        const url = new URL(BRIDGE_URL);
        url.pathname = "/integrations/quickbooks/authorize";
        url.searchParams.set("tenant_id", tenantId);
        res = await fetch(url, {
          headers: { "X-Admin-Key": adminKey },
          cache: "no-store",
        });
      } else {
        // Session mode: hit our proxy, which holds admin_key server-side.
        res = await fetch("/api/quickbooks/authorize", { cache: "no-store" });
      }
      if (!res.ok) {
        setLoadError(`authorize request failed (${res.status})`);
        return;
      }
      const { auth_url } = (await res.json()) as { auth_url?: string };
      if (typeof auth_url !== "string" || !auth_url) {
        setLoadError("authorize returned no auth URL");
        return;
      }
      window.location.href = auth_url;
    } catch (err) {
      setLoadError((err as Error).message || "authorize request failed");
    }
  };

  const handleToggleAutoPush = async () => {
    if (!status || !status.connected) return;
    if (!tenantId) return;
    const next = !status.auto_push_enabled;
    setAutoPushBusy(true);
    try {
      let res: Response;
      if (bypassMode) {
        const url = `${BRIDGE_URL}/integrations/quickbooks/auto-push?admin_key=${encodeURIComponent(
          adminKey,
        )}`;
        res = await fetch(url, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "X-Tenant-Id": tenantId,
          },
          body: JSON.stringify({ enabled: next }),
        });
      } else {
        res = await fetch("/api/quickbooks/auto-push", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enabled: next }),
        });
      }
      if (!res.ok) {
        setLoadError(`auto-push update failed (${res.status})`);
      } else {
        setStatus({ ...status, auto_push_enabled: next });
      }
    } catch (err) {
      setLoadError((err as Error).message || "auto-push update failed");
    } finally {
      setAutoPushBusy(false);
    }
  };

  const handleDisconnect = async () => {
    if (!tenantId) return;
    try {
      if (bypassMode) {
        const url = `${BRIDGE_URL}/integrations/quickbooks/disconnect?tenant_id=${encodeURIComponent(
          tenantId,
        )}&admin_key=${encodeURIComponent(adminKey)}`;
        await fetch(url, { method: "POST" });
      } else {
        await fetch("/api/quickbooks/disconnect", { method: "POST" });
      }
    } catch (err) {
      setLoadError((err as Error).message || "disconnect failed");
    }
    fetchStatus();
  };

  if (params === null) {
    return null;
  }

  if (!bypassMode && !tenantId) {
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

        {showConnectedBanner && (
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

          {!loading && status && status.connected && (
            <div
              data-testid="auto-push-row"
              className="mt-4 flex items-center justify-between border-t border-white/10 pt-4"
            >
              <div>
                <div className="text-sm text-white">Auto-push invoices</div>
                <div className="text-xs text-white/50 mt-0.5">
                  Send new invoices to QuickBooks automatically.
                </div>
              </div>
              <button
                type="button"
                role="switch"
                data-testid="auto-push-toggle"
                aria-checked={status.auto_push_enabled}
                aria-label="Toggle auto-push"
                onClick={handleToggleAutoPush}
                disabled={autoPushBusy}
                className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                style={{
                  background: status.auto_push_enabled
                    ? "#10b981"
                    : "rgba(255,255,255,0.2)",
                  opacity: autoPushBusy ? 0.6 : 1,
                }}
              >
                <span
                  className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                  style={{
                    transform: status.auto_push_enabled
                      ? "translateX(22px)"
                      : "translateX(4px)",
                  }}
                />
              </button>
            </div>
          )}
        </section>

        <EmailIntegrationCard />
        <OutlookComingSoonCard />
      </div>
    </main>
  );
}
