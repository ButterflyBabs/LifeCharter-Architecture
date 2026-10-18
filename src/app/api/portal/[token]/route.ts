import { portalAutoReply } from "@/lib/awayMode";
import { NextResponse } from "next/server";
import { crossOriginBlocked } from "@/lib/security";
import { notifyOwnerOfMessage, portalFor, portalView } from "@/lib/portal";
import { isMember } from "@/lib/programs";

export const dynamic = "force-dynamic";

// A client's private portal (task 1147). The unguessable link is the key. Public route (listed in the middleware).
//   GET                                        -> everything the portal shows
//   POST { action: "homework", id, done }      -> tick a homework item (or untick it)
//   POST { action: "message", body }           -> send the account owner a message
export async function GET(_req: Request, { params }: { params: { token: string } }) {
  const ctx = await portalFor(params.token);
  if (!ctx) return NextResponse.json({ error: "This portal link isn't active." }, { status: 404 });
  await ctx.db.from("client_portals").update({ last_seen_at: new Date().toISOString() }).eq("id", ctx.p.id);
  return NextResponse.json(await portalView(ctx.db, ctx.p), { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request, { params }: { params: { token: string } }) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const ctx = await portalFor(params.token);
  if (!ctx) return NextResponse.json({ error: "This portal link isn't active." }, { status: 404 });
  const { db, p } = ctx;
  const b = (await request.json().catch(() => ({}))) as { action?: string; id?: string; done?: boolean; body?: string };
  if (b.action === "homework") {
    const done = Boolean(b.done);
    const { data } = await db
      .from("portal_items")
      .update({ status: done ? "done" : "open", done_at: done ? new Date().toISOString() : null, done_by: done ? "client" : null, updated_at: new Date().toISOString() })
      .eq("id", String(b.id || ""))
      .eq("contact_id", p.contact_id)
      .eq("kind", "homework")
      .select("id");
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
