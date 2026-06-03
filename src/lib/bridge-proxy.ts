import { NextResponse } from "next/server";
import {
  resolveTenantFromSession,
  tenantUnresolvedResponse,
} from "@/lib/tenant-server";

const BRIDGE_URL =
  process.env.ASK_ENDALL_BRIDGE_URL || "http://localhost:8101";

// Proxy a GET to a bridge endpoint that takes tenant_id as a QUERY param
// (agent-logs / agent-status / agent-performance / command-center stats).
//
// Why this exists: the bridge sends no CORS header, so the command center's
// client-direct fetches are blocked by the browser. Routing them through a
// same-origin proxy fixes that AND keeps tenant resolution server-side — the
// proxy resolves tenant from the SSR session, forwards only the allowlisted
// client query params, and never trusts a client-supplied tenant_id.
export async function proxyBridgeQuery(
  request: Request,
  bridgePath: string,
  forward: string[] = [],
): Promise<Response> {
  const resolved = await resolveTenantFromSession();
  if (!resolved.ok) return tenantUnresolvedResponse(resolved.code);

  try {
    const url = new URL(BRIDGE_URL);
    url.pathname = bridgePath;
    const incoming = new URL(request.url).searchParams;
    for (const key of forward) {
      const value = incoming.get(key);
      if (value != null) url.searchParams.set(key, value);
    }
    // Server-injected tenant overrides any client-supplied value.
    url.searchParams.set("tenant_id", resolved.tenant_id);

    const resp = await fetch(url, {
      method: "GET",
      headers: { "X-Tenant-Id": resolved.tenant_id },
      cache: "no-store",
    });
    const text = await resp.text();
    return new NextResponse(text, {
      status: resp.status,
      headers: {
        "Content-Type":
          resp.headers.get("content-type") || "application/json",
      },
    });
  } catch (err) {
    console.error(`bridge proxy ${bridgePath} failed:`, err);
    return NextResponse.json({ error: "bridge unavailable" }, { status: 502 });
  }
}
