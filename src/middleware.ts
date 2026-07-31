import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Auth gate for the whole app. Kept behind AUTH_ENABLED so there is NO lock-out
// window: until you set AUTH_ENABLED=true (after creating your Supabase user),
// this passes every request through unchanged. When enabled, unauthenticated
// visitors are redirected to /login (pages) or get 401 (API), and only
// ALLOWED_EMAIL may sign in.

const PUBLIC_PAGES = ["/login", "/logout"];
const PUBLIC_APIS = ["/api/google/callback"]; // Google redirects here without our session

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

  const allowed = process.env.ALLOWED_EMAIL?.toLowerCase();
  const authed = Boolean(user) && (!allowed || user!.email?.toLowerCase() === allowed);

  const path = request.nextUrl.pathname;
  const isPublicApi = PUBLIC_APIS.some((p) => path.startsWith(p));
  const isPublicPage = PUBLIC_PAGES.some((p) => path === p || path.startsWith(p + "/"));

  if (isPublicApi) return response;

  if (path.startsWith("/api/")) {
    return authed ? response : NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (isPublicPage) {
    if (authed && path === "/login") return NextResponse.redirect(new URL("/", request.url));
    return response;
  }

  if (!authed) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return response;
}

export const config = {
  // Run on everything except Next internals and static image assets.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
