import { NextResponse, type NextRequest } from "next/server";
import { bridgeFetch } from "@/lib/bridge-fetch";

// POST /api/prospects/[id]/enrich
//
// Proxies to bridge POST /prospects/{tenant_id}/{prospect_id}/enrich.
// bridgeFetch resolves the tenant from the SSR session and embeds it in the
// bridge path; response is surfaced verbatim.
export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const resp = await bridgeFetch(
    (tenantId) =>
      `/prospects/${encodeURIComponent(tenantId)}/${encodeURIComponent(id)}/enrich`,
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
