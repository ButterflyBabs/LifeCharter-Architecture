import { NextResponse } from "next/server";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { first30Status } from "@/lib/first30";

export const dynamic = "force-dynamic";

// The first-30-days path, checked live. `show` is false once every step is done
// or the account is past day 60, so the Executive Home card steps aside.
export async function GET() {
  const masterPlanId = await resolveMasterPlanId();
  if (!masterPlanId) return NextResponse.json({ steps: [], done: 0, total: 0, day: 0, show: false });
  const s = await first30Status(masterPlanId);
  return NextResponse.json({ ...s, show: s.done < s.total && s.day <= 60 });
}
