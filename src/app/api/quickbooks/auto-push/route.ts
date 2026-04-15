import { NextRequest, NextResponse } from "next/server";

// Proxy PATCH /integrations/quickbooks/auto-push.
export async function PATCH(request: NextRequest) {
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  try {
    const resp = await fetch(`${bridgeUrl}/integrations/quickbooks/auto-push`, {
      method: "PATCH",
      headers: {
        "X-Admin-Key": adminKey,
        "X-Tenant-Id": tenantId,
        "Content-Type": "application/json",
      },
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
    console.error("qb auto-push proxy failed:", err);
    return NextResponse.json({ error: "bridge unavailable" }, { status: 502 });
  }
}
