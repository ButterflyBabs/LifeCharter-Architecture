import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Auth gate for the whole app. Kept behind AUTH_ENABLED so there is NO lock-out
// window: until you set AUTH_ENABLED=true (after creating your Supabase user),
// this passes every request through unchanged. When enabled, unauthenticated
// visitors are redirected to /login (pages) or get 401 (API), and only
// ALLOWED_EMAIL may sign in.

const PUBLIC_PAGES = ["/login", "/logout", "/forgot-password", "/reset-password", "/accept-invite", "/executive_consultation", "/get-started", "/demo", "/schedule", "/legal"];
const PUBLIC_APIS = [
  "/api/google/callback",
  "/api/microsoft/callback",
  "/auth/callback",
  "/api/invite",
  "/api/cron/masterclass-recording", // secured by its own CRON_SECRET check, not a session
  "/api/cron/masterclass-zoom-sync", // secured by its own CRON_SECRET check, not a session — currently unenforced since CRON_SECRET isn't set yet
  "/api/readai/bootstrap", // one-time setup, secured by its own state check
  "/api/stripe/webhook", // secured by Stripe signature verification, not a session — was missing before, meaning Stripe's own webhook calls were silently getting 401'd whenever AUTH_ENABLED is true
  "/api/stripe/starter-checkout", // public self-serve Starter checkout entry + its /confirm sub-route
  "/api/consultation/qualify", // public — anonymous prospects submit this from /schedule/masterclass and /schedule/website before ever having an account
  "/api/admin/stripe-portal-setup", // one-time setup, secured by its own x-setup-secret check against app_settings — delete this route (and this line) once it's been run
]; // external redirects + invite acceptance + cron/bootstrap land here without our session

// A member with this role is scoped to exactly these pages/APIs and nothing
// else in the app — built for Marcello, who needs to run the sales-reference
// form but shouldn't see client data, the dashboard, or anything else.
const SALES_ROLE = "sales";
const SALES_ONLY_PAGES = ["/sales-reference"];
const SALES_ONLY_APIS = ["/api/sales/onboard-client", "/api/sales/lookup-contact", "/api/sales/search-contacts"];

// Is this signed-in email an invited team member, and if so what role are
// they? Checked via the Supabase REST endpoint with the service key so the
// edge middleware stays dependency-free. Admits active or pending members (a
// member is still "pending" on their very first request, before resolveActor
// flips them to active).
async function getMemberInfo(email: string): Promise<{ isMember: boolean; role: string | null }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const svc = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !svc) return { isMember: false, role: null };
  try {
    const res = await fetch(
      `${url}/rest/v1/workspace_members?select=id,role&status=in.(active,pending)&email=ilike.${encodeURIComponent(email)}`,
      { headers: { apikey: svc, Authorization: `Bearer ${svc}` }, cache: "no-store" }
    );
    if (!res.ok) return { isMember: false, role: null };
    const rows = (await res.json()) as { role?: string }[];
    if (!Array.isArray(rows) || rows.length === 0) return { isMember: false, role: null };
    return { isMember: true, role: rows[0].role ?? null };
  } catch {
    return { isMember: false, role: null };
  }
}

export async function middleware(request: NextRequest) {
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
  const isOwner = authed;
  let memberRole: string | null = null;
  if (user && !authed && email) {
    const info = await getMemberInfo(email);
    authed = info.isMember;
    memberRole = info.role;
  }
  const isSalesOnly = authed && !isOwner && memberRole === SALES_ROLE;

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

  if (path.startsWith("/api/")) {
    if (!authed && !isDemo) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    if (needsMfa) return NextResponse.json({ error: "2fa required" }, { status: 401 });
    if (isSalesOnly && !SALES_ONLY_APIS.some((p) => path === p || path.startsWith(p + "/"))) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    return response;
  }

  if (isPublicPage) {
    // Don't bounce a signed-in user off /login while their 2FA is still pending —
    // that's where they enter the code.
    if (authed && !needsMfa && path === "/login") {
      return NextResponse.redirect(new URL(isSalesOnly ? "/sales-reference" : "/", request.url));
    }
    return response;
  }

  if ((!authed && !isDemo) || needsMfa) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // A sales-only member is confined to their own pages — anything else
  // (dashboard, client data, settings, ...) bounces back to sales-reference
  // rather than 404ing or leaking that the route exists.
  if (isSalesOnly && !SALES_ONLY_PAGES.some((p) => path === p || path.startsWith(p + "/"))) {
    return NextResponse.redirect(new URL("/sales-reference", request.url));
  }

  return response;
}

export const config = {
  // Run on everything except Next internals and static image assets.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
