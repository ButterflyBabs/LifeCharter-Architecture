import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { CATEGORIES, TWOFA_METHODS, clean, isUnlocked, passwordIsRight, tooManyTries, vaultUser } from "@/lib/vault";

export const dynamic = "force-dynamic";

// The Logins & Passwords vault. Lists only ever carry names, addresses, logins, types and flags: never a password, secret,
// note or recovery code (those are encrypted and only opened one item at a time by /api/vault/reveal).
// GET → { unlocked, items[] }
// POST / PATCH / DELETE: each also needs "confirmPassword" (the person's Suite password) every time, so a left-open vault
// cannot be changed by someone else.
type Row = {
  id: string; label: string; url: string | null; username: string | null; category: string; twofa: boolean; twofa_method: string | null;
  recovery_contact: string | null; password_changed_at: string | null; last_revealed_at: string | null; created_at: string; updated_at: string;
};
const COLS = "id, label, url, username, category, twofa, twofa_method, recovery_contact, password_changed_at, last_revealed_at, created_at, updated_at";
const shape = (r: Row) => ({
  id: r.id, label: r.label, url: r.url, username: r.username, category: r.category, twofa: r.twofa, twofaMethod: r.twofa_method,
  recoveryContact: r.recovery_contact, passwordChangedAt: r.password_changed_at, lastRevealedAt: r.last_revealed_at, createdAt: r.created_at, updatedAt: r.updated_at,
});
const no = (m: string, s: number) => NextResponse.json({ error: m }, { status: s });

export async function GET() {
  const u = await vaultUser();
  if (!u) return no("Please sign in.", 401);
  if (!isUnlocked(u.id)) return NextResponse.json({ unlocked: false, items: [] }, { headers: { "Cache-Control": "no-store" } });
  const { data } = await createServerClient().from("vault_items").select(COLS).eq("owner_user_id", u.id).order("label");
  return NextResponse.json({ unlocked: true, items: ((data ?? []) as Row[]).map(shape) }, { headers: { "Cache-Control": "no-store" } });
}

function fields(b: Record<string, unknown>) {
  const label = clean(b.label, 120);
  const url = clean(b.url, 300);
  const username = clean(b.username, 200);
  const category = (CATEGORIES as readonly string[]).includes(String(b.category)) ? String(b.category) : "Other";
  const twofa = b.twofa === true;
  const method = clean(b.twofaMethod, 40);
  const recovery = clean(b.recoveryContact, 200);
  return { label, url: url || null, username: username || null, category, twofa, twofa_method: twofa && (TWOFA_METHODS as readonly string[]).includes(method) ? method : null, recovery_contact: recovery || null };
}

// Every change must come with the person's own Suite password.
async function confirmed(userId: string, email: string, b: Record<string, unknown>): Promise<NextResponse | null> {
  if (tooManyTries(userId)) return no("Too many tries. Please wait a few minutes and try again.", 429);
  const pw = typeof b.confirmPassword === "string" ? b.confirmPassword : "";
  if (!pw) return no("Enter your Suite password to confirm this change.", 400);
  if (!(await passwordIsRight(email, pw))) return no("That isn't your Suite password, so nothing was changed.", 403);
  return null;
}

type Secret = { password?: string; secret?: string; notes?: string; recoveryCodes?: string };
const parse = (raw: unknown): Secret => { try { return raw ? JSON.parse(raw as string) : {}; } catch { return {}; } };

export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return no("cross-origin request blocked", 403);
  const u = await vaultUser();
  if (!u) return no("Please sign in.", 401);
  if (!isUnlocked(u.id)) return no("Unlock your vault first.", 403);
  const b = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const bad = await confirmed(u.id, u.email, b);
  if (bad) return bad;
  const f = fields(b);
  if (!f.label) return no("Give it a name, for example the website or app.", 400);
  const secret = JSON.stringify({
    password: typeof b.password === "string" ? b.password.slice(0, 500) : "",
    secret: clean(b.secret, 1000),
    notes: clean(b.notes, 4000),
    recoveryCodes: clean(b.recoveryCodes, 4000),
  } satisfies Secret);
  const db = createServerClient();
  const { data, error } = await db.rpc("vault_item_save", { p_user: u.id, p_id: null, p_label: f.label, p_url: f.url, p_username: f.username, p_category: f.category, p_secret: secret });
  if (error) return no("Couldn't save that.", 500);
  await db.from("vault_items").update({ twofa: f.twofa, twofa_method: f.twofa_method, recovery_contact: f.recovery_contact, password_changed_at: new Date().toISOString() }).eq("id", data as string).eq("owner_user_id", u.id);
  await db.from("vault_audit").insert({ owner_user_id: u.id, item_id: data as string, item_label: f.label, action: "added" });
  return NextResponse.json({ ok: true, id: data });
}

export async function PATCH(request: Request) {
  if (crossOriginBlocked(request)) return no("cross-origin request blocked", 403);
  const u = await vaultUser();
  if (!u) return no("Please sign in.", 401);
  if (!isUnlocked(u.id)) return no("Unlock your vault first.", 403);
  const b = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const bad = await confirmed(u.id, u.email, b);
  if (bad) return bad;
  const id = clean(b.id, 60);
  const f = fields(b);
  if (!id || !f.label) return no("Give it a name.", 400);
  const db = createServerClient();
  const { data: old, error: oldErr } = await db.rpc("vault_item_reveal", { p_user: u.id, p_id: id });
  if (oldErr) return no("Couldn't open that.", 500);
  const cur = parse(old);
  const newPassword = typeof b.password === "string" && b.password !== "";
  const next: Secret = {
    password: newPassword ? String(b.password).slice(0, 500) : cur.password ?? "",
    secret: typeof b.secret === "string" ? clean(b.secret, 1000) : cur.secret ?? "",
    notes: typeof b.notes === "string" ? clean(b.notes, 4000) : cur.notes ?? "",
    recoveryCodes: typeof b.recoveryCodes === "string" ? clean(b.recoveryCodes, 4000) : cur.recoveryCodes ?? "",
  };
  const { error } = await db.rpc("vault_item_save", { p_user: u.id, p_id: id, p_label: f.label, p_url: f.url, p_username: f.username, p_category: f.category, p_secret: JSON.stringify(next) });
  if (error) return no("Couldn't save that.", 500);
  await db.from("vault_items").update({ twofa: f.twofa, twofa_method: f.twofa_method, recovery_contact: f.recovery_contact, ...(newPassword ? { password_changed_at: new Date().toISOString() } : {}) }).eq("id", id).eq("owner_user_id", u.id);
  await db.from("vault_audit").insert({ owner_user_id: u.id, item_id: id, item_label: f.label, action: newPassword ? "changed (new password saved)" : "changed" });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  if (crossOriginBlocked(request)) return no("cross-origin request blocked", 403);
  const u = await vaultUser();
  if (!u) return no("Please sign in.", 401);
  if (!isUnlocked(u.id)) return no("Unlock your vault first.", 403);
  const b = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const bad = await confirmed(u.id, u.email, b);
  if (bad) return bad;
  const id = clean(b.id, 60);
  if (!id) return no("Missing id.", 400);
  const db = createServerClient();
  const { data: row } = await db.from("vault_items").select("label").eq("id", id).eq("owner_user_id", u.id).maybeSingle();
  await db.rpc("vault_item_delete", { p_user: u.id, p_id: id });
  await db.from("vault_audit").insert({ owner_user_id: u.id, item_id: id, item_label: (row?.label as string) ?? null, action: "deleted" });
  return NextResponse.json({ ok: true });
}
