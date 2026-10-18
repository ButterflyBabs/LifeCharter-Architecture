import { NextResponse } from "next/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { isAlignmentArchitect, resolveActor, sessionUser } from "@/lib/authz";

/** Babs only until she has tested Connect with Stripe and payment links (2026-10-18); true opens it to every account. */
export const PAYMENTS_OPEN_TO_ALL = false;

export type PaymentsAccount = { planId: string; email: string | null };

/**
 * The gate for "get paid inside the Suite": signed in, the account owner (or a team admin), and Babs only until
 * PAYMENTS_OPEN_TO_ALL is switched on. Pass the request for writes (cross-origin check).
 */
export async function paymentsAccount(request?: Request): Promise<PaymentsAccount | { denied: NextResponse }> {
  if (request && request.method !== "GET" && crossOriginBlocked(request)) return { denied: NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 }) };
  if (!PAYMENTS_OPEN_TO_ALL && !(await isAlignmentArchitect())) return { denied: NextResponse.json({ error: "not found" }, { status: 404 }) };
  const actor = await resolveActor();
  if (actor.kind === "none" || (actor.kind === "member" && actor.role !== "admin")) return { denied: NextResponse.json({ error: "Only the account owner can manage payments." }, { status: 403 }) };
  const planId = await resolveMasterPlanId();
  if (!planId) return { denied: NextResponse.json({ error: "No account found." }, { status: 400 }) };
  const user = await sessionUser().catch(() => null);
  return { planId, email: user?.email ?? null };
}
