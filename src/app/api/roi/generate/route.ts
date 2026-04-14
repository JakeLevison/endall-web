import { NextRequest, NextResponse } from "next/server";

// Proxy for POST /roi/generate on the Ask Endall bridge. Public marketing
// endpoint (no tenant scope). Request body matches the backend contract:
//   { company_name?: string | null, inputs: { staff, monthly_cost, missed_calls_per_week } }
// Response: { download_url, filename }
export async function POST(request: NextRequest) {
  const bridgeUrl = process.env.ASK_ENDALL_BRIDGE_URL || "http://localhost:8101";

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  try {
    const resp = await fetch(`${bridgeUrl}/roi/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const text = await resp.text();
    return new NextResponse(text, {
      status: resp.status,
      headers: { "Content-Type": resp.headers.get("content-type") || "application/json" },
    });
  } catch (err) {
    console.error("roi generate proxy failed:", err);
    return NextResponse.json(
      { error: "ROI bridge unavailable" },
      { status: 502 }
    );
  }
}
