import { NextResponse } from "next/server";
import { bridgeFetch } from "@/lib/bridge-fetch";

// POST /api/intelligence/competitive-brief/send
//
// Proxies to bridge POST /intelligence/competitive-brief/{tenant_id}/send.
// bridgeFetch resolves the tenant from the SSR session and embeds it in the
// bridge path.
export async function POST() {
  const resp = await bridgeFetch(
    (tenantId) =>
      `/intelligence/competitive-brief/${encodeURIComponent(tenantId)}/send`,
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
