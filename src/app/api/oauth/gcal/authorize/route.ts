import { NextResponse } from "next/server";
import {
  resolveTenantFromSession,
  tenantUnresolvedResponse,
} from "@/lib/tenant-server";

const BRIDGE_URL =
  process.env.ASK_ENDALL_BRIDGE_URL || "http://localhost:8101";

/**
 * Kick off Google Calendar OAuth. Mirrors the Gmail/QuickBooks authorize
 * proxies: fetch the bridge `/integrations/gcal/authorize` with an
 * `X-Admin-Key` header (admin_key never leaves the server) and return
 * `{ auth_url }`. The client navigates the browser to `auth_url`.
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
  url.pathname = "/integrations/gcal/authorize";
  url.searchParams.set("tenant_id", resolved.tenant_id);

  let bridgeRes: Response;
  try {
    bridgeRes = await fetch(url, {
      headers: { "X-Admin-Key": adminKey },
      cache: "no-store",
    });
  } catch (err) {
    console.error("oauth/gcal/authorize: bridge fetch failed:", err);
    return NextResponse.json(
      { error: "bridge unavailable" },
      { status: 502 },
    );
  }

  if (!bridgeRes.ok) {
    return NextResponse.json(
      { error: "bridge unavailable" },
      { status: 502 },
    );
  }

  const data = (await bridgeRes.json()) as { auth_url?: string };
  if (typeof data.auth_url !== "string" || !data.auth_url) {
    return NextResponse.json(
      { error: "bridge returned no auth_url" },
      { status: 502 },
    );
  }

  return NextResponse.json({ auth_url: data.auth_url });
}
