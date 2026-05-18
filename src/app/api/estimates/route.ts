import { NextResponse } from "next/server";
import {
  resolveTenantFromSession,
  tenantUnresolvedResponse,
} from "@/lib/tenant-server";

const BRIDGE_URL =
  process.env.ASK_ENDALL_BRIDGE_URL || "http://localhost:8101";

// GET /api/estimates
//
// List proxy mirroring src/app/api/estimates/[id]/route.ts: tenant resolved
// from the SSR session and passed through as X-Tenant-Id. The estimates
// bridge path is /estimates (NON-/api-prefixed -- the inverse of jobs and
// contacts). The bridge wraps rows as { estimates: [...], count }; we unwrap
// to a bare array (tolerating { rows: [...] } or a bare array too, same
// defensive shape as the contacts fix) so list consumers get a stable shape.
// Bridge non-2xx responses are surfaced verbatim with their status.
export async function GET() {
  const resolved = await resolveTenantFromSession();
  if (!resolved.ok) return tenantUnresolvedResponse(resolved.code);

  try {
    const url = new URL(BRIDGE_URL);
    url.pathname = "/estimates";
    const resp = await fetch(url, {
      method: "GET",
      headers: { "X-Tenant-Id": resolved.tenant_id },
      cache: "no-store",
    });
    if (!resp.ok) {
      const text = await resp.text();
      return new NextResponse(text, {
        status: resp.status,
        headers: {
          "Content-Type":
            resp.headers.get("content-type") || "application/json",
        },
      });
    }
    const payload: unknown = await resp.json();
    const rows: unknown[] = Array.isArray(payload)
      ? payload
      : Array.isArray((payload as { estimates?: unknown[] })?.estimates)
        ? (payload as { estimates: unknown[] }).estimates
        : Array.isArray((payload as { rows?: unknown[] })?.rows)
          ? (payload as { rows: unknown[] }).rows
          : [];
    return NextResponse.json(rows);
  } catch (err) {
    console.error("estimates list proxy failed:", err);
    return NextResponse.json({ error: "bridge unavailable" }, { status: 502 });
  }
}
