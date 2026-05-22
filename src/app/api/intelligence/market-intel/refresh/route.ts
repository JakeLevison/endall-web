import { NextResponse } from "next/server";
import {
  resolveTenantFromSession,
  tenantUnresolvedResponse,
} from "@/lib/tenant-server";

const BRIDGE_URL =
  process.env.ASK_ENDALL_BRIDGE_URL || "http://localhost:8101";

// POST /api/intelligence/market-intel/refresh
//
// Proxies to bridge POST /intelligence/market-intel/{tenant_id}/refresh.
// Tenant is resolved from the SSR session and embedded into the bridge path.
// The bridge returns 202 Accepted; response is surfaced verbatim.
export async function POST() {
  const resolved = await resolveTenantFromSession();
  if (!resolved.ok) return tenantUnresolvedResponse(resolved.code);

  try {
    const url = new URL(BRIDGE_URL);
    url.pathname = `/intelligence/market-intel/${encodeURIComponent(
      resolved.tenant_id,
    )}/refresh`;
    const resp = await fetch(url, {
      method: "POST",
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
    console.error("market-intel refresh proxy failed:", err);
    return NextResponse.json({ error: "bridge unavailable" }, { status: 502 });
  }
}
