import { NextRequest, NextResponse } from "next/server";
import { bridgeFetch } from "@/lib/bridge-fetch";

// Proxy for the ask-endall-bridge /settings/company endpoint.
// bridgeFetch resolves the tenant from the SSR session and forwards the
// verified bearer token + X-Tenant-Id. (Previously this route sent
// company_id=default with no auth, relying on the bridge marketing-default
// fallback -- that path is now removed.)

export async function GET() {
  const resp = await bridgeFetch("/settings/company");
  const body = await resp.json().catch(() => ({}));
  return NextResponse.json(body, { status: resp.status });
}

export async function PUT(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const resp = await bridgeFetch("/settings/company", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const respBody = await resp.json().catch(() => ({}));
  return NextResponse.json(respBody, { status: resp.status });
}
