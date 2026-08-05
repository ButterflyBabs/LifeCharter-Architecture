import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";

// Exchanges the code from a Supabase email link (password recovery, and later
// OAuth/SSO) for a session, setting the auth cookies, then forwards the user on.
// Used by the password-reset flow: the reset email lands here, we establish a
// short-lived recovery session, then send them to /reset-password.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (code && url && key) {
    const cookieStore = cookies();
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set({ name, value, ...(options ?? {}) })
          );
        },
      },
    });
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Bad/expired link — send them to reset with an explanatory flag.
  return NextResponse.redirect(`${origin}/reset-password?error=link`);
}
