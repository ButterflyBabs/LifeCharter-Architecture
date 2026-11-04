import { NextResponse } from "next/server";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { first30Status } from "@/lib/first30";
import { isHousePlan } from "@/lib/housePlan";
import { cookies } from "next/headers";
import { startHereApplies } from "@/lib/startHere";
import { GET as setupStatus } from "@/app/api/setup/status/route";

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
  const house = await isHousePlan(masterPlanId);
  const startHere = startHereApplies({ planId: masterPlanId, createdAt: s.startedAt, house, demo });
  let pin = !demo && s.total > 0 && s.done < s.total && !house;
  if (startHere) {
    // The one-page Getting Started stays at the top only until SET UP is complete (AI key, the three finished
    // assessments, one connected tool), not for 30 days. Everyone else keeps the old rule above.
    const su = await setupStatus().then((r) => r.json()).catch(() => null);
    pin = !demo && !house && !(su?.requiredComplete || su?.bypass);
  }
  return NextResponse.json({ ...s, show: s.done < s.total && s.day <= 60, pin, startHere });
}
