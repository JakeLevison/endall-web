import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export type TenantResolution =
  | { ok: true; tenant_id: string; user_id: string }
  | { ok: false; code: "NO_SESSION" | "NO_TENANT_MEMBERSHIP" };

export async function resolveTenantFromSession(): Promise<TenantResolution> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, code: "NO_SESSION" };

  const { data, error } = await supabase
    .from("tenant_members")
    .select("tenant_id, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !data) return { ok: false, code: "NO_TENANT_MEMBERSHIP" };

  return { ok: true, tenant_id: data.tenant_id as string, user_id: user.id };
}

export function tenantUnresolvedResponse(
  code: "NO_SESSION" | "NO_TENANT_MEMBERSHIP",
) {
  return NextResponse.json(
    { error: "tenant_unresolved", code },
    { status: 403 },
  );
}
