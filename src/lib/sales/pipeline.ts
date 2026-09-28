import type { SupabaseClient } from "@supabase/supabase-js";

// Pipeline (deals board): default stages, shaping, and the summary that feeds Executive Home and
// Daily Compass. A deal's probability of closing is its own number, or its stage's default when
// the client hasn't set one; weighted value = value x probability.

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
  "id, stage_id, offer_id, business_id, contact_name, company, email, value, probability, expected_close, next_step, next_step_due, source, notes, sort_order, stage_changed_at, closed_at, created_at";

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

export type PipelineSummary = {
  openValue: number;
  weightedValue: number;
  openDeals: number;
  wonThisMonth: { count: number; value: number };
  byStage: { id: string; name: string; kind: string; count: number; value: number }[];
  topOffer: { id: string; name: string; value: number; count: number } | null;
  activeOffers: number;
  toMove: { id: string; contactName: string; company: string; stage: string; nextStep: string; nextStepDue: string | null; reason: "due" | "overdue" | "stale"; value: number | null }[];
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
  const [{ data: st }, { data: dl }, { data: of }] = await Promise.all([
    supabase.from("pipeline_stages").select("id, name, kind, probability, sort_order").eq("master_plan_id", masterPlanId).order("sort_order"),
    dq,
    oq,
  ]);
  const stages = ((st ?? []) as Record<string, unknown>[]).map(shapeStage);
  const smap = new Map(stages.map((s) => [s.id, s]));
  const deals = ((dl ?? []) as Record<string, unknown>[]).map((r) => shapeDeal(r, smap));
  const offers = (of ?? []) as { id: string; name: string; status: string }[];
  const open = deals.filter((d) => smap.get(d.stageId)?.kind === "open");
  const month = today.slice(0, 7);
  const wonMonth = deals.filter((d) => smap.get(d.stageId)?.kind === "won" && (d.closedAt || "").slice(0, 7) === month);

  const byOffer = new Map<string, { value: number; count: number }>();
  for (const d of open) {
    if (!d.offerId) continue;
    const o = byOffer.get(d.offerId) ?? { value: 0, count: 0 };
    o.value += d.value ?? 0;
    o.count += 1;
    byOffer.set(d.offerId, o);
  }
  let topOffer: PipelineSummary["topOffer"] = null;
  for (const [id, o] of Array.from(byOffer.entries())) {
    const name = offers.find((x) => x.id === id)?.name;
    if (name && (!topOffer || o.value > topOffer.value)) topOffer = { id, name, ...o };
  }

  const staleCutoff = new Date(new Date(today + "T12:00:00Z").getTime() - STALE_DAYS * 86400_000).toISOString();
  const toMove: PipelineSummary["toMove"] = [];
  for (const d of open) {
    let reason: "due" | "overdue" | "stale" | null = null;
    if (d.nextStepDue && d.nextStepDue < today) reason = "overdue";
    else if (d.nextStepDue === today) reason = "due";
    else if (d.stageChangedAt < staleCutoff && (!d.nextStepDue || d.nextStepDue < today)) reason = "stale";
    if (reason) toMove.push({ id: d.id, contactName: d.contactName, company: d.company, stage: smap.get(d.stageId)?.name || "", nextStep: d.nextStep, nextStepDue: d.nextStepDue, reason, value: d.value });
  }
  const rank = { overdue: 0, due: 1, stale: 2 } as const;
  toMove.sort((a, b) => rank[a.reason] - rank[b.reason] || (a.nextStepDue || "").localeCompare(b.nextStepDue || ""));

  return {
    openValue: open.reduce((s, d) => s + (d.value ?? 0), 0),
    weightedValue: open.reduce((s, d) => s + d.weightedValue, 0),
    openDeals: open.length,
    wonThisMonth: { count: wonMonth.length, value: wonMonth.reduce((s, d) => s + (d.value ?? 0), 0) },
    byStage: stages.map((s) => {
      const ds = deals.filter((d) => d.stageId === s.id);
      return { id: s.id, name: s.name, kind: s.kind, count: ds.length, value: ds.reduce((a, d) => a + (d.value ?? 0), 0) };
    }),
    topOffer,
    activeOffers: offers.filter((o) => o.status === "active").length,
    toMove: toMove.slice(0, 12),
  };
}
