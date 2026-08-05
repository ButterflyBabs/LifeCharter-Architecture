import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createServerClient as createServiceClient } from "@/lib/supabase/server";

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

// Who is making this request, and what may they do?
//   - owner  : the account owner (or single-user mode) — full access
//   - member : an invited team member — scoped to the owner's data, limited by
//              their per-area permissions
//   - none   : signed out, or a signed-in user who is neither owner nor member
//
// This is the seam permission enforcement (Stage 3C) reads. Data scoping still
// flows through resolveMasterPlanId, which mirrors the member lookup below.
export type ActorKind = "owner" | "member" | "none";
export interface Actor {
  kind: ActorKind;
  userId: string | null;
  email: string | null;
  memberId: string | null;
  workspaceId: string | null;
  permissions: Record<string, string>;
}

export async function resolveActor(): Promise<Actor> {
  const none: Actor = {
    kind: "none",
    userId: null,
    email: null,
    memberId: null,
    workspaceId: null,
    permissions: {},
  };

  // Single-user mode: the one user is the owner.
  if (!authEnabled()) {
    return { ...none, kind: "owner" };
  }

  const user = await sessionUser();
  if (!user) return none;

  if (isOwnerEmail(user.email)) {
    return { ...none, kind: "owner", userId: user.id, email: user.email };
  }

  const email = (user.email || "").toLowerCase();
  if (!email) return none;

  try {
    const supabase = createServiceClient();
    const { data: m } = await supabase
      .from("workspace_members")
      .select("id, workspace_id, permissions, status")
      .ilike("email", email)
      .in("status", ["active", "pending"])
      .maybeSingle();
    if (m?.id) {
      // First time we see them signed in: bind the login identity + activate.
      await supabase
        .from("workspace_members")
        .update({ user_id: user.id, status: "active" })
        .eq("id", m.id);
      return {
        kind: "member",
        userId: user.id,
        email: user.email,
        memberId: m.id as string,
        workspaceId: (m.workspace_id as string) ?? null,
        permissions: (m.permissions as Record<string, string>) || {},
      };
    }
  } catch (e) {
    console.error("resolveActor member lookup:", e);
  }

  return none;
}
