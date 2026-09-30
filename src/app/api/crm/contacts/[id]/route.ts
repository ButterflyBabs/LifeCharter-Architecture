import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { logEvent, EMAIL_RE } from "@/lib/crm";
import { crmAccount } from "../../guard";

export const dynamic = "force-dynamic";

// One contact: GET → contact + timeline + email series + form submissions + tag history
// + the account's custom fields. PATCH any of { email, firstName, lastName, phone,
// company, jobTitle, website, addressLine1, addressLine2, city, region, postalCode,
// country, birthday, relationships, custom, tags } · POST { note } adds a timeline note,
// POST { record: { kind: attended|purchase, title, occurredOn, amount?, offerId?, note? } }
// logs a call attended or a purchase by hand, POST { deleteRecord: id } removes one.
// GET also returns `attended` and `purchases`: everything the Suite knows, newest first.
export async function GET(_: Request, { params }: { params: { id: string } }) {
  const a = await crmAccount();
  if ("denied" in a) return a.denied;
  const db = createServerClient();
  const { data: contact } = await db.from("seq_contacts").select("*").eq("id", params.id).eq("master_plan_id", a.planId).maybeSingle();
  if (!contact) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const [{ data: events }, { data: enrs }, { data: subs }, { data: tagHistory }, { data: customFields }, { data: pipelineCards }] = await Promise.all([
    db.from("crm_events").select("id, kind, title, detail, created_at").eq("contact_id", contact.id).eq("master_plan_id", a.planId).order("created_at", { ascending: false }).limit(200),
    db.from("sequence_enrollments").select("id, status, start_date, sequences(name), sequence_sends(status)").eq("contact_id", contact.id),
    db.from("crm_submissions").select("id, data, created_at, crm_forms(name)").eq("contact_id", contact.id).order("created_at", { ascending: false }).limit(50),
    db.from("crm_tag_history").select("id, tag, action, source, approximate, created_at").eq("contact_id", contact.id).eq("master_plan_id", a.planId).order("created_at", { ascending: false }).limit(300),
    db.from("crm_custom_fields").select("id, key, label, type, options, position").eq("master_plan_id", a.planId).order("position").order("created_at"),
    db.from("dm_cards").select("id, follow_up_on, stage_changed_at, pipeline_boards(name), dm_stages(name)").eq("contact_id", contact.id).eq("master_plan_id", a.planId),
  ]);
  const pipelines = (pipelineCards ?? []).map((p) => ({
    id: p.id,
    board: (p.pipeline_boards as unknown as { name: string } | null)?.name ?? "",
    stage: (p.dm_stages as unknown as { name: string } | null)?.name ?? "",
    followUpOn: p.follow_up_on,
    since: p.stage_changed_at,
  }));
  const series = (enrs ?? []).map((e) => ({
    id: e.id,
    status: e.status,
    start_date: e.start_date,
    name: (e.sequences as unknown as { name: string } | null)?.name ?? "",
    sent: ((e.sequence_sends as { status: string }[] | null) ?? []).filter((s) => s.status === "sent").length,
  }));
  const { attended, purchases } = await history(db, a.planId, a.house, contact as { id: string; email: string }, (events ?? []) as { id: string; kind: string; title: string; detail: Record<string, unknown>; created_at: string }[]);
  return NextResponse.json({ contact, events: events ?? [], series, submissions: subs ?? [], tagHistory: tagHistory ?? [], customFields: customFields ?? [], pipelines, attended, purchases });
}

type Item = { id: string; title: string; date: string; detail?: string | null; amount?: number | null; source: string; recordId?: string };

// Calls they attended and what they bought, from every place the Suite records it,
// plus anything logged by hand. Dates are YYYY-MM-DD; newest first.
async function history(db: ReturnType<typeof createServerClient>, planId: string, house: boolean, contact: { id: string; email: string }, events: { id: string; kind: string; title: string; detail: Record<string, unknown>; created_at: string }[]) {
  const email = (contact.email || "").toLowerCase();
  const [{ data: bookings }, { data: records }, { data: deals }, mc, orders] = await Promise.all([
    db.from("bookings").select("id, start_at, status, booking_calendars(name)").eq("master_plan_id", planId).eq("status", "completed").or(`contact_id.eq.${contact.id},invitee_email.eq.${email}`).order("start_at", { ascending: false }).limit(200),
    db.from("contact_records").select("id, kind, title, occurred_on, amount, note, sales_offers(name)").eq("contact_id", contact.id).eq("master_plan_id", planId).order("occurred_on", { ascending: false }),
    email ? db.from("pipeline_deals").select("id, contact_name, value, closed_at, stage_changed_at, pipeline_stages!inner(kind), sales_offers(name)").eq("master_plan_id", planId).ilike("email", email).eq("pipeline_stages.kind", "won") : Promise.resolve({ data: [] }),
    // Babs's MasterClass attendance comes from the Zoom reports.
    house && email ? db.from("masterclass_attendance").select("session_date, minutes").ilike("email", email).order("session_date", { ascending: false }) : Promise.resolve({ data: [] }),
    house && email ? db.from("website_build_orders").select("stripe_checkout_session_id, amount_total_cents, payment_plan, created_at").ilike("email", email) : Promise.resolve({ data: [] }),
  ]);
  const attended: Item[] = [
    ...(bookings ?? []).map((b) => ({ id: `b-${b.id}`, title: (b.booking_calendars as unknown as { name: string } | null)?.name ?? "Booked call", date: (b.start_at as string).slice(0, 10), source: "booking" })),
    ...((mc as { data: { session_date: string; minutes: number | null }[] | null }).data ?? []).map((m) => ({ id: `mc-${m.session_date}`, title: "MasterClass", date: m.session_date, detail: m.minutes ? `${m.minutes} min` : null, source: "zoom" })),
    ...(records ?? []).filter((r) => r.kind === "attended").map((r) => ({ id: `r-${r.id}`, recordId: r.id as string, title: r.title as string, date: r.occurred_on as string, detail: (r.note as string) ?? null, source: "manual" })),
  ].sort((x, y) => y.date.localeCompare(x.date));
  const purchases: Item[] = [
    ...events.filter((e) => e.kind === "purchase").map((e) => ({ id: `e-${e.id}`, title: e.title.replace(/^Bought\s+/i, "").replace(/^Purchased\s+/i, ""), date: e.created_at.slice(0, 10), source: "purchase" })),
    ...((orders as { data: { stripe_checkout_session_id: string; amount_total_cents: number | null; payment_plan: string | null; created_at: string }[] | null }).data ?? []).map((o) => ({ id: `wb-${o.stripe_checkout_session_id}`, title: "Website Build", date: o.created_at.slice(0, 10), amount: o.amount_total_cents != null ? o.amount_total_cents / 100 : null, detail: o.payment_plan, source: "stripe" })),
    ...((deals ?? []) as unknown as Record<string, unknown>[]).map((d) => ({ id: `d-${d.id}`, title: (d.sales_offers as { name: string } | null)?.name ?? "Won deal", date: (((d.closed_at as string) || (d.stage_changed_at as string)) ?? "").slice(0, 10), amount: d.value != null ? Number(d.value) : null, detail: "Won in Pipeline", source: "deal" })),
    ...(records ?? []).filter((r) => r.kind === "purchase").map((r) => ({ id: `r-${r.id}`, recordId: r.id as string, title: (r.title as string) || ((r.sales_offers as unknown as { name: string } | null)?.name ?? "Purchase"), date: r.occurred_on as string, amount: r.amount != null ? Number(r.amount) : null, detail: (r.note as string) ?? null, source: "manual" })),
  ].sort((x, y) => y.date.localeCompare(x.date));
  return { attended, purchases };
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
  const db = createServerClient();
  if (b.record || b.deleteRecord) {
    const { data: c } = await db.from("seq_contacts").select("id").eq("id", params.id).eq("master_plan_id", a.planId).maybeSingle();
    if (!c) return NextResponse.json({ error: "Not found." }, { status: 404 });
    if (b.deleteRecord) {
      await db.from("contact_records").delete().eq("id", String(b.deleteRecord)).eq("contact_id", c.id).eq("master_plan_id", a.planId);
      return NextResponse.json({ ok: true });
    }
    const r = b.record as Record<string, unknown>;
    const kind = r.kind === "purchase" ? "purchase" : r.kind === "attended" ? "attended" : null;
    let offerId = typeof r.offerId === "string" && r.offerId ? r.offerId : null;
    if (offerId) {
      const { data: o } = await db.from("sales_offers").select("id, name").eq("id", offerId).eq("master_plan_id", a.planId).maybeSingle();
      offerId = (o?.id as string) ?? null;
      if (!r.title && o) r.title = o.name;
    }
    const title = typeof r.title === "string" ? r.title.trim().slice(0, 200) : "";
    const day = typeof r.occurredOn === "string" && /^\d{4}-\d{2}-\d{2}$/.test(r.occurredOn) ? r.occurredOn : new Date().toISOString().slice(0, 10);
    const amount = r.amount === "" || r.amount == null ? null : Number(r.amount);
    if (!kind || !title) return NextResponse.json({ error: kind === "purchase" ? "Say what they bought." : "Name the call." }, { status: 400 });
    if (amount != null && !Number.isFinite(amount)) return NextResponse.json({ error: "Enter a valid amount." }, { status: 400 });
    await db.from("contact_records").insert({ master_plan_id: a.planId, contact_id: c.id, kind, title, occurred_on: day, amount, offer_id: offerId, note: typeof r.note === "string" ? r.note.trim().slice(0, 500) || null : null });
    await logEvent(a.planId, c.id as string, "manual", kind === "purchase" ? `Logged a purchase: ${title}` : `Logged attendance: ${title}`, { logged: true, on: day }, db).catch(() => {});
    return NextResponse.json({ ok: true });
  }
  const note = typeof b.note === "string" ? b.note.trim().slice(0, 4000) : "";
  if (!note) return NextResponse.json({ error: "Write a note first." }, { status: 400 });
  const { data: c } = await createServerClient().from("seq_contacts").select("id").eq("id", params.id).eq("master_plan_id", a.planId).maybeSingle();
  if (!c) return NextResponse.json({ error: "Not found." }, { status: 404 });
  await logEvent(a.planId, params.id, "note", note);
  return NextResponse.json({ ok: true });
}
