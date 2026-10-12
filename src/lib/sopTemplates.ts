import type { SupabaseClient } from "@supabase/supabase-js";
import templatesJson from "@/content/sopTemplates.json";

// The SOP template library: 50 editable starting points (src/content/sopTemplates.json). Each client account gets
// every template as an editable DRAFT, once; a draft does not count toward the Operations score until the client
// approves it. A template is copied once per account (sops.template_key), so running this again is safe.
export interface SopTemplate {
  key: string;
  title: string;
  pillarKey: string;
  purpose: string;
  owner: string;
  tools: string;
  steps: string[];
}
export const SOP_TEMPLATES = templatesJson as SopTemplate[];

export async function seedSopTemplates(db: SupabaseClient, planId: string, only?: string[]): Promise<number> {
  const { data: have } = await db.from("sops").select("template_key").eq("master_plan_id", planId).not("template_key", "is", null);
  const got = new Set(((have ?? []) as { template_key: string }[]).map((r) => r.template_key));
  const rows = SOP_TEMPLATES.filter((t) => !got.has(t.key) && (!only || only.includes(t.key))).map((t) => ({
    master_plan_id: planId,
    template_key: t.key,
    title: t.title,
    pillar_key: t.pillarKey,
    purpose: t.purpose,
    steps: t.steps,
    owner: t.owner,
    tools: t.tools,
    status: "draft",
  }));
  if (!rows.length) return 0;
  const { error } = await db.from("sops").insert(rows);
  if (error) {
    console.error("seedSopTemplates:", error.message);
    return 0;
  }
  return rows.length;
}

// First time a client opens Playbook & SOPs (existing accounts included): copy the library in once. Only for the
// owner of a client account: never the owner's own account, the demo, or someone viewing a client read-only.
export async function ensureSopTemplatesSeeded(db: SupabaseClient, planId: string, userId: string | null, housePlanId: string | null): Promise<void> {
  if (!userId || planId === housePlanId) return;
  const { data: plan } = await db.from("client_master_plans").select("user_id, client_name, metadata").eq("id", planId).maybeSingle();
  if (!plan || plan.user_id !== userId || plan.client_name === "Primary") return;
  const meta = (plan.metadata as Record<string, unknown> | null) ?? {};
  if (meta.sopTemplatesSeeded) return;
  // Mark first, so two quick page loads cannot both copy them (the unique index would stop a duplicate anyway).
  await db.from("client_master_plans").update({ metadata: { ...meta, sopTemplatesSeeded: new Date().toISOString() } }).eq("id", planId);
  await seedSopTemplates(db, planId);
}
