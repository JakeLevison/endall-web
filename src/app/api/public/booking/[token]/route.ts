/**
 * Public booking-lookup resolver. The booking confirmation email links
 * here (vs. /approve/{token} which is shared with the estimate flow).
 * Calls the bridge's GET /public/approval/{token} and only returns the
 * booking payload — never the estimate shape. Every non-booking
 * resolution (estimate, miss, infra failure) collapses to a uniform 404
 * so the token cannot enumerate the booking/estimate split.
 *
 * Caveat: today the bridge resolver auto-upgrades a booking token to an
 * estimate once /call-complete drafts an estimate. While that bridge
 * follow-up is open, a customer who clicks this link after the call
 * pipeline completes will 404. The /approve/{token} surface continues to
 * serve the upgraded case so estimate links keep working.
 */

import { NextResponse, type NextRequest } from "next/server";
import {
  isBookingMeta,
  resolveApprovalAnyViaBridge,
} from "@/lib/approval-bridge";

const notFound = () =>
  NextResponse.json({ error: "not found" }, { status: 404 });

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  const meta = await resolveApprovalAnyViaBridge(token);
  if (!meta || !isBookingMeta(meta)) return notFound();

  return NextResponse.json(meta, {
    status: 200,
    headers: { "Cache-Control": "private, no-store" },
  });
}
