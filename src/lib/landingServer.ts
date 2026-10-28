import { createServerClient } from "@/lib/supabase/server";
import { brandFor } from "@/lib/portal";
import { cleanContent, cleanPageLook, type Content, type Look, type Template } from "@/lib/landingPages";

// Server side of landing pages (task 1153): what the public page shows, and each page's numbers.

type Db = ReturnType<typeof createServerClient>;

export const PAGE_COLUMNS = "id, master_plan_id, template, slug, name, status, content, look, form_id, event_id, offer_id, calendar_id, button_url, pixel_id, image_path, published_at, created_at, updated_at";
export interface PageRow {
  id: string;
  master_plan_id: string;
  template: Template;
  slug: string;
  name: string;
  status: "draft" | "published" | "archived";
  content: unknown;
  look: unknown;
  form_id: string | null;
  event_id: string | null;
  offer_id: string | null;
  calendar_id: string | null;
  button_url: string | null;
  pixel_id: string | null;
  image_path: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface FormField { name: string; label: string; type?: string; required?: boolean; options?: string[] }
export interface PublicPage {
  id: string;
  template: Template;
  slug: string;
  content: Content;
  look: Look;
  brand: { name: string; logo: string | null };
  image: string | null;
  pixelId: string | null;
  form: { fields: FormField[]; submitLabel: string | null } | null;
  event: { kind: string; title: string; host: string; startsAt: string | null; durationMin: number; timezone: string; days: number | null; startsOn: string | null; open: boolean; note: string | null } | null;
  offer: { name: string; price: number | null; currency: string; billing: string | null; paymentCount: number | null } | null;
  buyUrl: string | null;
  booking: { slug: string; name: string; durationMin: number; paid: boolean } | null;
  missing: string | null; // what the owner still has to connect (shown only in preview)
}

export async function publicPage(db: Db, p: PageRow): Promise<PublicPage> {
  const [brand, form, ev, offer, cal] = await Promise.all([
    brandFor(db, p.master_plan_id),
    p.template === "optin" && p.form_id ? db.from("crm_forms").select("fields, submit_label, active").eq("id", p.form_id).eq("master_plan_id", p.master_plan_id).maybeSingle() : Promise.resolve({ data: null }),
    p.template === "webinar" && p.event_id ? db.from("events").select("id, kind, title, host_name, starts_at, duration_min, timezone, days, starts_on, status, capacity").eq("id", p.event_id).eq("master_plan_id", p.master_plan_id).maybeSingle() : Promise.resolve({ data: null }),
    p.template === "sales" && p.offer_id ? db.from("sales_offers").select("name, price, currency, billing, payment_count, link").eq("id", p.offer_id).eq("master_plan_id", p.master_plan_id).maybeSingle() : Promise.resolve({ data: null }),
    p.template === "booking" && p.calendar_id ? db.from("booking_calendars").select("slug, name, duration_min, active, pay_mode").eq("id", p.calendar_id).eq("master_plan_id", p.master_plan_id).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const f = form.data as { fields: FormField[]; submit_label: string | null; active: boolean } | null;
  const e = ev.data as { id: string; kind: string; title: string; host_name: string | null; starts_at: string | null; duration_min: number; timezone: string; days: number | null; starts_on: string | null; status: string; capacity: number | null } | null;
  const o = offer.data as { name: string; price: number | null; currency: string | null; billing: string | null; payment_count: number | null; link: string | null } | null;
  const c = cal.data as { slug: string; name: string; duration_min: number; active: boolean; pay_mode: string | null } | null;

  let event: PublicPage["event"] = null;
  if (e) {
    const past = e.kind === "live" && Boolean(e.starts_at) && Date.parse(e.starts_at!) + e.duration_min * 60_000 < Date.now();
    let full = false;
    if (e.capacity) {
      const { count } = await db.from("event_registrations").select("id", { count: "exact", head: true }).eq("event_id", e.id);
      full = (count ?? 0) >= e.capacity;
    }
    const note = e.status !== "published" ? "Registration isn't open yet." : past ? "This event has already happened." : full ? "This event is full." : null;
    event = { kind: e.kind, title: e.title, host: e.host_name || brand.name, startsAt: e.starts_at, durationMin: e.duration_min, timezone: e.timezone, days: e.days, startsOn: e.starts_on, open: !note, note };
  }
  const buyUrl = p.template === "sales" ? p.button_url || o?.link || null : p.button_url;
  const missing =
    p.template === "optin" && !(f && f.active) ? "Choose one of your forms (and make sure it is turned on)."
    : p.template === "webinar" && !e ? "Choose one of your Events."
    : p.template === "sales" && !buyUrl ? "Choose an offer with a payment link, or paste a Buy link."
    : p.template === "booking" && !(c && c.active) ? "Choose one of your booking pages (and make sure it is turned on)."
    : null;

  return {
    id: p.id,
    template: p.template,
    slug: p.slug,
    content: cleanContent(p.content, p.template),
    look: cleanPageLook(p.look),
    brand,
    image: p.image_path ? `/api/lp/${p.id}/image?v=${encodeURIComponent(p.image_path.slice(-20))}` : null,
    pixelId: p.pixel_id,
    form: f && f.active ? { fields: f.fields ?? [], submitLabel: f.submit_label } : null,
    event,
    offer: o ? { name: o.name, price: o.price == null ? null : Number(o.price), currency: o.currency || "usd", billing: o.billing, paymentCount: o.payment_count } : null,
    buyUrl,
    booking: c && c.active ? { slug: c.slug, name: c.name, durationMin: c.duration_min, paid: Boolean(c.pay_mode && c.pay_mode !== "none") } : null,
    missing,
  };
}

/** Visits and conversions per page: all time and the last 30 days. */
export async function pageStats(db: Db, ids: string[]): Promise<Record<string, { views: number; conversions: number; views30: number; conversions30: number }>> {
  const out: Record<string, { views: number; conversions: number; views30: number; conversions30: number }> = {};
  for (const id of ids) out[id] = { views: 0, conversions: 0, views30: 0, conversions30: 0 };
  if (!ids.length) return out;
  const since = Date.now() - 30 * 86_400_000;
  // Paged so a busy page's numbers stay right.
  for (let from = 0; ; from += 10000) {
    const { data } = await db.from("landing_page_hits").select("page_id, kind, created_at").in("page_id", ids).order("id").range(from, from + 9999);
    const rows = (data ?? []) as { page_id: string; kind: "view" | "conversion"; created_at: string }[];
    for (const r of rows) {
      const s = out[r.page_id];
      if (!s) continue;
      const recent = Date.parse(r.created_at) >= since;
      if (r.kind === "view") {
        s.views++;
        if (recent) s.views30++;
      } else {
        s.conversions++;
        if (recent) s.conversions30++;
      }
    }
    if (rows.length < 10000) break;
  }
  return out;
}

/** Count a visit or a conversion once per visitor (a visit once per visitor per 30 minutes). */
export async function recordHit(db: Db, pageId: string, kind: "view" | "conversion", visitor: string | null): Promise<boolean> {
  const v = visitor && /^[A-Za-z0-9_-]{8,64}$/.test(visitor) ? visitor : null;
  if (v) {
    let q = db.from("landing_page_hits").select("id", { count: "exact", head: true }).eq("page_id", pageId).eq("kind", kind).eq("visitor", v);
    if (kind === "view") q = q.gte("created_at", new Date(Date.now() - 30 * 60_000).toISOString());
    const { count } = await q;
    if ((count ?? 0) > 0) return false;
  }
  await db.from("landing_page_hits").insert({ page_id: pageId, kind, visitor: v });
  return true;
}
