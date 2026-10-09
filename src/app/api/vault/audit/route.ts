import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { isUnlocked, vaultUser } from "@/lib/vault";

export const dynamic = "force-dynamic";

// The person's own recent vault activity (what was opened, shown, changed and when).
export async function GET() {
  const u = await vaultUser();
  if (!u) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  if (!isUnlocked(u.id)) return NextResponse.json({ events: [] });
  const { data } = await createServerClient().from("vault_audit").select("id, item_label, action, at").eq("owner_user_id", u.id).order("at", { ascending: false }).limit(40);
  return NextResponse.json({ events: data ?? [] }, { headers: { "Cache-Control": "no-store" } });
}
