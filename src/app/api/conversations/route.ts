import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID || "109d88ca-983a-4bfd-9e79-c64061fd0727";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

function getDeviceId(req: NextRequest): string | null {
  const id = req.headers.get("x-device-id");
  return id && id.length > 0 ? id : null;
}

/** List conversations for this device (newest first, limit 50). */
export async function GET(request: NextRequest) {
  try {
    const deviceId = getDeviceId(request);
    if (!deviceId) {
      // No device id = no history. Safer than leaking the shared firehose.
      return NextResponse.json({ conversations: [] });
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("conversations")
      .select("id, title, workflow, created_at, updated_at")
      .eq("tenant_id", TENANT_ID)
      .eq("device_id", deviceId)
      .order("updated_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("conversations list error:", error);
      return NextResponse.json({ conversations: [] });
    }
    return NextResponse.json({ conversations: data || [] });
  } catch (err) {
    console.error("conversations GET error:", err);
    return NextResponse.json({ conversations: [] });
  }
}

/** Create a new conversation. Body: { id?, title?, workflow? } */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const deviceId = getDeviceId(request);
    if (!deviceId) {
      return NextResponse.json({ error: "device id required" }, { status: 400 });
    }
    const supabase = getSupabase();

    const row: Record<string, unknown> = {
      tenant_id: TENANT_ID,
      device_id: deviceId,
    };
    if (body.id) row.id = body.id;
    if (body.title) row.title = body.title;
    if (body.workflow) row.workflow = body.workflow;

    // Upsert so repeat calls (from both sendMessage and syncToSupabase)
    // are idempotent — no unique-key violation on the conversation id.
    const { data, error } = await supabase
      .from("conversations")
      .upsert(row, { onConflict: "id" })
      .select("id, title, workflow, created_at, updated_at")
      .single();

    if (error) {
      console.error("conversations create error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ conversation: data });
  } catch (err) {
    console.error("conversations POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
