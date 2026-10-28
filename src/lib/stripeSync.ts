import { createServerClient } from "@/lib/supabase/server";
import { connectedCredentials } from "@/lib/stripeConnect";
import { anySaleCredited, creditSale } from "@/lib/affiliates";
import { applyRefundForCharge, fallbackRefundId, implementationForPayment, latestRefund, paymentContext, stripeReader } from "@/lib/affiliateStripe";
import { isCurrency } from "@/lib/currency";

// A client's OWN Stripe account (not the Suite's billing): with a read-only
// restricted key, their payments, Stripe fees and refunds flow into their
// Finance Center ledger automatically, each exactly once.

const PROVIDER = "stripe";
const API = "https://api.stripe.com/v1";

// `account` is set for a client connected with "Connect with Stripe": the Suite's platform key reads THEIR account
// (Stripe-Account header). Without it, `key` is the client's own pasted read-only key.
async function stripeGet(key: string, path: string, params: Record<string, string> = {}, account?: string) {
  const url = new URL(`${API}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${key}`, ...(account ? { "Stripe-Account": account } : {}) }, cache: "no-store" });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error?.message || `Stripe error ${res.status}`);
  return body;
}

// Checks the key can read the balance (and isn't a secret key with write access we don't need).
export async function validateStripeKey(key: string): Promise<{ ok: true; account: string } | { ok: false; error: string }> {
  if (!/^(rk|sk)_(live|test)_/.test(key)) return { ok: false, error: "That doesn't look like a Stripe key. It should start with rk_live_ (a restricted key)." };
  try {
    await stripeGet(key, "/balance");
    let account = "";
    try {
      const acct = await stripeGet(key, "/account");
      account = acct?.settings?.dashboard?.display_name || acct?.business_profile?.name || acct?.id || "";
    } catch {
      /* restricted keys often can't read the account; that's fine */
    }
    return { ok: true, account };
  } catch (e) {
    return { ok: false, error: `Stripe didn't accept that key: ${(e as Error).message}` };
  }
}

interface Txn {
  id: string;
  type: string;
  amount: number;
  fee: number;
  currency: string;
  created: number;
  description: string | null;
  source?: string | null; // for a refund: the Stripe refund id (re_...)
}

const day = (unix: number) => new Date(unix * 1000).toISOString().slice(0, 10);
const r2 = (n: number) => Math.round(n * 100) / 100;

// ── GST/HST kept apart from income (task 1520 follow-up) ─────────────────────
// Stripe's balance transactions are the gross amount (tax included). A payment the Suite charged GST/HST on is filed
// as amount = before tax, tax_amount = the tax, tax_province = where the customer is. A refund of such a payment is
// split the same way, in proportion: it stays an expense in "Refunds" and carries tax_province, which marks it as tax
// given back (it reduces the GST/HST collected rather than being tax paid on a purchase).

/** A gross amount (dollars) split into before-tax and tax. Tax is never more than the gross. */
export function splitGross(gross: number, tax: number): { amount: number; tax_amount: number } {
  const t = r2(Math.min(Math.max(tax, 0), Math.abs(gross)));
  return { amount: r2(Math.abs(gross) - t), tax_amount: t };
}

/** The tax inside a refund, in proportion to the payment's tax (dollars). */
export function refundTaxPart(refund: number, paymentGross: number, paymentTax: number): number {
  if (!(paymentGross > 0) || !(paymentTax > 0) || !(refund > 0)) return 0;
  return r2(Math.min(paymentTax, (Math.min(refund, paymentGross) * paymentTax) / paymentGross));
}

type Db = ReturnType<typeof createServerClient>;

/**
 * Take the tax out of one Stripe Finance row (income or refund). Only while its tax_amount is still 0 and its currency
 * matches the payment's, so it is safe to repeat and safe whichever of the webhook and the sync runs first.
 */
export async function fixFinanceTax(db: Db, planId: string, externalId: string, tax: number, province: string | null, currency: string): Promise<boolean> {
  if (!(tax > 0)) return false;
  const { data: row } = await db.from("finance_entries").select("id, amount, currency, tax_amount").eq("master_plan_id", planId).eq("external_id", externalId).maybeSingle();
  if (!row || Number(row.tax_amount) !== 0) return false;
  if (currency && String(row.currency || "usd").toLowerCase() !== currency.toLowerCase()) return false; // settled in another currency: left as is
  const split = splitGross(Number(row.amount), tax);
  const { error } = await db.from("finance_entries").update({ ...split, tax_province: province }).eq("id", row.id).eq("tax_amount", 0);
  return !error;
}

// Pulls new balance transactions since the last sync (first sync: 90 days back).
export async function syncStripe(masterPlanId: string): Promise<{ added: number; checked: number; error?: string }> {
  const db = createServerClient();
  const { data: integ } = await db
    .from("client_integrations")
    .select("id, api_key, external_id, status, metadata")
    .eq("master_plan_id", masterPlanId)
    .eq("provider", PROVIDER)
    .maybeSingle();
  const meta = (integ?.metadata as Record<string, unknown>) ?? {};
  const viaConnect = meta.mode === "connect" && Boolean(integ?.external_id);
  const creds = viaConnect ? connectedCredentials(integ!.external_id as string) : null;
  const key = creds ? creds.key : ((integ?.api_key as string) || "").trim();
  const account = creds?.account;
  if (!integ || !key || integ.status !== "connected") return { added: 0, checked: 0, error: "Stripe isn't connected." };
  // Test-mode payments never reach the real books (or affiliate credits): a test connection syncs nothing.
  if (viaConnect ? meta.livemode === false : /^(sk|rk)_test_/.test(key)) return { added: 0, checked: 0 };
  const since = Number(meta.last_sync_created) || Math.floor(Date.now() / 1000) - 90 * 86400;

  const txns: Txn[] = [];
  let startingAfter = "";
  try {
    for (let page = 0; page < 20; page++) {
      const params: Record<string, string> = { limit: "100", "created[gte]": String(since) };
      if (startingAfter) params.starting_after = startingAfter;
      const out = await stripeGet(key, "/balance_transactions", params, account);
      const data = (out.data ?? []) as Txn[];
      txns.push(...data);
      if (!out.has_more || !data.length) break;
      startingAfter = data[data.length - 1].id;
    }
  } catch (e) {
    const error = (e as Error).message;
    await db.from("client_integrations").update({ metadata: { ...meta, last_error: error, last_error_at: new Date().toISOString() } }).eq("id", integ.id);
    return { added: 0, checked: 0, error };
  }

  const rows: Record<string, unknown>[] = [];
  for (const t of txns) {
    // Each row keeps its own currency (task 1520): USD and CAD are filed as such and never added together. Stripe can
    // settle in other currencies (EUR, GBP...) the Suite doesn't support yet; those are skipped rather than filed as
    // dollars they aren't. last_sync_created still moves past them, so they aren't retried.
    const raw = (t.currency || "usd").toLowerCase();
    if (!isCurrency(raw)) continue;
    const currency = raw;
    if (t.type === "charge" || t.type === "payment") {
      rows.push({ master_plan_id: masterPlanId, type: "income", amount: t.amount / 100, currency, category: "Stripe sales", description: t.description || "Stripe payment", occurred_on: day(t.created), source: "stripe", external_id: `stripe:${t.id}` });
    } else if (t.type === "refund" || t.type === "payment_refund") {
      rows.push({ master_plan_id: masterPlanId, type: "expense", amount: Math.abs(t.amount) / 100, currency, category: "Refunds", description: t.description || "Stripe refund", occurred_on: day(t.created), source: "stripe", external_id: `stripe:${t.id}` });
    }
    if (t.fee > 0 && (t.type === "charge" || t.type === "payment")) {
      rows.push({ master_plan_id: masterPlanId, type: "expense", amount: t.fee / 100, currency, category: "Payment processing fees", description: "Stripe fees", occurred_on: day(t.created), source: "stripe", external_id: `stripe:${t.id}:fee` });
    }
  }

  // GST/HST: payments the Suite recorded with tax (webhook first) are filed before tax here; refunds of them in proportion.
  try {
    const { data: anyTax } = await db.from("suite_payments").select("id").eq("master_plan_id", masterPlanId).gt("tax_amount", 0).limit(1);
    if (anyTax?.length) {
      const bySource = new Map<string, string>(); // balance transaction id -> charge id
      for (const t of txns) {
        if ((t.type === "charge" || t.type === "payment") && t.source) bySource.set(t.id, t.source);
      }
      let reads = 0;
      for (const t of txns) {
        if ((t.type !== "refund" && t.type !== "payment_refund") || !t.source?.startsWith("re_") || reads >= 25) continue;
        reads++;
        const refund = await stripeGet(key, `/refunds/${t.source}`, {}, account).catch(() => null);
        const ch = typeof refund?.charge === "string" ? refund.charge : refund?.charge?.id;
        if (ch) bySource.set(t.id, ch);
      }
      const charges = Array.from(new Set(bySource.values()));
      const { data: pays } = charges.length ? await db.from("suite_payments").select("stripe_charge_id, amount, currency, tax_amount, tax_province").eq("master_plan_id", masterPlanId).in("stripe_charge_id", charges).gt("tax_amount", 0) : { data: [] };
      const payOf = new Map((pays ?? []).map((p) => [p.stripe_charge_id as string, p]));
      for (const r of rows) {
        const btId = String(r.external_id).replace(/^stripe:/, "");
        if (String(r.external_id).endsWith(":fee")) continue;
        const pay = payOf.get(bySource.get(btId) || "");
        if (!pay || String(pay.currency || "").toLowerCase() !== r.currency) continue;
        const tax = r.type === "income" ? Number(pay.tax_amount) : refundTaxPart(Number(r.amount), Number(pay.amount), Number(pay.tax_amount));
        Object.assign(r, splitGross(Number(r.amount), tax), { tax_province: (pay.tax_province as string | null) ?? null });
      }
      // One upsert, one set of columns: every row names its tax (0 when none), never a null in a not-null column.
      for (const r of rows) {
        if (r.tax_amount === undefined) Object.assign(r, { tax_amount: 0, tax_province: null });
      }
    }
  } catch (e) {
    console.error("stripe sync tax split:", (e as Error).message);
  }

  let added = 0;
  if (rows.length) {
    const { data, error } = await db.from("finance_entries").upsert(rows, { onConflict: "master_plan_id,external_id", ignoreDuplicates: true }).select("id");
    if (error) {
      console.error("stripe sync insert:", error.message);
      return { added: 0, checked: txns.length, error: "Couldn't save the payments." };
    }
    added = (data ?? []).length;
  }
  // Affiliate credit for this account's OWN sales: every paid charge (a subscription's later payments included) whose
  // customer email matches a contact that one of the account's affiliates referred is credited to that affiliate
  // (once per payment; a rate that isn't set yet waits in "review"; a link that earns on the implementation fee only
  // credits just that fee). A refund on a credited sale voids it inside the payout hold, or flags it for review.
  // Needs the key to be able to read charges; if it can't, this is skipped quietly.
  // Only USD charges are credited: affiliate sales, rates and payouts have no currency of their own and are all in
  // US dollars, so a CAD (or other) charge would be added into USD commission totals. Left for a later pass (task 1520).
  let credited = 0;
  let creditNote: string | null = null;
  let refunded = 0;
  const read = stripeReader(key, account);
  try {
    const out = await stripeGet(key, "/charges", { limit: "100", "created[gte]": String(since) }, account);
    type Charge = { id: string; currency?: string; paid?: boolean; refunded?: boolean; amount: number; amount_refunded?: number; created: number; description?: string | null; receipt_email?: string | null; payment_intent?: string | null; billing_details?: { email?: string | null } };
    for (const c of ((out.data ?? []) as Charge[]).slice(0, 100)) {
      if (!c.paid) continue;
      // A refunded charge: void or flag its credited sale (safe to repeat).
      if ((c.amount_refunded ?? 0) > 0) {
        try {
          const r = await applyRefundForCharge(db, masterPlanId, read, c);
          refunded += r.voided + r.flagged;
        } catch {
          /* try again next sync */
        }
      }
      if (c.refunded) continue;
      if ((c.currency || "usd").toLowerCase() !== "usd") continue;
      const email = (c.billing_details?.email || c.receipt_email || "").trim().toLowerCase();
      if (!email) continue;
      const { data: contact } = await db.from("seq_contacts").select("id, referred_by_affiliate_id").eq("master_plan_id", masterPlanId).eq("email", email).maybeSingle();
      if (!contact?.referred_by_affiliate_id) continue;
      const net = (c.amount - (c.amount_refunded ?? 0)) / 100;
      if (net <= 0) continue;
      // The same payment may already be credited under its Checkout session or invoice id (by the Stripe webhook).
      const ctx = await paymentContext(read, c);
      if (await anySaleCredited(db, masterPlanId, ctx.refs)) continue;
      const sale = await creditSale(db, masterPlanId, {
        contactId: contact.id as string,
        description: c.description || "Stripe payment",
        amount: net,
        implementationAmount: () => implementationForPayment(read, ctx, c, net),
        saleDate: day(c.created),
        stripeRef: c.id,
        source: "stripe",
      });
      if (sale) credited++;
      // Credited already net of a refund: record that refund on the sale so a later sync doesn't flag it as a new one.
      if (sale && (c.amount_refunded ?? 0) > 0) {
        const r = await latestRefund(read, c.id);
        await db.from("affiliate_sales").update({ refund_ref: (r?.id as string) || fallbackRefundId(c.id, c.amount_refunded ?? 0), refunded_at: new Date().toISOString() }).eq("id", sale.id);
      }
    }
  } catch (e) {
    creditNote = (e as Error).message.slice(0, 160);
  }
  // Refunds of older charges (the charge is outside this sync's window): each refund is a balance transaction whose
  // source is the Stripe refund id.
  try {
    let seen = 0;
    for (const t of txns) {
      if ((t.type !== "refund" && t.type !== "payment_refund") || !t.source || !t.source.startsWith("re_") || seen >= 25) continue;
      seen++;
      const refund = await read(`/refunds/${t.source}`);
      const chargeId = typeof refund.charge === "string" ? refund.charge : refund.charge?.id;
      if (!chargeId || refund.status === "failed" || refund.status === "canceled") continue;
      const charge = await read(`/charges/${chargeId}`);
      const r = await applyRefundForCharge(db, masterPlanId, read, charge, refund);
      refunded += r.voided + r.flagged;
    }
  } catch (e) {
    creditNote = creditNote || (e as Error).message.slice(0, 160);
  }

  const newest = txns.reduce((m, t) => Math.max(m, t.created), since);
  await db
    .from("client_integrations")
    .update({ metadata: { ...meta, last_sync_at: new Date().toISOString(), last_sync_created: newest, last_added: added, last_error: null, last_affiliate_credits: credited, last_affiliate_refunds: refunded, last_affiliate_note: creditNote }, updated_at: new Date().toISOString() })
    .eq("id", integ.id);
  return { added, checked: txns.length };
}
