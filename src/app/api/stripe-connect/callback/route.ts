import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { paymentsAccount } from "@/lib/payments";
import { finishConnect, readConnectState } from "@/lib/stripeConnect";
import { syncStripe } from "@/lib/stripeSync";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Stripe sends the person back here after "Connect with Stripe". Only the signed-in account that started it can finish.
export async function GET(request: Request) {
  const u = new URL(request.url);
  const back = (q: string) => NextResponse.redirect(new URL(`/settings?tab=integrations&stripe=${q}`, u.origin));
  if (u.searchParams.get("error")) return back(u.searchParams.get("error") === "access_denied" ? "cancelled" : "failed");
  const a = await paymentsAccount();
  if ("denied" in a) return back("signin");
  const planId = readConnectState(u.searchParams.get("state") || "");
  const code = u.searchParams.get("code") || "";
  if (!planId || planId !== a.planId || !code) return back("failed");
  try {
    const db = createServerClient();
    await finishConnect(db, a.planId, code);
    await syncStripe(a.planId).catch(() => null); // bring in the last 90 days of payments right away
    return back("connected");
  } catch (e) {
    console.error("stripe connect callback:", e instanceof Error ? e.message : e);
    return back("failed");
  }
}
