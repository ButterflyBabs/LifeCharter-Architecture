import { createServerClient } from "@/lib/supabase/server";
import { houseMailOwner } from "@/lib/mailOwner";

// Businesses belong to a client's master plan; their segments (and each
// segment's dimension scores and revenue) follow the business.

export async function planBusinessIds(masterPlanId: string): Promise<number[]> {
  const { data } = await createServerClient().from("businesses").select("id").eq("master_plan_id", masterPlanId);
  return (data ?? []).map((b) => b.id as number);
}

export async function planSegmentIds(masterPlanId: string): Promise<number[]> {
  const businessIds = await planBusinessIds(masterPlanId);
  if (businessIds.length === 0) return [];
  const { data } = await createServerClient().from("segments").select("id").in("business_id", businessIds);
  return (data ?? []).map((s) => s.id as number);
}

// The founding account's master plan — for server jobs with no signed-in user.
export async function housePlanId(): Promise<string | null> {
  const owner = await houseMailOwner();
  if (!owner) return null;
  const { data } = await createServerClient()
    .from("client_master_plans")
    .select("id")
    .eq("user_id", owner)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return (data?.id as string) ?? null;
}
