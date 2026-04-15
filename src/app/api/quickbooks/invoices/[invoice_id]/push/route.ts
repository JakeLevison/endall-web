import { NextRequest, NextResponse } from "next/server";

// Proxy POST /integrations/quickbooks/invoices/{invoice_id}/push.
// Injects admin key from server env, forwards X-Tenant-Id header.
export async function POST(
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
    return NextResponse.json(
      { error: "tenant id missing" },
      { status: 400 },
    );
  }

  try {
    const resp = await fetch(
      `${bridgeUrl}/integrations/quickbooks/invoices/${encodeURIComponent(invoice_id)}/push`,
      {
        method: "POST",
        headers: {
          "X-Admin-Key": adminKey,
          "X-Tenant-Id": tenantId,
          "Content-Type": "application/json",
        },
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
    console.error("quickbooks push proxy failed:", err);
    return NextResponse.json(
      { error: "bridge unavailable" },
      { status: 502 },
    );
  }
}
