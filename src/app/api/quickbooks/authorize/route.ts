import { NextResponse } from "next/server";
import {
  resolveTenantFromSession,
  tenantUnresolvedResponse,
} from "@/lib/tenant-server";

export async function GET() {
  const bridgeUrl =
    process.env.ASK_ENDALL_BRIDGE_URL || "http://localhost:8101";
  const adminKey = process.env.ASK_ENDALL_ADMIN_KEY || "";

  if (!adminKey) {
    return NextResponse.json(
      { error: "server admin key not configured" },
      { status: 500 }
    );
  }

  const resolved = await resolveTenantFromSession();
  if (!resolved.ok) return tenantUnresolvedResponse(resolved.code);

  const url = `${bridgeUrl}/integrations/quickbooks/authorize?tenant_id=${encodeURIComponent(
    resolved.tenant_id
  )}&admin_key=${encodeURIComponent(adminKey)}`;

  return NextResponse.redirect(url);
}
