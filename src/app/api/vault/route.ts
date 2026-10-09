import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { CATEGORIES, clean, isUnlocked, vaultUser } from "@/lib/vault";

export const dynamic = "force-dynamic";

// The Logins & Passwords vault. Lists only ever carry names, addresses, usernames and types: never a password.
// GET → { unlocked, items[] }     POST create     PATCH edit (password optional)     DELETE ?id=
type Row = { id: string; label: string; url: string | null; username: string | null; category: string; last_revealed_at: string | null; updated_at: string };
const shape = (r: Row) => ({ id: r.id, label: r.label, url: r.url, username: r.username, category: r.category, lastRevealedAt: r.last_revealed_at, updatedAt: r.updated_at });
const no = (m: string, s: number) => NextResponse.json({ error: m }, { status: s });

export async function GET() {
  const u = await vaultUser();
  if (!u) return no("Please sign in.", 401);
  if (!isUnlocked(u.id)) return NextResponse.json({ unlocked: false, items: [] }, { headers: { "Cache-Control": "no-store" } });
  const { data } = await createServerClient().from("vault_items").select("id, label, url, username, category, last_revealed_at, updated_at").eq("owner_user_id", u.id).order("label");
  return NextResponse.json({ unlocked: true, items: ((data ?? []) as Row[]).map(shape) }, { headers: { "Cache-Control": "no-store" } });
}

function fields(b: Record<string, unknown>) {
  const label = clean(b.label, 120);
  const url = clean(b.url, 300);
  const username = clean(b.username, 200);
  const category = (CATEGORIES as readonly string[]).includes(String(b.category)) ? String(b.category) : "Other";
  return { label, url: url || null, username: username || null, category };
}

export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return no("cross-origin request blocked", 403);
  const u = await vaultUser();
  if (!u) return no("Please sign in.", 401);
  if (!isUnlocked(u.id)) return no("Unlock your vault first.", 403);
  const b = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const f = fields(b);
  if (!f.label) return no("Give it a name, for example the website or app.", 400);
  const password = typeof b.password === "string" ? b.password.slice(0, 500) : "";
  const notes = clean(b.notes, 2000);
  const db = createServerClient();
  const secret = JSON.stringify({ password, notes });
  const { data, error } = await db.rpc("vault_item_save", { p_user: u.id, p_id: null, p_label: f.label, p_url: f.url, p_username: f.username, p_category: f.category, p_secret: secret });
  if (error) return no("Couldn't save that.", 500);
  await db.from("vault_audit").insert({ owner_user_id: u.id, item_id: data as string, item_label: f.label, action: "added" });
  return NextResponse.json({ ok: true, id: data });
}

export async function PATCH(request: Request) {
  if (crossOriginBlocked(request)) return no("cross-origin request blocked", 403);
  const u = await vaultUser();
  if (!u) return no("Please sign in.", 401);
  if (!isUnlocked(u.id)) return no("Unlock your vault first.", 403);
  const b = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const id = clean(b.id, 60);
  const f = fields(b);
  if (!id || !f.label) return no("Give it a name.", 400);
  const db = createServerClient();
  // The password and notes are stored together: changing one keeps the other unless it is given too.
  let secret: string | null = null;
  if (typeof b.password === "string" || typeof b.notes === "string") {
    let cur: { password?: string; notes?: string } = {};
    const { data: old } = await db.rpc("vault_item_reveal", { p_user: u.id, p_id: id });
    try { cur = old ? JSON.parse(old as string) : {}; } catch { cur = {}; }
    secret = JSON.stringify({ password: typeof b.password === "string" && b.password !== "" ? b.password.slice(0, 500) : cur.password ?? "", notes: typeof b.notes === "string" ? clean(b.notes, 2000) : cur.notes ?? "" });
  }
  const { error } = await db.rpc("vault_item_save", { p_user: u.id, p_id: id, p_label: f.label, p_url: f.url, p_username: f.username, p_category: f.category, p_secret: secret });
  if (error) return no("Couldn't save that.", 500);
  await db.from("vault_audit").insert({ owner_user_id: u.id, item_id: id, item_label: f.label, action: secret ? "changed (password or notes)" : "changed" });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  if (crossOriginBlocked(request)) return no("cross-origin request blocked", 403);
  const u = await vaultUser();
  if (!u) return no("Please sign in.", 401);
  if (!isUnlocked(u.id)) return no("Unlock your vault first.", 403);
  const id = clean(new URL(request.url).searchParams.get("id"), 60);
  if (!id) return no("Missing id.", 400);
  const db = createServerClient();
  const { data: row } = await db.from("vault_items").select("label").eq("id", id).eq("owner_user_id", u.id).maybeSingle();
  await db.rpc("vault_item_delete", { p_user: u.id, p_id: id });
  await db.from("vault_audit").insert({ owner_user_id: u.id, item_id: id, item_label: (row?.label as string) ?? null, action: "deleted" });
  return NextResponse.json({ ok: true });
}
