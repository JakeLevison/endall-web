import { type NextRequest } from "next/server";
import { proxyOnboardingStep } from "../_proxy";

export async function PATCH(req: NextRequest) {
  return proxyOnboardingStep(req, {
    method: "PATCH",
    pathTemplate: "/tenants/{tenant_id}/company-details",
    step: "company-details",
  });
}
