import { createServerClient } from "@/lib/supabase/server";
import { platform } from "@/lib/stripeConnect";
import { anyProvincial, cleanProvRegs, isTaxPlace, provincialFor, taxFor, type Frequency, type Province, type ProvRegs, type ProvTaxLine, type TaxLine, type TaxPlace } from "@/lib/salesTax";

type Db = ReturnType<typeof createServerClient>;

export type TaxSettings = {
  registered: boolean;
  businessNumber: string;
  province: Province | null;
  frequency: Frequency;
  registeredFrom: string | null;
  /** Quebec QST and BC/SK/MB PST registrations (each on its own; none needs GST/HST to be on). */
  provincial: ProvRegs;
};

const EMPTY: TaxSettings = { registered: false, businessNumber: "", province: null, frequency: "quarterly", registeredFrom: null, provincial: {} };

/** The account's GST/HST registration (not registered when nothing is saved). */
export async function loadTaxSettings(planId: string | null | undefined, db: Db = createServerClient()): Promise<TaxSettings> {
  if (!planId) return EMPTY;
  const { data } = await db.from("sales_tax_settings").select("registered, business_number, province, filing_frequency, registered_from, provincial").eq("master_plan_id", planId).maybeSingle();
  if (!data) return EMPTY;
  const prov = data.province as string | null;
  return {
    registered: Boolean(data.registered),
    businessNumber: (data.business_number as string) || "",
    province: prov && isTaxPlace(prov) && prov !== "OUTSIDE" ? (prov as Province) : null,
    frequency: (["monthly", "quarterly", "annual"].includes(data.filing_frequency as string) ? data.filing_frequency : "quarterly") as Frequency,
    registeredFrom: (data.registered_from as string) || null,
    provincial: cleanProvRegs(data.provincial),
  };
}

/** True when this account charges GST/HST today. */
export async function chargesTax(planId: string, db: Db = createServerClient(), today = new Date().toISOString().slice(0, 10)): Promise<boolean> {
  const t = await loadTaxSettings(planId, db);
  return t.registered && (!t.registeredFrom || t.registeredFrom <= today);
}

/** True when the account collects any sales tax (GST/HST or a provincial one), so the customer's place is needed. */
export async function collectsTax(planId: string, db: Db = createServerClient()): Promise<boolean> {
  const t = await loadTaxSettings(planId, db);
  const today = new Date().toISOString().slice(0, 10);
  return (t.registered && (!t.registeredFrom || t.registeredFrom <= today)) || anyProvincial(t.provincial);
}

/** Every tax to add for a customer in this place: GST/HST (when registered) and the provincial one (when it applies). */
export async function taxesToCharge(planId: string, place: TaxPlace | null, pstApplies: boolean, db: Db = createServerClient()): Promise<{ gst: TaxLine | null; prov: ProvTaxLine | null }> {
  if (!place) return { gst: null, prov: null };
  const t = await loadTaxSettings(planId, db);
  const today = new Date().toISOString().slice(0, 10);
  const gstOn = t.registered && (!t.registeredFrom || t.registeredFrom <= today);
  const g = gstOn ? taxFor(place) : null;
  return { gst: g && g.rate > 0 ? g : null, prov: provincialFor(place, t.provincial, pstApplies) };
}

/** The Stripe tax rate for a provincial tax line (QST, PST, RST) on the client's own account. */
export async function stripeProvTaxRate(db: Db, planId: string, account: string, line: ProvTaxLine): Promise<string> {
  return ensureRate(db, planId, account, `${line.kind}:${line.place}:${line.rate}`, { display_name: line.kind, percentage: line.rate, state: line.place, description: line.label });
}

async function ensureRate(db: Db, planId: string, account: string, key: string, r: { display_name: string; percentage: number; state: string; description: string }): Promise<string> {
  const { data } = await db.from("sales_tax_settings").select("stripe_rates").eq("master_plan_id", planId).maybeSingle();
  const all = ((data?.stripe_rates as Record<string, Record<string, string>> | null) ?? {}) as Record<string, Record<string, string>>;
  const known = all[account]?.[key];
  if (known) return known;
  const rate = await platform().taxRates.create(
    { ...r, inclusive: false, country: "CA", jurisdiction: `CA - ${r.state}`, metadata: { lccs_plan_id: planId } },
    { stripeAccount: account },
  );
  const next = { ...all, [account]: { ...(all[account] ?? {}), [key]: rate.id } };
  await db.from("sales_tax_settings").update({ stripe_rates: next, updated_at: new Date().toISOString() }).eq("master_plan_id", planId);
  return rate.id;
}

/**
 * The Stripe tax rate for a place, on the client's OWN connected account (made once, then reused). Null for
 * customers outside Canada (no tax). Tax rates are fixed in Stripe, so a rate change makes a new one.
 */
export async function stripeTaxRate(db: Db, planId: string, account: string, place: TaxPlace): Promise<string | null> {
  const line = taxFor(place);
  if (line.rate === 0 || line.place === "OUTSIDE") return null;
  // Same cache key as before, so rates already made on clients' accounts are reused.
  return ensureRate(db, planId, account, `${line.place}:${line.rate}`, { display_name: line.kind, percentage: line.rate, state: line.place, description: line.label });
}
