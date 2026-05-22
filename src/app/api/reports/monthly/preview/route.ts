import { NextResponse } from "next/server";
import {
  resolveTenantFromSession,
  tenantUnresolvedResponse,
} from "@/lib/tenant-server";

const BRIDGE_URL =
  process.env.ASK_ENDALL_BRIDGE_URL || "http://localhost:8101";

// GET /api/reports/monthly/preview
//
// Proxies to bridge GET /reports/{tenant_id}/monthly/preview. Returns the
// rendered monthly report HTML so it can be opened in a new tab. Tenant is
// resolved from the SSR session and embedded into the bridge path.
export async function GET() {
  const resolved = await resolveTenantFromSession();
  if (!resolved.ok) return tenantUnresolvedResponse(resolved.code);

  try {
    const url = new URL(BRIDGE_URL);
    url.pathname = `/reports/${encodeURIComponent(
      resolved.tenant_id,
    )}/monthly/preview`;
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
          resp.headers.get("content-type") || "text/html; charset=utf-8",
      },
    });
  } catch (err) {
    console.error("monthly report preview proxy failed:", err);
    return NextResponse.json({ error: "bridge unavailable" }, { status: 502 });
  }
}
