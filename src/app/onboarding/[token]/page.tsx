import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingWizard } from "@/components/onboarding/wizard/OnboardingWizard";
import { OnboardingTokenError } from "@/components/onboarding/wizard/OnboardingTokenError";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function OnboardingTokenPage({
  params,
  searchParams,
}: PageProps) {
  const { token } = await params;
  const { consumed } = await searchParams;

  if (!token || typeof token !== "string" || token.length < 6) {
    return <OnboardingTokenError kind="invalid" />;
  }

  const supabase = await createClient();
  const { data: sessionData } = await supabase.auth.getUser();

  if (sessionData.user) {
    const tenantId = extractTenantId(sessionData.user);
    const tenantName = await resolveTenantName(supabase, tenantId);
    return (
      <OnboardingWizard
        adminEmail={sessionData.user.email ?? ""}
        tenantId={tenantId}
        tenantName={tenantName}
        token={token}
      />
    );
  }

  if (consumed === "1") {
    // Came back from /auth/callback without a session — token was bad or expired.
    return <OnboardingTokenError kind="expired" />;
  }

  // Hand the token to the existing Supabase PKCE exchange endpoint. That
  // endpoint (src/app/auth/callback/route.ts) is the server-side validator —
  // it calls supabase.auth.exchangeCodeForSession which Supabase enforces
  // (one-time use, TTL, signature). On success it redirects back here with a
  // live session; on failure it redirects to /login with ?error=auth_failed.
  const callback = new URL(
    "/auth/callback",
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  );
  callback.searchParams.set("code", token);
  callback.searchParams.set("next", `/onboarding/${token}?consumed=1`);
  redirect(callback.pathname + callback.search);
}

function extractTenantId(
  user: { user_metadata?: Record<string, unknown>; app_metadata?: Record<string, unknown> } | null
): string | null {
  if (!user) return null;
  const fromUser = user.user_metadata?.tenant_id;
  const fromApp = user.app_metadata?.tenant_id;
  const raw = typeof fromUser === "string" ? fromUser : typeof fromApp === "string" ? fromApp : null;
  return raw;
}

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

async function resolveTenantName(
  supabase: SupabaseServerClient,
  tenantId: string | null
): Promise<string> {
  if (!tenantId) return "your company";
  try {
    const { data } = await supabase
      .from("tenants")
      .select("company_name, name")
      .eq("id", tenantId)
      .maybeSingle();
    if (!data) return "your company";
    const record = data as { company_name?: string | null; name?: string | null };
    return record.company_name || record.name || "your company";
  } catch {
    return "your company";
  }
}
