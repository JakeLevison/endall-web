import { NextResponse, type NextRequest } from "next/server";
import { bridgeFetch } from "@/lib/bridge-fetch";

// Proxy for GET /api/contacts/unified on the ask-endall bridge.
// Returns the merged contacts + voice_contacts + outreach_prospects view so
// the operator sees every lead-shaped row, not just canonical contacts.
// bridgeFetch resolves the tenant from the SSR session and forwards the
// verified bearer token + X-Tenant-Id.
export async function GET(req: NextRequest) {
  const source = req.nextUrl.searchParams.get("source");
  const path = `/api/contacts/unified${source ? `?source=${encodeURIComponent(source)}` : ""}`;
  const resp = await bridgeFetch(path);
  const text = await resp.text();
  return new NextResponse(text, {
    status: resp.status,
    headers: {
      "Content-Type": resp.headers.get("content-type") || "application/json",
    },
  });
}
