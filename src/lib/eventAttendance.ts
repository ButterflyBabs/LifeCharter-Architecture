import { createServerClient } from "@/lib/supabase/server";
import { advanceCards, retagContact } from "@/lib/dmPipeline";
import { logEvent } from "@/lib/crm";
import { listPastInstances, listPastParticipants, isZoomConfigured } from "@/lib/zoom";
import type { EventRow } from "@/lib/events";
import { canCallNoShows, matchAttendance, mergeParticipants, sessionOver } from "@/lib/eventAttendanceLogic";

type Db = ReturnType<typeof createServerClient>;

// Workshop attendance from Zoom (Babs, 2026-11-04): after each live session of a published workshop, everyone who was in the room
// for five minutes or more is marked attended (the registration, a tag, a timeline line) and their outreach card moves to
// Attended; when Zoom gave us emails for most of the room, registered people who were not there move to No-show. A later day
// still moves a no-show forward to Attended. One note goes on Babs's Reminders page after each session with the numbers and
// any names Zoom showed that we could not match, so nobody is silently missed.

const meetingIdOf = (url: string | null) => url?.match(/zoom\.us\/j\/(\d{9,11})/)?.[1] ?? null;

export interface SessionReport { session: string; participants: number; attended: number; byName: number; noShows: number; unmatched: string[]; noShowsMoved: boolean; skipped?: string }

export async function syncEventAttendance(db: Db, e: EventRow, opts: { dry?: boolean; now?: number } = {}): Promise<SessionReport[]> {
  const out: SessionReport[] = [];
  const meeting = meetingIdOf(e.join_url);
  if (!meeting || !e.starts_at || !isZoomConfigured()) return out;
  const now = opts.now ?? Date.now();
  const first = Date.parse(e.starts_at) - 12 * 3_600_000;
  const instances = (await listPastInstances(meeting)).filter((i) => Date.parse(i.start) >= first && sessionOver(i.start, e.duration_min, now));
  const { data: regs } = await db.from("event_registrations").select("id, email, first_name, contact_id, attended").eq("event_id", e.id);
  const reg = (regs ?? []) as { id: string; email: string; first_name: string | null; contact_id: string | null; attended: boolean | null }[];
  if (!reg.length) return out;
  // Last names live on the contact, not the registration.
  const ids = reg.map((r) => r.contact_id).filter(Boolean) as string[];
  const { data: cs } = ids.length ? await db.from("seq_contacts").select("id, first_name, last_name").in("id", ids) : { data: [] };
  const last = new Map(((cs ?? []) as { id: string; first_name: string | null; last_name: string | null }[]).map((c) => [c.id, c]));
  const registrants = reg.map((r) => ({ id: r.id, email: r.email, firstName: last.get(r.contact_id ?? "")?.first_name ?? r.first_name, lastName: last.get(r.contact_id ?? "")?.last_name ?? null }));
  const attendedBefore = new Set(reg.filter((r) => r.attended).map((r) => r.id));
  const tag = `attended-${e.slug}`;

  for (const inst of instances) {
    const key = `event-attendance:${e.id}:${inst.uuid}`;
    const { data: done } = await db.from("app_settings").select("key").eq("key", key).maybeSingle();
    if (done && !opts.dry) continue;
    const merged = mergeParticipants(await listPastParticipants(inst.uuid));
    const m = matchAttendance(registrants, merged);
    const came = new Set([...Array.from(attendedBefore), ...m.attended]);
    const callNoShows = canCallNoShows(m);
    const missing = reg.filter((r) => !came.has(r.id));
    const report: SessionReport = { session: inst.start, participants: merged.length, attended: m.attended.length, byName: m.byName, noShows: callNoShows ? missing.length : 0, unmatched: m.unmatched.map((p) => p.name || p.email), noShowsMoved: callNoShows };
    if (!opts.dry) {
      for (const id of m.attended) {
        const r = reg.find((x) => x.id === id)!;
        if (!r.attended) await db.from("event_registrations").update({ attended: true }).eq("id", r.id);
        attendedBefore.add(r.id);
        if (r.contact_id) {
          await retagContact(db, e.master_plan_id, r.contact_id, [tag], []).catch(() => {});
          await logEvent(e.master_plan_id, r.contact_id, "tag", `Attended ${e.title} (${new Date(inst.start).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/Denver" })})`, { event: e.slug }, db as never).catch(() => {});
        }
        await advanceCards(db, e.master_plan_id, { contactId: r.contact_id, email: r.email }, "attended").catch((x) => console.error("event attendance card:", x));
      }
      if (callNoShows) {
        for (const r of missing) await advanceCards(db, e.master_plan_id, { contactId: r.contact_id, email: r.email }, "no_show").catch((x) => console.error("event no-show card:", x));
      }
      const day = new Date(inst.start).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", timeZone: "America/Denver" });
      const lines = [
        `${m.attended.length} registered people were marked Attended and their outreach cards moved to Attended${m.byName ? ` (${m.byName} matched by their full name because Zoom showed no email)` : ""}.`,
        callNoShows ? `${missing.length} registered people were not there and their cards moved to No-show.` : `No-show cards were NOT moved: Zoom showed an email for only ${Math.round(m.emailCoverage * 100)}% of the room, so check the ${missing.length} registered people who were not matched before telling anyone we missed them.`,
        report.unmatched.length ? `Names in Zoom that matched nobody registered: ${report.unmatched.slice(0, 20).join(", ")}.` : "",
      ].filter(Boolean);
      await db.from("reminders").insert({ master_plan_id: e.master_plan_id, title: `${e.title}: attendance, ${day}`, notes: lines.join("\n").slice(0, 1000), remind_at: new Date().toISOString() });
      await db.from("app_settings").upsert({ key, value: JSON.stringify(report) });
    }
    out.push(report);
  }
  return out;
}

export async function runEventAttendance(db: Db, opts: { dry?: boolean } = {}) {
  const { data } = await db.from("events").select("*").eq("status", "published").eq("kind", "challenge").not("starts_at", "is", null).not("join_url", "is", null);
  const now = Date.now();
  const results: { event: string; sessions: SessionReport[]; error?: string }[] = [];
  for (const e of (data ?? []) as EventRow[]) {
    const start = Date.parse(e.starts_at as string);
    const end = start + ((e.days ?? 1) + 2) * 86_400_000; // keep looking for two days after the last session
    if (now < start || now > end) continue;
    try {
      results.push({ event: e.slug, sessions: await syncEventAttendance(db, e, opts) });
    } catch (x) {
      results.push({ event: e.slug, sessions: [], error: String(x).slice(0, 160) });
    }
  }
  return results;
}
