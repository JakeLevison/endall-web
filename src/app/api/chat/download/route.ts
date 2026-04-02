import { NextRequest, NextResponse } from "next/server";

const MIME_MAP: Record<string, string> = {
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".pdf": "application/pdf",
};

export async function GET(request: NextRequest) {
  const fileId = request.nextUrl.searchParams.get("file_id");
  const filename = request.nextUrl.searchParams.get("filename") || `endall_output_${fileId?.slice(-8)}.xlsx`;

  if (!fileId) {
    return NextResponse.json({ error: "file_id required" }, { status: 400 });
  }

  // Try the Python bridge first (serves from local disk, faster)
  const bridgeUrl = process.env.ASK_ENDALL_BRIDGE_URL || "http://localhost:8101";
  try {
    const bridgeResp = await fetch(`${bridgeUrl}/download/${fileId}`);
    if (bridgeResp.ok) {
      const blob = await bridgeResp.blob();
      const ext = "." + filename.split(".").pop()?.toLowerCase();
      const mime = MIME_MAP[ext] || blob.type || "application/octet-stream";
      const headers = new Headers();
      headers.set("Content-Type", mime);
      headers.set("Content-Disposition", `attachment; filename="${filename}"`);
      return new NextResponse(blob, { headers });
    }
  } catch {
    // Bridge not available, fall through to Anthropic API
  }

  // Fallback: download directly from Anthropic Files API
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not configured" },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
      `https://api.anthropic.com/v1/files/${fileId}/content`,
      {
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-beta": "files-api-2025-04-14",
        },
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("File download error:", errText);
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const blob = await response.blob();
    const ext = "." + filename.split(".").pop()?.toLowerCase();
    const mime = MIME_MAP[ext] || blob.type || "application/octet-stream";
    const headers = new Headers();
    headers.set("Content-Type", mime);
    headers.set("Content-Disposition", `attachment; filename="${filename}"`);

    return new NextResponse(blob, { headers });
  } catch (err) {
    console.error("File download error:", err);
    return NextResponse.json(
      { error: "Failed to download file" },
      { status: 500 }
    );
  }
}
