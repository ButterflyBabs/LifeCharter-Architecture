import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crmAccount } from "../crm/guard";
import { parseAdsExport } from "@/lib/metaAdsCsv";
import { QUESTIONS } from "@/lib/metaAdsReport";
import { saveRows, snapshot } from "@/lib/metaAdsServer";

export const dynamic = "force-dynamic";

const day = (s: unknown) => (typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null);
const money = (s: unknown) => {
  if (s == null || s === "") return null;
  const n = Number(String(s).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n >= 0 ? n : null;
};

// POST { action: "upload", text, start?, end? }: the file exported from Ads Manager (Ads tab), read and saved, and the report rebuilt.
// POST { action: "goals", answers: { [questionId]: string } }: the owner's answers to the guided questions.
export async function POST(request: Request) {
  const a = await crmAccount(request);
  if ("denied" in a) return a.denied;
  const db = createServerClient();
  const body = (await request.json().catch(() => ({}))) as { action?: string; text?: string; start?: string; end?: string; answers?: Record<string, string> };

  if (body.action === "upload") {
    const text = String(body.text ?? "");
    if (text.length > 3_000_000) return NextResponse.json({ error: "That file is too large." }, { status: 413 });
    const start = day(body.start);
    const end = day(body.end);
    const { rows, problems } = parseAdsExport(text, start && end ? { start, end } : undefined);
    if (problems.length) return NextResponse.json({ error: problems[0], needDates: /no reporting dates/.test(problems[0]) }, { status: 400 });
    await saveRows(db, a.planId, rows);
    await snapshot(db, a.planId);
    return NextResponse.json({ ok: true, ads: rows.length, periodStart: rows[0].periodStart, periodEnd: rows[0].periodEnd });
  }

  if (body.action === "goals") {
    const answers: Record<string, string> = {};
    for (const q of QUESTIONS) {
      const v = body.answers?.[q.id];
      if (typeof v === "string" && v.trim()) answers[q.id] = v.trim().slice(0, 200);
    }
    const goalLeads = money(answers.goalLeads);
    const { error } = await db.from("meta_ad_goals").upsert(
      {
        master_plan_id: a.planId,
        target_cpl: money(answers.targetCpl),
        daily_budget: money(answers.dailyBudget),
        customer_value: money(answers.customerValue),
        goal_leads: goalLeads == null ? null : Math.round(goalLeads),
        event_anchor: day(answers.eventDate),
        cycle_days: Number(answers.cycleDays) > 0 ? Math.round(Number(answers.cycleDays)) : null,
        cycle_hour: 19,
        monthly_limit: money(answers.monthlyLimit),
        answers,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "master_plan_id" },
    );
    if (error) return NextResponse.json({ error: "Couldn't save your answers." }, { status: 500 });
    await snapshot(db, a.planId);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
