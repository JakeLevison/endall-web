import { NextResponse, type NextRequest } from "next/server";
import { bridgeFetch } from "@/lib/bridge-fetch";

// GET /api/estimates/{id}/pdf
// bridgeFetch resolves the tenant from the SSR session and forwards the
// verified bearer token + X-Tenant-Id. Binary (PDF) body is streamed through.
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const resp = await bridgeFetch(`/estimates/${encodeURIComponent(id)}/pdf`);

  if (!resp.ok) {
    const text = await resp.text();
    return new NextResponse(text, {
      status: resp.status,
      headers: {
        "Content-Type": resp.headers.get("content-type") || "application/json",
      },
    });
  }

  const body = await resp.arrayBuffer();
  const contentDisposition =
    resp.headers.get("content-disposition") ||
    `attachment; filename="${id}.pdf"`;
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": contentDisposition,
      "Cache-Control": "no-store",
    },
  });
}
