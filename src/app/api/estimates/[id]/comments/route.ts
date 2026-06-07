import { NextResponse, type NextRequest } from "next/server";
import { bridgeFetch } from "@/lib/bridge-fetch";

// /api/estimates/{id}/comments — bridgeFetch resolves the tenant from the SSR
// session and forwards the verified bearer token + X-Tenant-Id.
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const resp = await bridgeFetch(
    `/estimates/${encodeURIComponent(id)}/comments`,
  );
  const text = await resp.text();
  return new NextResponse(text, {
    status: resp.status,
    headers: {
      "Content-Type": resp.headers.get("content-type") || "application/json",
    },
  });
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

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
    return NextResponse.json({ error: "body field required" }, { status: 400 });
  }
  const text = ((body as { body: string }).body || "").trim();
  if (!text) {
    return NextResponse.json(
      { error: "comment body cannot be empty" },
      { status: 400 },
    );
  }

  const resp = await bridgeFetch(
    `/estimates/${encodeURIComponent(id)}/comments`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: text }),
    },
  );
  const out = await resp.text();
  return new NextResponse(out, {
    status: resp.status,
    headers: {
      "Content-Type": resp.headers.get("content-type") || "application/json",
    },
  });
}
