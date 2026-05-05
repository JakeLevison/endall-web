import { NextResponse, type NextRequest } from "next/server";

const BRIDGE_URL =
  process.env.ASK_ENDALL_BRIDGE_URL ||
  "https://ask-endall-bridge-production.up.railway.app";

// GET /api/cron/day-plans/tick-22h
//
// Vercel cron entrypoint. Vercel's scheduler hits this hourly (UTC) with
// `Authorization: Bearer ${CRON_SECRET}`. We verify that header, then POST
// to the bridge with the bridge's expected `x-cron-secret` header. The
// bridge handler iterates tenants and only generates a plan for those whose
// local time is currently in the 22:00-22:59 window — DST is handled by the
// bridge via `tenant_now()` per-tenant tz-aware datetimes.
//
// Same `CRON_SECRET` env var must be set on Vercel and Railway. Vercel
// reads it to mint the Bearer header; this route reads it to verify and
// re-stamp as `x-cron-secret`. The bridge reads it to verify the inbound.
export async function GET(req: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 },
    );
  }
  const auth = req.headers.get("authorization") || "";
  if (auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(BRIDGE_URL);
    url.pathname = "/cron/day-plans/tick-22h";
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "x-cron-secret": expected,
        "Content-Type": "application/json",
      },
      body: "{}",
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
    console.error("cron tick-22h proxy failed:", err);
    return NextResponse.json({ error: "bridge unavailable" }, { status: 502 });
  }
}
