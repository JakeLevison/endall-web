import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHmac } from "crypto";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, work_email, company, trade, team_size, notes, turnstile_token } = body;

    const tenant_id = process.env.TENANT_ID || null;
    if (!tenant_id) console.warn("TENANT_ID not set — bridge call will be skipped");

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
    let insertedRow: { id: string } | null = null;
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      const { data, error } = await supabase.from("demo_requests").insert({
        name,
        work_email,
        company,
        trade,
        team_size,
        notes: notes || null,
        lead_quality,
        turnstile_score,
        ...(tenant_id ? { tenant_id } : {}),
      }).select("id").single();
      if (error) {
        console.error("demo_requests insert error:", error);
      } else {
        insertedRow = data;
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

    // Notify chief-of-staff bridge
    if (!insertedRow) {
      console.warn("Skipping bridge call — no inserted row returned from Supabase");
    } else if (!tenant_id) {
      console.warn("Skipping bridge call — TENANT_ID not set");
    } else {
      try {
        const bridgeUrl = process.env.COS_API_URL || "http://localhost:8100";
        const rawBody = JSON.stringify({ demo_request_id: insertedRow.id, tenant_id });
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        const secret = process.env.INTERNAL_WEBHOOK_SECRET;
        if (secret) {
          headers["X-Webhook-Signature"] = createHmac("sha256", secret).update(rawBody).digest("hex");
        } else {
          console.warn("INTERNAL_WEBHOOK_SECRET not set — bridge request will be unsigned");
        }
        await fetch(`${bridgeUrl}/triggers/demo-signup`, { method: "POST", headers, body: rawBody });
      } catch (bridgeErr) {
        console.error("Bridge notify error (demo-signup):", bridgeErr);
      }
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
