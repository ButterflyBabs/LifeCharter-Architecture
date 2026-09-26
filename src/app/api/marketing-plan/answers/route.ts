import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { cleanGuideAnswers, isGuidePage, type GuideAnswers } from "@/lib/marketing/guideQuestions";

export const dynamic = "force-dynamic";

// Answers to the Marketing Plan guided questionnaires, one plan_sections row
// per page per account under plan_type "marketing_guide". Kept apart from the
// "marketing" plan builder's rows (which it overwrites wholesale on save), and
// content stays empty so plan scoring/proposals, which read content, skip them.
const PLAN_TYPE = "marketing_guide";

interface Row {
  section_key: string;
  answers: GuideAnswers | null;
  status: string | null;
  updated_at: string | null;
}

// GET ?page=ideal-client → { answers, complete, updatedAt }
// GET (no page)          → { pages: { [page]: { answers, complete, updatedAt } } }
export async function GET(request: Request) {
  const page = new URL(request.url).searchParams.get("page");
  if (page !== null && !isGuidePage(page)) return NextResponse.json({ error: "Unknown page." }, { status: 400 });

  const masterPlanId = await resolveMasterPlanId();
  if (!masterPlanId) return NextResponse.json(page ? { answers: {}, complete: false, updatedAt: null } : { pages: {} });

  let q = createServerClient()
    .from("plan_sections")
    .select("section_key, answers, status, updated_at")
    .eq("master_plan_id", masterPlanId)
    .eq("plan_type", PLAN_TYPE);
  if (page) q = q.eq("section_key", page);
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: "Couldn't load your answers." }, { status: 500 });

  const shape = (r: Row | undefined) => ({
    answers: r?.answers || {},
    complete: r?.status === "done",
    updatedAt: r?.updated_at ?? null,
  });
  const rows = (data || []) as Row[];
  if (page) return NextResponse.json(shape(rows[0]));
  return NextResponse.json({ pages: Object.fromEntries(rows.map((r) => [r.section_key, shape(r)])) });
}

// PUT { page, answers, complete? } — replaces that page's saved answers.
export async function PUT(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  if (!isGuidePage(body.page)) return NextResponse.json({ error: "Unknown page." }, { status: 400 });

  const masterPlanId = await resolveMasterPlanId();
  if (!masterPlanId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const now = new Date().toISOString();
  const { error } = await createServerClient()
    .from("plan_sections")
    .upsert(
      {
        master_plan_id: masterPlanId,
        plan_type: PLAN_TYPE,
        section_key: body.page,
        answers: cleanGuideAnswers(body.page, body.answers),
        content: "",
        status: body.complete === true ? "done" : "edited",
        source: "client",
        updated_at: now,
      },
      { onConflict: "master_plan_id,plan_type,section_key" }
    );
  if (error) return NextResponse.json({ error: "Couldn't save your answers." }, { status: 500 });
  return NextResponse.json({ ok: true, updatedAt: now });
}
