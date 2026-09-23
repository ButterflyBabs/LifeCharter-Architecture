import { NextResponse } from "next/server";
import { sessionUser } from "@/lib/authz";
import { stripe } from "@/lib/stripe";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";

export const dynamic = "force-dynamic";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://lccommandsuite.com";

// Plus has its own portal settings (separate from Command Suite's default):
// update card, cancel at period end, invoices. Created once, id kept in
// cm_settings.plus_portal_config.
async function plusPortalConfig(): Promise<string | undefined> {
  if (!stripe) return undefined;
  const supabase = createServerClient();
  const { data } = await supabase.from("cm_settings").select("value").eq("key", "plus_portal_config").maybeSingle();
  const saved = (data?.value as { id?: string } | null)?.id;
  if (saved) return saved;
  try {
    const config = await stripe.billingPortal.configurations.create({
      business_profile: { headline: "The LifeCharter Collective — Collective Plus" },
      default_return_url: `${APP_URL}/community/plus`,
      features: {
        invoice_history: { enabled: true },
        payment_method_update: { enabled: true },
        customer_update: { enabled: true, allowed_updates: ["email", "address"] },
        subscription_cancel: { enabled: true, mode: "at_period_end", cancellation_reason: { enabled: true, options: ["too_expensive", "unused", "missing_features", "other"] } },
      },
    });
    await supabase.from("cm_settings").upsert({ key: "plus_portal_config", value: { id: config.id } }, { onConflict: "key" });
    return config.id;
  } catch (e) {
    console.error("plus portal config:", e);
    return undefined; // fall back to the account's default portal
  }
}

// Stripe's billing portal: change card, switch plan, cancel, see invoices.
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  if (!stripe) return NextResponse.json({ error: "Payments aren't set up yet." }, { status: 503 });
  const user = await sessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const { data } = await createServerClient().from("cm_plus_subscriptions").select("stripe_customer_id").eq("user_id", user.id).maybeSingle();
  if (!data?.stripe_customer_id) return NextResponse.json({ error: "No billing account found." }, { status: 404 });
  try {
    const configuration = await plusPortalConfig();
    const portal = await stripe.billingPortal.sessions.create({
      customer: data.stripe_customer_id as string,
      return_url: `${APP_URL}/community/plus`,
      ...(configuration ? { configuration } : {}),
    });
    return NextResponse.json({ url: portal.url });
  } catch (e) {
    console.error("plus portal:", e);
    return NextResponse.json({ error: "Couldn't open billing — please try again." }, { status: 500 });
  }
}
