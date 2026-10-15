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
  // ?checklist=1: every step that is waiting on YOU, from the newest report of each task and reminder, one row per step.
  if (q.get("checklist")) {
    const dbc = createServerClient();
    const { data } = await dbc.from("assistant_reports").select("id, item_type, item_key, item_title, report, created_at").eq("master_plan_id", planId).order("created_at", { ascending: false }).limit(200);
    const seen = new Set<string>();
    const rows: { reportId: string; index: number; itemType: string; itemKey: string; itemTitle: string; step: Record<string, unknown> }[] = [];
    for (const r of (data ?? []) as { id: string; item_type: string; item_key: string; item_title: string; report: { next_steps?: Record<string, unknown>[] } }[]) {
      const k = `${r.item_type}:${r.item_key}`;
      if (seen.has(k)) continue;
      seen.add(k);
      (r.report?.next_steps ?? []).forEach((st, index) => {
        if ((st.who === "you" || st.who === "both") && st.status !== "done" && st.status !== "scheduled") {
          rows.push({ reportId: r.id, index, itemType: r.item_type, itemKey: r.item_key, itemTitle: r.item_title, step: st });
        }
      });
    }
    return NextResponse.json({ checklist: rows.slice(0, 60) });
  }
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

// POST { id, step, status: "done" | "waiting" }: the client closes (or reopens) one next step on a report.
export async function POST(request: Request) {
  const planId = await resolveMasterPlanId();
  if (!planId) return NextResponse.json({ error: "No account found." }, { status: 400 });
  const b = await request.json().catch(() => ({}));
  const id = typeof b.id === "string" ? b.id : "";
  const step = typeof b.step === "number" ? Math.round(b.step) : -1;
  if (!id || step < 0 || !["done", "waiting"].includes(b.status)) return NextResponse.json({ error: "Bad request." }, { status: 400 });
  const db = createServerClient();
  const { data: row } = await db.from("assistant_reports").select("report").eq("id", id).eq("master_plan_id", planId).maybeSingle();
  const report = (row?.report ?? null) as { next_steps?: Record<string, unknown>[] } | null;
  if (!report?.next_steps?.[step]) return NextResponse.json({ error: "I can't find that step." }, { status: 404 });
  report.next_steps[step] = b.status === "done"
    ? { ...report.next_steps[step], status: "done", waiting_on: "" }
    : { ...report.next_steps[step], status: "waiting", waiting_on: String(report.next_steps[step].waiting_on || "Reopened by you: it still needs to be done") };
  const { error } = await db.from("assistant_reports").update({ report }).eq("id", id).eq("master_plan_id", planId);
  return error ? NextResponse.json({ error: "That didn't save." }, { status: 500 }) : NextResponse.json({ ok: true, step: report.next_steps[step] });
}
