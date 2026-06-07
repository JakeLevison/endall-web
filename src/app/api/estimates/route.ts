import { NextResponse } from "next/server";
import { bridgeFetch } from "@/lib/bridge-fetch";

// GET /api/estimates
//
// List proxy. bridgeFetch resolves the tenant from the SSR session and forwards
// the verified bearer token + X-Tenant-Id. The estimates bridge path is
// /estimates (NON-/api-prefixed). The bridge wraps rows as { estimates: [...],
// count }; we unwrap to a bare array (tolerating { rows: [...] } or a bare array
// too) so list consumers get a stable shape. Bridge non-2xx responses are
// surfaced verbatim.
export async function GET() {
  const resp = await bridgeFetch("/estimates");
  if (!resp.ok) {
    const text = await resp.text();
    return new NextResponse(text, {
      status: resp.status,
      headers: {
        "Content-Type": resp.headers.get("content-type") || "application/json",
      },
    });
  }
  const payload: unknown = await resp.json();
  const rows: unknown[] = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { estimates?: unknown[] })?.estimates)
      ? (payload as { estimates: unknown[] }).estimates
      : Array.isArray((payload as { rows?: unknown[] })?.rows)
        ? (payload as { rows: unknown[] }).rows
        : [];
  return NextResponse.json(rows);
}
