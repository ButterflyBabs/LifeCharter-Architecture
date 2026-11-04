import { cookies } from "next/headers";
import { createServerClient } from "@/lib/supabase/server";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { isHousePlan } from "@/lib/housePlan";
import { startHereApplies } from "@/lib/startHere";

// Whether the signed-in account gets the one-page Getting Started (new accounts and Babs's own; see startHere.ts).
export async function startHereForCurrentAccount(): Promise<boolean> {
  try {
    const planId = await resolveMasterPlanId();
    if (!planId) return false;
    const db = createServerClient();
    const [{ data: mp }, house] = await Promise.all([db.from("client_master_plans").select("created_at").eq("id", planId).maybeSingle(), isHousePlan(planId, db)]);
    const demo = cookies().get("lc_demo")?.value === "1";
    return startHereApplies({ planId, createdAt: (mp?.created_at as string) ?? null, house, demo });
  } catch {
    return false;
  }
}
