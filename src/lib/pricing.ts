// Plan prices, in one place. Two sets exist:
//   FOUNDER   the prices clients have paid since launch (and keep for the life of their contract, Terms 3.7)
//   FROM_2027 the prices for anyone who buys from the switch day (January 1, 2027 unless pricing_switch_day says otherwise)
// A client who bought at founder pricing keeps the Stripe prices they are already on; this module only decides what a
// NEW purchase, an upgrade or a return costs. Pure functions (no database or Stripe calls) so they can be tested.

export type Tier = "starter" | "growth" | "vip";
export const TIERS: Tier[] = ["starter", "growth", "vip"];
export const TIER_NAME: Record<Tier, string> = { starter: "Starter", growth: "Growth", vip: "VIP" };

export interface TierPrices {
  monthlyCents: number;
  implementationCents: number;
  /** Annual pay-in-full: the implementation fee plus the first 12 monthly fees in one payment. */
  annualCents: number;
  /** Stripe price ids; null means "create the price inline at checkout". */
  monthlyPriceId: string | null;
  implementationPriceId: string | null;
}

export const FOUNDER: Record<Tier, TierPrices> = {
  starter: { monthlyCents: 34700, implementationCents: 249700, annualCents: 500000, monthlyPriceId: "price_1UFxEMLtotgP5J189ky7bu03", implementationPriceId: "price_1UFx60LtotgP5J18Vih3WrJs" },
  growth: { monthlyCents: 49700, implementationCents: 299700, annualCents: 700000, monthlyPriceId: "price_1UFxF1LtotgP5J18KeV9NI2y", implementationPriceId: "price_1UFx7VLtotgP5J18pOPwa8yO" },
  vip: { monthlyCents: 99700, implementationCents: 499700, annualCents: 1350000, monthlyPriceId: "price_1UFxFuLtotgP5J188iWSSUg2", implementationPriceId: "price_1UFx9vLtotgP5J18LDbeFXIE" },
};

// Approved by Babs 2026-10-11. The annual pay-in-full amounts keep the same discounts as today (about 25%, 22%, 20%):
// confirmed by Babs 2026-10-14 (task 929).
export const FROM_2027: Record<Tier, Omit<TierPrices, "monthlyPriceId" | "implementationPriceId">> = {
  starter: { monthlyCents: 59700, implementationCents: 299700, annualCents: 760000 },
  growth: { monthlyCents: 89700, implementationCents: 399700, annualCents: 1150000 },
  vip: { monthlyCents: 199700, implementationCents: 749700, annualCents: 2500000 },
};

export const DEFAULT_SWITCH_DAY = "2027-01-01";

export interface PricingSettings {
  /** YYYY-MM-DD in Mountain time, from app_settings pricing_switch_day. */
  switchDay: string;
  /** From app_settings pricing_2027_prices (JSON): the new Stripe price ids once they are created. */
  ids: Partial<Record<Tier, { monthly?: string; implementation?: string }>>;
}

export function parsePricingSettings(raw: Record<string, string | undefined>): PricingSettings {
  const day = String(raw.pricing_switch_day ?? "").trim();
  let ids: PricingSettings["ids"] = {};
  try {
    const j = JSON.parse(String(raw.pricing_2027_prices ?? "{}"));
    if (j && typeof j === "object") ids = j;
  } catch {
    /* unreadable: treated as "no ids yet" */
  }
  return { switchDay: /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : DEFAULT_SWITCH_DAY, ids };
}

/** Has the new price list started? `today` is YYYY-MM-DD in Mountain time. */
export function isSwitched(today: string, s: PricingSettings): boolean {
  return today >= s.switchDay;
}

/** What a new purchase of `tier` costs today. */
export function pricesFor(tier: Tier, today: string, s: PricingSettings): TierPrices {
  if (!isSwitched(today, s)) return FOUNDER[tier];
  const ids = s.ids[tier] ?? {};
  return { ...FROM_2027[tier], monthlyPriceId: ids.monthly ?? null, implementationPriceId: ids.implementation ?? null };
}

const FOUNDER_MONTHLY_TO_TIER = new Map<number, Tier>(TIERS.map((t) => [FOUNDER[t].monthlyCents, t]));

/** Is a monthly amount (in cents) one of the founder monthly fees? */
export function isFounderMonthly(cents: number | null | undefined): boolean {
  return typeof cents === "number" && FOUNDER_MONTHLY_TO_TIER.has(cents);
}

/** The tier a founder monthly amount belongs to (so an older subscription still reads as its plan after the switch). */
export function tierOfFounderMonthly(cents: number | null | undefined): Tier | null {
  return typeof cents === "number" ? FOUNDER_MONTHLY_TO_TIER.get(cents) ?? null : null;
}

/**
 * The price a client pays when moving to `tier`. A client who is on a founder monthly fee keeps founder pricing for the
 * tier they move to (Terms 3.7(e)); everyone else pays what a new buyer pays today.
 */
export function pricesForChange(tier: Tier, currentMonthlyCents: number | null | undefined, today: string, s: PricingSettings): TierPrices {
  return isFounderMonthly(currentMonthlyCents) ? FOUNDER[tier] : pricesFor(tier, today, s);
}

// The static Stripe Payment Links made at founder prices (Sales Reference and Links & Forms). They cannot know about
// the new price list, so the switch-day job turns them off; checkouts the Suite creates follow this module instead.
export const FOUNDER_PAYMENT_LINK_URLS = [
  "https://buy.stripe.com/6oUbJ22JxeB511caGS4ow05",
  "https://buy.stripe.com/fZu5kE0BpgJd39k4iu4ow04",
  "https://buy.stripe.com/fZu3cw83R78D7pAdT44ow03",
  "https://buy.stripe.com/6oUeVeesfgJdbFQcP04ow02",
  "https://buy.stripe.com/eVq4gA83RboT8tE5my4ow01",
  "https://buy.stripe.com/6oUcN6ck7boTaBMaGS4ow00",
];
