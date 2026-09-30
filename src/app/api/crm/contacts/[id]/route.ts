import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { logEvent, EMAIL_RE } from "@/lib/crm";
import { crmAccount } from "../../guard";

export const dynamic = "force-dynamic";

// One contact: GET → contact + timeline + email series + form submissions + tag history
// + the account's custom fields. PATCH any of { email, firstName, lastName, phone,
// company, jobTitle, website, addressLine1, addressLine2, city, region, postalCode,
// country, birthday, relationships, custom, tags } · POST { note } adds a timeline note
export async function GET(_: Request, { params }: { params: { id: string } }) {
  const a = await crmAccount();
  if ("denied" in a) return a.denied;
  const db = createServerClient();
  const { data: contact } = await db.from("seq_contacts").select("*").eq("id", params.id).eq("master_plan_id", a.planId).maybeSingle();
  if (!contact) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const [{ data: events }, { data: enrs }, { data: subs }, { data: tagHistory }, { data: customFields }] = await Promise.all([
    db.from("crm_events").select("id, kind, title, detail, created_at").eq("contact_id", contact.id).eq("master_plan_id", a.planId).order("created_at", { ascending: false }).limit(200),
    db.from("sequence_enrollments").select("id, status, start_date, sequences(name), sequence_sends(status)").eq("contact_id", contact.id),
    db.from("crm_submissions").select("id, data, created_at, crm_forms(name)").eq("contact_id", contact.id).order("created_at", { ascending: false }).limit(50),
    db.from("crm_tag_history").select("id, tag, action, source, approximate, created_at").eq("contact_id", contact.id).eq("master_plan_id", a.planId).order("created_at", { ascending: false }).limit(300),
    db.from("crm_custom_fields").select("id, key, label, type, options, position").eq("master_plan_id", a.planId).order("position").order("created_at"),
  ]);
  const series = (enrs ?? []).map((e) => ({
    id: e.id,
    status: e.status,
    start_date: e.start_date,
    name: (e.sequences as unknown as { name: string } | null)?.name ?? "",
    sent: ((e.sequence_sends as { status: string }[] | null) ?? []).filter((s) => s.status === "sent").length,
  }));
  return NextResponse.json({ contact, events: events ?? [], series, submissions: subs ?? [], tagHistory: tagHistory ?? [], customFields: customFields ?? [] });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const a = await crmAccount(request);
  if ("denied" in a) return a.denied;
  const b = await request.json().catch(() => ({}));
  const str = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : undefined);
  const db = createServerClient();
  const { data: before } = await db.from("seq_contacts").select("tags, email, custom").eq("id", params.id).eq("master_plan_id", a.planId).maybeSingle();
  if (!before) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  const TEXT: [string, string, number][] = [
    ["firstName", "first_name", 80], ["lastName", "last_name", 80], ["phone", "phone", 40], ["company", "company", 160], ["jobTitle", "job_title", 120],
    ["website", "website", 300], ["addressLine1", "address_line1", 200], ["addressLine2", "address_line2", 200], ["city", "city", 120],
    ["region", "region", 120], ["postalCode", "postal_code", 30], ["country", "country", 120],
    ["facebook", "facebook", 300], ["linkedin", "linkedin", 300], ["instagram", "instagram", 300], ["youtube", "youtube", 300],
  ];
  for (const [k, col, n] of TEXT) if (str(b[k], n) !== undefined) patch[col] = str(b[k], n) || null;
  if (b.birthday !== undefined) {
    const d = str(b.birthday, 10) || "";
    if (d && !/^\d{4}-\d{2}-\d{2}$/.test(d)) return NextResponse.json({ error: "Birthday must be a date." }, { status: 400 });
    patch.birthday = d || null;
  }
  if (b.email !== undefined) {
    const email = (str(b.email, 200) || "").toLowerCase();
    if (!EMAIL_RE.test(email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    if (email !== before.email) {
      const { data: taken } = await db.from("seq_contacts").select("id").eq("master_plan_id", a.planId).eq("email", email).maybeSingle();
      if (taken) return NextResponse.json({ error: "Another contact already has that email." }, { status: 409 });
      patch.email = email;
    }
  }
  if (Array.isArray(b.relationships)) patch.relationships = Array.from(new Set(b.relationships.map((t: unknown) => String(t).trim().slice(0, 40)).filter(Boolean))).slice(0, 20);
  if (b.custom && typeof b.custom === "object" && !Array.isArray(b.custom)) {
    // Only the account's own custom fields are kept.
    const { data: defs } = await db.from("crm_custom_fields").select("key").eq("master_plan_id", a.planId);
    const keys = new Set((defs ?? []).map((d) => d.key as string));
    const next: Record<string, string> = { ...((before.custom as Record<string, string>) ?? {}) };
    for (const [k, v] of Object.entries(b.custom as Record<string, unknown>)) {
      if (!keys.has(k)) continue;
      const val = typeof v === "string" ? v.trim().slice(0, 2000) : typeof v === "number" ? String(v) : "";
      if (val) next[k] = val;
      else delete next[k];
    }
    patch.custom = next;
  }
  if (Array.isArray(b.tags)) {
    patch.tags = Array.from(new Set(b.tags.map((t: unknown) => String(t).trim().toLowerCase().slice(0, 60)).filter(Boolean)));
    patch.tag_source = `manual:${a.userEmail ?? "you"}`;
  }
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
