import { NextResponse } from "next/server";
import { getValidAccessToken, sendEmail } from "@/lib/google";
import { crossOriginBlocked } from "@/lib/security";

export const dynamic = "force-dynamic";

// Sends a brand-new email from the connected Google account (requires gmail.send).
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }
  const token = await getValidAccessToken();
  if (!token) return NextResponse.json({ error: "not connected" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  if (!body?.to || !body?.subject || !body?.body) {
    return NextResponse.json({ error: "to, subject and body are required" }, { status: 400 });
  }

  try {
    await sendEmail(token, {
      to: String(body.to),
      subject: String(body.subject),
      body: String(body.body),
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("POST /api/inbox/send:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
