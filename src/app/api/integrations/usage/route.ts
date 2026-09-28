import { NextResponse } from "next/server";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { integrationUsage } from "@/lib/capabilities";

export const dynamic = "force-dynamic";

// How many integration spots this account has used, and its plan's limit (null = no limit).
export async function GET() {
  const masterPlanId = await resolveMasterPlanId();
  return NextResponse.json(await integrationUsage(masterPlanId));
}
