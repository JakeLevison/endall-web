import { NextResponse } from "next/server";
import {
  resolveTenantFromSession,
  tenantUnresolvedResponse,
} from "@/lib/tenant-server";

/**
 * Server-only wrapper for every authenticated web -> bridge call.
 *
 * Why this exists: the bridge is moving from trusting a bare `X-Tenant-Id`
 * header to verifying a Supabase access token and deriving the tenant from
 * `tenant_members` server-side (see the bridge's `security/auth.py` and
 * `vault/Endall/UPDATE_SITES_FOLLOWUPS.md`). For that to work without breaking
 * the web app, every server-side bridge call must forward the caller's verified
 * session token. This wrapper is the single chokepoint that does so.
 *
 * Each call attaches three headers, resolved from the SSR session (never from
 * client input):
 *   - `Authorization: Bearer <access_token>`  -> the target (bearer) path
 *   - `X-Tenant-Id: <tenant_id>`              -> a CLAIM the bridge validates
 *                                                against the token's memberships
 *   - `X-Internal-Service-Token: <secret>`    -> web SOAK fallback only
 *
 * SOAK NOTE / REMOVAL TRIGGER: `X-Internal-Service-Token` carries the
 * server-only INTERNAL_WEBHOOK_SECRET so a call still resolves if the bearer
 * token is briefly unavailable during rollout. It is a server-to-server secret,
 * never exposed to the browser. The bridge logs `service_token_auth_path` every
 * time it resolves via this header. Remove this header here AND the
 * service-token branch in the bridge once that log shows zero hits across a full
 * 72-hour prod soak. Tracked in `vault/Endall/UPDATE_SITES_FOLLOWUPS.md`.
 *
 * The verified tenant overrides any client-supplied tenant on both the header
 * and the `tenant_id` query param, so a client cannot assert another tenant.
 */

const BRIDGE_URL = process.env.ASK_ENDALL_BRIDGE_URL || "http://localhost:8101";

export type BridgeAuth =
  | {
      ok: true;
      tenant_id: string;
      user_id: string;
      access_token?: string;
    }
  | { ok: false; code: "NO_SESSION" | "NO_TENANT_MEMBERSHIP" };

/**
 * Resolve the caller's verified tenant, user id, and access token from the SSR
 * session. Delegates to resolveTenantFromSession (which validates via getUser,
 * reads the tenant from tenant_members, and now also returns the access_token),
 * so a single mock point covers both the legacy proxies and bridgeFetch.
 */
export async function resolveBridgeAuth(): Promise<BridgeAuth> {
  return resolveTenantFromSession();
}

export const bridgeUnresolvedResponse = tenantUnresolvedResponse;

/**
 * Authenticated fetch to a bridge endpoint. Resolves the SSR session, injects
 * the auth + tenant headers (overriding any client-supplied value), and returns
 * the bridge's raw `Response`. If the session/tenant cannot be resolved, returns
 * a 403 `Response` so a route handler can `return bridgeFetch(...)` directly.
 *
 * `bridgePath` may include a query string; the verified `tenant_id` is set as a
 * query param too, for the bridge endpoints that read tenant from the query
 * (command-center, agent-*). Extra query param is harmless for header-reading
 * endpoints.
 */
export async function bridgeFetch(
  bridgePath: string | ((tenantId: string) => string),
  init: RequestInit = {},
): Promise<Response> {
  const auth = await resolveBridgeAuth();
  if (!auth.ok) return bridgeUnresolvedResponse(auth.code);

  // Path-tenant bridge routes (metrics/{tenant_id}, reports/{tenant_id},
  // prospects/{tenant_id}, intelligence/.../{tenant_id}) pass a builder that
  // receives the verified tenant; header/query-tenant routes pass a plain path.
  const path =
    typeof bridgePath === "function" ? bridgePath(auth.tenant_id) : bridgePath;
  const url = new URL(path, BRIDGE_URL);
  // The verified tenant travels in the X-Tenant-Id header (and the path for
  // path-tenant routes); strip any client-supplied tenant_id query param so a
  // client can never assert a tenant via the query string.
  url.searchParams.delete("tenant_id");

  const serviceToken = process.env.INTERNAL_WEBHOOK_SECRET;

  // Caller headers first; auth/tenant headers last so they cannot be
  // overridden. Plain record (not Headers) so callers and tests can read keys
  // by exact name; all callers pass plain-object headers.
  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string> | undefined),
  };
  if (auth.access_token) {
    headers["Authorization"] = `Bearer ${auth.access_token}`;
  }
  headers["X-Tenant-Id"] = auth.tenant_id;
  if (serviceToken) headers["X-Internal-Service-Token"] = serviceToken;

  try {
    return await fetch(url, {
      ...init,
      headers,
      cache: init.cache ?? "no-store",
    });
  } catch (err) {
    console.error(`bridgeFetch ${url.pathname} failed:`, err);
    return NextResponse.json({ error: "bridge unavailable" }, { status: 502 });
  }
}
