import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const fileId = request.nextUrl.searchParams.get("file_id");

  if (!fileId) {
    return NextResponse.json({ error: "file_id required" }, { status: 400 });
  }

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
    const headers = new Headers();
    headers.set("Content-Type", blob.type || "application/octet-stream");
    headers.set("Content-Disposition", `attachment; filename="endall_output_${fileId.slice(-8)}.xlsx"`);

    return new NextResponse(blob, { headers });
  } catch (err) {
    console.error("File download error:", err);
    return NextResponse.json(
      { error: "Failed to download file" },
      { status: 500 }
    );
  }
}
