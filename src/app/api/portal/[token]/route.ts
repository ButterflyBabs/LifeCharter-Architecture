import { NextResponse } from "next/server";
import { crossOriginBlocked } from "@/lib/security";
import { notifyOwnerOfMessage, portalFor, portalView } from "@/lib/portal";

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
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
