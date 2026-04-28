import { NextResponse, type NextRequest } from "next/server";
import { resolveApprovalMetaViaBridge } from "@/lib/approval-bridge";

const BRIDGE_URL =
  process.env.ASK_ENDALL_BRIDGE_URL || "http://localhost:8101";
// Factory rather than a singleton: NextResponse bodies are streams and
// can only be consumed once, so two concurrent requests sharing one
// instance would race on the body reader.
const notFound = () =>
  NextResponse.json({ error: "not found" }, { status: 404 });

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  const meta = await resolveApprovalMetaViaBridge(token);
  if (!meta) return notFound();

  try {
    const url = new URL(BRIDGE_URL);
    url.pathname = `/estimates/${encodeURIComponent(meta.estimate_id)}/comments`;
    url.searchParams.set("token", token);
    const resp = await fetch(url, { cache: "no-store" });
    if (!resp.ok) return notFound();
    const text = await resp.text();
    return new NextResponse(text, {
      status: 200,
      headers: {
        "Content-Type":
          resp.headers.get("content-type") || "application/json",
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    console.error("public comments GET proxy failed:", err);
    return notFound();
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  const meta = await resolveApprovalMetaViaBridge(token);
  if (!meta) return notFound();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const text =
    body && typeof body === "object" && typeof (body as { body?: unknown }).body === "string"
      ? (body as { body: string }).body.trim()
      : "";
  if (!text) {
    return NextResponse.json(
      { error: "comment body cannot be empty" },
      { status: 400 },
    );
  }

  try {
    const url = new URL(BRIDGE_URL);
    url.pathname = `/estimates/${encodeURIComponent(meta.estimate_id)}/comments`;
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: text, token }),
      cache: "no-store",
    });
    if (!resp.ok) return notFound();
    const out = await resp.text();
    return new NextResponse(out, {
      status: 201,
      headers: {
        "Content-Type":
          resp.headers.get("content-type") || "application/json",
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    console.error("public comments POST proxy failed:", err);
    return notFound();
  }
}
