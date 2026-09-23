import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { sessionUser } from "@/lib/authz";
import { stripe } from "@/lib/stripe";
import { isPlusSubscription, syncPlusSubscription } from "@/lib/community/plus";

export const dynamic = "force-dynamic";

// Called by /community/plus right after Checkout so Plus switches on
// immediately (the webhook does the same thing as a safety net).
export async function POST(request: Request) {
  if (!stripe) return NextResponse.json({ error: "Payments aren't set up yet." }, { status: 503 });
  const user = await sessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const { sessionId } = await request.json().catch(() => ({}));
  if (typeof sessionId !== "string" || !sessionId.startsWith("cs_")) return NextResponse.json({ error: "Missing session." }, { status: 400 });
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ["subscription"] });
    const sub = session.subscription as Stripe.Subscription | null;
    if (!sub || !isPlusSubscription(sub) || sub.metadata.cmUserId !== user.id) {
      return NextResponse.json({ error: "That checkout doesn't match your account." }, { status: 400 });
    }
    await syncPlusSubscription(sub);
    return NextResponse.json({ ok: true, status: sub.status });
  } catch (e) {
    console.error("plus confirm:", e);
    return NextResponse.json({ error: "Couldn't confirm — it may take a minute to appear." }, { status: 500 });
  }
}
