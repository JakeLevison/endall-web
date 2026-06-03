import { proxyBridgeQuery } from "@/lib/bridge-proxy";

// GET /api/agent-performance?agent_id=&period=
// Proxies bridge GET /api/agent-performance. Tenant resolved server-side.
export async function GET(request: Request) {
  return proxyBridgeQuery(request, "/api/agent-performance", [
    "agent_id",
    "period",
  ]);
}
