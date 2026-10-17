/**
 * Called by the /get-started/success page right after Stripe redirects a
 * paying customer back, and again every few seconds while they sign the
 * Year-1 Operating Agreement. Verifies the session actually paid (never trust
 * the client). The account is NOT created at payment: it is created here (or
 * by the two-minute job, /api/cron/starter-signups, if they signed and left)
 * only after BoldSign shows the client's signature. Then it hands back a
 * Supabase recovery link so they land signed-in with a chance to set a
 * password, synchronously in their own browser.
 */

import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { clientHasSigned, emailAfterSigning, getSignup, openAccount, passwordLinkFor, startStarterSignup } from "@/lib/starterSignup";

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

    // A real purchase must be paid. The internal 100%-off test session (metadata.test) completes with nothing to pay.
    if (session.payment_status !== "paid" && !(session.payment_status === "no_payment_required" && session.metadata?.test === "true")) {
      return NextResponse.json({ error: "Payment not completed" }, { status: 402 });
    }
    if (session.metadata?.flow !== "self_serve_starter") {
      return NextResponse.json({ error: "Not a self-serve signup session" }, { status: 400 });
    }

    const email = session.customer_details?.email || session.customer_email;
    if (!email) {
      return NextResponse.json({ error: "No email on this session" }, { status: 400 });
    }

    const test = session.metadata?.test === "true";

    // The account is created only after the client signs the Year-1 Operating Agreement. Until then this answers
    // "awaiting_signature" and the success page keeps asking; the moment BoldSign shows their signature, it opens the account.
    let row = await getSignup(sessionId);
    if (!row) row = await startStarterSignup(session); // the webhook is normally first; whoever gets here first starts it, once
    if (!row) return NextResponse.json({ error: "Could not start your sign-up" }, { status: 500 });
    if (row.status === "pending") {
      if (!row.agreement_document_id || !(await clientHasSigned(row.agreement_document_id, row.email))) {
        return NextResponse.json({ state: "awaiting_signature", email: row.email, sent: Boolean(row.agreement_document_id), test });
      }
      if (await openAccount(row)) await emailAfterSigning(row, { signIn: false }).catch(() => {});
    }

    const link = await passwordLinkFor(row.email);
    // Account exists either way: send them to sign in manually rather than fail over a link-generation hiccup.
    return NextResponse.json({ redirectUrl: link || `${APP_URL}/login`, test });
  } catch (error) {
    console.error("Starter checkout confirm error:", error);
    return NextResponse.json({ error: "Failed to confirm signup" }, { status: 500 });
  }
}
