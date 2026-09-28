import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { logEvent } from "@/lib/crm";
import { crmAccount } from "../../guard";

export const dynamic = "force-dynamic";

// One contact: GET → contact + timeline + email series + form submissions
// PATCH { firstName, lastName, phone, tags } · POST { note } adds a timeline note
export async function GET(_: Request, { params }: { params: { id: string } }) {
  const a = await crmAccount();
  if ("denied" in a) return a.denied;
  const db = createServerClient();
  const { data: contact } = await db.from("seq_contacts").select("*").eq("id", params.id).eq("master_plan_id", a.planId).maybeSingle();
  if (!contact) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const [{ data: events }, { data: enrs }, { data: subs }] = await Promise.all([
    db.from("crm_events").select("id, kind, title, detail, created_at").eq("contact_id", contact.id).eq("master_plan_id", a.planId).order("created_at", { ascending: false }).limit(200),
    db.from("sequence_enrollments").select("id, status, start_date, sequences(name), sequence_sends(status)").eq("contact_id", contact.id),
    db.from("crm_submissions").select("id, data, created_at, crm_forms(name)").eq("contact_id", contact.id).order("created_at", { ascending: false }).limit(50),
  ]);
  const series = (enrs ?? []).map((e) => ({
    id: e.id,
    status: e.status,
    start_date: e.start_date,
    name: (e.sequences as unknown as { name: string } | null)?.name ?? "",
    sent: ((e.sequence_sends as { status: string }[] | null) ?? []).filter((s) => s.status === "sent").length,
  }));
  return NextResponse.json({ contact, events: events ?? [], series, submissions: subs ?? [] });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const a = await crmAccount(request);
  if ("denied" in a) return a.denied;
  const b = await request.json().catch(() => ({}));
  const str = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : undefined);
  const db = createServerClient();
  const { data: before } = await db.from("seq_contacts").select("tags").eq("id", params.id).eq("master_plan_id", a.planId).maybeSingle();
  if (!before) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (str(b.firstName, 80) !== undefined) patch.first_name = str(b.firstName, 80) || null;
  if (str(b.lastName, 80) !== undefined) patch.last_name = str(b.lastName, 80) || null;
  if (str(b.phone, 40) !== undefined) patch.phone = str(b.phone, 40) || null;
  if (Array.isArray(b.tags)) patch.tags = Array.from(new Set(b.tags.map((t: unknown) => String(t).trim().toLowerCase().slice(0, 60)).filter(Boolean)));
  const { data, error } = await db.from("seq_contacts").update(patch).eq("id", params.id).eq("master_plan_id", a.planId).select("*").single();
  if (error) return NextResponse.json({ error: "Couldn't save." }, { status: 500 });
  if (patch.tags) {
    const was = new Set((before.tags as string[]) ?? []);
    const now = patch.tags as string[];
    const added = now.filter((t) => !was.has(t));
    const removed = Array.from(was).filter((t) => !now.includes(t));
    if (added.length || removed.length) await logEvent(a.planId, params.id, "tag", [added.length ? `Tagged ${added.join(", ")}` : "", removed.length ? `Removed ${removed.join(", ")}` : ""].filter(Boolean).join(" · "));
  }
  return NextResponse.json({ contact: data });
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const a = await crmAccount(request);
  if ("denied" in a) return a.denied;
  const b = await request.json().catch(() => ({}));
  const note = typeof b.note === "string" ? b.note.trim().slice(0, 4000) : "";
  if (!note) return NextResponse.json({ error: "Write a note first." }, { status: 400 });
  const { data: c } = await createServerClient().from("seq_contacts").select("id").eq("id", params.id).eq("master_plan_id", a.planId).maybeSingle();
  if (!c) return NextResponse.json({ error: "Not found." }, { status: 404 });
  await logEvent(a.planId, params.id, "note", note);
  return NextResponse.json({ ok: true });
}
