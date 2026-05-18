import { NextRequest, NextResponse } from "next/server";

// Proxy for PATCH /jobs/{job_id}/status on the ask-endall bridge.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ job_id: string }> }
) {
  const bridgeUrl = process.env.ASK_ENDALL_BRIDGE_URL || "http://localhost:8101";
  const { job_id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const tenantId = request.headers.get("x-tenant-id");
  if (tenantId) headers["X-Tenant-Id"] = tenantId;

  try {
    const url = new URL(bridgeUrl);
    url.pathname = `/jobs/${encodeURIComponent(job_id)}/status`;
    const resp = await fetch(
      url,
      { method: "PATCH", headers, body: JSON.stringify(body) }
    );
    const text = await resp.text();
    return new NextResponse(text, {
      status: resp.status,
      headers: {
        "Content-Type": resp.headers.get("content-type") || "application/json",
      },
    });
  } catch (err) {
    console.error("jobs/status proxy failed:", err);
    return NextResponse.json(
      { error: "dispatch bridge unavailable" },
      { status: 502 }
    );
  }
}
