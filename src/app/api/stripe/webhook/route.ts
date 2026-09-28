/**
 * Stripe Webhook Handler
 * Processes Stripe events and updates subscriptions
 */

import { WEBSITE_BUILD } from "@/lib/websiteBuild";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { provisionAccountForEmail } from "@/lib/provisionAccount";
import { PLUS_FLOW, isPlusSubscription, syncPlusSubscription } from "@/lib/community/plus";

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
          // The Life Shift ($25 Payment Link on amilynnecarroll.com): tag the buyer in
          // Global Control so the challenge workflow starts. No Suite account.
          const email = session.customer_details?.email || session.customer_email;
          const tagId = process.env.GC_LIFE_SHIFT_TAG_ID;
          if (email && tagId) {
            const [firstName, ...rest] = (session.customer_details?.name || "").trim().split(/\s+/);
            await fetch(`https://api.globalcontrol.io/api/tag-form-submission/${encodeURIComponent(tagId)}`, {
              method: "POST",
              headers: { "Content-Type": "application/json", ...(process.env.GLOBAL_CONTROL_API_KEY ? { "X-API-KEY": process.env.GLOBAL_CONTROL_API_KEY } : {}) },
              body: JSON.stringify({ email, firstName: firstName || "", lastName: rest.join(" "), ...(session.customer_details?.phone ? { phone: session.customer_details.phone } : {}) }),
            }).catch((e) => console.error("life shift GC tag:", e));
          } else {
            console.warn(`life_shift purchase ${session.id}: ${tagId ? "no email" : "GC_LIFE_SHIFT_TAG_ID not set"}`);
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

        await supabase
          .from("subscriptions")
          .update({
            status: subData.status,
            cancel_at_period_end: subData.cancel_at_period_end,
            current_period_start: new Date(subData.current_period_start * 1000),
            current_period_end: new Date(subData.current_period_end * 1000),
            updated_at: new Date(),
          })
          .eq("stripe_subscription_id", subscriptionId);

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
