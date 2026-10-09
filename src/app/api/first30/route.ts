import { NextResponse } from "next/server";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { first30Status } from "@/lib/first30";
import { isHousePlan } from "@/lib/housePlan";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

// The first-30-days path, checked live. `pin` says whether the menu keeps Getting Started at the top.
// The first-30-days path, checked live. `show` is false once every step is done
// or the account is past day 60, so the Executive Home card steps aside.
export async function GET() {
  const masterPlanId = await resolveMasterPlanId();
  if (!masterPlanId) return NextResponse.json({ steps: [], done: 0, total: 0, day: 0, show: false });
  const s = await first30Status(masterPlanId);
  // `pin`: a client account moves Getting Started to the top of the menu until every step is complete (never Babs's own
  // account, and never the demo).
  const demo = cookies().get("lc_demo")?.value === "1";
  const pin = !demo && s.total > 0 && s.done < s.total && !(await isHousePlan(masterPlanId));
  return NextResponse.json({ ...s, show: s.done < s.total && s.day <= 60, pin });
}
