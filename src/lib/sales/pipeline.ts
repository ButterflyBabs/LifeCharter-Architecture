import type { SupabaseClient } from "@supabase/supabase-js";
import { otherCurrency, toCurrency, type Currency } from "@/lib/currency";
import { homeCurrency } from "@/lib/currencyServer";

// Pipeline (deals board): default stages, shaping, and the summary that feeds Executive Home and
// Daily Compass. A deal's probability of closing is its own number, or its stage's default when
// the client hasn't set one; weighted value = value x probability.
// Each deal carries its own currency (task 1520): totals are kept per currency and never added together.

export const DEFAULT_STAGES = [
  { name: "Lead", kind: "open", probability: 10 },
  { name: "Qualified", kind: "open", probability: 25 },
  { name: "Discovery call", kind: "open", probability: 40 },
  { name: "Proposal sent", kind: "open", probability: 60 },
  { name: "Won", kind: "won", probability: 100 },
  { name: "Lost", kind: "lost", probability: 0 },
] as const;

export const STALE_DAYS = 14;

export type Stage = { id: string; name: string; kind: "open" | "won" | "lost"; probability: number; sortOrder: number };
export type Deal = {
  id: string;
  stageId: string;
  offerId: string | null;
  businessId: number | null;
  contactName: string;
  company: string;
  email: string;
  value: number | null;
  currency: Currency;
  probability: number | null; // the client's own number; null = stage default
  effectiveProbability: number;
  weightedValue: number;
  expectedClose: string | null;
  nextStep: string;
  nextStepDue: string | null;
  source: string;
  notes: string;
  sortOrder: number;
  stageChangedAt: string;
  closedAt: string | null;
  createdAt: string;
};

export const DEAL_COLUMNS =
  "id, stage_id, offer_id, business_id, contact_name, company, email, value, currency, probability, expected_close, next_step, next_step_due, source, notes, sort_order, stage_changed_at, closed_at, created_at";

export function shapeStage(r: Record<string, unknown>): Stage {
  return { id: r.id as string, name: (r.name as string) || "", kind: ((r.kind as string) || "open") as Stage["kind"], probability: Number(r.probability ?? 0), sortOrder: Number(r.sort_order ?? 0) };
}

export function shapeDeal(r: Record<string, unknown>, stages: Map<string, Stage>): Deal {
  const value = r.value === null || r.value === undefined ? null : Number(r.value);
  const own = r.probability === null || r.probability === undefined ? null : Number(r.probability);
  const stage = stages.get(r.stage_id as string);
  const eff = stage?.kind === "won" ? 100 : stage?.kind === "lost" ? 0 : own ?? stage?.probability ?? 0;
  return {
    id: r.id as string,
    stageId: r.stage_id as string,
    offerId: (r.offer_id as string | null) ?? null,
    businessId: (r.business_id as number | null) ?? null,
    contactName: (r.contact_name as string) || "",
    company: (r.company as string) || "",
    email: (r.email as string) || "",
    value,
    currency: toCurrency(r.currency),
    probability: own,
    effectiveProbability: eff,
    weightedValue: Math.round(((value ?? 0) * eff) / 100),
    expectedClose: (r.expected_close as string | null) ?? null,
    nextStep: (r.next_step as string) || "",
    nextStepDue: (r.next_step_due as string | null) ?? null,
    source: (r.source as string) || "",
    notes: (r.notes as string) || "",
    sortOrder: Number(r.sort_order ?? 0),
    stageChangedAt: r.stage_changed_at as string,
    closedAt: (r.closed_at as string | null) ?? null,
    createdAt: r.created_at as string,
  };
}

// The account's stages, creating the defaults the first time.
export async function ensureStages(supabase: SupabaseClient, masterPlanId: string): Promise<Stage[]> {
  const { data } = await supabase.from("pipeline_stages").select("id, name, kind, probability, sort_order").eq("master_plan_id", masterPlanId).order("sort_order");
  if (data && data.length) return data.map(shapeStage);
  const rows = DEFAULT_STAGES.map((s, i) => ({ master_plan_id: masterPlanId, name: s.name, kind: s.kind, probability: s.probability, sort_order: i }));
  const { data: made } = await supabase.from("pipeline_stages").insert(rows).select("id, name, kind, probability, sort_order");
  return ((made ?? []) as Record<string, unknown>[]).map(shapeStage).sort((a, b) => a.sortOrder - b.sortOrder);
}

/** The money figures of a summary, for one currency. */
export type PipelineMoney = {
  openValue: number;
  weightedValue: number;
  openDeals: number;
  wonThisMonth: { count: number; value: number };
  topOffer: { id: string; name: string; value: number; count: number } | null;
};

export type PipelineSummary = PipelineMoney & {
  /** The account's home currency: every money figure above is in it, counting only deals in it. */
  currency: Currency;
  /** The same figures for deals in the other currency (kept separate), or null when there are none. */
  other: (PipelineMoney & { currency: Currency }) | null;
  /** count = every deal in the stage; value = home-currency deals only; otherValue = the other currency's. */
  byStage: { id: string; name: string; kind: string; count: number; value: number; otherValue: number }[];
  activeOffers: number;
  toMove: { id: string; contactName: string; company: string; stage: string; nextStep: string; nextStepDue: string | null; reason: "due" | "overdue" | "stale"; value: number | null; currency: Currency }[];
};

// Everything Executive Home and Daily Compass show. `today` is the client's own date (YYYY-MM-DD).
// businessId: only that business's deals and offers (offers for "All businesses" always count).
export async function pipelineSummary(supabase: SupabaseClient, masterPlanId: string, today: string, businessId?: number | null): Promise<PipelineSummary> {
  let dq = supabase.from("pipeline_deals").select(DEAL_COLUMNS).eq("master_plan_id", masterPlanId);
  let oq = supabase.from("sales_offers").select("id, name, status").eq("master_plan_id", masterPlanId);
  if (businessId) {
    dq = dq.eq("business_id", businessId);
    oq = oq.or(`business_id.eq.${businessId},business_id.is.null`);
  }
  const [{ data: st }, { data: dl }, { data: of }, home] = await Promise.all([
    supabase.from("pipeline_stages").select("id, name, kind, probability, sort_order").eq("master_plan_id", masterPlanId).order("sort_order"),
    dq,
    oq,
    homeCurrency(masterPlanId),
  ]);
  const stages = ((st ?? []) as Record<string, unknown>[]).map(shapeStage);
  const smap = new Map(stages.map((s) => [s.id, s]));
  const deals = ((dl ?? []) as Record<string, unknown>[]).map((r) => shapeDeal(r, smap));
  const offers = (of ?? []) as { id: string; name: string; status: string }[];
  const open = deals.filter((d) => smap.get(d.stageId)?.kind === "open");
  const month = today.slice(0, 7);
  const wonMonth = deals.filter((d) => smap.get(d.stageId)?.kind === "won" && (d.closedAt || "").slice(0, 7) === month);

  // The money figures for one currency's deals.
  const money = (cur: Currency): PipelineMoney => {
    const o = open.filter((d) => d.currency === cur);
    const w = wonMonth.filter((d) => d.currency === cur);
    const byOffer = new Map<string, { value: number; count: number }>();
    for (const d of o) {
      if (!d.offerId) continue;
      const x = byOffer.get(d.offerId) ?? { value: 0, count: 0 };
      x.value += d.value ?? 0;
      x.count += 1;
      byOffer.set(d.offerId, x);
    }
    let topOffer: PipelineMoney["topOffer"] = null;
    for (const [id, x] of Array.from(byOffer.entries())) {
      const name = offers.find((y) => y.id === id)?.name;
      if (name && (!topOffer || x.value > topOffer.value)) topOffer = { id, name, ...x };
    }
    return {
      openValue: o.reduce((a, d) => a + (d.value ?? 0), 0),
      weightedValue: o.reduce((a, d) => a + d.weightedValue, 0),
      openDeals: o.length,
      wonThisMonth: { count: w.length, value: w.reduce((a, d) => a + (d.value ?? 0), 0) },
      topOffer,
    };
  };
  const away = otherCurrency(home);
  const homeMoney = money(home);
  const awayMoney = money(away);
  const hasAway = deals.some((d) => d.currency === away && (smap.get(d.stageId)?.kind === "open" || wonMonth.includes(d)));

  const staleCutoff = new Date(new Date(today + "T12:00:00Z").getTime() - STALE_DAYS * 86400_000).toISOString();
  const toMove: PipelineSummary["toMove"] = [];
  for (const d of open) {
    let reason: "due" | "overdue" | "stale" | null = null;
    if (d.nextStepDue && d.nextStepDue < today) reason = "overdue";
    else if (d.nextStepDue === today) reason = "due";
    else if (d.stageChangedAt < staleCutoff && (!d.nextStepDue || d.nextStepDue < today)) reason = "stale";
    if (reason) toMove.push({ id: d.id, contactName: d.contactName, company: d.company, stage: smap.get(d.stageId)?.name || "", nextStep: d.nextStep, nextStepDue: d.nextStepDue, reason, value: d.value, currency: d.currency });
  }
  const rank = { overdue: 0, due: 1, stale: 2 } as const;
  toMove.sort((a, b) => rank[a.reason] - rank[b.reason] || (a.nextStepDue || "").localeCompare(b.nextStepDue || ""));

  return {
    ...homeMoney,
    // openDeals counts every open deal (a count, not money), so the headline number of deals stays whole.
    openDeals: open.length,
    currency: home,
    other: hasAway ? { ...awayMoney, currency: away } : null,
    byStage: stages.map((s) => {
      const ds = deals.filter((d) => d.stageId === s.id);
      const sum = (cur: Currency) => ds.filter((d) => d.currency === cur).reduce((a, d) => a + (d.value ?? 0), 0);
      return { id: s.id, name: s.name, kind: s.kind, count: ds.length, value: sum(home), otherValue: sum(away) };
    }),
    activeOffers: offers.filter((o) => o.status === "active").length,
    toMove: toMove.slice(0, 12),
  };
}
