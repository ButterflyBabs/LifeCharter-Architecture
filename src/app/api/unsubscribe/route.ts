import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { readUnsubscribeToken } from "@/lib/sequences/render";

export const dynamic = "force-dynamic";

// One-click unsubscribe for sequence emails. POST is what mail apps send
// (List-Unsubscribe-Post); the /unsubscribe page posts here too. The signed
// token is the only way in, so nobody can unsubscribe someone else.
async function unsubscribe(token: string | null) {
  const contactId = token ? readUnsubscribeToken(token) : null;
  if (!contactId) return false;
  const db = createServerClient();
  const { data } = await db
    .from("seq_contacts")
    .update({ unsubscribed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", contactId)
    .is("unsubscribed_at", null)
    .select("id");
  await db.from("sequence_enrollments").update({ status: "stopped" }).eq("contact_id", contactId).in("status", ["active", "paused"]);
  void data;
  return true;
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  let token = url.searchParams.get("t");
  if (!token) {
    const body = await request.json().catch(() => ({}));
    token = typeof body?.t === "string" ? body.t : null;
  }
  const ok = await unsubscribe(token);
  return NextResponse.json(ok ? { ok: true } : { error: "That link isn't valid." }, { status: ok ? 200 : 400 });
}

// A plain GET (someone pasting the header link) lands on the friendly page.
export async function GET(request: Request) {
  const t = new URL(request.url).searchParams.get("t") || "";
  return NextResponse.redirect(new URL(`/unsubscribe?t=${encodeURIComponent(t)}`, request.url));
}
