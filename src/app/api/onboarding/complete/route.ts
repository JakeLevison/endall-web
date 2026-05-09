import { type NextRequest } from "next/server";
import { proxyOnboardingStep } from "../_proxy";

export async function POST(req: NextRequest) {
  return proxyOnboardingStep(req, {
    method: "POST",
    pathTemplate: "/tenants/{tenant_id}/onboarding/complete",
    step: "complete",
  });
}
