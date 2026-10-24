import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { readUnsubscribeToken } from "@/lib/sequences/render";
import { senderProfile } from "@/lib/email/accountSender";

export const dynamic = "force-dynamic";

// One-click unsubscribe for sequence emails. POST is what mail apps send
// (List-Unsubscribe-Post); the /unsubscribe page posts here too. The signed
// token is the only way in, so nobody can unsubscribe someone else.
// Contacts belong to one account, so the token only ever touches that one contact
// row (and its enrollments). The page shows that account's own support address.
async function unsubscribe(token: string | null, list: string | null): Promise<{ ok: false } | { ok: true; support: string | null }> {
  const contactId = token ? readUnsubscribeToken(token) : null;
  if (!contactId) return { ok: false };
  const db = createServerClient();
  if (list === "newsletter") {
    // Newsletter only: off the Head Up, Wings Out list, and everything else keeps coming.
    const { data: cur } = await db.from("seq_contacts").select("master_plan_id, tags").eq("id", contactId).maybeSingle();
    if (!cur) return { ok: true, support: null };
    const tags = ((cur.tags as string[] | null) ?? []).filter((t) => t !== "headup-wingsout");
    if (!tags.includes("newsletter-unsubscribed")) tags.push("newsletter-unsubscribed");
    await db.from("seq_contacts").update({ tags, updated_at: new Date().toISOString() }).eq("id", contactId);
    const p = await senderProfile(cur.master_plan_id as string, db).catch(() => null);
    return { ok: true, support: !p ? null : p.house ? "support@lccommandsuite.com" : p.supportEmail || null };
  }
  const { data } = await db
    .from("seq_contacts")
    .update({ unsubscribed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", contactId)
    .is("unsubscribed_at", null)
    .select("id");
  await db.from("sequence_enrollments").update({ status: "stopped" }).eq("contact_id", contactId).in("status", ["active", "paused"]);
  void data;
  const { data: c } = await db.from("seq_contacts").select("master_plan_id").eq("id", contactId).maybeSingle();
  if (!c?.master_plan_id) return { ok: true, support: null };
  const p = await senderProfile(c.master_plan_id as string, db).catch(() => null);
  return { ok: true, support: !p ? null : p.house ? "support@lccommandsuite.com" : p.supportEmail || null };
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  let token = url.searchParams.get("t");
  let list = url.searchParams.get("list");
  if (!token) {
    const body = await request.json().catch(() => ({}));
    token = typeof body?.t === "string" ? body.t : null;
    if (!list && typeof body?.list === "string") list = body.list;
  }
  const r = await unsubscribe(token, list);
  return NextResponse.json(r.ok ? { ok: true, support: r.support } : { error: "That link isn't valid." }, { status: r.ok ? 200 : 400 });
}

// A plain GET (someone pasting the header link) lands on the friendly page.
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams;
  const t = q.get("t") || "";
  const list = q.get("list") === "newsletter" ? "&list=newsletter" : "";
  return NextResponse.redirect(new URL(`/unsubscribe?t=${encodeURIComponent(t)}${list}`, request.url));
}
