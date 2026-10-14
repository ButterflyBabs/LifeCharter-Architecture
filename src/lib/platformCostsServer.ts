import { createServerClient } from "@/lib/supabase/server";
import * as microsoft from "@/lib/microsoft";
import { stripe } from "@/lib/stripe";
import { estimateCostCents } from "@/lib/ai/meter";
import { VENDORS, looksLikeReceipt, monthOf, parseReceipt, summarizeMonths, type Entry } from "@/lib/platformCosts";

// Server side of Platform Costs: reading the entries, counting real clients, and scanning the house mailbox for
// receipts. Everything is scoped to one plan (the house plan) and only the Alignment Architect reaches it.

const DEFAULT_EXCLUDED = ["sumbalteepu786@gmail.com", "marcello@amilynnecarroll.com"]; // team accounts, not clients

type Db = ReturnType<typeof createServerClient>;

async function setting(db: Db, key: string): Promise<string> {
  const { data } = await db.from("app_settings").select("value").eq("key", key).maybeSingle();
  return String(data?.value ?? "").trim();
}

export async function loadEntries(db: Db, planId: string): Promise<Entry[]> {
  const { data } = await db
    .from("platform_cost_entries")
    .select("id, month, vendor, label, amount_cents, counts, status, source, receipt_subject, note")
    .eq("master_plan_id", planId)
    .neq("status", "rejected")
    .order("month", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(500);
  return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
    id: String(r.id),
    month: String(r.month).slice(0, 10),
    vendor: String(r.vendor),
    label: (r.label as string | null) ?? null,
    amountCents: Number(r.amount_cents),
    counts: Boolean(r.counts),
    status: r.status as Entry["status"],
    source: r.source as Entry["source"],
    receiptSubject: (r.receipt_subject as string | null) ?? null,
    note: (r.note as string | null) ?? null,
  }));
}

export interface ClientCount {
  count: number;
  auto: number;
  override: number | null;
  names: string[];
}

/** Real client accounts: every plan except the house, the demo, test (Eloise) and team accounts. */
export async function countClients(db: Db, planId: string): Promise<ClientCount> {
  const excluded = new Set(
    [...DEFAULT_EXCLUDED, ...(await setting(db, "platform_costs_exclude_emails")).split(/[,\s]+/)].map((s) => s.toLowerCase()).filter(Boolean)
  );
  const { data } = await db.from("client_master_plans").select("id, client_name, client_email, status").neq("id", planId);
  const names: string[] = [];
  for (const r of (data ?? []) as { id: string; client_name: string | null; client_email: string | null; status: string | null }[]) {
    const email = String(r.client_email ?? "").toLowerCase();
    const name = String(r.client_name ?? "");
    if (r.status && r.status !== "active") continue;
    if (/^demo\b/i.test(name) || /eloise/i.test(email) || /eloise/i.test(name) || excluded.has(email)) continue;
    names.push(name || email);
  }
  const ov = parseInt(await setting(db, "platform_costs_client_count_override"), 10);
  const override = Number.isFinite(ov) && ov >= 0 ? ov : null;
  return { count: override ?? names.length, auto: names.length, override, names };
}

export async function planPrices(db: Db): Promise<{ id: string; name: string; monthlyCents: number }[]> {
  const { data } = await db.from("plans").select("id, name, price_monthly").eq("is_active", true).order("price_monthly");
  return ((data ?? []) as { id: string; name: string; price_monthly: number }[]).map((p) => ({ id: p.id, name: p.name, monthlyCents: Number(p.price_monthly) }));
}

/** Stripe's own processing fees for the last three months, by month. Best effort: says why when it cannot read them. */
export async function stripeFeesByMonth(): Promise<{ fees: Record<string, number>; note: string | null }> {
  if (!stripe) return { fees: {}, note: "Stripe is not connected on this deployment." };
  const fees: Record<string, number> = {};
  let seen = 0;
  try {
    const since = Math.floor(Date.now() / 1000) - 100 * 86_400;
    for await (const t of stripe.balanceTransactions.list({ created: { gte: since }, limit: 100 })) {
      if (++seen > 3000) break;
      // Every balance transaction that carries a fee: charges, payments, refunds' fee reversals are negative.
      if (!t.fee) continue;
      const m = monthOf(t.created * 1000);
      fees[m] = (fees[m] ?? 0) + t.fee;
    }
    return { fees, note: seen === 0 ? "Stripe returned no balance transactions in the last 100 days." : null };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("platform-costs stripe fees:", msg);
    return { fees: {}, note: `Stripe would not share fees: ${msg.slice(0, 160)}` };
  }
}


export interface AiUsageRow {
  profileId: string | null;
  name: string;
  kind: string;
  calls: number;
  inputTokens: number;
  outputTokens: number;
  estCents: number;
}

/** AI use over the last 30 days, by account and key. Counts only; nothing about what was asked is stored. */
export async function aiUsageSummary(db: Db): Promise<{ rows: AiUsageRow[]; days: number; houseCents: number; clientCents: number }> {
  const days = 30;
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  const { data } = await db.from("ai_usage_log").select("profile_id, key_kind, model, input_tokens, output_tokens").gte("created_at", since).limit(20000);
  const by = new Map<string, AiUsageRow>();
  for (const r of (data ?? []) as { profile_id: string | null; key_kind: string; model: string | null; input_tokens: number; output_tokens: number }[]) {
    const k = `${r.profile_id ?? "-"}|${r.key_kind}`;
    const row = by.get(k) ?? { profileId: r.profile_id, name: "", kind: r.key_kind, calls: 0, inputTokens: 0, outputTokens: 0, estCents: 0 };
    row.calls += 1;
    row.inputTokens += r.input_tokens || 0;
    row.outputTokens += r.output_tokens || 0;
    row.estCents += estimateCostCents(r.model, r.input_tokens || 0, r.output_tokens || 0);
    by.set(k, row);
  }
  const ids = Array.from(new Set(Array.from(by.values()).map((r) => r.profileId).filter((x): x is string => Boolean(x))));
  const names = new Map<string, string>();
  if (ids.length) {
    const { data: profs } = await db.from("profiles").select("id, full_name, email").in("id", ids);
    for (const p of (profs ?? []) as { id: string; full_name: string | null; email: string | null }[]) names.set(p.id, p.full_name || p.email || "Account");
  }
  const rows = Array.from(by.values())
    .map((r) => ({ ...r, name: r.profileId ? names.get(r.profileId) ?? "Account" : r.kind === "plus" ? "Collective Plus (shared key)" : r.kind === "house" ? "House key" : "Not attributed", estCents: Math.round(r.estCents) }))
    .sort((a, b) => b.estCents - a.estCents);
  const houseCents = rows.filter((r) => r.kind === "house" || r.kind === "plus").reduce((n, r) => n + r.estCents, 0);
  const clientCents = rows.filter((r) => r.kind === "own").reduce((n, r) => n + r.estCents, 0);
  return { rows, days, houseCents, clientCents };
}

export async function loadSummary(db: Db, planId: string) {
  const [entries, clients, prices, fee, aiUsage] = await Promise.all([loadEntries(db, planId), countClients(db, planId), planPrices(db), stripeFeesByMonth(), aiUsageSummary(db)]);
  const months = summarizeMonths(entries);
  return { entries, months, clients, prices, stripeFees: fee.fees, stripeFeesNote: fee.note, aiUsage };
}

export interface ScanResult {
  scanned: number;
  added: number;
  skipped: number;
  error?: string;
}

/**
 * Looks in the house mailbox for each vendor's receipts from the last ~100 days and files any it has not seen as
 * "proposed" entries. Never marks anything confirmed. Safe to run repeatedly: a receipt is stored once.
 */
export async function scanReceipts(db: Db, planId: string): Promise<ScanResult> {
  const res: ScanResult = { scanned: 0, added: 0, skipped: 0 };
  const token = await microsoft.getValidAccessToken({ house: true });
  if (!token) return { ...res, error: "The house mailbox (Microsoft 365) is not connected." };
  const since = Date.now() - 100 * 86_400_000;
  const { data: seen } = await db.from("platform_cost_entries").select("receipt_ref, vendor, month, amount_cents").eq("master_plan_id", planId);
  const rows = (seen ?? []) as { receipt_ref: string | null; vendor: string; month: string; amount_cents: number }[];
  const known = new Set(rows.map((r) => r.receipt_ref).filter((r): r is string => Boolean(r)));
  // The same bill typed in by hand (or already confirmed) must not come back as a second proposal.
  const same = new Set(rows.map((r) => `${r.vendor}|${String(r.month).slice(0, 7)}|${r.amount_cents}`));
  for (const v of VENDORS) {
    let hits: Awaited<ReturnType<typeof microsoft.searchInbox>> = [];
    try {
      hits = await microsoft.searchInbox(token, `from:${v.domain}`, 25);
    } catch (e) {
      console.error("platform-costs search", v.key, e instanceof Error ? e.message : e);
      continue;
    }
    for (const m of hits) {
      if (m.ts < since || !looksLikeReceipt(m.subject)) continue;
      res.scanned += 1;
      const ref = m.messageId || m.id;
      if (known.has(ref)) {
        res.skipped += 1;
        continue;
      }
      let body = m.preview;
      try {
        const full = await microsoft.fetchMessage(token, m.id);
        body = full.bodyHtml || full.bodyText || m.preview;
      } catch {
        /* fall back to the preview */
      }
      const parsed = parseReceipt(m.subject, String(body || m.preview));
      if (!parsed || parsed.amountCents === 0) {
        res.skipped += 1;
        continue;
      }
      if (same.has(`${v.key}|${monthOf(m.ts).slice(0, 7)}|${parsed.amountCents}`)) {
        res.skipped += 1;
        continue;
      }
      const { error } = await db.from("platform_cost_entries").insert({
        master_plan_id: planId,
        month: monthOf(m.ts),
        vendor: v.key,
        amount_cents: parsed.amountCents,
        counts: v.countsByDefault,
        status: "proposed",
        source: "receipt",
        receipt_ref: ref,
        receipt_subject: m.subject.slice(0, 200),
      });
      if (error) res.skipped += 1;
      else {
        res.added += 1;
        known.add(ref);
        same.add(`${v.key}|${monthOf(m.ts).slice(0, 7)}|${parsed.amountCents}`);
      }
    }
  }
  return res;
}
