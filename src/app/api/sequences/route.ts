import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { isAlignmentArchitect } from "@/lib/authz";
import { ownerMasterPlanId } from "@/lib/sequences/engine";

export const dynamic = "force-dynamic";

// Alignment Architect only: her email sequences (Phase 1 lives on her account).
//   GET → every sequence with step and people counts
//   POST { key, name, fromEmail? } → a new (paused) sequence

async function planOrDeny(request?: Request) {
  if (request && crossOriginBlocked(request)) return { denied: NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 }) };
  if (!(await isAlignmentArchitect())) return { denied: NextResponse.json({ error: "Not found." }, { status: 404 }) };
  const planId = await ownerMasterPlanId();
  if (!planId) return { denied: NextResponse.json({ error: "No account found." }, { status: 400 }) };
  return { planId };
}

export async function GET() {
  const { denied, planId } = await planOrDeny();
  if (denied) return denied;
  const db = createServerClient();
  const { data: seqs } = await db.from("sequences").select("*").eq("master_plan_id", planId).order("created_at");
  const ids = (seqs ?? []).map((s) => s.id as string);
  const [{ data: steps }, { data: enrs }] = await Promise.all([
    ids.length ? db.from("sequence_steps").select("sequence_id").in("sequence_id", ids) : Promise.resolve({ data: [] as { sequence_id: string }[] }),
    ids.length ? db.from("sequence_enrollments").select("sequence_id, status").in("sequence_id", ids) : Promise.resolve({ data: [] as { sequence_id: string; status: string }[] }),
  ]);
  const out = (seqs ?? []).map((s) => {
    const mine = (enrs ?? []).filter((e) => e.sequence_id === s.id);
    return {
      ...s,
      step_count: (steps ?? []).filter((x) => x.sequence_id === s.id).length,
      people: { total: mine.length, active: mine.filter((e) => e.status === "active").length, completed: mine.filter((e) => e.status === "completed").length },
    };
  });
  return NextResponse.json({ sequences: out });
}

export async function POST(request: Request) {
  const { denied, planId } = await planOrDeny(request);
  if (denied) return denied;
  const b = await request.json().catch(() => ({}));
  const name = String(b.name || "").trim().slice(0, 120);
  const key = String(b.key || name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
  if (!name || !key) return NextResponse.json({ error: "Give the sequence a name." }, { status: 400 });
  const fromEmail = /^[^@\s]+@(lifecharter\.life|lccommandsuite\.com)$/i.test(String(b.fromEmail || "")) ? String(b.fromEmail) : "hello@lifecharter.life";
  const { data, error } = await createServerClient()
    .from("sequences")
    .insert({ master_plan_id: planId, key, name, from_email: fromEmail, brand: name })
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.code === "23505" ? "A sequence with that name already exists." : "Couldn't create it." }, { status: 400 });
  return NextResponse.json({ sequence: data });
}
