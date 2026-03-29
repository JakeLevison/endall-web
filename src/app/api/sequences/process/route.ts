import { NextResponse } from "next/server";

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

  if (!resp.ok) {
    throw new Error(`COS API returned ${resp.status}`);
  }

  return resp.json();
}

// POST /api/sequences/process — trigger the sequence scheduler
export async function POST() {
  try {
    const result = await cosRequest("/sequences/process");
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: "COS backend unavailable" },
      { status: 502 }
    );
  }
}
