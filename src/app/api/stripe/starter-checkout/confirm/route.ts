/**
 * Called by the /get-started/success page right after Stripe redirects a
 * paying customer back. Verifies the session actually paid (never trust the
 * client), provisions their account if it doesn't exist yet, and hands back
 * a Supabase recovery link so they land signed-in with a chance to set a
 * password — all synchronously in their own browser, since production SMTP
 * for Supabase's own auth emails isn't wired up yet (a separate open item):
 * this sidesteps needing an email to be sent at all for the critical first
 * login. The webhook (/api/stripe/webhook) does the same provisioning as a
 * server-side safety net in case the customer closes the tab before this
 * ever runs — provisionAccountForEmail is idempotent either way.
 */

import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { provisionAccountForEmail } from "@/lib/provisionAccount";
import { createClient as createServiceClient } from "@supabase/supabase-js";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://lccommandsuite.com";

export async function GET(req: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
    }

    const sessionId = req.nextUrl.searchParams.get("session_id");
    if (!sessionId) {
      return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return NextResponse.json({ error: "Payment not completed" }, { status: 402 });
    }
    if (session.metadata?.flow !== "self_serve_starter") {
      return NextResponse.json({ error: "Not a self-serve signup session" }, { status: 400 });
    }

    const email = session.customer_details?.email || session.customer_email;
    if (!email) {
      return NextResponse.json({ error: "No email on this session" }, { status: 400 });
    }

    const planId = session.metadata?.planId || "starter";
    const fullName = session.metadata?.fullName || undefined;

    await provisionAccountForEmail(email, planId, fullName);

    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data, error } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo: `${APP_URL}/auth/callback?next=/reset-password` },
    });

    if (error || !data?.properties?.action_link) {
      // Account exists either way — send them to sign in manually rather
      // than fail the whole request over a link-generation hiccup.
      console.error("generateLink failed:", error?.message);
      return NextResponse.json({ redirectUrl: `${APP_URL}/login` });
    }

    return NextResponse.json({ redirectUrl: data.properties.action_link });
  } catch (error) {
    console.error("Starter checkout confirm error:", error);
    return NextResponse.json({ error: "Failed to confirm signup" }, { status: 500 });
  }
}
