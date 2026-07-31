import { NextResponse } from "next/server";
import { getValidAccessToken, markRead } from "@/lib/google";
import { crossOriginBlocked } from "@/lib/security";

export const dynamic = "force-dynamic";

// Removes the UNREAD label from a Gmail message (requires gmail.modify).
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }
  const token = await getValidAccessToken();
  if (!token) return NextResponse.json({ error: "not connected" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  if (!body?.id) return NextResponse.json({ error: "id required" }, { status: 400 });

  try {
    await markRead(token, String(body.id));
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("POST /api/inbox/mark-read:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
