import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { sessionUser } from "@/lib/authz";
import { volantAccount } from "@/lib/volantServer";
import { monthlyHoursFor, secondsThisMonth, transcriptionKey } from "@/lib/volantRecordingServer";
import { authorizeUrl, disconnectZoom, importZoomRecording, listZoomRecordings, zoomAccess, zoomOauthConfigured } from "@/lib/volantZoom";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

// LC Volant + Zoom for the signed-in account.
//   GET              -> { connected, kind, email, canConnect, auto, match, recordings (last 30 days, with what was picked up) }
//   POST { action }  -> connect (-> { url } to Zoom's sign-in) | disconnect | import { uuid } | settings { auto, match }
const str = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");

export async function GET() {
  const a = await volantAccount();
  if ("denied" in a) return a.denied;
  const db = createServerClient();
  const { data: s } = await db.from("volant_settings").select("zoom_auto, zoom_match").eq("master_plan_id", a.planId).maybeSingle();
  const base = { canConnect: zoomOauthConfigured(), auto: s?.zoom_auto === true, match: (s?.zoom_match as string) || "" };
  const access = await zoomAccess(db, a.planId).catch(() => null);
  if (!access) return NextResponse.json({ ...base, connected: false });
  try {
    const recs = await listZoomRecordings(access, 30);
    const { data: done } = await db.from("volant_recordings").select("id, zoom_uuid, status").eq("master_plan_id", a.planId).not("zoom_uuid", "is", null);
    const byUuid = new Map((done ?? []).map((d) => [d.zoom_uuid as string, d]));
    return NextResponse.json({
      ...base,
      connected: true,
      kind: access.kind,
      email: access.email,
      recordings: recs.slice(0, 40).map((r) => ({
        uuid: r.uuid, topic: r.topic, startTime: r.startTime, durationMin: r.durationMin, ready: r.ready, hasAudio: Boolean(r.file),
        picked: byUuid.get(r.uuid) ? { id: byUuid.get(r.uuid)!.id, status: byUuid.get(r.uuid)!.status } : null,
      })),
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("GET /api/volant/zoom:", e instanceof Error ? e.message : e);
    return NextResponse.json({ ...base, connected: true, kind: access.kind, email: access.email, recordings: [], error: "Zoom didn't share your recordings just now. Try again in a minute; if it keeps happening, disconnect and connect Zoom again." });
  }
}

export async function POST(request: Request) {
  const a = await volantAccount(request);
  if ("denied" in a) return a.denied;
  const b = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const action = str(b.action, 20);
  const db = createServerClient();

  if (action === "connect") {
    if (!zoomOauthConfigured()) return NextResponse.json({ error: "Connecting Zoom isn't switched on yet." }, { status: 503 });
    return NextResponse.json({ url: authorizeUrl(a.planId) });
  }
  if (action === "disconnect") {
    await disconnectZoom(db, a.planId);
    return NextResponse.json({ ok: true });
  }
  if (action === "settings") {
    const row = { master_plan_id: a.planId, zoom_auto: b.auto === true, zoom_match: str(b.match, 300) || null, updated_at: new Date().toISOString() };
    const { error } = await db.from("volant_settings").upsert(row, { onConflict: "master_plan_id" });
    return error ? NextResponse.json({ error: "Couldn't save that." }, { status: 500 }) : NextResponse.json({ ok: true });
  }
  if (action === "import") {
    if (!transcriptionKey()) return NextResponse.json({ error: "Recording transcription isn't switched on yet." }, { status: 503 });
    const access = await zoomAccess(db, a.planId).catch(() => null);
    if (!access) return NextResponse.json({ error: "Connect Zoom first." }, { status: 400 });
    const [usage, limit] = await Promise.all([secondsThisMonth(db, a.planId), monthlyHoursFor(db, a.planId)]);
    if (usage.seconds >= limit * 3600) return NextResponse.json({ error: `You've transcribed ${limit} hours of recordings this month, the monthly limit.` }, { status: 429 });
    if (usage.pending >= 3) return NextResponse.json({ error: "Three recordings are already transcribing. Wait for one to finish." }, { status: 429 });
    const uuid = str(b.uuid, 200);
    const recs = await listZoomRecordings(access, 30).catch(() => []);
    const r = recs.find((x) => x.uuid === uuid);
    if (!r) return NextResponse.json({ error: "That Zoom recording could not be found." }, { status: 404 });
    if (!r.ready) return NextResponse.json({ error: "Zoom is still processing this recording. Try again in a few minutes." }, { status: 400 });
    if (!r.file) return NextResponse.json({ error: "This Zoom recording has no sound file to transcribe." }, { status: 400 });
    try {
      const who = await sessionUser().catch(() => null);
      const id = await importZoomRecording(db, a.planId, access, r, who?.id ?? null);
      return NextResponse.json({ ok: true, id, already: id === null });
    } catch (e) {
      console.error("POST /api/volant/zoom import:", e instanceof Error ? e.message : e);
      return NextResponse.json({ error: "That recording couldn't be sent for transcription. Try again." }, { status: 502 });
    }
  }
  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
