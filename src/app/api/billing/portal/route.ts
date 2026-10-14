import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createServerClient } from "@/lib/supabase/server";
import { authEnabled, sessionUser } from "@/lib/authz";
import { isFounderMonthly, isSwitched } from "@/lib/pricing";
import { loadPricingSettings, todayMountain } from "@/lib/pricingServer";

export const dynamic = "force-dynamic";

const stripeKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeKey ? new Stripe(stripeKey, { apiVersion: "2026-06-24.dahlia" }) : null;

// Opens a Stripe Billing Portal session for the signed-in user's own
// subscription — update card, view invoices, update contact details — so
// billing questions stop landing in Babs's inbox one at a time. Self-serve
// cancellation is deliberately not enabled in the portal configuration:
// cancelling within the Year-1 term carries a real early-termination fee per
// the Terms of Sale, which Stripe's portal has no way to enforce.
export async function POST() {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }
  if (!authEnabled()) {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  const user = await sessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const supabase = createServerClient();
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .not("stripe_customer_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!sub?.stripe_customer_id) {
    return NextResponse.json({ error: "No billing account on file yet" }, { status: 404 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://lccommandsuite.com";

  const { data: configRow } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "stripe_portal_configuration_id")
    .maybeSingle();

  // From the January 1, 2027 price change a client on the NEW monthly fees gets the portal that lists the new prices;
  // a founder client keeps the original configuration, so a plan change there stays at their founder rate.
  let configuration = configRow?.value as string | undefined;
  try {
    const settings = await loadPricingSettings(supabase);
    if (isSwitched(todayMountain(), settings)) {
      const { data: c2027 } = await supabase.from("app_settings").select("value").eq("key", "stripe_portal_configuration_id_2027").maybeSingle();
      if (c2027?.value) {
        const subs = await stripe.subscriptions.list({ customer: sub.stripe_customer_id, status: "all", limit: 5 });
        const live = subs.data.find((x) => x.status === "active" || x.status === "trialing" || x.status === "past_due");
        const amt = live?.items.data[0]?.price?.unit_amount ?? null;
        if (live && !isFounderMonthly(amt)) configuration = c2027.value as string;
      }
    }
  } catch (e) {
    console.error("[billing/portal] price-list check failed, using the default configuration:", e);
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: `${appUrl}/settings`,
      ...(configuration ? { configuration } : {}),
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[billing/portal] failed to create session:", err);
    return NextResponse.json({ error: "Couldn't open the billing portal" }, { status: 502 });
  }
}
