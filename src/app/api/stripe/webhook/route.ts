/**
 * Stripe Webhook Handler
 * Processes Stripe events and updates subscriptions
 */

import { WEBSITE_BUILD } from "@/lib/websiteBuild";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { provisionAccountForEmail } from "@/lib/provisionAccount";
import { enrolContact, ownerMasterPlanId, timezoneFor } from "@/lib/sequences/engine";
import { logEvent, upsertContact } from "@/lib/crm";
import { creditSale, implementationAmount } from "@/lib/affiliates";
import { applyRefundEvent, creditInvoiceForAffiliate } from "@/lib/affiliateStripe";
import { createServerClient as affDb } from "@/lib/supabase/server";
import { winBookingDeals } from "@/lib/booking/deals";
import { PLUS_FLOW, isPlusSubscription, syncPlusSubscription } from "@/lib/community/plus";
import { grantAccessForCheckout, grantAccessForFirstInvoice } from "@/lib/community/purchaseAccess";
import { sendMetaEvent } from "@/lib/metaCapi";
import { isUpgrade, notifyPlanUpgrade, planOfSubscription, planUpgradeEmailsOn } from "@/lib/planUpgrade";

const stripeKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeKey ? new Stripe(stripeKey, {
  apiVersion: "2026-06-24.dahlia",
}) : null;

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

export async function POST(req: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe not configured" },
        { status: 503 }
      );
    }

    const payload = await req.text();
    const signature = req.headers.get("stripe-signature") || "";

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Every completed checkout is a Purchase for Meta ads (Conversions API): Command Suite,
    // Life Shift and SOUL Sessions Payment Links, Collective Plus, Website Build. Never throws.
    if (event.type === "checkout.session.completed") {
      await sendPurchaseToMeta(event.data.object as Stripe.Checkout.Session);
    }

    // Collective Plus subscriptions are handled on their own and never touch
    // Command Suite plans/profiles below.
    if (await handlePlusEvent(stripe, event)) {
      return NextResponse.json({ received: true });
    }
    // Website Alignment Build sales are recorded on their own and never touch plans/profiles.
    if (await handleWebsiteBuildEvent(stripe, supabase, event)) {
      return NextResponse.json({ received: true });
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const meta = session.metadata || {};

        // 50/50 implementation plan: the first half was charged at checkout; queue the second half on the
        // subscription's next invoice (day 30, with the first monthly charge). Idempotent per session.
        if (meta.flow === "sales_combined_checkout" && meta.implPlan === "split" && session.subscription && session.customer) {
          const cents = Number(meta.implSecondHalfCents);
          if (Number.isFinite(cents) && cents > 0) {
            const tierName = ({ starter: "Starter", growth: "Growth", vip: "VIP" } as Record<string, string>)[meta.tier || ""] || "";
            try {
              await stripe.invoiceItems.create(
                {
                  customer: typeof session.customer === "string" ? session.customer : session.customer.id,
                  subscription: typeof session.subscription === "string" ? session.subscription : session.subscription.id,
                  currency: "usd",
                  amount: cents,
                  description: `LifeCharter Command Suite ${tierName ? `${tierName} - ` : ""}Implementation Fee (payment 2 of 2)`,
                  metadata: { flow: "sales_combined_checkout", implPlan: "split", session: session.id },
                },
                { idempotencyKey: `impl-second-half-${session.id}` }
              );
            } catch (e) {
              console.error("50/50 second half invoice item:", (e as Error).message);
            }
          }
        }

        // Whatever was bought, unlock any Collective channels mapped to it
        // (Admin → Purchase access). Never throws; idempotent on retries.
        await grantAccessForCheckout(stripe, session);

        // Bought the Command Suite (self-serve Starter, or a sales checkout that
        // provisions an account): they become a tagged customer in Babs's Suite CRM
        // and their booked-consultation deals in her Pipeline are won. Other
        // purchases (Life Shift, SOUL Sessions, Conversations of Consequence...) don't count.
        if (meta.flow === "self_serve_starter" || (!meta.flow && meta.userId) || meta.flow === "sales_combined_checkout") {
          const buyer = session.customer_details?.email || session.customer_email;
          const housePlan = buyer ? await ownerMasterPlanId().catch(() => null) : null;
          if (buyer && housePlan) {
            await winBookingDeals(housePlan, buyer).catch((e) => console.error("win booking deals:", e));
            const [first, ...rest] = (session.customer_details?.name || meta.fullName || "").trim().split(/\s+/);
            const c = await upsertContact({ masterPlanId: housePlan, email: buyer, firstName: first || null, lastName: rest.join(" ") || null, source: "stripe:command-suite", tags: ["command-suite-customer", ...(meta.planId || meta.tier ? [`plan-${meta.planId || meta.tier}`] : []), ...(meta.alumni === "true" ? ["lifecharter-alumni"] : [])] }).catch(() => null);
            if (c) await logEvent(housePlan, c.id, "purchase", `Bought LifeCharter Command Suite${meta.planId || meta.tier ? ` (${meta.planId || meta.tier})` : ""}`, { stripeSession: session.id }).catch(() => {});
            // Credit the affiliate who sent them (their link at checkout, or who referred this contact).
            if (c && typeof session.amount_total === "number") {
              await creditSale(affDb(), housePlan, { contactId: c.id, affiliateCode: meta.affiliate || null, description: `LifeCharter Command Suite${meta.planId || meta.tier ? ` (${meta.planId || meta.tier})` : ""}`, amount: session.amount_total / 100, implementationOnly: true, implementationAmount: meta.implPlan === "annual" && Number(meta.implCents) > 0 ? Number(meta.implCents) / 100 : await implementationAmount(stripe, session.id).catch(() => null), stripeRef: session.id, source: "stripe" }).catch((e) => console.error("affiliate sale:", e));
            }
          }
        }

        // An implementation-fee Payment Link bought on a call (no metadata): credit whoever referred this person.
        if (!meta.flow && !meta.userId) {
          const buyer = session.customer_details?.email || session.customer_email;
          const plan = buyer ? await ownerMasterPlanId().catch(() => null) : null;
          if (buyer && plan) {
            const impl = await implementationAmount(stripe, session.id).catch(() => null);
            if (impl && impl > 0) {
              const { data: person } = await affDb().from("seq_contacts").select("id").eq("master_plan_id", plan).eq("email", buyer.toLowerCase()).maybeSingle();
              if (person) await creditSale(affDb(), plan, { contactId: person.id as string, description: "LifeCharter Command Suite (implementation fee)", implementationOnly: true, amount: session.amount_total != null ? session.amount_total / 100 : impl, implementationAmount: impl, stripeRef: session.id, source: "stripe" }).catch((e) => console.error("affiliate sale:", e));
            }
          }
        }

        if (meta.flow === "self_serve_starter") {
          // Safety-net duplicate of what /api/stripe/starter-checkout/confirm
          // already does synchronously in the customer's browser right after
          // payment — provisionAccountForEmail is idempotent, so whichever of
          // the two runs first wins and this becomes a no-op.
          const email = session.customer_details?.email || session.customer_email;
          if (email) {
            await provisionAccountForEmail(email, meta.planId || "starter", meta.fullName || undefined);
          }
          break;
        }

        if (meta.flow === "life_shift") {
          // The Life Shift ($25 Payment Link on amilynnecarroll.com): no Suite account —
          // the buyer lands in Babs's contacts and is enrolled in The Life Shift emails
          // (sent from the Suite).
          const email = session.customer_details?.email || session.customer_email;
          if (email) {
            const [firstName, ...rest] = (session.customer_details?.name || "").trim().split(/\s+/);
            const person = { firstName: firstName || "", lastName: rest.join(" ") };
            try {
              const planId = await ownerMasterPlanId();
              if (planId) {
                const r = await enrolContact({
                  masterPlanId: planId,
                  sequenceKey: "life-shift",
                  email,
                  firstName: person.firstName,
                  lastName: person.lastName,
                  phone: session.customer_details?.phone || null,
                  timezone: timezoneFor(session.customer_details?.address),
                  source: "stripe",
                  sourceRef: session.id,
                  tags: ["life-shift", "paid"],
                });
                if (r.contactId) await logEvent(planId, r.contactId, "purchase", "Bought The Life Shift ($25)", { stripeSession: session.id }).catch(() => {});
                if (r.contactId && typeof session.amount_total === "number") {
                  await creditSale(affDb(), planId, { contactId: r.contactId, affiliateCode: meta.affiliate || null, description: "The Life Shift", amount: session.amount_total / 100, stripeRef: session.id, source: "stripe" }).catch((e) => console.error("affiliate sale:", e));
                }
                if (!r.enrollmentId) console.warn(`life shift enrol ${email}: ${r.reason}`);
              }
            } catch (e) {
              console.error("life shift enrol:", e);
            }
          } else {
            console.warn(`life_shift purchase ${session.id}: no email`);
          }
          break;
        }

        if (!meta.userId) {
          // No app-set metadata at all — e.g. a real static Stripe Payment
          // Link purchase (Marcello's sales calls use these directly).
          // Auto-provisioning those isn't built yet; that's tracked as its
          // own follow-up. Log and move on rather than throw, since this
          // used to crash on session.metadata!.userId being undefined —
          // which would have made Stripe retry-storm every real Payment
          // Link sale against this endpoint.
          console.warn(`checkout.session.completed with no userId/flow metadata — session ${session.id}`);
          break;
        }

        const { userId, planId } = meta as { userId: string; planId: string };
        const subscriptionId = session.subscription as string;

        // Get subscription details from Stripe
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const subData = subscription as unknown as { current_period_start: number; current_period_end: number };

        // Update subscription record
        await supabase
          .from("subscriptions")
          .update({
            stripe_subscription_id: subscriptionId,
            status: "active",
            current_period_start: new Date(subData.current_period_start * 1000),
            current_period_end: new Date(subData.current_period_end * 1000),
          })
          .eq("user_id", userId)
          .eq("plan_id", planId)
          .is("stripe_subscription_id", null);

        // Update profile
        await supabase
          .from("profiles")
          .update({
            current_plan_id: planId,
            subscription_status: "active",
            subscription_ends_at: new Date(subData.current_period_end * 1000),
          })
          .eq("id", userId);

        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = (invoice as unknown as { subscription?: string }).subscription;

        // Affiliate credit for this payment (recurring ones included, under each link's own setting).
        // Never throws and runs on its own, so it cannot affect the subscription handling below.
        await creditInvoiceForAffiliate(invoice);

        // First invoice of a new subscription: Collective channel access (no-op if Checkout already granted it).
        await grantAccessForFirstInvoice(stripe, invoice);

        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const subData = subscription as unknown as { current_period_start: number; current_period_end: number; metadata: { userId: string } };
          const { userId } = subData.metadata;

          await supabase
            .from("subscriptions")
            .update({
              status: "active",
              current_period_start: new Date(subData.current_period_start * 1000),
              current_period_end: new Date(subData.current_period_end * 1000),
              updated_at: new Date(),
            })
            .eq("stripe_subscription_id", subscriptionId);

          await supabase
            .from("profiles")
            .update({
              subscription_status: "active",
              subscription_ends_at: new Date(subData.current_period_end * 1000),
            })
            .eq("id", userId);
        }

        break;
      }

      // A refund on a payment that was credited to an affiliate: void it inside the payout hold, flag it otherwise.
      // Never throws; touches only affiliate_sales.
      case "charge.refunded":
      case "refund.created":
      case "refund.updated": {
        await applyRefundEvent(event);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = (invoice as unknown as { subscription?: string }).subscription;

        if (subscriptionId) {
          await supabase
            .from("subscriptions")
            .update({
              status: "past_due",
              updated_at: new Date(),
            })
            .eq("stripe_subscription_id", subscriptionId);

          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const subData = subscription as unknown as { metadata: { userId: string } };
          const { userId } = subData.metadata;

          await supabase
            .from("profiles")
            .update({
              subscription_status: "past_due",
            })
            .eq("id", userId);
        }

        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const subscriptionId = subscription.id;
        const subData = subscription as unknown as { metadata: { userId: string } };

        await supabase
          .from("subscriptions")
          .update({
            status: "canceled",
            updated_at: new Date(),
          })
          .eq("stripe_subscription_id", subscriptionId);

        const { userId } = subData.metadata;

        await supabase
          .from("profiles")
          .update({
            subscription_status: "canceled",
            current_plan_id: null,
          })
          .eq("id", userId);

        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const subscriptionId = subscription.id;
        const subData = subscription as unknown as { status: string; cancel_at_period_end: boolean; current_period_start: number; current_period_end: number };

        // Plan change (behind the plan_upgrade_emails_on flag): the Stripe subscription's plan (metadata planId,
        // or the plan matching its recurring price) moved up a tier. Record it, then send the upgrade email, the alert to Babs and Operations
        // and enrol the next-morning check-in. With the flag off none of this runs.
        let upgrade: { userId: string; fromPlan: string; toPlan: string } | null = null;
        if (await planUpgradeEmailsOn(supabase)) {
          const newPlan = await planOfSubscription(supabase, subscription);
          const { data: cur } = await supabase.from("subscriptions").select("user_id, plan_id").eq("stripe_subscription_id", subscriptionId).maybeSingle();
          if (newPlan && cur?.user_id && newPlan !== cur.plan_id) {
            if (isUpgrade(cur.plan_id, newPlan)) upgrade = { userId: cur.user_id, fromPlan: cur.plan_id, toPlan: newPlan };
            else {
              // A move down (portal plan switch): the account follows Stripe, no upgrade emails.
              await supabase.from("subscriptions").update({ plan_id: newPlan, updated_at: new Date() }).eq("stripe_subscription_id", subscriptionId);
              await supabase.from("profiles").update({ current_plan_id: newPlan }).eq("id", cur.user_id);
            }
          }
        }

        await supabase
          .from("subscriptions")
          .update({
            status: subData.status,
            cancel_at_period_end: subData.cancel_at_period_end,
            current_period_start: new Date(subData.current_period_start * 1000),
            current_period_end: new Date(subData.current_period_end * 1000),
            ...(upgrade ? { plan_id: upgrade.toPlan } : {}),
            updated_at: new Date(),
          })
          .eq("stripe_subscription_id", subscriptionId);

        if (upgrade) {
          await supabase.from("profiles").update({ current_plan_id: upgrade.toPlan }).eq("id", upgrade.userId);
          let amount: string | null = null;
          try {
            const inv = subscription.latest_invoice ? await stripe.invoices.retrieve(String(typeof subscription.latest_invoice === "string" ? subscription.latest_invoice : subscription.latest_invoice.id)) : null;
            if (inv && inv.amount_paid > 0 && Date.now() / 1000 - inv.created < 3600) amount = `$${(inv.amount_paid / 100).toFixed(2)}`;
          } catch (e) {
            console.error("plan-upgrade invoice lookup:", e);
          }
          await notifyPlanUpgrade(supabase, { ...upgrade, amount });
        }

        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

// Returns true when the event belonged to a Website Alignment Build checkout or its 2-payment plan.
async function handleWebsiteBuildEvent(stripe: Stripe, supabase: ReturnType<typeof createClient>, event: Stripe.Event): Promise<boolean> {
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const meta = session.metadata || {};
    if (meta.flow !== WEBSITE_BUILD.flow) return false;
    await supabase.from("website_build_orders").upsert({
      stripe_checkout_session_id: session.id,
      email: session.customer_details?.email || session.customer_email || null,
      full_name: meta.fullName || session.customer_details?.name || null,
      payment_plan: meta.plan || "full",
      amount_total_cents: meta.plan === "two_pay" ? WEBSITE_BUILD.foundingInstallmentCents * 2 : session.amount_total ?? null,
      session_source: meta.sessionSource || null,
    }, { onConflict: "stripe_checkout_session_id" });
    // 2 payments: end the subscription after the second charge (about 6 weeks from now).
    if (meta.plan === "two_pay" && session.subscription) {
      const cancelAt = Math.floor(Date.now() / 1000) + 45 * 86400;
      await stripe.subscriptions.update(session.subscription as string, { cancel_at: cancelAt, proration_behavior: "none" });
    }
    return true;
  }
  if (event.type.startsWith("customer.subscription.") || event.type.startsWith("invoice.")) {
    const obj = event.data.object as { metadata?: Stripe.Metadata; subscription?: string; parent?: { subscription_details?: { metadata?: Stripe.Metadata } } };
    const meta = obj.metadata ?? obj.parent?.subscription_details?.metadata;
    return meta?.flow === WEBSITE_BUILD.flow;
  }
  return false;
}

// Returns true when the event belonged to a Collective Plus subscription.
async function handlePlusEvent(stripe: Stripe, event: Stripe.Event): Promise<boolean> {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.metadata?.flow !== PLUS_FLOW) return false;
      if (session.subscription) {
        const sub = await stripe.subscriptions.retrieve(session.subscription as string);
        await syncPlusSubscription(sub);
      }
      return true;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      if (!isPlusSubscription(sub)) return false;
      await syncPlusSubscription(sub);
      return true;
    }
    case "invoice.payment_succeeded":
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const raw = invoice as unknown as { subscription?: string; parent?: { subscription_details?: { subscription?: string; metadata?: Stripe.Metadata } } };
      const subscriptionId = raw.subscription ?? raw.parent?.subscription_details?.subscription;
      if (!subscriptionId) return false;
      const sub = await stripe.subscriptions.retrieve(subscriptionId);
      if (!isPlusSubscription(sub)) return false;
      await syncPlusSubscription(sub);
      return true;
    }
  }
  return false;
}

export const runtime = 'nodejs';

// Purchase → Meta Conversions API. The event id is the checkout session id, the same id the
// /get-started/success page gives the browser pixel, so Meta counts one purchase (and Stripe
// retries of this webhook collapse into it too).
async function sendPurchaseToMeta(session: Stripe.Checkout.Session) {
  const meta = session.metadata || {};
  const [firstName, ...rest] = (session.customer_details?.name || meta.fullName || "").trim().split(/\s+/);
  const isSuite = meta.flow === "self_serve_starter" || meta.flow === "sales_combined_checkout" || (!meta.flow && !!meta.userId);
  const contentName =
    meta.flow === "self_serve_starter" ? "command_suite_starter"
    : isSuite ? "command_suite"
    : meta.flow || "stripe_checkout";
  const app = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://lccommandsuite.com";
  const sourceUrl = meta.flow === "life_shift" ? "https://amilynnecarroll.com" : session.success_url?.split("?")[0] || app;
  await sendMetaEvent({
    eventName: "Purchase",
    eventId: session.id,
    email: session.customer_details?.email || session.customer_email,
    phone: session.customer_details?.phone,
    firstName: firstName || null,
    lastName: rest.join(" ") || null,
    value: typeof session.amount_total === "number" ? session.amount_total / 100 : null,
    currency: session.currency || "usd",
    contentName,
    sourceUrl,
  });
}
