/**
 * Public booking-confirmation proxy (migration 087). Resolves the token
 * via the bridge, verifies it is a booking token, then forwards to the
 * bridge's POST /public/booking/{token}/confirm. Uniform 404 on every
 * miss so the token is not an enumeration oracle (mirrors the estimate
 * approve proxy).
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

export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  const meta = await resolveApprovalAnyViaBridge(token);
  if (!meta || !isBookingMeta(meta)) return notFound();

  try {
    const url = new URL(BRIDGE_URL);
    url.pathname = `/public/booking/${encodeURIComponent(token)}/confirm`;
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
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
    console.error("public booking confirm proxy failed:", err);
    return notFound();
  }
}
