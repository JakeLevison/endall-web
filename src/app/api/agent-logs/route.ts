import { proxyBridgeQuery } from "@/lib/bridge-proxy";

// GET /api/agent-logs?agent_id=&limit=
// Proxies bridge GET /api/agent-logs. Tenant resolved server-side.
export async function GET(request: Request) {
  return proxyBridgeQuery(request, "/api/agent-logs", ["agent_id", "limit"]);
}
