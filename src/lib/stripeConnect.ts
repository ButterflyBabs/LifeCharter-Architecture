import Stripe from "stripe";
import { createHmac, timingSafeEqual } from "crypto";
import { createServerClient } from "@/lib/supabase/server";
import { toCurrency } from "@/lib/currency";

// Get paid inside the Suite, step a (task 1146): "Connect with Stripe". Step b (invoices, plans, posting): suitePayments.ts.
//
// Babs's rule (2026-10-18): each client connects THEIR OWN Stripe account, and SKC LLC never processes transactions for
// other accounts. So clients connect a Standard account through Stripe's OAuth, and everything the Suite creates for
// them (products, prices, payment links, later invoices) is created ON their account with the Stripe-Account header:
// direct charges, no platform fee, no destination charges or transfers. The money goes straight to the client.
//
// Configuration (Vercel):
//   STRIPE_CONNECT_CLIENT_ID   ca_... from the Suite Stripe account's Connect settings (OAuth)
//   STRIPE_CONNECT_SECRET_KEY  optional: a different platform key (e.g. sk_test_ while testing); else STRIPE_SECRET_KEY
//
// The connection is stored on the client's Stripe row in client_integrations (provider "stripe"):
//   external_id = acct_..., api_key = "" (no key is ever stored), metadata.mode = "connect", metadata.livemode.
// The daily sync (stripeSync.ts) reads payments from a connected account the same way it reads a pasted key's.

type Db = ReturnType<typeof createServerClient>;
export const STRIPE_API_VERSION = "2026-06-24.dahlia";
const SITE = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://lccommandsuite.com";
export const CONNECT_REDIRECT = `${SITE}/api/stripe-connect/callback`;

const platformKey = () => (process.env.STRIPE_CONNECT_SECRET_KEY || process.env.STRIPE_SECRET_KEY || "").trim();
const clientId = () => (process.env.STRIPE_CONNECT_CLIENT_ID || "").trim();
export const connectConfigured = () => Boolean(platformKey() && clientId());
export const platformTestMode = () => platformKey().startsWith("sk_test_") || platformKey().startsWith("rk_test_");

let cached: Stripe | null = null;
export function platform(): Stripe {
  if (!cached) cached = new Stripe(platformKey(), { apiVersion: STRIPE_API_VERSION as Stripe.LatestApiVersion });
  return cached;
}
/** The platform key and the client's account, for code that calls Stripe's API directly (the sync). */
export const connectedCredentials = (accountId: string) => ({ key: platformKey(), account: accountId });

// ── OAuth ────────────────────────────────────────────────────────────────────
const stateKey = () => `stripe-connect:${platformKey()}`;
export function connectState(planId: string): string {
  const ts = Date.now().toString(36);
  const sig = createHmac("sha256", stateKey()).update(`${planId}.${ts}`).digest("hex").slice(0, 32);
  return `${planId}.${ts}.${sig}`;
}
/** The account a state was made for, if genuine and under an hour old. */
export function readConnectState(state: string): string | null {
  const [planId, ts, sig] = (state || "").split(".");
  if (!planId || !ts || !sig) return null;
  const want = createHmac("sha256", stateKey()).update(`${planId}.${ts}`).digest("hex").slice(0, 32);
  if (want.length !== sig.length || !timingSafeEqual(Buffer.from(want), Buffer.from(sig))) return null;
  if (Date.now() - parseInt(ts, 36) > 3600_000) return null;
  return planId;
}
export function connectUrl(planId: string, email?: string | null): string {
  const u = new URL("https://connect.stripe.com/oauth/authorize");
  u.searchParams.set("response_type", "code");
  u.searchParams.set("client_id", clientId());
  u.searchParams.set("scope", "read_write");
  u.searchParams.set("redirect_uri", CONNECT_REDIRECT);
  u.searchParams.set("state", connectState(planId));
  if (email) u.searchParams.set("stripe_user[email]", email);
  return u.toString();
}

export interface Connection { accountId: string; livemode: boolean; name: string; mode: "connect" | "key" }

/** Finish "Connect with Stripe": swap the code for the client's account id and save it (no keys stored). */
export async function finishConnect(db: Db, planId: string, code: string): Promise<Connection> {
  const tok = await platform().oauth.token({ grant_type: "authorization_code", code });
  const accountId = tok.stripe_user_id;
  if (!accountId) throw new Error("Stripe did not return an account.");
  let name = "";
  try {
    const acct = await platform().accounts.retrieve(accountId);
    name = acct.settings?.dashboard?.display_name || acct.business_profile?.name || "";
  } catch {
    /* the name is only for display */
  }
  const now = new Date().toISOString();
  const { data: existing } = await db.from("client_integrations").select("id, metadata").eq("master_plan_id", planId).eq("provider", "stripe").maybeSingle();
  const metadata = { ...((existing?.metadata as Record<string, unknown>) ?? {}), mode: "connect", livemode: Boolean(tok.livemode), account_name: name, connected_via: "oauth", connected_at: now };
  const row = { master_plan_id: planId, provider: "stripe", api_key: "", external_id: accountId, status: "connected", metadata, updated_at: now };
  const { error } = existing?.id
    ? await db.from("client_integrations").update(row).eq("id", existing.id)
    : await db.from("client_integrations").insert({ ...row, connected_at: now });
  if (error) throw new Error(`save: ${error.message}`);
  return { accountId, livemode: Boolean(tok.livemode), name, mode: "connect" };
}

/** The client's connected Stripe account (Connect only; a pasted read-only key cannot create links). */
export async function getConnection(db: Db, planId: string): Promise<Connection | null> {
  const { data } = await db.from("client_integrations").select("external_id, status, metadata").eq("master_plan_id", planId).eq("provider", "stripe").maybeSingle();
  const meta = (data?.metadata as Record<string, unknown>) ?? {};
  if (!data || data.status !== "connected" || meta.mode !== "connect" || !data.external_id) return null;
  return { accountId: data.external_id as string, livemode: meta.livemode === true, name: (meta.account_name as string) || "", mode: "connect" };
}

/** Disconnect: Stripe stops letting the Suite act on the account; payments already synced stay in Finance. */
export async function disconnect(db: Db, planId: string): Promise<void> {
  const c = await getConnection(db, planId);
  if (c && clientId()) {
    try {
      await platform().oauth.deauthorize({ client_id: clientId(), stripe_user_id: c.accountId });
    } catch (e) {
      console.error("stripe deauthorize:", e instanceof Error ? e.message : e);
    }
  }
  await db.from("offer_payment_links").update({ active: false, updated_at: new Date().toISOString() }).eq("master_plan_id", planId).eq("active", true);
  await db.from("client_integrations").update({ status: "disconnected", updated_at: new Date().toISOString() }).eq("master_plan_id", planId).eq("provider", "stripe");
}

// ── Payment links ────────────────────────────────────────────────────────────
export type LinkKind = "one_time" | "monthly" | "payment_plan";
// currency: the offer's own (task 1520). Optional so older callers compile; createOfferLink reads it from the offer when missing.
export interface OfferForLink { id: string; name: string; price: number | null; billing: LinkKind; payment_count: number | null; currency?: string | null }

/** What a link would charge, or why it can't be made yet. */
export function linkPlan(o: OfferForLink): { ok: true; kind: LinkKind; cents: number; count: number; note: string } | { ok: false; reason: string } {
  if (o.price === null || !(o.price > 0)) return { ok: false, reason: "Add a price to this offer first." };
  const cur = toCurrency(o.currency).toUpperCase();
  if (o.billing === "payment_plan") {
    // The offer's price is the total; each monthly payment is total / N, and the plan stops itself after payment N.
    const count = Math.floor(Number(o.payment_count) || 0);
    if (count < 2 || count > 24) return { ok: false, reason: "Set the number of payments (2 to 24) on this offer first." };
    const per = Math.round((o.price * 100) / count);
    if (per < 50) return { ok: false, reason: "Stripe's smallest charge is $0.50 per payment." };
    return { ok: true, kind: "payment_plan", cents: per, count, note: `${count} monthly payments of ${(per / 100).toFixed(2)} ${cur}, then it stops` };
  }
  const cents = Math.round(o.price * 100);
  if (cents < 50) return { ok: false, reason: "Stripe's smallest charge is $0.50." };
  if (o.billing === "monthly") return { ok: true, kind: "monthly", cents, count: 0, note: `${(cents / 100).toFixed(2)} ${cur} every month until cancelled` };
  return { ok: true, kind: "one_time", cents, count: 1, note: `${(cents / 100).toFixed(2)} ${cur}, paid in full` };
}

/** Create the offer's payment link ON the client's own Stripe account (direct charge, no platform fee). */
export async function createOfferLink(db: Db, planId: string, c: Connection, o: OfferForLink) {
  // The price is charged in the offer's own currency, never a hard-coded one.
  let currency = o.currency ? toCurrency(o.currency) : null;
  if (!currency) {
    const { data } = await db.from("sales_offers").select("currency").eq("id", o.id).eq("master_plan_id", planId).maybeSingle();
    currency = toCurrency((data as { currency?: string } | null)?.currency);
  }
  const plan = linkPlan({ ...o, currency });
  if (!plan.ok) throw new Error(plan.reason);
  const opts = { stripeAccount: c.accountId };
  const s = platform();
  const product = await s.products.create({ name: o.name.slice(0, 250), metadata: { lccs_offer_id: o.id, lccs_plan_id: planId } }, opts);
  const price = await s.prices.create(
    { product: product.id, currency, unit_amount: plan.cents, ...(plan.kind !== "one_time" ? { recurring: { interval: "month" as const } } : {}), metadata: { lccs_offer_id: o.id } },
    opts,
  );
  const link = await s.paymentLinks.create(
    {
      line_items: [{ price: price.id, quantity: 1 }],
      metadata: { lccs_offer_id: o.id, lccs_plan_id: planId, lccs_kind: plan.kind },
      ...(plan.kind === "one_time"
        ? { customer_creation: "always" as const, invoice_creation: { enabled: true } }
        : // The webhook reads these off each subscription invoice: which offer, and (plans) when to stop.
          { subscription_data: { metadata: { lccs_offer_id: o.id, lccs_plan_id: planId, ...(plan.kind === "payment_plan" ? { lccs_plan_payments: String(plan.count) } : {}) } } }),
    },
    opts,
  );
  await db.from("offer_payment_links").update({ active: false, updated_at: new Date().toISOString() }).eq("offer_id", o.id).eq("active", true);
  const { data, error } = await db
    .from("offer_payment_links")
    .insert({ master_plan_id: planId, offer_id: o.id, stripe_account: c.accountId, livemode: c.livemode, kind: plan.kind, amount: plan.cents / 100, currency, payment_count: plan.kind === "payment_plan" ? plan.count : null, product_id: product.id, price_id: price.id, payment_link_id: link.id, url: link.url })
    .select("id, url, kind, amount, currency, livemode, created_at")
    .single();
  if (error) throw new Error(`save link: ${error.message}`);
  return data;
}

/** Turn an offer's link off in Stripe (the address stops taking payments) and here. */
export async function deactivateOfferLink(db: Db, planId: string, offerId: string): Promise<boolean> {
  const { data: row } = await db.from("offer_payment_links").select("id, stripe_account, payment_link_id").eq("master_plan_id", planId).eq("offer_id", offerId).eq("active", true).maybeSingle();
  if (!row) return false;
  try {
    await platform().paymentLinks.update(row.payment_link_id as string, { active: false }, { stripeAccount: row.stripe_account as string });
  } catch (e) {
    console.error("deactivate payment link:", e instanceof Error ? e.message : e);
  }
  await db.from("offer_payment_links").update({ active: false, updated_at: new Date().toISOString() }).eq("id", row.id);
  return true;
}
