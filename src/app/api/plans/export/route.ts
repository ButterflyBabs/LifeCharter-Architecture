import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { resolveAiConfig } from "@/lib/ai/config";
import { assembleDoc, defaultNames, planProgress, type ExportOptions } from "@/lib/plans/export/assemble";
import { renderPdf } from "@/lib/plans/export/pdf";
import { renderDocx } from "@/lib/plans/export/docx";
import { templateLetter, VERSION_LABEL, type Version } from "@/lib/plans/export/model";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const str = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");
const VERSIONS: Version[] = ["funding", "partnership", "general"];

// GET: how far along each plan is, and the names to prefill. The printable plan unlocks only when EVERY section of
// the Business Plan is marked Complete.
export async function GET() {
  const planId = await resolveMasterPlanId();
  if (!planId) return NextResponse.json({ error: "No workspace." }, { status: 400 });
  const db = createServerClient();
  const [progress, names] = await Promise.all([planProgress(db, planId), defaultNames(db, planId)]);
  return NextResponse.json({ progress, ...names, unlocked: progress.business.ready });
}

// POST { action: "letter", ... } writes a cover letter; otherwise builds the file ({ format: "pdf" | "docx", ... }).
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const planId = await resolveMasterPlanId();
  if (!planId) return NextResponse.json({ error: "No workspace." }, { status: 400 });
  const body = await request.json().catch(() => ({}));
  const db = createServerClient();

  const version: Version = VERSIONS.includes(body.version) ? body.version : "funding";
  const business = str(body.business, 120);
  const preparedBy = str(body.preparedBy, 120);
  const recipient = str(body.recipient, 120);
  const organization = str(body.organization, 160);
  const ask = str(body.ask, 600);
  if (!business) return NextResponse.json({ error: "Add your business name first." }, { status: 400 });

  const progress = await planProgress(db, planId);
  if (!progress.business.ready) {
    return NextResponse.json({ error: `Mark every Business Plan section complete first (${progress.business.complete} of ${progress.business.total} are).` }, { status: 403 });
  }

  const { data: vis } = await db.from("plan_sections").select("content").eq("master_plan_id", planId).eq("plan_type", "business").eq("section_key", "vision_mission").maybeSingle();
  const vision = ((vis as { content?: string } | null)?.content || "").trim();

  if (body.action === "letter") {
    const fallback = templateLetter(version, { business, recipient, organization, ask, vision });
    const key = (await resolveAiConfig()).key;
    if (!key) return NextResponse.json({ paragraphs: fallback, ai: false });
    try {
      const { data: secs } = await db.from("plan_sections").select("section_key, content").eq("master_plan_id", planId).eq("plan_type", "business").in("section_key", ["vision_mission", "offering", "target_market", "revenue_model", "goals_milestones"]);
      const facts = ((secs || []) as { section_key: string; content: string | null }[]).map((s) => `${s.section_key}: ${(s.content || "").slice(0, 600)}`).join("\n\n");
      const res = await new OpenAI({ apiKey: key }).chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.5,
        max_tokens: 700,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              `You write the cover letter that goes with a business plan. It is a ${VERSION_LABEL[version]}. Write 3 to 4 short paragraphs in the founder's warm, direct voice, first person. Use ONLY facts from the plan excerpts and the details given; never invent numbers, names, credentials or promises. State the ask plainly in the first paragraph, say in one or two sentences what the business does and who it serves, say what the attached plan contains, and end by offering a conversation. No greeting line and no sign-off (they are added separately). Return STRICT JSON: {"paragraphs":["...","..."]}.`,
          },
          { role: "user", content: `Business: ${business}\nFrom: ${preparedBy || "the founder"}\nTo: ${recipient || "(not named)"} at ${organization || "(organization not named)"}\nThe ask: ${ask || "(not stated)"}\n\nPlan excerpts:\n${facts}` },
        ],
      });
      const parsed = JSON.parse(res.choices[0]?.message?.content || "{}") as { paragraphs?: unknown };
      const paras = Array.isArray(parsed.paragraphs) ? parsed.paragraphs.filter((p): p is string => typeof p === "string" && p.trim().length > 0).map((p) => p.trim()) : [];
      if (!paras.length) return NextResponse.json({ paragraphs: fallback, ai: false });
      return NextResponse.json({ paragraphs: [fallback[0], ...paras], ai: true });
    } catch (e) {
      console.error("plan export letter:", e);
      return NextResponse.json({ paragraphs: fallback, ai: false });
    }
  }

  const appendices = (Array.isArray(body.appendices) ? body.appendices : []).filter((k: unknown): k is string => typeof k === "string" && ["marketing", "sales", "forecasting"].includes(k));
  const notReady = appendices.filter((k: string) => !progress[k]?.ready);
  if (notReady.length) return NextResponse.json({ error: `Mark every section complete in: ${notReady.map((k: string) => progress[k].label).join(", ")}, or leave it out.` }, { status: 403 });

  const letterIn = Array.isArray(body.letter) ? (body.letter as unknown[]).filter((p): p is string => typeof p === "string" && p.trim().length > 0).map((p) => p.trim().slice(0, 2000)).slice(0, 12) : null;
  const opts: ExportOptions = { version, business, preparedBy, recipient, organization, ask, letter: letterIn && letterIn.length ? letterIn : null, appendices, includeFinance: body.includeFinance !== false };

  try {
    const doc = await assembleDoc(db, planId, opts);
    const format = body.format === "docx" ? "docx" : "pdf";
    const slug = business.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "business";
    const name = `${slug}-business-plan-${new Date().toISOString().slice(0, 10)}.${format}`;
    const file = format === "docx" ? await renderDocx(doc) : renderPdf(doc);
    return new NextResponse(new Uint8Array(file), {
      headers: {
        "Content-Type": format === "docx" ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document" : "application/pdf",
        "Content-Disposition": `attachment; filename="${name}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("plan export:", e);
    return NextResponse.json({ error: "Couldn't build the document. Try again." }, { status: 500 });
  }
}
