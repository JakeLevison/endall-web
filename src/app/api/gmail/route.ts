import { NextRequest, NextResponse } from "next/server";

const COS_API = process.env.COS_API_URL || "http://localhost:8100";
const COS_SECRET = process.env.COS_API_SECRET || "";

async function cosRequest(path: string, method: string = "POST", body?: Record<string, unknown>) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (COS_SECRET) headers["Authorization"] = `Bearer ${COS_SECRET}`;

  const resp = await fetch(`${COS_API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(30000),
  });

  return resp.json();
}

// POST /api/gmail — sync or send email
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action;

    if (action === "sync") {
      const result = await cosRequest("/gmail/sync", "POST", {
        max_results: body.max_results || 20,
      });
      return NextResponse.json(result);
    }

    if (action === "send") {
      const result = await cosRequest("/gmail/send", "POST", {
        to: body.to,
        subject: body.subject,
        body: body.body,
      });
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "COS backend unavailable" }, { status: 502 });
  }
}
