import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { houseFeatureLevel } from "@/lib/authz";
import { crossOriginBlocked } from "@/lib/security";
import { ownerMasterPlanId } from "@/lib/housePlan";
import { isFollowEvent, releaseReplay, replaySessions } from "@/lib/masterclass/followUp";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Babs, plus a team member she gave MasterClass Results (Edit to release a replay). GET: recent MasterClass and Incubator sessions and who is waiting for the replay.
// POST { sessionDate, url, event }: release that session's replay, which starts the replay and follow-up emails.
export async function GET() {
  if ((await houseFeatureLevel("masterclass_results")) === "none") return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ sessions: await replaySessions() });
}

export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  // Releasing a replay emails every registrant, so it needs Edit on MasterClass Results.
  if ((await houseFeatureLevel("masterclass_results")) !== "edit") return NextResponse.json({ error: "not found" }, { status: 404 });
  const b = await request.json().catch(() => ({}));
  const db = createServerClient();
  const housePlan = await ownerMasterPlanId(db);
  if (!housePlan) return NextResponse.json({ error: "No owner account found." }, { status: 500 });
  const out = await releaseReplay(db, housePlan, String(b.sessionDate || ""), String(b.url || ""), isFollowEvent(b.event) ? b.event : "masterclass");
  if (!out.ok) return NextResponse.json({ error: out.error }, { status: 400 });
  return NextResponse.json({ ok: true, started: out.started, sessions: await replaySessions(db) });
}
