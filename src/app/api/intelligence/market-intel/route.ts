import { NextResponse } from "next/server";
import {
  resolveTenantFromSession,
  tenantUnresolvedResponse,
} from "@/lib/tenant-server";

const BRIDGE_URL =
  process.env.ASK_ENDALL_BRIDGE_URL || "http://localhost:8101";

// GET /api/intelligence/market-intel
//
// Proxies to bridge GET /intelligence/market-intel/{tenant_id}. The bridge
// embeds tenant_id in the URL path. The proxy resolves tenant from the SSR
// session (never trusts a client-provided tenant_id) and substitutes it
// into the bridge URL. Bridge response is surfaced verbatim.
export async function GET() {
  const resolved = await resolveTenantFromSession();
  if (!resolved.ok) return tenantUnresolvedResponse(resolved.code);

  try {
    const url = new URL(BRIDGE_URL);
    url.pathname = `/intelligence/market-intel/${encodeURIComponent(
      resolved.tenant_id,
    )}`;
    const resp = await fetch(url, {
      method: "GET",
      headers: { "X-Tenant-Id": resolved.tenant_id },
      cache: "no-store",
    });
    const text = await resp.text();
    return new NextResponse(text, {
      status: resp.status,
      headers: {
        "Content-Type":
          resp.headers.get("content-type") || "application/json",
      },
    });
  } catch (err) {
    console.error("market-intel proxy failed:", err);
    return NextResponse.json({ error: "bridge unavailable" }, { status: 502 });
  }
}
