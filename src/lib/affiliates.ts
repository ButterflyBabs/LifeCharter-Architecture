import type { SupabaseClient } from "@supabase/supabase-js";
import { logEvent } from "@/lib/crm";

// Affiliates: people promoting an account's offers. Each has a tracked link
// (lccommandsuite.com/r/<code>) that counts clicks and remembers the visitor for
// 60 days (cookie AFF_COOKIE); a sign-up on that account's Suite forms or a booking
// is then credited to them, and so are later purchases by that person. Commission %
// comes from the relationship (this affiliate on this offer), else the offer's own %,
// else the affiliate's default %.

export const AFF_COOKIE = "lc_aff";
export const AFF_COOKIE_DAYS = 60;

type Db = SupabaseClient;

export const slugCode = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 24).replace(/-$/, "");

// A code no other affiliate (in any account) uses yet.
export async function uniqueCode(db: Db, wanted: string): Promise<string> {
  const base = slugCode(wanted) || "partner";
  for (let i = 0; i < 50; i++) {
    const code = i === 0 ? base : `${base}-${i + 1}`;
    const { data } = await db.from("affiliates").select("id").eq("code", code).maybeSingle();
    if (!data) return code;
  }
  return `${base}-${Math.random().toString(36).slice(2, 7)}`;
}

export async function rateFor(db: Db, affiliateId: string, offerId: string | null): Promise<number | null> {
  if (offerId) {
    const { data: rel } = await db.from("affiliate_offer_rates").select("rate").eq("affiliate_id", affiliateId).eq("offer_id", offerId).maybeSingle();
    if (rel?.rate != null) return Number(rel.rate);
    const { data: offer } = await db.from("sales_offers").select("affiliate_rate").eq("id", offerId).maybeSingle();
    if (offer?.affiliate_rate != null) return Number(offer.affiliate_rate);
  }
  const { data: aff } = await db.from("affiliates").select("default_rate").eq("id", affiliateId).maybeSingle();
  return aff?.default_rate != null ? Number(aff.default_rate) : null;
}

const money = (n: number) => Math.round(n * 100) / 100;

// The affiliate a visitor came through (cookie or a ?ref / _ref code), if it belongs to this account and is active.
export async function affiliateByCode(db: Db, planId: string, code: string | null | undefined) {
  const c = slugCode(code || "");
  if (!c) return null;
  const { data } = await db.from("affiliates").select("id, name, code").eq("code", c).eq("master_plan_id", planId).eq("status", "active").maybeSingle();
  return data as { id: string; name: string; code: string } | null;
}

// Credits a lead or booking to an affiliate: logged once per person and kind; the person's
// first affiliate becomes their "referred by" (so later purchases are credited too).
export async function recordReferral(db: Db, planId: string, affiliate: { id: string; name: string; code: string }, contactId: string, kind: "lead" | "booking" | "manual", source: string) {
  const { data: dup } = await db.from("affiliate_referrals").select("id").eq("affiliate_id", affiliate.id).eq("contact_id", contactId).eq("kind", kind).maybeSingle();
  if (!dup) await db.from("affiliate_referrals").insert({ affiliate_id: affiliate.id, master_plan_id: planId, contact_id: contactId, kind, source });
  const { data: c } = await db.from("seq_contacts").select("referred_by_affiliate_id, tags").eq("id", contactId).eq("master_plan_id", planId).maybeSingle();
  if (c && !c.referred_by_affiliate_id) {
    const tags = Array.from(new Set([...((c.tags as string[]) ?? []), `referred-by-${affiliate.code}`]));
    await db.from("seq_contacts").update({ referred_by_affiliate_id: affiliate.id, tags, tag_source: "affiliate" }).eq("id", contactId).eq("master_plan_id", planId);
    await logEvent(planId, contactId, "manual", `Referred by affiliate ${affiliate.name}`, { affiliate: affiliate.code }, db as never).catch(() => {});
  }
}

// A sale to credit: to the given affiliate code, else to whoever referred this contact.
// The offer is matched by id, or by name when only a description is known.
export async function creditSale(
  db: Db,
  planId: string,
  input: { contactId: string | null; affiliateCode?: string | null; description: string; amount: number; offerId?: string | null; saleDate?: string; stripeRef?: string | null; source?: string }
) {
  let affiliateId: string | null = null;
  if (input.affiliateCode) affiliateId = (await affiliateByCode(db, planId, input.affiliateCode))?.id ?? null;
  if (!affiliateId && input.contactId) {
    const { data: c } = await db.from("seq_contacts").select("referred_by_affiliate_id").eq("id", input.contactId).eq("master_plan_id", planId).maybeSingle();
    affiliateId = (c?.referred_by_affiliate_id as string) ?? null;
  }
  if (!affiliateId) return null;
  if (input.stripeRef) {
    const { data: dup } = await db.from("affiliate_sales").select("id").eq("stripe_ref", input.stripeRef).maybeSingle();
    if (dup) return dup;
  }
  let offerId = input.offerId ?? null;
  if (!offerId) {
    const { data: offers } = await db.from("sales_offers").select("id, name").eq("master_plan_id", planId);
    const d = input.description.toLowerCase();
    offerId = ((offers ?? []) as { id: string; name: string }[]).find((o) => d.includes(o.name.toLowerCase()))?.id ?? null;
  }
  const rate = await rateFor(db, affiliateId, offerId);
  const { data } = await db
    .from("affiliate_sales")
    .insert({
      affiliate_id: affiliateId,
      master_plan_id: planId,
      contact_id: input.contactId,
      offer_id: offerId,
      description: input.description.slice(0, 300),
      amount: money(input.amount),
      rate,
      commission: rate != null ? money((input.amount * rate) / 100) : 0,
      sale_date: input.saleDate ?? new Date().toISOString().slice(0, 10),
      // Automatic sales with no rate yet wait for a quick review.
      status: rate == null ? "review" : "owed",
      source: input.source ?? "manual",
      stripe_ref: input.stripeRef ?? null,
    })
    .select("id")
    .single();
  return data;
}

// One affiliate's month (YYYY-MM, in UTC calendar days): clicks, who they referred,
// sales by product, commissions owed/paid, and lifetime totals. Used by the owner's
// view, the affiliate's private link and their in-app partnership view.
export type AffiliateReport = {
  month: string;
  affiliate: { name: string; code: string; status: string };
  clicks: number;
  referrals: { firstName: string; kind: string; date: string }[];
  sales: { date: string; description: string; amount: number; rate: number | null; commission: number; status: string }[];
  byProduct: { product: string; sales: number; amount: number; commission: number }[];
  month_totals: { revenue: number; commission: number; owed: number; paid: number; pending: number };
  lifetime: { clicks: number; referrals: number; revenue: number; commissionPaid: number; commissionOwed: number };
};

export async function affiliateReport(db: Db, affiliateId: string, month: string): Promise<AffiliateReport | null> {
  const { data: aff } = await db.from("affiliates").select("id, name, code, status").eq("id", affiliateId).maybeSingle();
  if (!aff) return null;
  const m = /^\d{4}-\d{2}$/.test(month) ? month : new Date().toISOString().slice(0, 7);
  const [y, mo] = m.split("-").map(Number);
  const from = new Date(Date.UTC(y, mo - 1, 1));
  const to = new Date(Date.UTC(y, mo, 1));
  const [{ count: clicks }, { data: refs }, { data: sales }, { count: lifeClicks }, { count: lifeRefs }, { data: lifeSales }] = await Promise.all([
    db.from("affiliate_clicks").select("id", { count: "exact", head: true }).eq("affiliate_id", affiliateId).gte("created_at", from.toISOString()).lt("created_at", to.toISOString()),
    db.from("affiliate_referrals").select("kind, created_at, seq_contacts(first_name)").eq("affiliate_id", affiliateId).gte("created_at", from.toISOString()).lt("created_at", to.toISOString()).order("created_at"),
    db.from("affiliate_sales").select("description, amount, rate, commission, status, sale_date, sales_offers(name)").eq("affiliate_id", affiliateId).neq("status", "void").gte("sale_date", from.toISOString().slice(0, 10)).lt("sale_date", to.toISOString().slice(0, 10)).order("sale_date"),
    db.from("affiliate_clicks").select("id", { count: "exact", head: true }).eq("affiliate_id", affiliateId),
    db.from("affiliate_referrals").select("id", { count: "exact", head: true }).eq("affiliate_id", affiliateId),
    db.from("affiliate_sales").select("amount, commission, status").eq("affiliate_id", affiliateId).neq("status", "void"),
  ]);
  const rows = (sales ?? []).map((s) => ({
    date: s.sale_date as string,
    description: s.description as string,
    product: ((s.sales_offers as unknown as { name: string } | null)?.name as string) || (s.description as string),
    amount: Number(s.amount),
    rate: s.rate == null ? null : Number(s.rate),
    commission: Number(s.commission),
    status: s.status as string,
  }));
  const byProduct = new Map<string, { product: string; sales: number; amount: number; commission: number }>();
  for (const r of rows) {
    const cur = byProduct.get(r.product) ?? { product: r.product, sales: 0, amount: 0, commission: 0 };
    cur.sales++;
    cur.amount = money(cur.amount + r.amount);
    cur.commission = money(cur.commission + r.commission);
    byProduct.set(r.product, cur);
  }
  const sum = (xs: { commission: number }[]) => money(xs.reduce((t, x) => t + x.commission, 0));
  const life = (lifeSales ?? []).map((s) => ({ amount: Number(s.amount), commission: Number(s.commission), status: s.status as string }));
  return {
    month: m,
    affiliate: { name: aff.name as string, code: aff.code as string, status: aff.status as string },
    clicks: clicks ?? 0,
    referrals: (refs ?? []).map((r) => ({ firstName: (r.seq_contacts as unknown as { first_name: string | null } | null)?.first_name || "Someone", kind: r.kind as string, date: (r.created_at as string).slice(0, 10) })),
    sales: rows.map((r) => ({ date: r.date, description: r.description, amount: r.amount, rate: r.rate, commission: r.commission, status: r.status })),
    byProduct: Array.from(byProduct.values()).sort((a, b) => b.amount - a.amount),
    month_totals: {
      revenue: money(rows.reduce((t, r) => t + r.amount, 0)),
      commission: sum(rows),
      owed: sum(rows.filter((r) => r.status === "owed")),
      paid: sum(rows.filter((r) => r.status === "paid")),
      pending: rows.filter((r) => r.status === "review").length,
    },
    lifetime: {
      clicks: lifeClicks ?? 0,
      referrals: lifeRefs ?? 0,
      revenue: money(life.reduce((t, r) => t + r.amount, 0)),
      commissionPaid: sum(life.filter((r) => r.status === "paid")),
      commissionOwed: sum(life.filter((r) => r.status === "owed")),
    },
  };
}

// The report as a spreadsheet (CSV), for download.
export function reportCsv(r: AffiliateReport): string {
  const q = (v: unknown) => {
    const s = String(v ?? "");
    const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
    return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
  };
  const lines: unknown[][] = [
    [`${r.affiliate.name} · affiliate report · ${r.month}`],
    [],
    ["Clicks this month", r.clicks],
    ["People referred this month", r.referrals.length],
    ["Sales this month", r.sales.length],
    ["Revenue this month", r.month_totals.revenue],
    ["Commission this month", r.month_totals.commission],
    ["Owed", r.month_totals.owed],
    ["Paid", r.month_totals.paid],
    [],
    ["By product", "Sales", "Revenue", "Commission"],
    ...r.byProduct.map((p) => [p.product, p.sales, p.amount, p.commission]),
    [],
    ["Date", "Sale", "Amount", "Rate %", "Commission", "Status"],
    ...r.sales.map((s) => [s.date, s.description, s.amount, s.rate ?? "", s.commission, s.status === "review" ? "pending" : s.status]),
    [],
    ["Date", "Referred", "How"],
    ...r.referrals.map((x) => [x.date, x.firstName, x.kind === "booking" ? "booked a call" : x.kind === "manual" ? "credited" : "signed up"]),
    [],
    ["Lifetime clicks", r.lifetime.clicks],
    ["Lifetime referred", r.lifetime.referrals],
    ["Lifetime revenue", r.lifetime.revenue],
    ["Lifetime commission paid", r.lifetime.commissionPaid],
    ["Commission owed now", r.lifetime.commissionOwed],
  ];
  return "﻿" + lines.map((l) => l.map(q).join(",")).join("\n");
}
