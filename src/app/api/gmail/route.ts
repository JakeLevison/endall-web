import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "This endpoint has been removed. Use the per-tenant Gmail integration under Settings > Integrations." },
    { status: 410 }
  );
}

export async function GET() {
  return NextResponse.json({ error: "Gone" }, { status: 410 });
}
