import { createServerClient } from "@/lib/supabase/server";
import { DIMENSION_LABEL } from "@/lib/scoring/dimensionModel";
import { getBlueprint } from "@/lib/plans/blueprints";
import { getAccountResendKey } from "@/lib/email/resendKey";
import { isHousePlan } from "@/lib/housePlan";

// The first 30 days: the three assessments first (everything else is informed by
// their answers), then small steps over four weeks that turn
// the Suite's tools into habits. Each step is checked live from the client's own
// data, so it ticks itself off the moment it's done.

export interface First30Step {
  key: string;
  week: 0 | 1 | 2 | 3 | 4; // 0 = the assessments, which inform everything else
  title: string;
  why: string;
  href: string;
  done: boolean;
  dims: string[]; // business dimensions this step strengthens
  focus?: string; // set when it strengthens one of their weakest areas, e.g. "Finance 42"
}

type Def = Omit<First30Step, "done" | "focus"> & { check: (id: string, db: ReturnType<typeof createServerClient>) => Promise<boolean> };

const count = async (q: PromiseLike<{ count: number | null }>) => ((await q).count ?? 0);

const answered = async (id: string, db: ReturnType<typeof createServerClient>, type: "brain" | "soul") =>
  (await count(db.from("unified_client_responses").select("id", { count: "exact", head: true }).eq("master_plan_id", id).eq("assessment_type", type))) > 0;

const STEPS: Def[] = [
  {
    key: "brain", week: 0, dims: ["systems","operations"], title: "Take the Brain assessment", why: "Maps your business systems in your own words.", href: "/assessments/brain",
    check: (id, db) => answered(id, db, "brain"),
  },
  {
    key: "soul", week: 0, dims: ["vision","leadership"], title: "Take the Soul assessment", why: "Your identity, values, calling and story: the heart your assistant writes from.", href: "/assessments/soul",
    check: (id, db) => answered(id, db, "soul"),
  },
  {
    key: "profit", week: 0, dims: ["finance"], title: "Take the Profit assessment", why: "Scores your 12 business dimensions and sets your baseline.", href: "/assessments/profit",
    check: async (id, db) => {
      const { data } = await db.from("client_master_plans").select("domain_scores, profit_score").eq("id", id).maybeSingle();
      const ds = (data?.domain_scores as Record<string, unknown> | null) || null;
      return Boolean((ds && Object.keys(ds).length > 0) || (data?.profit_score as number | null));
    },
  },
  {
    key: "vision", week: 1, dims: ["vision","leadership"], title: "Write your vision in the Business Plan", why: "Everything else in the Suite points back to it.", href: "/business-plan",
    check: async (id, db) => (await count(db.from("plan_sections").select("id", { count: "exact", head: true }).eq("master_plan_id", id).eq("plan_type", "business").not("content", "is", null))) > 0,
  },
  {
    key: "offers", week: 1, dims: ["product","sales"], title: "Add your offers and prices", why: "So your assistant, scripts and forecast use your real offers.", href: "/sales/offers",
    check: async (id, db) => (await count(db.from("sales_offers").select("id", { count: "exact", head: true }).eq("master_plan_id", id))) > 0,
  },
  {
    key: "deals", week: 1, dims: ["sales"], title: "Put your open opportunities in the Pipeline", why: "Your forecast and daily nudges come from it.", href: "/sales/pipeline",
    check: async (id, db) => (await count(db.from("pipeline_deals").select("id", { count: "exact", head: true }).eq("master_plan_id", id))) > 0,
  },
  {
    key: "income-goal", week: 1, dims: ["finance"], title: "Set your monthly income goal", why: "The Financial Pulse measures every month against it.", href: "/finance/budget",
    check: async (id, db) => (await count(db.from("finance_budgets").select("id", { count: "exact", head: true }).eq("master_plan_id", id).eq("type", "income").eq("category", "").gt("amount", 0))) > 0,
  },
  {
    key: "ledger", week: 2, dims: ["finance"], title: "Record this month's income and expenses", why: "Real numbers make every score and briefing honest.", href: "/finance/import",
    check: async (id, db) => (await count(db.from("finance_entries").select("id", { count: "exact", head: true }).eq("master_plan_id", id))) >= 3,
  },
  {
    key: "bills", week: 2, dims: ["finance","sustainability"], title: "Add your regular bills", why: "So nothing due sneaks up on you.", href: "/finance/bills",
    check: async (id, db) => (await count(db.from("finance_bills").select("id", { count: "exact", head: true }).eq("master_plan_id", id))) > 0,
  },
  {
    key: "email-sending", week: 2, dims: ["marketing","sales"], title: "Connect your own email sending (Resend)", why: "So campaigns, broadcasts and booking emails go from your own domain and count on your own account.", href: "/contacts?tab=sending",
    // Babs's own account sends on the Suite's key, so it counts as done.
    check: async (id, db) => (await isHousePlan(id, db)) || Boolean(await getAccountResendKey(id, db)),
  },
  {
    key: "weekly-review", week: 2, dims: ["leadership","sustainability"], title: "Do your first weekly review", why: "Ten minutes that set up next week.", href: "/planning/review",
    check: async (id, db) => (await count(db.from("business_reviews").select("id", { count: "exact", head: true }).eq("master_plan_id", id).eq("status", "completed"))) > 0,
  },
  {
    key: "forecast", week: 2, dims: ["finance","sustainability"], title: "Check your forecast and set its assumptions", why: "Your recorded numbers become a 6-month projection in three scenarios, and it goes into your printable business plan.", href: "/planning/forecast",
    check: async (id, db) =>
      (await count(db.from("forecast_assumptions").select("id", { count: "exact", head: true }).eq("master_plan_id", id))) > 0 ||
      (await count(db.from("plan_sections").select("id", { count: "exact", head: true }).eq("master_plan_id", id).eq("plan_type", "forecasting").not("content", "is", null))) > 0,
  },
  {
    key: "sop", week: 3, dims: ["systems","operations"], title: "Write down your first SOP", why: "Start with the process you explain most often.", href: "/operations/sops",
    check: async (id, db) => (await count(db.from("sops").select("id", { count: "exact", head: true }).eq("master_plan_id", id))) > 0,
  },
  {
    key: "pillars", week: 3, dims: ["operations","customer_experience"], title: "Answer the Go deeper questions on 3 of your 8 operational pillars", why: "Your pillars are scored from your data and these answers, so this shows where operations need attention.", href: "/operations",
    check: async (id, db) => {
      const { data } = await db.from("operations_pillars").select("answers").eq("master_plan_id", id);
      return ((data || []) as { answers: Record<string, unknown> | null }[]).filter((r) => r.answers && Object.keys(r.answers).length > 0).length >= 3;
    },
  },
  {
    key: "legal", week: 3, dims: ["legal"], title: "Work through the Legal & Compliance checklist", why: "Contracts, insurance and filings, handled once.", href: "/compliance",
    check: async (id, db) => (await count(db.from("legal_checklist").select("id", { count: "exact", head: true }).eq("master_plan_id", id).in("status", ["done", "na"]))) >= 5,
  },
  {
    key: "business-plan-complete", week: 3, dims: ["vision","leadership","finance"], title: "Finish your Business Plan: mark every section complete", why: "This unlocks your printable business plan (PDF and Word) for funding requests and partnership proposals.", href: "/business-plan",
    check: async (id, db) => {
      const total = getBlueprint("business")?.sections.length ?? 0;
      const { data } = await db.from("plan_sections").select("content, status").eq("master_plan_id", id).eq("plan_type", "business");
      return total > 0 && ((data || []) as { content: string | null; status: string | null }[]).filter((r) => r.status === "done" && (r.content || "").trim()).length >= total;
    },
  },
  {
    key: "marketing-plan", week: 3, dims: ["marketing","sales"], title: "Write your Marketing Plan: your ideal client, positioning and channels", why: "So your content, outreach and assistant speak to the right people. Let your assistant draft each section from your assessments, then make it yours.", href: "/marketing-plan",
    check: async (id, db) => (await count(db.from("plan_sections").select("id", { count: "exact", head: true }).eq("master_plan_id", id).eq("plan_type", "marketing").not("content", "is", null))) >= 3,
  },
  {
    key: "goal-ladder", week: 4, dims: ["vision","leadership"], title: "Break a yearly goal into this quarter", why: "Connects the big picture to this week.", href: "/planning/goals",
    check: async (id, db) => {
      const { data: plans } = await db.from("client_plans").select("id").eq("master_plan_id", id);
      const ids = ((plans ?? []) as { id: string }[]).map((p) => p.id);
      return ids.length ? (await count(db.from("client_plan_goals").select("id", { count: "exact", head: true }).in("plan_id", ids).neq("period", "year"))) > 0 : false;
    },
  },
  {
    key: "pulse", week: 4, dims: ["sustainability","team"], title: "Take your first monthly Quick Pulse", why: "Starts your trend line so you can see yourself grow.", href: "/assessments/quick-pulse-checkin",
    check: async (id, db) => (await count(db.from("quick_pulse_checkins").select("id", { count: "exact", head: true }).eq("master_plan_id", id))) > 0,
  },
];

export async function first30Status(masterPlanId: string): Promise<{ steps: First30Step[]; done: number; total: number; day: number; startedAt: string | null }> {
  const db = createServerClient();
  const results = await Promise.all(STEPS.map((s) => s.check(masterPlanId, db).catch(() => false)));
  const steps: First30Step[] = STEPS.map(({ check: _check, ...s }, i) => {
    void _check;
    return { ...s, done: results[i] };
  });
  // Their three weakest areas (latest scores): steps that strengthen them are marked "Focus for you".
  try {
    const { data: snap } = await db.from("client_score_snapshots").select("domains").eq("master_plan_id", masterPlanId).order("created_at", { ascending: false }).limit(1).maybeSingle();
    const weakest = Object.entries((snap?.domains as Record<string, number>) ?? {})
      .filter(([, v]) => typeof v === "number")
      .sort((a, b) => a[1] - b[1])
      .slice(0, 3);
    for (const st of steps) {
      const hit = weakest.find(([k]) => st.dims.includes(k));
      if (hit) st.focus = `${(DIMENSION_LABEL as Record<string, string>)[hit[0]] ?? hit[0]} ${Math.round(hit[1])}`;
    }
  } catch {
    /* optional */
  }
  const { data: mp } = await db.from("client_master_plans").select("created_at").eq("id", masterPlanId).maybeSingle();
  const startedAt = (mp?.created_at as string) ?? null;
  const day = startedAt ? Math.max(1, Math.floor((Date.now() - new Date(startedAt).getTime()) / 86400000) + 1) : 1;
  return { steps, done: steps.filter((s) => s.done).length, total: steps.length, day, startedAt };
}
