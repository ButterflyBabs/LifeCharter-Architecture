// Server-only: buying something through Stripe unlocks its Collective channel(s)
// with no invite code (co022). Admins map a Stripe price / product / Payment Link
// id, or a Payment Link metadata value (metadata key "collective_access"), to
// channels in cm_purchase_access (Admin → Purchase access).
//
// For each purchase the webhook records one cm_purchase_grants row per channel,
// unique on (stripe_ref, space_id), so a Stripe retry never double-grants or
// double-emails. A buyer who already has a LifeCharter account is added to the
// channel right away; otherwise the grant waits for that email and is applied by
// the database the moment their Collective profile is created (or when they
// sign in: cm_claim_purchase_access). Either way they get one email.
import type Stripe from "stripe";
import { createServerClient } from "@/lib/supabase/server";
import { upsertContact, logEvent } from "@/lib/crm";
import { ownerMasterPlanId, timezoneFor } from "@/lib/sequences/engine";
import { sendPurchaseAccessEmail, type AccessChannel } from "./welcome-email";

export const ACCESS_METADATA_KEY = "collective_access";

type Db = ReturnType<typeof createServerClient>;

interface AccessRow {
  id: string;
  match_key: string;
  label: string | null;
  space_ids: string[];
  crm_tags: string[];
}

interface Buyer {
  email: string;
  name: string;
  phone: string | null;
  address: Stripe.Address | null | undefined;
}

const appUrl = () => process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://lccommandsuite.com";

function metadataKeys(meta: Stripe.Metadata | null | undefined): string[] {
  const raw = meta?.[ACCESS_METADATA_KEY];
  return raw ? raw.split(",").map((s) => s.trim()).filter(Boolean) : [];
}

async function activeMappings(db: Db): Promise<AccessRow[]> {
  const { data, error } = await db.from("cm_purchase_access").select("id, match_key, label, space_ids, crm_tags").eq("active", true);
  if (error) console.error("purchase access mappings:", error.message);
  return (data as AccessRow[]) ?? [];
}

// checkout.session.completed — covers one-off purchases, Payment Links and the
// first payment of a subscription started through Checkout.
export async function grantAccessForCheckout(stripe: Stripe, session: Stripe.Checkout.Session) {
  try {
    const db = createServerClient();
    const maps = await activeMappings(db);
    if (!maps.length) return;
    const email = session.customer_details?.email || session.customer_email;
    if (!email) return;
    const keys = new Set<string>(metadataKeys(session.metadata));
    const plink = typeof session.payment_link === "string" ? session.payment_link : session.payment_link?.id;
    if (plink) keys.add(plink);
    if (maps.some((m) => /^(price|prod)_/.test(m.match_key))) {
      const items = await stripe.checkout.sessions.listLineItems(session.id, { limit: 100 });
      for (const li of items.data) {
        const price = li.price;
        if (!price) continue;
        keys.add(price.id);
        keys.add(typeof price.product === "string" ? price.product : price.product.id);
      }
    }
    const subId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
    await grant(db, maps, keys, {
      email,
      name: session.customer_details?.name || "",
      phone: session.customer_details?.phone || null,
      address: session.customer_details?.address,
    }, subId || session.id, session.id);
  } catch (e) {
    console.error("grantAccessForCheckout:", (e as Error).message);
  }
}

// invoice.payment_succeeded for a brand-new subscription (billing_reason
// subscription_create) that didn't come through Checkout. When it did come
// through Checkout, stripe_ref is the same subscription id, so nothing repeats.
export async function grantAccessForFirstInvoice(stripe: Stripe, invoice: Stripe.Invoice) {
  try {
    const raw = invoice as unknown as {
      billing_reason?: string;
      subscription?: string | { id: string } | null;
      parent?: { subscription_details?: { subscription?: string | { id: string }; metadata?: Stripe.Metadata } };
      lines?: { data?: Array<{ price?: { id: string; product: string | { id: string } } | null; pricing?: { price_details?: { price?: string; product?: string } } }> };
    };
    if (raw.billing_reason !== "subscription_create") return;
    const db = createServerClient();
    const maps = await activeMappings(db);
    if (!maps.length) return;
    const email = invoice.customer_email;
    if (!email) return;
    const subRef = raw.subscription ?? raw.parent?.subscription_details?.subscription;
    const subId = typeof subRef === "string" ? subRef : subRef?.id;
    const keys = new Set<string>(metadataKeys(raw.parent?.subscription_details?.metadata));
    if (subId) {
      const sub = await stripe.subscriptions.retrieve(subId);
      for (const k of metadataKeys(sub.metadata)) keys.add(k);
    }
    for (const line of raw.lines?.data ?? []) {
      const pd = line.pricing?.price_details;
      if (pd?.price) keys.add(pd.price);
      if (pd?.product) keys.add(pd.product);
      if (line.price) {
        keys.add(line.price.id);
        keys.add(typeof line.price.product === "string" ? line.price.product : line.price.product.id);
      }
    }
    await grant(db, maps, keys, {
      email,
      name: invoice.customer_name || "",
      phone: invoice.customer_phone || null,
      address: invoice.customer_address,
    }, subId || invoice.id || "", invoice.id || "");
  } catch (e) {
    console.error("grantAccessForFirstInvoice:", (e as Error).message);
  }
}

async function grant(db: Db, maps: AccessRow[], keys: Set<string>, buyer: Buyer, stripeRef: string, stripeObject: string) {
  const matched = maps.filter((m) => keys.has(m.match_key));
  if (!matched.length || !stripeRef) return;
  const email = buyer.email.trim().toLowerCase();

  // One row per channel; ignoreDuplicates keeps Stripe retries from adding more.
  const wanted = new Map<string, string>(); // space_id -> access_id
  for (const m of matched) for (const sid of m.space_ids ?? []) if (!wanted.has(sid)) wanted.set(sid, m.id);
  if (!wanted.size) return;
  const { data: inserted, error } = await db
    .from("cm_purchase_grants")
    .upsert(
      Array.from(wanted, ([space_id, access_id]) => ({ stripe_ref: stripeRef, email, buyer_name: buyer.name || null, space_id, access_id })),
      { onConflict: "stripe_ref,space_id", ignoreDuplicates: true }
    )
    .select("id");
  if (error) throw new Error(`record grants: ${error.message}`);
  // Only the delivery that first recorded this purchase touches the CRM.
  const firstTime = (inserted?.length ?? 0) > 0;

  const { data: rows } = await db
    .from("cm_purchase_grants")
    .select("id, space_id, status, claim_token, emailed_at")
    .eq("stripe_ref", stripeRef);
  const grants = (rows as { id: string; space_id: string; status: string; claim_token: string; emailed_at: string | null }[]) ?? [];

  // Already has an account → into the Collective and the channel(s) now.
  const { data: uid } = await db.rpc("cm_user_id_for_email", { p_email: email });
  const userId = (uid as string | null) ?? null;
  if (userId && grants.some((g) => g.status === "pending")) {
    const { error: ensureErr } = await db.rpc("cm_ensure_member", { p_user: userId, p_name: buyer.name || "" });
    if (ensureErr) console.error("purchase access ensure_member:", ensureErr.message);
    const { error: applyErr } = await db.rpc("cm_apply_purchase_grants", { p_user: userId });
    if (applyErr) console.error("purchase access apply:", applyErr.message);
  }

  // Suite CRM: every mapped purchase becomes a contact on Babs's plan (once per purchase).
  if (firstTime) {
    try {
      const planId = await ownerMasterPlanId();
      if (planId) {
        const [firstName, ...rest] = buyer.name.trim().split(/\s+/);
        const tags = Array.from(new Set(["collective", ...matched.flatMap((m) => m.crm_tags ?? [])]));
        const c = await upsertContact({
          masterPlanId: planId,
          email,
          firstName: firstName || null,
          lastName: rest.join(" ") || null,
          phone: buyer.phone,
          timezone: timezoneFor(buyer.address ?? undefined),
          source: "stripe",
          tags,
        });
        if (c) {
          const what = matched.map((m) => m.label || m.match_key).join(", ");
          await logEvent(planId, c.id, "purchase", `Bought ${what}`, { stripe: stripeObject, collectiveChannels: Array.from(wanted.keys()) });
        }
      }
    } catch (e) {
      console.error("purchase access CRM:", (e as Error).message);
    }
  }

  // One welcome email per purchase.
  const toEmail = grants.filter((g) => !g.emailed_at);
  if (!toEmail.length) return;
  const { data: spaces } = await db.from("cm_spaces").select("id, slug, name").in("id", toEmail.map((g) => g.space_id));
  const channels: AccessChannel[] = [];
  for (const g of toEmail) {
    const s = (spaces as { id: string; slug: string; name: string }[] | null)?.find((x) => x.id === g.space_id);
    if (!s) continue;
    channels.push({ slug: s.slug, name: s.name, claimToken: g.claim_token, nextEvent: await nextEventFor(db, s.id) });
  }
  if (!channels.length) return;
  const sent = await sendPurchaseAccessEmail({
    email,
    name: buyer.name,
    base: appUrl(),
    hasAccount: Boolean(userId),
    purchase: matched.map((m) => m.label).filter(Boolean).join(" + ") || channels.map((c) => c.name).join(" + "),
    channels,
  });
  if (sent) {
    await db.from("cm_purchase_grants").update({ emailed_at: new Date().toISOString() }).in("id", toEmail.map((g) => g.id));
  }
}

// The next upcoming (or recurring) Collective event for this channel, if any.
async function nextEventFor(db: Db, spaceId: string): Promise<AccessChannel["nextEvent"]> {
  const { data } = await db
    .from("cm_events")
    .select("title, starts_at, timezone, recurrence, recur_freq, recur_until")
    .is("deleted_at", null)
    .contains("space_ids", [spaceId])
    .order("starts_at");
  const now = Date.now();
  const rows = (data as { title: string; starts_at: string; timezone: string; recurrence: string | null; recur_freq: string | null; recur_until: string | null }[]) ?? [];
  const pick =
    rows.find((e) => new Date(e.starts_at).getTime() >= now) ??
    rows.find((e) => e.recur_freq && (!e.recur_until || new Date(e.recur_until).getTime() >= now));
  if (!pick) return null;
  const future = new Date(pick.starts_at).getTime() >= now;
  return {
    title: pick.title,
    when: future
      ? new Date(pick.starts_at).toLocaleString("en-US", { weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: pick.timezone || "America/Denver", timeZoneName: "short" })
      : null,
    recurrence: pick.recurrence,
  };
}
