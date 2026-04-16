import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const bridgeUrl =
    process.env.ASK_ENDALL_BRIDGE_URL || "http://localhost:8101";
  const adminKey = process.env.ASK_ENDALL_ADMIN_KEY || "";
  const tenantId =
    request.headers.get("x-tenant-id") ||
    process.env.NEXT_PUBLIC_TENANT_ID ||
    "";

  if (!adminKey) {
    return NextResponse.json(
      { error: "server admin key not configured" },
      { status: 500 }
    );
  }
  if (!tenantId) {
    return NextResponse.json({ error: "tenant id missing" }, { status: 400 });
  }

  const url = `${bridgeUrl}/integrations/quickbooks/authorize?tenant_id=${encodeURIComponent(
    tenantId
  )}&admin_key=${encodeURIComponent(adminKey)}`;

  return NextResponse.redirect(url);
}
