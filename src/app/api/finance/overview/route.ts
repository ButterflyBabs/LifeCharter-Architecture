import { NextResponse } from "next/server";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { financeOverview } from "@/lib/finance/overview";

export const dynamic = "force-dynamic";

// GET — what the Finance cards show about each other: month totals, budget left after bills,
// bills due soon, the tax set-aside and software spend. Everything is this account's own.
export async function GET(request: Request) {
  const masterPlanId = await resolveMasterPlanId();
  if (!masterPlanId) return NextResponse.json({ error: "No account found." }, { status: 200 });
  const tz = new URL(request.url).searchParams.get("tz") || "UTC";
  try {
    return NextResponse.json(await financeOverview(masterPlanId, tz));
  } catch (e) {
    console.error("GET /api/finance/overview:", (e as Error).message);
    return NextResponse.json({ error: "Couldn't load the overview." }, { status: 200 });
  }
}
