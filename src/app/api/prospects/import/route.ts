import { NextResponse, type NextRequest } from "next/server";
import { bridgeFetch } from "@/lib/bridge-fetch";

// POST /api/prospects/import
//
// Proxies to bridge POST /prospects/{tenant_id}/import. Expects a JSON body
// matching ProspectImportRequest ({ rows } or { csv }). bridgeFetch resolves
// the tenant from the SSR session and embeds it in the bridge path.
export async function POST(req: NextRequest) {
  const body = await req.text();
  const resp = await bridgeFetch(
    (tenantId) => `/prospects/${encodeURIComponent(tenantId)}/import`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    },
  );
  const text = await resp.text();
  return new NextResponse(text, {
    status: resp.status,
    headers: {
      "Content-Type": resp.headers.get("content-type") || "application/json",
    },
  });
}
