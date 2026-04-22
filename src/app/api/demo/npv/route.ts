import { NextRequest, NextResponse } from "next/server";

// Proxy for POST /demo/npv on the Ask Endall bridge. Public marketing
// endpoint (no tenant scope). Request body:
//   { company_name: string, contract_value: number }
// Response: xlsx bytes with Content-Disposition: attachment.
export async function POST(request: NextRequest) {
  const bridgeUrl = process.env.ASK_ENDALL_BRIDGE_URL || "http://localhost:8101";

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  try {
    const resp = await fetch(`${bridgeUrl}/demo/npv`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return new NextResponse(errText, {
        status: resp.status,
        headers: {
          "Content-Type": resp.headers.get("content-type") || "application/json",
        },
      });
    }

    const bytes = await resp.arrayBuffer();
    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type":
          resp.headers.get("content-type") ||
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition":
          resp.headers.get("content-disposition") ||
          'attachment; filename="NPV_Analysis.xlsx"',
      },
    });
  } catch (err) {
    console.error("demo npv proxy failed:", err);
    return NextResponse.json(
      { error: "NPV bridge unavailable" },
      { status: 502 }
    );
  }
}
