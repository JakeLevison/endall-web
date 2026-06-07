import { NextResponse } from "next/server";
import { bridgeFetch } from "@/lib/bridge-fetch";

// POST /api/intelligence/market-intel/refresh
//
// Proxies to bridge POST /intelligence/market-intel/{tenant_id}/refresh.
// bridgeFetch resolves the tenant from the SSR session and embeds it in the
// bridge path. The bridge returns 202 Accepted; response surfaced verbatim.
export async function POST() {
  const resp = await bridgeFetch(
    (tenantId) =>
      `/intelligence/market-intel/${encodeURIComponent(tenantId)}/refresh`,
    { method: "POST" },
  );
  const text = await resp.text();
  return new NextResponse(text, {
    status: resp.status,
    headers: {
      "Content-Type": resp.headers.get("content-type") || "application/json",
    },
  });
}
