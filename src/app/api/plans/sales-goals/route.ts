import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { planningAssistant, planningSystem, runJson } from "@/lib/ai/planningAi";
import { ACTIVITY_TYPES } from "@/lib/salesActivities";

export const dynamic = "force-dynamic";

// The assistant reads the client's Sales Plan, income goals, pipeline and how
// much selling activity they actually do, and proposes weekly activity targets.
// Nothing is saved here — the client reviews, then applies them (they become the
// weekly goals on Sales Activities, the Weekly View and Today's Activity).
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const a = await planningAssistant();
  if (!a) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!a.key) return NextResponse.json({ needsKey: true });

  const db = createServerClient();
  const since = new Date(Date.now() - 28 * 86400000).toISOString().slice(0, 10);
  const [{ data: acts }, { data: goals }] = await Promise.all([
    db.from("sales_activities").select("type").eq("master_plan_id", a.planId).gte("occurred_on", since),
    db.from("sales_goals").select("activity_type, weekly_target").eq("master_plan_id", a.planId),
  ]);
  const counts: Record<string, number> = {};
  for (const r of (acts ?? []) as { type: string }[]) counts[r.type] = (counts[r.type] ?? 0) + 1;
  const ids = ACTIVITY_TYPES.map((t) => t.id as string);
  const recent = ids.map((t) => `${t} ${((counts[t] ?? 0) / 4).toFixed(1)}/week`).join(", ");
  const current = ((goals ?? []) as { activity_type: string; weekly_target: number }[]).map((g) => `${g.activity_type} ${g.weekly_target}`).join(", ") || "none set";

  const system = planningSystem(
    a,
    "a sharp sales coach setting this client's weekly activity targets.",
    "Propose realistic but stretching weekly targets for each activity type, worked backwards from their Sales Plan, their income goals and pipeline above, and what they actually manage today. " +
      "Don't ask for a big jump from their current pace unless the plan calls for it. " +
      `Return STRICT JSON: {"targets":{${ids.map((t) => `"${t}":<integer per week>`).join(",")}},"rationale":"2-3 sentences explaining the targets in terms of their plan and numbers"}.`
  );
  const out = await runJson(a, system, `Their pace over the last 4 weeks: ${recent}.\nTheir current weekly targets: ${current}.`, 500, 0.3);
  const t = (out?.targets ?? null) as Record<string, unknown> | null;
  if (!out || !t) return NextResponse.json({ error: "Couldn't suggest targets — try again." }, { status: 502 });

  const targets: Record<string, number> = {};
  for (const id of ids) {
    const n = Math.round(Number(t[id]));
    if (Number.isFinite(n) && n >= 0) targets[id] = Math.min(n, 500);
  }
  return NextResponse.json({ targets, rationale: String(out.rationale || "").trim().slice(0, 500), assistant: a.name, current: Object.fromEntries(((goals ?? []) as { activity_type: string; weekly_target: number }[]).map((g) => [g.activity_type, g.weekly_target])) });
}
