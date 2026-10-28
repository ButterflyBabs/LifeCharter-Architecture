import { createServerClient } from "@/lib/supabase/server";
import { OFFER_COLUMNS, OFFER_FORMATS, shapeOffer, offerPriceLabel } from "@/lib/sales/offers";
import { formatTotals, otherCurrency, toCurrency } from "@/lib/currency";
import { homeCurrency } from "@/lib/currencyServer";

// What the AI features (assistant, Scripts, plan drafting, proposals, captions) know about this
// account's own offers, from Offers & Packages. Always scoped to one master plan, so each client's
// AI only ever sees that client's offers.
export async function offersKnowledge(masterPlanId: string): Promise<string> {
  const { data } = await createServerClient()
    .from("sales_offers")
    .select(OFFER_COLUMNS)
    .eq("master_plan_id", masterPlanId)
    .in("status", ["active", "draft"])
    .order("sort_order")
    .limit(20);
  const offers = ((data ?? []) as Record<string, unknown>[]).map(shapeOffer);
  if (!offers.length) return "";
  const home = await homeCurrency(masterPlanId);
  const fmt = (id: string) => OFFER_FORMATS.find((f) => f.id === id)?.label ?? id;
  const lines = offers.map((o) => {
    const bits = [
      `${o.name}${o.status === "draft" ? " (draft, not selling yet)" : ""}`,
      `${fmt(o.format)}, ${offerPriceLabel(o, home)}${o.price !== null ? ` (${o.currency.toUpperCase()})` : ""}${o.duration ? `, ${o.duration}` : ""}`,
      o.transformation && `transformation: ${o.transformation}`,
      o.deliverables.length ? `includes: ${o.deliverables.join("; ")}` : "",
      o.idealClient && `for: ${o.idealClient}`,
      o.notFor && `not for: ${o.notFor}`,
      o.guarantee && `guarantee: ${o.guarantee}`,
      o.capacity !== null ? `${o.capacity} spots` : "",
      o.link && `link: ${o.link}`,
    ].filter(Boolean);
    return `- ${bits.join(" | ")}`;
  });
  return `OFFERS & PACKAGES (use these exact names, prices and links; never invent others)\n${lines.join("\n")}`.slice(0, 4000);
}

// A short Pipeline snapshot for the assistant: open deals and their value.
export async function pipelineKnowledge(masterPlanId: string): Promise<string> {
  const db = createServerClient();
  const [{ data: stages }, { data: deals }, home] = await Promise.all([
    db.from("pipeline_stages").select("id, name, kind, probability").eq("master_plan_id", masterPlanId),
    db.from("pipeline_deals").select("stage_id, value, probability, currency").eq("master_plan_id", masterPlanId),
    homeCurrency(masterPlanId, db),
  ]);
  const sm = new Map(((stages ?? []) as { id: string; name: string; kind: string; probability: number }[]).map((s) => [s.id, s]));
  const allOpen = ((deals ?? []) as { stage_id: string; value: number | string | null; probability: number | null; currency: string | null }[]).filter((d) => sm.get(d.stage_id)?.kind === "open");
  if (!allOpen.length) return "";
  // Money is totalled in the home currency only; deals in the other currency are named on their own (never added in).
  const open = allOpen.filter((d) => toCurrency(d.currency) === home);
  const away = allOpen.filter((d) => toCurrency(d.currency) !== home);
  const value = open.reduce((s, d) => s + Number(d.value ?? 0), 0);
  const weighted = open.reduce((s, d) => s + (Number(d.value ?? 0) * (d.probability ?? sm.get(d.stage_id)?.probability ?? 0)) / 100, 0);
  const awayValue = away.reduce((s, d) => s + Number(d.value ?? 0), 0);
  const o = otherCurrency(home);
  const byStage = new Map<string, number>();
  for (const d of allOpen) byStage.set(sm.get(d.stage_id)!.name, (byStage.get(sm.get(d.stage_id)!.name) ?? 0) + 1);
  const money = (n: number) => formatTotals({ [home]: Math.round(n) }, home, { cents: false });
  const awayLine = away.length ? ` Also ${away.length} open deal${away.length === 1 ? "" : "s"} in ${o.toUpperCase()}: ${formatTotals({ [o]: Math.round(awayValue) }, home, { cents: false })} open (kept separate, never added to the ${home.toUpperCase()} figures).` : "";
  return `Pipeline: ${allOpen.length} open deal${allOpen.length === 1 ? "" : "s"}, ${money(value)} open, ${money(weighted)} weighted by probability${away.length ? ` (${home.toUpperCase()} deals only)` : ""} (${Array.from(byStage).map(([k, n]) => `${k} ${n}`).join(", ")}).${awayLine}`;
}
