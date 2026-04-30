import { NextResponse, type NextRequest } from "next/server";
import {
  resolveTenantFromSession,
  tenantUnresolvedResponse,
} from "@/lib/tenant-server";

const BRIDGE_URL =
  process.env.ASK_ENDALL_BRIDGE_URL || "http://localhost:8101";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// POST /api/day-plans/{date}/approve
//
// Proxies to bridge POST /day-plans/{date}/approve. 409 from the bridge
// (plan expired during the approval click) flows through unchanged so the
// FE can show the terminal "expired" banner instead of a generic error.
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
    url.pathname = `/day-plans/${encodeURIComponent(date)}/approve`;
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
    console.error("day-plans approve proxy failed:", err);
    return NextResponse.json({ error: "bridge unavailable" }, { status: 502 });
  }
}
