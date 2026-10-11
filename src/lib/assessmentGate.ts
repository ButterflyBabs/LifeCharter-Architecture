// The first-run lock (Babs, 2026-10-11): until a client has finished ALL THREE assessments (Brain, Soul and Profit)
// they can open only Set up Suite, the three assessments, Settings and Contact Support. Nothing else, so they cannot
// change their Command Suite before their results exist. Edge-safe (plain fetch), used by the middleware and /api/me.
//
// Not locked: the owner, invited team members, community-only accounts, accounts with profiles.preferences.setupBypass
// (Marcello and Sumbal), and anyone listed below.

export const GATE_EXEMPT_EMAILS = ["amilynne@amilynnecarroll.com", "marcello@amilynnecarroll.com", "sumbalteepu786@gmail.com"];

const PAGE_ALLOW = ["/setup", "/assessments", "/settings", "/help/contact", "/logout"];
// The assessments hub and the three assessments only (not Quick Pulse or Command Shift).
const ASSESSMENT_SUBPAGES = ["/assessments/brain", "/assessments/soul", "/assessments/profit"];

export function gatePageAllowed(path: string): boolean {
  if (path === "/assessments" || path === "/assessments/") return true;
  if (ASSESSMENT_SUBPAGES.some((p) => path === p || path.startsWith(p + "/"))) return true;
  if (path.startsWith("/assessments")) return false;
  return PAGE_ALLOW.some((p) => path === p || path.startsWith(p + "/"));
}

// Reads are left open (the pages and menu draw from them); a locked account can only WRITE to these.
const API_WRITE_ALLOW = [
  "/api/assessments", "/api/unified-memory", "/api/scoring", "/api/setup", "/api/assessment-results",
  "/api/ai-settings", "/api/integrations", "/api/google", "/api/microsoft",
  "/api/profile", "/api/me", "/api/account", "/api/account-access", "/api/auth", "/api/vault",
  "/api/billing", "/api/stripe", "/api/support", "/api/feedback", "/api/notifications", "/api/nav-order",
  "/api/uploads", "/api/version", "/api/travel-partner", "/api/workspaces", "/api/export",
];

export function gateApiWriteAllowed(path: string): boolean {
  return API_WRITE_ALLOW.some((p) => path === p || path.startsWith(p + "/"));
}

export const GATE_MESSAGE = "Finish your three assessments (Brain, Soul and Profit) first. The rest of your Command Suite opens as soon as they are done.";

// True when this signed-in client account is still locked. Fails OPEN (false) if the lookup cannot be made, so a
// database hiccup never locks a finished client out.
export async function assessmentGateLocked(userId: string, email: string | null): Promise<boolean> {
  if (email && GATE_EXEMPT_EMAILS.includes(email.toLowerCase())) return false;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const svc = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !svc) return false;
  const headers = { apikey: svc, Authorization: `Bearer ${svc}` };
  const id = encodeURIComponent(userId);
  try {
    const [pRes, planRes] = await Promise.all([
      fetch(`${url}/rest/v1/profiles?select=preferences&id=eq.${id}&limit=1`, { headers, cache: "no-store" }),
      fetch(`${url}/rest/v1/client_master_plans?select=id,domain_scores&user_id=eq.${id}&order=created_at.asc&limit=1`, { headers, cache: "no-store" }),
    ]);
    if (!pRes.ok || !planRes.ok) return false;
    const prof = ((await pRes.json()) as { preferences?: Record<string, unknown> | null }[])[0];
    const prefs = prof?.preferences || {};
    if (prefs.setupBypass === true || prefs.setupBypass === "true") return false;
    const plan = ((await planRes.json()) as { id: string; domain_scores?: Record<string, unknown> | null }[])[0];
    if (!plan?.id) return false; // no account of their own
    const cRes = await fetch(`${url}/rest/v1/assessment_completions?select=assessment_type&master_plan_id=eq.${encodeURIComponent(plan.id)}`, { headers, cache: "no-store" });
    if (!cRes.ok) return false;
    const have = new Set(((await cRes.json()) as { assessment_type: string }[]).map((r) => r.assessment_type));
    const profit = have.has("profit") || Boolean(plan.domain_scores && typeof plan.domain_scores === "object" && Object.keys(plan.domain_scores).length);
    return !(have.has("brain") && have.has("soul") && profit);
  } catch {
    return false;
  }
}
