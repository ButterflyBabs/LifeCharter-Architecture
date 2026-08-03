import { NextResponse } from "next/server";
import * as google from "@/lib/google";
import * as microsoft from "@/lib/microsoft";
import { crossOriginBlocked } from "@/lib/security";

export const dynamic = "force-dynamic";

// Add/remove labels (Gmail) or categories (Outlook) on a message.
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }
  const body = await request.json().catch(() => ({}));
  const id = body?.id ? String(body.id) : "";
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const add = Array.isArray(body?.add) ? body.add.map(String) : [];
  const remove = Array.isArray(body?.remove) ? body.remove.map(String) : [];
  if (add.length === 0 && remove.length === 0) {
    return NextResponse.json({ error: "nothing to change" }, { status: 400 });
  }
  const provider = body?.provider === "microsoft" ? "microsoft" : "google";
  const lib = provider === "microsoft" ? microsoft : google;

  try {
    const token = await lib.getValidAccessToken();
    if (!token) return NextResponse.json({ error: "not connected" }, { status: 401 });
    await lib.modifyLabels(token, id, add, remove);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("POST /api/inbox/label:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
