import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";
import { logEvent } from "@/lib/crm";
import { IMPLEMENTATION_PRICE_IDS, creditBasis, mergeNote, refundDecision, uniqueRefs, type RefundInfo } from "@/lib/affiliateRules";

// Affiliates: people promoting an account's offers. Each has a tracked link
// (lccommandsuite.com/r/<code>) that counts clicks and remembers the visitor for
// 365 days (cookie AFF_COOKIE); a sign-up on that account's Suite forms or a booking
// is then credited to them, and so are later purchases by that person. Commission %
// comes from the relationship (this affiliate on this offer), else the offer's own %,
// else the affiliate's default %.

export const AFF_COOKIE = "lc_aff";
export const AFF_COOKIE_DAYS = 365;

type Db = SupabaseClient;

export const slugCode = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 24).replace(/-$/, "");

// A code no other affiliate or product link (in any account) uses yet.
export async function uniqueCode(db: Db, wanted: string): Promise<string> {
  const base = slugCode(wanted) || "partner";
  for (let i = 0; i < 50; i++) {
    const code = i === 0 ? base : `${base}-${i + 1}`;
    const [{ data }, { data: link }] = await Promise.all([db.from("affiliates").select("id").eq("code", code).maybeSingle(), db.from("affiliate_links").select("id").eq("code", code).maybeSingle()]);
    if (!data && !link) return code;
  }
  return `${base}-${Math.random().toString(36).slice(2, 7)}`;
}

export async function rateFor(db: Db, affiliateId: string, offerId: string | null, linkId: string | null = null): Promise<number | null> {
  if (offerId) {
    const { data: rel } = await db.from("affiliate_offer_rates").select("rate").eq("affiliate_id", affiliateId).eq("offer_id", offerId).maybeSingle();
    if (rel?.rate != null) return Number(rel.rate);
    const { data: offer } = await db.from("sales_offers").select("affiliate_rate").eq("id", offerId).maybeSingle();
    if (offer?.affiliate_rate != null) return Number(offer.affiliate_rate);
  }
  if (linkId) {
    const { data: link } = await db.from("affiliate_links").select("rate").eq("id", linkId).maybeSingle();
    if (link?.rate != null) return Number(link.rate);
  }
  const { data: aff } = await db.from("affiliates").select("default_rate").eq("id", affiliateId).maybeSingle();
  return aff?.default_rate != null ? Number(aff.default_rate) : null;
}

const money = (n: number) => Math.round(n * 100) / 100;

// What the customer actually paid toward the implementation fee on a Checkout Session (after any discount),
// in dollars, or null when the session has no implementation line.
export async function implementationAmount(stripe: Stripe, sessionId: string): Promise<number | null> {
  const items = await stripe.checkout.sessions.listLineItems(sessionId, { limit: 20, expand: ["data.price.product"] });
  let cents = 0;
  let found = false;
  for (const li of items.data) {
    const prod = li.price?.product;
    const name = `${li.description ?? ""} ${typeof prod === "object" && prod && "name" in prod ? (prod as Stripe.Product).name : ""}`;
    if ((li.price?.id && IMPLEMENTATION_PRICE_IDS.includes(li.price.id)) || /implementation/i.test(name)) {
      found = true;
      cents += li.amount_total ?? 0;
    }
  }
  return found ? cents / 100 : null;
}

// The first day a commission can be paid: the sale date plus the affiliate's hold (null when they have none).
export async function payableOn(db: Db, affiliateId: string, saleDate: string): Promise<string | null> {
  const { data } = await db.from("affiliates").select("payout_delay_days").eq("id", affiliateId).maybeSingle();
  const n = data?.payout_delay_days;
  if (n == null) return null;
  const d = new Date(`${saleDate}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + Number(n));
  return d.toISOString().slice(0, 10);
}

// The affiliate a visitor came through (cookie or a ?ref / _ref code), if it belongs to this account and is active.
// The code is either the affiliate's own code or one of their product links (which also names the link).
// A product link lapses 365 days after it was made or last renewed. People already credited keep their credit.
export const AFF_LINK_DAYS = 365;
export const linkExpired = (expiresAt: string | null | undefined) => !!expiresAt && new Date(expiresAt).getTime() <= Date.now();

export type AffiliateRef = { id: string; name: string; code: string; linkId?: string | null; product?: string | null };
export async function affiliateByCode(db: Db, planId: string, code: string | null | undefined): Promise<AffiliateRef | null> {
  const c = slugCode(code || "");
  if (!c) return null;
  const { data: link } = await db.from("affiliate_links").select("id, product, status, expires_at, affiliates!inner(id, name, code, status, master_plan_id)").eq("code", c).maybeSingle();
  const la = link?.affiliates as unknown as { id: string; name: string; code: string; status: string; master_plan_id: string } | null | undefined;
  if (link && la) {
    if (link.status !== "active" || la.status !== "active" || la.master_plan_id !== planId || linkExpired(link.expires_at as string | null)) return null;
    return { id: la.id, name: la.name, code: la.code, linkId: link.id as string, product: link.product as string };
  }
  const { data } = await db.from("affiliates").select("id, name, code").eq("code", c).eq("master_plan_id", planId).eq("status", "active").maybeSingle();
  return data as AffiliateRef | null;
}

// Credits a lead or booking to an affiliate: logged once per person and kind; the person's
// first affiliate becomes their "referred by" (so later purchases are credited too).
export async function recordReferral(db: Db, planId: string, affiliate: AffiliateRef, contactId: string, kind: "lead" | "booking" | "manual", source: string) {
  const { data: dup } = await db.from("affiliate_referrals").select("id").eq("affiliate_id", affiliate.id).eq("contact_id", contactId).eq("kind", kind).maybeSingle();
  if (!dup) await db.from("affiliate_referrals").insert({ affiliate_id: affiliate.id, master_plan_id: planId, contact_id: contactId, kind, source, link_id: affiliate.linkId ?? null });
  const { data: c } = await db.from("seq_contacts").select("referred_by_affiliate_id, tags").eq("id", contactId).eq("master_plan_id", planId).maybeSingle();
  if (c && !c.referred_by_affiliate_id) {
    const tags = Array.from(new Set([...((c.tags as string[]) ?? []), `referred-by-${affiliate.code}`]));
    await db.from("seq_contacts").update({ referred_by_affiliate_id: affiliate.id, referred_by_link_id: affiliate.linkId ?? null, tags, tag_source: "affiliate" }).eq("id", contactId).eq("master_plan_id", planId);
    await logEvent(planId, contactId, "manual", `Referred by affiliate ${affiliate.name}${affiliate.product ? ` (${affiliate.product})` : ""}`, { affiliate: affiliate.code, link: affiliate.linkId ?? null }, db as never).catch(() => {});
  }
}

// A sale to credit: to the given affiliate code, else to whoever referred this contact.
// The offer is matched by id, or by name when only a description is known.
export async function creditSale(
  db: Db,
  planId: string,
  // implementationAmount may be a function: it is only called when the link earns on the implementation fee only.
  input: { contactId: string | null; affiliateCode?: string | null; description: string; amount: number; implementationAmount?: number | null | (() => Promise<number | null>); implementationOnly?: boolean; offerId?: string | null; saleDate?: string; stripeRef?: string | null; source?: string }
) {
  let affiliateId: string | null = null;
  let linkId: string | null = null;
  if (input.affiliateCode) {
    const ref = await affiliateByCode(db, planId, input.affiliateCode);
    affiliateId = ref?.id ?? null;
    linkId = ref?.linkId ?? null;
  }
  if (!affiliateId && input.contactId) {
    const { data: c } = await db.from("seq_contacts").select("referred_by_affiliate_id, referred_by_link_id").eq("id", input.contactId).eq("master_plan_id", planId).maybeSingle();
    affiliateId = (c?.referred_by_affiliate_id as string) ?? null;
    linkId = (c?.referred_by_link_id as string) ?? null;
  }
  if (!affiliateId) return null;
  // A link that earns on the implementation fee only credits that part of a payment, and nothing else: a later
  // subscription payment (no implementation fee on it) is not credited. A link that earns on "all" credits every payment.
  let amount = input.amount;
  if (input.implementationOnly) {
    // Command Suite sales: affiliates are paid on the implementation fee only, whatever the link says. Monthly
    // fees (and the year of monthly fees inside an annual payment) never earn a commission.
    const impl = typeof input.implementationAmount === "function" ? await input.implementationAmount().catch(() => null) : input.implementationAmount ?? null;
    const basis = creditBasis("implementation", input.amount, impl);
    if (!basis.credit) return null;
    amount = basis.amount;
  } else if (linkId) {
    const { data: lk } = await db.from("affiliate_links").select("commission_on").eq("id", linkId).maybeSingle();
    let impl: number | null = null;
    if (lk?.commission_on === "implementation") impl = typeof input.implementationAmount === "function" ? await input.implementationAmount().catch(() => null) : input.implementationAmount ?? null;
    const basis = creditBasis(lk?.commission_on as string | undefined, input.amount, impl);
    if (!basis.credit) return null;
    amount = basis.amount;
  }
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
  const rate = await rateFor(db, affiliateId, offerId, linkId);
  const saleDate = input.saleDate ?? new Date().toISOString().slice(0, 10);
  const { data } = await db
    .from("affiliate_sales")
    .insert({
      affiliate_id: affiliateId,
      master_plan_id: planId,
      contact_id: input.contactId,
      offer_id: offerId,
      link_id: linkId,
      description: input.description.slice(0, 300),
      amount: money(amount),
      rate,
      commission: rate != null ? money((amount * rate) / 100) : 0,
      sale_date: saleDate,
      payable_on: await payableOn(db, affiliateId, saleDate),
      // Automatic sales with no rate yet wait for a quick review.
      status: rate == null ? "review" : "owed",
      source: input.source ?? "manual",
      stripe_ref: input.stripeRef ?? null,
    })
    .select("id")
    .single();
  return data;
}

// True when a sale in this account is already credited under any of these Stripe ids (Checkout session, invoice,
// charge or payment intent of the same payment), so the same payment is never credited twice.
export async function anySaleCredited(db: Db, planId: string, refs: string[]): Promise<boolean> {
  const ids = uniqueRefs(refs);
  if (!ids.length) return false;
  const { data } = await db.from("affiliate_sales").select("id").eq("master_plan_id", planId).in("stripe_ref", ids).limit(1);
  return (data ?? []).length > 0;
}

// A refund hit a payment. Credited sales found under any of its Stripe ids are handled by refundDecision:
// still inside the payout hold and unpaid → void (row kept, reason and refund id recorded); paid, or past the hold →
// left as it is and flagged for review with a note. Safe to run again for the same refund (nothing changes twice).
export async function applyRefundToSales(db: Db, planId: string, refs: string[], refund: RefundInfo): Promise<{ voided: number; flagged: number }> {
  const out = { voided: 0, flagged: 0 };
  const ids = uniqueRefs(refs);
  if (!ids.length) return out;
  const { data } = await db.from("affiliate_sales").select("id, status, payable_on, refund_ref, refund_note").eq("master_plan_id", planId).in("stripe_ref", ids);
  for (const sale of (data ?? []) as { id: string; status: string; payable_on: string | null; refund_ref: string | null; refund_note: string | null }[]) {
    const d = refundDecision(sale, refund);
    if (d.action === "none") continue;
    const now = new Date().toISOString();
    // The status guard keeps this from overwriting a sale the owner marked paid in the meantime.
    const patch =
      d.action === "void"
        ? { status: "void", void_reason: d.reason, refund_ref: refund.id, refunded_at: now, refund_flag: false }
        : { refund_flag: true, refund_note: mergeNote(sale.refund_note, d.note), refund_ref: refund.id, refunded_at: now };
    const { data: done } = await db.from("affiliate_sales").update(patch).eq("id", sale.id).eq("status", sale.status).select("id");
    if ((done ?? []).length) out[d.action === "void" ? "voided" : "flagged"]++;
  }
  return out;
}

// One affiliate's month (YYYY-MM, in UTC calendar days): clicks, who they referred,
// sales by product, commissions owed/paid, and lifetime totals. Used by the owner's
// view, the affiliate's private link and their in-app partnership view.
export type AffiliateReport = {
  month: string;
  affiliate: { name: string; code: string; status: string };
  clicks: number;
  referrals: { firstName: string; kind: string; date: string }[];
  sales: { date: string; description: string; amount: number; rate: number | null; commission: number; status: string; payableOn: string | null }[];
  byProduct: { product: string; sales: number; amount: number; commission: number }[];
  month_totals: { revenue: number; commission: number; owed: number; paid: number; pending: number };
  byLink: { product: string; code: string; expiresAt: string | null; clicks: number; referrals: number; revenue: number; commission: number }[];
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
    db.from("affiliate_sales").select("description, amount, rate, commission, status, sale_date, payable_on, sales_offers(name)").eq("affiliate_id", affiliateId).neq("status", "void").gte("sale_date", from.toISOString().slice(0, 10)).lt("sale_date", to.toISOString().slice(0, 10)).order("sale_date"),
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
    payableOn: (s.payable_on as string | null) ?? null,
  }));
  const byProduct = new Map<string, { product: string; sales: number; amount: number; commission: number }>();
  for (const r of rows) {
    const cur = byProduct.get(r.product) ?? { product: r.product, sales: 0, amount: 0, commission: 0 };
    cur.sales++;
    cur.amount = money(cur.amount + r.amount);
    cur.commission = money(cur.commission + r.commission);
    byProduct.set(r.product, cur);
  }
  const [{ data: lk }, { data: lkClicks }, { data: lkRefs }, { data: lkSales }] = await Promise.all([
    db.from("affiliate_links").select("id, product, code, expires_at").eq("affiliate_id", affiliateId).order("created_at"),
    db.from("affiliate_clicks").select("link_id").eq("affiliate_id", affiliateId).not("link_id", "is", null).limit(50000),
    db.from("affiliate_referrals").select("link_id").eq("affiliate_id", affiliateId).not("link_id", "is", null).limit(50000),
    db.from("affiliate_sales").select("link_id, amount, commission").eq("affiliate_id", affiliateId).neq("status", "void").not("link_id", "is", null).limit(50000),
  ]);
  const byLink = ((lk ?? []) as { id: string; product: string; code: string; expires_at: string | null }[]).map((l) => {
    const mine = (lkSales ?? []).filter((x) => x.link_id === l.id);
    return {
      product: l.product,
      code: l.code,
      expiresAt: l.expires_at,
      clicks: (lkClicks ?? []).filter((x) => x.link_id === l.id).length,
      referrals: (lkRefs ?? []).filter((x) => x.link_id === l.id).length,
      revenue: money(mine.reduce((t, x) => t + Number(x.amount), 0)),
      commission: money(mine.reduce((t, x) => t + Number(x.commission), 0)),
    };
  });
  const sum = (xs: { commission: number }[]) => money(xs.reduce((t, x) => t + x.commission, 0));
  const life = (lifeSales ?? []).map((s) => ({ amount: Number(s.amount), commission: Number(s.commission), status: s.status as string }));
  return {
    month: m,
    affiliate: { name: aff.name as string, code: aff.code as string, status: aff.status as string },
    clicks: clicks ?? 0,
    referrals: (refs ?? []).map((r) => ({ firstName: (r.seq_contacts as unknown as { first_name: string | null } | null)?.first_name || "Someone", kind: r.kind as string, date: (r.created_at as string).slice(0, 10) })),
    sales: rows.map((r) => ({ date: r.date, description: r.description, amount: r.amount, rate: r.rate, commission: r.commission, status: r.status, payableOn: r.payableOn })),
    byProduct: Array.from(byProduct.values()).sort((a, b) => b.amount - a.amount),
    month_totals: {
      revenue: money(rows.reduce((t, r) => t + r.amount, 0)),
      commission: sum(rows),
      owed: sum(rows.filter((r) => r.status === "owed")),
      paid: sum(rows.filter((r) => r.status === "paid")),
      pending: rows.filter((r) => r.status === "review").length,
    },
    byLink,
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
    ["Product link", "Clicks", "People referred", "Revenue", "Commission"],
    ...r.byLink.map((l) => [l.product, l.clicks, l.referrals, l.revenue, l.commission]),
    [],
    ["Date", "Sale", "Amount", "Rate %", "Commission", "Status", "Payable on"],
    ...r.sales.map((s) => [s.date, s.description, s.amount, s.rate ?? "", s.commission, s.status === "review" ? "pending" : s.status, s.payableOn ?? ""]),
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
