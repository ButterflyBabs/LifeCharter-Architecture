import { NextResponse } from "next/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { sessionUser } from "@/lib/authz";
import { isAlignmentArchitect } from "@/lib/authz";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const clip = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");

// POST { rating: "up" | "down", note?, question?, answer? } → saved against the signed-in account.
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const planId = await resolveMasterPlanId();
  if (!planId) return NextResponse.json({ error: "No account found." }, { status: 400 });
  const b = await request.json().catch(() => ({}));
  if (b.rating !== "up" && b.rating !== "down") return NextResponse.json({ error: "Bad request." }, { status: 400 });
  const user = await sessionUser().catch(() => null);
  const { error } = await createServerClient().from("assistant_feedback").insert({
    master_plan_id: planId,
    user_id: user?.id ?? null,
    rating: b.rating,
    note: clip(b.note, 1000) || null,
    question: clip(b.question, 1500) || null,
    answer: clip(b.answer, 4000) || null,
  });
  if (error) return NextResponse.json({ error: "Couldn't save that." }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// GET → owner only: the latest feedback from every account, for the Support Desk.
export async function GET() {
  if (!(await isAlignmentArchitect())) return NextResponse.json({ error: "not found" }, { status: 404 });
  const db = createServerClient();
  const { data } = await db.from("assistant_feedback").select("id, master_plan_id, rating, note, question, answer, created_at").order("created_at", { ascending: false }).limit(200);
  const rows = (data ?? []) as { id: string; master_plan_id: string; rating: string; note: string | null; question: string | null; answer: string | null; created_at: string }[];
  const ids = Array.from(new Set(rows.map((r) => r.master_plan_id)));
  const { data: plans } = ids.length ? await db.from("client_master_plans").select("id, client_name, client_email").in("id", ids) : { data: [] };
  const who = new Map(((plans ?? []) as { id: string; client_name: string | null; client_email: string | null }[]).map((p) => [p.id, p.client_name || p.client_email || "Account"]));
  return NextResponse.json({ feedback: rows.map((r) => ({ ...r, account: who.get(r.master_plan_id) ?? "Account" })) });
}
