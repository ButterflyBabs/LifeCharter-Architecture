import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crmAccount } from "../crm/guard";
import { aiClient, extractJson } from "@/lib/ai/client";
import { resolveAiConfig } from "@/lib/ai/config";
import { memberAiGate } from "@/lib/ai/memberCap";
import { brandFor } from "@/lib/portal";
import { cleanContent, cleanPageLook, cleanPixel, cleanUrl, slugify, starterContent, templateInfo, validSlug, TEMPLATES, type Template } from "@/lib/landingPages";
import { PAGE_COLUMNS, pageStats, type PageRow } from "@/lib/landingServer";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

// Landing pages (task 1153), the owner's side.
//   GET                                   -> pages with their numbers, plus the forms, events, offers and booking pages
//                                            to build on, consented testimonials, and the account's own domain
//   POST { action: "create", template, name }
//   POST { action: "save", id, name, slug, content, look, formId, eventId, offerId, calendarId, buttonUrl, pixelId }
//   POST { action: "publish" | "unpublish" | "archive" | "restore" | "delete" | "duplicate", id }
//   POST { action: "draft", id, notes }   -> the assistant's draft of the words (not saved; the owner approves it)
const str = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");
const uuid = (v: unknown) => (typeof v === "string" && /^[0-9a-f-]{36}$/i.test(v) ? v : null);

async function freeSlug(db: ReturnType<typeof createServerClient>, want: string, exceptId?: string): Promise<string> {
  const base = validSlug(want) ? want : slugify(`${want || "page"}-page`).slice(0, 50) || "page";
  for (let i = 0; i < 50; i++) {
    const s = i ? `${base}-${i + 1}` : base;
    if (!validSlug(s)) continue;
    let q = db.from("landing_pages").select("id").eq("slug", s);
    if (exceptId) q = q.neq("id", exceptId);
    const { data } = await q.maybeSingle();
    if (!data) return s;
  }
  return `${base}-${Date.now().toString(36)}`;
}

export async function GET() {
  const a = await crmAccount();
  if ("denied" in a) return a.denied;
  const db = createServerClient();
  const [{ data: pages }, { data: forms }, { data: events }, { data: offers }, { data: cals }, { data: tst }, { data: plan }] = await Promise.all([
    db.from("landing_pages").select(PAGE_COLUMNS).eq("master_plan_id", a.planId).order("updated_at", { ascending: false }),
    db.from("crm_forms").select("id, name, active").eq("master_plan_id", a.planId).order("name"),
    db.from("events").select("id, title, kind, status, starts_at").eq("master_plan_id", a.planId).neq("status", "archived").order("created_at", { ascending: false }),
    db.from("sales_offers").select("id, name, price, billing, link, status").eq("master_plan_id", a.planId).order("sort_order"),
    db.from("booking_calendars").select("id, name, slug, active").eq("master_plan_id", a.planId).order("name"),
    db.from("testimonials").select("client_name, headline, content").eq("master_plan_id", a.planId).eq("consent", true).in("status", ["approved", "featured"]).order("created_at", { ascending: false }).limit(20),
    db.from("client_master_plans").select("short_link_domain, short_link_domain_status").eq("id", a.planId).maybeSingle(),
  ]);
  const rows = (pages ?? []) as PageRow[];
  const [stats, brand] = await Promise.all([pageStats(db, rows.map((p) => p.id)), brandFor(db, a.planId)]);
  return NextResponse.json(
    {
      templates: TEMPLATES,
      brand,
      pages: rows.map((p) => ({ ...p, content: cleanContent(p.content, p.template), look: cleanPageLook(p.look), stats: stats[p.id] })),
      forms: forms ?? [],
      events: events ?? [],
      offers: offers ?? [],
      calendars: cals ?? [],
      testimonials: ((tst ?? []) as { client_name: string | null; headline: string | null; content: string | null }[]).filter((t) => (t.content || "").trim()).map((t) => ({ name: (t.client_name || "").split(" ")[0], quote: String(t.content).slice(0, 600) })),
      domain: plan?.short_link_domain_status === "verified" ? (plan.short_link_domain as string) : null,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(request: Request) {
  const a = await crmAccount(request);
  if ("denied" in a) return a.denied;
  const db = createServerClient();
  const b = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const action = String(b.action || "");

  if (action === "create") {
    const t = TEMPLATES.some((x) => x.key === b.template) ? (b.template as Template) : null;
    if (!t) return NextResponse.json({ error: "Pick a template." }, { status: 400 });
    const name = str(b.name, 100) || templateInfo(t).label;
    const slug = await freeSlug(db, slugify(name));
    const { data, error } = await db.from("landing_pages").insert({ master_plan_id: a.planId, template: t, name, slug, content: starterContent(t), look: {} }).select("id").single();
    if (error) return NextResponse.json({ error: "Couldn't create the page. Please try again." }, { status: 500 });
    return NextResponse.json({ ok: true, id: data.id });
  }

  const id = uuid(b.id);
  const { data: cur } = id ? await db.from("landing_pages").select(PAGE_COLUMNS).eq("id", id).eq("master_plan_id", a.planId).maybeSingle() : { data: null };
  const p = cur as PageRow | null;
  if (!p) return NextResponse.json({ error: "That page could not be found." }, { status: 404 });
  const now = new Date().toISOString();

  if (action === "save") {
    // Linked items must belong to this account.
    const own = async (table: string, v: unknown) => {
      const x = uuid(v);
      if (!x) return null;
      const { data } = await db.from(table).select("id").eq("id", x).eq("master_plan_id", a.planId).maybeSingle();
      return data ? x : null;
    };
    const wantSlug = slugify(str(b.slug, 80));
    if (wantSlug && wantSlug !== p.slug) {
      if (!validSlug(wantSlug)) return NextResponse.json({ error: "Use 3 to 60 letters, numbers or dashes for the web address." }, { status: 400 });
      const { data: taken } = await db.from("landing_pages").select("id").eq("slug", wantSlug).neq("id", p.id).maybeSingle();
      if (taken) return NextResponse.json({ error: "That web address is taken. Try another." }, { status: 409 });
    }
    const pixelRaw = str(b.pixelId, 30);
    const pixel = cleanPixel(pixelRaw);
    if (pixelRaw && !pixel) return NextResponse.json({ error: "A Meta pixel ID is 10 to 20 digits (find it in Meta Events Manager)." }, { status: 400 });
    const buttonRaw = str(b.buttonUrl, 500);
    const buttonUrl = cleanUrl(buttonRaw);
    if (buttonRaw && !buttonUrl) return NextResponse.json({ error: "That link doesn't look right. Paste the full address." }, { status: 400 });
    const row = {
      name: str(b.name, 100) || p.name,
      slug: wantSlug || p.slug,
      content: cleanContent(b.content, p.template),
      look: cleanPageLook(b.look),
      form_id: await own("crm_forms", b.formId),
      event_id: await own("events", b.eventId),
      offer_id: await own("sales_offers", b.offerId),
      calendar_id: await own("booking_calendars", b.calendarId),
      button_url: buttonUrl,
      pixel_id: pixel,
      updated_at: now,
    };
    const { error } = await db.from("landing_pages").update(row).eq("id", p.id);
    if (error) return NextResponse.json({ error: "Couldn't save. Please try again." }, { status: 500 });
    return NextResponse.json({ ok: true, slug: row.slug });
  }
  if (action === "publish") {
    await db.from("landing_pages").update({ status: "published", published_at: p.published_at || now, updated_at: now }).eq("id", p.id);
    return NextResponse.json({ ok: true });
  }
  if (action === "unpublish" || action === "restore") {
    await db.from("landing_pages").update({ status: "draft", updated_at: now }).eq("id", p.id);
    return NextResponse.json({ ok: true });
  }
  if (action === "archive") {
    await db.from("landing_pages").update({ status: "archived", updated_at: now }).eq("id", p.id);
    return NextResponse.json({ ok: true });
  }
  if (action === "delete") {
    if (p.status === "published") return NextResponse.json({ error: "Unpublish the page first." }, { status: 409 });
    if (p.image_path) await db.storage.from("portal-files").remove([p.image_path]).catch(() => null);
    await db.from("landing_pages").delete().eq("id", p.id);
    return NextResponse.json({ ok: true });
  }
  if (action === "duplicate") {
    const slug = await freeSlug(db, `${p.slug}-copy`);
    const { data, error } = await db
      .from("landing_pages")
      .insert({ master_plan_id: a.planId, template: p.template, name: `${p.name} (copy)`.slice(0, 100), slug, content: p.content, look: p.look, form_id: p.form_id, event_id: p.event_id, offer_id: p.offer_id, calendar_id: p.calendar_id, button_url: p.button_url, pixel_id: p.pixel_id })
      .select("id")
      .single();
    if (error) return NextResponse.json({ error: "Couldn't copy the page." }, { status: 500 });
    return NextResponse.json({ ok: true, id: data.id });
  }

  if (action === "draft") {
    const { key } = await resolveAiConfig();
    const overCap = await memberAiGate(key);
    if (overCap) return overCap;
    if (!key) return NextResponse.json({ needsKey: true, error: "Add your AI key in Settings > AI first (the same one your assistant uses), then try again." }, { status: 400 });
    const t = p.template;
    const ctx: string[] = [];
    const brand = await brandFor(db, a.planId);
    ctx.push(`Business name: ${brand.name}`);
    const offerId = uuid(b.offerId) || p.offer_id;
    const eventId = uuid(b.eventId) || p.event_id;
    const calId = uuid(b.calendarId) || p.calendar_id;
    const formId = uuid(b.formId) || p.form_id;
    if (offerId) {
      const { data: o } = await db.from("sales_offers").select("name, format, price, billing, payment_count, deliverables, transformation, ideal_client, not_for, guarantee, duration").eq("id", offerId).eq("master_plan_id", a.planId).maybeSingle();
      if (o) ctx.push(`Offer: ${JSON.stringify(o)}`);
    }
    if (eventId) {
      const { data: e } = await db.from("events").select("kind, title, subtitle, description, host_name, starts_at, duration_min, timezone, days").eq("id", eventId).eq("master_plan_id", a.planId).maybeSingle();
      if (e) ctx.push(`Event: ${JSON.stringify(e)}`);
    }
    if (calId) {
      const { data: c } = await db.from("booking_calendars").select("name, description, duration_min").eq("id", calId).eq("master_plan_id", a.planId).maybeSingle();
      if (c) ctx.push(`Booking page: ${JSON.stringify(c)}`);
    }
    if (formId) {
      const { data: f } = await db.from("crm_forms").select("name, description").eq("id", formId).eq("master_plan_id", a.planId).maybeSingle();
      if (f) ctx.push(`Sign-up form: ${JSON.stringify(f)}`);
    }
    const notes = str(b.notes, 3000);
    if (notes) ctx.push(`The owner's notes for this page: ${notes}`);
    const info = templateInfo(t);
    const fields =
      t === "sales"
        ? `"eyebrow","headline","subheadline","body" (3 to 6 short paragraphs separated by blank lines: the problem, what changes, how it works),"bulletsTitle","bullets" (4 to 8 items),"cta","aboutTitle","about","faq" (3 to 6 {"q","a"}),"priceNote" (only if a price is given),"guarantee" (only if the offer gives one),"closing"`
        : `"eyebrow","headline","subheadline","body" (optional, 1 to 2 short paragraphs),"bulletsTitle","bullets" (3 to 5 items),"cta","aboutTitle","about"${t === "optin" || t === "webinar" ? `,"thankYou"` : ""}`;
    const system = `You write landing pages for a small business owner, in their own voice: warm, plain, specific, short sentences, no hype, no jargon, no exclamation marks except at most one. This is a ${info.label} page; its job is ${info.conversion}. Write in the first person as the owner. Use ONLY facts given. Never invent results, numbers, client names, testimonials, credentials, prices, dates or guarantees. If something is unknown, leave that field as an empty string rather than guessing. Reply with JSON only, with these keys: ${fields}.`;
    try {
      const ai = aiClient(key, { timeout: 100000 });
      const completion = await ai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "system", content: system }, { role: "user", content: ctx.join("\n") }],
        max_tokens: 2500,
        temperature: 0.6,
        response_format: { type: "json_object" },
      });
      const raw = completion.choices[0]?.message?.content?.trim() || "{}";
      let parsed: Record<string, unknown> = {};
      try {
        parsed = JSON.parse(extractJson(raw));
      } catch {
        parsed = {};
      }
      // Keep what the owner already has for anything the draft didn't write (and never take testimonials from it).
      const have = cleanContent(p.content, t);
      const drafted = cleanContent({ ...have, ...Object.fromEntries(Object.entries(parsed).filter(([k, v]) => k !== "testimonials" && (typeof v === "string" ? v.trim() : Array.isArray(v) ? v.length : false))) }, t);
      drafted.testimonials = have.testimonials;
      return NextResponse.json({ ok: true, draft: drafted });
    } catch (e) {
      console.error("landing draft:", e);
      return NextResponse.json({ error: "The assistant couldn't write a draft just now. Try again in a minute." }, { status: 502 });
    }
  }
  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
