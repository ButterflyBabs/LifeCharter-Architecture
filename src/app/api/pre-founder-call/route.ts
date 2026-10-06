import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { logEvent } from "@/lib/crm";
import { crmAccount } from "../crm/guard";
import { CUSTOM_FIELD_DEFS, INTERESTS, NOTE_FIELDS, PF_CALENDAR_SLUG } from "@/lib/preFounderCall";

export const dynamic = "force-dynamic";

// The Pre-Founder 1:1 call guide (Babs only; it reads and writes her own contacts).
//   GET  → Pre-Founder Inquiry Call bookings from two days ago on, to start a call from
//   POST → save the call to the contact's card: a timeline note with every answer, the
//          Pre-Founder custom fields, tags, any detail they gave, the call logged as attended
//          (the booking is marked completed when there is one), and the price correction.
const str = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");

export async function GET() {
  const a = await crmAccount();
  if ("denied" in a) return a.denied;
  if (!a.isArchitect) return NextResponse.json({ error: "This page is private." }, { status: 403 });
  const db = createServerClient();
  const { data: cal } = await db.from("booking_calendars").select("id").eq("master_plan_id", a.planId).eq("slug", PF_CALENDAR_SLUG).maybeSingle();
  if (!cal) return NextResponse.json({ bookings: [] });
  const since = new Date(Date.now() - 2 * 86_400_000).toISOString();
  const { data: rows } = await db
    .from("bookings")
    .select("id, contact_id, start_at, status, invitee_name, invitee_email")
    .eq("master_plan_id", a.planId)
    .eq("calendar_id", cal.id)
    .in("status", ["confirmed", "completed"])
    .gte("start_at", since)
    .order("start_at", { ascending: true })
    .limit(40);
  const list = (rows ?? []) as { id: string; contact_id: string | null; start_at: string; status: string; invitee_name: string; invitee_email: string }[];
  const byEmail = new Map<string, string>();
  const emails = list.filter((b) => !b.contact_id).map((b) => (b.invitee_email || "").toLowerCase());
  if (emails.length) {
    const { data: cs } = await db.from("seq_contacts").select("id, email").eq("master_plan_id", a.planId).in("email", emails);
    for (const c of cs ?? []) byEmail.set((c.email as string).toLowerCase(), c.id as string);
  }
  return NextResponse.json({
    bookings: list.map((b) => ({ id: b.id, contactId: b.contact_id || byEmail.get((b.invitee_email || "").toLowerCase()) || null, name: b.invitee_name, email: b.invitee_email, startAt: b.start_at, status: b.status })),
  });
}

export async function POST(request: Request) {
  const a = await crmAccount(request);
  if ("denied" in a) return a.denied;
  if (!a.isArchitect) return NextResponse.json({ error: "This page is private." }, { status: 403 });
  const b = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const db = createServerClient();

  const { data: contact } = await db.from("seq_contacts").select("id, email, tags, custom, company, job_title, phone, website, first_name, last_name").eq("id", String(b.contactId || "")).eq("master_plan_id", a.planId).maybeSingle();
  if (!contact) return NextResponse.json({ error: "Pick a contact first." }, { status: 404 });
  const interest = INTERESTS.find((i) => i.key === b.interest);
  if (!interest) return NextResponse.json({ error: "Choose where they landed: in, thinking, not now or not a fit." }, { status: 400 });

  const notes = (b.notes && typeof b.notes === "object" ? b.notes : {}) as Record<string, unknown>;
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Denver" }).format(new Date());
  const name = [contact.first_name, contact.last_name].filter(Boolean).join(" ") || (contact.email as string);

  // 1. The note on their timeline: a headline plus every answer as a labelled line.
  const data: Record<string, string> = { outcome: interest.label };
  for (const f of NOTE_FIELDS) {
    const v = str(notes[f.key], 2000);
    if (v) data[f.label] = v;
  }
  const flags: string[] = [];
  if (b.priceCorrected) {
    flags.push("price corrected to $497/mo");
    data["Price"] = "Corrected the $397 mentioned at the Sneak Peek: $497/mo, locked for life of their account after six free months.";
  }
  if (b.affiliate) flags.push("interested in the affiliate program");
  const wantsReview = b.websiteReview === true;
  const build = b.websiteBuild === "link-sent" ? "link-sent" : b.websiteBuild === "interested" ? "interested" : "";
  if (wantsReview) {
    flags.push("wants the Website Alignment Review");
    data["Website Alignment Review"] = "Wants the free Website Alignment Review.";
  }
  if (build) {
    flags.push(build === "link-sent" ? "Website Build checkout sent" : "interested in the Website Build");
    data["Website Build"] = build === "link-sent" ? "Website Build checkout link was made on the call ($1,997 founding rate)." : "Interested in the Website Build ($1,997 founding rate); no link sent yet.";
  }
  await logEvent(a.planId, contact.id as string, "note", `Pre-Founder 1:1 call · ${interest.label}${flags.length ? ` · ${flags.join(" · ")}` : ""}`, { data, call: "pre-founder" }, db);

  // 2. Custom fields: make sure the account has them, then fill this contact's.
  const { data: defs } = await db.from("crm_custom_fields").select("key, position").eq("master_plan_id", a.planId);
  const have = new Set((defs ?? []).map((d) => d.key as string));
  let pos = Math.max(0, ...((defs ?? []).map((d) => Number(d.position) || 0))) + 1;
  const missing = CUSTOM_FIELD_DEFS.filter((d) => !have.has(d.key)).map((d) => ({ master_plan_id: a.planId, key: d.key, label: d.label, type: d.type, options: d.options ?? [], position: pos++ }));
  if (missing.length) await db.from("crm_custom_fields").insert(missing);
  const custom: Record<string, string> = { ...((contact.custom as Record<string, string>) ?? {}) };
  custom.pf_call_date = today;
  custom.pf_interest = interest.label;
  custom.pf_login_status = custom.pf_login_status === "Issued" ? "Issued" : interest.login;
  for (const f of NOTE_FIELDS) {
    if (!f.custom) continue;
    const v = str(notes[f.key], 2000);
    if (v) custom[f.custom] = v;
  }

  // 3. Tags (added, never removed) and anything they told us about themselves.
  const tags = new Set<string>(((contact.tags as string[]) ?? []).map((t) => t.toLowerCase()));
  for (const i of INTERESTS) tags.delete(i.tag); // the latest outcome replaces an earlier one
  tags.add("pre-founder-call-done");
  tags.add(interest.tag);
  if (interest.key === "ready") tags.add("pre-founder-needs-login");
  if (b.affiliate) tags.add("affiliate-interest");
  if (b.priceCorrected) tags.add("price-corrected-497");
  if (wantsReview) tags.add("website-review-requested");
  if (build) tags.add(build === "link-sent" ? "website-build-checkout-sent" : "website-build-interest");
  const about = (b.about && typeof b.about === "object" ? b.about : {}) as Record<string, unknown>;
  const patch: Record<string, unknown> = { custom, tags: Array.from(tags), tag_source: "pre-founder-call", updated_at: new Date().toISOString() };
  for (const [k, col, n] of [["company", "company", 160], ["jobTitle", "job_title", 120], ["phone", "phone", 40], ["website", "website", 300]] as const) {
    const v = str(about[k], n);
    if (v && v !== (contact[col] as string | null)) patch[col] = v;
  }
  const { error } = await db.from("seq_contacts").update(patch).eq("id", contact.id as string).eq("master_plan_id", a.planId);
  if (error) return NextResponse.json({ error: "The note saved, but the contact card couldn't be updated. Try Save again." }, { status: 500 });

  // 4. The call counts as attended: complete the booking if there is one, else log it by hand.
  let bookingCompleted = false;
  const email = ((contact.email as string) || "").toLowerCase();
  const { data: cal } = await db.from("booking_calendars").select("id").eq("master_plan_id", a.planId).eq("slug", PF_CALENDAR_SLUG).maybeSingle();
  if (cal) {
    const from = new Date(Date.now() - 36 * 3_600_000).toISOString();
    const to = new Date(Date.now() + 36 * 3_600_000).toISOString();
    const { data: bk } = await db.from("bookings").select("id").eq("master_plan_id", a.planId).eq("calendar_id", cal.id).eq("status", "confirmed").gte("start_at", from).lte("start_at", to).or(`contact_id.eq.${contact.id},invitee_email.eq.${email}`).limit(1);
    if (bk?.[0]) {
      await db.from("bookings").update({ status: "completed" }).eq("id", bk[0].id);
      bookingCompleted = true;
    }
  }
  if (!bookingCompleted) {
    const { data: dup } = await db.from("contact_records").select("id").eq("contact_id", contact.id as string).eq("kind", "attended").eq("title", "Pre-Founder 1:1 call").eq("occurred_on", today).maybeSingle();
    if (!dup) await db.from("contact_records").insert({ master_plan_id: a.planId, contact_id: contact.id, kind: "attended", title: "Pre-Founder 1:1 call", occurred_on: today, note: interest.label });
  }

  return NextResponse.json({ ok: true, name, interest: interest.label, tags: Array.from(tags), bookingCompleted });
}
