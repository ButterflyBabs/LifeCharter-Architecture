import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { KNOWLEDGE_BASE, KB_CATEGORIES, type KbEntry } from "@/lib/knowledgeBase";

export const dynamic = "force-dynamic";

// GET — the full Q&A: built-in knowledge base merged with this client's own
// entries. Powers the Help page.
export async function GET() {
  const supabase = createServerClient();
  const masterPlanId = await resolveMasterPlanId();

  let custom: KbEntry[] = [];
  if (masterPlanId) {
    const { data } = await supabase
      .from("qa_entries")
      .select("id, category, question, answer, keywords")
      .eq("master_plan_id", masterPlanId)
      .order("created_at", { ascending: true });
    custom = ((data || []) as {
      id: string;
      category: string | null;
      question: string;
      answer: string;
      keywords: string | null;
    }[]).map((r) => ({
      id: `custom:${r.id}`,
      category: r.category || "General",
      question: r.question,
      answer: r.answer,
      keywords: (r.keywords || "").split(",").map((k) => k.trim()).filter(Boolean),
    }));
  }

  const all = [...KNOWLEDGE_BASE, ...custom];
  const categories = [...KB_CATEGORIES];
  for (const e of custom) if (!categories.includes(e.category)) categories.push(e.category);

  return NextResponse.json({ entries: all, categories, customCount: custom.length });
}

// POST — add a client Q&A entry.
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }
  const supabase = createServerClient();
  const masterPlanId = await resolveMasterPlanId();
  if (!masterPlanId) return NextResponse.json({ error: "No workspace." }, { status: 400 });
  const body = await request.json().catch(() => ({}));

  const question = typeof body.question === "string" ? body.question.trim() : "";
  const answer = typeof body.answer === "string" ? body.answer.trim() : "";
  if (!question || !answer) return NextResponse.json({ error: "Question and answer are required." }, { status: 400 });

  const { data, error } = await supabase
    .from("qa_entries")
    .insert({
      master_plan_id: masterPlanId,
      category: typeof body.category === "string" && body.category.trim() ? body.category.trim() : "General",
      question,
      answer,
      keywords: typeof body.keywords === "string" ? body.keywords.trim() : "",
    })
    .select("id, category, question, answer, keywords")
    .single();

  if (error) return NextResponse.json({ error: "Couldn't save." }, { status: 500 });
  return NextResponse.json({
    entry: {
      id: `custom:${data.id}`,
      category: data.category || "General",
      question: data.question,
      answer: data.answer,
      keywords: (data.keywords || "").split(",").map((k: string) => k.trim()).filter(Boolean),
    },
  });
}

// DELETE — remove a client Q&A entry (?id=custom:<uuid> or bare uuid).
export async function DELETE(request: Request) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }
  const supabase = createServerClient();
  const masterPlanId = await resolveMasterPlanId();
  const raw = new URL(request.url).searchParams.get("id") || "";
  const id = raw.replace(/^custom:/, "");
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });

  const { error } = await supabase
    .from("qa_entries")
    .delete()
    .eq("id", id)
    .eq("master_plan_id", masterPlanId);

  if (error) return NextResponse.json({ error: "Couldn't delete." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
