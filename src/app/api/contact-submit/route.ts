import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // DB insert — best effort (table may not exist yet)
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      const { error } = await supabase.from("contact_submissions").insert({
        name,
        email,
        message,
      });
      if (error) {
        console.error("contact_submissions insert error:", error);
      }
    } catch (dbErr) {
      console.error("contact_submissions DB error:", dbErr);
    }

    // Email notification — independent of DB
    try {
      await resend.emails.send({
        from: "Endall <notifications@endall.ai>",
        to: ["jake@endall.ai", "levison1995@gmail.com"],
        subject: `New Contact: ${name}`,
        html: `
          <h2>New Contact Submission</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Message:</strong> ${message}</p>
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
