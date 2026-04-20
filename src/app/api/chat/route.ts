import { NextRequest } from "next/server";
import {
  resolveTenantFromSession,
  tenantUnresolvedResponse,
} from "@/lib/tenant-server";
import { handleChat } from "./handler";

// Allow up to 120s for Skills API file generation (pause_turn loops)
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  const resolved = await resolveTenantFromSession();
  if (!resolved.ok) return tenantUnresolvedResponse(resolved.code);
  return handleChat(request, resolved.tenant_id);
}
