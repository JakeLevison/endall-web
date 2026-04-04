import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID || "109d88ca-983a-4bfd-9e79-c64061fd0727";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function GET() {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("generated_files")
      .select("id, file_name, file_type, description, file_path, workflow, created_at")
      .eq("tenant_id", TENANT_ID)
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
