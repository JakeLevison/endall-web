import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, work_email, company, trade, team_size, notes, turnstile_token } = body;

    if (!name || !work_email || !company || !trade || !team_size) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify Turnstile token
    let lead_quality = "unknown";
    let turnstile_score: number | null = null;

    if (turnstile_token) {
      try {
        const verifyRes = await fetch(
          "https://challenges.cloudflare.com/turnstile/v0/siteverify",
          {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              secret: process.env.TURNSTILE_SECRET_KEY ?? "1x0000000000000000000000000000000AA",
              response: turnstile_token,
              remoteip: request.headers.get("x-forwarded-for") ?? "",
            }),
          }
        );
        const verifyData = await verifyRes.json();
        if (verifyData.success) {
          lead_quality = "warm";
          turnstile_score = verifyData.score ?? null;
        } else {
          lead_quality = "bot_suspected";
        }
      } catch (verifyErr) {
        console.error("Turnstile verification error:", verifyErr);
        lead_quality = "bot_suspected";
      }
    } else {
      lead_quality = "bot_suspected";
    }

    // DB insert — best effort (table may not exist yet)
    try {
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
        lead_quality,
        turnstile_score,
      });
      if (error) {
        console.error("demo_requests insert error:", error);
      }
    } catch (dbErr) {
      console.error("demo_requests DB error:", dbErr);
    }

    // If bot suspected, skip downstream SDR actions
    if (lead_quality === "bot_suspected") {
      return NextResponse.json({ success: true });
    }

    // Email notification — independent of DB
    try {
      await resend.emails.send({
        from: "Endall <notifications@endall.ai>",
        to: ["jake@endall.ai", "levison1995@gmail.com"],
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
