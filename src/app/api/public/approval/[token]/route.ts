import { NextResponse, type NextRequest } from "next/server";
import { resolveApprovalMetaViaBridge } from "@/lib/approval-bridge";

const BRIDGE_URL =
  process.env.ASK_ENDALL_BRIDGE_URL || "http://localhost:8101";

// Factory rather than a singleton: NextResponse bodies are streams and
// can only be consumed once, so two concurrent requests sharing one
// instance would race on the body reader.
const notFound = () =>
  NextResponse.json({ error: "not found" }, { status: 404 });

/**
 * Public token resolver. Calls the bridge's unauthenticated
 * `GET /public/approval/{token}` (R2-8c) to validate the token and
 * obtain estimate_id, then forwards to `/estimates/{id}/public?token=`
 * for the full estimate payload the approval view renders.
 *
 * On any miss returns a uniform 404 to deny enumeration oracles.
 */
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  const meta = await resolveApprovalMetaViaBridge(token);
  if (!meta) return notFound();

  try {
    const url = new URL(BRIDGE_URL);
    url.pathname = `/estimates/${encodeURIComponent(meta.estimate_id)}/public`;
    url.searchParams.set("token", token);
    const resp = await fetch(url, { cache: "no-store" });
    // Collapse every non-2xx to a uniform 404. This denies an enumeration
    // oracle: the bridge's 502 / 500 / detail-bearing 4xx would otherwise
    // distinguish "token resolves but estimate row missing" from "token
    // does not resolve at all". H1 in the R2-8b security review.
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
    console.error("public approval proxy failed:", err);
    // Public surface returns the same 404 shape on infra failure to keep
    // the oracle uniform (H3). Real cause is in the server log.
    return notFound();
  }
}
