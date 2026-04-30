import { NextResponse, type NextRequest } from "next/server";
import {
  resolveTenantFromSession,
  tenantUnresolvedResponse,
} from "@/lib/tenant-server";

const BRIDGE_URL =
  process.env.ASK_ENDALL_BRIDGE_URL || "http://localhost:8101";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// GET /api/day-plans/{date}
//
// Proxies to bridge GET /day-plans/{date}?expand=true so the Dispatch page
// can render per-tech grouped sections in one round trip. Pattern matches
// src/app/api/jobs/upcoming/route.ts: tenant resolved from the SSR session,
// passed through as X-Tenant-Id; bridge response surfaced verbatim.
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ date: string }> },
) {
  const { date } = await context.params;
  if (!DATE_PATTERN.test(date)) {
    return NextResponse.json(
      { error: "date must be YYYY-MM-DD" },
      { status: 400 },
    );
  }
  const resolved = await resolveTenantFromSession();
  if (!resolved.ok) return tenantUnresolvedResponse(resolved.code);

  try {
    const url = new URL(BRIDGE_URL);
    url.pathname = `/day-plans/${encodeURIComponent(date)}`;
    url.searchParams.set("expand", "true");
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
    console.error("day-plans get proxy failed:", err);
    return NextResponse.json({ error: "bridge unavailable" }, { status: 502 });
  }
}
