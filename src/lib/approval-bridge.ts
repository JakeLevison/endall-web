/**
 * Resolves a customer-approval token to its estimate_id by calling the
 * bridge's public, unauthenticated endpoint. Replaces the prior shim
 * that hit Supabase directly with SUPABASE_SERVICE_ROLE_KEY; that key
 * no longer ships in any path that touches the FE bundle.
 *
 * Bridge contract (R2-8c, chief-of-staff PR #31):
 *   GET /public/approval/{token}
 *     200 -> { estimate_id, tenant_slug, decision, expires_at,
 *              line_items_summary, contractor_name, contractor_email,
 *              signature_already_captured, decided_at }
 *     404 -> { detail: "not found" }   (uniform on every miss: missing,
 *              expired, used, orphaned, or DB error)
 *
 * Returns null on any non-2xx or network failure. Callers MUST translate
 * null into a uniform 404 to deny enumeration oracles.
 */

const DEFAULT_BRIDGE_URL = "http://localhost:8101";

export type PublicApprovalMeta = {
  estimate_id: string;
  tenant_slug?: string;
  decision?: "approved" | "rejected" | null;
  expires_at?: string;
  line_items_summary?: Array<{ name: string; extended: number }>;
  contractor_name?: string;
  contractor_email?: string;
  signature_already_captured?: boolean;
  decided_at?: string | null;
};

// Voice booking-confirmation resolver payload (migration 087). Same
// /public/approval/{token} endpoint, discriminated by `kind`.
//
// `status` is the raw voice_jobs.status ("pending" | "confirmed" |
// "rescheduled" | "cancelled" | ...). Surfaced so the customer page can
// render a cancelled message — `decision` collapses cancelled and
// pending both to null.
//
// `estimate_id` is set once the call-complete pipeline drafts an
// estimate for this booking. The companion bridge_booking_token_to_
// estimate path mints a customer_approvals row with the same token hash,
// so the resolver itself auto-upgrades booking → estimate. The field is
// surfaced for client-side detection during the brief window before that
// bridge row exists.
export type PublicBookingMeta = {
  kind: "booking";
  voice_job_id: string;
  tenant_slug?: string;
  tenant_name?: string;
  tenant_phone?: string;
  caller_name?: string;
  job_type?: string;
  job_address?: string;
  scheduled_at?: string | null;
  status?: string;
  estimate_id?: string | null;
  decision?: "confirmed" | "rescheduled" | null;
  expires_at?: string;
};

export function isBookingMeta(
  meta: PublicApprovalMeta | PublicBookingMeta | null,
): meta is PublicBookingMeta {
  return !!meta && (meta as PublicBookingMeta).kind === "booking";
}

function bridgeBase(): string {
  return process.env.ASK_ENDALL_BRIDGE_URL || DEFAULT_BRIDGE_URL;
}

export async function resolveApprovalMetaViaBridge(
  token: string,
): Promise<PublicApprovalMeta | null> {
  if (!token || token.length < 16) return null;

  try {
    const url = new URL(bridgeBase());
    url.pathname = `/public/approval/${encodeURIComponent(token)}`;
    const resp = await fetch(url, { cache: "no-store" });
    if (!resp.ok) return null;
    const data = (await resp.json()) as Partial<PublicApprovalMeta>;
    if (!data || typeof data.estimate_id !== "string") return null;
    return data as PublicApprovalMeta;
  } catch {
    return null;
  }
}

/**
 * One-shot resolver that returns either an estimate meta or a booking
 * meta from the same /public/approval/{token} endpoint. The shared
 * /approve page uses this and branches on isBookingMeta(). Estimate-only
 * callers (approve/reject proxies) keep using resolveApprovalMetaViaBridge
 * so a booking token can never reach the estimate decision endpoints.
 */
export async function resolveApprovalAnyViaBridge(
  token: string,
): Promise<PublicApprovalMeta | PublicBookingMeta | null> {
  if (!token || token.length < 16) return null;

  try {
    const url = new URL(bridgeBase());
    url.pathname = `/public/approval/${encodeURIComponent(token)}`;
    const resp = await fetch(url, { cache: "no-store" });
    if (!resp.ok) return null;
    const data = (await resp.json()) as
      | Partial<PublicApprovalMeta>
      | Partial<PublicBookingMeta>;
    if (!data) return null;
    if ((data as PublicBookingMeta).kind === "booking") {
      if (typeof (data as PublicBookingMeta).voice_job_id !== "string") {
        return null;
      }
      return data as PublicBookingMeta;
    }
    if (typeof (data as PublicApprovalMeta).estimate_id !== "string") {
      return null;
    }
    return data as PublicApprovalMeta;
  } catch {
    return null;
  }
}
