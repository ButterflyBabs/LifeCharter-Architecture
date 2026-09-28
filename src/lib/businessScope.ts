import { cookies } from "next/headers";
import { createServerClient } from "@/lib/supabase/server";

// The header business switcher (Babs, 2026-09-28). The chosen business lives in a cookie on this
// device; it only counts if that business belongs to the signed-in account, so a stale or forged
// value just means "All businesses".
export const BUSINESS_COOKIE = "lc_business";

export type BusinessScope = { businessId: number; segmentIds: number[]; name: string } | null;

export async function currentBusiness(masterPlanId: string | null): Promise<BusinessScope> {
  if (!masterPlanId) return null;
  let raw: string | undefined;
  try {
    raw = cookies().get(BUSINESS_COOKIE)?.value;
  } catch {
    return null;
  }
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) return null;
  const supabase = createServerClient();
  const { data: biz } = await supabase.from("businesses").select("id, name").eq("id", id).eq("master_plan_id", masterPlanId).maybeSingle();
  if (!biz) return null;
  const { data: segs } = await supabase.from("segments").select("id").eq("business_id", id);
  return { businessId: id, segmentIds: ((segs ?? []) as { id: number }[]).map((s) => s.id), name: biz.name as string };
}
