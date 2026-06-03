import { proxyBridgeQuery } from "@/lib/bridge-proxy";

// GET /api/agent-status?agent_id=
// Proxies bridge GET /api/agent-status. Tenant resolved server-side.
export async function GET(request: Request) {
  return proxyBridgeQuery(request, "/api/agent-status", ["agent_id"]);
}
