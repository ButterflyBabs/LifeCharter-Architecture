import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { createServerClient } from "@/lib/supabase/server";
import { platform } from "@/lib/stripeConnect";
import { handleConnectEvent } from "@/lib/suitePayments";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// The Connect webhook: events from clients' OWN connected Stripe accounts (payments, invoices, refunds). Public (no
// session), so nothing in the body is trusted: only the event id and account are read, and the event itself is fetched
// back from Stripe with the platform key. A forged or replayed body can't post anything Stripe didn't send.
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { id?: unknown; account?: unknown } | null;
  const id = typeof body?.id === "string" && body.id.startsWith("evt_") ? body.id : "";
  const account = typeof body?.account === "string" && body.account.startsWith("acct_") ? body.account : "";
  if (!id || !account) return NextResponse.json({ ok: true, note: "not a connected-account event" });
  let event: Stripe.Event;
  try {
    event = await platform().events.retrieve(id, {}, { stripeAccount: account });
  } catch (e) {
    console.error("connect webhook: event not found", id, e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "unknown event" }, { status: 400 });
  }
  if (!event.account) event.account = account;
  try {
    const result = await handleConnectEvent(createServerClient(), event);
    return NextResponse.json({ ok: true, result });
  } catch (e) {
    console.error("connect webhook:", event.type, e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "failed" }, { status: 500 }); // Stripe retries
  }
}
