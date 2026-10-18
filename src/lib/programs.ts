import { createServerClient } from "@/lib/supabase/server";
import { defaultLook, newPortalToken, sendPortalLink, PORTAL_COLUMNS, type PortalRow } from "@/lib/portal";
import type { VolantReport } from "@/lib/volant";
import { accessEnded, accessEndsOn, lessonOpensOn, percent, type ProgramKind } from "@/lib/courses";

// Client portal, second release (task 1147): group programs and cohorts. A program has members (contacts), sessions,
// lessons (open now or on a date), group homework (each member ticks their own), a group feed (first names only) and
// group recaps from LC Volant. Members see their programs inside their own portal; joining creates a portal if needed.

type Db = ReturnType<typeof createServerClient>;

/** The client's portal, created (with the account's default look) if they don't have one yet. */
export async function ensurePortal(db: Db, planId: string, contactId: string): Promise<{ portal: PortalRow; created: boolean }> {
  const { data: have } = await db.from("client_portals").select(PORTAL_COLUMNS).eq("contact_id", contactId).eq("master_plan_id", planId).maybeSingle();
  if (have) return { portal: have as PortalRow, created: false };
  const { data } = await db.from("client_portals").insert({ master_plan_id: planId, contact_id: contactId, token: newPortalToken(), look: await defaultLook(db, planId) }).select(PORTAL_COLUMNS).single();
  return { portal: data as PortalRow, created: true };
}

/** Add someone to a program (or bring them back). A brand-new portal gets its link emailed when sendLink is set. */
export async function joinProgram(db: Db, planId: string, programId: string, contactId: string, source: string, sendLink: boolean): Promise<{ ok: boolean; linkSent: boolean }> {
  const { data: prog } = await db.from("programs").select("id").eq("id", programId).eq("master_plan_id", planId).maybeSingle();
  const { data: c } = await db.from("seq_contacts").select("id").eq("id", contactId).eq("master_plan_id", planId).maybeSingle();
  if (!prog || !c) return { ok: false, linkSent: false };
  await db.from("program_members").upsert({ program_id: programId, master_plan_id: planId, contact_id: contactId, status: "active", source, ended_at: null, end_reason: null }, { onConflict: "program_id,contact_id" });
  const { portal, created } = await ensurePortal(db, planId, contactId);
  let linkSent = false;
  if (sendLink && (created || !portal.sent_at) && portal.active) linkSent = (await sendPortalLink(db, portal).catch(() => ({ ok: false }))).ok;
  return { ok: true, linkSent };
}

/** Someone bought an offer: add them to every active program sold through that offer. */
export async function enrollForOffer(db: Db, planId: string, offerId: string, contactId: string): Promise<number> {
  const { data: progs } = await db.from("programs").select("id").eq("master_plan_id", planId).eq("offer_id", offerId).eq("status", "active");
  let n = 0;
  for (const p of (progs ?? []) as { id: string }[]) if ((await joinProgram(db, planId, p.id, contactId, "payment", true)).ok) n++;
  return n;
}

const first = (c: { first_name?: string | null; email?: string | null } | undefined) => (c?.first_name || "").trim() || "A member";

/** Everything one member sees of their programs (only programs they belong to; other members by first name only). */
export async function programsForMember(db: Db, planId: string, contactId: string, ownerName: string) {
  const { data: mem } = await db.from("program_members").select("program_id, joined_at").eq("contact_id", contactId).eq("master_plan_id", planId).eq("status", "active");
  const joined = new Map(((mem ?? []) as { program_id: string; joined_at: string }[]).map((m) => [m.program_id, m.joined_at.slice(0, 10)]));
  const ids = Array.from(joined.keys());
  if (!ids.length) return [];
  const today = new Date().toISOString().slice(0, 10);
  const since = new Date(Date.now() - 2 * 3_600_000).toISOString();
  const [{ data: progs }, { data: sessions }, { data: lessons }, { data: tasks }, { data: posts }, { data: reports }] = await Promise.all([
    db.from("programs").select("id, name, description, starts_on, ends_on, feed_on, kind, access_days, completion_message").in("id", ids).eq("status", "active"),
    db.from("program_sessions").select("id, program_id, title, starts_at, duration_min, join_url, notes").in("program_id", ids).gte("starts_at", since).order("starts_at").limit(50),
    db.from("program_lessons").select("id, program_id, title, body, url, video_url, file_path, file_name, opens_on, open_after_days, module, position").in("program_id", ids).order("position").order("created_at"),
    db.from("program_tasks").select("id, program_id, title, body, due_on, position").in("program_id", ids).order("position").order("created_at"),
    db.from("program_posts").select("id, program_id, parent_id, author, contact_id, body, pinned, created_at").in("program_id", ids).order("created_at").limit(500),
    db.from("volant_reports").select("id, program_id, title, session_date, report").in("program_id", ids).not("program_shared_at", "is", null).order("session_date", { ascending: false }).limit(30),
  ]);
  const taskIds = ((tasks ?? []) as { id: string }[]).map((t) => t.id);
  const { data: done } = taskIds.length ? await db.from("program_task_done").select("task_id").eq("contact_id", contactId).in("task_id", taskIds) : { data: [] };
  const doneSet = new Set(((done ?? []) as { task_id: string }[]).map((d) => d.task_id));
  const lessonIds = ((lessons ?? []) as { id: string }[]).map((l) => l.id);
  const { data: ldone } = lessonIds.length ? await db.from("program_lesson_done").select("lesson_id").eq("contact_id", contactId).in("lesson_id", lessonIds) : { data: [] };
  const lessonDone = new Set(((ldone ?? []) as { lesson_id: string }[]).map((d) => d.lesson_id));
  const authorIds = Array.from(new Set(((posts ?? []) as { contact_id: string | null }[]).map((p) => p.contact_id).filter(Boolean))) as string[];
  const { data: people } = authorIds.length ? await db.from("seq_contacts").select("id, first_name").in("id", authorIds) : { data: [] };
  const nameOf = new Map(((people ?? []) as { id: string; first_name: string | null }[]).map((p) => [p.id, first(p)]));
  type Post = { id: string; program_id: string; parent_id: string | null; author: string; contact_id: string | null; body: string; pinned: boolean; created_at: string };
  const shapePost = (p: Post) => ({ id: p.id, body: p.body, pinned: p.pinned, at: p.created_at, by: p.author === "owner" ? ownerName : p.contact_id === contactId ? "You" : nameOf.get(p.contact_id || "") || "A member", mine: p.contact_id === contactId, owner: p.author === "owner" });
  type Prog = { id: string; name: string; description: string | null; starts_on: string | null; ends_on: string | null; feed_on: boolean; kind: ProgramKind; access_days: number | null; completion_message: string | null };
  type Lesson = { id: string; program_id: string; title: string; body: string | null; url: string | null; video_url: string | null; file_path: string | null; file_name: string | null; opens_on: string | null; open_after_days: number | null; module: string | null };
  // A course whose access length has run out drops out of the portal.
  const live = ((progs ?? []) as Prog[]).filter((p) => !accessEnded(p.kind, p.access_days, joined.get(p.id)!, today));
  return live.map((p) => {
    const ps = ((posts ?? []) as Post[]).filter((x) => x.program_id === p.id);
    const joinedDay = joined.get(p.id)!;
    const ls = ((lessons ?? []) as Lesson[]).filter((l) => l.program_id === p.id);
    const doneCount = ls.filter((l) => lessonDone.has(l.id)).length;
    return {
      id: p.id,
      kind: p.kind,
      accessEndsOn: accessEndsOn(p.kind, p.access_days, joinedDay),
      progress: { done: doneCount, total: ls.length, percent: percent(doneCount, ls.length) },
      completionMessage: ls.length && doneCount === ls.length ? p.completion_message || null : null,
      name: p.name,
      description: p.description,
      startsOn: p.starts_on,
      endsOn: p.ends_on,
      feedOn: p.feed_on,
      sessions: ((sessions ?? []) as { id: string; program_id: string; title: string; starts_at: string; duration_min: number; join_url: string | null; notes: string | null }[])
        .filter((s) => s.program_id === p.id)
        .map((s) => ({ id: s.id, title: s.title, start: s.starts_at, minutes: s.duration_min, joinUrl: s.join_url, notes: s.notes })),
      lessons: ls.map((l) => {
        const opensOn = lessonOpensOn(l, p.kind, joinedDay);
        const open = !opensOn || opensOn <= today;
        const base = { id: l.id, title: l.title, module: l.module, open, opensOn, done: lessonDone.has(l.id) };
        return open
          ? { ...base, body: l.body, url: l.url, videoUrl: l.video_url, hasFile: Boolean(l.file_path), fileName: l.file_name }
          : { ...base, body: null, url: null, videoUrl: null, hasFile: false, fileName: null };
      }),
      tasks: ((tasks ?? []) as { id: string; program_id: string; title: string; body: string | null; due_on: string | null }[])
        .filter((t) => t.program_id === p.id)
        .map((t) => ({ id: t.id, title: t.title, body: t.body, dueOn: t.due_on, done: doneSet.has(t.id) })),
      recaps: ((reports ?? []) as { id: string; program_id: string; title: string; session_date: string; report: VolantReport }[])
        .filter((r) => r.program_id === p.id)
        .map((r) => ({
          id: r.id,
          title: r.title,
          date: r.session_date,
          sections: (r.report?.sections ?? []).filter((s) => s.kind === "text" && (s.content || "").trim()).map((s) => ({ title: s.title, content: s.content })),
          commitments: (r.report?.action_items ?? []).map((a) => ({ text: a.text, due: a.due ?? null })),
        })),
      feed: p.feed_on
        ? ps
            .filter((x) => !x.parent_id)
            .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.created_at.localeCompare(a.created_at))
            .map((x) => ({ ...shapePost(x), replies: ps.filter((r) => r.parent_id === x.id).map(shapePost) }))
        : [],
    };
  });
}

/** Is this contact an active member of this account's program? */
export async function isMember(db: Db, planId: string, programId: string, contactId: string): Promise<{ feedOn: boolean; kind: ProgramKind; joinedDay: string } | null> {
  const [{ data: m }, { data: p }] = await Promise.all([
    db.from("program_members").select("id, joined_at").eq("program_id", programId).eq("contact_id", contactId).eq("status", "active").maybeSingle(),
    db.from("programs").select("feed_on, status, kind, access_days").eq("id", programId).eq("master_plan_id", planId).maybeSingle(),
  ]);
  if (!m || !p || p.status !== "active") return null;
  const joinedDay = String(m.joined_at).slice(0, 10);
  if (accessEnded(p.kind as ProgramKind, p.access_days as number | null, joinedDay, new Date().toISOString().slice(0, 10))) return null;
  return { feedOn: Boolean(p.feed_on), kind: p.kind as ProgramKind, joinedDay };
}

/** A membership's subscription was cancelled: end that member's access to every membership sold through the offer. */
export async function endMembershipsForOffer(db: Db, planId: string, offerId: string, contactId: string): Promise<number> {
  const { data: progs } = await db.from("programs").select("id").eq("master_plan_id", planId).eq("offer_id", offerId).eq("kind", "membership");
  const ids = ((progs ?? []) as { id: string }[]).map((p) => p.id);
  if (!ids.length) return 0;
  const { data } = await db.from("program_members").update({ status: "removed", ended_at: new Date().toISOString(), end_reason: "subscription cancelled" }).in("program_id", ids).eq("contact_id", contactId).eq("status", "active").select("id");
  return (data ?? []).length;
}
