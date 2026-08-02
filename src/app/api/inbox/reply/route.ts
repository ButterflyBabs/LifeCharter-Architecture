import { NextResponse } from "next/server";
import * as google from "@/lib/google";
import * as microsoft from "@/lib/microsoft";
import { crossOriginBlocked } from "@/lib/security";

export const dynamic = "force-dynamic";

// Sends a real in-thread reply, routed to the email's own provider.
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }
  const body = await request.json().catch(() => ({}));
  if (!body?.body) return NextResponse.json({ error: "body is required" }, { status: 400 });

  const provider = body?.provider === "microsoft" ? "microsoft" : "google";

  try {
    if (provider === "microsoft") {
      const token = await microsoft.getValidAccessToken();
      if (!token) return NextResponse.json({ error: "not connected" }, { status: 401 });
      if (!body?.id) return NextResponse.json({ error: "id is required" }, { status: 400 });
      await microsoft.replyToMessage(token, String(body.id), String(body.body));
    } else {
      const token = await google.getValidAccessToken();
      if (!token) return NextResponse.json({ error: "not connected" }, { status: 401 });
      if (!body?.to) return NextResponse.json({ error: "to is required" }, { status: 400 });
      await google.sendReply(token, {
        threadId: String(body.threadId ?? ""),
        to: String(body.to),
        subject: String(body.subject ?? ""),
        inReplyTo: String(body.inReplyTo ?? ""),
        body: String(body.body),
      });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("POST /api/inbox/reply:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
