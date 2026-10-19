import type Stripe from "stripe";
import { createServerClient } from "@/lib/supabase/server";
import { platform } from "@/lib/stripeConnect";
import { isHousePlan } from "@/lib/housePlan";
import {
  BANK_ACCOUNT_CAP_BY_TIER,
  BANK_ACCOUNT_DEFAULT_CAP,
  cleanVendor,
  dayOf,
  findDuplicate,
  findOwnTransfers,
  looksLikeTransfer,
  suggest,
  typeOf,
  type BankLine,
  type LedgerLine,
} from "@/lib/bankFeedsLogic";

// Bank and card feeds (task 1150 part 2): Stripe Financial Connections, read-only.
//
// A client links a bank or card once, in Stripe's own window (the Suite never sees a bank password). Stripe fetches the
// transactions every day; the Suite pulls them into bank_transactions and suggests a category for each. NOTHING reaches the
// Finance Center until the client approves it on the review list. The Stripe objects (customer, linked account) live on the
// Suite's platform Stripe account; they only read bank data and never move money.
//
// Configuration (Vercel): STRIPE_CONNECT_SECRET_KEY or STRIPE_SECRET_KEY (already set), and
//   STRIPE_PLATFORM_PUBLISHABLE_KEY  pk_live_... of the platform account (needed by Stripe.js in the browser; it is public).
// Stripe must also have approved the platform's Financial Connections registration (Dashboard > Settings > Financial Connections).

type Db = ReturnType<typeof createServerClient>;

export const publishableKey = () => (process.env.STRIPE_PLATFORM_PUBLISHABLE_KEY || "").trim();
export const bankFeedsConfigured = () => Boolean(publishableKey() && (process.env.STRIPE_CONNECT_SECRET_KEY || process.env.STRIPE_SECRET_KEY));

export interface BankConnection {
  id: string;
  fc_account_id: string;
  institution_name: string | null;
  display_name: string | null;
  last4: string | null;
  category: string | null;
  status: string;
  last_synced_at: string | null;
  last_error: string | null;
}
export interface BankTxn {
  id: string;
  connection_id: string;
  amount_cents: number;
  description: string | null;
  transacted_on: string;
  review_status: string;
  suggested_type: string | null;
  suggested_category: string | null;
  suggested_vendor: string | null;
  matched_entry_id: string | null;
}
const CONN_COLS = "id, fc_account_id, institution_name, display_name, last4, category, status, last_synced_at, last_error";
const TXN_COLS = "id, connection_id, amount_cents, description, transacted_on, review_status, suggested_type, suggested_category, suggested_vendor, matched_entry_id";

/** Linked accounts this account may have: Starter 2, Growth 4, VIP 8 (Babs's own is VIP). */
export async function bankAccountCap(db: Db, planId: string): Promise<number> {
  if (await isHousePlan(planId)) return BANK_ACCOUNT_CAP_BY_TIER.vip;
  const { data: plan } = await db.from("client_master_plans").select("user_id").eq("id", planId).maybeSingle();
  if (!plan?.user_id) return BANK_ACCOUNT_DEFAULT_CAP;
  const { data: sub } = await db.from("subscriptions").select("plan_id").eq("user_id", plan.user_id).eq("status", "active").order("created_at", { ascending: false }).limit(1).maybeSingle();
  const tier = String(sub?.plan_id || "");
  if (!tier) return BANK_ACCOUNT_DEFAULT_CAP;
  const { data: row } = await db.from("plans").select("capabilities").eq("id", tier).maybeSingle();
  const n = (row?.capabilities as Record<string, unknown> | null)?.bank_accounts;
  return typeof n === "number" && n >= 0 ? n : BANK_ACCOUNT_CAP_BY_TIER[tier] ?? BANK_ACCOUNT_DEFAULT_CAP;
}

const friendly = (e: unknown): string => {
  const m = e instanceof Error ? e.message : String(e);
  if (/registration|not enabled|not been enabled|financial connections.*(access|enable)/i.test(m)) return "Bank linking isn't switched on yet. We're waiting on our payment provider's approval. Nothing was linked.";
  return m.slice(0, 300);
};

async function customerFor(db: Db, planId: string, email: string | null, name: string | null): Promise<string> {
  const { data: row } = await db.from("bank_feed_customers").select("stripe_customer_id").eq("master_plan_id", planId).maybeSingle();
  if (row?.stripe_customer_id) return row.stripe_customer_id as string;
  const c = await platform().customers.create({ ...(email ? { email } : {}), ...(name ? { name } : {}), metadata: { lccs_plan_id: planId, lccs_purpose: "bank_feeds" } });
  await db.from("bank_feed_customers").insert({ master_plan_id: planId, stripe_customer_id: c.id });
  return c.id;
}

/** Step 1 of linking: a Stripe session the browser opens with Stripe.js. */
export async function startLink(db: Db, planId: string, email: string | null, name: string | null): Promise<{ ok: true; clientSecret: string; publishableKey: string } | { ok: false; error: string }> {
  if (!bankFeedsConfigured()) return { ok: false, error: "Bank linking isn't set up yet." };
  const cap = await bankAccountCap(db, planId);
  const { count } = await db.from("bank_connections").select("id", { count: "exact", head: true }).eq("master_plan_id", planId).eq("status", "active");
  if ((count ?? 0) >= cap) return { ok: false, error: `Your plan includes ${cap} linked account${cap === 1 ? "" : "s"}. Unlink one to add another.` };
  try {
    const customer = await customerFor(db, planId, email, name);
    const session = await platform().financialConnections.sessions.create({
      account_holder: { type: "customer", customer },
      permissions: ["transactions"],
      filters: { countries: ["US"] },
      prefetch: ["transactions"],
    } as Stripe.FinancialConnections.SessionCreateParams);
    return { ok: true, clientSecret: session.client_secret as string, publishableKey: publishableKey() };
  } catch (e) {
    console.error("bank feeds session:", e instanceof Error ? e.message : e);
    return { ok: false, error: friendly(e) };
  }
}

/** Step 2: the person finished in Stripe's window. Save the accounts they chose (up to the plan's limit) and start the daily feed. */
export async function finishLink(db: Db, planId: string, sessionId: string, linkedBy: string | null): Promise<{ ok: true; added: number; leftOut: number } | { ok: false; error: string }> {
  try {
    const { data: cust } = await db.from("bank_feed_customers").select("stripe_customer_id").eq("master_plan_id", planId).maybeSingle();
    if (!cust) return { ok: false, error: "Start the link again." };
    const session = await platform().financialConnections.sessions.retrieve(sessionId);
    const holder = session.account_holder as { type?: string; customer?: string | { id: string } | null } | null;
    const holderId = typeof holder?.customer === "string" ? holder.customer : holder?.customer?.id;
    if (holderId !== cust.stripe_customer_id) return { ok: false, error: "That link doesn't belong to this account." };
    const accounts = (session.accounts?.data ?? []) as Stripe.FinancialConnections.Account[];
    const cap = await bankAccountCap(db, planId);
    let added = 0;
    let leftOut = 0;
    for (const a of accounts) {
      const { data: existing } = await db.from("bank_connections").select("id, master_plan_id, status").eq("fc_account_id", a.id).maybeSingle();
      if (existing && existing.master_plan_id !== planId) {
        leftOut++;
        continue;
      }
      const { count } = await db.from("bank_connections").select("id", { count: "exact", head: true }).eq("master_plan_id", planId).eq("status", "active");
      if (!existing || existing.status !== "active") {
        if ((count ?? 0) >= cap) {
          await platform().financialConnections.accounts.disconnect(a.id).catch(() => null);
          leftOut++;
          continue;
        }
      }
      const row = {
        master_plan_id: planId,
        fc_account_id: a.id,
        institution_name: a.institution_name || null,
        display_name: a.display_name || null,
        last4: a.last4 || null,
        category: a.category || null,
        status: "active",
        livemode: Boolean(a.livemode),
        last_error: null,
        linked_by: linkedBy,
      };
      if (existing) await db.from("bank_connections").update(row).eq("id", existing.id);
      else await db.from("bank_connections").insert(row);
      await platform().financialConnections.accounts.subscribe(a.id, { features: ["transactions"] }).catch((e: unknown) => console.error("bank feeds subscribe:", e instanceof Error ? e.message : e));
      added++;
    }
    return { ok: true, added, leftOut };
  } catch (e) {
    console.error("bank feeds finish:", e instanceof Error ? e.message : e);
    return { ok: false, error: friendly(e) };
  }
}

/** Stops the feed for one account at Stripe and here. Transactions already approved stay in the ledger; unreviewed ones are removed. */
export async function unlink(db: Db, planId: string, connectionId: string): Promise<boolean> {
  const { data: c } = await db.from("bank_connections").select("id, fc_account_id").eq("id", connectionId).eq("master_plan_id", planId).maybeSingle();
  if (!c) return false;
  await platform().financialConnections.accounts.disconnect(c.fc_account_id as string).catch((e: unknown) => console.error("bank feeds disconnect:", e instanceof Error ? e.message : e));
  await db.from("bank_transactions").delete().eq("connection_id", c.id).in("review_status", ["new", "transfer", "duplicate", "skipped"]).is("entry_id", null);
  await db.from("bank_connections").update({ status: "inactive", last_error: null }).eq("id", c.id);
  return true;
}

async function planContext(db: Db, planId: string) {
  const since = new Date(Date.now() - 400 * 86400000).toISOString().slice(0, 10);
  const { data } = await db.from("finance_entries").select("id, type, amount, category, occurred_on, source, vendor").eq("master_plan_id", planId).gte("occurred_on", since).limit(6000);
  const ledger = ((data ?? []) as { id: string; type: string; amount: number | string; category: string | null; occurred_on: string; source: string; vendor: string | null }[]).map((r) => ({
    id: r.id,
    type: r.type === "income" ? ("income" as const) : ("expense" as const),
    amount: Number(r.amount),
    occurred_on: r.occurred_on,
    source: r.source,
    vendor: r.vendor,
    category: r.category,
  })) satisfies LedgerLine[];
  const history = new Map<string, string>();
  const income = new Set<string>();
  const expense = new Set<string>();
  for (const r of [...ledger].sort((a, b) => a.occurred_on.localeCompare(b.occurred_on))) {
    if (r.category) (r.type === "income" ? income : expense).add(r.category);
    if (r.vendor && r.category) history.set(cleanVendor(r.vendor).toLowerCase(), r.category);
  }
  return { ledger, history, income: Array.from(income), expense: Array.from(expense) };
}

/** Pulls new transactions for one linked account and files each one as new, transfer or duplicate with a suggestion. */
export async function syncConnection(db: Db, conn: { id: string; master_plan_id: string; fc_account_id: string; last_refresh_token: string | null }): Promise<{ added: number; error?: string }> {
  const fc = platform().financialConnections;
  try {
    const acct = await fc.accounts.retrieve(conn.fc_account_id);
    if (acct.status !== "active") {
      await db.from("bank_connections").update({ status: "inactive", last_error: "Your bank needs you to sign in again. Unlink this account and link it again.", last_synced_at: new Date().toISOString() }).eq("id", conn.id);
      return { added: 0, error: "inactive" };
    }
    const refresh = acct.transaction_refresh;
    if (!refresh) {
      await fc.accounts.subscribe(conn.fc_account_id, { features: ["transactions"] }).catch(() => null);
      return { added: 0 };
    }
    if (refresh.status === "pending") return { added: 0 };
    const params: Record<string, unknown> = { account: conn.fc_account_id, limit: 100 };
    if (conn.last_refresh_token) params.transaction_refresh = { after: conn.last_refresh_token };
    const fresh: { id: string; amount: number; currency: string; description: string; transacted_at: number; status: string }[] = [];
    let seen = 0;
    for await (const t of fc.transactions.list(params as unknown as Stripe.FinancialConnections.TransactionListParams)) {
      fresh.push({ id: t.id, amount: t.amount, currency: t.currency, description: t.description, transacted_at: t.transacted_at, status: t.status });
      if (++seen >= 1500) break;
    }
    const added = await fileTransactions(db, conn.master_plan_id, conn.id, fresh);
    await db.from("bank_connections").update({ last_refresh_token: refresh.id, last_synced_at: new Date().toISOString(), last_error: null }).eq("id", conn.id);
    return { added };
  } catch (e) {
    const msg = friendly(e);
    await db.from("bank_connections").update({ last_error: msg, last_synced_at: new Date().toISOString() }).eq("id", conn.id);
    return { added: 0, error: msg };
  }
}

async function fileTransactions(db: Db, planId: string, connectionId: string, txns: { id: string; amount: number; currency: string; description: string; transacted_at: number; status: string }[]): Promise<number> {
  if (!txns.length) return 0;
  const ids = txns.map((t) => t.id);
  const { data: have } = await db.from("bank_transactions").select("fc_txn_id, review_status").in("fc_txn_id", ids);
  const known = new Map((have ?? []).map((r) => [r.fc_txn_id as string, r.review_status as string]));
  // Known lines: only the bank's own status can change (pending, posted, void). A client's decision is never undone.
  for (const t of txns) {
    if (!known.has(t.id)) continue;
    await db.from("bank_transactions").update({ bank_status: t.status, ...(t.status === "void" && known.get(t.id) === "new" ? { review_status: "skipped" } : {}), updated_at: new Date().toISOString() }).eq("fc_txn_id", t.id);
  }
  const brand = txns.filter((t) => !known.has(t.id) && t.status !== "void");
  if (!brand.length) return 0;
  const ctx = await planContext(db, planId);

  // Lines still waiting for review from other accounts help spot a transfer between two of the client's own accounts.
  const { data: waiting } = await db.from("bank_transactions").select("id, connection_id, amount_cents, description, transacted_on").eq("master_plan_id", planId).eq("review_status", "new").gte("transacted_on", new Date(Date.now() - 20 * 86400000).toISOString().slice(0, 10));
  const lines: BankLine[] = [
    ...((waiting ?? []) as { id: string; connection_id: string; amount_cents: number; description: string | null; transacted_on: string }[]).map((w) => ({ id: w.id, connectionId: w.connection_id, amountCents: w.amount_cents, description: w.description || "", day: w.transacted_on })),
    ...brand.map((t) => ({ id: t.id, connectionId, amountCents: t.amount, description: t.description || "", day: dayOf(t.transacted_at) })),
  ];
  const transfers = findOwnTransfers(lines);
  const taken = new Set<string>();

  const rows = brand.map((t) => {
    const day = dayOf(t.transacted_at);
    const line: BankLine = { id: t.id, connectionId, amountCents: t.amount, description: t.description || "", day };
    const sug = suggest(line, ctx.history, ctx.income, ctx.expense);
    let review = "new";
    let matched: string | null = null;
    if (transfers.has(t.id) || looksLikeTransfer(line.description)) review = "transfer";
    else {
      const dup = findDuplicate(line, ctx.ledger, taken);
      if (dup) {
        review = "duplicate";
        matched = dup.id;
        taken.add(dup.id);
      }
    }
    return {
      master_plan_id: planId,
      connection_id: connectionId,
      fc_txn_id: t.id,
      amount_cents: t.amount,
      currency: t.currency || "usd",
      description: (t.description || "").slice(0, 300),
      transacted_on: day,
      bank_status: t.status,
      review_status: review,
      suggested_type: sug.type,
      suggested_category: sug.category,
      suggested_vendor: sug.vendor,
      matched_entry_id: matched,
    };
  });
  const { data: inserted, error } = await db.from("bank_transactions").upsert(rows, { onConflict: "fc_txn_id", ignoreDuplicates: true }).select("id");
  if (error) throw new Error(`save bank transactions: ${error.message}`);
  // A transfer partner that was already waiting is set aside too.
  const partnerIds = Array.from(transfers).filter((id) => !brand.some((b) => b.id === id));
  if (partnerIds.length) await db.from("bank_transactions").update({ review_status: "transfer", updated_at: new Date().toISOString() }).in("id", partnerIds).eq("review_status", "new");
  return inserted?.length ?? 0;
}

/** Syncs every active account of one client (the "Check now" button and the daily job). */
export async function syncPlan(db: Db, planId: string, refreshFirst = false): Promise<{ added: number; errors: string[] }> {
  const { data } = await db.from("bank_connections").select("id, master_plan_id, fc_account_id, last_refresh_token").eq("master_plan_id", planId).eq("status", "active");
  let added = 0;
  const errors: string[] = [];
  for (const c of (data ?? []) as { id: string; master_plan_id: string; fc_account_id: string; last_refresh_token: string | null }[]) {
    if (refreshFirst) await platform().financialConnections.accounts.refresh(c.fc_account_id, { features: ["transactions"] }).catch(() => null);
    const r = await syncConnection(db, c);
    added += r.added;
    if (r.error && r.error !== "inactive") errors.push(r.error);
  }
  return { added, errors };
}

/** The daily job: every active account of every client. */
export async function syncAll(db: Db): Promise<{ accounts: number; added: number }> {
  const { data } = await db.from("bank_connections").select("id, master_plan_id, fc_account_id, last_refresh_token").eq("status", "active").limit(500);
  let added = 0;
  for (const c of (data ?? []) as { id: string; master_plan_id: string; fc_account_id: string; last_refresh_token: string | null }[]) {
    const r = await syncConnection(db, c);
    added += r.added;
  }
  return { accounts: data?.length ?? 0, added };
}

export async function bankSummary(db: Db, planId: string) {
  const [cap, conns, review, setAside, dupes] = await Promise.all([
    bankAccountCap(db, planId),
    db.from("bank_connections").select(CONN_COLS).eq("master_plan_id", planId).eq("status", "active").order("created_at"),
    db.from("bank_transactions").select(TXN_COLS).eq("master_plan_id", planId).eq("review_status", "new").eq("bank_status", "posted").order("transacted_on", { ascending: false }).limit(300),
    db.from("bank_transactions").select(TXN_COLS).eq("master_plan_id", planId).eq("review_status", "transfer").order("transacted_on", { ascending: false }).limit(100),
    db.from("bank_transactions").select(TXN_COLS).eq("master_plan_id", planId).eq("review_status", "duplicate").order("transacted_on", { ascending: false }).limit(100),
  ]);
  return {
    configured: bankFeedsConfigured(),
    cap,
    connections: (conns.data ?? []) as BankConnection[],
    review: (review.data ?? []) as BankTxn[],
    setAside: (setAside.data ?? []) as BankTxn[],
    duplicates: (dupes.data ?? []) as BankTxn[],
  };
}

export interface ReviewItem {
  id: string;
  category?: string;
  vendor?: string;
  type?: "income" | "expense";
}

/** Approve posts to the Finance Center (once each); skip sets a line aside; back-to-review undoes a skip or a set-aside. */
export async function reviewTransactions(db: Db, planId: string, action: "approve" | "skip" | "restore", items: ReviewItem[]): Promise<{ done: number }> {
  if (!items.length) return { done: 0 };
  const ids = items.map((i) => i.id).slice(0, 300);
  const { data } = await db.from("bank_transactions").select("id, connection_id, fc_txn_id, amount_cents, description, transacted_on, review_status, suggested_type, suggested_category, suggested_vendor, entry_id").eq("master_plan_id", planId).in("id", ids);
  const rows = (data ?? []) as { id: string; connection_id: string; fc_txn_id: string; amount_cents: number; description: string | null; transacted_on: string; review_status: string; suggested_type: string | null; suggested_category: string | null; suggested_vendor: string | null; entry_id: string | null }[];
  const by = new Map(items.map((i) => [i.id, i]));
  const now = new Date().toISOString();
  let done = 0;
  if (action === "skip") {
    const mine = rows.filter((r) => !r.entry_id).map((r) => r.id);
    if (mine.length) await db.from("bank_transactions").update({ review_status: "skipped", reviewed_at: now, updated_at: now }).in("id", mine);
    return { done: mine.length };
  }
  if (action === "restore") {
    const mine = rows.filter((r) => !r.entry_id && r.review_status !== "approved").map((r) => r.id);
    if (mine.length) await db.from("bank_transactions").update({ review_status: "new", reviewed_at: null, updated_at: now }).in("id", mine);
    return { done: mine.length };
  }
  const { data: conns } = await db.from("bank_connections").select("id, business_id").eq("master_plan_id", planId);
  const business = new Map((conns ?? []).map((c) => [c.id as string, (c.business_id as number | null) ?? null]));
  for (const r of rows) {
    if (r.entry_id || r.review_status === "approved") continue;
    const edit = by.get(r.id);
    const type = edit?.type || (r.suggested_type === "income" || r.suggested_type === "expense" ? r.suggested_type : typeOf(r.amount_cents));
    const category = (edit?.category || r.suggested_category || (type === "income" ? "Income" : "Uncategorized")).trim().slice(0, 80);
    const vendor = (edit?.vendor ?? r.suggested_vendor ?? "").trim().slice(0, 80) || null;
    const { data: entry, error } = await db
      .from("finance_entries")
      .upsert(
        {
          master_plan_id: planId,
          type,
          amount: Math.abs(r.amount_cents) / 100,
          category,
          description: (r.description || vendor || "Bank transaction").slice(0, 200),
          occurred_on: r.transacted_on,
          source: "bank",
          external_id: `bank:${r.fc_txn_id}`,
          vendor,
          business_id: business.get(r.connection_id) ?? null,
          payment_type: "one_time",
        },
        { onConflict: "master_plan_id,external_id" },
      )
      .select("id")
      .single();
    if (error || !entry) {
      console.error("bank feeds approve:", error?.message);
      continue;
    }
    await db.from("bank_transactions").update({ review_status: "approved", entry_id: entry.id, reviewed_at: now, updated_at: now }).eq("id", r.id);
    done++;
  }
  return { done };
}
