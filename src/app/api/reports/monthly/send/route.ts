import { NextResponse } from "next/server";
import { bridgeFetch } from "@/lib/bridge-fetch";

// POST /api/reports/monthly/send
//
// Proxies to bridge POST /reports/{tenant_id}/monthly/send. bridgeFetch
// resolves the tenant from the SSR session and embeds it in the bridge path.
export async function POST() {
  const resp = await bridgeFetch(
    (tenantId) => `/reports/${encodeURIComponent(tenantId)}/monthly/send`,
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
