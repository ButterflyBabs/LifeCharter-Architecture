// The Stripe object ids the checkouts rely on (price ids, the FIRSTMONTHFREE coupon, the LCALUMNI500 promotion
// code). These are the LIVE ids. A test copy of the Suite points at Stripe's test mode, where every id is
// different, so it sets STRIPE_CATALOG_JSON (printed by scripts/stripe-test-setup.mjs) to override them.
// Production sets nothing and behaves exactly as before.

export type TierPrices = { monthlyPriceId: string; implementationPriceId: string };
export type StripeCatalog = {
  tiers: Record<string, TierPrices>;
  firstMonthFreeCouponId: string;
  alumniPromotionCodeId: string;
};

const LIVE: StripeCatalog = {
  tiers: {
    starter: { monthlyPriceId: "price_1UFxEMLtotgP5J189ky7bu03", implementationPriceId: "price_1UFx60LtotgP5J18Vih3WrJs" },
    growth: { monthlyPriceId: "price_1UFxF1LtotgP5J18KeV9NI2y", implementationPriceId: "price_1UFx7VLtotgP5J18pOPwa8yO" },
    vip: { monthlyPriceId: "price_1UFxFuLtotgP5J188iWSSUg2", implementationPriceId: "price_1UFx9vLtotgP5J18LDbeFXIE" },
  },
  firstMonthFreeCouponId: "CwLz0M07",
  alumniPromotionCodeId: "promo_1UKK4ULtotgP5J18DrP4K7H6",
};

function load(): StripeCatalog {
  const raw = process.env.STRIPE_CATALOG_JSON;
  if (!raw) return LIVE;
  try {
    const o = JSON.parse(raw) as Partial<StripeCatalog>;
    return {
      tiers: { ...LIVE.tiers, ...(o.tiers ?? {}) },
      firstMonthFreeCouponId: o.firstMonthFreeCouponId || LIVE.firstMonthFreeCouponId,
      alumniPromotionCodeId: o.alumniPromotionCodeId || LIVE.alumniPromotionCodeId,
    };
  } catch {
    console.error("STRIPE_CATALOG_JSON is not valid JSON; using the live catalog");
    return LIVE;
  }
}

export const CATALOG: StripeCatalog = load();
export const TIER_PRICES = CATALOG.tiers;
export const FIRST_MONTH_FREE_COUPON_ID = CATALOG.firstMonthFreeCouponId;
export const ALUMNI_PROMOTION_CODE_ID = CATALOG.alumniPromotionCodeId;
export const IMPLEMENTATION_PRICE_IDS = Object.values(CATALOG.tiers).map((t) => t.implementationPriceId);
