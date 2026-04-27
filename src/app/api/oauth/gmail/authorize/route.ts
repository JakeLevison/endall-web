import { NextResponse } from "next/server";
import {
  resolveTenantFromSession,
  tenantUnresolvedResponse,
} from "@/lib/tenant-server";

const BRIDGE_URL =
  process.env.ASK_ENDALL_BRIDGE_URL || "http://localhost:8101";

/**
 * Kick off Gmail OAuth. The bridge handles the Google round-trip and
 * redirects the browser to ENDALL_OAUTH_FRONTEND_RETURN_URL when done
 * (default https://endall.ai/settings/integrations) with ?connected=1
 * or ?error=...
 */
export async function GET() {
  const adminKey = process.env.ASK_ENDALL_ADMIN_KEY || "";
  if (!adminKey) {
    return NextResponse.json(
      { error: "server admin key not configured" },
      { status: 500 },
    );
  }

  const resolved = await resolveTenantFromSession();
  if (!resolved.ok) return tenantUnresolvedResponse(resolved.code);

  const url = new URL(BRIDGE_URL);
  url.pathname = "/integrations/gmail/authorize";
  url.searchParams.set("tenant_id", resolved.tenant_id);
  url.searchParams.set("admin_key", adminKey);
  return NextResponse.redirect(url);
}
