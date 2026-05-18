import { NextResponse, type NextRequest } from "next/server";
import {
  resolveTenantFromSession,
  tenantUnresolvedResponse,
} from "@/lib/tenant-server";

const BRIDGE_URL =
  process.env.ASK_ENDALL_BRIDGE_URL || "http://localhost:8101";

// GET /api/jobs/unified
//
// Proxies to bridge GET /jobs/unified, which returns one merged stream of
// rows from both `voice_jobs` (legacy voice booking) and `jobs` (canonical
// estimate-approved). The bridge handles deduplication on
// (tenant_id, normalized_phone, scheduled_date::date); the frontend consumes
// the deduplicated result. Pattern mirrors
// src/app/api/day-plans/[date]/route.ts: tenant resolved from the SSR
// session, passed through as X-Tenant-Id; bridge response surfaced verbatim.
export async function GET(request: NextRequest) {
  const resolved = await resolveTenantFromSession();
  if (!resolved.ok) return tenantUnresolvedResponse(resolved.code);

  try {
    const url = new URL(BRIDGE_URL);
    url.pathname = "/api/jobs/unified";
    const incoming = new URL(request.url);
    for (const [key, value] of incoming.searchParams) {
      url.searchParams.set(key, value);
    }
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
    console.error("jobs/unified proxy failed:", err);
    return NextResponse.json({ error: "bridge unavailable" }, { status: 502 });
  }
}
