import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { planningAssistant, planningSystem, runJson } from "@/lib/ai/planningAi";

export const dynamic = "force-dynamic";

// The client's own assistant proposes an Operating Rhythm — the daily, weekly and
// monthly routines that would keep THEIR business running — from what it knows
// (their weakest areas, plans, goals, income, pipeline). It skips anything they
// already do. Nothing is saved: they pick the ones they want and add them.
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const a = await planningAssistant();
  if (!a) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!a.key) return NextResponse.json({ needsKey: true });

  const { data } = await createServerClient().from("recurring_tasks").select("title, cadence").eq("master_plan_id", a.planId);
  const have = ((data ?? []) as { title: string; cadence: string }[]).map((r) => `${r.cadence}: ${r.title}`);

  const system = planningSystem(
    a,
    "helping this client design their Operating Rhythm.",
    "An Operating Rhythm is the small set of routines a business repeats on a schedule to stay healthy: daily habits, a weekly review, a monthly check-in. Propose 6 to 9 routines that fit THIS client's business — tie them to their weakest areas, their plans and goals, and how they earn — and keep each one small and concrete (under 60 characters). Mix cadences (2–3 daily, 2–3 weekly, 1–3 monthly). Do not repeat routines they already have. " +
      'Return STRICT JSON: {"items":[{"title":"the routine","cadence":"daily|weekly|monthly","dayOfWeek":<0-6 for weekly, 0=Sunday>,"dayOfMonth":<1-28 for monthly>,"why":"a few words tying it to their business"}]}.'
  );
  const out = await runJson(a, system, `Routines they already have: ${have.length ? have.join("; ") : "none"}.`, 900, 0.5);
  const items = (Array.isArray(out?.items) ? out!.items : [])
    .map((x) => {
      const r = x as Record<string, unknown>;
      const cadence = ["daily", "weekly", "monthly"].includes(String(r.cadence)) ? (String(r.cadence) as "daily" | "weekly" | "monthly") : null;
      const title = String(r.title ?? "").trim().slice(0, 100);
      if (!cadence || !title) return null;
      const dow = Math.round(Number(r.dayOfWeek));
      const dom = Math.round(Number(r.dayOfMonth));
      return {
        title, cadence,
        daysOfWeek: cadence === "weekly" ? [dow >= 0 && dow <= 6 ? dow : 1] : [],
        dayOfMonth: cadence === "monthly" ? (dom >= 1 && dom <= 28 ? dom : 1) : null,
        why: String(r.why ?? "").trim().slice(0, 120),
      };
    })
    .filter((i): i is NonNullable<typeof i> => i !== null)
    .slice(0, 10);
  if (!items.length) return NextResponse.json({ error: "Couldn't suggest a rhythm — try again." }, { status: 502 });
  return NextResponse.json({ items, assistant: a.name });
}
