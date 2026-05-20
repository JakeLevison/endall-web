/**
 * Customer-facing estimate approval page.
 *
 * Server fetches /api/public/approval/{token}. The proxy resolves the
 * token to estimate_id by calling the bridge's unauthenticated
 * GET /public/approval/{token} (R2-8c) and round-trips for the full
 * estimate payload. Any miss (token not found, expired, used, or any
 * infra failure) returns a uniform 404 so we never leak an enumeration
 * oracle. No service-role key is involved on this path.
 */

import { headers } from "next/headers";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  CustomerApprovalView,
  type PublicEstimate,
} from "@/components/estimates/CustomerApprovalView";
import { BookingApprovalView } from "@/components/bookings/BookingApprovalView";
import {
  isBookingMeta,
  resolveApprovalAnyViaBridge,
  resolveApprovalMetaViaBridge,
} from "@/lib/approval-bridge";

export const dynamic = "force-dynamic";

// Robots/referrer directives stay constant; only the title swaps based on
// whether the token resolves to a booking confirmation (no estimate) or
// an estimate approval. The token is in the URL path — without these
// directives, the URL can leak via Referer to subresources, end up in
// browser history, or get indexed if the customer ever pastes it into a
// public surface. H2 in the R2-8b security review.
const APPROVAL_ROBOTS = {
  robots: { index: false, follow: false, nocache: true },
  other: { referrer: "no-referrer" },
} as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  if (!token || token.length < 16) {
    return { title: "Approval", ...APPROVAL_ROBOTS };
  }
  const meta = await resolveApprovalAnyViaBridge(token);
  let title: string;
  if (isBookingMeta(meta)) {
    title =
      (meta.status || "").toLowerCase() === "cancelled"
        ? "Appointment cancelled"
        : "Appointment confirmation";
  } else {
    title = "Estimate approval";
  }
  return { title, ...APPROVAL_ROBOTS };
}

const BRIDGE_URL =
  process.env.ASK_ENDALL_BRIDGE_URL || "http://localhost:8101";

// Calls the bridge directly instead of round-tripping through our own
// /api/public/approval/{token} proxy. The SSR self-fetch path was
// failing silently in production (silent catch -> notFound -> bogus
// 404 to the customer) for deployment-specific reasons even though the
// /api/ route worked when hit externally. Same Node runtime, same
// bridge call as the route handler — no HTTPS loop, no middleware
// rerouting, errors are logged instead of swallowed.
async function fetchApproval(token: string): Promise<PublicEstimate | null> {
  const meta = await resolveApprovalMetaViaBridge(token);
  if (!meta) {
    console.error("approve page: token did not resolve via bridge");
    return null;
  }
  try {
    const url = new URL(BRIDGE_URL);
    url.pathname = `/estimates/${encodeURIComponent(meta.estimate_id)}/public`;
    url.searchParams.set("token", token);
    const resp = await fetch(url, { cache: "no-store" });
    if (!resp.ok) {
      console.error("approve page: bridge estimate fetch non-2xx", {
        status: resp.status,
        estimate_id: meta.estimate_id,
      });
      return null;
    }
    return (await resp.json()) as PublicEstimate;
  } catch (err) {
    console.error("approve page: bridge estimate fetch threw", err);
    return null;
  }
}

function tenantLabelFromSlug(slug: string): string {
  const cleaned = (slug || "").trim();
  if (!cleaned) return "Your contractor";
  return cleaned
    .split("-")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ");
}

export default async function ApprovePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  if (!token || token.length < 16) {
    notFound();
  }

  const hdrs = await headers();
  const tenantSlug = hdrs.get("x-tenant-slug") || "";

  // One resolver call decides the surface. Booking tokens (migration 087)
  // render the confirm/reschedule view; everything else stays on the
  // estimate path, byte-identical to before.
  const meta = await resolveApprovalAnyViaBridge(token);
  if (!meta) {
    notFound();
  }
  if (isBookingMeta(meta)) {
    return <BookingApprovalView token={token} initial={meta} />;
  }

  const initial = await fetchApproval(token);
  if (!initial) {
    notFound();
  }

  return (
    <CustomerApprovalView
      token={token}
      initial={initial}
      tenantLabel={tenantLabelFromSlug(tenantSlug)}
    />
  );
}
