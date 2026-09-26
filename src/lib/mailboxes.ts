import { authEnabled } from "@/lib/authz";
import { createServerClient } from "@/lib/supabase/server";
import * as google from "@/lib/google";
import * as microsoft from "@/lib/microsoft";
import { houseMailOwner, type MailScope } from "@/lib/mailOwner";

export type Provider = "google" | "microsoft";

export interface MailAccountRef {
  provider: Provider;
  accountKey: string;
  email: string | null;
  canWriteCalendar?: boolean; // Google only; Microsoft always can
}

// Every mailbox the account has connected, across both providers, oldest first.
export async function listMailAccounts(scope?: MailScope): Promise<MailAccountRef[]> {
  const [g, m] = await Promise.all([google.listConnections(scope), microsoft.listConnections(scope)]);
  return [
    ...g.map((c) => ({ provider: "google" as const, ...c })),
    ...m.map((c) => ({ provider: "microsoft" as const, ...c })),
  ];
}

// How many connected email accounts this account's plan allows. The founding
// account, comped accounts and anything undeterminable are unlimited — same
// fail-open rule as the workspace/seat limits.
export async function mailboxAllowance(ownerId: string): Promise<{ limit: number | null; used: number }> {
  const used = (await listMailAccounts({ ownerId })).length;
  if (!authEnabled()) return { limit: null, used };
  try {
    if (ownerId === (await houseMailOwner())) return { limit: null, used };
    const supabase = createServerClient();
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("plan_id")
      .eq("user_id", ownerId)
      .eq("status", "active")
      .gt("current_period_end", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!sub?.plan_id) return { limit: null, used };
    const { data: plan } = await supabase.from("plans").select("capabilities").eq("id", sub.plan_id).maybeSingle();
    const raw = (plan?.capabilities as Record<string, unknown> | null)?.mailboxes;
    const limit = typeof raw === "number" && raw >= 0 ? raw : null;
    return { limit, used };
  } catch (e) {
    console.error("mailboxAllowance:", e);
    return { limit: null, used };
  }
}

export interface OpenMailbox extends MailAccountRef {
  token: string;
  label: string;
}

// Every connected mailbox of the account with a working access token, ready to
// query. Mailboxes whose token can't be refreshed are left out.
export async function openMailboxes(scope?: MailScope): Promise<OpenMailbox[]> {
  const refs = await listMailAccounts(scope);
  const opened = await Promise.all(
    refs.map(async (ref): Promise<OpenMailbox | null> => {
      const lib = ref.provider === "google" ? google : microsoft;
      const token = await lib.getValidAccessToken({ ...scope, accountKey: ref.accountKey });
      if (!token) return null;
      let email = ref.email;
      if (!email && ref.provider === "google") {
        email = await google.fetchGoogleEmail(token);
        if (email) await google.setConnectionEmail(ref.accountKey, email).catch(() => {});
      }
      return { ...ref, email, token, label: email ?? (ref.provider === "google" ? "Gmail" : "Microsoft 365") };
    })
  );
  return opened.filter((m): m is OpenMailbox => m !== null);
}
