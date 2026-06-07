import { NextResponse, type NextRequest } from "next/server";
import { bridgeFetch } from "@/lib/bridge-fetch";

// POST /api/estimates/{id}/send
// bridgeFetch resolves the tenant from the SSR session and forwards the
// verified bearer token + X-Tenant-Id.
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  let payload: unknown = {};
  try {
    payload = await req.json();
  } catch {
    payload = {};
  }

  const resp = await bridgeFetch(`/estimates/${encodeURIComponent(id)}/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload || {}),
  });
  const text = await resp.text();
  return new NextResponse(text, {
    status: resp.status,
    headers: {
      "Content-Type": resp.headers.get("content-type") || "application/json",
    },
  });
}
