import { NextResponse } from "next/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { canManageAccount, isAlignmentArchitect, sessionUser } from "@/lib/authz";
import { BANK_FEEDS_OPEN_TO_ALL } from "@/lib/bankFeedsFlag";

export type BankAccount = { planId: string; email: string | null };

/** Signed in, the account owner (or a team admin), and Babs only until BANK_FEEDS_OPEN_TO_ALL is switched on. */
export async function bankFeedsAccount(request?: Request): Promise<BankAccount | { denied: NextResponse }> {
  if (request && request.method !== "GET" && crossOriginBlocked(request)) return { denied: NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 }) };
  if (!BANK_FEEDS_OPEN_TO_ALL && !(await isAlignmentArchitect())) return { denied: NextResponse.json({ error: "not found" }, { status: 404 }) };
  if (!(await canManageAccount())) return { denied: NextResponse.json({ error: "Only the account owner can manage bank feeds." }, { status: 403 }) };
  const planId = await resolveMasterPlanId();
  if (!planId) return { denied: NextResponse.json({ error: "No account found." }, { status: 400 }) };
  const user = await sessionUser().catch(() => null);
  return { planId, email: user?.email ?? null };
}
