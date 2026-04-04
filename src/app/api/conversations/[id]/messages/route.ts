import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/** Get all messages for a conversation (device-scoped). */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deviceId = request.headers.get("x-device-id");
    if (!deviceId) return NextResponse.json({ messages: [] });
    const supabase = getSupabase();

    // Verify the conversation belongs to this device before returning messages
    const { data: conv } = await supabase
      .from("conversations")
      .select("id")
      .eq("id", id)
      .eq("device_id", deviceId)
      .maybeSingle();
    if (!conv) return NextResponse.json({ messages: [] });

    const { data, error } = await supabase
      .from("conversation_messages")
      .select("*")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ messages: [] });
    }
    return NextResponse.json({ messages: data || [] });
  } catch (err) {
    console.error("messages GET error:", err);
    return NextResponse.json({ messages: [] });
  }
}

/** Sync messages from client. Body: { messages: Array<{id, role, content, files?, preview_html?, created_at}> } */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const deviceId = request.headers.get("x-device-id");
    if (!deviceId) return NextResponse.json({ error: "device id required" }, { status: 400 });
    const supabase = getSupabase();

    // Verify conversation belongs to this device
    const { data: conv } = await supabase
      .from("conversations")
      .select("id")
      .eq("id", id)
      .eq("device_id", deviceId)
      .maybeSingle();
    if (!conv) return NextResponse.json({ error: "not found" }, { status: 404 });

    const rows = (body.messages || []).map((m: Record<string, unknown>) => ({
      id: m.id,
      conversation_id: id,
      role: m.role,
      content: m.content || "",
      files: m.files || [],
      preview_html: m.preview_html || "",
      created_at: m.created_at || new Date().toISOString(),
    }));

    if (rows.length === 0) {
      return NextResponse.json({ ok: true, count: 0 });
    }

    const { error } = await supabase
      .from("conversation_messages")
      .upsert(rows, { onConflict: "id" });

    if (error) {
      console.error("messages sync error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Touch conversation updated_at
    await supabase
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", id);

    return NextResponse.json({ ok: true, count: rows.length });
  } catch (err) {
    console.error("messages POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
