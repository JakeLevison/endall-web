import { NextResponse, type NextRequest } from "next/server";
import { lookupApprovalByToken } from "@/lib/approval-token";

const BRIDGE_URL =
  process.env.ASK_ENDALL_BRIDGE_URL || "http://localhost:8101";

const NOT_FOUND = NextResponse.json(
  { error: "not found" },
  { status: 404 },
);

/**
 * Public token-only resolver. Maps `/approve/{token}` to the bridge's
 * `/estimates/{id}/public?token=` because the bridge does not (yet)
 * expose a token-only endpoint. See /tmp/r2-8b-questions.md (1).
 *
 * On any miss returns a uniform 404 to deny enumeration oracles.
 */
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  const summary = await lookupApprovalByToken(token);
  if (!summary) return NOT_FOUND;

  try {
    const url = new URL(BRIDGE_URL);
    url.pathname = `/estimates/${encodeURIComponent(summary.estimate_id)}/public`;
    url.searchParams.set("token", token);
    const resp = await fetch(url, { cache: "no-store" });
    // Collapse every non-2xx to a uniform 404. This denies an enumeration
    // oracle: the bridge's 502 / 500 / detail-bearing 4xx would otherwise
    // distinguish "token resolves but estimate row missing" from "token
    // does not resolve at all". H1 in the R2-8b security review.
    if (!resp.ok) return NOT_FOUND;
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
    return NOT_FOUND;
  }
}
