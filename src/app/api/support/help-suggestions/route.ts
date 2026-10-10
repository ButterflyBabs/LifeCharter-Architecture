import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { isAlignmentArchitect } from "@/lib/authz";
import { planningAssistant, runJson } from "@/lib/ai/planningAi";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const clip = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");

// Owner only (Support Desk > Help ideas).
//   GET                                    -> suggestions, pending first
//   POST { action: "generate" }            -> draft up to 8 new ones from resolved tickets (uses Babs's own AI key)
//   POST { action: "approve" | "dismiss", id, question?, answer? } -> decide (approve may carry her edits)
// Approved suggestions are picked up by every client's assistant as extra help answers.
export async function GET() {
  if (!(await isAlignmentArchitect())) return NextResponse.json({ error: "not found" }, { status: 404 });
  const { data } = await createServerClient().from("help_suggestions").select("id, question, answer, category, status, created_at").order("created_at", { ascending: false }).limit(100);
  const rows = (data ?? []) as { status: string }[];
  rows.sort((a, b) => (a.status === "pending" ? 0 : 1) - (b.status === "pending" ? 0 : 1));
  return NextResponse.json({ suggestions: rows });
}

export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  if (!(await isAlignmentArchitect())) return NextResponse.json({ error: "not found" }, { status: 404 });
  const b = await request.json().catch(() => ({}));
  const db = createServerClient();

  if (b.action === "approve" || b.action === "dismiss") {
    const id = clip(b.id, 60);
    if (!id) return NextResponse.json({ error: "Missing suggestion." }, { status: 400 });
    const patch: Record<string, unknown> = { status: b.action === "approve" ? "approved" : "dismissed", decided_at: new Date().toISOString() };
    if (b.action === "approve") {
      if (clip(b.question, 300)) patch.question = clip(b.question, 300);
      if (clip(b.answer, 2000)) patch.answer = clip(b.answer, 2000);
    }
    await db.from("help_suggestions").update(patch).eq("id", id);
    return NextResponse.json({ ok: true });
  }

  if (b.action === "generate") {
    const a = await planningAssistant();
    if (!a?.key) return NextResponse.json({ needsKey: true });
    const { data: done } = await db.from("help_suggestions").select("request_id").not("request_id", "is", null);
    const have = new Set(((done ?? []) as { request_id: string }[]).map((r) => r.request_id));
    const { data: reqs } = await db.from("support_requests").select("id, subject, message, category").eq("status", "resolved").order("resolved_at", { ascending: false }).limit(40);
    const fresh = ((reqs ?? []) as { id: string; subject: string; message: string; category: string | null }[]).filter((r) => !have.has(r.id)).slice(0, 8);
    let made = 0;
    for (const r of fresh) {
      const { data: reps } = await db.from("support_replies").select("author, body").eq("request_id", r.id).order("created_at");
      const support = ((reps ?? []) as { author: string; body: string }[]).filter((x) => x.author === "support").map((x) => x.body).join("\n\n").slice(0, 2500);
      if (!support) continue;
      const out = await runJson(
        a,
        "You turn one resolved support ticket for LifeCharter Command Suite into a reusable Help library answer. Remove every name, email address, business name and any private detail. Write the question the way a client would ask it in general, and a short, plain, accurate answer (under 120 words) using ONLY what the support reply says. If the reply is specific to one person's situation and not reusable, return {\"skip\":true}. Return STRICT JSON: {\"question\":\"...\",\"answer\":\"...\",\"category\":\"...\"} or {\"skip\":true}.",
        `TICKET SUBJECT: ${r.subject}\nCLIENT MESSAGE: ${r.message.slice(0, 1500)}\nSUPPORT REPLY: ${support}`,
        500
      );
      if (!out || out.skip === true || !clip(out.question, 300) || !clip(out.answer, 2000)) {
        await db.from("help_suggestions").insert({ request_id: r.id, question: "(skipped)", answer: "(not reusable)", status: "dismissed", decided_at: new Date().toISOString() });
        continue;
      }
      await db.from("help_suggestions").insert({ request_id: r.id, question: clip(out.question, 300), answer: clip(out.answer, 2000), category: clip(out.category, 60) || r.category });
      made++;
    }
    return NextResponse.json({ ok: true, drafted: made, looked: fresh.length });
  }
  return NextResponse.json({ error: "Bad request." }, { status: 400 });
}
