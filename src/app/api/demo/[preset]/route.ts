import { NextRequest, NextResponse } from "next/server";

// Proxy for POST /demo/{preset} on the Ask Endall bridge. Public marketing
// endpoint (no tenant scope). Handles all 8 demo presets uniformly.
//
// Valid preset paths match the bridge's /demo/* endpoints. Anything else
// 400s before the network hop so a typo on the client side fails loudly
// instead of producing a 404 blob.

const VALID_PRESETS = new Set([
  "npv",
  "budget",
  "financial-model",
  "estimate",
  "proposal",
  "competitive-analysis",
  "financial-review",
  "capabilities",
]);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ preset: string }> }
) {
  const { preset } = await params;
  if (!VALID_PRESETS.has(preset)) {
    return NextResponse.json(
      { error: `unknown preset: ${preset}` },
      { status: 400 }
    );
  }

  const bridgeUrl = process.env.ASK_ENDALL_BRIDGE_URL || "http://localhost:8101";

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  try {
    const resp = await fetch(`${bridgeUrl}/demo/${preset}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return new NextResponse(errText, {
        status: resp.status,
        headers: {
          "Content-Type":
            resp.headers.get("content-type") || "application/json",
        },
      });
    }

    const bytes = await resp.arrayBuffer();
    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type":
          resp.headers.get("content-type") || "application/octet-stream",
        "Content-Disposition":
          resp.headers.get("content-disposition") ||
          `attachment; filename="${preset}.bin"`,
      },
    });
  } catch (err) {
    console.error(`demo/${preset} proxy failed:`, err);
    return NextResponse.json(
      { error: "demo bridge unavailable" },
      { status: 502 }
    );
  }
}
