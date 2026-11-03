import { lessonOpen } from "@/lib/courses";
import { portalAutoReply } from "@/lib/awayMode";
import { NextResponse } from "next/server";
import { crossOriginBlocked } from "@/lib/security";
import { brandFor, notifyOwnerOfMessage, portalFor, portalView } from "@/lib/portal";
import { isMember } from "@/lib/programs";
import { sessionUser } from "@/lib/authz";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";

export const dynamic = "force-dynamic";

// A client's private portal (task 1147). The unguessable link is the key. Public route (listed in the middleware).
//   GET                                        -> everything the portal shows
//   POST { action: "homework", id, done }      -> tick a homework item (or untick it)
//   POST { action: "message", body }           -> send the account owner a message
//   POST { action: "add-to-tasks", id }        -> the client CHOOSES to add a homework item to their OWN Command Suite task list
//                                                (only when they are signed in with the email the account has for them)
export async function GET(_req: Request, { params }: { params: { token: string } }) {
  const ctx = await portalFor(params.token);
  if (!ctx) return NextResponse.json({ error: "This portal link isn't active." }, { status: 404 });
  await ctx.db.from("client_portals").update({ last_seen_at: new Date().toISOString() }).eq("id", ctx.p.id);
  // A step the client finished in their own task list is ticked here too, so the two never disagree.
  const { data: linked } = await ctx.db.from("portal_items").select("id, client_task_id, status").eq("contact_id", ctx.p.contact_id).eq("kind", "homework").not("client_task_id", "is", null);
  const open = ((linked ?? []) as { id: string; client_task_id: number; status: string }[]).filter((x) => x.status !== "done");
  if (open.length) {
    const { data: tasks } = await ctx.db.from("tasks").select("id, status").in("id", open.map((x) => x.client_task_id));
    const done = new Set(((tasks ?? []) as { id: number; status: string }[]).filter((t) => t.status === "done").map((t) => t.id));
    for (const x of open) if (done.has(x.client_task_id)) await ctx.db.from("portal_items").update({ status: "done", done_at: new Date().toISOString(), done_by: "client", updated_at: new Date().toISOString() }).eq("id", x.id);
  }
  const view = await portalView(ctx.db, ctx.p);
  // Who is looking: signed in to their own Command Suite account with the email the coach has for them?
  const me = await sessionUser().catch(() => null);
  const { data: c } = await ctx.db.from("seq_contacts").select("email").eq("id", ctx.p.contact_id).maybeSingle();
  const viewer = { signedIn: Boolean(me), canAddToTasks: Boolean(me?.email && c?.email && me.email.toLowerCase() === String(c.email).toLowerCase()) };
  return NextResponse.json({ ...view, viewer }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request, { params }: { params: { token: string } }) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const ctx = await portalFor(params.token);
  if (!ctx) return NextResponse.json({ error: "This portal link isn't active." }, { status: 404 });
  const { db, p } = ctx;
  const b = (await request.json().catch(() => ({}))) as { action?: string; id?: string; done?: boolean; body?: string };
  if (b.action === "add-to-tasks") {
    // Their choice, on their own press: one task in THEIR task list (their own account), never the coach's.
    const me = await sessionUser().catch(() => null);
    if (!me?.email) return NextResponse.json({ error: "Sign in to your Command Suite account first, then press this again." }, { status: 401 });
    const { data: c } = await db.from("seq_contacts").select("email").eq("id", p.contact_id).maybeSingle();
    if (!c?.email || me.email.toLowerCase() !== String(c.email).toLowerCase()) return NextResponse.json({ error: "You are signed in with a different email than the one your coach has for you, so this can't be added to that task list." }, { status: 403 });
    const mine = await resolveMasterPlanId();
    if (!mine || mine === p.master_plan_id) return NextResponse.json({ error: "Couldn't find your own task list." }, { status: 400 });
    const { data: item } = await db.from("portal_items").select("id, title, body, due_on, client_task_id").eq("id", String(b.id || "")).eq("contact_id", p.contact_id).eq("kind", "homework").maybeSingle();
    if (!item) return NextResponse.json({ error: "That item isn't here." }, { status: 404 });
    if (item.client_task_id) return NextResponse.json({ ok: true, already: true });
    const brand = await brandFor(db, p.master_plan_id);
    const { data: task, error } = await db
      .from("tasks")
      .insert({
        master_plan_id: mine,
        title: String(item.title).slice(0, 200),
        description: `From your coaching with ${brand.name}${item.body ? `: ${String(item.body).slice(0, 300)}` : "."}`,
        status: "backlog",
        priority: "medium",
        energy: "medium",
        due_date: item.due_on ? `${item.due_on}T00:00:00Z` : null,
        followup: {},
      })
      .select("id")
      .single();
    if (error || !task) return NextResponse.json({ error: "Couldn't add it to your task list. Please try again." }, { status: 500 });
    await db.from("portal_items").update({ client_task_id: task.id as number, client_added_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", item.id);
    return NextResponse.json({ ok: true });
  }
  if (b.action === "homework") {
    const done = Boolean(b.done);
    const { data } = await db
      .from("portal_items")
      .update({ status: done ? "done" : "open", done_at: done ? new Date().toISOString() : null, done_by: done ? "client" : null, updated_at: new Date().toISOString() })
      .eq("id", String(b.id || ""))
      .eq("contact_id", p.contact_id)
      .eq("kind", "homework")
      .select("id, client_task_id");
    // Ticked here, done in their own task list too (and reopened if they untick it).
    const linkedTask = (data?.[0] as { client_task_id?: number | null } | undefined)?.client_task_id;
    if (linkedTask) await db.from("tasks").update(done ? { status: "done", completed_at: new Date().toISOString() } : { status: "backlog", completed_at: null }).eq("id", linkedTask);
    return data?.length ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "That item isn't here." }, { status: 404 });
  }
  if (b.action === "message") {
    const body = String(b.body || "").trim().slice(0, 4000);
    if (!body) return NextResponse.json({ error: "Write a message first." }, { status: 400 });
    const { count } = await db.from("portal_messages").select("id", { count: "exact", head: true }).eq("contact_id", p.contact_id).eq("author", "client").gte("created_at", new Date(Date.now() - 3_600_000).toISOString());
    if ((count ?? 0) >= 20) return NextResponse.json({ error: "That's a lot of messages in an hour. Please wait a little." }, { status: 429 });
    await db.from("portal_messages").insert({ master_plan_id: p.master_plan_id, contact_id: p.contact_id, author: "client", body });
    await notifyOwnerOfMessage(db, p.master_plan_id, p.contact_id, body);
    await portalAutoReply(db, p.master_plan_id, p.contact_id).catch(() => false);
    return NextResponse.json({ ok: true });
  }
  if (b.action === "lesson-done") {
    // Courses & Memberships (task 1152): a member ticks an open lesson complete (or not).
    const x = b as { programId?: string; lessonId?: string; done?: boolean };
    const m = await isMember(db, p.master_plan_id, String(x.programId || ""), p.contact_id);
    if (!m) return NextResponse.json({ error: "That program isn't here." }, { status: 404 });
    const { data: l } = await db.from("program_lessons").select("id, opens_on, open_after_days").eq("id", String(x.lessonId || "")).eq("program_id", String(x.programId)).maybeSingle();
    if (!l || !lessonOpen(l as { opens_on: string | null; open_after_days: number | null }, m.kind, m.joinedDay, new Date().toISOString().slice(0, 10))) return NextResponse.json({ error: "That lesson isn't open yet." }, { status: 404 });
    if (x.done) await db.from("program_lesson_done").upsert({ lesson_id: l.id, contact_id: p.contact_id }, { onConflict: "lesson_id,contact_id" });
    else await db.from("program_lesson_done").delete().eq("lesson_id", l.id).eq("contact_id", p.contact_id);
    return NextResponse.json({ ok: true });
  }
  if (b.action === "program-task" || b.action === "program-post") {
    const x = b as { programId?: string; taskId?: string; done?: boolean; body?: string; parentId?: string };
    const m = await isMember(db, p.master_plan_id, String(x.programId || ""), p.contact_id);
    if (!m) return NextResponse.json({ error: "That program isn't here." }, { status: 404 });
    if (b.action === "program-task") {
      const { data: t } = await db.from("program_tasks").select("id").eq("id", String(x.taskId || "")).eq("program_id", String(x.programId)).maybeSingle();
      if (!t) return NextResponse.json({ error: "That item isn't here." }, { status: 404 });
      if (x.done) await db.from("program_task_done").upsert({ task_id: t.id, contact_id: p.contact_id }, { onConflict: "task_id,contact_id" });
      else await db.from("program_task_done").delete().eq("task_id", t.id).eq("contact_id", p.contact_id);
      return NextResponse.json({ ok: true });
    }
    if (!m.feedOn) return NextResponse.json({ error: "The group feed is off for this program." }, { status: 400 });
    const body = String(x.body || "").trim().slice(0, 4000);
    if (!body) return NextResponse.json({ error: "Write something first." }, { status: 400 });
    let parent: string | null = null;
    if (x.parentId) {
      const { data: par } = await db.from("program_posts").select("id, parent_id").eq("id", String(x.parentId)).eq("program_id", String(x.programId)).maybeSingle();
      if (!par) return NextResponse.json({ error: "That post isn't here." }, { status: 404 });
      parent = (par.parent_id as string) || (par.id as string);
    }
    const { count } = await db.from("program_posts").select("id", { count: "exact", head: true }).eq("contact_id", p.contact_id).gte("created_at", new Date(Date.now() - 3_600_000).toISOString());
    if ((count ?? 0) >= 30) return NextResponse.json({ error: "That's a lot of posts in an hour. Please wait a little." }, { status: 429 });
    await db.from("program_posts").insert({ program_id: String(x.programId), parent_id: parent, author: "member", contact_id: p.contact_id, body });
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
