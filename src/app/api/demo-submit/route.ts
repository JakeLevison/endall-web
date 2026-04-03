import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

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

    // Fire-and-forget email notification
    try {
      await resend.emails.send({
        from: "Endall <notifications@endall.ai>",
        to: "jake@endall.ai",
        subject: `New Demo Request: ${name} — ${company}`,
        html: `
          <h2>New Demo Request</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Company:</strong> ${company}</p>
          <p><strong>Email:</strong> ${work_email}</p>
          <p><strong>Trade:</strong> ${trade}</p>
          <p><strong>Team Size:</strong> ${team_size}</p>
          <p><strong>Notes:</strong> ${notes || "None"}</p>
          <p><em>Submitted at ${new Date().toISOString()}</em></p>
        `,
      });
    } catch (emailErr) {
      console.error("Resend email error (demo-submit):", emailErr);
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
