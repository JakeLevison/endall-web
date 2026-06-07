import { NextResponse, type NextRequest } from "next/server";
import { bridgeFetch } from "@/lib/bridge-fetch";

// GET /api/prospects
//
// Proxies to bridge GET /prospects/{tenant_id}. bridgeFetch resolves the tenant
// from the SSR session and embeds it in the bridge path (never trusted from the
// client). Optional status, source, limit, offset query params pass through.
export async function GET(req: NextRequest) {
  const incoming = new URL(req.url).searchParams;
  const params = new URLSearchParams();
  for (const key of ["status", "source", "limit", "offset"] as const) {
    const v = incoming.get(key);
    if (v != null) params.set(key, v);
  }
  const qs = params.toString();
  const resp = await bridgeFetch(
    (tenantId) => `/prospects/${encodeURIComponent(tenantId)}${qs ? `?${qs}` : ""}`,
  );
  const text = await resp.text();
  return new NextResponse(text, {
    status: resp.status,
    headers: {
      "Content-Type": resp.headers.get("content-type") || "application/json",
    },
  });
}

// POST /api/prospects -> bridge POST /prospects/{tenant_id}.
export async function POST(req: NextRequest) {
  const body = await req.text();
  const resp = await bridgeFetch(
    (tenantId) => `/prospects/${encodeURIComponent(tenantId)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    },
  );
  const text = await resp.text();
  return new NextResponse(text, {
    status: resp.status,
    headers: {
      "Content-Type": resp.headers.get("content-type") || "application/json",
    },
  });
}
