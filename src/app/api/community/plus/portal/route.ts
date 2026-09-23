import { NextResponse } from "next/server";
import { sessionUser } from "@/lib/authz";
import { stripe } from "@/lib/stripe";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";

export const dynamic = "force-dynamic";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://lccommandsuite.com";

// Stripe's billing portal: change card, switch plan, cancel, see invoices.
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  if (!stripe) return NextResponse.json({ error: "Payments aren't set up yet." }, { status: 503 });
  const user = await sessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const { data } = await createServerClient().from("cm_plus_subscriptions").select("stripe_customer_id").eq("user_id", user.id).maybeSingle();
  if (!data?.stripe_customer_id) return NextResponse.json({ error: "No billing account found." }, { status: 404 });
  try {
    const portal = await stripe.billingPortal.sessions.create({ customer: data.stripe_customer_id as string, return_url: `${APP_URL}/community/plus` });
    return NextResponse.json({ url: portal.url });
  } catch (e) {
    console.error("plus portal:", e);
    return NextResponse.json({ error: "Couldn't open billing — please try again." }, { status: 500 });
  }
}
