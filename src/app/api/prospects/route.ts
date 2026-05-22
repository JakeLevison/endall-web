import { NextResponse, type NextRequest } from "next/server";
import {
  resolveTenantFromSession,
  tenantUnresolvedResponse,
} from "@/lib/tenant-server";

const BRIDGE_URL =
  process.env.ASK_ENDALL_BRIDGE_URL || "http://localhost:8101";

// GET /api/prospects
//
// Proxies to bridge GET /prospects/{tenant_id}. Tenant is resolved from
// the SSR session and embedded into the bridge URL path. Optional
// status, source, limit, and offset query params are passed through.
export async function GET(req: NextRequest) {
  const resolved = await resolveTenantFromSession();
  if (!resolved.ok) return tenantUnresolvedResponse(resolved.code);

  try {
    const url = new URL(BRIDGE_URL);
    url.pathname = `/prospects/${encodeURIComponent(resolved.tenant_id)}`;
    const incoming = new URL(req.url);
    for (const key of ["status", "source", "limit", "offset"] as const) {
      const v = incoming.searchParams.get(key);
      if (v != null) url.searchParams.set(key, v);
    }
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
    console.error("prospects list proxy failed:", err);
    return NextResponse.json({ error: "bridge unavailable" }, { status: 502 });
  }
}

// POST /api/prospects
//
// Proxies to bridge POST /prospects/{tenant_id}. Forwards the JSON body
// verbatim; tenant_id is embedded into the bridge URL path (never trusted
// from the client).
export async function POST(req: NextRequest) {
  const resolved = await resolveTenantFromSession();
  if (!resolved.ok) return tenantUnresolvedResponse(resolved.code);

  try {
    const body = await req.text();
    const url = new URL(BRIDGE_URL);
    url.pathname = `/prospects/${encodeURIComponent(resolved.tenant_id)}`;
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "X-Tenant-Id": resolved.tenant_id,
        "Content-Type": "application/json",
      },
      body,
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
    console.error("prospects create proxy failed:", err);
    return NextResponse.json({ error: "bridge unavailable" }, { status: 502 });
  }
}
