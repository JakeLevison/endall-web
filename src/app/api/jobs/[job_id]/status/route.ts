import { NextRequest, NextResponse } from "next/server";
import { bridgeFetch } from "@/lib/bridge-fetch";

// Proxy for PATCH /jobs/{job_id}/status on the ask-endall bridge.
// bridgeFetch resolves the tenant from the SSR session and forwards the
// verified bearer token + X-Tenant-Id. (Previously this route forwarded a
// client-supplied x-tenant-id header verbatim -- a tenant-spoof vector now
// closed by server-side resolution.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ job_id: string }> }
) {
  const { job_id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const resp = await bridgeFetch(`/jobs/${encodeURIComponent(job_id)}/status`, {
    method: "PATCH",
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
