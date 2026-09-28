import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { sessionUser } from "@/lib/authz";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Whole-account backup: everything this account has put into the Suite, as one
// JSON file. Only the account's owner can download it (not team members).
// Secrets (API keys, tokens) are never included.

const BY_PLAN = [
  "plan_sections",
  "client_plans",
  "business_reviews",
  "planning_reviews",
  "planning_insights",
  "tasks",
  "recurring_tasks",
  "finance_entries",
  "finance_budgets",
  "finance_goals",
  "finance_bills",
  "forecast_assumptions",
  "sales_offers",
  "pipeline_stages",
  "pipeline_deals",
  "sales_goals",
  "sales_activities",
  "scripts_templates",
  "operations_pillars",
  "sops",
  "legal_checklist",
  "testimonials",
  "quick_wins",
  "qa_entries",
  "unified_client_responses",
  "quick_pulse_checkins",
  "client_score_snapshots",
  "assistant_messages",
  "notifications",
];

export async function GET() {
  const user = await sessionUser();
  const masterPlanId = await resolveMasterPlanId();
  if (!user || !masterPlanId) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const db = createServerClient();
  const { data: plan } = await db.from("client_master_plans").select("id, client_name, user_id, created_at").eq("id", masterPlanId).maybeSingle();
  if (!plan || plan.user_id !== user.id) return NextResponse.json({ error: "Only the account owner can download a full backup." }, { status: 403 });

  const out: Record<string, unknown> = {
    exportedAt: new Date().toISOString(),
    account: { id: plan.id, name: plan.client_name, createdAt: plan.created_at, email: user.email },
    note: "Everything in your LifeCharter Command Suite account. Keep it somewhere safe. API keys and passwords are never included.",
  };
  await Promise.all(
    BY_PLAN.map(async (t) => {
      const { data, error } = await db.from(t).select("*").eq("master_plan_id", masterPlanId).limit(20000);
      if (!error) out[t] = data ?? [];
    })
  );
  const planIds = ((out.client_plans as { id: string }[]) ?? []).map((p) => p.id);
  if (planIds.length) {
    const { data } = await db.from("client_plan_goals").select("*").in("plan_id", planIds);
    out.client_plan_goals = data ?? [];
  }
  const { data: biz } = await db.from("businesses").select("*").eq("master_plan_id", masterPlanId);
  if (biz) {
    out.businesses = biz;
    const ids = (biz as { id: number }[]).map((b) => b.id);
    if (ids.length) out.segments = (await db.from("segments").select("*").in("business_id", ids)).data ?? [];
  }

  const day = new Date().toISOString().slice(0, 10);
  return new NextResponse(JSON.stringify(out, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="lifecharter-backup-${day}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
