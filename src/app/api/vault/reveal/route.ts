import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { clean, isUnlocked, vaultUser } from "@/lib/vault";

export const dynamic = "force-dynamic";

// POST { id }: the one place a password is decrypted and sent to the browser, for one item at a time, after unlock, and logged.
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const u = await vaultUser();
  if (!u) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  if (!isUnlocked(u.id)) return NextResponse.json({ error: "Unlock your vault first.", locked: true }, { status: 403 });
  const b = (await request.json().catch(() => ({}))) as { id?: unknown };
  const id = clean(b.id, 60);
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });
  const db = createServerClient();
  const { data, error } = await db.rpc("vault_item_reveal", { p_user: u.id, p_id: id });
  if (error) return NextResponse.json({ error: "Couldn't open that." }, { status: 500 });
  let out: { password?: string; notes?: string } = {};
  try { out = data ? JSON.parse(data as string) : {}; } catch { out = {}; }
  const { data: row } = await db.from("vault_items").select("label").eq("id", id).eq("owner_user_id", u.id).maybeSingle();
  await db.from("vault_items").update({ last_revealed_at: new Date().toISOString() }).eq("id", id).eq("owner_user_id", u.id);
  await db.from("vault_audit").insert({ owner_user_id: u.id, item_id: id, item_label: (row?.label as string) ?? null, action: "password shown or copied" });
  return NextResponse.json({ password: out.password ?? "", notes: out.notes ?? "" }, { headers: { "Cache-Control": "no-store" } });
}
