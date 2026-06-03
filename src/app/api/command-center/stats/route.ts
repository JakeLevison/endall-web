import { proxyBridgeQuery } from "@/lib/bridge-proxy";

// GET /api/command-center/stats
// Proxies bridge GET /command-center/stats. Tenant resolved server-side.
export async function GET(request: Request) {
  return proxyBridgeQuery(request, "/command-center/stats", []);
}
