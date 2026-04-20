import { NextRequest, NextResponse } from "next/server";
import { handleChat } from "../../chat/handler";

export const maxDuration = 120;

const MARKETING_TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID || "";

export async function POST(request: NextRequest) {
  if (!MARKETING_TENANT_ID) {
    return NextResponse.json(
      { error: "demo tenant not configured" },
      { status: 500 },
    );
  }
  return handleChat(request, MARKETING_TENANT_ID);
}
