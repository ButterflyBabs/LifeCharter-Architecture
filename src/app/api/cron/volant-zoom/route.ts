import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { monthlyHoursFor, secondsThisMonth, transcriptionKey } from "@/lib/volantRecordingServer";
import { importZoomRecording, listZoomRecordings, topicMatches, zoomAccess } from "@/lib/volantZoom";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Every 30 minutes: for each account that switched on "Pick up my Zoom recordings automatically" in LC Volant, find
// Zoom cloud recordings from the last 2 days that are finished processing, at least 3 minutes long and (if the
// account set words) whose topic matches, and start transcribing them. Each is picked up once; the account's
// monthly hours and three-at-a-time limits apply. The bell tells them when each one is ready.
// ?dry=1 lists what would be picked up without starting anything.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!transcriptionKey()) return NextResponse.json({ skipped: "ASSEMBLYAI_API_KEY not set" });
  const dry = new URL(request.url).searchParams.get("dry") === "1";
  const db = createServerClient();
  const { data: accounts } = await db.from("volant_settings").select("master_plan_id, zoom_match").eq("zoom_auto", true);
  const report: { planId: string; started: string[]; skipped?: string }[] = [];
  for (const acc of accounts ?? []) {
    const planId = acc.master_plan_id as string;
    const started: string[] = [];
    try {
      const access = await zoomAccess(db, planId);
      if (!access) {
        report.push({ planId, started, skipped: "no Zoom connection" });
        continue;
      }
      const recs = (await listZoomRecordings(access, 2)).filter((r) => r.ready && r.file && r.durationMin >= 3 && topicMatches(r.topic, acc.zoom_match as string | null));
      if (!recs.length) {
        report.push({ planId, started });
        continue;
      }
      const { data: done } = await db.from("volant_recordings").select("zoom_uuid").eq("master_plan_id", planId).in("zoom_uuid", recs.map((r) => r.uuid));
      const seen = new Set((done ?? []).map((d) => d.zoom_uuid as string));
      const [usage, limit] = await Promise.all([secondsThisMonth(db, planId), monthlyHoursFor(db, planId)]);
      let room = Math.max(0, 3 - usage.pending);
      let secondsLeft = limit * 3600 - usage.seconds;
      for (const r of recs.filter((x) => !seen.has(x.uuid)).reverse()) {
        if (room <= 0 || secondsLeft <= 0) break;
        if (dry) {
          started.push(r.topic);
        } else {
          const id = await importZoomRecording(db, planId, access, r, null).catch((e) => {
            console.error("cron volant-zoom import:", e instanceof Error ? e.message : e);
            return null;
          });
          if (id) started.push(r.topic);
        }
        room -= 1;
        secondsLeft -= r.durationMin * 60;
      }
      report.push({ planId, started });
    } catch (e) {
      report.push({ planId, started, skipped: e instanceof Error ? e.message.slice(0, 200) : "error" });
    }
  }
  return NextResponse.json({ dry, accounts: report.length, report });
}
