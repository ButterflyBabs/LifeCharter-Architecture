import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { resolveAiConfig } from "@/lib/ai/config";
import { BLUEPRINTS, PLAN_KINDS } from "@/lib/plans/blueprints";
import { buildForecast } from "@/lib/planning/forecastData";

export const dynamic = "force-dynamic";

const PROPOSAL_TYPES: Record<string, string> = {
  grant: "grant application",
  investor: "investor pitch / funding request",
  partnership: "partnership proposal",
  loan: "small-business loan application narrative",
  sponsorship: "sponsorship proposal",
};

const usd = (n: number) => `$${Math.round(n).toLocaleString()}`;

// GET — history of generated proposals, or one proposal's content
// (?id=...), or a Markdown download (?id=...&download=1).
export async function GET(request: Request) {
  const supabase = createServerClient();
  const masterPlanId = await resolveMasterPlanId();
  if (!masterPlanId) return NextResponse.json({ proposals: [] });
  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (id) {
    const { data } = await supabase
      .from("plan_proposals")
      .select("id, proposal_type, target, title, content, created_at")
      .eq("master_plan_id", masterPlanId)
      .eq("id", id)
      .maybeSingle();
    if (!data) return NextResponse.json({ error: "not found" }, { status: 404 });
    if (url.searchParams.get("download")) {
      const fname = `${(data.title || "proposal").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.md`;
      return new NextResponse(data.content as string, {
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "Content-Disposition": `attachment; filename="${fname}"`,
          "Cache-Control": "no-store",
        },
      });
    }
    return NextResponse.json({ proposal: data });
  }

  const { data } = await supabase
    .from("plan_proposals")
    .select("id, proposal_type, target, title, created_at")
    .eq("master_plan_id", masterPlanId)
    .order("created_at", { ascending: false })
    .limit(30);
  return NextResponse.json({ proposals: data || [] });
}

// GET single content: /api/plans/proposal?id=... handled here too via query.
// POST { proposalType, target?, notes? } — assemble a proposal from all plans.
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }
  const body = await request.json().catch(() => ({}));
  const proposalType = PROPOSAL_TYPES[body.proposalType] ? body.proposalType : "grant";
  const target = typeof body.target === "string" ? body.target.trim() : "";
  const notes = typeof body.notes === "string" ? body.notes.trim() : "";

  const masterPlanId = await resolveMasterPlanId();
  if (!masterPlanId) return NextResponse.json({ error: "no workspace" }, { status: 400 });
  const { name, key } = await resolveAiConfig();
  if (!key) return NextResponse.json({ needsKey: true });

  const supabase = createServerClient();

  // Gather every written plan section across all four plans.
  const { data: secs } = await supabase
    .from("plan_sections")
    .select("plan_type, section_key, content")
    .eq("master_plan_id", masterPlanId);
  const rows = ((secs || []) as { plan_type: string; section_key: string; content: string | null }[]).filter(
    (r) => (r.content || "").trim()
  );
  const planText = PLAN_KINDS.map((kind) => {
    const bp = BLUEPRINTS[kind];
    const mine = rows.filter((r) => r.plan_type === kind);
    if (mine.length === 0) return "";
    const body = mine
      .map((r) => {
        const t = bp.sections.find((s) => s.key === r.section_key)?.title || r.section_key;
        return `### ${t}\n${(r.content || "").slice(0, 700)}`;
      })
      .join("\n\n");
    return `# ${bp.label}\n${body}`;
  })
    .filter(Boolean)
    .join("\n\n");

  if (!planText) {
    return NextResponse.json(
      { error: "Write some of your plans first — the proposal is assembled from them." },
      { status: 400 }
    );
  }

  // Finance + forecast for the numbers section.
  const now = new Date();
  const yearStart = `${now.getUTCFullYear()}-01-01`;
  const { data: fin } = await supabase
    .from("finance_entries")
    .select("type, amount")
    .eq("master_plan_id", masterPlanId)
    .gte("occurred_on", yearStart);
  let inc = 0;
  let exp = 0;
  for (const e of (fin || []) as { type: string; amount: number | string | null }[]) {
    const a = Number(e.amount ?? 0);
    if (e.type === "income") inc += a;
    else exp += a;
  }
  let forecastLine = "";
  try {
    const f = await buildForecast(masterPlanId);
    const expected = f.scenarios.find((s) => s.key === "expected");
    if (expected) forecastLine = `Expected ${f.assumptions.horizonMonths}-month projection: revenue ${usd(expected.totalRevenue)}, net ${usd(expected.totalNet)}.`;
  } catch {
    /* optional */
  }

  const sys =
    `You are ${name}, an expert grant writer and business-proposal strategist. ` +
    `Write a complete, compelling ${PROPOSAL_TYPES[proposalType]} for this founder, assembled from their own plans and numbers below. ` +
    "This is a legacy business — convey vision, credibility, and impact, backed by specifics. " +
    "Structure it properly for its type (e.g. a grant: executive summary, organization background, statement of need, project description, goals & measurable outcomes, budget/use of funds, sustainability, and a closing). " +
    "Use the founder's real plan content and figures; where a detail is missing, insert a clearly-marked [bracketed placeholder] for them to fill. " +
    'Return STRICT JSON: {"title":"a fitting proposal title","content":"the full proposal in Markdown"}. Make the content thorough and ready to edit.';

  const userText =
    `Proposal type: ${PROPOSAL_TYPES[proposalType]}.` +
    (target ? ` Target funder/recipient: ${target}.` : "") +
    (notes ? ` Additional context: ${notes}.` : "") +
    `\n\n--- THE FOUNDER'S PLANS ---\n${planText}\n\n` +
    `--- NUMBERS ---\nYTD income ${usd(inc)}, expenses ${usd(exp)}, net ${usd(inc - exp)}. ${forecastLine}`;

  try {
    const openai = new OpenAI({ apiKey: key });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: sys },
        { role: "user", content: userText },
      ],
      max_tokens: 2600,
      temperature: 0.5,
      response_format: { type: "json_object" },
    });
    const raw = completion.choices[0]?.message?.content?.trim() || "{}";
    let parsed: { title?: string; content?: string } = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = {};
    }
    const content = String(parsed.content || "").trim();
    if (!content) return NextResponse.json({ error: "Couldn't draft the proposal — try again." }, { status: 502 });
    const title = String(parsed.title || `${PROPOSAL_TYPES[proposalType]}`).slice(0, 160);

    const { data: inserted } = await supabase
      .from("plan_proposals")
      .insert({ master_plan_id: masterPlanId, proposal_type: proposalType, target, title, content })
      .select("id")
      .single();

    return NextResponse.json({ id: inserted?.id || null, title, content });
  } catch (e) {
    console.error("POST /api/plans/proposal:", e);
    return NextResponse.json({ error: "Couldn't reach the AI just now — try again." }, { status: 502 });
  }
}
