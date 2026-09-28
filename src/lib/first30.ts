import { createServerClient } from "@/lib/supabase/server";

// The first 30 days after setup: twelve small steps over four weeks that turn
// the Suite's tools into habits. Each step is checked live from the client's own
// data, so it ticks itself off the moment it's done.

export interface First30Step {
  key: string;
  week: 1 | 2 | 3 | 4;
  title: string;
  why: string;
  href: string;
  done: boolean;
}

type Def = Omit<First30Step, "done"> & { check: (id: string, db: ReturnType<typeof createServerClient>) => Promise<boolean> };

const count = async (q: PromiseLike<{ count: number | null }>) => ((await q).count ?? 0);

const STEPS: Def[] = [
  {
    key: "vision", week: 1, title: "Write your vision in the Business Plan", why: "Everything else in the Suite points back to it.", href: "/business-plan",
    check: async (id, db) => (await count(db.from("plan_sections").select("id", { count: "exact", head: true }).eq("master_plan_id", id).eq("plan_type", "business").not("content", "is", null))) > 0,
  },
  {
    key: "offers", week: 1, title: "Add your offers and prices", why: "So your assistant, scripts and forecast use your real offers.", href: "/sales/offers",
    check: async (id, db) => (await count(db.from("sales_offers").select("id", { count: "exact", head: true }).eq("master_plan_id", id))) > 0,
  },
  {
    key: "deals", week: 1, title: "Put your open opportunities in the Pipeline", why: "Your forecast and daily nudges come from it.", href: "/sales/pipeline",
    check: async (id, db) => (await count(db.from("pipeline_deals").select("id", { count: "exact", head: true }).eq("master_plan_id", id))) > 0,
  },
  {
    key: "income-goal", week: 1, title: "Set your monthly income goal", why: "The Financial Pulse measures every month against it.", href: "/finance/budget",
    check: async (id, db) => (await count(db.from("finance_budgets").select("id", { count: "exact", head: true }).eq("master_plan_id", id).eq("type", "income").eq("category", "").gt("amount", 0))) > 0,
  },
  {
    key: "ledger", week: 2, title: "Record this month's income and expenses", why: "Real numbers make every score and briefing honest.", href: "/finance/import",
    check: async (id, db) => (await count(db.from("finance_entries").select("id", { count: "exact", head: true }).eq("master_plan_id", id))) >= 3,
  },
  {
    key: "bills", week: 2, title: "Add your regular bills", why: "So nothing due sneaks up on you.", href: "/finance/bills",
    check: async (id, db) => (await count(db.from("finance_bills").select("id", { count: "exact", head: true }).eq("master_plan_id", id))) > 0,
  },
  {
    key: "weekly-review", week: 2, title: "Do your first weekly review", why: "Ten minutes that set up next week.", href: "/planning/review",
    check: async (id, db) => (await count(db.from("business_reviews").select("id", { count: "exact", head: true }).eq("master_plan_id", id).eq("status", "completed"))) > 0,
  },
  {
    key: "sop", week: 3, title: "Write down your first SOP", why: "Start with the process you explain most often.", href: "/operations/sops",
    check: async (id, db) => (await count(db.from("sops").select("id", { count: "exact", head: true }).eq("master_plan_id", id))) > 0,
  },
  {
    key: "pillars", week: 3, title: "Rate your 8 operational pillars", why: "Shows where operations need attention.", href: "/operations",
    check: async (id, db) => (await count(db.from("operations_pillars").select("id", { count: "exact", head: true }).eq("master_plan_id", id))) >= 4,
  },
  {
    key: "legal", week: 3, title: "Work through the Legal & Compliance checklist", why: "Contracts, insurance and filings, handled once.", href: "/compliance",
    check: async (id, db) => (await count(db.from("legal_checklist").select("id", { count: "exact", head: true }).eq("master_plan_id", id).in("status", ["done", "na"]))) >= 5,
  },
  {
    key: "goal-ladder", week: 4, title: "Break a yearly goal into this quarter", why: "Connects the big picture to this week.", href: "/planning/goals",
    check: async (id, db) => {
      const { data: plans } = await db.from("client_plans").select("id").eq("master_plan_id", id);
      const ids = ((plans ?? []) as { id: string }[]).map((p) => p.id);
      return ids.length ? (await count(db.from("client_plan_goals").select("id", { count: "exact", head: true }).in("plan_id", ids).neq("period", "year"))) > 0 : false;
    },
  },
  {
    key: "pulse", week: 4, title: "Take your first monthly Quick Pulse", why: "Starts your trend line so you can see yourself grow.", href: "/assessments/quick-pulse-checkin",
    check: async (id, db) => (await count(db.from("quick_pulse_checkins").select("id", { count: "exact", head: true }).eq("master_plan_id", id))) > 0,
  },
];

export async function first30Status(masterPlanId: string): Promise<{ steps: First30Step[]; done: number; total: number; day: number; startedAt: string | null }> {
  const db = createServerClient();
  const results = await Promise.all(STEPS.map((s) => s.check(masterPlanId, db).catch(() => false)));
  const steps = STEPS.map(({ check: _check, ...s }, i) => {
    void _check;
    return { ...s, done: results[i] };
  });
  const { data: mp } = await db.from("client_master_plans").select("created_at").eq("id", masterPlanId).maybeSingle();
  const startedAt = (mp?.created_at as string) ?? null;
  const day = startedAt ? Math.max(1, Math.floor((Date.now() - new Date(startedAt).getTime()) / 86400000) + 1) : 1;
  return { steps, done: steps.filter((s) => s.done).length, total: steps.length, day, startedAt };
}
