import { NextResponse, type NextRequest } from "next/server";
import {
  resolveTenantFromSession,
  tenantUnresolvedResponse,
} from "@/lib/tenant-server";

const BRIDGE_URL =
  process.env.ASK_ENDALL_BRIDGE_URL || "http://localhost:8101";

// YYYY-MM-DD with month 01-12 and day 01-31. The bridge is the source of
// truth for date semantics, but rejecting structurally-bad values at the
// edge avoids forwarding 400s to the bridge log surface.
const DATE_PATTERN = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

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
