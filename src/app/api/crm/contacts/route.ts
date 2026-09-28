import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { upsertContact, logEvent } from "@/lib/crm";
import { crmAccount } from "../guard";

export const dynamic = "force-dynamic";

// GET ?q=&tag= → the account's contacts (newest activity first) + every tag in use
// POST { email, firstName, lastName, phone, tags, note } → add someone by hand
export async function GET(request: Request) {
  const a = await crmAccount();
  if ("denied" in a) return a.denied;
  const u = new URL(request.url);
  const q = (u.searchParams.get("q") || "").trim().replace(/[%,()]/g, "");
  const tag = (u.searchParams.get("tag") || "").trim();
  const db = createServerClient();
  let query = db
    .from("seq_contacts")
    .select("id, email, first_name, last_name, phone, tags, source, unsubscribed_at, created_at, last_activity_at")
    .eq("master_plan_id", a.planId)
    .order("last_activity_at", { ascending: false, nullsFirst: false })
    .limit(500);
  if (q) query = query.or(`email.ilike.%${q}%,first_name.ilike.%${q}%,last_name.ilike.%${q}%`);
  if (tag) query = query.contains("tags", [tag]);
  const [{ data }, { data: all }] = await Promise.all([query, db.from("seq_contacts").select("tags").eq("master_plan_id", a.planId).limit(5000)]);
  const tags = Array.from(new Set((all ?? []).flatMap((c) => (c.tags as string[]) ?? []))).sort();
  return NextResponse.json({ contacts: data ?? [], tags });
}

export async function POST(request: Request) {
  const a = await crmAccount(request);
  if ("denied" in a) return a.denied;
  const b = await request.json().catch(() => ({}));
  const str = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");
  const tags = (Array.isArray(b.tags) ? b.tags : []).map((t: unknown) => str(t, 60).toLowerCase()).filter(Boolean);
  const c = await upsertContact({ masterPlanId: a.planId, email: str(b.email, 200), firstName: str(b.firstName, 80) || null, lastName: str(b.lastName, 80) || null, phone: str(b.phone, 40) || null, source: "manual", tags });
  if (!c) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  await logEvent(a.planId, c.id, "manual", c.created ? "Added by hand" : "Updated by hand");
  if (str(b.note, 4000)) await logEvent(a.planId, c.id, "note", str(b.note, 4000));
  return NextResponse.json({ id: c.id, created: c.created });
}
