import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { upsertContact, logEvent, EMAIL_RE } from "@/lib/crm";
import { crmAccount } from "../guard";

export const dynamic = "force-dynamic";

// Invite Tracker (each account sees only its own lists).
// GET ?list= → the lists, the chosen list's invites with sent + registered status
//   (registered = a submission to the list's sign-up form from that email), and
//   anyone who registered without being on the list.
// POST
//   create-list { name, formId? }
//   add { listId, people: [{ name?, email, contactId? }] }   (new emails become contacts)
//   sent { id, sent: boolean, at? (ISO) }
//   note { id, note }
//   remove { id }
export async function GET(request: Request) {
  const a = await crmAccount();
  if ("denied" in a) return a.denied;
  const db = createServerClient();
  const [{ data: lists }, { data: forms }] = await Promise.all([
    db.from("crm_invite_lists").select("id, name, form_id, created_at").eq("master_plan_id", a.planId).order("created_at", { ascending: false }),
    db.from("crm_forms").select("id, name").eq("master_plan_id", a.planId).order("name"),
  ]);
  const want = new URL(request.url).searchParams.get("list");
  const list = (lists ?? []).find((l) => l.id === want) ?? (lists ?? [])[0] ?? null;
  if (!list) return NextResponse.json({ lists: [], forms: forms ?? [], list: null, invites: [], walkIns: [] });

  const { data: invites } = await db
    .from("crm_invites")
    .select("id, contact_id, name, email, sent_at, note, created_at")
    .eq("list_id", list.id)
    .eq("master_plan_id", a.planId)
    .order("created_at", { ascending: true });

  // Registrations: first sign-up per email on the list's form.
  const registered = new Map<string, { at: string; name: string }>();
  if (list.form_id) {
    const { data: subs } = await db
      .from("crm_submissions")
      .select("created_at, data, seq_contacts(email, first_name, last_name)")
      .eq("form_id", list.form_id)
      .order("created_at", { ascending: true })
      .limit(5000);
    for (const s of subs ?? []) {
      const c = s.seq_contacts as unknown as { email: string; first_name: string | null; last_name: string | null } | null;
      const email = (c?.email || String((s.data as Record<string, string>)?.email || "")).toLowerCase();
      if (!email || registered.has(email)) continue;
      registered.set(email, { at: s.created_at as string, name: [c?.first_name, c?.last_name].filter(Boolean).join(" ") });
    }
  }
  const rows = (invites ?? []).map((i) => ({ ...i, registered_at: registered.get((i.email as string).toLowerCase())?.at ?? null }));
  const invited = new Set(rows.map((r) => (r.email as string).toLowerCase()));
  const walkIns = Array.from(registered.entries())
    .filter(([email]) => !invited.has(email))
    .map(([email, r]) => ({ email, name: r.name, registered_at: r.at }));
  return NextResponse.json({ lists: lists ?? [], forms: forms ?? [], list, invites: rows, walkIns });
}

export async function POST(request: Request) {
  const a = await crmAccount(request);
  if ("denied" in a) return a.denied;
  const b = await request.json().catch(() => ({}));
  const db = createServerClient();
  const str = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");

  if (b.action === "create-list") {
    const name = str(b.name, 120);
    if (!name) return NextResponse.json({ error: "Give the list a name." }, { status: 400 });
    let formId: string | null = null;
    if (str(b.formId, 40)) {
      const { data: f } = await db.from("crm_forms").select("id").eq("id", str(b.formId, 40)).eq("master_plan_id", a.planId).maybeSingle();
      formId = (f?.id as string) ?? null;
    }
    const { data, error } = await db.from("crm_invite_lists").insert({ master_plan_id: a.planId, name, form_id: formId }).select("id").single();
    if (error) return NextResponse.json({ error: "Couldn't create the list." }, { status: 500 });
    return NextResponse.json({ id: data.id });
  }

  if (b.action === "add") {
    const { data: list } = await db.from("crm_invite_lists").select("id, name").eq("id", str(b.listId, 40)).eq("master_plan_id", a.planId).maybeSingle();
    if (!list) return NextResponse.json({ error: "Not found." }, { status: 404 });
    const people = (Array.isArray(b.people) ? b.people : []).slice(0, 500) as { name?: unknown; email?: unknown }[];
    let added = 0;
    const skipped: string[] = [];
    for (const p of people) {
      const email = str(p.email, 200).toLowerCase();
      if (!EMAIL_RE.test(email)) {
        skipped.push(str(p.email, 200) || str(p.name, 80) || "(blank)");
        continue;
      }
      const name = str(p.name, 120);
      const [first, ...rest] = name.split(/\s+/);
      // Everyone invited lands in Contacts (building the list), tagged as invited.
      const c = await upsertContact({ masterPlanId: a.planId, email, firstName: first || null, lastName: rest.join(" ") || null, source: "invite", tags: ["invited"] }, db);
      const { error } = await db
        .from("crm_invites")
        .upsert({ list_id: list.id, master_plan_id: a.planId, contact_id: c?.id ?? null, name: name || null, email }, { onConflict: "list_id,email", ignoreDuplicates: true });
      if (error) {
        skipped.push(email);
        continue;
      }
      added++;
      if (c) await logEvent(a.planId, c.id, "manual", `Invited to ${list.name}`, {}, db).catch(() => {});
    }
    return NextResponse.json({ added, skipped });
  }

  const id = str(b.id, 40);
  const { data: inv } = await db.from("crm_invites").select("id").eq("id", id).eq("master_plan_id", a.planId).maybeSingle();
  if (!inv) return NextResponse.json({ error: "Not found." }, { status: 404 });

  if (b.action === "sent") {
    const at = b.sent ? (str(b.at, 40) && !Number.isNaN(Date.parse(b.at)) ? new Date(b.at).toISOString() : new Date().toISOString()) : null;
    await db.from("crm_invites").update({ sent_at: at }).eq("id", id);
    return NextResponse.json({ ok: true, sent_at: at });
  }
  if (b.action === "note") {
    await db.from("crm_invites").update({ note: str(b.note, 500) || null }).eq("id", id);
    return NextResponse.json({ ok: true });
  }
  if (b.action === "remove") {
    await db.from("crm_invites").delete().eq("id", id);
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
