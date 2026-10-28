import type Stripe from "stripe";
import { createServerClient } from "@/lib/supabase/server";
import { platform, type Connection } from "@/lib/stripeConnect";
import { EMAIL_RE, logEvent, upsertContact } from "@/lib/crm";
import { ensureStages } from "@/lib/sales/pipeline";
import { moveDeal } from "@/lib/booking/deals";
import { syncStripe } from "@/lib/stripeSync";
import { invoiceSubscriptionId } from "@/lib/stripeShapes";
import { HOLD_MINUTES, confirmPaidBooking, fmt, releaseHold } from "@/lib/booking/engine";
import { formatCents, isCurrency, toCurrency, type Currency } from "@/lib/currency";
import { homeCurrency } from "@/lib/currencyServer";
import { isTaxPlace, placeFromAddress, taxCents, taxFor, type TaxPlace } from "@/lib/salesTax";
import { chargesTax, stripeTaxRate } from "@/lib/salesTaxServer";
import { fixFinanceTax, refundTaxPart } from "@/lib/stripeSync";

// Get paid inside the Suite, step b (task 1146): invoices from a contact, invoice payment plans, and automatic posting.
// Step c: paid and deposit booking (bookingCheckout + the booking branch of the webhook).
//
// Same rule as step a: everything is created ON the client's own connected Stripe account (the Stripe-Account header),
// direct charges, no platform fee; the money goes straight to the client.
//
// Automatic posting (the Connect webhook, /api/stripe-connect/webhook): when a payment lands on a client's account the
// Suite records it on the Payments page, adds or updates the contact (tag "customer" and "bought-<offer>"), logs it on
// their timeline, marks their open deal Won, marks the invoice paid, and runs the Stripe sync, which puts the payment
// and its fees in the Finance Center and credits a referring affiliate. A test-mode payment does everything except the
// Finance Center and affiliate credit (the sync skips test connections), and its contact is tagged "test".

type Db = ReturnType<typeof createServerClient>;

export const MAX_PAYMENTS = 24;

/** Cents in their own currency, always with cents ("$1,200.00", "CA$300.00" on a USD account). */
const money = (cents: number, currency: string = "usd", home: Currency = "usd") => formatCents(cents, currency, { home, cents: true });

/** A total split into N monthly payments: each payment is the total / N rounded to the cent (the total follows). */
export function splitPlan(totalCents: number, count: number): { per: number; total: number } {
  const n = Math.max(1, Math.floor(count));
  const per = Math.round(totalCents / n);
  return { per, total: per * n };
}

export interface InvoiceInput {
  email: string;
  name?: string | null;
  description: string;
  amount: number;
  paymentCount?: number;
  daysUntilDue?: number;
  /** The invoice's currency (task 1520); the account's home currency when not given. */
  currency?: Currency;
  /** The account's home currency, only for how the note shows amounts. */
  home?: Currency;
  /** GST/HST: the account charges it, so the customer's place is required (an amount is always BEFORE tax). */
  chargeTax?: boolean;
  /** Where the customer is: a province code or "OUTSIDE" (only used when chargeTax). */
  taxPlace?: TaxPlace | string | null;
}

/** The GST/HST an invoice adds: per payment and in all (cents), or null when the account doesn't charge it. */
export type InvoiceTax = { place: TaxPlace; label: string; kind: "GST" | "HST" | "none"; rate: number; perCents: number; cents: number };

/** What an invoice would bill, or why it can't be sent. */
export function invoicePlan(i: InvoiceInput): { ok: true; cents: number; count: number; per: number; days: number; note: string; tax: InvoiceTax | null } | { ok: false; reason: string } {
  const email = (i.email || "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return { ok: false, reason: "This contact needs an email address to get an invoice." };
  if (!(i.description || "").trim()) return { ok: false, reason: "Say what the invoice is for." };
  if (!(Number(i.amount) > 0)) return { ok: false, reason: "Enter the amount." };
  const count = Math.floor(Number(i.paymentCount) || 1);
  if (count < 1 || count > MAX_PAYMENTS) return { ok: false, reason: `Choose between 1 and ${MAX_PAYMENTS} payments.` };
  const days = Math.floor(Number(i.daysUntilDue) || 7);
  if (days < 1 || days > 90) return { ok: false, reason: "Due within 1 to 90 days." };
  const cents = Math.round(Number(i.amount) * 100);
  const { per, total } = splitPlan(cents, count);
  const home = i.home ?? "usd";
  const cur = toCurrency(i.currency, home);
  if (per < 50) return { ok: false, reason: `Stripe's smallest charge is ${money(50, cur, home)} per payment.` };
  const m = (c: number) => money(c, cur, home);
  let tax: InvoiceTax | null = null;
  if (i.chargeTax) {
    if (!isTaxPlace(i.taxPlace)) return { ok: false, reason: "Choose where the customer is (their province, or Outside Canada) so the right GST/HST is added." };
    const line = taxFor(i.taxPlace);
    // Stripe works the tax out on each invoice, so a plan's tax is the tax on one payment times the number of payments.
    const perCents = taxCents(count === 1 ? cents : per, line.rate);
    tax = { place: line.place, label: line.kind === "none" ? "" : `${line.kind} ${line.rate}%`, kind: line.kind, rate: line.rate, perCents, cents: perCents * count };
  }
  const plus = (base: number) => (tax && tax.rate > 0 ? ` + ${tax.label} (${m(tax.perCents)}) = ${m(base + tax.perCents)}` : "");
  const outside = tax && tax.rate === 0 ? ", no GST/HST (customer outside Canada)" : "";
  const due = `${days} day${days === 1 ? "" : "s"}`;
  const note =
    count === 1
      ? `${m(cents)}${plus(cents)}${outside}, due in ${due}`
      : `${count} monthly payments of ${m(per)}${plus(per)}${tax && tax.rate > 0 ? ` each (${m(total + tax.cents)} in all, tax included)` : ` (${m(total)} in all)`}${outside}, each due ${due} after it is sent`;
  return { ok: true, cents: count === 1 ? cents : total, count, per, days, note, tax };
}

/** The tag a buyer of an offer gets: "bought-" + the offer's name in lowercase-dashes. */
export function offerTag(name: string): string {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
  return slug ? `bought-${slug}` : "customer";
}

/** A payment-plan subscription made from a payment link stops once this many payments are in. */
export const planComplete = (paid: number, count: number) => count > 0 && paid >= count;

// ── Invoices ─────────────────────────────────────────────────────────────────

async function customerFor(s: Stripe, account: string, email: string, name?: string | null): Promise<string> {
  const found = await s.customers.list({ email, limit: 1 }, { stripeAccount: account });
  if (found.data[0]) return found.data[0].id;
  const c = await s.customers.create({ email, ...(name ? { name } : {}) }, { stripeAccount: account });
  return c.id;
}

export interface InvoiceOpts { contactId?: string | null; offerId?: string | null }

/** Send an invoice (or start an invoice payment plan) from the client's own Stripe account. Stripe emails it. */
export async function createInvoice(db: Db, planId: string, c: Connection, i: InvoiceInput, o: InvoiceOpts = {}) {
  const home = await homeCurrency(planId, db);
  const currency: Currency = isCurrency(i.currency) ? toCurrency(i.currency) : home;
  // GST/HST (task 1520 follow-up): a registered account adds the tax for where the customer is. Not given → the
  // contact's stored address decides; still unknown → the invoice can't go out until someone chooses.
  const taxOn = await chargesTax(planId, db);
  const taxPlace = taxOn ? (isTaxPlace(i.taxPlace) ? i.taxPlace : await contactTaxPlace(db, planId, o.contactId)) : null;
  const plan = invoicePlan({ ...i, currency, home, chargeTax: taxOn, taxPlace });
  if (!plan.ok) throw new Error(plan.reason);
  const email = i.email.trim().toLowerCase();
  const description = i.description.trim().slice(0, 500);
  const s = platform();
  const opts = { stripeAccount: c.accountId };
  const customer = await customerFor(s, c.accountId, email, i.name);
  const rateId = plan.tax ? await stripeTaxRate(db, planId, c.accountId, plan.tax.place) : null;
  const taxRates = rateId ? { tax_rates: [rateId] } : {};

  const { data: row, error } = await db
    .from("suite_invoices")
    .insert({ master_plan_id: planId, contact_id: o.contactId ?? null, offer_id: o.offerId ?? null, stripe_account: c.accountId, livemode: c.livemode, stripe_customer_id: customer, email, name: i.name || null, description, amount: plan.cents / 100, currency, payment_count: plan.count, days_until_due: plan.days, status: plan.count > 1 ? "plan_active" : "open", tax_province: plan.tax?.place ?? null, tax_amount: (plan.tax?.cents ?? 0) / 100 })
    .select("id")
    .single();
  if (error || !row) throw new Error(`save invoice: ${error?.message}`);
  const meta = { lccs_invoice_id: row.id as string, lccs_plan_id: planId, ...(o.offerId ? { lccs_offer_id: o.offerId } : {}), ...(plan.tax ? { lccs_tax_province: plan.tax.place } : {}) };

  try {
    if (plan.count === 1) {
      const inv = await s.invoices.create({ customer, collection_method: "send_invoice", days_until_due: plan.days, auto_advance: true, description, metadata: meta }, opts);
      await s.invoiceItems.create({ customer, invoice: inv.id, currency, amount: plan.cents, description, ...taxRates }, opts);
      const fin = await s.invoices.finalizeInvoice(inv.id!, {}, opts);
      const sent = await s.invoices.sendInvoice(fin.id!, {}, opts).catch(() => fin); // test mode may not email; the link still works
      await db
        .from("suite_invoices")
        .update({ stripe_invoice_id: sent.id, number: sent.number, hosted_url: sent.hosted_invoice_url, pdf_url: sent.invoice_pdf, due_date: sent.due_date ? new Date(sent.due_date * 1000).toISOString().slice(0, 10) : null, updated_at: new Date().toISOString() })
        .eq("id", row.id);
    } else {
      // N monthly invoices, then the schedule cancels itself: no payment N + 1, ever.
      const product = await s.products.create({ name: description.slice(0, 250), metadata: meta }, opts);
      const sched = await s.subscriptionSchedules.create(
        {
          customer,
          start_date: "now",
          end_behavior: "cancel",
          metadata: meta,
          phases: [
            {
              items: [{ price_data: { currency, product: product.id, unit_amount: plan.per, recurring: { interval: "month" } }, ...taxRates }], // each monthly invoice carries the tax
              duration: { interval: "month", interval_count: plan.count },
              collection_method: "send_invoice",
              invoice_settings: { days_until_due: plan.days },
              metadata: meta,
            },
          ],
        },
        opts,
      );
      const subId = typeof sched.subscription === "string" ? sched.subscription : sched.subscription?.id ?? null;
      let first: Stripe.Invoice | null = null;
      if (subId) {
        const sub = await s.subscriptions.retrieve(subId, {}, opts);
        const latest = typeof sub.latest_invoice === "string" ? sub.latest_invoice : sub.latest_invoice?.id;
        if (latest) {
          first = await s.invoices.retrieve(latest, {}, opts);
          if (first.status === "draft") first = await s.invoices.finalizeInvoice(latest, {}, opts);
          if (first.status === "open") first = await s.invoices.sendInvoice(latest, {}, opts).catch(() => first!);
        }
      }
      await db
        .from("suite_invoices")
        .update({ stripe_schedule_id: sched.id, stripe_subscription_id: subId, stripe_invoice_id: first?.id ?? null, number: first?.number ?? null, hosted_url: first?.hosted_invoice_url ?? null, pdf_url: first?.invoice_pdf ?? null, due_date: first?.due_date ? new Date(first.due_date * 1000).toISOString().slice(0, 10) : null, updated_at: new Date().toISOString() })
        .eq("id", row.id);
    }
  } catch (e) {
    await db.from("suite_invoices").delete().eq("id", row.id);
    throw e;
  }
  if (o.contactId) await logEvent(planId, o.contactId, "manual", `Invoice sent: ${description} (${plan.note})`, { suiteInvoice: row.id }, db).catch(() => {});
  const { data } = await db.from("suite_invoices").select(INVOICE_COLUMNS).eq("id", row.id).single();
  return data;
}

export const INVOICE_COLUMNS = "id, contact_id, offer_id, livemode, number, email, name, description, amount, currency, payment_count, payments_made, status, hosted_url, pdf_url, due_date, paid_at, created_at, tax_amount, tax_province";

/** Where a contact is for GST/HST, from their stored region and country (null when it can't be told). */
export async function contactTaxPlace(db: Db, planId: string, contactId: string | null | undefined): Promise<TaxPlace | null> {
  if (!contactId) return null;
  const { data } = await db.from("seq_contacts").select("region, country").eq("id", contactId).eq("master_plan_id", planId).maybeSingle();
  return data ? placeFromAddress(data.region as string | null, data.country as string | null) : null;
}

/** Void an unpaid invoice, or stop an invoice payment plan (payments already made stay paid). */
export async function cancelInvoice(db: Db, planId: string, id: string): Promise<boolean> {
  const { data: inv } = await db.from("suite_invoices").select("id, stripe_account, stripe_invoice_id, stripe_schedule_id, status, payment_count").eq("id", id).eq("master_plan_id", planId).maybeSingle();
  if (!inv) return false;
  const s = platform();
  const opts = { stripeAccount: inv.stripe_account as string };
  if ((inv.payment_count as number) > 1 && inv.stripe_schedule_id) {
    if (inv.status !== "plan_active") return false;
    await s.subscriptionSchedules.cancel(inv.stripe_schedule_id as string, { invoice_now: false, prorate: false }, opts).catch((e) => console.error("cancel schedule:", e.message));
    await db.from("suite_invoices").update({ status: "plan_cancelled", updated_at: new Date().toISOString() }).eq("id", id);
    return true;
  }
  if (inv.status !== "open" || !inv.stripe_invoice_id) return false;
  await s.invoices.voidInvoice(inv.stripe_invoice_id as string, {}, opts);
  await db.from("suite_invoices").update({ status: "void", updated_at: new Date().toISOString() }).eq("id", id);
  return true;
}

// ── Paid booking (step c) ────────────────────────────────────────────────────

const SITE = () => process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://lccommandsuite.com";

/** Stripe Checkout for a held booking, on the account owner's own Stripe, in the booking calendar's currency. The webhook confirms the booking. */
export async function bookingCheckout(c: Connection, b: { bookingId: string; planId: string; slug: string; calName: string; startISO: string; tz: string; email: string; token: string; cents: number; deposit: boolean; currency: Currency; taxPlace?: TaxPlace | null }): Promise<string> {
  const s = platform();
  // GST/HST: the fixed rate for where the booker said they are (none outside Canada); the price itself is before tax.
  const rateId = b.taxPlace ? await stripeTaxRate(createServerClient(), b.planId, c.accountId, b.taxPlace) : null;
  const meta = { lccs_booking_id: b.bookingId, lccs_plan_id: b.planId, ...(b.taxPlace ? { lccs_tax_province: b.taxPlace } : {}) };
  const session = await s.checkout.sessions.create(
    {
      mode: "payment",
      customer_email: b.email,
      customer_creation: "always",
      line_items: [{ quantity: 1, price_data: { currency: toCurrency(b.currency), unit_amount: b.cents, product_data: { name: `${b.calName}${b.deposit ? " (deposit)" : ""}`.slice(0, 250), description: fmt(b.startISO, b.tz).slice(0, 300) } }, ...(rateId ? { tax_rates: [rateId] } : {}) }],
      metadata: meta,
      payment_intent_data: { metadata: meta, description: `${b.calName}${b.deposit ? " deposit" : ""}` },
      expires_at: Math.floor(Date.now() / 1000) + HOLD_MINUTES * 60 + 60,
      success_url: `${SITE()}/book/manage/${b.token}?paid=1`,
      cancel_url: `${SITE()}/book/${b.slug}?unpaid=1`,
    },
    { stripeAccount: c.accountId },
  );
  if (!session.url) throw new Error("Stripe didn't return a payment page.");
  return session.url;
}

// ── The pay page for an offer (GST/HST accounts) ─────────────────────────────
// Stripe Payment Links can't take a fixed tax rate, so an account that charges GST/HST gets /pay/<link id> instead:
// the buyer says where they are, sees the tax, and goes on to a Stripe Checkout made on the client's own account.

export interface PayLinkRow { id: string; offer_id: string; master_plan_id: string; kind: string; price_id: string; payment_count: number | null }

/** The Checkout Session for a pay-page link (pure: the caller adds the stripeAccount option). */
export function paySessionParams(l: PayLinkRow, o: { place: TaxPlace | null; rateId: string | null; site: string }): Stripe.Checkout.SessionCreateParams {
  const tax: Record<string, string> = o.place ? { lccs_tax_province: o.place } : {};
  const back = `${o.site}/pay/${l.id}`;
  const common = {
    line_items: [{ price: l.price_id, quantity: 1, ...(o.rateId && o.place !== "OUTSIDE" ? { tax_rates: [o.rateId] } : {}) }],
    success_url: `${back}?paid=1`,
    cancel_url: `${back}?cancelled=1`,
  };
  if (l.kind === "one_time") {
    const metadata: Record<string, string> = { lccs_offer_id: l.offer_id, lccs_plan_id: l.master_plan_id, lccs_kind: l.kind, ...tax };
    return { ...common, mode: "payment", customer_creation: "always", invoice_creation: { enabled: true, invoice_data: { metadata } }, metadata, payment_intent_data: { metadata } };
  }
  // The webhook reads these off each subscription invoice: which offer, (plans) when to stop, and the tax province.
  const subMeta: Record<string, string> = { lccs_offer_id: l.offer_id, lccs_plan_id: l.master_plan_id, ...(l.kind === "payment_plan" ? { lccs_plan_payments: String(l.payment_count ?? 0) } : {}), ...tax };
  return { ...common, mode: "subscription", metadata: { lccs_offer_id: l.offer_id, lccs_plan_id: l.master_plan_id, lccs_kind: l.kind, ...tax }, subscription_data: { metadata: subMeta } };
}

/** Start paying a pay-page link: the Checkout Session on the client's own account. Null = the link is off. */
export async function payLinkCheckout(db: Db, linkId: string, place: TaxPlace | null): Promise<{ url: string } | { error: string } | null> {
  const { data: l } = await db.from("offer_payment_links").select("id, offer_id, master_plan_id, kind, price_id, payment_count, stripe_account, active").eq("id", linkId).maybeSingle();
  if (!l || !l.active || !l.price_id) return null;
  const taxOn = await chargesTax(l.master_plan_id as string, db);
  if (taxOn && !place) return { error: "Choose where you are so the right tax is added." };
  const usePlace = taxOn ? place : null;
  const rateId = usePlace ? await stripeTaxRate(db, l.master_plan_id as string, l.stripe_account as string, usePlace) : null;
  const session = await platform().checkout.sessions.create(paySessionParams(l as unknown as PayLinkRow, { place: usePlace, rateId, site: SITE() }), { stripeAccount: l.stripe_account as string });
  if (!session.url) return { error: "Stripe didn't return a payment page." };
  return { url: session.url };
}

// ── Automatic posting (Connect webhook) ──────────────────────────────────────

const meta = (m: unknown): Record<string, string> => (m && typeof m === "object" ? (m as Record<string, string>) : {});

/** The Suite account a connected Stripe account belongs to. */
async function planForAccount(db: Db, account: string): Promise<string | null> {
  const { data } = await db.from("client_integrations").select("master_plan_id, metadata").eq("provider", "stripe").eq("external_id", account).eq("status", "connected").limit(1).maybeSingle();
  if (!data || meta(data.metadata).mode !== "connect") return null;
  return data.master_plan_id as string;
}

async function chargeOfPaymentIntent(s: Stripe, account: string, pi: unknown): Promise<string | null> {
  const id = typeof pi === "string" ? pi : (pi as { id?: string } | null)?.id;
  if (!id) return null;
  const p = await s.paymentIntents.retrieve(id, {}, { stripeAccount: account }).catch(() => null);
  const ch = p?.latest_charge;
  return typeof ch === "string" ? ch : ch?.id ?? null;
}

async function chargeOfInvoice(s: Stripe, account: string, invoiceId: string): Promise<string | null> {
  const inv = await s.invoices.retrieve(invoiceId, { expand: ["payments"] }, { stripeAccount: account }).catch(() => null);
  const pay = (inv?.payments?.data ?? []).find((p) => p.status === "paid") ?? inv?.payments?.data?.[0];
  const ref = pay?.payment as { charge?: unknown; payment_intent?: unknown } | undefined;
  if (ref?.charge) return typeof ref.charge === "string" ? ref.charge : (ref.charge as { id: string }).id;
  return ref?.payment_intent ? chargeOfPaymentIntent(s, account, ref.payment_intent) : null;
}

interface Paid {
  planId: string;
  account: string;
  livemode: boolean;
  ref: string;
  kind: "link" | "invoice" | "plan" | "subscription" | "booking";
  cents: number;
  currency: string;
  email: string | null;
  name: string | null;
  offerId: string | null;
  invoiceId: string | null;
  description: string;
  chargeId: string | null;
  /** GST/HST inside cents (task 1520 follow-up), and the customer's province (or OUTSIDE). */
  taxCents?: number;
  taxProvince?: string | null;
}

/** Open deals for this buyer are won (a deal tied to a different offer is left alone). */
async function winDeals(db: Db, planId: string, email: string, offerId: string | null) {
  const stages = await ensureStages(db as never, planId);
  const open = new Set(stages.filter((s) => s.kind === "open").map((s) => s.id));
  const { data } = await db.from("pipeline_deals").select("id, stage_id, offer_id").eq("master_plan_id", planId).ilike("email", email);
  let won = 0;
  for (const d of data ?? []) {
    if (!open.has(d.stage_id as string)) continue;
    if (offerId && d.offer_id && d.offer_id !== offerId) continue;
    await moveDeal(db, planId, d.id as string, "won", "Paid through Stripe.");
    won++;
  }
  return won;
}

/** Record one payment and post it everywhere. Safe to repeat: a payment already recorded is skipped. */
export async function postPayment(db: Db, p: Paid): Promise<"posted" | "seen"> {
  let offerName = "";
  if (p.offerId) {
    const { data: o } = await db.from("sales_offers").select("id, name").eq("id", p.offerId).eq("master_plan_id", p.planId).maybeSingle();
    if (o) offerName = o.name as string;
    else p.offerId = null;
  }
  let contactId: string | null = null;
  if (p.invoiceId) {
    const { data: inv } = await db.from("suite_invoices").select("contact_id").eq("id", p.invoiceId).maybeSingle();
    contactId = (inv?.contact_id as string) ?? null;
  }
  // Kept exactly as Stripe reports it (lowercase); never converted.
  p.currency = (p.currency || (await homeCurrency(p.planId, db))).toLowerCase();
  const { error } = await db.from("suite_payments").insert({
    master_plan_id: p.planId,
    stripe_account: p.account,
    livemode: p.livemode,
    stripe_ref: p.ref,
    stripe_charge_id: p.chargeId,
    kind: p.kind,
    amount: p.cents / 100,
    currency: p.currency,
    email: p.email,
    name: p.name,
    offer_id: p.offerId,
    invoice_id: p.invoiceId,
    description: p.description.slice(0, 300),
    tax_amount: (p.taxCents ?? 0) / 100,
    tax_province: p.taxProvince || null,
  });
  if (error) {
    if (error.code === "23505") return "seen";
    throw new Error(`save payment: ${error.message}`);
  }

  if (p.email && EMAIL_RE.test(p.email)) {
    const [first, ...rest] = (p.name || "").trim().split(/\s+/);
    const tags = ["customer", ...(offerName ? [offerTag(offerName)] : []), ...(p.livemode ? [] : ["test"])];
    const c = await upsertContact({ masterPlanId: p.planId, email: p.email, firstName: first || null, lastName: rest.join(" ") || null, source: "stripe:payment", tags }, db).catch(() => null);
    if (c) {
      contactId = contactId ?? c.id;
      await db.from("suite_payments").update({ contact_id: contactId }).eq("stripe_account", p.account).eq("stripe_ref", p.ref);
      await logEvent(p.planId, contactId, "purchase", `Paid ${money(p.cents, p.currency, await homeCurrency(p.planId, db))}${offerName ? ` for ${offerName}` : p.description ? ` for ${p.description}` : ""}${p.livemode ? "" : " (test)"}`, { suitePayment: p.ref, kind: p.kind }, db).catch(() => {});
    }
    await winDeals(db, p.planId, p.email, p.offerId).catch((e) => console.error("win deals:", e));
    // Programs sold through this offer: the buyer joins them (and gets their portal link).
    if (p.offerId && contactId) {
      const { enrollForOffer } = await import("@/lib/programs");
      await enrollForOffer(db, p.planId, p.offerId, contactId).catch((e) => console.error("program enrol:", e));
    }
  }
  // Income, fees and affiliate credit come from the sync (live payments only), so a payment is never counted twice.
  await syncStripe(p.planId).catch((e) => console.error("sync after payment:", e));
  // The sync files income at the gross amount; take the GST/HST out of it (the sync does this too for rows it adds
  // after this payment row exists, so whichever runs first, the row ends up split once).
  if ((p.taxCents ?? 0) > 0 && p.chargeId) await splitChargeIncome(db, p.planId, p.account, p.chargeId, (p.taxCents ?? 0) / 100, p.taxProvince || null, p.currency).catch((e) => console.error("tax split:", e));
  return "posted";
}

/** The Finance income row for a charge: amount before tax, tax_amount = the GST/HST (only while its tax is still 0). */
async function splitChargeIncome(db: Db, planId: string, account: string, chargeId: string, tax: number, province: string | null, currency: string) {
  const ch = await platform().charges.retrieve(chargeId, {}, { stripeAccount: account });
  const bt = typeof ch.balance_transaction === "string" ? ch.balance_transaction : ch.balance_transaction?.id;
  if (bt) await fixFinanceTax(db, planId, `stripe:${bt}`, tax, province, currency);
}

/** A refunded charge that had GST/HST: each refund's Finance row is split the same way, in proportion. */
async function splitRefunds(db: Db, planId: string, account: string, chargeId: string, pay: { amount: number; tax: number; province: string | null; currency: string }) {
  const refunds = await platform().refunds.list({ charge: chargeId, limit: 100 }, { stripeAccount: account });
  for (const r of refunds.data) {
    if (r.status !== "succeeded" && r.status !== "pending") continue;
    const bt = typeof r.balance_transaction === "string" ? r.balance_transaction : r.balance_transaction?.id;
    if (!bt) continue;
    const part = refundTaxPart(r.amount / 100, pay.amount, pay.tax);
    await fixFinanceTax(db, planId, `stripe:${bt}`, part, pay.province, pay.currency);
  }
}

/** The GST/HST in an invoice (cents): the sum of its tax lines. */
export function invoiceTaxCents(inv: { total_taxes?: { amount: number }[] | null }): number {
  return (inv.total_taxes ?? []).reduce((n, t) => n + (Number(t.amount) || 0), 0);
}

/** Handle one event from a client's connected account. The event was fetched back from Stripe, so it is genuine. */
export async function handleConnectEvent(db: Db, event: Stripe.Event): Promise<string> {
  const account = event.account;
  if (!account) return "no account";
  const planId = await planForAccount(db, account);
  if (!planId) return "unknown account";
  const s = platform();
  const opts = { stripeAccount: account };
  const now = new Date().toISOString();

  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const cs = event.data.object as Stripe.Checkout.Session;
      if (cs.mode !== "payment" || cs.payment_status !== "paid") return "not a paid one-time checkout"; // subscriptions post on invoice.paid
      const bookingId = meta(cs.metadata).lccs_booking_id;
      if (bookingId) {
        const { data: bk } = await db.from("bookings").select("id, master_plan_id, start_at, calendar_id, currency, tax_province").eq("id", bookingId).maybeSingle();
        if (!bk || bk.master_plan_id !== planId) return "booking not in this account";
        const confirmed = await confirmPaidBooking(bookingId, cs.amount_total ?? 0, cs.id);
        const { data: cal } = await db.from("booking_calendars").select("name, pay_mode").eq("id", bk.calendar_id).maybeSingle();
        const r = await postPayment(db, {
          planId, account, livemode: event.livemode, ref: cs.id, kind: "booking",
          cents: cs.amount_total ?? 0, currency: cs.currency || toCurrency(bk.currency, await homeCurrency(planId, db)),
          email: (cs.customer_details?.email || cs.customer_email || "").toLowerCase() || null, name: cs.customer_details?.name || null,
          offerId: null, invoiceId: null, description: `${cal?.name ?? "Booking"}${cal?.pay_mode === "deposit" ? " (deposit)" : ""}, ${new Date(bk.start_at as string).toISOString().slice(0, 10)}`,
          chargeId: await chargeOfPaymentIntent(s, account, cs.payment_intent),
          taxCents: cs.total_details?.amount_tax ?? 0, taxProvince: meta(cs.metadata).lccs_tax_province || (bk.tax_province as string | null) || null,
        });
        return `booking ${confirmed}, payment ${r}`;
      }
      const linkId = typeof cs.payment_link === "string" ? cs.payment_link : cs.payment_link?.id;
      let offerId: string | null = meta(cs.metadata).lccs_offer_id || null;
      if (!offerId && linkId) {
        const { data } = await db.from("offer_payment_links").select("offer_id").eq("payment_link_id", linkId).maybeSingle();
        offerId = (data?.offer_id as string) ?? null;
      }
      const r = await postPayment(db, {
        planId, account, livemode: event.livemode, ref: cs.id, kind: "link",
        cents: cs.amount_total ?? 0, currency: cs.currency || (await homeCurrency(planId, db)),
        email: (cs.customer_details?.email || cs.customer_email || "").toLowerCase() || null, name: cs.customer_details?.name || null,
        offerId, invoiceId: null, description: "", chargeId: await chargeOfPaymentIntent(s, account, cs.payment_intent),
        taxCents: cs.total_details?.amount_tax ?? 0, taxProvince: meta(cs.metadata).lccs_tax_province || null,
      });
      return r;
    }

    case "checkout.session.expired": {
      const cs = event.data.object as Stripe.Checkout.Session;
      const bookingId = meta(cs.metadata).lccs_booking_id;
      if (!bookingId) return "ignored";
      const { data: bk } = await db.from("bookings").select("master_plan_id").eq("id", bookingId).maybeSingle();
      if (bk?.master_plan_id === planId) await releaseHold(bookingId);
      return "hold released";
    }

    case "invoice.paid": {
      const inv = event.data.object as Stripe.Invoice;
      const subId = invoiceSubscriptionId(inv);
      const subMeta = meta((inv.parent as { subscription_details?: { metadata?: unknown } } | null)?.subscription_details?.metadata);
      const m = { ...subMeta, ...meta(inv.metadata) };
      let suiteInvoiceId: string | null = m.lccs_invoice_id || null;
      if (!suiteInvoiceId && inv.id) {
        const { data } = await db.from("suite_invoices").select("id").eq("stripe_invoice_id", inv.id).maybeSingle();
        suiteInvoiceId = (data?.id as string) ?? null;
      }
      if (!suiteInvoiceId && subId) {
        const { data } = await db.from("suite_invoices").select("id").eq("stripe_subscription_id", subId).maybeSingle();
        suiteInvoiceId = (data?.id as string) ?? null;
      }
      const offerId = m.lccs_offer_id || null;
      // Invoices Stripe makes for a one-time payment link are covered by checkout.session.completed.
      if (!suiteInvoiceId && !(subId && offerId)) return "not a Suite invoice";
      if ((inv.amount_paid ?? 0) <= 0) return "nothing paid";

      let kind: Paid["kind"] = "subscription";
      let description = inv.description || inv.lines?.data?.[0]?.description || "";
      let invoiceCurrency: string | null = null;
      let taxProvince: string | null = m.lccs_tax_province || null;
      if (suiteInvoiceId) {
        const { data: row } = await db.from("suite_invoices").select("id, payment_count, payments_made, description, currency, tax_province").eq("id", suiteInvoiceId).eq("master_plan_id", planId).maybeSingle();
        if (!row) return "invoice not in this account";
        kind = (row.payment_count as number) > 1 ? "plan" : "invoice";
        description = row.description as string;
        invoiceCurrency = toCurrency(row.currency);
        taxProvince = taxProvince || (row.tax_province as string | null) || null;
      } else if (Number(m.lccs_plan_payments) > 1) {
        kind = "plan";
      }
      const r = await postPayment(db, {
        planId, account, livemode: event.livemode, ref: inv.id!, kind,
        cents: inv.amount_paid, currency: inv.currency || invoiceCurrency || (await homeCurrency(planId, db)),
        email: (inv.customer_email || "").toLowerCase() || null, name: inv.customer_name || null,
        offerId, invoiceId: suiteInvoiceId, description, chargeId: await chargeOfInvoice(s, account, inv.id!),
        taxCents: invoiceTaxCents(inv), taxProvince,
      });
      if (r === "seen") return r;

      if (suiteInvoiceId) {
        const { data: row } = await db.from("suite_invoices").select("payment_count, payments_made").eq("id", suiteInvoiceId).single();
        const made = ((row?.payments_made as number) ?? 0) + 1;
        const count = (row?.payment_count as number) ?? 1;
        await db
          .from("suite_invoices")
          .update({ payments_made: made, status: count > 1 ? (made >= count ? "plan_done" : "plan_active") : "paid", paid_at: made >= count ? now : null, updated_at: now })
          .eq("id", suiteInvoiceId);
      } else if (subId && Number(m.lccs_plan_payments) > 1) {
        // A payment-plan link: stop the subscription once the last payment is in.
        const paid = await s.invoices.list({ subscription: subId, status: "paid", limit: 100 }, opts);
        if (planComplete(paid.data.length, Number(m.lccs_plan_payments))) await s.subscriptions.update(subId, { cancel_at_period_end: true }, opts);
      }
      return r;
    }

    case "invoice.finalized":
    case "invoice.sent": {
      // A later invoice in an invoice payment plan: keep the Payments page pointing at the one to pay now.
      const inv = event.data.object as Stripe.Invoice;
      const subId = invoiceSubscriptionId(inv);
      if (!subId) return "ignored";
      await db
        .from("suite_invoices")
        .update({ stripe_invoice_id: inv.id, number: inv.number, hosted_url: inv.hosted_invoice_url, pdf_url: inv.invoice_pdf, due_date: inv.due_date ? new Date(inv.due_date * 1000).toISOString().slice(0, 10) : null, updated_at: now })
        .eq("stripe_subscription_id", subId)
        .eq("master_plan_id", planId)
        .eq("status", "plan_active");
      return "updated";
    }

    case "invoice.voided":
    case "invoice.marked_uncollectible": {
      const inv = event.data.object as Stripe.Invoice;
      await db
        .from("suite_invoices")
        .update({ status: event.type === "invoice.voided" ? "void" : "uncollectible", updated_at: now })
        .eq("stripe_invoice_id", inv.id!)
        .eq("master_plan_id", planId)
        .eq("payment_count", 1);
      return "updated";
    }

    case "subscription_schedule.canceled": {
      const sch = event.data.object as Stripe.SubscriptionSchedule;
      await db.from("suite_invoices").update({ status: "plan_cancelled", updated_at: now }).eq("stripe_schedule_id", sch.id).eq("master_plan_id", planId).eq("status", "plan_active");
      return "updated";
    }

    case "customer.subscription.deleted": {
      // A membership's monthly payment was cancelled (task 1152): that member's membership access ends.
      // Payment plans also end as a subscription, but a finished payment plan keeps its course, so only plain
      // subscriptions sold through an offer count here.
      const sub = event.data.object as Stripe.Subscription;
      const m = meta(sub.metadata);
      if (!m.lccs_offer_id || m.lccs_plan_payments) return "not a membership";
      const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
      const customer = await s.customers.retrieve(customerId, {}, opts).catch(() => null);
      const email = customer && !("deleted" in customer && customer.deleted) ? String((customer as Stripe.Customer).email || "").toLowerCase() : "";
      if (!email) return "no customer email";
      const { data: c } = await db.from("seq_contacts").select("id").eq("master_plan_id", planId).eq("email", email).maybeSingle();
      if (!c) return "no contact";
      const { endMembershipsForOffer } = await import("@/lib/programs");
      const n = await endMembershipsForOffer(db, planId, m.lccs_offer_id, c.id as string);
      return `memberships ended: ${n}`;
    }

    case "charge.refunded": {
      const ch = event.data.object as Stripe.Charge;
      const { data: pay } = await db.from("suite_payments").select("id, contact_id, amount, currency, tax_amount, tax_province").eq("stripe_account", account).eq("stripe_charge_id", ch.id).maybeSingle();
      if (pay) {
        await db.from("suite_payments").update({ refunded: (ch.amount_refunded ?? 0) / 100 }).eq("id", pay.id);
        if (pay.contact_id) await logEvent(planId, pay.contact_id as string, "purchase", `Refunded ${money(ch.amount_refunded ?? 0, ch.currency || (pay.currency as string), await homeCurrency(planId, db))}${event.livemode ? "" : " (test)"}`, { charge: ch.id }, db).catch(() => {});
      }
      await syncStripe(planId).catch(() => null); // the refund (and any affiliate credit it voids) reaches the books
      if (pay && Number(pay.tax_amount) > 0)
        await splitRefunds(db, planId, account, ch.id, { amount: Number(pay.amount), tax: Number(pay.tax_amount), province: (pay.tax_province as string | null) ?? null, currency: String(pay.currency || "") }).catch((e) => console.error("refund tax split:", e));
      return pay ? "refund recorded" : "refund (no payment row)";
    }

    default:
      return "ignored";
  }
}

/** The events the Connect webhook endpoint should send. */
export const CONNECT_EVENTS = [
  "checkout.session.completed",
  "checkout.session.expired",
  "checkout.session.async_payment_succeeded",
  "invoice.paid",
  "invoice.finalized",
  "invoice.sent",
  "invoice.voided",
  "invoice.marked_uncollectible",
  "subscription_schedule.canceled",
  "customer.subscription.deleted",
  "charge.refunded",
] as const;
