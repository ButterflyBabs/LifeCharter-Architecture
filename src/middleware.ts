import { assessmentGateLocked, gateApiWriteAllowed, gatePageAllowed, GATE_MESSAGE } from "@/lib/assessmentGate";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { IB_COOKIE, accessTokenValid } from "@/lib/investorAccess";
import { NextResponse, type NextRequest } from "next/server";
import { switcherAllowed } from "@/lib/accountSwitcher";
import { COLLECTIVE_FORWARD_STATUS, COLLECTIVE_HOST, COLLECTIVE_HOST_LIVE, SUITE_HOST, collectiveHostAllows, isCollectiveHost, isLegacyCollectivePath, isSuiteProductionHost } from "@/lib/collective";
import { SALES_APIS, SALES_PAGES, memberApiAccess, memberPageRedirect, featureApiAccess, featurePageRedirect, cleanFeatureMap, type FeatureMap } from "@/lib/teamRoles";

// Auth gate for the whole app. Kept behind AUTH_ENABLED so there is NO lock-out
// window: until you set AUTH_ENABLED=true (after creating your Supabase user),
// this passes every request through unchanged. When enabled, unauthenticated
// visitors are redirected to /login (pages) or get 401 (API), and only
// ALLOWED_EMAIL may sign in.

const PUBLIC_PAGES = ["/.well-known", "/unsubscribe", "/f", "/book", "/r", "/a", "/l", "/collective", "/robots.txt", "/sitemap.xml", "/auth/confirm", "/join", "/community/sign-in", "/login", "/logout", "/forgot-password", "/reset-password", "/accept-invite", "/executive_consultation", "/certificationportal", "/get-started", "/reviews/collect", "/demo", "/schedule", "/legal", "/partner", "/p", "/masterclass-signup", "/m", "/investor-brief", "/checkout/thanks"];
const PUBLIC_APIS = [
  "/api/meta-leads", // Meta lead ads, secured by the secret in its address (?k=), not a session
  "/api/masterclass-signup", // the public MasterClass signup page registers people on Zoom
  "/api/investor-access/login", // the investor page's access-code check (rate limited, signed cookie)
  "/api/reviews/collect",
  "/auth/callback",
  "/api/invite",
  "/api/cron/masterclass-recording", // secured by its own CRON_SECRET check, not a session
  "/api/cron/masterclass-zoom-sync", // secured by its own CRON_SECRET check, not a session — currently unenforced since CRON_SECRET isn't set yet
  "/api/readai/bootstrap", // one-time setup, secured by its own state check
  "/api/stripe/webhook", // secured by Stripe signature verification, not a session — was missing before, meaning Stripe's own webhook calls were silently getting 401'd whenever AUTH_ENABLED is true
  "/api/stripe/pre-founder-card", // Pre-Founder card link: starts $497/month billing on April 1, 2027
  "/api/stripe/starter-checkout", // public self-serve Starter checkout entry + its /confirm sub-route
  "/api/cron/journal-reminders", // secured by its own CRON_SECRET check, not a session
  "/api/cron/journal-review", // secured by its own CRON_SECRET check, not a session
  "/api/cron/moderate", // secured by its own CRON_SECRET check, not a session
  "/api/cron/weekly-offer-thread", // secured by its own CRON_SECRET check, not a session
  "/api/cron/welcome-sequence", // secured by its own CRON_SECRET check, not a session
  "/api/cron/task-reminders", // secured by its own CRON_SECRET check, not a session
  "/api/cron/masterclass-attendance", // secured by its own CRON_SECRET check, not a session
  "/api/cron/demo-reset", // secured by its own CRON_SECRET check, not a session
  "/api/cron/session-checklists", // secured by its own CRON_SECRET check, not a session
  "/api/cron/community-notify", // secured by its own CRON_SECRET check, not a session
  "/api/cron/alert-digest", // secured by its own CRON_SECRET check, not a session
  "/api/cron/stripe-sync", // secured by its own CRON_SECRET check, not a session
  "/api/cron/sequences", // secured by its own CRON_SECRET check, not a session
  "/api/cron/bookings", // secured by its own CRON_SECRET check, not a session
  "/api/cron/accountability", // secured by its own CRON_SECRET check, not a session
  "/api/cron/collective-replays", // secured by its own CRON_SECRET check, not a session
  "/api/project-share", // a client or contractor's private project link; the unguessable token is the key, writes are origin-checked and limited to their own tasks
  "/api/partner", // an outside accountability partner's private link; the unguessable token is the key, writes are origin-checked
  "/api/cron/broadcasts", // secured by its own CRON_SECRET check, not a session
  "/api/cron/spark", // secured by its own CRON_SECRET check, not a session (refreshes LC Spark Instagram tokens)
  "/api/cron/client-walkthrough", // the 3-minute New Client Setup Walkthrough; secured by its own CRON_SECRET check, not a session
  "/api/cron/apply-pricing", // secured by its own CRON_SECRET check, not a session
  "/api/cron/platform-costs", // secured by its own CRON_SECRET check, not a session
  "/api/cron/followups", // secured by its own CRON_SECRET check, not a session
  "/api/cron/owner-daily-tasks", // secured by its own CRON_SECRET check, not a session
  "/api/cron/calendar-connections", // secured by its own CRON_SECRET check, not a session
  "/api/cron/reminders", // secured by its own CRON_SECRET check, not a session
  "/api/cron/linkedin-requests", // secured by its own CRON_SECRET check, not a session
  "/api/cron/client-check-in", // secured by its own CRON_SECRET check, not a session
  "/api/cron/client-care", // secured by its own CRON_SECRET check, not a session
  "/api/cron/owner-weekly-bills", // secured by its own CRON_SECRET check, not a session
  "/api/cron/new-client-review", // secured by its own CRON_SECRET check, not a session
  "/api/cron/affiliate-link-expiry", // secured by its own CRON_SECRET check, not a session
  "/api/cron/pre-founder-trials", // secured by its own CRON_SECRET check, not a session
  "/api/cron/call-attendance", // secured by its own CRON_SECRET check (the owner's signed-in dry run is checked in the route)
  "/api/unsubscribe", // signed token only; mail apps one-click POST here
  "/api/forms", // public Suite forms (CRM); origin-checked, form id is the key
  "/api/planner-giveaway", // free planner giveaway on amilynnecarroll.com; origin-checked
  "/api/payhip/webhook", // Payhip orders; signature = sha256(PAYHIP_API_KEY)
  "/api/spark/public", // LC Spark website chat widget; origin-checked against the account's own sites, public key picks the account, rate-limited + honeypot
  "/api/spark/instagram", // LC Spark Meta webhook (verify token + X-Hub-Signature-256) and OAuth callback (signed state + owner session); /connect checks the owner itself
  "/api/google/callback", // OAuth return; verifies its own signed state (mailbox flow also requires the signed-in owner)
  "/api/microsoft/callback", // same
  "/api/book", // public booking pages (slots, book, manage by private token)
  "/api/assessment-results", // Executive Business Assessment (landing page) → Suite CRM + results email
  "/api/auth/forgot", // public — password-reset request; always answers the same way
  "/api/collective/request-invite", // public — landing-page invitation requests; rate-limited + honeypot
  "/api/community/join", // public — new Collective members sign up here; guarded by the space's invite code
  "/api/consultation/qualify", // public — anonymous prospects submit this from /schedule/masterclass and /schedule/website before ever having an account
]; // external redirects + invite acceptance + cron/bootstrap land here without our session

// Invited team members are limited by role (src/lib/teamRoles.ts). The Sales role is
// scoped to the sales page and its own APIs — built for Marcello, who runs the
// sales-reference form but shouldn't see client data, the dashboard, or anything else.
const SALES_ROLE = "sales";

// The owner's own sales page and the APIs behind it read the owner's own Suite CRM
// contacts. Only the owner (super admin) and the owner's own team may
// reach them — never a client or anyone on a client's team. (Babs, 2026-09-27: clients
// must never have access to her contacts.)
const HOUSE_ONLY_PAGES = ["/sales-reference", "/short-demo-deck.html"]; // the presenter deck (slides + what to say) is for the owner and house team
const HOUSE_ONLY_APIS = ["/api/sales"];

// "View as client" (Alignment Architect, read-only). While it is on, only these calls may write
// (opening/closing a view and signing out), and these client-private areas stay closed entirely.
const VIEW_AS_WRITE_OK = ["/api/admin/view-as", "/api/auth"];
const VIEW_AS_CLOSED = [
  "/api/inbox",
  "/api/mail",
  "/api/google",
  "/api/microsoft",
  "/api/schedule",
  "/api/calendar",
  "/api/integrations",
  "/api/vault",
  "/api/billing",
  "/api/export",
];

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
async function getMemberInfo(email: string): Promise<{ isMember: boolean; role: string | null; workspaceId: string | null; features: FeatureMap | null }> {
  const none = { isMember: false, role: null, workspaceId: null, features: null };
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const svc = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !svc) return none;
  try {
    const res = await fetch(
      `${url}/rest/v1/workspace_members?select=id,role,workspace_id,permissions&status=in.(active,pending)&email=ilike.${encodeURIComponent(email)}`,
      { headers: { apikey: svc, Authorization: `Bearer ${svc}` }, cache: "no-store" }
    );
    if (!res.ok) return none;
    const rows = (await res.json()) as { role?: string; workspace_id?: string; permissions?: { features?: unknown } | null }[];
    if (!Array.isArray(rows) || rows.length === 0) return none;
    return { isMember: true, role: rows[0].role ?? null, workspaceId: rows[0].workspace_id ?? null, features: cleanFeatureMap(rows[0].permissions?.features) };
  } catch {
    return none;
  }
}

// Is this workspace the owner's own (the super admin's)? The Sales role opens the owner's
// internal sales page and her contacts, so it is honored only there — never in
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

// The Suite's own hosts — anything else arriving here is either a client's
// verified short-link domain (go.theirbusiness.com) or not ours to serve.
const SHORT_LINK_APP_HOSTS = new Set([
  "lccommandsuite.com",
  "www.lccommandsuite.com",
  "amilynnecarroll.com",
  "www.amilynnecarroll.com",
  "lifecharter.life",
  "www.lifecharter.life",
  COLLECTIVE_HOST, // the Collective's own address: same app, never a client's short-link domain
]);
function isSuiteHost(host: string): boolean {
  const h = host.split(":")[0].toLowerCase();
  return SHORT_LINK_APP_HOSTS.has(h) || h.endsWith(".vercel.app") || h === "localhost" || h === "127.0.0.1";
}

// Is this host a client's own verified short-link domain? REST, not the full
// Supabase client — middleware runs on the Edge runtime.
async function isVerifiedShortLinkDomain(host: string): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const svc = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !svc) return false;
  try {
    const res = await fetch(
      `${url}/rest/v1/client_master_plans?select=id&short_link_domain=eq.${encodeURIComponent(host)}&short_link_domain_status=eq.verified`,
      { headers: { apikey: svc, Authorization: `Bearer ${svc}` }, cache: "no-store" }
    );
    if (!res.ok) return false;
    const rows = (await res.json()) as unknown[];
    return Array.isArray(rows) && rows.length > 0;
  } catch {
    return false;
  }
}

// The one account that may use Demo mode (same address as ALIGNMENT_ARCHITECT_EMAIL in src/lib/authz.ts).
const DEMO_OWNER_EMAIL = "amilynne@amilynnecarroll.com";

export async function middleware(request: NextRequest) {
  // A client's own domain, e.g. go.theirbusiness.com/promo — rewritten to this
  // app's /l/promo (the regular short-link redirect) so visitors never see
  // lccommandsuite.com. Checked before anything else: this visitor isn't
  // signed in to the Suite and must never be bounced toward /login.
  {
    const host = request.headers.get("host") || "";
    if (host && !isSuiteHost(host) && (await isVerifiedShortLinkDomain(host))) {
      const path = request.nextUrl.pathname;
      const target = request.nextUrl.clone();
      target.pathname = `/l${path === "/" ? "" : path}`;
      return NextResponse.rewrite(target);
    }
  }

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

  // THE COLLECTIVE'S OWN ADDRESS (collective.lccommandsuite.com, decided 2026-10-13). One app, two front doors:
  //  - on the Collective host only the Collective's own pages and APIs exist; every Command Suite path is sent to
  //    lccommandsuite.com (pages) or answered 404 (APIs), so the two products never blur;
  //  - once COLLECTIVE_HOST_LIVE is on, the old Collective addresses on lccommandsuite.com (/community, /join,
  //    /collective) forward to the same path on the new host, so every link already emailed keeps working.
  // The old host's /api/*, /auth/confirm and /reset-password are deliberately NOT forwarded (Suite sign-in and
  // password-reset links use them, and an already-open page may still call its own /api).
  const reqHost = request.headers.get("host") || "";
  const onCollectiveHost = isCollectiveHost(reqHost);
  {
    const p = request.nextUrl.pathname;
    if (onCollectiveHost && p !== "/" && !collectiveHostAllows(p)) {
      if (p.startsWith("/api/")) return NextResponse.json({ error: "not found" }, { status: 404 });
      return NextResponse.redirect(`https://${SUITE_HOST}${p}${request.nextUrl.search}`, 307);
    }
    if (COLLECTIVE_HOST_LIVE && isSuiteProductionHost(reqHost) && isLegacyCollectivePath(p)) {
      return NextResponse.redirect(`https://${COLLECTIVE_HOST}${p}${request.nextUrl.search}`, COLLECTIVE_FORWARD_STATUS);
    }
  }

  // The investor page (and its documents) sit behind an access code. Only /investor-brief is affected: the gate
  // page itself is open, everything else under it needs the signed cookie from /api/investor-access/login.
  {
    const p = request.nextUrl.pathname;
    if ((p === "/investor-brief" || p.startsWith("/investor-brief/")) && !p.startsWith("/investor-brief/access")) {
      const ok = await accessTokenValid(request.cookies.get(IB_COOKIE)?.value);
      if (!ok) {
        if (/\.[a-z0-9]{2,5}$/i.test(p)) return new NextResponse("Access code required.", { status: 401, headers: { "Cache-Control": "no-store" } });
        const gate = new URL("/investor-brief/access", request.url);
        const res = NextResponse.redirect(gate, 307);
        res.headers.set("Cache-Control", "no-store");
        return res;
      }
    }
  }

  let response = NextResponse.next({ request: { headers: request.headers } });

  // API responses are live per-user data — never let the edge/browser cache them.
  const isApi = request.nextUrl.pathname.startsWith("/api/");
  if (isApi) response.headers.set("Cache-Control", "no-store, max-age=0");

  // Gate off → passthrough (safe default). On the Collective host "/" is still the public landing.
  if (process.env.AUTH_ENABLED !== "true") {
    if (onCollectiveHost && request.nextUrl.pathname === "/") {
      const landing = request.nextUrl.clone();
      landing.pathname = "/collective";
      return NextResponse.rewrite(landing);
    }
    return response;
  }

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

  // The Collective host's front door: "/" is the public landing for visitors and the app for anyone signed in.
  if (onCollectiveHost && request.nextUrl.pathname === "/") {
    if (user) return NextResponse.redirect(new URL("/community", request.url));
    const landing = request.nextUrl.clone();
    landing.pathname = "/collective";
    const rewritten = NextResponse.rewrite(landing);
    for (const c of response.cookies.getAll()) rewritten.cookies.set(c);
    return rewritten;
  }

  // DEMO IS FOR THE ALIGNMENT ARCHITECT ONLY (Babs, 2026-10-10: "it should not even appear on ANY client account
  // ever"). The lc_demo cookie is stripped from the request, and expired in the browser, for everyone who is not
  // signed in as her, so a forged or stale cookie can never switch the demo on for a client or a visitor.
  if (request.cookies.get("lc_demo")?.value && !(user && (user.email || "").toLowerCase() === DEMO_OWNER_EMAIL)) {
    const carried = response.cookies.getAll();
    request.cookies.delete("lc_demo");
    response = NextResponse.next({ request: { headers: request.headers } });
    for (const c of carried) response.cookies.set(c);
    response.cookies.set({ name: "lc_demo", value: "", path: "/", maxAge: 0 });
    if (request.nextUrl.pathname.startsWith("/api/")) response.headers.set("Cache-Control", "no-store, max-age=0");
  }

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
  let memberFeatures: FeatureMap | null = null;
  // A paying client owns their own account: full access, no role limits. Someone who ALSO belongs to a
  // team account (lc_acct=team, set by the account switcher) is treated as that team's member instead,
  // with the role limits below; if the membership is gone they fall back to their own account.
  const ownsAccount = Boolean(user) && !authed && (await isClientAccount(user!.id));
  const wantsTeam = request.cookies.get("lc_acct")?.value === "team" && switcherAllowed(email);
  if (user && !authed && ownsAccount && !wantsTeam) authed = true;
  if (user && !authed && email) {
    const info = await getMemberInfo(email);
    authed = info.isMember;
    isTeamMember = info.isMember;
    memberRole = info.role;
    memberFeatures = info.features;
    isHouseMember = info.isMember && (await isHouseWorkspace(info.workspaceId));
    // Sales outside the owner's own workspace falls back to view-only.
    if (memberRole === SALES_ROLE && !isHouseMember) memberRole = "viewer";
  }
  if (user && !authed && ownsAccount) authed = true; // asked for the team account but not a member: their own
  const isSalesOnly = authed && isTeamMember && memberRole === SALES_ROLE;
  let isCommunityOnly = false;
  if (user && !authed && (await isCommunityMember(user.id))) {
    authed = true;
    isCommunityOnly = true;
  }

  // ASSESSMENT LOCK (2026-10-11): a client who has not finished Brain, Soul and Profit can open only Set up Suite, the
  // three assessments, Settings and Contact Support. Computed lazily, only when a request would otherwise get through.
  const lockCandidate = Boolean(user) && !isSuperOwner && ownsAccount && !wantsTeam && !isTeamMember && !isCommunityOnly;
  let lockMemo: boolean | null = null;
  const isLocked = async () => {
    if (!lockCandidate || !user) return false;
    if (lockMemo === null) lockMemo = await assessmentGateLocked(user.id, user.email ?? null);
    return lockMemo;
  };

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

  // /demo sets this cookie (for the Alignment Architect only) and redirects into the normal app shell so she can
  // present the pre-seeded "Demo — Brand Alchemy Studio" plan. The cookie is stripped above for anyone else.
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
    ["/api/inbox", "/api/schedule", "/api/calendar", "/api/google", "/api/microsoft", "/api/mail"].some((p) => path === p || path.startsWith(p + "/"))
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
    // "View as client": while the signed lc_view_as cookie is present (only the Alignment Architect can
    // get one; masterPlan.ts verifies it), the account is read-only and the client's private connections
    // stay closed. A forged cookie only turns this read-only mode on for whoever sent it.
    if (isSuperOwner && request.cookies.get("lc_view_as")?.value) {
      const writeOk = VIEW_AS_WRITE_OK.some((p) => path === p || path.startsWith(p + "/"));
      if (!["GET", "HEAD", "OPTIONS"].includes(request.method) && !writeOk) {
        return NextResponse.json({ error: "Read-only: you are viewing a client's account, so nothing can be changed." }, { status: 403 });
      }
      if (VIEW_AS_CLOSED.some((p) => path === p || path.startsWith(p + "/"))) {
        if (request.method === "GET" && path === "/api/inbox") {
          return NextResponse.json({ connected: false, providers: { google: false, microsoft: false }, accounts: [], emails: [] });
        }
        if (request.method === "GET" && path === "/api/schedule") return NextResponse.json({ connected: false, events: [] });
        return NextResponse.json({ error: "Not available while viewing a client's account." }, { status: 403 });
      }
    }
    if (lockCandidate && !["GET", "HEAD", "OPTIONS"].includes(request.method) && !gateApiWriteAllowed(path) && (await isLocked())) {
      return NextResponse.json({ error: GATE_MESSAGE, locked: true }, { status: 403 });
    }
    if (housePath(HOUSE_ONLY_APIS) && !mayUseHouseSales) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    if (needsMfa) return NextResponse.json({ error: "2fa required" }, { status: 401 });
    if (isSalesOnly && !SALES_APIS.some((p) => path === p || path.startsWith(p + "/"))) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    if (isTeamMember) {
      const roleVerdict = memberApiAccess(memberRole, path, request.method, memberFeatures);
      const verdict = roleVerdict.allow ? featureApiAccess(memberFeatures, path, request.method) : roleVerdict;
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
    // The Collective has its own sign-in; /login is open on its host only so a pending 2FA code can be entered.
    if (onCollectiveHost && path === "/login" && !needsMfa) {
      return NextResponse.redirect(new URL(authed ? "/community" : "/community/sign-in", request.url));
    }
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

  if (lockCandidate && !gatePageAllowed(path) && (await isLocked())) {
    return NextResponse.redirect(new URL("/setup", request.url));
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
    const dest = memberPageRedirect(memberRole, path) ?? featurePageRedirect(memberFeatures, path);
    if (dest) return NextResponse.redirect(new URL(dest, request.url));
  }

  return response;
}

export const config = {
  // Run on everything except Next internals and static image assets.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|community-sw\\.js|spark\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest|ics)$).*)"],
};
