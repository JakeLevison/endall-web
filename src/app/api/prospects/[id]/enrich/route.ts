import { NextResponse, type NextRequest } from "next/server";
import {
  resolveTenantFromSession,
  tenantUnresolvedResponse,
} from "@/lib/tenant-server";

const BRIDGE_URL =
  process.env.ASK_ENDALL_BRIDGE_URL || "http://localhost:8101";

// POST /api/prospects/[id]/enrich
//
// Proxies to bridge POST /prospects/{tenant_id}/{prospect_id}/enrich.
// Tenant is resolved from the SSR session and embedded into the bridge
// path. The bridge runs an enrichment job and returns updated prospect
// fields; response is surfaced verbatim.
export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const resolved = await resolveTenantFromSession();
  if (!resolved.ok) return tenantUnresolvedResponse(resolved.code);

  try {
    const url = new URL(BRIDGE_URL);
    url.pathname = `/prospects/${encodeURIComponent(
      resolved.tenant_id,
    )}/${encodeURIComponent(id)}/enrich`;
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
    console.error("prospect enrich proxy failed:", err);
    return NextResponse.json({ error: "bridge unavailable" }, { status: 502 });
  }
}
