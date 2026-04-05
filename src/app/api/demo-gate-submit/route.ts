import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { analyzeEmail } from "@/lib/email-intel";

const resend = new Resend(process.env.RESEND_API_KEY);

type GateBody = {
  name?: string;
  email?: string;
  company?: string;
  crew_size?: string;
};

function esc(s: string | undefined | null) {
  return (s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as GateBody;
    const { name, email, company, crew_size } = body;

    if (!name || !email || !company || !crew_size) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const { email_domain, is_competitor } = analyzeEmail(email);

    // DB insert — best effort
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      const { error } = await supabase.from("demo_gate_submissions").insert({
        name,
        email,
        company,
        crew_size,
        email_domain,
        is_competitor,
      });
      if (error) {
        console.error("demo_gate_submissions insert error:", error);
      }
    } catch (dbErr) {
      console.error("demo_gate_submissions DB error:", dbErr);
    }

    // Notification email
    try {
      const competitorBadge = is_competitor
        ? `<p style="color:#d97706;"><strong>⚠ Competitor domain detected:</strong> ${esc(email_domain)}</p>`
        : "";
      await resend.emails.send({
        from: "Endall <notifications@endall.ai>",
        to: ["jake@endall.ai"],
        subject: `[demo_gate] ${esc(name)} — ${esc(company)}`,
        html: `
          <h2>Demo gate completed</h2>
          ${competitorBadge}
          <p><strong>Name:</strong> ${esc(name)}</p>
          <p><strong>Email:</strong> ${esc(email)}${email_domain ? ` <em>(${esc(email_domain)})</em>` : ""}</p>
          <p><strong>Company:</strong> ${esc(company)}</p>
          <p><strong>Crew size:</strong> ${esc(crew_size)}</p>
          <p><em>Submitted at ${new Date().toISOString()}</em></p>
        `,
      });
    } catch (emailErr) {
      console.error("Resend email error (demo-gate-submit):", emailErr);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("demo-gate-submit error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
