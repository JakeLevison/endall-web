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

export const dynamic = "force-dynamic";

// The token is in the URL path. Without these directives, the URL can
// leak via Referer to subresources, end up in browser history, or get
// indexed if the customer ever pastes it into a public surface. H2 in
// the R2-8b security review.
export const metadata: Metadata = {
  title: "Estimate approval",
  robots: { index: false, follow: false, nocache: true },
  other: { referrer: "no-referrer" },
};

async function fetchApproval(
  token: string,
  origin: string,
): Promise<PublicEstimate | null> {
  try {
    const url = new URL(origin);
    url.pathname = `/api/public/approval/${encodeURIComponent(token)}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as PublicEstimate;
  } catch {
    return null;
  }
}

function originFromHeaders(host: string | null): string {
  const h = (host || "").trim();
  if (!h) return "http://localhost:3000";
  const proto =
    h.startsWith("localhost") || h.includes("127.0.0.1") ? "http" : "https";
  return `${proto}://${h}`;
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
  const origin = originFromHeaders(hdrs.get("host"));
  const tenantSlug = hdrs.get("x-tenant-slug") || "";
  const initial = await fetchApproval(token, origin);
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
