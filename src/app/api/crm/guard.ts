import { NextResponse } from "next/server";
import { crossOriginBlocked } from "@/lib/security";
import { isAlignmentArchitect } from "@/lib/authz";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";

// The CRM is scoped to the signed-in account. For now only the Alignment
// Architect has it switched on; opening it to clients later is a one-line change.
export async function crmAccount(request?: Request): Promise<{ planId: string } | { denied: NextResponse }> {
  if (request && request.method !== "GET" && crossOriginBlocked(request)) return { denied: NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 }) };
  if (!(await isAlignmentArchitect())) return { denied: NextResponse.json({ error: "Not found." }, { status: 404 }) };
  const planId = await resolveMasterPlanId();
  if (!planId) return { denied: NextResponse.json({ error: "No account found." }, { status: 400 }) };
  return { planId };
}
