import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { analyzeEmail } from "@/lib/email-intel";

const resend = new Resend(process.env.RESEND_API_KEY);

type ContactBody = {
  intent?: string;       // "book_demo" | "talk_sales" | "learn_more"
  name?: string;
  email?: string;
  company?: string;
  phone?: string;
  role?: string;
  crew_size?: string;
  challenge?: string;
  source?: string;
  // legacy fields (still accepted)
  message?: string;
};

function esc(s: string | undefined | null) {
  return (s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ContactBody;
    const {
      intent,
      name,
      email,
      company,
      phone,
      role,
      crew_size,
      challenge,
      source,
      message,
    } = body;

    // Name + email + company are the minimum qualifying fields on the new form.
    // Legacy callers that still send { name, email, message } continue to work.
    if (!name || !email || (!company && !message)) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const { email_domain, is_competitor } = analyzeEmail(email);
    const intentLabel = intent || "contact";

    // DB insert — best effort (table/cols may not be migrated yet)
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      const { error } = await supabase.from("contact_submissions").insert({
        intent: intentLabel,
        name,
        email,
        company: company || null,
        phone: phone || null,
        role: role || null,
        crew_size: crew_size || null,
        challenge: challenge || null,
        source: source || null,
        message: message || null,
        email_domain,
        is_competitor,
      });
      if (error) {
        console.error("contact_submissions insert error:", error);
      }
    } catch (dbErr) {
      console.error("contact_submissions DB error:", dbErr);
    }

    // Email notification — independent of DB
    try {
      const competitorBadge = is_competitor
        ? `<p style="color:#d97706;"><strong>⚠ Competitor domain detected:</strong> ${esc(email_domain)}</p>`
        : "";
      await resend.emails.send({
        from: "Endall <notifications@endall.ai>",
        to: ["jake@endall.ai"],
        subject: `[${intentLabel}] ${esc(name)} — ${esc(company || "(no company)")}`,
        html: `
          <h2>New Contact Submission</h2>
          ${competitorBadge}
          <p><strong>Intent:</strong> ${esc(intentLabel)}</p>
          <p><strong>Name:</strong> ${esc(name)}</p>
          <p><strong>Email:</strong> ${esc(email)}${email_domain ? ` <em>(${esc(email_domain)})</em>` : ""}</p>
          <p><strong>Company:</strong> ${esc(company)}</p>
          <p><strong>Phone:</strong> ${esc(phone) || "—"}</p>
          <p><strong>Role:</strong> ${esc(role) || "—"}</p>
          <p><strong>Crew size:</strong> ${esc(crew_size) || "—"}</p>
          <p><strong>Biggest challenge:</strong> ${esc(challenge) || "—"}</p>
          <p><strong>Source:</strong> ${esc(source) || "—"}</p>
          ${message ? `<p><strong>Message:</strong> ${esc(message)}</p>` : ""}
          <p><em>Submitted at ${new Date().toISOString()}</em></p>
        `,
      });
    } catch (emailErr) {
      console.error("Resend email error (contact-submit):", emailErr);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("contact-submit error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
