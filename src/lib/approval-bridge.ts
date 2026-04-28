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
