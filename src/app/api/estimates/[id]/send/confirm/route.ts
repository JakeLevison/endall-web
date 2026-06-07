import { NextResponse, type NextRequest } from "next/server";
import { bridgeFetch } from "@/lib/bridge-fetch";

// POST /api/estimates/{id}/send/confirm
// bridgeFetch resolves the tenant from the SSR session and forwards the
// verified bearer token + X-Tenant-Id.
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

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

  const resp = await bridgeFetch(
    `/estimates/${encodeURIComponent(id)}/send/confirm`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        approval_id: body.approval_id,
        to: body.to,
        subject: body.subject,
        body: body.body,
      }),
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
