import { NextRequest, NextResponse } from "next/server";
import { bridgeFetch } from "@/lib/bridge-fetch";

// GET /api/metrics/timeseries
//
// Proxies to bridge GET /metrics/{tenant_id}/timeseries, passing through query
// parameters (e.g. ?period=daily&metric=calls). bridgeFetch resolves the tenant
// from the SSR session, embeds it in the bridge path, and forwards the verified
// bearer token + X-Tenant-Id. Never trusts a client-provided tenant.
export async function GET(request: NextRequest) {
  const qs = request.nextUrl.searchParams.toString();
  const resp = await bridgeFetch(
    (tenantId) =>
      `/metrics/${encodeURIComponent(tenantId)}/timeseries${qs ? `?${qs}` : ""}`,
  );
  const text = await resp.text();
  return new NextResponse(text, {
    status: resp.status,
    headers: {
      "Content-Type": resp.headers.get("content-type") || "application/json",
    },
  });
}
