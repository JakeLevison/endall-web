import { NextRequest, NextResponse } from "next/server";

// Proxy GET /integrations/quickbooks/invoices/{invoice_id}/qb-status.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ invoice_id: string }> },
) {
  const { invoice_id } = await params;
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
    const resp = await fetch(
      `${bridgeUrl}/integrations/quickbooks/invoices/${encodeURIComponent(invoice_id)}/qb-status`,
      {
        method: "GET",
        headers: {
          "X-Admin-Key": adminKey,
          "X-Tenant-Id": tenantId,
        },
        cache: "no-store",
      },
    );
    const text = await resp.text();
    return new NextResponse(text, {
      status: resp.status,
      headers: {
        "Content-Type": resp.headers.get("content-type") || "application/json",
      },
    });
  } catch (err) {
    console.error("qb invoice status proxy failed:", err);
    return NextResponse.json({ error: "bridge unavailable" }, { status: 502 });
  }
}
