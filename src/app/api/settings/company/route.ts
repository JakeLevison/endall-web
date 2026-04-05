import { NextRequest, NextResponse } from "next/server";

// Proxy for the ask-endall-bridge /settings/company endpoint.
// Keeping the bridge URL server-side avoids CORS + keeps Railway URL
// out of client-side code.

function bridgeUrl(): string {
  return (
    process.env.ASK_ENDALL_BRIDGE_URL?.replace(/\/$/, "") ||
    "http://localhost:8101"
  );
}

export async function GET(request: NextRequest) {
  const companyId =
    request.nextUrl.searchParams.get("company_id") || "default";
  try {
    const resp = await fetch(
      `${bridgeUrl()}/settings/company?company_id=${encodeURIComponent(companyId)}`,
      { cache: "no-store" }
    );
    const body = await resp.json();
    return NextResponse.json(body, { status: resp.status });
  } catch (err) {
    return NextResponse.json(
      { error: "bridge unreachable", detail: String(err) },
      { status: 502 }
    );
  }
}

export async function PUT(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  try {
    const resp = await fetch(`${bridgeUrl()}/settings/company`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const respBody = await resp.json();
    return NextResponse.json(respBody, { status: resp.status });
  } catch (err) {
    return NextResponse.json(
      { error: "bridge unreachable", detail: String(err) },
      { status: 502 }
    );
  }
}
