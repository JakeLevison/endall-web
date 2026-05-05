import { NextResponse, type NextRequest } from "next/server";

const BRIDGE_URL =
  process.env.ASK_ENDALL_BRIDGE_URL ||
  "https://ask-endall-bridge-production.up.railway.app";

// GET /api/cron/day-plans/tick-6am
//
// Vercel cron entrypoint mirroring tick-22h. Bridge handler expires
// unapproved proposed plans for tenants whose local time is in the
// 06:00-06:59 window (and falls back to yesterday's approved assignments).
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
    url.pathname = "/cron/day-plans/tick-6am";
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
    console.error("cron tick-6am proxy failed:", err);
    return NextResponse.json({ error: "bridge unavailable" }, { status: 502 });
  }
}
