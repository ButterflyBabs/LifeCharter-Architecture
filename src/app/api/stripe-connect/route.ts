import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { paymentsAccount } from "@/lib/payments";
import { connectConfigured, connectUrl, disconnect, getConnection, platformTestMode } from "@/lib/stripeConnect";

export const dynamic = "force-dynamic";

// Connect with Stripe (the client's OWN Stripe account; see stripeConnect.ts).
//   GET                          -> { configured, testMode, connection }
//   POST { action: "start" }     -> { url } to Stripe's sign-in
//   POST { action: "disconnect" }
export async function GET() {
  const a = await paymentsAccount();
  if ("denied" in a) return a.denied;
  const connection = await getConnection(createServerClient(), a.planId);
  return NextResponse.json({ configured: connectConfigured(), testMode: platformTestMode(), connection }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const a = await paymentsAccount(request);
  if ("denied" in a) return a.denied;
  const b = (await request.json().catch(() => ({}))) as { action?: string };
  if (b.action === "start") {
    if (!connectConfigured()) return NextResponse.json({ error: "Connect with Stripe isn't switched on yet." }, { status: 503 });
    return NextResponse.json({ url: connectUrl(a.planId, a.email) });
  }
  if (b.action === "disconnect") {
    await disconnect(createServerClient(), a.planId);
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
