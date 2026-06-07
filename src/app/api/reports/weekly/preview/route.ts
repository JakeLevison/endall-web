import { NextResponse } from "next/server";
import { bridgeFetch } from "@/lib/bridge-fetch";

// GET /api/reports/weekly/preview
//
// Proxies to bridge GET /reports/{tenant_id}/weekly/preview. Returns the
// rendered weekly report HTML. bridgeFetch resolves the tenant from the SSR
// session and embeds it in the bridge path.
export async function GET() {
  const resp = await bridgeFetch(
    (tenantId) => `/reports/${encodeURIComponent(tenantId)}/weekly/preview`,
  );
  const text = await resp.text();
  return new NextResponse(text, {
    status: resp.status,
    headers: {
      "Content-Type":
        resp.headers.get("content-type") || "text/html; charset=utf-8",
    },
  });
}
