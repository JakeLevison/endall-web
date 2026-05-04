import { NextResponse, type NextRequest } from "next/server";
import {
  resolveTenantFromSession,
  tenantUnresolvedResponse,
} from "@/lib/tenant-server";

const BRIDGE_URL =
  process.env.ASK_ENDALL_BRIDGE_URL || "http://localhost:8101";

// YYYY-MM-DD with month 01-12 and day 01-31. Bridge is the source of
// truth for date semantics; rejecting structurally-bad values at the edge
// keeps the bridge log surface clean.
const DATE_PATTERN = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

// POST /api/day-plans/{date}/override
//
// Proxies to bridge POST /day-plans/{date}/override. Mirrors the approve
// proxy: tenant resolved from the SSR session, body forwarded verbatim,
// bridge status passed through. 409 (race with 6am expiry) flows through
// unchanged so the FE can refetch and show the terminal expired banner.
export async function POST(
  req: NextRequest,
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

  let body: string;
  try {
    body = await req.text();
  } catch {
    body = "{}";
  }

  try {
    const url = new URL(BRIDGE_URL);
    url.pathname = `/day-plans/${encodeURIComponent(date)}/override`;
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "X-Tenant-Id": resolved.tenant_id,
        "Content-Type": "application/json",
      },
      body: body || "{}",
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
    console.error("day-plans override proxy failed:", err);
    return NextResponse.json({ error: "bridge unavailable" }, { status: 502 });
  }
}
