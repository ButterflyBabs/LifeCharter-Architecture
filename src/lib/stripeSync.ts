import { createServerClient } from "@/lib/supabase/server";

// A client's OWN Stripe account (not the Suite's billing): with a read-only
// restricted key, their payments, Stripe fees and refunds flow into their
// Finance Center ledger automatically, each exactly once.

const PROVIDER = "stripe";
const API = "https://api.stripe.com/v1";

async function stripeGet(key: string, path: string, params: Record<string, string> = {}) {
  const url = new URL(`${API}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${key}` }, cache: "no-store" });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error?.message || `Stripe error ${res.status}`);
  return body;
}

// Checks the key can read the balance (and isn't a secret key with write access we don't need).
export async function validateStripeKey(key: string): Promise<{ ok: true; account: string } | { ok: false; error: string }> {
  if (!/^(rk|sk)_(live|test)_/.test(key)) return { ok: false, error: "That doesn't look like a Stripe key. It should start with rk_live_ (a restricted key)." };
  try {
    await stripeGet(key, "/balance");
    let account = "";
    try {
      const acct = await stripeGet(key, "/account");
      account = acct?.settings?.dashboard?.display_name || acct?.business_profile?.name || acct?.id || "";
    } catch {
      /* restricted keys often can't read the account; that's fine */
    }
    return { ok: true, account };
  } catch (e) {
    return { ok: false, error: `Stripe didn't accept that key: ${(e as Error).message}` };
  }
}

interface Txn {
  id: string;
  type: string;
  amount: number;
  fee: number;
  currency: string;
  created: number;
  description: string | null;
}

const day = (unix: number) => new Date(unix * 1000).toISOString().slice(0, 10);

// Pulls new balance transactions since the last sync (first sync: 90 days back).
export async function syncStripe(masterPlanId: string): Promise<{ added: number; checked: number; error?: string }> {
  const db = createServerClient();
  const { data: integ } = await db
    .from("client_integrations")
    .select("id, api_key, status, metadata")
    .eq("master_plan_id", masterPlanId)
    .eq("provider", PROVIDER)
    .maybeSingle();
  const key = ((integ?.api_key as string) || "").trim();
  if (!integ || !key || integ.status !== "connected") return { added: 0, checked: 0, error: "Stripe isn't connected." };
  const meta = (integ.metadata as Record<string, unknown>) ?? {};
  const since = Number(meta.last_sync_created) || Math.floor(Date.now() / 1000) - 90 * 86400;

  const txns: Txn[] = [];
  let startingAfter = "";
  try {
    for (let page = 0; page < 20; page++) {
      const params: Record<string, string> = { limit: "100", "created[gte]": String(since) };
      if (startingAfter) params.starting_after = startingAfter;
      const out = await stripeGet(key, "/balance_transactions", params);
      const data = (out.data ?? []) as Txn[];
      txns.push(...data);
      if (!out.has_more || !data.length) break;
      startingAfter = data[data.length - 1].id;
    }
  } catch (e) {
    const error = (e as Error).message;
    await db.from("client_integrations").update({ metadata: { ...meta, last_error: error, last_error_at: new Date().toISOString() } }).eq("id", integ.id);
    return { added: 0, checked: 0, error };
  }

  const rows: Record<string, unknown>[] = [];
  for (const t of txns) {
    const cur = (t.currency || "usd").toUpperCase();
    const note = cur === "USD" ? "" : ` (${cur})`;
    if (t.type === "charge" || t.type === "payment") {
      rows.push({ master_plan_id: masterPlanId, type: "income", amount: t.amount / 100, category: "Stripe sales", description: (t.description || "Stripe payment") + note, occurred_on: day(t.created), source: "stripe", external_id: `stripe:${t.id}` });
    } else if (t.type === "refund" || t.type === "payment_refund") {
      rows.push({ master_plan_id: masterPlanId, type: "expense", amount: Math.abs(t.amount) / 100, category: "Refunds", description: (t.description || "Stripe refund") + note, occurred_on: day(t.created), source: "stripe", external_id: `stripe:${t.id}` });
    }
    if (t.fee > 0 && (t.type === "charge" || t.type === "payment")) {
      rows.push({ master_plan_id: masterPlanId, type: "expense", amount: t.fee / 100, category: "Payment processing fees", description: "Stripe fees" + note, occurred_on: day(t.created), source: "stripe", external_id: `stripe:${t.id}:fee` });
    }
  }

  let added = 0;
  if (rows.length) {
    const { data, error } = await db.from("finance_entries").upsert(rows, { onConflict: "master_plan_id,external_id", ignoreDuplicates: true }).select("id");
    if (error) {
      console.error("stripe sync insert:", error.message);
      return { added: 0, checked: txns.length, error: "Couldn't save the payments." };
    }
    added = (data ?? []).length;
  }
  const newest = txns.reduce((m, t) => Math.max(m, t.created), since);
  await db
    .from("client_integrations")
    .update({ metadata: { ...meta, last_sync_at: new Date().toISOString(), last_sync_created: newest, last_added: added, last_error: null }, updated_at: new Date().toISOString() })
    .eq("id", integ.id);
  return { added, checked: txns.length };
}
