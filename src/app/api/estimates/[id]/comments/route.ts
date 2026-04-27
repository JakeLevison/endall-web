import { NextResponse, type NextRequest } from "next/server";
import {
  resolveTenantFromSession,
  tenantUnresolvedResponse,
} from "@/lib/tenant-server";

const BRIDGE_URL =
  process.env.ASK_ENDALL_BRIDGE_URL || "http://localhost:8101";

function bridgeFetch(path: string, init: RequestInit, tenantId: string) {
  const url = new URL(BRIDGE_URL);
  url.pathname = path;
  return fetch(url, {
    ...init,
    headers: {
      ...(init.headers || {}),
      "X-Tenant-Id": tenantId,
    },
    cache: "no-store",
  });
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const resolved = await resolveTenantFromSession();
  if (!resolved.ok) return tenantUnresolvedResponse(resolved.code);

  try {
    const resp = await bridgeFetch(
      `/estimates/${encodeURIComponent(id)}/comments`,
      { method: "GET" },
      resolved.tenant_id,
    );
    const text = await resp.text();
    return new NextResponse(text, {
      status: resp.status,
      headers: {
        "Content-Type":
          resp.headers.get("content-type") || "application/json",
      },
    });
  } catch (err) {
    console.error("comments GET proxy failed:", err);
    return NextResponse.json({ error: "bridge unavailable" }, { status: 502 });
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const resolved = await resolveTenantFromSession();
  if (!resolved.ok) return tenantUnresolvedResponse(resolved.code);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  if (
    !body ||
    typeof body !== "object" ||
    typeof (body as { body?: unknown }).body !== "string"
  ) {
    return NextResponse.json(
      { error: "body field required" },
      { status: 400 },
    );
  }
  const text = ((body as { body: string }).body || "").trim();
  if (!text) {
    return NextResponse.json(
      { error: "comment body cannot be empty" },
      { status: 400 },
    );
  }

  try {
    const resp = await bridgeFetch(
      `/estimates/${encodeURIComponent(id)}/comments`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      },
      resolved.tenant_id,
    );
    const out = await resp.text();
    return new NextResponse(out, {
      status: resp.status,
      headers: {
        "Content-Type":
          resp.headers.get("content-type") || "application/json",
      },
    });
  } catch (err) {
    console.error("comments POST proxy failed:", err);
    return NextResponse.json({ error: "bridge unavailable" }, { status: 502 });
  }
}
