import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingWizard } from "@/components/onboarding/wizard/OnboardingWizard";
import { OnboardingTokenError } from "@/components/onboarding/wizard/OnboardingTokenError";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function OnboardingLandingPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const code = typeof params.code === "string" ? params.code : null;

  if (code) {
    // Forward the auth code into the token-scoped route so the wizard flow
    // is consistent regardless of whether Supabase appended the token to the
    // path (scope spec) or as a ?code= query (current provisioner default).
    redirect(`/onboarding/${encodeURIComponent(code)}`);
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    return <OnboardingTokenError kind="missing" />;
  }

  const tenantId = extractTenantId(data.user);
  const tenantName = await resolveTenantName(supabase, tenantId);

  return (
    <OnboardingWizard
      adminEmail={data.user.email ?? ""}
      tenantId={tenantId}
      tenantName={tenantName}
      token={null}
    />
  );
}

function extractTenantId(
  user: { user_metadata?: Record<string, unknown>; app_metadata?: Record<string, unknown> } | null
): string | null {
  if (!user) return null;
  const fromUser = user.user_metadata?.tenant_id;
  const fromApp = user.app_metadata?.tenant_id;
  return typeof fromUser === "string" ? fromUser : typeof fromApp === "string" ? fromApp : null;
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
