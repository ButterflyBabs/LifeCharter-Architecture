import { createServerClient } from "@/lib/supabase/server";
import { toCurrency, type Currency } from "@/lib/currency";

type Db = ReturnType<typeof createServerClient>;

/** The account's home currency (Settings); USD when unset or unknown. */
export async function homeCurrency(masterPlanId: string | null | undefined, db: Db = createServerClient()): Promise<Currency> {
  if (!masterPlanId) return "usd";
  const { data } = await db.from("client_master_plans").select("default_currency").eq("id", masterPlanId).maybeSingle();
  return toCurrency((data as { default_currency?: string } | null)?.default_currency);
}
