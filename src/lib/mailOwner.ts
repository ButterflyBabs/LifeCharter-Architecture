import { createHmac, timingSafeEqual } from "crypto";
import { resolveAiAccount } from "@/lib/ai/config";
import { superAdminEmails } from "@/lib/authz";
import { createServerClient } from "@/lib/supabase/server";

// Whose mailbox connections a request may touch. Connections belong to one
// account (profile); nobody else can read, send from, or overwrite them.

export type MailScope = {
  /** A specific connected mailbox (account_key). Omitted → the account's first one. */
  accountKey?: string;
  /** Explicit account — only for server jobs that already know whose it is. */
  ownerId?: string;
  /** The house account (super admin), for cron jobs with no signed-in user. */
  house?: boolean;
};

// The signed-in account's own profile. Fails closed: signed-out visitors, demo
// visitors, Collective-only members and invited team members get null and so
// see no mailboxes at all.
export async function currentMailOwner(): Promise<string | null> {
  try {
    const a = await resolveAiAccount();
    return a.profileId && a.canEdit ? a.profileId : null;
  } catch {
    return null;
  }
}

// The founding account (super admin) — used by cron jobs like follow-ups.
export async function houseMailOwner(): Promise<string | null> {
  const emails = superAdminEmails();
  const q = createServerClient().from("profiles").select("id").order("created_at").limit(1);
  const { data } = emails.length ? await q.in("email", emails).maybeSingle() : await q.maybeSingle();
  return (data?.id as string) ?? null;
}

export async function scopeOwner(scope?: MailScope): Promise<string | null> {
  if (scope?.ownerId) return scope.ownerId;
  if (scope?.house) return houseMailOwner();
  return currentMailOwner();
}

// ── OAuth state: binds a consent flow to the account that started it ────────
// The callback is reached from Google/Microsoft, so it can't trust a request
// on its own. State carries the owner id, signed so it can't be forged.

function secret(): string {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.CRON_SECRET || "";
}

export function signMailState(ownerId: string): string {
  const payload = Buffer.from(JSON.stringify({ o: ownerId, t: Date.now() })).toString("base64url");
  const sig = createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyMailState(state: string | null): string | null {
  if (!state || !secret()) return null;
  const [payload, sig] = state.split(".");
  if (!payload || !sig) return null;
  const expected = createHmac("sha256", secret()).update(payload).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const { o, t } = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (typeof o !== "string" || typeof t !== "number" || Date.now() - t > 15 * 60 * 1000) return null;
    return o;
  } catch {
    return null;
  }
}
