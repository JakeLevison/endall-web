import { NextResponse, type NextRequest } from "next/server";
import { lookupApprovalByToken } from "@/lib/approval-token";

const BRIDGE_URL =
  process.env.ASK_ENDALL_BRIDGE_URL || "http://localhost:8101";
const NOT_FOUND = NextResponse.json({ error: "not found" }, { status: 404 });

const SIGNATURE_BLOB_MAX_BYTES = 200_000;
const SIGNED_NAME_MAX = 120;

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  const summary = await lookupApprovalByToken(token);
  if (!summary) return NOT_FOUND;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const sig = (body as { signature_blob?: unknown })?.signature_blob;
  const signedName = (body as { signed_name?: unknown })?.signed_name;

  if (sig !== undefined && typeof sig !== "string") {
    return NextResponse.json(
      { error: "signature_blob must be a string" },
      { status: 400 },
    );
  }
  if (typeof sig === "string" && sig.length > SIGNATURE_BLOB_MAX_BYTES) {
    return NextResponse.json(
      { error: "signature_blob too large" },
      { status: 413 },
    );
  }
  const cleanName =
    typeof signedName === "string" ? signedName.slice(0, SIGNED_NAME_MAX) : null;

  try {
    const url = new URL(BRIDGE_URL);
    url.pathname = `/estimates/${encodeURIComponent(summary.estimate_id)}/approve`;
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        signature_blob: typeof sig === "string" ? sig : undefined,
        signed_name: cleanName,
      }),
      cache: "no-store",
    });
    if (resp.status === 404) return NOT_FOUND;
    const text = await resp.text();
    return new NextResponse(text, {
      status: resp.status,
      headers: {
        "Content-Type":
          resp.headers.get("content-type") || "application/json",
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    console.error("public approve proxy failed:", err);
    return NextResponse.json({ error: "bridge unavailable" }, { status: 502 });
  }
}
