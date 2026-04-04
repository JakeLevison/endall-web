import { NextResponse } from "next/server";

const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID || "109d88ca-983a-4bfd-9e79-c64061fd0727";

export async function GET() {
  const bridgeUrl = process.env.ASK_ENDALL_BRIDGE_URL || "http://localhost:8101";
  try {
    const resp = await fetch(`${bridgeUrl}/files?tenant_id=${TENANT_ID}`);
    if (!resp.ok) {
      return NextResponse.json({ files: [] });
    }
    const data = await resp.json();
    return NextResponse.json({ files: data.files || [] });
  } catch {
    return NextResponse.json({ files: [] });
  }
}
