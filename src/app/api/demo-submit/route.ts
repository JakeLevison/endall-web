import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, work_email, company, trade, team_size, notes } = body;

    if (!name || !work_email || !company || !trade || !team_size) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabase.from("demo_requests").insert({
      name,
      work_email,
      company,
      trade,
      team_size,
      notes: notes || null,
    });

    if (error) {
      console.error("demo_requests insert error:", error);
      return NextResponse.json(
        { error: "Failed to save request" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("demo-submit error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
