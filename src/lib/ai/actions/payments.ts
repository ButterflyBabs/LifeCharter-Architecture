import type { ActionCtx, ActionTool } from "./types";
import { ALIGNMENT_ARCHITECT_EMAIL } from "@/lib/authz";
import { PAYMENTS_OPEN_TO_ALL } from "@/lib/paymentsFlag";
import { createOfferLink, deactivateOfferLink, getConnection, linkPlan, type OfferForLink } from "@/lib/stripeConnect";
import { cancelInvoice, createInvoice, invoicePlan, MAX_PAYMENTS, taxState } from "@/lib/suitePayments";
import { PROVINCES, isTaxPlace, placeFromAddress, type TaxPlace } from "@/lib/salesTax";
import { formatMoney, isCurrency, toCurrency, type Currency } from "@/lib/currency";
import { homeCurrency } from "@/lib/currencyServer";

// Get paid inside the Suite (task 1146), for the assistant: look up payments and unpaid invoices, and, behind Approve,
// send an invoice or make an offer's payment link. Everything happens on the client's OWN connected Stripe account.

const str = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");
/** An amount in its own currency, with cents ("$1,500.00"; "CA$1,500.00" on a USD account). Never combined across currencies. */
const money = (n: number, currency: unknown, home: Currency) => formatMoney(Number(n), toCurrency(currency, home), { home, cents: true });
/** The currency asked for (USD/CAD), else the account's home currency. */
const pickCurrency = (v: unknown, home: Currency): Currency => (isCurrency(v) ? toCurrency(v) : home);
const OFF = "Payments aren't switched on for this account yet.";
const open = (ctx: ActionCtx) => PAYMENTS_OPEN_TO_ALL || (ctx.userEmail || "").toLowerCase() === ALIGNMENT_ARCHITECT_EMAIL;
const LINKS = [{ label: "Open Payments & Invoices", href: "/payments" }];

async function contactFor(ctx: ActionCtx, email: string) {
  const { data } = await ctx.db.from("seq_contacts").select("id, email, first_name, last_name, region, country").eq("master_plan_id", ctx.planId).eq("email", email.toLowerCase()).maybeSingle();
  return data as { id: string; email: string; first_name: string | null; last_name: string | null; region: string | null; country: string | null } | null;
}
async function offerByName(ctx: ActionCtx, name: string) {
  if (!name) return null;
  const { data } = await ctx.db.from("sales_offers").select("id, name, price, billing, payment_count, currency, pst_applies").eq("master_plan_id", ctx.planId).ilike("name", name).limit(1).maybeSingle();
  return data as (OfferForLink & { pst_applies?: boolean | null }) | null;
}

export const listPayments: ActionTool = {
  name: "list_payments",
  kind: "read",
  apiPath: "/api/payments",
  description: "List recent payments taken through the Suite (payment links, invoices, payment plans, paid bookings) and the invoices still unpaid. Each amount shows its own currency (US or Canadian dollars); never add amounts in different currencies together.",
  parameters: { type: "object", properties: { email: { type: "string", description: "Only this person (optional)." } } },
  read: async (args, ctx) => {
    if (!open(ctx)) return OFF;
    const email = str(args.email, 200).toLowerCase();
    let pays = ctx.db.from("suite_payments").select("amount, currency, refunded, kind, email, name, description, paid_at, livemode").eq("master_plan_id", ctx.planId).order("paid_at", { ascending: false }).limit(25);
    let invs = ctx.db.from("suite_invoices").select("email, name, description, amount, currency, payment_count, payments_made, status, due_date").eq("master_plan_id", ctx.planId).in("status", ["open", "plan_active"]).order("created_at", { ascending: false }).limit(25);
    if (email) {
      pays = pays.eq("email", email);
      invs = invs.eq("email", email);
    }
    const [{ data: p }, { data: i }, home] = await Promise.all([pays, invs, homeCurrency(ctx.planId, ctx.db)]);
    const lines = [
      "Payments (newest first):",
      ...((p ?? []).length ? (p ?? []).map((x) => `${String(x.paid_at).slice(0, 10)} | ${money(x.amount, x.currency, home)} ${String(x.currency || home).toUpperCase()}${Number(x.refunded) > 0 ? ` (refunded ${money(x.refunded, x.currency, home)})` : ""} | ${x.name || x.email || "someone"} | ${x.kind}${x.description ? ` | ${x.description}` : ""}${x.livemode ? "" : " | TEST"}`) : ["none yet"]),
      "Unpaid invoices and running payment plans:",
      ...((i ?? []).length ? (i ?? []).map((x) => `${x.name || x.email} | ${x.description} | ${money(x.amount, x.currency, home)} ${String(x.currency || home).toUpperCase()} | ${x.payment_count > 1 ? `plan, ${x.payments_made} of ${x.payment_count} paid` : `due ${x.due_date ?? "?"}`}`) : ["none"]),
    ];
    return lines.join("\n");
  },
};

const INVOICE_PROPS = {
  email: { type: "string", description: "The contact's email (they must already be in Contacts)." },
  description: { type: "string", description: "What the invoice is for." },
  amount: { type: "number", description: "The total, in the invoice's currency." },
  currency: { type: "string", enum: ["usd", "cad"], description: "US dollars (usd) or Canadian dollars (cad). Optional: defaults to the offer's currency when an offer is named, else the account's home currency." },
  payment_count: { type: "number", description: `1 = paid in full (default); 2 to ${MAX_PAYMENTS} = that many monthly payments of total / N, then it stops.` },
  days_until_due: { type: "number", description: "Days to pay each invoice (default 7)." },
  offer_name: { type: "string", description: "The offer this is for (optional, exact name from list_offers)." },
  customer_place: { type: "string", enum: [...PROVINCES.map((p) => p.code), "OUTSIDE"], description: "Only for accounts that charge GST/HST or a provincial sales tax: where the customer is (province code, or OUTSIDE for outside Canada). Optional when the contact's address already says; the amount is always before tax." },
  pst_applies: { type: "boolean", description: "Only for accounts registered for BC, Saskatchewan or Manitoba sales tax, and only when the client says so: provincial sales tax applies to this invoice. Leave out to use the named offer's own setting (off when no offer). Never decide this yourself." },
};

/**
 * Sales tax: the place to tax this invoice for (asked → the contact's address), whether GST/HST is on, the provincial
 * registrations, and the PST/RST tick (asked → the offer's own; off without a BC/SK/MB registration).
 */
async function invoicePlace(args: Record<string, unknown>, ctx: ActionCtx, c: { region: string | null; country: string | null }, offer: { pst_applies?: boolean | null } | null) {
  const ts = await taxState(ctx.db, ctx.planId);
  const pstApplies = ts.pstTick ? (typeof args.pst_applies === "boolean" ? args.pst_applies : Boolean(offer?.pst_applies)) : false;
  if (!ts.collects) return { on: false, gst: false, provincial: ts.provincial, place: null as TaxPlace | null, pstApplies };
  const asked = String(args.customer_place || "").trim().toUpperCase();
  return { on: true, gst: ts.gstOn, provincial: ts.provincial, place: isTaxPlace(asked) ? asked : placeFromAddress(c.region, c.country), pstApplies };
}

export const sendInvoice: ActionTool = {
  name: "send_invoice",
  kind: "write",
  apiPath: "/api/payments",
  description: "Send a contact an invoice from the client's own Stripe account (or an invoice payment plan of N monthly payments). The client approves first; Stripe emails it. If the account charges GST/HST or a provincial sales tax (QST, PST, RST), the amount is before tax and each tax is added for where the customer is (customer_place, or the contact's address); PST/RST only when pst_applies (or the offer's own setting) says so.",
  parameters: { type: "object", properties: INVOICE_PROPS, required: ["email", "description", "amount"] },
  plan: async (args, ctx) => {
    if (!open(ctx)) return { error: OFF };
    if (!(await getConnection(ctx.db, ctx.planId))) return { error: "Connect Stripe first in Settings › Integrations." };
    const c = await contactFor(ctx, str(args.email, 200));
    if (!c) return { error: "That person isn't in Contacts yet. Add them first." };
    const offer = await offerByName(ctx, str(args.offer_name, 200));
    const home = await homeCurrency(ctx.planId, ctx.db);
    const currency = pickCurrency(args.currency, offer ? toCurrency(offer.currency, home) : home);
    const tax = await invoicePlace(args, ctx, c, offer);
    if (tax.on && !tax.place) return { error: `You charge ${tax.gst ? "GST/HST" : "sales tax"}, and I can't tell where this customer is. Which province are they in (or are they outside Canada)?` };
    const p = invoicePlan({ email: c.email, description: str(args.description, 500), amount: Number(args.amount), paymentCount: Number(args.payment_count) || 1, daysUntilDue: Number(args.days_until_due) || 7, currency, home, chargeTax: tax.gst, taxPlace: tax.place, provincial: tax.provincial, pstApplies: tax.pstApplies });
    if (!p.ok) return { error: p.reason };
    const name = [c.first_name, c.last_name].filter(Boolean).join(" ") || c.email;
    const t = p.tax;
    const added = t ? [...(t.rate > 0 ? [`${t.label} (${money(t.cents / 100, currency, home)} in all)`] : []), ...(t.prov ? [`${t.prov.label} (${money(t.prov.cents / 100, currency, home)} in all)`] : [])] : [];
    const taxLine = t
      ? [t.place === "OUTSIDE" ? `Customer is outside Canada: no ${tax.gst ? "GST/HST" : "sales tax"}.` : `Customer is in ${PROVINCES.find((x) => x.code === t.place)?.name}: ${added.length ? `${added.join(" and ")} added.` : "no sales tax added."}`]
      : [];
    return { preview: { title: `Send ${name} an invoice`, lines: [`For: ${str(args.description, 500)}`, p.note, ...taxLine, `Currency: ${currency.toUpperCase()}`, `To: ${c.email}`, ...(offer ? [`Offer: ${offer.name}`] : []), "Stripe emails it from your own Stripe account."], links: LINKS } };
  },
  run: async (args, ctx) => {
    if (!open(ctx)) throw new Error(OFF);
    const conn = await getConnection(ctx.db, ctx.planId);
    if (!conn) throw new Error("Connect Stripe first in Settings › Integrations.");
    const c = await contactFor(ctx, str(args.email, 200));
    if (!c) throw new Error("That person isn't in Contacts.");
    const offer = await offerByName(ctx, str(args.offer_name, 200));
    const currency = pickCurrency(args.currency, offer ? toCurrency(offer.currency, await homeCurrency(ctx.planId, ctx.db)) : await homeCurrency(ctx.planId, ctx.db));
    const tax = await invoicePlace(args, ctx, c, offer);
    const inv = await createInvoice(
      ctx.db,
      ctx.planId,
      conn,
      { email: c.email, name: [c.first_name, c.last_name].filter(Boolean).join(" ") || null, description: str(args.description, 500), amount: Number(args.amount), paymentCount: Number(args.payment_count) || 1, daysUntilDue: Number(args.days_until_due) || 7, currency, taxPlace: tax.place, pstApplies: tax.pstApplies },
      { contactId: c.id, offerId: offer?.id ?? null },
    );
    return { summary: `Sent the invoice to ${c.email}.`, result: { id: inv?.id, url: inv?.hosted_url }, undo: { id: inv?.id } };
  },
  undo: async (u, ctx) => ((await cancelInvoice(ctx.db, ctx.planId, String(u.id || ""))) ? "Voided the invoice (or stopped the plan)." : "That invoice can't be voided now (it may be paid)."),
};

export const createPaymentLink: ActionTool = {
  name: "create_payment_link",
  kind: "write",
  apiPath: "/api/offers",
  description: "Make (or remake) the payment link for one of the client's offers, on their own Stripe account: paid in full, monthly, or a payment plan that stops after the last payment. The link charges in the offer's own currency. If the account charges GST/HST, the link is a short pay page where the buyer picks their province before Stripe Checkout (the tax is added there). The client approves first.",
  parameters: {
    type: "object",
    properties: {
      offer_name: { type: "string", description: "Exact offer name from list_offers." },
      currency: { type: "string", enum: ["usd", "cad"], description: "Optional check: the currency the client expects. The link always uses the offer's currency; if this differs, nothing is made and the client is told to change the offer's currency first." },
    },
    required: ["offer_name"],
  },
  plan: async (args, ctx) => {
    if (!open(ctx)) return { error: OFF };
    if (!(await getConnection(ctx.db, ctx.planId))) return { error: "Connect Stripe first in Settings › Integrations." };
    const o = await offerByName(ctx, str(args.offer_name, 200));
    if (!o) return { error: "I couldn't find that offer." };
    const cur = toCurrency(o.currency, await homeCurrency(ctx.planId, ctx.db));
    if (isCurrency(args.currency) && toCurrency(args.currency) !== cur) return { error: `"${o.name}" is priced in ${cur.toUpperCase()}. Change the offer's currency on Offers & Packages first, then make the link.` };
    const p = linkPlan({ ...o, price: o.price === null ? null : Number(o.price) });
    if (!p.ok) return { error: p.reason };
    const ts = await taxState(ctx.db, ctx.planId);
    const taxLines = ts.collects ? [`You charge ${ts.gstOn ? "GST/HST" : "sales tax"}, so the link opens a short page of your own: the buyer picks their province (or Outside Canada), sees the tax and the total, then pays with Stripe. The price above is before tax.`] : [];
    return { preview: { title: `Make a payment link for "${o.name}"`, lines: [p.note, `Currency: ${cur.toUpperCase()}`, ...taxLines, "Payments go straight to your own Stripe account."], links: [{ label: "Open Offers & Packages", href: "/sales/offers" }] } };
  },
  run: async (args, ctx) => {
    if (!open(ctx)) throw new Error(OFF);
    const conn = await getConnection(ctx.db, ctx.planId);
    const o = await offerByName(ctx, str(args.offer_name, 200));
    if (!conn || !o) throw new Error("Stripe isn't connected or the offer is gone.");
    if (isCurrency(args.currency) && toCurrency(args.currency) !== toCurrency(o.currency, await homeCurrency(ctx.planId, ctx.db))) throw new Error("The offer's currency changed; make the link again.");
    const link = await createOfferLink(ctx.db, ctx.planId, conn, { ...o, price: o.price === null ? null : Number(o.price) });
    return { summary: `Made the payment link for "${o.name}": ${link.url}`, result: { url: link.url }, undo: { offerId: o.id } };
  },
  undo: async (u, ctx) => ((await deactivateOfferLink(ctx.db, ctx.planId, String(u.offerId || ""))) ? "Turned the payment link off." : "There was no link to turn off."),
};

export const PAYMENT_TOOLS: ActionTool[] = [listPayments, sendInvoice, createPaymentLink];
