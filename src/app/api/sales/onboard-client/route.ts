import { NextRequest, NextResponse } from "next/server";
import { sessionUser } from "@/lib/authz";
import { submitOnboarding, type OnboardBody } from "@/lib/clientOnboarding";

/**
 * Called from the New Client form on /sales-reference after Marcello closes a call (any tier; the manual counterpart to the
 * automatic self-serve Starter flow in /api/stripe/starter-checkout).
 *
 * Babs's rule (2026-10-17): no account is ever created without a payment AND the client's signature on the Year-1 Operating
 * Agreement. The form always saves the call's details. If the payment and the signature are both in, the account is created
 * now (see completeOnboarding in src/lib/clientOnboarding.ts). If not, the details wait and the two-minute job creates the
 * account, and emails the client, the moment both arrive.
 */
export async function POST(req: NextRequest) {
  try {
    const body: OnboardBody = await req.json();

    if (!body.fullName || !body.email || !body.tier || !body.year1AgreementAccepted) {
      return NextResponse.json({ error: "Missing required fields (name, email, tier, and agreement acknowledgment)" }, { status: 400 });
    }

    const presser = (await sessionUser().catch(() => null))?.email?.toLowerCase() || null;
    return NextResponse.json(await submitOnboarding(body, presser));
  } catch (error) {
    console.error("Onboard client error:", error);
    return NextResponse.json({ error: "Failed to onboard client" }, { status: 500 });
  }
}
