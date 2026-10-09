import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { createServerClient as createSsrClient } from "@supabase/ssr";
import { authEnabled, sessionUser } from "@/lib/authz";

// Logins & Passwords vault: who may open it. Everything is the signed-in person's own. They must also have unlocked it by
// re-entering their Suite password; that unlock is a signed cookie that lasts 15 minutes (or until they lock it).
export const VAULT_COOKIE = "lc_vault";
export const UNLOCK_MS = 15 * 60_000;

const secret = () => process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const sign = (userId: string, exp: number) => createHmac("sha256", secret()).update(`vault.${userId}.${exp}`).digest("hex");

export function unlockToken(userId: string): { value: string; exp: number } {
  const exp = Date.now() + UNLOCK_MS;
  return { value: `${exp}.${sign(userId, exp)}`, exp };
}

export function isUnlocked(userId: string): boolean {
  try {
    const raw = cookies().get(VAULT_COOKIE)?.value || "";
    const [expS, sig] = raw.split(".");
    const exp = Number(expS);
    if (!exp || !sig || exp < Date.now() || secret() === "") return false;
    const want = Buffer.from(sign(userId, exp));
    const got = Buffer.from(sig);
    return want.length === got.length && timingSafeEqual(want, got);
  } catch {
    return false;
  }
}

// The signed-in person, never the public demo.
export async function vaultUser(): Promise<{ id: string; email: string } | null> {
  if (!authEnabled()) return null;
  try {
    if (cookies().get("lc_demo")?.value === "1") return null;
  } catch {
    /* no request scope */
  }
  const u = await sessionUser();
  return u && u.email ? { id: u.id, email: u.email } : null;
}

// Checks the Suite password without touching the person's real session.
export async function passwordIsRight(email: string, password: string): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || !password) return false;
  const c = createSsrClient(url, key, { cookies: { get: () => undefined, set() {}, remove() {} } });
  const { data, error } = await c.auth.signInWithPassword({ email, password });
  if (data?.session) await c.auth.signOut().catch(() => {});
  return !error && Boolean(data?.user);
}

const attempts = new Map<string, number[]>();
export function tooManyTries(userId: string): boolean {
  const now = Date.now();
  const list = (attempts.get(userId) ?? []).filter((t) => now - t < 15 * 60_000);
  list.push(now);
  attempts.set(userId, list);
  return list.length > 6;
}

export const CATEGORIES = ["Website", "Email", "Banking", "Social media", "Software", "Other"] as const;
export const clean = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");
