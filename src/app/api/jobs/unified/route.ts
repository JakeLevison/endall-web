import { NextResponse, type NextRequest } from "next/server";
import { bridgeFetch } from "@/lib/bridge-fetch";

// GET /api/jobs/unified
//
// Proxies to bridge GET /api/jobs/unified, which returns one merged stream of
// rows from both `voice_jobs` (legacy voice booking) and `jobs` (canonical
// estimate-approved), deduped on (tenant_id, normalized_phone,
// scheduled_date::date). bridgeFetch resolves the tenant from the SSR session
// and forwards the verified bearer token + X-Tenant-Id; the bridge response is
// surfaced verbatim.
export async function GET(request: NextRequest) {
  const qs = new URL(request.url).searchParams.toString();
  const resp = await bridgeFetch(`/api/jobs/unified${qs ? `?${qs}` : ""}`);
  const text = await resp.text();
  return new NextResponse(text, {
    status: resp.status,
    headers: {
      "Content-Type": resp.headers.get("content-type") || "application/json",
    },
  });
}
