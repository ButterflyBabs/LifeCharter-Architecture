import { createServerClient } from "@/lib/supabase/server";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { currentBusiness } from "@/lib/businessScope";

// The signed-in account for Offers & Pipeline routes. Every query must filter by masterPlanId
// (the service-role client bypasses RLS).
export async function salesAccount() {
  const masterPlanId = await resolveMasterPlanId();
  if (!masterPlanId) return null;
  // The business chosen in the header switcher (null = all businesses).
  const scope = await currentBusiness(masterPlanId);
  return { supabase: createServerClient(), masterPlanId, businessId: scope?.businessId ?? null };
}

export async function planBusinesses(masterPlanId: string) {
  const { data } = await createServerClient().from("businesses").select("id, name").eq("master_plan_id", masterPlanId).order("id");
  return ((data ?? []) as { id: number; name: string }[]).map((b) => ({ id: b.id, name: b.name }));
}

// A business id sent by the browser, kept only if it belongs to this account.
export async function ownBusinessId(masterPlanId: string, id: unknown): Promise<number | null> {
  const n = Number(id);
  if (!Number.isInteger(n) || n <= 0) return null;
  const { data } = await createServerClient().from("businesses").select("id").eq("id", n).eq("master_plan_id", masterPlanId).maybeSingle();
  return data ? n : null;
}
