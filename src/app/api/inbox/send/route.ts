import { NextResponse } from "next/server";
import * as google from "@/lib/google";
import * as microsoft from "@/lib/microsoft";
import { crossOriginBlocked } from "@/lib/security";

export const dynamic = "force-dynamic";

// Sends a brand-new email from the chosen account (google | microsoft).
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }
  const body = await request.json().catch(() => ({}));
  if (!body?.to || !body?.subject || !body?.body) {
    return NextResponse.json({ error: "to, subject and body are required" }, { status: 400 });
  }

  const provider = body?.provider === "microsoft" ? "microsoft" : "google";
  const opts = { to: String(body.to), subject: String(body.subject), body: String(body.body) };

  try {
    if (provider === "microsoft") {
      const token = await microsoft.getValidAccessToken();
      if (!token) return NextResponse.json({ error: "not connected" }, { status: 401 });
      await microsoft.sendEmail(token, opts);
    } else {
      const token = await google.getValidAccessToken();
      if (!token) return NextResponse.json({ error: "not connected" }, { status: 401 });
      await google.sendEmail(token, opts);
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("POST /api/inbox/send:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
