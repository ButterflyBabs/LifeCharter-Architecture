import { NextResponse } from "next/server";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { createServerClient } from "@/lib/supabase/server";
import { toCard } from "@/lib/ai/actions/engine";

export const dynamic = "force-dynamic";

// The assistant's saved reports on tasks and reminders.
//   GET ?type=task|reminder            which items have a report (key + when), newest first
//   GET ?type=...&key=<id>             the newest report for one item, with the cards prepared alongside it
//                                      (live status, so Approve / Edit / Cancel work from the report) and the history
export async function GET(request: Request) {
  const planId = await resolveMasterPlanId();
  if (!planId) return NextResponse.json({ items: [] });
  const q = new URL(request.url).searchParams;
  const type = q.get("type") === "task" ? "task" : "reminder";
  const key = (q.get("key") || "").slice(0, 80);
  const db = createServerClient();

  if (!key) {
    const { data } = await db.from("assistant_reports").select("item_key, created_at").eq("master_plan_id", planId).eq("item_type", type).order("created_at", { ascending: false }).limit(300);
    const seen = new Set<string>();
    const items: { key: string; createdAt: string }[] = [];
    for (const r of (data ?? []) as { item_key: string; created_at: string }[]) {
      if (seen.has(r.item_key)) continue;
      seen.add(r.item_key);
      items.push({ key: r.item_key, createdAt: r.created_at });
    }
    return NextResponse.json({ items });
  }

  const { data: rows } = await db
    .from("assistant_reports")
    .select("id, item_title, report, related_action_ids, created_at")
    .eq("master_plan_id", planId)
    .eq("item_type", type)
    .eq("item_key", key)
    .order("created_at", { ascending: false })
    .limit(10);
  const list = (rows ?? []) as { id: string; item_title: string; report: unknown; related_action_ids: string[] | null; created_at: string }[];
  if (!list.length) return NextResponse.json({ report: null, actions: [], history: [] });
  const latest = list[0];
  const ids = (latest.related_action_ids ?? []).slice(0, 10);
  let actions: ReturnType<typeof toCard>[] = [];
  if (ids.length) {
    const { data } = await db.from("assistant_actions").select("id, tool, status, preview, result, undo, error, args").eq("master_plan_id", planId).in("id", ids);
    actions = ((data ?? []) as Record<string, unknown>[]).map(toCard);
  }
  return NextResponse.json({
    report: { id: latest.id, title: latest.item_title, createdAt: latest.created_at, ...(latest.report as Record<string, unknown>) },
    actions,
    history: list.slice(1).map((r) => ({ id: r.id, createdAt: r.created_at, summary: ((r.report as { summary?: string })?.summary ?? "").slice(0, 160) })),
  });
}
