/**
 * Stripe Webhook Handler
 * Processes Stripe events and updates subscriptions
 */

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  try {
    const payload = await req.text();
    const signature = req.headers.get("stripe-signature")!;

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
        const { userId, planId } = session.metadata!;
        const subscriptionId = session.subscription as string;

        // Get subscription details from Stripe
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);

        // Update subscription record
        await supabase
          .from("subscriptions")
          .update({
            stripe_subscription_id: subscriptionId,
            status: "active",
            current_period_start: new Date(subscription.current_period_start * 1000),
            current_period_end: new Date(subscription.current_period_end * 1000),
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
            subscription_ends_at: new Date(subscription.current_period_end * 1000),
          })
          .eq("id", userId);

        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;

        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const { userId, planId } = subscription.metadata;

          await supabase
            .from("subscriptions")
            .update({
              status: "active",
              current_period_start: new Date(subscription.current_period_start * 1000),
              current_period_end: new Date(subscription.current_period_end * 1000),
              updated_at: new Date(),
            })
            .eq("stripe_subscription_id", subscriptionId);

          await supabase
            .from("profiles")
            .update({
              subscription_status: "active",
              subscription_ends_at: new Date(subscription.current_period_end * 1000),
            })
            .eq("id", userId);
        }

        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;

        if (subscriptionId) {
          await supabase
            .from("subscriptions")
            .update({
              status: "past_due",
              updated_at: new Date(),
            })
            .eq("stripe_subscription_id", subscriptionId);

          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const { userId } = subscription.metadata;

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

        await supabase
          .from("subscriptions")
          .update({
            status: "canceled",
            updated_at: new Date(),
          })
          .eq("stripe_subscription_id", subscriptionId);

        const { userId } = subscription.metadata;

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

        await supabase
          .from("subscriptions")
          .update({
            status: subscription.status,
            cancel_at_period_end: subscription.cancel_at_period_end,
            current_period_start: new Date(subscription.current_period_start * 1000),
            current_period_end: new Date(subscription.current_period_end * 1000),
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
