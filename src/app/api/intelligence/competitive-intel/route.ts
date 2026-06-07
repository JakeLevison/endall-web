import { NextResponse } from "next/server";
import { bridgeFetch } from "@/lib/bridge-fetch";

// GET /api/intelligence/competitive-intel
//
// Proxies to bridge GET /intelligence/competitive-intel/{tenant_id}. bridgeFetch
// resolves the tenant from the SSR session and embeds it in the bridge path.
export async function GET() {
  const resp = await bridgeFetch(
    (tenantId) =>
      `/intelligence/competitive-intel/${encodeURIComponent(tenantId)}`,
  );
  const text = await resp.text();
  return new NextResponse(text, {
    status: resp.status,
    headers: {
      "Content-Type": resp.headers.get("content-type") || "application/json",
    },
  });
}
