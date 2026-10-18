import type { ActionCtx, ActionTool } from "./types";
import { ALIGNMENT_ARCHITECT_EMAIL } from "@/lib/authz";
import { PAYMENTS_OPEN_TO_ALL } from "@/lib/paymentsFlag";
import { createOfferLink, deactivateOfferLink, getConnection, linkPlan, type OfferForLink } from "@/lib/stripeConnect";
import { cancelInvoice, createInvoice, invoicePlan, MAX_PAYMENTS } from "@/lib/suitePayments";

// Get paid inside the Suite (task 1146), for the assistant: look up payments and unpaid invoices, and, behind Approve,
// send an invoice or make an offer's payment link. Everything happens on the client's OWN connected Stripe account.

const str = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");
const usd = (n: number) => `$${Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const OFF = "Payments aren't switched on for this account yet.";
const open = (ctx: ActionCtx) => PAYMENTS_OPEN_TO_ALL || (ctx.userEmail || "").toLowerCase() === ALIGNMENT_ARCHITECT_EMAIL;
const LINKS = [{ label: "Open Payments & Invoices", href: "/payments" }];

async function contactFor(ctx: ActionCtx, email: string) {
  const { data } = await ctx.db.from("seq_contacts").select("id, email, first_name, last_name").eq("master_plan_id", ctx.planId).eq("email", email.toLowerCase()).maybeSingle();
  return data as { id: string; email: string; first_name: string | null; last_name: string | null } | null;
}
async function offerByName(ctx: ActionCtx, name: string) {
  if (!name) return null;
  const { data } = await ctx.db.from("sales_offers").select("id, name, price, billing, payment_count").eq("master_plan_id", ctx.planId).ilike("name", name).limit(1).maybeSingle();
  return data as OfferForLink | null;
}

export const listPayments: ActionTool = {
  name: "list_payments",
  kind: "read",
  apiPath: "/api/payments",
  description: "List recent payments taken through the Suite (payment links, invoices, payment plans, paid bookings) and the invoices still unpaid.",
  parameters: { type: "object", properties: { email: { type: "string", description: "Only this person (optional)." } } },
  read: async (args, ctx) => {
    if (!open(ctx)) return OFF;
    const email = str(args.email, 200).toLowerCase();
    let pays = ctx.db.from("suite_payments").select("amount, refunded, kind, email, name, description, paid_at, livemode").eq("master_plan_id", ctx.planId).order("paid_at", { ascending: false }).limit(25);
    let invs = ctx.db.from("suite_invoices").select("email, name, description, amount, payment_count, payments_made, status, due_date").eq("master_plan_id", ctx.planId).in("status", ["open", "plan_active"]).order("created_at", { ascending: false }).limit(25);
    if (email) {
      pays = pays.eq("email", email);
      invs = invs.eq("email", email);
    }
    const [{ data: p }, { data: i }] = await Promise.all([pays, invs]);
    const lines = [
      "Payments (newest first):",
      ...((p ?? []).length ? (p ?? []).map((x) => `${String(x.paid_at).slice(0, 10)} | ${usd(x.amount)}${Number(x.refunded) > 0 ? ` (refunded ${usd(x.refunded)})` : ""} | ${x.name || x.email || "someone"} | ${x.kind}${x.description ? ` | ${x.description}` : ""}${x.livemode ? "" : " | TEST"}`) : ["none yet"]),
      "Unpaid invoices and running payment plans:",
      ...((i ?? []).length ? (i ?? []).map((x) => `${x.name || x.email} | ${x.description} | ${usd(x.amount)} | ${x.payment_count > 1 ? `plan, ${x.payments_made} of ${x.payment_count} paid` : `due ${x.due_date ?? "?"}`}`) : ["none"]),
    ];
    return lines.join("\n");
  },
};

const INVOICE_PROPS = {
  email: { type: "string", description: "The contact's email (they must already be in Contacts)." },
  description: { type: "string", description: "What the invoice is for." },
  amount: { type: "number", description: "The total in US dollars." },
  payment_count: { type: "number", description: `1 = paid in full (default); 2 to ${MAX_PAYMENTS} = that many monthly payments of total / N, then it stops.` },
  days_until_due: { type: "number", description: "Days to pay each invoice (default 7)." },
  offer_name: { type: "string", description: "The offer this is for (optional, exact name from list_offers)." },
};

export const sendInvoice: ActionTool = {
  name: "send_invoice",
  kind: "write",
  apiPath: "/api/payments",
  description: "Send a contact an invoice from the client's own Stripe account (or an invoice payment plan of N monthly payments). The client approves first; Stripe emails it.",
  parameters: { type: "object", properties: INVOICE_PROPS, required: ["email", "description", "amount"] },
  plan: async (args, ctx) => {
    if (!open(ctx)) return { error: OFF };
    if (!(await getConnection(ctx.db, ctx.planId))) return { error: "Connect Stripe first in Settings › Integrations." };
    const c = await contactFor(ctx, str(args.email, 200));
    if (!c) return { error: "That person isn't in Contacts yet. Add them first." };
    const p = invoicePlan({ email: c.email, description: str(args.description, 500), amount: Number(args.amount), paymentCount: Number(args.payment_count) || 1, daysUntilDue: Number(args.days_until_due) || 7 });
    if (!p.ok) return { error: p.reason };
    const offer = await offerByName(ctx, str(args.offer_name, 200));
    const name = [c.first_name, c.last_name].filter(Boolean).join(" ") || c.email;
    return { preview: { title: `Send ${name} an invoice`, lines: [`For: ${str(args.description, 500)}`, p.note, `To: ${c.email}`, ...(offer ? [`Offer: ${offer.name}`] : []), "Stripe emails it from your own Stripe account."], links: LINKS } };
  },
  run: async (args, ctx) => {
    if (!open(ctx)) throw new Error(OFF);
    const conn = await getConnection(ctx.db, ctx.planId);
    if (!conn) throw new Error("Connect Stripe first in Settings › Integrations.");
    const c = await contactFor(ctx, str(args.email, 200));
    if (!c) throw new Error("That person isn't in Contacts.");
    const offer = await offerByName(ctx, str(args.offer_name, 200));
    const inv = await createInvoice(
      ctx.db,
      ctx.planId,
      conn,
      { email: c.email, name: [c.first_name, c.last_name].filter(Boolean).join(" ") || null, description: str(args.description, 500), amount: Number(args.amount), paymentCount: Number(args.payment_count) || 1, daysUntilDue: Number(args.days_until_due) || 7 },
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
  description: "Make (or remake) the payment link for one of the client's offers, on their own Stripe account: paid in full, monthly, or a payment plan that stops after the last payment. The client approves first.",
  parameters: { type: "object", properties: { offer_name: { type: "string", description: "Exact offer name from list_offers." } }, required: ["offer_name"] },
  plan: async (args, ctx) => {
    if (!open(ctx)) return { error: OFF };
    if (!(await getConnection(ctx.db, ctx.planId))) return { error: "Connect Stripe first in Settings › Integrations." };
    const o = await offerByName(ctx, str(args.offer_name, 200));
    if (!o) return { error: "I couldn't find that offer." };
    const p = linkPlan({ ...o, price: o.price === null ? null : Number(o.price) });
    if (!p.ok) return { error: p.reason };
    return { preview: { title: `Make a payment link for "${o.name}"`, lines: [p.note, "Payments go straight to your own Stripe account."], links: [{ label: "Open Offers & Packages", href: "/sales/offers" }] } };
  },
  run: async (args, ctx) => {
    if (!open(ctx)) throw new Error(OFF);
    const conn = await getConnection(ctx.db, ctx.planId);
    const o = await offerByName(ctx, str(args.offer_name, 200));
    if (!conn || !o) throw new Error("Stripe isn't connected or the offer is gone.");
    const link = await createOfferLink(ctx.db, ctx.planId, conn, { ...o, price: o.price === null ? null : Number(o.price) });
    return { summary: `Made the payment link for "${o.name}": ${link.url}`, result: { url: link.url }, undo: { offerId: o.id } };
  },
  undo: async (u, ctx) => ((await deactivateOfferLink(ctx.db, ctx.planId, String(u.offerId || ""))) ? "Turned the payment link off." : "There was no link to turn off."),
};

export const PAYMENT_TOOLS: ActionTool[] = [listPayments, sendInvoice, createPaymentLink];
