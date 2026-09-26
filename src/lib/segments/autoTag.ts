import { createServerClient } from "@/lib/supabase/server";
import { planBusinessIds } from "@/lib/planScope";

// Finds a client's own activity that isn't tied to any segment yet, so their
// assistant can propose where it belongs. Everything is scoped to one client's
// plan. Ledger entries that repeat (same kind, category and description) are
// grouped, so a pattern is decided once instead of row by row.

export type TagKind = "ledger" | "task" | "goal" | "sales";
export interface Untagged {
  ref: string; // short id used with the model
  kind: TagKind;
  label: string;
  detail: string;
  ids: string[]; // every row this decision covers
}
export interface SegmentInfo { id: number; name: string; business: string; description: string }

const LIMITS = { ledger: 45, task: 30, goal: 15, sales: 30 };
const norm = (s: string | null | undefined) => (s || "").toLowerCase().replace(/\s+/g, " ").replace(/\d{1,2}[/-]\d{1,2}([/-]\d{2,4})?/g, "").trim();
const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

export async function loadSegments(planId: string): Promise<SegmentInfo[]> {
  const bizIds = await planBusinessIds(planId);
  if (!bizIds.length) return [];
  const db = createServerClient();
  const [{ data: biz }, { data: segs }] = await Promise.all([
    db.from("businesses").select("id, name").in("id", bizIds).eq("active", true),
    db.from("segments").select("id, business_id, name, description").in("business_id", bizIds).eq("active", true).order("sort_order"),
  ]);
  const name = new Map(((biz ?? []) as { id: number; name: string }[]).map((b) => [b.id, b.name]));
  return ((segs ?? []) as { id: number; business_id: number; name: string; description: string | null }[]).map((s) => ({
    id: s.id, name: s.name, business: name.get(s.business_id) ?? "", description: s.description || "",
  }));
}

// Counts only (cheap) — for the "N items aren't tied to a segment" nudge.
export async function countUntagged(planId: string) {
  const db = createServerClient();
  const since = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);
  const yearAgo = new Date(Date.now() - 365 * 86400000).toISOString().slice(0, 10);
  const { data: plans } = await db.from("client_plans").select("id").eq("master_plan_id", planId).eq("status", "active");
  const planIds = ((plans ?? []) as { id: string }[]).map((p) => p.id);
  const head = { count: "exact" as const, head: true };
  const [l, t, g, s] = await Promise.all([
    db.from("finance_entries").select("id", head).eq("master_plan_id", planId).is("segment_id", null).gte("occurred_on", yearAgo),
    db.from("tasks").select("id", head).eq("master_plan_id", planId).is("segment_id", null),
    planIds.length ? db.from("client_plan_goals").select("id", head).in("plan_id", planIds).is("segment_id", null) : Promise.resolve({ count: 0 }),
    db.from("sales_activities").select("id", head).eq("master_plan_id", planId).is("segment_id", null).gte("occurred_on", since),
  ]);
  const c = { ledger: l.count ?? 0, tasks: t.count ?? 0, goals: g.count ?? 0, sales: s.count ?? 0 };
  return { ...c, total: c.ledger + c.tasks + c.goals + c.sales };
}

export async function collectUntagged(planId: string): Promise<Untagged[]> {
  const db = createServerClient();
  const since = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);
  const yearAgo = new Date(Date.now() - 365 * 86400000).toISOString().slice(0, 10);
  const { data: plans } = await db.from("client_plans").select("id").eq("master_plan_id", planId).eq("status", "active");
  const planIds = ((plans ?? []) as { id: string }[]).map((p) => p.id);
  const out: Untagged[] = [];
  let n = 0;
  const ref = (p: string) => `${p}${++n}`;

  // Ledger: group repeats.
  const { data: led } = await db
    .from("finance_entries").select("id, type, amount, category, description, occurred_on")
    .eq("master_plan_id", planId).is("segment_id", null).gte("occurred_on", yearAgo).order("occurred_on", { ascending: false }).limit(1500);
  const groups = new Map<string, { type: string; category: string; description: string; total: number; ids: string[]; latest: string }>();
  for (const e of (led ?? []) as { id: string; type: string; amount: number | string | null; category: string | null; description: string | null; occurred_on: string }[]) {
    const key = `${e.type}|${norm(e.category)}|${norm(e.description)}`;
    const g = groups.get(key) ?? { type: e.type, category: e.category || "", description: e.description || "", total: 0, ids: [], latest: e.occurred_on };
    g.total += Number(e.amount ?? 0);
    g.ids.push(e.id);
    groups.set(key, g);
  }
  Array.from(groups.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, LIMITS.ledger)
    .forEach((g) => {
      out.push({
        ref: ref("L"), kind: "ledger",
        label: `${g.type === "income" ? "Income" : "Expense"}: ${g.description || g.category || "(no description)"}`,
        detail: `${g.category ? `${g.category} · ` : ""}${g.ids.length} entr${g.ids.length === 1 ? "y" : "ies"}, ${usd(g.total)} total, latest ${g.latest}`,
        ids: g.ids,
      });
    });

  const { data: tasks } = await db
    .from("tasks").select("id, title, description, status, completed_at")
    .eq("master_plan_id", planId).is("segment_id", null).order("created_at", { ascending: false }).limit(200);
  ((tasks ?? []) as { id: string | number; title: string; description: string | null; status: string; completed_at: string | null }[])
    .filter((t) => t.status !== "done" || (t.completed_at && t.completed_at.slice(0, 10) >= since))
    .slice(0, LIMITS.task)
    .forEach((t) => out.push({ ref: ref("T"), kind: "task", label: `Task: ${t.title}`, detail: (t.description || "").slice(0, 120), ids: [String(t.id)] }));

  if (planIds.length) {
    const { data: goals } = await db.from("client_plan_goals").select("id, title, detail, dimension_key").in("plan_id", planIds).is("segment_id", null).limit(LIMITS.goal);
    ((goals ?? []) as { id: string; title: string; detail: string | null; dimension_key: string | null }[])
      .forEach((g) => out.push({ ref: ref("G"), kind: "goal", label: `Plan goal: ${g.title}`, detail: `${g.dimension_key ? `${g.dimension_key} · ` : ""}${(g.detail || "").slice(0, 120)}`, ids: [g.id] }));
  }

  const { data: sales } = await db
    .from("sales_activities").select("id, type, contact_name, contact_company, title, notes, occurred_on")
    .eq("master_plan_id", planId).is("segment_id", null).gte("occurred_on", since).order("occurred_on", { ascending: false }).limit(LIMITS.sales);
  ((sales ?? []) as { id: string; type: string; contact_name: string | null; contact_company: string | null; title: string | null; notes: string | null; occurred_on: string }[])
    .forEach((s) => out.push({
      ref: ref("S"), kind: "sales",
      label: `Sales ${s.type}: ${[s.contact_name, s.contact_company].filter(Boolean).join(" — ") || s.title || "(no name)"}`,
      detail: `${s.title || ""} ${(s.notes || "").slice(0, 100)}`.trim(),
      ids: [s.id],
    }));
  return out;
}
