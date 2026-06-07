import { NextResponse, type NextRequest } from "next/server";
import { bridgeFetch } from "@/lib/bridge-fetch";

// YYYY-MM-DD with month 01-12 and day 01-31. Bridge is the source of
// truth for date semantics; rejecting structurally-bad values at the edge
// keeps the bridge log surface clean.
const DATE_PATTERN = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

// POST /api/day-plans/{date}/override
//
// Proxies to bridge POST /day-plans/{date}/override. bridgeFetch resolves the
// tenant from the SSR session and forwards the verified bearer token +
// X-Tenant-Id. 409 (race with 6am expiry) flows through unchanged.
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

  let body: string;
  try {
    body = await req.text();
  } catch {
    body = "{}";
  }

  const resp = await bridgeFetch(
    `/day-plans/${encodeURIComponent(date)}/override`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body || "{}",
    },
  );
  const text = await resp.text();
  return new NextResponse(text, {
    status: resp.status,
    headers: {
      "Content-Type": resp.headers.get("content-type") || "application/json",
    },
  });
}
