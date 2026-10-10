import { NextResponse } from "next/server";
import { crossOriginBlocked } from "@/lib/security";
import { isDemoRequest, resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { decideAction, listRecentActions } from "@/lib/ai/actions/engine";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// The actions the assistant prepared for this account in the last day (so a card survives a reload).
export async function GET(request: Request) {
  const planId = await resolveMasterPlanId();
  if (!planId) return NextResponse.json({ actions: [] });
  // ?history=1: the account's activity log of everything the assistant prepared, newest first (last 100).
  if (new URL(request.url).searchParams.get("history")) {
    const { data } = await createServerClient()
      .from("assistant_actions")
      .select("id, tool, status, preview, error, created_at, decided_at")
      .eq("master_plan_id", planId)
      .order("created_at", { ascending: false })
      .limit(100);
    const rows = ((data ?? []) as { id: string; tool: string; status: string; preview: { title?: string } | null; error: string | null; created_at: string; decided_at: string | null }[]).map((r) => ({
      id: r.id,
      tool: r.tool,
      status: r.status,
      title: r.preview?.title ?? r.tool,
      error: r.error,
      createdAt: r.created_at,
      decidedAt: r.decided_at,
    }));
    return NextResponse.json({ history: rows });
  }
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
