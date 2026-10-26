import { createServerClient } from "@/lib/supabase/server";
import { isHousePlan } from "@/lib/housePlan";

type Db = ReturnType<typeof createServerClient>;

/** Websites reviewed per account: Starter 1, Growth 2, VIP 5 (plans.capabilities.website_reviews). Babs's own account is VIP. */
export const WEBSITE_REVIEW_CAP_BY_TIER: Record<string, number> = { starter: 1, growth: 2, vip: 5 };
export const WEBSITE_REVIEW_DEFAULT_CAP = 1; // no active plan found: the Starter amount

export async function websiteReviewCap(db: Db, planId: string): Promise<number> {
  if (await isHousePlan(planId, db)) return WEBSITE_REVIEW_CAP_BY_TIER.vip;
  const { data: plan } = await db.from("client_master_plans").select("user_id, metadata").eq("id", planId).maybeSingle();
  // An account with no subscription row (a Pre-Founder beta tester) can carry its tier's number in metadata.website_reviews.
  const own = (plan?.metadata as Record<string, unknown> | null)?.website_reviews;
  if (typeof own === "number" && own >= 0) return own;
  if (!plan?.user_id) return WEBSITE_REVIEW_DEFAULT_CAP;
  const { data: sub } = await db.from("subscriptions").select("plan_id").eq("user_id", plan.user_id).eq("status", "active").order("created_at", { ascending: false }).limit(1).maybeSingle();
  const tier = String(sub?.plan_id || "");
  if (!tier) return WEBSITE_REVIEW_DEFAULT_CAP;
  const { data: row } = await db.from("plans").select("capabilities").eq("id", tier).maybeSingle();
  const n = (row?.capabilities as Record<string, unknown> | null)?.website_reviews;
  return typeof n === "number" && n >= 0 ? n : WEBSITE_REVIEW_CAP_BY_TIER[tier] ?? WEBSITE_REVIEW_DEFAULT_CAP;
}

/** What a client may type: yourbusiness.com, www.yourbusiness.com or https://yourbusiness.com/page. */
export const isWebsiteAddress = (s: string) => /^([a-z]+:\/\/)?[^\s/]+\.[^\s]+$/i.test(s);

/** The same site however it is typed: no protocol, no www, no trailing slash, lower case. */
export const siteKey = (s: string) => s.trim().toLowerCase().replace(/^[a-z]+:\/\//, "").replace(/^www\./, "").replace(/\/+$/, "");

/** The line shown to a client who is at their limit, pointing at the next plan up. */
export function upgradeNote(cap: number): string {
  if (cap < WEBSITE_REVIEW_CAP_BY_TIER.growth) return `Growth includes ${WEBSITE_REVIEW_CAP_BY_TIER.growth} website reviews and VIP includes ${WEBSITE_REVIEW_CAP_BY_TIER.vip}.`;
  if (cap < WEBSITE_REVIEW_CAP_BY_TIER.vip) return `VIP includes ${WEBSITE_REVIEW_CAP_BY_TIER.vip} website reviews.`;
  return "";
}
