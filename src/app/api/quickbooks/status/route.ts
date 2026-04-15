import { NextRequest, NextResponse } from "next/server";

// Proxy GET /integrations/quickbooks/status. Server-side admin key, tenant
// from header or env default. Used by the invoice modal + settings page.
export async function GET(request: NextRequest) {
  const bridgeUrl = process.env.ASK_ENDALL_BRIDGE_URL || "http://localhost:8101";
  const adminKey = process.env.ASK_ENDALL_ADMIN_KEY || "";
  const tenantId =
    request.headers.get("x-tenant-id") ||
    process.env.NEXT_PUBLIC_TENANT_ID ||
    "";

  if (!adminKey) {
    return NextResponse.json(
      { error: "server admin key not configured" },
      { status: 500 },
    );
  }
  if (!tenantId) {
    return NextResponse.json({ error: "tenant id missing" }, { status: 400 });
  }

  try {
    const url = `${bridgeUrl}/integrations/quickbooks/status?tenant_id=${encodeURIComponent(
      tenantId,
    )}&admin_key=${encodeURIComponent(adminKey)}`;
    const resp = await fetch(url, { cache: "no-store" });
    const text = await resp.text();
    return new NextResponse(text, {
      status: resp.status,
      headers: {
        "Content-Type": resp.headers.get("content-type") || "application/json",
      },
    });
  } catch (err) {
    console.error("qb status proxy failed:", err);
    return NextResponse.json({ error: "bridge unavailable" }, { status: 502 });
  }
}
