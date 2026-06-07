import { NextResponse } from "next/server";
import { resolveBridgeAuth, bridgeUnresolvedResponse } from "@/lib/bridge-fetch";

const BRIDGE_URL =
  process.env.ASK_ENDALL_BRIDGE_URL || "http://localhost:8101";

// Proxy a GET to a bridge endpoint that takes tenant_id as a QUERY param
// (agent-logs / agent-status / agent-performance / command-center stats).
//
// Why this exists: the bridge sends no CORS header, so the command center's
// client-direct fetches are blocked by the browser. Routing them through a
// same-origin proxy fixes that AND keeps tenant resolution server-side — the
// proxy resolves tenant + access token from the SSR session, forwards only the
// allowlisted client query params, and never trusts a client-supplied
// tenant_id. It now also forwards the Supabase bearer token (+ the service-token
// soak fallback) so the bridge can verify identity server-side; see
// bridge-fetch.ts.
export async function proxyBridgeQuery(
  request: Request,
  bridgePath: string,
  forward: string[] = [],
): Promise<Response> {
  const auth = await resolveBridgeAuth();
  if (!auth.ok) return bridgeUnresolvedResponse(auth.code);

  try {
    const url = new URL(BRIDGE_URL);
    url.pathname = bridgePath;
    const incoming = new URL(request.url).searchParams;
    for (const key of forward) {
      const value = incoming.get(key);
      if (value != null) url.searchParams.set(key, value);
    }
    // Server-injected tenant overrides any client-supplied value.
    url.searchParams.set("tenant_id", auth.tenant_id);

    const serviceToken = process.env.INTERNAL_WEBHOOK_SECRET;
    const headers: Record<string, string> = { "X-Tenant-Id": auth.tenant_id };
    if (auth.access_token) {
      headers["Authorization"] = `Bearer ${auth.access_token}`;
    }
    if (serviceToken) headers["X-Internal-Service-Token"] = serviceToken;

    const resp = await fetch(url, {
      method: "GET",
      headers,
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
