import { NextRequest, NextResponse } from "next/server";

const COS_API = process.env.COS_API_URL || "http://localhost:8100";
const COS_SECRET = process.env.COS_API_SECRET || "";

async function cosRequest(path: string, method: string = "GET", body?: Record<string, unknown>) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (COS_SECRET) headers["Authorization"] = `Bearer ${COS_SECRET}`;

  const resp = await fetch(`${COS_API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(30000),
  });

  if (!resp.ok) {
    throw new Error(`COS API returned ${resp.status}`);
  }

  return resp.json();
}

// GET /api/calendar — get upcoming events
export async function GET(request: NextRequest) {
  try {
    const days = request.nextUrl.searchParams.get("days") || "7";
    const result = await cosRequest(`/calendar/events?days=${days}`, "GET");
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "COS backend unavailable" }, { status: 502 });
  }
}

// POST /api/calendar — create an event
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await cosRequest("/calendar/create", "POST", body);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "COS backend unavailable" }, { status: 502 });
  }
}
