import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getOrCreatePrimaryMasterPlan } from "@/lib/scoring/masterPlan";

export const dynamic = "force-dynamic";

// Stores the monthly operational metrics (revenue, hours, SOPs, etc.) on the
// master plan's metadata so the scoring engine can ground Finance / Systems /
// Sales in real numbers instead of self-report. Service role, single-user.

const NUMERIC_KEYS = [
  "revenue",
  "expenses",
  "revenue_goal",
  "cash_in_bank",
  "leads",
  "conversion_rate",
  "hours_worked",
  "target_hours",
  "sops_created",
  "delegated_tasks",
  "goal_progress",
] as const;

// Parse "$12,500", "45", "20%" → number.
function num(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v !== "string") return null;
  const cleaned = v.replace(/[$,%\s]/g, "");
  if (cleaned === "") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const raw = (body?.metrics ?? body) as Record<string, unknown>;

    const metrics: Record<string, number> = {};
    for (const k of NUMERIC_KEYS) {
      const n = num(raw?.[k]);
      if (n !== null) metrics[k] = n;
    }
    if (Object.keys(metrics).length === 0) {
      return NextResponse.json({ error: "no numeric metrics provided" }, { status: 400 });
    }

    const planId = await getOrCreatePrimaryMasterPlan();
    if (!planId) return NextResponse.json({ error: "no master plan" }, { status: 500 });

    const supabase = createServerClient();
    const now = new Date().toISOString();

    const { data: mp } = await supabase
      .from("client_master_plans")
      .select("metadata")
      .eq("id", planId)
      .maybeSingle();
    const metadata = {
      ...((mp?.metadata as Record<string, unknown>) ?? {}),
      operational: metrics,
      operational_at: now,
    };

    const { error } = await supabase
      .from("client_master_plans")
      .update({ metadata, updated_at: now })
      .eq("id", planId);
    if (error) {
      console.error("POST /api/operational:", error.message);
      return NextResponse.json({ error: "failed to save metrics" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, saved: Object.keys(metrics).length, metrics });
  } catch (e) {
    console.error("POST /api/operational:", e);
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}

export async function GET() {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("client_master_plans")
    .select("metadata")
    .eq("client_name", "Primary")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  const meta = (data?.metadata ?? {}) as { operational?: Record<string, number>; operational_at?: string };
  return NextResponse.json(
    { operational: meta.operational ?? null, operationalAt: meta.operational_at ?? null },
    { headers: { "Cache-Control": "no-store" } }
  );
}
