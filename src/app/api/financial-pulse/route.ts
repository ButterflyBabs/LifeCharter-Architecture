import { NextResponse } from "next/server";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { resolveUserTimeZone } from "@/lib/userTimezone";
import { computePulse } from "@/lib/finance/pulse";

// Always query live data per request (never prerender/cache the aggregate).
export const dynamic = "force-dynamic";

// Financial Pulse data for the Executive Home and Morning Brief.
//
// Income comes from the finance ledger (finance_entries), scoped to the
// signed-in client's own plan. "This week / month / year" follow the viewer's
// time zone; weeks run Sunday→Saturday like the Finance reports. Goals: the
// monthly goal is the income target set in Finance → Budget; weekly and yearly
// goals are explicit when set (finance_goals), else derived from the monthly
// one (year = 12 × month, week = year ÷ 52). See lib/finance/pulse.ts.
export async function GET(request: Request) {
  const masterPlanId = await resolveMasterPlanId();
  if (!masterPlanId) return NextResponse.json({ hasData: false });
  const tz = await resolveUserTimeZone(new URL(request.url).searchParams.get("tz"));
  const result = await computePulse(masterPlanId, tz);
  if ("error" in result) {
    console.error("GET /api/financial-pulse:", result.error);
    return NextResponse.json({ hasData: false, error: result.error }, { status: 200 });
  }
  return NextResponse.json(result);
}
