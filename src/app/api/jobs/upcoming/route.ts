import { NextRequest, NextResponse } from "next/server";

// Proxy for GET /jobs/upcoming on the ask-endall bridge.
export async function GET(request: NextRequest) {
  const bridgeUrl = process.env.ASK_ENDALL_BRIDGE_URL || "http://localhost:8101";
  const { searchParams } = new URL(request.url);
  const qs = searchParams.toString();
  const url = `${bridgeUrl}/jobs/upcoming${qs ? `?${qs}` : ""}`;

  const headers: Record<string, string> = {};
  const tenantId = request.headers.get("x-tenant-id");
  if (tenantId) headers["X-Tenant-Id"] = tenantId;

  try {
    const resp = await fetch(url, { method: "GET", headers });
    const text = await resp.text();
    return new NextResponse(text, {
      status: resp.status,
      headers: {
        "Content-Type": resp.headers.get("content-type") || "application/json",
      },
    });
  } catch (err) {
    console.error("jobs/upcoming proxy failed:", err);
    return NextResponse.json(
      { jobs: [], grouped_by_date: {} },
      { status: 200 }
    );
  }
}
