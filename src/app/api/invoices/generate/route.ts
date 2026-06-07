import { NextRequest, NextResponse } from "next/server";
import { bridgeFetch } from "@/lib/bridge-fetch";

// Proxy for POST /invoices/generate on the ask-endall bridge.
// bridgeFetch resolves the tenant from the SSR session and forwards the
// verified bearer token + X-Tenant-Id. (Previously this forwarded a
// client-supplied x-tenant-id and otherwise relied on the bridge
// marketing-default fallback -- both paths are now closed.)
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const resp = await bridgeFetch("/invoices/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await resp.text();
  return new NextResponse(text, {
    status: resp.status,
    headers: {
      "Content-Type": resp.headers.get("content-type") || "application/json",
    },
  });
}
