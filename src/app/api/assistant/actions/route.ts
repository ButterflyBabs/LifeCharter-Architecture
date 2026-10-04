import { NextResponse } from "next/server";
import { crossOriginBlocked } from "@/lib/security";
import { isDemoRequest, resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { decideAction, listRecentActions } from "@/lib/ai/actions/engine";

export const dynamic = "force-dynamic";

// The actions the assistant prepared for this account in the last day (so a card survives a reload).
export async function GET() {
  const planId = await resolveMasterPlanId();
  if (!planId) return NextResponse.json({ actions: [] });
  return NextResponse.json({ actions: await listRecentActions(planId) });
}

// POST { id, decision: "approve" | "cancel" | "undo" }: the client decides. Nothing the assistant
// prepares runs until this is called by a signed-in person on that account.
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  if (isDemoRequest()) return NextResponse.json({ error: "The demo is view-only." }, { status: 403 });
  const planId = await resolveMasterPlanId();
  if (!planId) return NextResponse.json({ error: "No account found." }, { status: 400 });
  const b = await request.json().catch(() => ({}));
  const id = typeof b.id === "string" ? b.id : "";
  const decision = b.decision;
  if (!id || !["approve", "cancel", "undo"].includes(decision)) return NextResponse.json({ error: "Bad request." }, { status: 400 });
  const out = await decideAction(id, decision, planId);
  if (!out.ok) return NextResponse.json({ error: out.error }, { status: out.status });
  return NextResponse.json({ card: out.card });
}
