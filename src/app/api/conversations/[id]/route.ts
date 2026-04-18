import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for api/conversations/[id]");
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey
  );
}

function getDeviceId(req: NextRequest): string | null {
  const id = req.headers.get("x-device-id");
  return id && id.length > 0 ? id : null;
}

/** Get a conversation with all its messages (device-scoped). */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deviceId = getDeviceId(request);
    if (!deviceId) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const supabase = getSupabase();

    const [convResult, msgsResult] = await Promise.all([
      supabase
        .from("conversations")
        .select("*")
        .eq("id", id)
        .eq("device_id", deviceId)
        .single(),
      supabase
        .from("conversation_messages")
        .select("*")
        .eq("conversation_id", id)
        .order("created_at", { ascending: true }),
    ]);

    if (convResult.error) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      conversation: convResult.data,
      messages: msgsResult.data || [],
    });
  } catch (err) {
    console.error("conversation GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** Update conversation (title, workflow). */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const deviceId = getDeviceId(request);
    if (!deviceId) return NextResponse.json({ error: "device id required" }, { status: 400 });
    const supabase = getSupabase();

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.title !== undefined) updates.title = body.title;
    if (body.workflow !== undefined) updates.workflow = body.workflow;

    const { error } = await supabase
      .from("conversations")
      .update(updates)
      .eq("id", id)
      .eq("device_id", deviceId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("conversation PATCH error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** Delete a conversation (cascades to messages). */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deviceId = getDeviceId(request);
    if (!deviceId) return NextResponse.json({ error: "device id required" }, { status: 400 });
    const supabase = getSupabase();

    const { error } = await supabase
      .from("conversations")
      .delete()
      .eq("id", id)
      .eq("device_id", deviceId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("conversation DELETE error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
