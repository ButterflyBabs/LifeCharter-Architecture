import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { isAlignmentArchitect } from "@/lib/authz";
import { crossOriginBlocked } from "@/lib/security";
import { ownerMasterPlanId } from "@/lib/housePlan";
import { releaseReplay, replaySessions } from "@/lib/masterclass/followUp";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Owner-only (Babs). GET: recent MasterClass sessions and who is waiting for the replay.
// POST { sessionDate, url }: release that session's replay, which starts the replay and follow-up emails.
export async function GET() {
  if (!(await isAlignmentArchitect())) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ sessions: await replaySessions() });
}

export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  if (!(await isAlignmentArchitect())) return NextResponse.json({ error: "not found" }, { status: 404 });
  const b = await request.json().catch(() => ({}));
  const db = createServerClient();
  const housePlan = await ownerMasterPlanId(db);
  if (!housePlan) return NextResponse.json({ error: "No owner account found." }, { status: 500 });
  const out = await releaseReplay(db, housePlan, String(b.sessionDate || ""), String(b.url || ""));
  if (!out.ok) return NextResponse.json({ error: out.error }, { status: 400 });
  return NextResponse.json({ ok: true, started: out.started, sessions: await replaySessions(db) });
}
