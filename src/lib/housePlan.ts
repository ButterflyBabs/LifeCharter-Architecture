import { createServerClient } from "@/lib/supabase/server";
import { ALIGNMENT_ARCHITECT_EMAIL } from "@/lib/authz";

type Db = ReturnType<typeof createServerClient>;

// The Alignment Architect's own account (Babs). Her CRM, sequences and booking
// emails keep their existing sender setup; every other account is a client.
export async function ownerMasterPlanId(db: Db = createServerClient()): Promise<string | null> {
  const { data: prof } = await db.from("profiles").select("id").ilike("email", ALIGNMENT_ARCHITECT_EMAIL).maybeSingle();
  if (!prof?.id) return null;
  const { data: plan } = await db.from("client_master_plans").select("id").eq("user_id", prof.id).order("created_at").limit(1).maybeSingle();
  return (plan?.id as string) ?? null;
}

// Short-lived cache so crons that loop over many rows don't look it up each time.
let cached: { id: string | null; at: number } | null = null;
export async function housePlanId(db: Db = createServerClient()): Promise<string | null> {
  if (cached && Date.now() - cached.at < 60_000) return cached.id;
  const id = await ownerMasterPlanId(db).catch(() => null);
  if (id) cached = { id, at: Date.now() }; // a failed lookup isn't remembered
  return id;
}

export async function isHousePlan(planId: string | null | undefined, db: Db = createServerClient()): Promise<boolean> {
  if (!planId) return false;
  const house = await housePlanId(db);
  return Boolean(house && house === planId);
}
