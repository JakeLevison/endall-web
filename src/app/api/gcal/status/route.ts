import { NextResponse } from "next/server";
import {
  resolveTenantFromSession,
  tenantUnresolvedResponse,
} from "@/lib/tenant-server";

// Proxy GET /integrations/gcal/status. Server-side admin key, tenant
// from the authenticated session. Used by the Settings Integrations
// Google Calendar tile on mount. Mirrors the QuickBooks status proxy.
export async function GET() {
  const bridgeUrl = process.env.ASK_ENDALL_BRIDGE_URL || "http://localhost:8101";
  const adminKey = process.env.ASK_ENDALL_ADMIN_KEY || "";

  if (!adminKey) {
    return NextResponse.json(
      { error: "server admin key not configured" },
      { status: 500 },
    );
  }

  const resolved = await resolveTenantFromSession();
  if (!resolved.ok) return tenantUnresolvedResponse(resolved.code);

  try {
    const url = new URL(bridgeUrl);
    url.pathname = "/integrations/gcal/status";
    url.searchParams.set("tenant_id", resolved.tenant_id);
    url.searchParams.set("admin_key", adminKey);
    const resp = await fetch(url, { cache: "no-store" });
    const text = await resp.text();
    return new NextResponse(text, {
      status: resp.status,
      headers: {
        "Content-Type": resp.headers.get("content-type") || "application/json",
      },
    });
  } catch (err) {
    console.error("gcal status proxy failed:", err);
    return NextResponse.json({ error: "bridge unavailable" }, { status: 502 });
  }
}
