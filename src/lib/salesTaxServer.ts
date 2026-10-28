import { createServerClient } from "@/lib/supabase/server";
import { platform } from "@/lib/stripeConnect";
import { isTaxPlace, taxFor, type Frequency, type Province, type TaxPlace } from "@/lib/salesTax";

type Db = ReturnType<typeof createServerClient>;

export type TaxSettings = {
  registered: boolean;
  businessNumber: string;
  province: Province | null;
  frequency: Frequency;
  registeredFrom: string | null;
};

const EMPTY: TaxSettings = { registered: false, businessNumber: "", province: null, frequency: "quarterly", registeredFrom: null };

/** The account's GST/HST registration (not registered when nothing is saved). */
export async function loadTaxSettings(planId: string | null | undefined, db: Db = createServerClient()): Promise<TaxSettings> {
  if (!planId) return EMPTY;
  const { data } = await db.from("sales_tax_settings").select("registered, business_number, province, filing_frequency, registered_from").eq("master_plan_id", planId).maybeSingle();
  if (!data) return EMPTY;
  const prov = data.province as string | null;
  return {
    registered: Boolean(data.registered),
    businessNumber: (data.business_number as string) || "",
    province: prov && isTaxPlace(prov) && prov !== "OUTSIDE" ? (prov as Province) : null,
    frequency: (["monthly", "quarterly", "annual"].includes(data.filing_frequency as string) ? data.filing_frequency : "quarterly") as Frequency,
    registeredFrom: (data.registered_from as string) || null,
  };
}

/** True when this account charges GST/HST today. */
export async function chargesTax(planId: string, db: Db = createServerClient(), today = new Date().toISOString().slice(0, 10)): Promise<boolean> {
  const t = await loadTaxSettings(planId, db);
  return t.registered && (!t.registeredFrom || t.registeredFrom <= today);
}

/**
 * The Stripe tax rate for a place, on the client's OWN connected account (made once, then reused). Null for
 * customers outside Canada (no tax). Tax rates are fixed in Stripe, so a rate change makes a new one.
 */
export async function stripeTaxRate(db: Db, planId: string, account: string, place: TaxPlace): Promise<string | null> {
  const line = taxFor(place);
  if (line.rate === 0 || line.place === "OUTSIDE") return null;
  const { data } = await db.from("sales_tax_settings").select("stripe_rates").eq("master_plan_id", planId).maybeSingle();
  const all = ((data?.stripe_rates as Record<string, Record<string, string>> | null) ?? {}) as Record<string, Record<string, string>>;
  const key = `${line.place}:${line.rate}`;
  const known = all[account]?.[key];
  if (known) return known;
  const rate = await platform().taxRates.create(
    { display_name: line.kind, percentage: line.rate, inclusive: false, country: "CA", state: line.place, jurisdiction: `CA - ${line.place}`, description: line.label, metadata: { lccs_plan_id: planId } },
    { stripeAccount: account },
  );
  const next = { ...all, [account]: { ...(all[account] ?? {}), [key]: rate.id } };
  await db.from("sales_tax_settings").update({ stripe_rates: next, updated_at: new Date().toISOString() }).eq("master_plan_id", planId);
  return rate.id;
}
