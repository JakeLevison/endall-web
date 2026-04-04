import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const RECIPIENTS = [
  "jake@endall.ai",
  "kunaalanand@gmail.com",
  "kunaal@endall.ai",
];

export async function POST(request: NextRequest) {
  const secret = request.headers.get("X-Summary-Secret");
  if (!secret || secret !== process.env.DAILY_SUMMARY_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { subject, html } = await request.json();

    if (!subject || !html) {
      return NextResponse.json(
        { error: "Missing subject or html" },
        { status: 400 }
      );
    }

    const { data, error } = await resend.emails.send({
      from: "Endall Dev <dev@endall.ai>",
      to: RECIPIENTS,
      subject,
      html,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ id: data?.id, status: "sent" });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
