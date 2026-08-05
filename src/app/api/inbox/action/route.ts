import { NextResponse } from "next/server";
import * as google from "@/lib/google";
import * as microsoft from "@/lib/microsoft";
import { crossOriginBlocked } from "@/lib/security";

export const dynamic = "force-dynamic";

type Action = "read" | "unread" | "archive" | "trash";

// Applies a message action on its own provider. "trash" moves to Trash /
// Deleted Items (reversible) — never a permanent delete.
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }
  const body = await request.json().catch(() => ({}));
  const id = body?.id ? String(body.id) : "";
  const action = body?.action as Action;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  if (!["read", "unread", "archive", "trash"].includes(action)) {
    return NextResponse.json({ error: "invalid action" }, { status: 400 });
  }
  const provider = body?.provider === "microsoft" ? "microsoft" : "google";
  const lib = provider === "microsoft" ? microsoft : google;

  try {
    const token = await lib.getValidAccessToken();
    if (!token) return NextResponse.json({ error: "not connected" }, { status: 401 });
    if (action === "read") await lib.markRead(token, id);
    else if (action === "unread") await lib.setUnread(token, id);
    else if (action === "archive") await lib.archiveMessage(token, id);
    else if (action === "trash") await lib.trashMessage(token, id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("POST /api/inbox/action:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
