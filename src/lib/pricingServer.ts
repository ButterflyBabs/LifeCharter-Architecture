import { createServerClient } from "@/lib/supabase/server";
import { parsePricingSettings, type PricingSettings } from "@/lib/pricing";

type Db = ReturnType<typeof createServerClient>;

/** Today's date (YYYY-MM-DD) in the owner's Mountain time zone: the price list switches at Mountain midnight. */
export function todayMountain(now: Date = new Date()): string {
  return now.toLocaleDateString("en-CA", { timeZone: "America/Denver" });
}

export async function loadPricingSettings(db: Db = createServerClient()): Promise<PricingSettings> {
  const { data } = await db.from("app_settings").select("key, value").in("key", ["pricing_switch_day", "pricing_2027_prices"]);
  const raw: Record<string, string> = {};
  for (const r of (data ?? []) as { key: string; value: string }[]) raw[r.key] = String(r.value ?? "");
  return parsePricingSettings(raw);
}
