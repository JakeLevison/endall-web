import { NextRequest, NextResponse } from "next/server";
import {
  resolveTenantFromSession,
  tenantUnresolvedResponse,
} from "@/lib/tenant-server";

// Proxy POST /integrations/quickbooks/invoices/{invoice_id}/push.
// Injects admin key from server env, forwards resolved tenant as X-Tenant-Id.
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ invoice_id: string }> },
) {
  const { invoice_id } = await params;
  const bridgeUrl = process.env.ASK_ENDALL_BRIDGE_URL || "http://localhost:8101";
  const adminKey = process.env.ASK_ENDALL_ADMIN_KEY || "";

  if (!adminKey) {
    return NextResponse.json(
      { error: "server admin key not configured" },
      { status: 500 },
    );
  }

  const resolved = await resolveTenantFromSession();
  if (!resolved.ok) return tenantUnresolvedResponse(resolved.code);

  try {
    const url = new URL(bridgeUrl);
    url.pathname = `/integrations/quickbooks/invoices/${encodeURIComponent(invoice_id)}/push`;
    const resp = await fetch(
      url,
      {
        method: "POST",
        headers: {
          "X-Admin-Key": adminKey,
          "X-Tenant-Id": resolved.tenant_id,
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
