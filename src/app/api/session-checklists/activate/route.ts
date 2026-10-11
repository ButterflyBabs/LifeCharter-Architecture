import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { isAlignmentArchitect } from "@/lib/authz";
import { crossOriginBlocked } from "@/lib/security";
import { activateEvent } from "@/lib/sessionChecklists";

export const dynamic = "force-dynamic";

// "Add to my task list now": starts a scheduled session early (Alignment Architect only).
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  if (!(await isAlignmentArchitect())) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const body = await request.json().catch(() => ({}));
  const id = typeof body.eventId === "string" ? body.eventId : "";
  if (!id) return NextResponse.json({ error: "Choose a session." }, { status: 400 });
  const r = await activateEvent(createServerClient(), id);
  return r.ok ? NextResponse.json({ ok: true, added: r.added }) : NextResponse.json({ error: r.error || "Couldn't add it." }, { status: 500 });
}
