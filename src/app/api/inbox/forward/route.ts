import { NextResponse } from "next/server";
import * as google from "@/lib/google";
import * as microsoft from "@/lib/microsoft";
import { crossOriginBlocked } from "@/lib/security";
import { normalizeAttachments } from "@/lib/mailAttachments";

export const dynamic = "force-dynamic";

// Forwards a message to a new recipient, from its own provider (google | microsoft).
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }
  const body = await request.json().catch(() => ({}));
  const id = body?.id ? String(body.id) : "";
  const to = body?.to ? String(body.to) : "";
  const comment = body?.comment ? String(body.comment) : "";
  if (!id || !to) return NextResponse.json({ error: "id and to are required" }, { status: 400 });

  const provider = body?.provider === "microsoft" ? "microsoft" : "google";
  const lib = provider === "microsoft" ? microsoft : google;
  const attachments = normalizeAttachments(body?.attachments);

  try {
    const token = await lib.getValidAccessToken();
    if (!token) return NextResponse.json({ error: "not connected" }, { status: 401 });
    await lib.forwardMessage(token, id, to, comment, attachments);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("POST /api/inbox/forward:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
