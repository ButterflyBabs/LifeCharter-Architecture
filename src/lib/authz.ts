import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

// Super-admin gate for privileged actions (e.g. coach overrides).
//
// While AUTH_ENABLED is off, the app is single-user (the owner), who IS the
// super admin — so this returns true. Once auth is on, only signed-in users
// whose email is in SUPER_ADMIN_EMAILS (falling back to ALLOWED_EMAIL) qualify;
// everyone else — including signed-in clients — is denied.

export function authEnabled(): boolean {
  return process.env.AUTH_ENABLED === "true";
}

function superAdminEmails(): string[] {
  return (process.env.SUPER_ADMIN_EMAILS || process.env.ALLOWED_EMAIL || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export async function isSuperAdmin(): Promise<boolean> {
  if (!authEnabled()) return true; // single-user owner context

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return false;

  try {
    const cookieStore = cookies();
    const supabase = createServerClient(url, key, {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set() {},
        remove() {},
      },
    });
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const email = user?.email?.toLowerCase();
    if (!email) return false;
    const admins = superAdminEmails();
    // No list configured → any authenticated user (dev convenience). With a list,
    // only listed emails qualify.
    return admins.length === 0 ? true : admins.includes(email);
  } catch {
    return false;
  }
}
