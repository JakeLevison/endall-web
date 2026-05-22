import { NextResponse, type NextRequest } from "next/server";
import {
  resolveTenantFromSession,
  tenantUnresolvedResponse,
} from "@/lib/tenant-server";

const BRIDGE_URL =
  process.env.ASK_ENDALL_BRIDGE_URL || "http://localhost:8101";

// POST /api/prospects/import
//
// Proxies to bridge POST /prospects/{tenant_id}/import. Expects a JSON
// body matching ProspectImportRequest ({ rows } or { csv }). The dashboard
// upload flow reads the file client-side and posts JSON, which keeps the
// proxy boundary-agnostic and avoids a second multipart round-trip.
export async function POST(req: NextRequest) {
  const resolved = await resolveTenantFromSession();
  if (!resolved.ok) return tenantUnresolvedResponse(resolved.code);

  try {
    const body = await req.text();
    const url = new URL(BRIDGE_URL);
    url.pathname = `/prospects/${encodeURIComponent(resolved.tenant_id)}/import`;
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "X-Tenant-Id": resolved.tenant_id,
        "Content-Type": "application/json",
      },
      body,
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
    console.error("prospects import proxy failed:", err);
    return NextResponse.json({ error: "bridge unavailable" }, { status: 502 });
  }
}
