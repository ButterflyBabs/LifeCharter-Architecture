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

export function superAdminEmails(): string[] {
  return (process.env.SUPER_ADMIN_EMAILS || process.env.ALLOWED_EMAIL || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

// The signed-in user (id + email) from the request cookies, or null. Null when
// auth is off, misconfigured, or nobody is signed in.
export async function sessionUser(): Promise<{ id: string; email: string | null } | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
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
    if (!user) return null;
    return { id: user.id, email: user.email ?? null };
  } catch {
    return null;
  }
}

export function isOwnerEmail(email: string | null | undefined): boolean {
  const admins = superAdminEmails();
  if (admins.length === 0) return true; // no list configured → treat as owner (dev convenience)
  return Boolean(email && admins.includes(email.toLowerCase()));
}

export async function isSuperAdmin(): Promise<boolean> {
  if (!authEnabled()) return true; // single-user owner context
  const user = await sessionUser();
  if (!user?.email) return false;
  return isOwnerEmail(user.email);
}
