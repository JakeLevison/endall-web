import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

/**
 * Hash an approval token the same way the bridge does (SHA-256 hex).
 * Source of truth: `_hash_token` in
 * chief-of-staff/deploy/ask-endall-bridge/routes/estimates.py.
 *
 * This duplicates a small bit of bridge logic on the frontend because
 * the bridge does not expose a token-only resolver endpoint , the
 * customer URL `/approve/{token}` carries no estimate_id, but the
 * bridge's `/estimates/{id}/public?token=` requires both. See
 * /tmp/r2-8b-questions.md (1) for the full discussion. When the bridge
 * ships `GET /public/approval/{token}`, this module should be deleted
 * and callers switched to a single proxy hop.
 */
export function hashApprovalToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export type ApprovalRowSummary = {
  estimate_id: string;
  tenant_id: string;
  token_used_at: string | null;
  token_expires_at: string;
};

/**
 * Service-role lookup of an approval row by token (hashed). Returns the
 * minimum needed to call the bridge's per-estimate endpoints; never
 * returns the encrypted email body, signature blob, or PDF path.
 *
 * Returns null on any miss (token not found, expired, or DB unreachable).
 * Callers MUST translate null into a uniform 404 , no enumeration oracles.
 */
export async function lookupApprovalByToken(
  token: string,
): Promise<ApprovalRowSummary | null> {
  if (!token || token.length < 16) return null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url || !serviceRoleKey) {
    console.error("approval-token: SUPABASE_SERVICE_ROLE_KEY missing");
    return null;
  }

  const sb = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await sb
    .from("customer_approvals")
    .select("estimate_id, tenant_id, token_used_at, token_expires_at")
    .eq("token_hash", hashApprovalToken(token))
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  // TTL check; the bridge re-validates, but failing fast here saves a
  // round-trip and keeps the 404 oracle uniform.
  const expires = new Date(data.token_expires_at as string);
  if (Number.isNaN(expires.getTime()) || expires.getTime() <= Date.now()) {
    return null;
  }

  return {
    estimate_id: String(data.estimate_id),
    tenant_id: String(data.tenant_id),
    token_used_at: (data.token_used_at as string | null) ?? null,
    token_expires_at: String(data.token_expires_at),
  };
}
