/**
 * Public booking-reschedule proxy (migration 087). Resolves + validates
 * the token is a booking token, shallow-validates the new_date string,
 * then forwards to the bridge's POST /public/booking/{token}/reschedule.
 * The bridge is the authority on the weekday / 14-day-window rules; this
 * proxy only guards shape and the enumeration oracle.
 */

import { NextResponse, type NextRequest } from "next/server";
import {
  isBookingMeta,
  resolveApprovalAnyViaBridge,
} from "@/lib/approval-bridge";

const BRIDGE_URL =
  process.env.ASK_ENDALL_BRIDGE_URL || "http://localhost:8101";

const notFound = () =>
  NextResponse.json({ error: "not found" }, { status: 404 });

// YYYY-MM-DD or a full ISO datetime; anything else is rejected before we
// touch the bridge.
const DATE_RE = /^\d{4}-\d{2}-\d{2}([T ].*)?$/;

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  const meta = await resolveApprovalAnyViaBridge(token);
  if (!meta || !isBookingMeta(meta)) return notFound();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const newDate = (body as { new_date?: unknown })?.new_date;
  if (typeof newDate !== "string" || !DATE_RE.test(newDate)) {
    return NextResponse.json(
      { error: "new_date must be an ISO date" },
      { status: 400 },
    );
  }

  try {
    const url = new URL(BRIDGE_URL);
    url.pathname = `/public/booking/${encodeURIComponent(token)}/reschedule`;
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ new_date: newDate }),
      cache: "no-store",
    });
    if (resp.status === 400) {
      // The bridge rejected the date (weekend / past / out of window).
      // Pass that through so the customer can pick again, rather than a
      // misleading 404.
      const text = await resp.text();
      return new NextResponse(text, {
        status: 400,
        headers: {
          "Content-Type":
            resp.headers.get("content-type") || "application/json",
          "Cache-Control": "private, no-store",
        },
      });
    }
    if (!resp.ok) return notFound();
    const text = await resp.text();
    return new NextResponse(text, {
      status: 200,
      headers: {
        "Content-Type":
          resp.headers.get("content-type") || "application/json",
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    console.error("public booking reschedule proxy failed:", err);
    return notFound();
  }
}
