import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { resolveUserTimeZone } from "@/lib/userTimezone";
import { zonedToUtcISO } from "@/lib/tz";
import { planningAssistant, planningSystem, runJson, cleanList } from "@/lib/ai/planningAi";
import { saveInsight } from "@/lib/ai/planKnowledge";
import { QUESTIONS, gatherNumbers, numbersText, periodFor, type ReviewCadence } from "@/lib/reviews";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// The guided weekly / monthly review:
//   GET ?cadence=weekly|monthly  → this period's review (if started) + recent history
//   POST { action: "start", cadence }            → live numbers + the assistant's briefing
//   POST { action: "propose", id, answers }      → saves answers, proposes 3 tasks
//   POST { action: "complete", id, tasks }       → creates the chosen tasks, closes the review

const cadenceOf = (v: unknown): ReviewCadence => (v === "monthly" ? "monthly" : "weekly");

export async function GET(request: Request) {
  const masterPlanId = await resolveMasterPlanId();
  if (!masterPlanId) return NextResponse.json({ error: "No account found." }, { status: 400 });
  const url = new URL(request.url);
  const cadence = cadenceOf(url.searchParams.get("cadence"));
  const tz = await resolveUserTimeZone(url.searchParams.get("tz"));
  const period = periodFor(cadence, tz);
  const db = createServerClient();
  const [{ data: current }, { data: history }] = await Promise.all([
    db.from("business_reviews").select("*").eq("master_plan_id", masterPlanId).eq("cadence", cadence).eq("period_start", period.start).maybeSingle(),
    db
      .from("business_reviews")
      .select("id, cadence, period_start, status, summary, tasks, completed_at")
      .eq("master_plan_id", masterPlanId)
      .eq("status", "completed")
      .order("period_start", { ascending: false })
      .limit(12),
  ]);
  return NextResponse.json({ cadence, period, questions: QUESTIONS[cadence], current: current ?? null, history: history ?? [] });
}

export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const masterPlanId = await resolveMasterPlanId();
  if (!masterPlanId) return NextResponse.json({ error: "No account found." }, { status: 400 });
  const body = await request.json().catch(() => ({}));
  const db = createServerClient();
  const tz = await resolveUserTimeZone(typeof body.tz === "string" ? body.tz : null);

  if (body.action === "start") {
    const cadence = cadenceOf(body.cadence);
    const period = periodFor(cadence, tz);
    const numbers = await gatherNumbers(masterPlanId, period, tz, cadence);

    let briefing: Record<string, unknown> = {};
    const a = await planningAssistant();
    if (a?.key) {
      const sys = planningSystem(
        a,
        `preparing their ${cadence} review with them.`,
        'Return STRICT JSON: {"headline":"one sentence on how the period went","wins":["up to 3 specific things that went well"],"watch":["up to 3 things that need attention"],"focus":"one sentence: the single most useful focus for the next period"}. ' +
          "Base every point on THE PERIOD'S NUMBERS below and what you know about them. Warm, direct, specific. No generic advice."
      );
      const out = await runJson(a, sys, `THE PERIOD: ${period.label}\nTHE PERIOD'S NUMBERS:\n${numbersText(numbers, cadence)}`, 700);
      if (out) {
        briefing = {
          headline: String(out.headline || "").slice(0, 300),
          wins: (Array.isArray(out.wins) ? out.wins : []).slice(0, 3).map((x) => String(x).slice(0, 300)),
          watch: (Array.isArray(out.watch) ? out.watch : []).slice(0, 3).map((x) => String(x).slice(0, 300)),
          focus: String(out.focus || "").slice(0, 300),
          assistant: a.name,
        };
      }
    } else {
      briefing = { needsKey: true };
    }

    const { data, error } = await db
      .from("business_reviews")
      .upsert(
        { master_plan_id: masterPlanId, cadence, period_start: period.start, numbers, briefing, status: "in_progress" },
        { onConflict: "master_plan_id,cadence,period_start" }
      )
      .select("*")
      .single();
    if (error) {
      console.error("review start:", error.message);
      return NextResponse.json({ error: "Couldn't start the review." }, { status: 500 });
    }
    return NextResponse.json({ review: data, period, questions: QUESTIONS[cadence] });
  }

  const id = typeof body.id === "string" ? body.id : "";
  const { data: review } = await db.from("business_reviews").select("*").eq("id", id).eq("master_plan_id", masterPlanId).maybeSingle();
  if (!review) return NextResponse.json({ error: "Review not found." }, { status: 404 });
  const cadence = cadenceOf(review.cadence);
  const period = periodFor(cadence, tz);

  if (body.action === "propose") {
    const answers: Record<string, string> = {};
    for (const q of QUESTIONS[cadence]) {
      const v = body.answers?.[q.id];
      if (typeof v === "string") answers[q.id] = v.trim().slice(0, 2000);
    }
    let proposed: Record<string, string>[] = [];
    const a = await planningAssistant();
    if (a?.key) {
      const sys = planningSystem(
        a,
        `closing out their ${cadence} review with them.`,
        `Return STRICT JSON: {"tasks":[{"title":"short, specific action (max 90 chars)","why":"one sentence tying it to their answers or numbers","day":"YYYY-MM-DD within ${period.nextStart}..${period.nextEnd}"}]} with EXACTLY 3 tasks for the next ${cadence === "weekly" ? "week" : "month"}. ` +
          "Each task must be doable, concrete and theirs (their offers, deals, goals). Lead with what they said matters most next."
      );
      const qa = QUESTIONS[cadence].map((q) => `${q.q}\n${answers[q.id] || "(no answer)"}`).join("\n\n");
      const out = await runJson(a, sys, `NUMBERS:\n${numbersText(review.numbers, cadence)}\n\nTHEIR ANSWERS:\n${qa}`, 700);
      proposed = cleanList(out?.tasks, 3, ["title", "why", "day"]).map((t) => ({
        ...t,
        day: /^\d{4}-\d{2}-\d{2}$/.test(t.day) && t.day >= period.nextStart && t.day <= period.nextEnd ? t.day : period.nextStart,
      }));
    }
    await db.from("business_reviews").update({ answers, proposed }).eq("id", id);
    return NextResponse.json({ proposed, needsKey: !a?.key });
  }

  if (body.action === "complete") {
    const chosen = (Array.isArray(body.tasks) ? body.tasks : [])
      .slice(0, 5)
      .map((t: Record<string, unknown>) => ({
        title: String(t?.title || "").trim().slice(0, 200),
        why: String(t?.why || "").trim().slice(0, 400),
        day: typeof t?.day === "string" && /^\d{4}-\d{2}-\d{2}$/.test(t.day) ? t.day : period.nextStart,
      }))
      .filter((t: { title: string }) => t.title);
    const created: { id: number; title: string; day: string }[] = [];
    for (const t of chosen) {
      const { data } = await db
        .from("tasks")
        .insert({
          master_plan_id: masterPlanId,
          title: t.title,
          description: t.why ? `From your ${cadence} review: ${t.why}` : `From your ${cadence} review.`,
          status: "backlog",
          priority: "high",
          due_at: zonedToUtcISO(t.day, "23:59", tz),
          due_has_time: false,
          time_kind: "deadline",
        })
        .select("id")
        .single();
      if (data) created.push({ id: data.id as number, title: t.title, day: t.day });
    }
    const answers = (review.answers || {}) as Record<string, string>;
    const nextQ = QUESTIONS[cadence].find((q) => q.id === "next");
    const summary =
      `${cadence === "weekly" ? "Weekly" : "Monthly"} review, ${new Date(`${review.period_start}T00:00:00Z`).toLocaleDateString("en-US", { timeZone: "UTC", month: "short", day: "numeric", year: "numeric" })}: ` +
      `${(review.briefing as { headline?: string })?.headline || ""} ` +
      (nextQ && answers[nextQ.id] ? `Their focus next: ${answers[nextQ.id].slice(0, 200)}. ` : "") +
      (created.length ? `Committed to: ${created.map((c) => c.title).join("; ")}.` : "");
    await db.from("business_reviews").update({ tasks: created, summary: summary.trim(), status: "completed", completed_at: new Date().toISOString() }).eq("id", id);
    // Started from a scheduled Planning Session: close it, with this review as its notes.
    if (typeof body.sessionId === "string" && body.sessionId) {
      await db
        .from("planning_reviews")
        .update({ status: "completed", completed_at: new Date().toISOString(), notes: summary.trim().slice(0, 2000) })
        .eq("id", body.sessionId)
        .eq("master_plan_id", masterPlanId);
    }
    try {
      await saveInsight(masterPlanId, "review", (review.briefing as { assistant?: string })?.assistant || "", { summary: summary.trim(), cadence });
    } catch {
      /* optional */
    }
    return NextResponse.json({ ok: true, created });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
