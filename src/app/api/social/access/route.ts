import { NextResponse } from "next/server";
import { socialPlannerEnabled } from "@/lib/social/server";

export const dynamic = "force-dynamic";

// GET — is the Social Planner turned on for this account?
export async function GET() {
  return NextResponse.json({ enabled: await socialPlannerEnabled() });
}
