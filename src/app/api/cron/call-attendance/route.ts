import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { isAlignmentArchitect } from "@/lib/authz";
import { isZoomConfigured, listMasterclassRegistrants, listPastAttendees, listPastInstances, meetingTopic } from "@/lib/zoom";
import { ownerMasterPlanId } from "@/lib/sequences/engine";
import { logEvent, upsertContact } from "@/lib/crm";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Daily: for every Zoom meeting on the Collective calendar (plus any ids in app_settings zoom_attendance_meeting_ids,
// comma separated, e.g. Founder's Half Hour), credits each person who attended a session held in the last 3 days:
// tag attended-<call>, a line on their timeline, once per session. People already in Contacts are tagged; for
// the public calls listed in app_settings zoom_attendance_create_contacts (comma separated words of the topic,
// default "Founder's Half Hour") unknown attendees are added as new contacts. Others are skipped.
// ?dry=1 (owner only, signed in) shows what would happen and writes nothing; add &days=14 to look further back.

const slug = (s: string) => s.toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
const MIN_MINUTES = 5;

async function run(dry: boolean, days = 3) {
  if (!isZoomConfigured()) return { error: "Zoom is not configured." };
  const db = createServerClient();
  const house = await ownerMasterPlanId().catch(() => null);
  if (!house) return { error: "No house account." };

  const [{ data: ev }, { data: set }] = await Promise.all([
    db.from("cm_events").select("join_url, title").not("join_url", "is", null).limit(400),
    db.from("app_settings").select("key, value").in("key", ["zoom_attendance_meeting_ids", "zoom_attendance_create_contacts", "zoom_registrant_sync_ids"]),
  ]);
  const cfg = Object.fromEntries(((set ?? []) as { key: string; value: string }[]).map((r) => [r.key, String(r.value ?? "")]));
  const ids = new Set<string>();
  for (const r of (ev ?? []) as { join_url: string }[]) {
    const m = r.join_url.match(/zoom\.us\/j\/(\d{9,11})/);
    if (m) ids.add(m[1]);
  }
  for (const id of (cfg.zoom_attendance_meeting_ids || "").split(",").map((s) => s.trim()).filter(Boolean)) ids.add(id);
  const createFor = ((cfg.zoom_attendance_create_contacts || "Founder's Half Hour").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean));

  const since = Date.now() - days * 86_400_000;
  const report: { meeting: string; topic: string; start: string; attendees: number; tagged: number; created: number; skipped: number }[] = [];

  for (const id of Array.from(ids)) {
    let topic = "";
    let instances: Awaited<ReturnType<typeof listPastInstances>>;
    try {
      instances = await listPastInstances(id);
    } catch (e) {
      report.push({ meeting: id, topic: `error: ${String(e).slice(0, 80)}`, start: "", attendees: 0, tagged: 0, created: 0, skipped: 0 });
      continue;
    }
    if (instances.length) topic = (await meetingTopic(id).catch(() => "")) || `meeting ${id}`;
    for (const inst of instances.filter((i) => new Date(i.start).getTime() >= since)) {
      let people;
      try {
        people = await listPastAttendees(inst.uuid);
      } catch {
        continue;
      }
      const emails = people.filter((p) => p.minutes >= MIN_MINUTES).map((p) => p.email);
      const { data: done } = emails.length ? await db.from("call_attendance_syncs").select("email").eq("meeting_uuid", inst.uuid).in("email", emails) : { data: [] };
      const already = new Set(((done ?? []) as { email: string }[]).map((d) => d.email));
      let tagged = 0, created = 0, skipped = 0;
      for (const p of people) {
        if (p.minutes < MIN_MINUTES || already.has(p.email)) continue;
        const { data: existing } = await db.from("seq_contacts").select("id").eq("master_plan_id", house).eq("email", p.email).maybeSingle();
        const isPublic = createFor.some((w) => topic.toLowerCase().includes(w));
        if (!existing && !isPublic) { skipped++; continue; }
        if (dry) {
          if (existing) tagged++;
          else created++;
          continue;
        }
        const [first, ...rest] = p.name.split(/\s+/);
        const c = await upsertContact({ masterPlanId: house, email: p.email, firstName: first || null, lastName: rest.join(" ") || null, source: "zoom:call-attendance", tags: [`attended-${slug(topic)}`, "attended-a-call"] }, db).catch(() => null);
        if (!c) continue;
        await db.from("call_attendance_syncs").upsert({ meeting_uuid: inst.uuid, email: p.email, meeting_id: id, topic, started_at: inst.start, minutes: p.minutes });
        await logEvent(house, c.id, "tag", `Attended ${topic} (${new Date(inst.start).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/Denver" })})`, { meeting: id, minutes: p.minutes }, db).catch(() => {});
        if (existing) tagged++;
        else created++;
      }
      report.push({ meeting: id, topic, start: inst.start, attendees: people.length, tagged, created, skipped });
    }
  }
  // Registrants of the public calls listed in zoom_registrant_sync_ids (comma separated meeting ids) go into
  // Contacts tagged registered-<call>; Zoom sends their confirmation itself. A timeline line only for new people.
  const registrants: { meeting: string; topic: string; registrants: number; created: number }[] = [];
  for (const id of (cfg.zoom_registrant_sync_ids || "").split(",").map((s) => s.trim()).filter(Boolean)) {
    try {
      const [list, topic] = await Promise.all([listMasterclassRegistrants(id), meetingTopic(id).catch(() => "")]);
      const name = topic || `meeting ${id}`;
      let created = 0;
      for (const r of list) {
        if (dry) continue;
        const c = await upsertContact({ masterPlanId: house, email: r.email, firstName: r.firstName || null, lastName: r.lastName || null, source: "zoom:registration", tags: [`registered-${slug(name)}`] }, db).catch(() => null);
        if (c?.created) {
          created++;
          await logEvent(house, c.id, "form", `Registered for ${name}`, { meeting: id }, db).catch(() => {});
        }
      }
      registrants.push({ meeting: id, topic: name, registrants: list.length, created });
    } catch (e) {
      registrants.push({ meeting: id, topic: `error: ${String(e).slice(0, 80)}`, registrants: 0, created: 0 });
    }
  }
  return { dry, meetings: ids.size, report, registrants };
}

export async function GET(request: Request) {
  const dry = new URL(request.url).searchParams.get("dry") === "1";
  if (dry) {
    if (!(await isAlignmentArchitect())) return NextResponse.json({ error: "not found" }, { status: 404 });
  } else {
    const secret = process.env.CRON_SECRET;
    if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const days = Math.min(60, Math.max(1, Number(new URL(request.url).searchParams.get("days")) || 3));
  // A wider window is only for the owner's dry run; the daily job always looks back 3 days.
  return NextResponse.json(await run(dry, dry ? days : 3));
}
