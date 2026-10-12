import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { SOP_TEMPLATES, seedSopTemplates } from "@/lib/sopTemplates";

export const dynamic = "force-dynamic";

// The SOP template library, for the signed-in account.
//   GET              -> every template, and whether this account already has its copy
//   POST { keys }    -> copy these templates (or "all") into this account as drafts
export async function GET() {
  const planId = await resolveMasterPlanId();
  if (!planId) return NextResponse.json({ templates: [] });
  const { data: have } = await createServerClient().from("sops").select("template_key").eq("master_plan_id", planId).not("template_key", "is", null);
  const got = new Set(((have ?? []) as { template_key: string }[]).map((r) => r.template_key));
  const templates = SOP_TEMPLATES.map((t) => ({
    key: t.key,
    title: t.title,
    pillarKey: t.pillarKey,
    purpose: t.purpose,
    stepCount: t.steps.filter((x) => !/^##\s*/.test(x)).length,
    owner: t.owner,
    added: got.has(t.key),
  }));
  return NextResponse.json({ templates });
}

export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const planId = await resolveMasterPlanId();
  if (!planId) return NextResponse.json({ error: "No account found." }, { status: 400 });
  const body = await request.json().catch(() => ({}));
  const keys = Array.isArray(body.keys) ? body.keys.map(String).slice(0, 100) : undefined;
  if (!keys && body.keys !== "all") return NextResponse.json({ error: "Choose templates." }, { status: 400 });
  const added = await seedSopTemplates(createServerClient(), planId, keys);
  return NextResponse.json({ added });
}
