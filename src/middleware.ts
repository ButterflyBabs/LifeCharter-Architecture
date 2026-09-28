import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SALES_APIS, SALES_PAGES, memberApiAccess, memberPageRedirect } from "@/lib/teamRoles";

// Auth gate for the whole app. Kept behind AUTH_ENABLED so there is NO lock-out
// window: until you set AUTH_ENABLED=true (after creating your Supabase user),
// this passes every request through unchanged. When enabled, unauthenticated
// visitors are redirected to /login (pages) or get 401 (API), and only
// ALLOWED_EMAIL may sign in.

const PUBLIC_PAGES = ["/.well-known", "/unsubscribe", "/f", "/collective", "/robots.txt", "/sitemap.xml", "/auth/confirm", "/join", "/community/sign-in", "/login", "/logout", "/forgot-password", "/reset-password", "/accept-invite", "/executive_consultation", "/certificationportal", "/get-started", "/reviews/collect", "/demo", "/schedule", "/legal"];
const PUBLIC_APIS = [
  "/api/reviews/collect",
  "/auth/callback",
  "/api/invite",
  "/api/cron/masterclass-recording", // secured by its own CRON_SECRET check, not a session
  "/api/cron/masterclass-zoom-sync", // secured by its own CRON_SECRET check, not a session — currently unenforced since CRON_SECRET isn't set yet
  "/api/readai/bootstrap", // one-time setup, secured by its own state check
  "/api/stripe/webhook", // secured by Stripe signature verification, not a session — was missing before, meaning Stripe's own webhook calls were silently getting 401'd whenever AUTH_ENABLED is true
  "/api/stripe/starter-checkout", // public self-serve Starter checkout entry + its /confirm sub-route
  "/api/cron/journal-reminders", // secured by its own CRON_SECRET check, not a session
  "/api/cron/journal-review", // secured by its own CRON_SECRET check, not a session
  "/api/cron/moderate", // secured by its own CRON_SECRET check, not a session
  "/api/cron/weekly-offer-thread", // secured by its own CRON_SECRET check, not a session
  "/api/cron/welcome-sequence", // secured by its own CRON_SECRET check, not a session
  "/api/cron/task-reminders", // secured by its own CRON_SECRET check, not a session
  "/api/cron/masterclass-attendance", // secured by its own CRON_SECRET check, not a session
  "/api/cron/demo-reset", // secured by its own CRON_SECRET check, not a session
  "/api/cron/community-notify", // secured by its own CRON_SECRET check, not a session
  "/api/cron/alert-digest", // secured by its own CRON_SECRET check, not a session
  "/api/cron/stripe-sync", // secured by its own CRON_SECRET check, not a session
  "/api/cron/sequences", // secured by its own CRON_SECRET check, not a session
  "/api/unsubscribe", // signed token only; mail apps one-click POST here
  "/api/forms", // public Suite forms (CRM); origin-checked, form id is the key
  "/api/auth/forgot", // public — password-reset request; always answers the same way
  "/api/collective/request-invite", // public — landing-page invitation requests; rate-limited + honeypot
  "/api/community/join", // public — new Collective members sign up here; guarded by the space's invite code
  "/api/consultation/qualify", // public — anonymous prospects submit this from /schedule/masterclass and /schedule/website before ever having an account
]; // external redirects + invite acceptance + cron/bootstrap land here without our session

// Invited team members are limited by role (src/lib/teamRoles.ts). The Sales role is
// scoped to the sales page and its own APIs — built for Marcello, who runs the
// sales-reference form but shouldn't see client data, the dashboard, or anything else.
const SALES_ROLE = "sales";

// The owner's own sales page and the APIs behind it read the owner's Global Control
// contacts with the house key. Only the owner (super admin) and the owner's own team may
// reach them — never a client or anyone on a client's team. (Babs, 2026-09-27: clients
// must never have access to her Global Control contacts.)
const HOUSE_ONLY_PAGES = ["/sales-reference"];
const HOUSE_ONLY_APIS = ["/api/sales"];

// A LifeCharter Collective member (community-only login) may reach the
// community and nothing else in the app.
const COMMUNITY_PAGES = ["/community", "/join", "/logout", "/reset-password", "/legal"];
const COMMUNITY_APIS = ["/api/community"];

// A paying Command Suite client: someone with their own client plan or workspace
// (created by checkout or the New Client Onboarding form). They get full access to
// their own account; data is scoped to it by resolveMasterPlanId and RLS.
async function isClientAccount(userId: string): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const svc = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !svc) return false;
  const headers = { apikey: svc, Authorization: `Bearer ${svc}` };
  const id = encodeURIComponent(userId);
  try {
    const [plans, spaces] = await Promise.all([
      fetch(`${url}/rest/v1/client_master_plans?select=id&limit=1&user_id=eq.${id}`, { headers, cache: "no-store" }),
      fetch(`${url}/rest/v1/workspaces?select=id&limit=1&owner_id=eq.${id}`, { headers, cache: "no-store" }),
    ]);
    for (const res of [plans, spaces]) {
      if (!res.ok) continue;
      const rows = (await res.json()) as unknown[];
      if (Array.isArray(rows) && rows.length > 0) return true;
    }
    return false;
  } catch {
    return false;
  }
}

async function isCommunityMember(userId: string): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const svc = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !svc) return false;
  try {
    const res = await fetch(
      `${url}/rest/v1/cm_profiles?select=user_id&status=eq.active&user_id=eq.${encodeURIComponent(userId)}`,
      { headers: { apikey: svc, Authorization: `Bearer ${svc}` }, cache: "no-store" }
    );
    if (!res.ok) return false;
    const rows = (await res.json()) as unknown[];
    return Array.isArray(rows) && rows.length > 0;
  } catch {
    return false;
  }
}

// Is this signed-in email an invited team member, and if so what role are
// they? Checked via the Supabase REST endpoint with the service key so the
// edge middleware stays dependency-free. Admits active or pending members (a
// member is still "pending" on their very first request, before resolveActor
// flips them to active).
async function getMemberInfo(email: string): Promise<{ isMember: boolean; role: string | null; workspaceId: string | null }> {
  const none = { isMember: false, role: null, workspaceId: null };
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const svc = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !svc) return none;
  try {
    const res = await fetch(
      `${url}/rest/v1/workspace_members?select=id,role,workspace_id&status=in.(active,pending)&email=ilike.${encodeURIComponent(email)}`,
      { headers: { apikey: svc, Authorization: `Bearer ${svc}` }, cache: "no-store" }
    );
    if (!res.ok) return none;
    const rows = (await res.json()) as { role?: string; workspace_id?: string }[];
    if (!Array.isArray(rows) || rows.length === 0) return none;
    return { isMember: true, role: rows[0].role ?? null, workspaceId: rows[0].workspace_id ?? null };
  } catch {
    return none;
  }
}

// Is this workspace the owner's own (the super admin's)? The Sales role opens the owner's
// internal sales page and Global Control contacts, so it is honored only there — never in
// a client's workspace.
async function isHouseWorkspace(workspaceId: string | null): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const svc = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const admins = (process.env.SUPER_ADMIN_EMAILS || process.env.ALLOWED_EMAIL || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  if (!url || !svc || !workspaceId || admins.length === 0) return false;
  const headers = { apikey: svc, Authorization: `Bearer ${svc}` };
  try {
    const ws = await fetch(`${url}/rest/v1/workspaces?select=master_plan_id&id=eq.${encodeURIComponent(workspaceId)}`, { headers, cache: "no-store" });
    const planId = ws.ok ? ((await ws.json()) as { master_plan_id?: string }[])[0]?.master_plan_id : null;
    if (!planId) return false;
    const plan = await fetch(`${url}/rest/v1/client_master_plans?select=client_email&id=eq.${encodeURIComponent(planId)}`, { headers, cache: "no-store" });
    const owner = plan.ok ? ((await plan.json()) as { client_email?: string }[])[0]?.client_email : null;
    return Boolean(owner && admins.includes(owner.toLowerCase()));
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  // Trailing slashes (next.config sets skipTrailingSlashRedirect): the Certification Portal lives at
  // /certificationportal/ and needs its slash for relative links; every other address drops it.
  {
    const p = request.nextUrl.pathname;
    // Plain URL objects: NextURL would re-apply Next's own trailing-slash rule to the target.
    if (p === "/certificationportal") {
      return NextResponse.redirect(new URL("/certificationportal/" + request.nextUrl.search, request.url), 308);
    }
    if (p.startsWith("/certificationportal/")) return NextResponse.next();
    if (p.length > 1 && p.endsWith("/")) {
      return NextResponse.redirect(new URL(p.replace(/\/+$/, "") + request.nextUrl.search, request.url), 308);
    }
  }

  let response = NextResponse.next({ request: { headers: request.headers } });

  // API responses are live per-user data — never let the edge/browser cache them.
  const isApi = request.nextUrl.pathname.startsWith("/api/");
  if (isApi) response.headers.set("Cache-Control", "no-store, max-age=0");

  // Gate off → passthrough (safe default).
  if (process.env.AUTH_ENABLED !== "true") return response;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return response; // misconfigured → don't lock the owner out

  const supabase = createServerClient(url, key, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({ name, value, ...options });
        response = NextResponse.next({ request: { headers: request.headers } });
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({ name, value: "", ...options });
        response = NextResponse.next({ request: { headers: request.headers } });
        response.cookies.set({ name, value: "", ...options });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // The owner (ALLOWED_EMAIL / SUPER_ADMIN) always passes, with full access.
  // Invited team members aren't in that list, so admit any signed-in user who
  // is a known member — otherwise the single-email gate would bounce every
  // member at the door. A member's role narrows what they can reach below;
  // the owner is never narrowed, regardless of any workspace_members row.
  const allowed = process.env.ALLOWED_EMAIL?.toLowerCase();
  const email = user?.email?.toLowerCase() || null;
  let authed = Boolean(user) && (!allowed || email === allowed);
  const isSuperOwner = authed;
  let memberRole: string | null = null;
  let isTeamMember = false;
  let isHouseMember = false;
  // A paying client owns their own account: full access, no role limits.
  if (user && !authed && (await isClientAccount(user.id))) authed = true;
  if (user && !authed && email) {
    const info = await getMemberInfo(email);
    authed = info.isMember;
    isTeamMember = info.isMember;
    memberRole = info.role;
    isHouseMember = info.isMember && (await isHouseWorkspace(info.workspaceId));
    // Sales outside the owner's own workspace falls back to view-only.
    if (memberRole === SALES_ROLE && !isHouseMember) memberRole = "viewer";
  }
  const isSalesOnly = authed && isTeamMember && memberRole === SALES_ROLE;
  let isCommunityOnly = false;
  if (user && !authed && (await isCommunityMember(user.id))) {
    authed = true;
    isCommunityOnly = true;
  }

  // 2FA enforcement: a user who has 2FA enrolled but has only completed the
  // password step is at assurance level aal1 with a pending aal2 — they must
  // finish the code step before reaching anything protected.
  let needsMfa = false;
  if (authed) {
    try {
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      needsMfa = aal?.nextLevel === "aal2" && aal.currentLevel === "aal1";
    } catch {
      /* if the check fails, don't lock the user out */
    }
  }

  const path = request.nextUrl.pathname;
  const isPublicApi = PUBLIC_APIS.some((p) => path.startsWith(p));
  const isPublicPage = PUBLIC_PAGES.some((p) => path === p || path.startsWith(p + "/"));

  // /demo sets this cookie and redirects into the normal app shell (/, /daily-compass,
  // etc.) so a marketing visitor can see the pre-seeded "Demo — Brand Alchemy Studio"
  // plan without an account — src/lib/scoring/masterPlan.ts already trusts this same
  // cookie to redirect every data read to that one fixed plan, so letting it pass the
  // auth gate here isn't a new trust boundary, just honoring the one already coded in.
  const isDemo = request.cookies.get("lc_demo")?.value === "1";

  if (isPublicApi) return response;

  // Mailbox + calendar + OAuth-connect APIs are never available to the /demo
  // cookie. They act on the connected Google / Microsoft account, and a demo
  // visitor is not signed in — without this, anyone opening /demo could read
  // the owner's inbox and calendar, or re-point the connection at their own
  // account. Answers with the "not connected" shape so the demo dashboard just
  // shows its connect prompts.
  if (
    !authed &&
    isDemo &&
    ["/api/inbox", "/api/schedule", "/api/calendar", "/api/google", "/api/microsoft", "/api/mail"].some((p) => path.startsWith(p))
  ) {
    if (path === "/api/inbox" && request.method === "GET") {
      return NextResponse.json({ connected: false, providers: { google: false, microsoft: false }, accounts: [], emails: [] });
    }
    if (path === "/api/schedule" && request.method === "GET") {
      return NextResponse.json({ connected: false, events: [] });
    }
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const mayUseHouseSales = isSuperOwner || isHouseMember;
  const housePath = (list: string[]) => list.some((p) => path === p || path.startsWith(p + "/"));

  if (path.startsWith("/api/")) {
    if (!authed && !isDemo) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    if (housePath(HOUSE_ONLY_APIS) && !mayUseHouseSales) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    if (needsMfa) return NextResponse.json({ error: "2fa required" }, { status: 401 });
    if (isSalesOnly && !SALES_APIS.some((p) => path === p || path.startsWith(p + "/"))) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    if (isTeamMember) {
      const verdict = memberApiAccess(memberRole, path, request.method);
      if (!verdict.allow) {
        // Pages that show the owner's inbox/calendar read "not connected" instead of erroring.
        if (request.method === "GET" && path === "/api/inbox") {
          return NextResponse.json({ connected: false, providers: { google: false, microsoft: false }, accounts: [], emails: [] });
        }
        if (request.method === "GET" && path === "/api/schedule") return NextResponse.json({ connected: false, events: [] });
        return NextResponse.json({ error: verdict.reason }, { status: verdict.status });
      }
    }
    if (isCommunityOnly && !COMMUNITY_APIS.some((p) => path === p || path.startsWith(p + "/"))) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    return response;
  }

  if (isPublicPage) {
    // Don't bounce a signed-in user off /login while their 2FA is still pending —
    // that's where they enter the code.
    if (authed && !needsMfa && (path === "/login" || path === "/community/sign-in")) {
      const home = isSalesOnly ? "/sales-reference" : isCommunityOnly || path === "/community/sign-in" ? "/community" : "/";
      return NextResponse.redirect(new URL(home, request.url));
    }
    return response;
  }

  if ((!authed && !isDemo) || needsMfa) {
    // Community visitors get the Collective's own sign-in, not the Command Suite login.
    const isCommunityPath = path === "/community" || path.startsWith("/community/");
    return NextResponse.redirect(new URL(isCommunityPath && !needsMfa ? "/community/sign-in" : "/login", request.url));
  }

  if (isCommunityOnly && !COMMUNITY_PAGES.some((p) => path === p || path.startsWith(p + "/"))) {
    // Tell the Collective why they landed there (it shows a "switch accounts"
    // notice) — except right after a password reset, where it would confuse.
    const dest = new URL("/community", request.url);
    if (request.nextUrl.searchParams.get("after") !== "reset") dest.searchParams.set("from", "suite");
    return NextResponse.redirect(dest);
  }

  // A sales-only member is confined to their own pages — anything else
  // (dashboard, client data, settings, ...) bounces back to sales-reference
  // rather than 404ing or leaking that the route exists.
  if (housePath(HOUSE_ONLY_PAGES) && !mayUseHouseSales) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  if (isSalesOnly && !SALES_PAGES.some((p) => path === p || path.startsWith(p + "/"))) {
    return NextResponse.redirect(new URL("/sales-reference", request.url));
  }
  if (isTeamMember) {
    const dest = memberPageRedirect(memberRole, path);
    if (dest) return NextResponse.redirect(new URL(dest, request.url));
  }

  return response;
}

export const config = {
  // Run on everything except Next internals and static image assets.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|community-sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest)$).*)"],
};
