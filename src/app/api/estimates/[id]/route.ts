import { NextResponse, type NextRequest } from "next/server";
import { bridgeFetch } from "@/lib/bridge-fetch";

// GET /api/estimates/{id}
// bridgeFetch resolves the tenant from the SSR session and forwards the
// verified bearer token + X-Tenant-Id.
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const resp = await bridgeFetch(`/estimates/${encodeURIComponent(id)}`);
  const text = await resp.text();
  return new NextResponse(text, {
    status: resp.status,
    headers: {
      "Content-Type": resp.headers.get("content-type") || "application/json",
    },
  });
}
