import { NextResponse } from "next/server";
import { recordPayhipEvent } from "@/lib/plannerGiveaway";

export const dynamic = "force-dynamic";

// Payhip → Suite: every paid (incl. $0 coupon) order and refund on Babs's
// LifeCharter Soul Studio shop. Set in Payhip → Settings → Developer → Webhooks.
// Payhip signs each call with sha256(API key).
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Bad request." }, { status: 400 });
  const r = await recordPayhipEvent(body as Record<string, unknown>);
  return r.ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: r.error }, { status: r.status });
}
