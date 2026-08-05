import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Auth gate for the whole app. Kept behind AUTH_ENABLED so there is NO lock-out
// window: until you set AUTH_ENABLED=true (after creating your Supabase user),
// this passes every request through unchanged. When enabled, unauthenticated
// visitors are redirected to /login (pages) or get 401 (API), and only
// ALLOWED_EMAIL may sign in.

const PUBLIC_PAGES = ["/login", "/logout", "/forgot-password", "/reset-password", "/accept-invite"];
const PUBLIC_APIS = ["/api/google/callback", "/api/microsoft/callback", "/auth/callback", "/api/invite"]; // external redirects + invite acceptance land here without our session

// Is this signed-in email an invited team member? Checked via the Supabase REST
// endpoint with the service key so the edge middleware stays dependency-free.
// Admits active or pending members (a member is still "pending" on their very
// first request, before resolveActor flips them to active).
async function isKnownMember(email: string): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const svc = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !svc) return false;
  try {
    const res = await fetch(
      `${url}/rest/v1/workspace_members?select=id&status=in.(active,pending)&email=ilike.${encodeURIComponent(email)}`,
      { headers: { apikey: svc, Authorization: `Bearer ${svc}` }, cache: "no-store" }
    );
    if (!res.ok) return false;
    const rows = (await res.json()) as unknown[];
    return Array.isArray(rows) && rows.length > 0;
  } catch {
    return false;
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

  // The owner (ALLOWED_EMAIL / SUPER_ADMIN) always passes. Invited team members
  // aren't in that list, so admit any signed-in user who is a known member —
  // otherwise the single-email gate would bounce every member at the door.
  const allowed = process.env.ALLOWED_EMAIL?.toLowerCase();
  const email = user?.email?.toLowerCase() || null;
  let authed = Boolean(user) && (!allowed || email === allowed);
  if (user && !authed && email) {
    authed = await isKnownMember(email);
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

  if (isPublicApi) return response;

  if (path.startsWith("/api/")) {
    if (!authed) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    if (needsMfa) return NextResponse.json({ error: "2fa required" }, { status: 401 });
    return response;
  }

  if (isPublicPage) {
    // Don't bounce a signed-in user off /login while their 2FA is still pending —
    // that's where they enter the code.
    if (authed && !needsMfa && path === "/login") return NextResponse.redirect(new URL("/", request.url));
    return response;
  }

  if (!authed || needsMfa) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return response;
}

export const config = {
  // Run on everything except Next internals and static image assets.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
