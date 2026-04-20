"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { posthog } from "@/lib/posthog";

export type TenantState = {
  tenant_id: string | null;
  loading: boolean;
  error:
    | "no_session"
    | "no_membership"
    | "supabase_client_init_failed"
    | null;
};

const MULTI_MEMBERSHIP_SESSION_KEY = "tenant_multi_membership_logged";

function logMultiMembershipOnce(
  userId: string,
  memberCount: number,
  selectedTenantId: string,
) {
  if (typeof window === "undefined") return;
  try {
    if (window.sessionStorage.getItem(MULTI_MEMBERSHIP_SESSION_KEY)) return;
    window.sessionStorage.setItem(MULTI_MEMBERSHIP_SESSION_KEY, "1");
  } catch {
    // sessionStorage unavailable (SSR, privacy mode) — fall through and still log
  }
  posthog.capture("tenant.multi_membership_detected", {
    user_id: userId,
    member_count: memberCount,
    selected_tenant_id: selectedTenantId,
  });
}

export function useTenant(): TenantState {
  const [state, setState] = useState<TenantState>({
    tenant_id: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    async function resolve() {
      let supabase;
      try {
        supabase = createClient();
      } catch (err) {
        console.error("useTenant: supabase client init failed", err);
        if (!cancelled)
          setState({
            tenant_id: null,
            loading: false,
            error: "supabase_client_init_failed",
          });
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (!cancelled)
          setState({ tenant_id: null, loading: false, error: "no_session" });
        return;
      }

      const { data, error } = await supabase
        .from("tenant_members")
        .select("tenant_id, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (cancelled) return;

      if (error || !data || data.length === 0) {
        setState({ tenant_id: null, loading: false, error: "no_membership" });
        return;
      }

      const selected = data[0].tenant_id as string;
      if (data.length > 1) {
        logMultiMembershipOnce(user.id, data.length, selected);
      }

      setState({ tenant_id: selected, loading: false, error: null });
    }
    resolve();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
