import { NextResponse, type NextRequest } from "next/server";
import {
  resolveTenantFromSession,
  tenantUnresolvedResponse,
} from "@/lib/tenant-server";

const BRIDGE_URL =
  process.env.ASK_ENDALL_BRIDGE_URL || "http://localhost:8101";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const resolved = await resolveTenantFromSession();
  if (!resolved.ok) return tenantUnresolvedResponse(resolved.code);

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const body = payload as {
    approval_id?: unknown;
    to?: unknown;
    subject?: unknown;
    body?: unknown;
  } | null;
  if (
    !body ||
    typeof body.approval_id !== "string" ||
    typeof body.to !== "string" ||
    typeof body.subject !== "string" ||
    typeof body.body !== "string"
  ) {
    return NextResponse.json(
      { error: "approval_id, to, subject, body are all required strings" },
      { status: 400 },
    );
  }

  try {
    const url = new URL(BRIDGE_URL);
    url.pathname = `/estimates/${encodeURIComponent(id)}/send/confirm`;
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-Id": resolved.tenant_id,
      },
      body: JSON.stringify({
        approval_id: body.approval_id,
        to: body.to,
        subject: body.subject,
        body: body.body,
      }),
      cache: "no-store",
    });
    const text = await resp.text();
    return new NextResponse(text, {
      status: resp.status,
      headers: {
        "Content-Type":
          resp.headers.get("content-type") || "application/json",
      },
    });
  } catch (err) {
    console.error("estimate send/confirm proxy failed:", err);
    return NextResponse.json({ error: "bridge unavailable" }, { status: 502 });
  }
}
