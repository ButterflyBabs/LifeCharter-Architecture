import { NextResponse } from "next/server";
import { crossOriginBlocked } from "@/lib/security";
import { isAlignmentArchitect } from "@/lib/authz";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";

// Who may manage LC Spark, and for which account. Everything downstream is keyed
// by the returned planId (master_plan_id), so LC Spark is already per-account.
// For now only the Alignment Architect has it; opening it to client accounts
// later is a change to THIS function only (e.g. allow any account owner).
export async function sparkAccount(request?: Request): Promise<{ planId: string } | { denied: NextResponse }> {
  if (request && request.method !== "GET" && crossOriginBlocked(request)) return { denied: NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 }) };
  if (!(await isAlignmentArchitect())) return { denied: NextResponse.json({ error: "Not found." }, { status: 404 }) };
  const planId = await resolveMasterPlanId();
  if (!planId) return { denied: NextResponse.json({ error: "No account found." }, { status: 400 }) };
  return { planId };
}

// Server pages use the same rule.
export const canUseSpark = () => isAlignmentArchitect();
