import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  resolveTenantFromSession,
  tenantUnresolvedResponse,
} from "@/lib/tenant-server";

function getSupabase() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for api/chat/files");
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey
  );
}

export async function GET(request: NextRequest) {
  try {
    const resolved = await resolveTenantFromSession();
    if (!resolved.ok) return tenantUnresolvedResponse(resolved.code);

    const deviceId = request.headers.get("x-device-id");
    if (!deviceId) return NextResponse.json({ files: [] });

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("generated_files")
      .select("id, file_name, file_type, description, file_path, workflow, created_at")
      .eq("tenant_id", resolved.tenant_id)
      .eq("device_id", deviceId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("My Files query error:", error);
      return NextResponse.json({ files: [] });
    }

    return NextResponse.json({ files: data || [] });
  } catch (err) {
    console.error("My Files error:", err);
    return NextResponse.json({ files: [] });
  }
}
