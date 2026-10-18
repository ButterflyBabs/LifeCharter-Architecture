import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crmAccount } from "../crm/guard";
import { PORTAL_OPEN_TO_ALL } from "@/lib/portalFlag";
import { PORTAL_BUCKET, sendPortalLink, type PortalRow, PORTAL_COLUMNS } from "@/lib/portal";
import { joinProgram } from "@/lib/programs";

export const dynamic = "force-dynamic";

// Clients & Sales › Programs (task 1147, second release): group programs and cohorts.
//   GET                -> every program with its member count
//   GET ?id=<program>  -> one program: members, sessions, lessons, homework (who's done), feed, LC Volant reports to share
//   POST { action, ... }
async function account(request?: Request) {
  const a = await crmAccount(request);
  if ("denied" in a) return a;
  if (!PORTAL_OPEN_TO_ALL && !a.isArchitect) return { denied: NextResponse.json({ error: "not found" }, { status: 404 }) };
  return a;
}
const str = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");
const isDay = (v: unknown) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
const link = (v: unknown) => (/^https?:\/\//i.test(str(v, 1000)) ? str(v, 1000) : null);
const nameOf = (c: { first_name?: string | null; last_name?: string | null; email?: string | null } | undefined) => [c?.first_name, c?.last_name].filter(Boolean).join(" ") || c?.email || "Someone";

export async function GET(request: Request) {
  const a = await account();
  if ("denied" in a) return a.denied;
  const db = createServerClient();
  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    const [{ data: progs }, { data: members }] = await Promise.all([
      db.from("programs").select("id, name, starts_on, ends_on, status, offer_id").eq("master_plan_id", a.planId).order("created_at", { ascending: false }),
      db.from("program_members").select("program_id").eq("master_plan_id", a.planId).eq("status", "active"),
    ]);
    const count = new Map<string, number>();
    for (const m of (members ?? []) as { program_id: string }[]) count.set(m.program_id, (count.get(m.program_id) ?? 0) + 1);
    return NextResponse.json({ programs: ((progs ?? []) as { id: string }[]).map((p) => ({ ...p, members: count.get(p.id) ?? 0 })) }, { headers: { "Cache-Control": "no-store" } });
  }
  const { data: prog } = await db.from("programs").select("*").eq("id", id).eq("master_plan_id", a.planId).maybeSingle();
  if (!prog) return NextResponse.json({ error: "That program could not be found." }, { status: 404 });
  const [{ data: members }, { data: sessions }, { data: lessons }, { data: tasks }, { data: posts }, { data: reports }, { data: offers }] = await Promise.all([
    db.from("program_members").select("contact_id, status, source, joined_at").eq("program_id", id).order("joined_at"),
    db.from("program_sessions").select("*").eq("program_id", id).order("starts_at"),
    db.from("program_lessons").select("*").eq("program_id", id).order("position").order("created_at"),
    db.from("program_tasks").select("*").eq("program_id", id).order("position").order("created_at"),
    db.from("program_posts").select("id, parent_id, author, contact_id, body, pinned, created_at").eq("program_id", id).order("created_at", { ascending: false }).limit(300),
    db.from("volant_reports").select("id, title, session_date, program_id, program_shared_at").eq("master_plan_id", a.planId).order("session_date", { ascending: false }).limit(40),
    db.from("sales_offers").select("id, name").eq("master_plan_id", a.planId).order("sort_order"),
  ]);
  const ids = Array.from(new Set([...((members ?? []) as { contact_id: string }[]).map((m) => m.contact_id), ...((posts ?? []) as { contact_id: string | null }[]).map((p) => p.contact_id).filter(Boolean)])) as string[];
  const taskIds = ((tasks ?? []) as { id: string }[]).map((t) => t.id);
  const [{ data: people }, { data: portals }, { data: done }] = await Promise.all([
    ids.length ? db.from("seq_contacts").select("id, first_name, last_name, email").in("id", ids) : Promise.resolve({ data: [] }),
    ids.length ? db.from("client_portals").select("contact_id, active, sent_at, last_seen_at").in("contact_id", ids) : Promise.resolve({ data: [] }),
    taskIds.length ? db.from("program_task_done").select("task_id, contact_id").in("task_id", taskIds) : Promise.resolve({ data: [] }),
  ]);
  const byId = new Map(((people ?? []) as { id: string; first_name: string | null; last_name: string | null; email: string }[]).map((p) => [p.id, p]));
  const portalOf = new Map(((portals ?? []) as { contact_id: string; active: boolean; sent_at: string | null; last_seen_at: string | null }[]).map((p) => [p.contact_id, p]));
  return NextResponse.json({
    program: prog,
    members: ((members ?? []) as { contact_id: string; status: string; source: string | null; joined_at: string }[]).map((m) => ({ ...m, name: nameOf(byId.get(m.contact_id)), email: byId.get(m.contact_id)?.email ?? "", portal: portalOf.get(m.contact_id) ?? null })),
    sessions: sessions ?? [],
    lessons: lessons ?? [],
    tasks: ((tasks ?? []) as { id: string }[]).map((t) => ({ ...t, doneBy: ((done ?? []) as { task_id: string; contact_id: string }[]).filter((d) => d.task_id === t.id).map((d) => byId.get(d.contact_id)?.first_name || "Someone") })),
    posts: ((posts ?? []) as { contact_id: string | null; author: string }[]).map((p) => ({ ...p, by: p.author === "owner" ? "You" : nameOf(byId.get(p.contact_id || "")) })),
    reports: reports ?? [],
    offers: offers ?? [],
  }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const a = await account(request);
  if ("denied" in a) return a.denied;
  const db = createServerClient();
  const b = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const now = new Date().toISOString();
  if (b.action === "create") {
    const name = str(b.name, 160);
    if (!name) return NextResponse.json({ error: "Name the program." }, { status: 400 });
    const { data, error } = await db.from("programs").insert({ master_plan_id: a.planId, name }).select("id").single();
    return error || !data ? NextResponse.json({ error: "Couldn't create it." }, { status: 500 }) : NextResponse.json({ ok: true, id: data.id });
  }
  const programId = str(b.id, 60);
  const { data: prog } = await db.from("programs").select("id").eq("id", programId).eq("master_plan_id", a.planId).maybeSingle();
  if (!prog) return NextResponse.json({ error: "That program could not be found." }, { status: 404 });
  const ok = NextResponse.json({ ok: true });

  switch (b.action) {
    case "update": {
      const patch: Record<string, unknown> = { updated_at: now };
      if (b.name !== undefined) patch.name = str(b.name, 160) || "Untitled program";
      if (b.description !== undefined) patch.description = str(b.description, 4000) || null;
      if (b.startsOn !== undefined) patch.starts_on = isDay(b.startsOn) ? b.startsOn : null;
      if (b.endsOn !== undefined) patch.ends_on = isDay(b.endsOn) ? b.endsOn : null;
      if (typeof b.feedOn === "boolean") patch.feed_on = b.feedOn;
      if (b.status === "active" || b.status === "archived") patch.status = b.status;
      if (b.offerId !== undefined) {
        const { data: o } = str(b.offerId, 60) ? await db.from("sales_offers").select("id").eq("id", str(b.offerId, 60)).eq("master_plan_id", a.planId).maybeSingle() : { data: null };
        patch.offer_id = (o?.id as string) ?? null;
      }
      await db.from("programs").update(patch).eq("id", programId);
      return ok;
    }
    case "member-add": {
      const r = await joinProgram(db, a.planId, programId, str(b.contactId, 60), "added", Boolean(b.sendLink));
      return r.ok ? NextResponse.json({ ok: true, linkSent: r.linkSent }) : NextResponse.json({ error: "That contact could not be found." }, { status: 404 });
    }
    case "member-remove": {
      await db.from("program_members").update({ status: "removed" }).eq("program_id", programId).eq("contact_id", str(b.contactId, 60));
      return ok;
    }
    case "member-send-link": {
      const { data: p } = await db.from("client_portals").select(PORTAL_COLUMNS).eq("contact_id", str(b.contactId, 60)).eq("master_plan_id", a.planId).maybeSingle();
      if (!p) return NextResponse.json({ error: "No portal yet." }, { status: 404 });
      const r = await sendPortalLink(db, p as PortalRow);
      return r.ok ? ok : NextResponse.json({ error: r.error }, { status: 400 });
    }
    case "session-add": {
      const title = str(b.title, 160);
      const starts = Date.parse(str(b.startsAt, 40));
      if (!title || !Number.isFinite(starts)) return NextResponse.json({ error: "Add a title, a date and a time." }, { status: 400 });
      const minutes = Math.min(600, Math.max(5, Math.floor(Number(b.durationMin) || 60)));
      await db.from("program_sessions").insert({ program_id: programId, title, starts_at: new Date(starts).toISOString(), duration_min: minutes, join_url: link(b.joinUrl), notes: str(b.notes, 2000) || null });
      return ok;
    }
    case "session-delete":
      await db.from("program_sessions").delete().eq("id", str(b.sessionId, 60)).eq("program_id", programId);
      return ok;
    case "lesson-add": {
      const title = str(b.title, 200);
      if (!title) return NextResponse.json({ error: "Give the lesson a title." }, { status: 400 });
      const { count } = await db.from("program_lessons").select("id", { count: "exact", head: true }).eq("program_id", programId);
      await db.from("program_lessons").insert({ program_id: programId, title, body: str(b.body, 8000) || null, url: link(b.url), video_url: link(b.videoUrl), opens_on: isDay(b.opensOn) ? b.opensOn : null, position: count ?? 0 });
      return ok;
    }
    case "lesson-update": {
      const patch: Record<string, unknown> = { updated_at: now };
      if (b.title !== undefined) patch.title = str(b.title, 200) || "Untitled lesson";
      if (b.body !== undefined) patch.body = str(b.body, 8000) || null;
      if (b.url !== undefined) patch.url = link(b.url);
      if (b.videoUrl !== undefined) patch.video_url = link(b.videoUrl);
      if (b.opensOn !== undefined) patch.opens_on = isDay(b.opensOn) ? b.opensOn : null;
      await db.from("program_lessons").update(patch).eq("id", str(b.lessonId, 60)).eq("program_id", programId);
      return ok;
    }
    case "lesson-move": {
      const { data: ls } = await db.from("program_lessons").select("id, position").eq("program_id", programId).order("position").order("created_at");
      const list = ((ls ?? []) as { id: string }[]).map((l) => l.id);
      const i = list.indexOf(str(b.lessonId, 60));
      const j = i + (Number(b.dir) < 0 ? -1 : 1);
      if (i < 0 || j < 0 || j >= list.length) return ok;
      [list[i], list[j]] = [list[j], list[i]];
      await Promise.all(list.map((lid, pos) => db.from("program_lessons").update({ position: pos }).eq("id", lid)));
      return ok;
    }
    case "lesson-delete": {
      const { data: l } = await db.from("program_lessons").select("id, file_path").eq("id", str(b.lessonId, 60)).eq("program_id", programId).maybeSingle();
      if (l?.file_path) await db.storage.from(PORTAL_BUCKET).remove([l.file_path as string]).catch(() => null);
      if (l) await db.from("program_lessons").delete().eq("id", l.id);
      return ok;
    }
    case "task-add": {
      const title = str(b.title, 200);
      if (!title) return NextResponse.json({ error: "Give it a title." }, { status: 400 });
      const { count } = await db.from("program_tasks").select("id", { count: "exact", head: true }).eq("program_id", programId);
      await db.from("program_tasks").insert({ program_id: programId, title, body: str(b.body, 4000) || null, due_on: isDay(b.dueOn) ? b.dueOn : null, position: count ?? 0 });
      return ok;
    }
    case "task-delete":
      await db.from("program_tasks").delete().eq("id", str(b.taskId, 60)).eq("program_id", programId);
      return ok;
    case "post": {
      const body = str(b.body, 4000);
      if (!body) return NextResponse.json({ error: "Write something first." }, { status: 400 });
      let parent: string | null = null;
      if (str(b.parentId, 60)) {
        const { data: par } = await db.from("program_posts").select("id, parent_id").eq("id", str(b.parentId, 60)).eq("program_id", programId).maybeSingle();
        parent = par ? ((par.parent_id as string) || (par.id as string)) : null;
      }
      await db.from("program_posts").insert({ program_id: programId, parent_id: parent, author: "owner", body });
      return ok;
    }
    case "post-pin":
      await db.from("program_posts").update({ pinned: Boolean(b.on) }).eq("id", str(b.postId, 60)).eq("program_id", programId);
      return ok;
    case "post-delete":
      await db.from("program_posts").delete().eq("id", str(b.postId, 60)).eq("program_id", programId);
      return ok;
    case "share-report":
      await db.from("volant_reports").update(b.on ? { program_id: programId, program_shared_at: now } : { program_id: null, program_shared_at: null }).eq("id", str(b.reportId, 60)).eq("master_plan_id", a.planId);
      return ok;
  }
  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
