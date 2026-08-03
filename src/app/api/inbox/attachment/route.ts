import { NextResponse } from "next/server";
import * as google from "@/lib/google";
import * as microsoft from "@/lib/microsoft";

export const dynamic = "force-dynamic";

// Streams one attachment back to the browser as a download.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const messageId = url.searchParams.get("messageId");
  const attachmentId = url.searchParams.get("attachmentId");
  const name = url.searchParams.get("name") || "attachment";
  const mime = url.searchParams.get("mime") || "application/octet-stream";
  const provider = url.searchParams.get("provider") === "microsoft" ? "microsoft" : "google";
  if (!messageId || !attachmentId) {
    return NextResponse.json({ error: "messageId and attachmentId required" }, { status: 400 });
  }

  const lib = provider === "microsoft" ? microsoft : google;
  try {
    const token = await lib.getValidAccessToken();
    if (!token) return NextResponse.json({ error: "not connected" }, { status: 401 });
    const bytes = await lib.getAttachmentBytes(token, messageId, attachmentId);
    // Sanitize the filename for the header.
    const safeName = name.replace(/["\r\n]/g, "_");
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": mime,
        "Content-Disposition": `attachment; filename="${safeName}"`,
        "Content-Length": String(bytes.length),
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e) {
    console.error("GET /api/inbox/attachment:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
