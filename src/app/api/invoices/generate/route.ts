import { NextRequest, NextResponse } from "next/server";

// Proxy for POST /invoices/generate on the ask-endall bridge.
// Forwards X-Tenant-Id if the client sent one; otherwise the bridge falls
// back to the marketing default tenant.
export async function POST(request: NextRequest) {
  const bridgeUrl = process.env.ASK_ENDALL_BRIDGE_URL || "http://localhost:8101";

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
    url.pathname = "/invoices/generate";
    const resp = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    const text = await resp.text();
    return new NextResponse(text, {
      status: resp.status,
      headers: {
        "Content-Type": resp.headers.get("content-type") || "application/json",
      },
    });
  } catch (err) {
    console.error("invoices generate proxy failed:", err);
    return NextResponse.json(
      { error: "invoice bridge unavailable" },
      { status: 502 }
    );
  }
}
