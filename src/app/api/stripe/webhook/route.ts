/**
 * Stripe Webhook Handler
 * Processes Stripe events and updates subscriptions
 */

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { provisionAccountForEmail } from "@/lib/provisionAccount";

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

export const runtime = 'nodejs';
