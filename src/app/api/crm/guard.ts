import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { crossOriginBlocked } from "@/lib/security";
import { ALIGNMENT_ARCHITECT_EMAIL, authEnabled, sessionUser } from "@/lib/authz";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { isHousePlan } from "@/lib/housePlan";

// The one gate for the CRM (Contacts, Forms, Broadcasts), Sequences and Calendars.
// Every signed-in Command Suite account gets it, scoped to ITS OWN account:
//   - planId: the signed-in person's account (their own plan, or for an invited
//     team member the owner's plan they work in; resolveMasterPlanId decides).
//     Every query in these routes must filter by it.
//   - userEmail: the signed-in person (test emails go to them).
//   - house: this is Babs's own account (her sender setup, templates and Zoom apply).
// Middleware has already admitted only owners, clients and team members, and
// applied a member's role/feature limits ("crm" in teamRoles).
export type CrmAccount = { planId: string; userEmail: string | null; isArchitect: boolean; house: boolean };

export async function crmAccount(request?: Request): Promise<CrmAccount | { denied: NextResponse }> {
  const writing = Boolean(request && request.method !== "GET" && request.method !== "HEAD");
  if (writing && crossOriginBlocked(request!)) return { denied: NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 }) };
  // The public demo shows sample data only (resolveMasterPlanId pins it to the demo
  // account, which has no owner or mailbox); it can read but never send, book or change.
  let demo = false;
  try {
    demo = cookies().get("lc_demo")?.value === "1";
  } catch {
    /* no request scope */
  }
  const user = authEnabled() ? await sessionUser() : null;
  if (authEnabled() && !user && !demo) return { denied: NextResponse.json({ error: "Please sign in." }, { status: 401 }) };
  if (demo && writing) return { denied: NextResponse.json({ error: "The demo is view-only." }, { status: 403 }) };
  const planId = await resolveMasterPlanId();
  if (!planId) return { denied: NextResponse.json({ error: "No account found." }, { status: 400 }) };
  const email = (user?.email || "").toLowerCase() || null;
  return { planId, userEmail: email, isArchitect: email === ALIGNMENT_ARCHITECT_EMAIL, house: await isHousePlan(planId) };
}

// Where a "send me a test" goes: the signed-in person. In single-user mode (no
// sign-in) it falls back to the account's own address; never to anyone else's.
export function testRecipient(a: CrmAccount, accountEmail: string): string | null {
  return a.userEmail || (a.house ? ALIGNMENT_ARCHITECT_EMAIL : accountEmail) || null;
}
