import { NextResponse } from "next/server";
import {
  resolveTenantFromSession,
  tenantUnresolvedResponse,
} from "@/lib/tenant-server";

const BRIDGE_URL =
  process.env.ASK_ENDALL_BRIDGE_URL || "http://localhost:8101";

// POST /api/intelligence/competitive-brief/send
//
// Proxies to bridge POST /intelligence/competitive-brief/{tenant_id}/send.
// Tenant is resolved from the SSR session and embedded into the bridge path.
// The bridge response indicates whether the brief was queued for delivery.
export async function POST() {
  const resolved = await resolveTenantFromSession();
  if (!resolved.ok) return tenantUnresolvedResponse(resolved.code);

  try {
    const url = new URL(BRIDGE_URL);
    url.pathname = `/intelligence/competitive-brief/${encodeURIComponent(
      resolved.tenant_id,
    )}/send`;
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
    console.error("competitive-brief send proxy failed:", err);
    return NextResponse.json({ error: "bridge unavailable" }, { status: 502 });
  }
}
