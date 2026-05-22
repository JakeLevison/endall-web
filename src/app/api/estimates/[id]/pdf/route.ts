import { NextResponse, type NextRequest } from "next/server";
import {
  resolveTenantFromSession,
  tenantUnresolvedResponse,
} from "@/lib/tenant-server";

const BRIDGE_URL =
  process.env.ASK_ENDALL_BRIDGE_URL || "http://localhost:8101";

// GET /api/estimates/[id]/pdf
//
// Proxies to bridge GET /estimates/{estimate_id}/pdf. Tenant is resolved
// from the SSR session and passed as X-Tenant-Id, same as the existing
// GET /api/estimates/[id] proxy (bridge embeds tenant in the header,
// not the path). Response body is streamed through so the PDF binary
// survives intact, and Content-Type / Content-Disposition are surfaced
// from the bridge so the browser performs the download correctly.
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const resolved = await resolveTenantFromSession();
  if (!resolved.ok) return tenantUnresolvedResponse(resolved.code);

  try {
    const url = new URL(BRIDGE_URL);
    url.pathname = `/estimates/${encodeURIComponent(id)}/pdf`;
    const resp = await fetch(url, {
      method: "GET",
      headers: { "X-Tenant-Id": resolved.tenant_id },
      cache: "no-store",
    });
    if (!resp.ok) {
      // arrayBuffer preserves any non-2xx body (text JSON or rare binary
      // error page) without forcing a lossy UTF-8 round-trip.
      const buf = await resp.arrayBuffer();
      return new NextResponse(buf, {
        status: resp.status,
        headers: {
          "Content-Type":
            resp.headers.get("content-type") || "application/json",
        },
      });
    }
    const passthroughHeaders: Record<string, string> = {
      "Content-Type": resp.headers.get("content-type") || "application/pdf",
    };
    const disposition = resp.headers.get("content-disposition");
    if (disposition) passthroughHeaders["Content-Disposition"] = disposition;
    const cacheControl = resp.headers.get("cache-control");
    if (cacheControl) passthroughHeaders["Cache-Control"] = cacheControl;
    return new NextResponse(resp.body, {
      status: resp.status,
      headers: passthroughHeaders,
    });
  } catch (err) {
    console.error("estimate pdf proxy failed:", err);
    return NextResponse.json({ error: "bridge unavailable" }, { status: 502 });
  }
}
