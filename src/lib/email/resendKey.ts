import { createServerClient } from "@/lib/supabase/server";

// Each client account sends email to its own contacts through ITS OWN Resend account. The key is kept
// encrypted in Vault and only ever read on the server. Babs's own account keeps using the Suite's key.
type Db = ReturnType<typeof createServerClient>;

export async function getAccountResendKey(planId: string, db: Db = createServerClient()): Promise<string | null> {
  const { data, error } = await db.rpc("get_account_resend_key", { p_plan: planId });
  if (error) {
    console.error("get_account_resend_key:", error.message);
    return null;
  }
  return ((data as string | null) || "").trim() || null;
}

export async function setAccountResendKey(planId: string, key: string, db: Db = createServerClient()): Promise<boolean> {
  const { error } = await db.rpc("set_account_resend_key", { p_plan: planId, p_key: key });
  if (error) console.error("set_account_resend_key:", error.message);
  return !error;
}

export type KeyCheck = { ok: true } | { ok: false; error: string };

// Checks a pasted key before it is saved: it must be a real Resend key, and "Full access" (a key that can
// only send cannot add a sending domain).
export async function checkResendKey(key: string): Promise<KeyCheck> {
  const k = key.trim();
  if (!/^re_[A-Za-z0-9_\-]{10,}$/.test(k)) return { ok: false, error: "That doesn't look like a Resend key. It starts with re_ ." };
  try {
    const res = await fetch("https://api.resend.com/domains", { headers: { Authorization: `Bearer ${k}` } });
    if (res.ok) return { ok: true };
    const out = (await res.json().catch(() => ({}))) as { name?: string; message?: string };
    if (res.status === 401 || res.status === 403) {
      if (/restricted/i.test(`${out.name ?? ""} ${out.message ?? ""}`)) return { ok: false, error: "That key can only send email. In Resend, make a new API key with Full access, then paste it here." };
      return { ok: false, error: "Resend didn't accept that key. Check it was copied completely, or make a new one." };
    }
    return { ok: false, error: "Resend didn't answer. Please try again in a minute." };
  } catch {
    return { ok: false, error: "Resend didn't answer. Please try again in a minute." };
  }
}
