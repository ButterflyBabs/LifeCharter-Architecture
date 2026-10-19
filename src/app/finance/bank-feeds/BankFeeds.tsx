"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Banknote, Check, Landmark, Loader2, RefreshCw, Undo2, X } from "lucide-react";

type Conn = { id: string; fc_account_id: string; institution_name: string | null; display_name: string | null; last4: string | null; category: string | null; status: string; last_synced_at: string | null; last_error: string | null };
type Txn = { id: string; connection_id: string; amount_cents: number; description: string | null; transacted_on: string; review_status: string; suggested_type: string | null; suggested_category: string | null; suggested_vendor: string | null; matched_entry_id: string | null };
type Data = { configured: boolean; cap: number; connections: Conn[]; review: Txn[]; setAside: Txn[]; duplicates: Txn[] };
type Edit = { category?: string; vendor?: string };

const card = "rounded-2xl border border-[#1a2b4a]/10 bg-white p-5 shadow-[0_8px_24px_rgba(26,43,74,0.08)] dark:border-white/10 dark:bg-[#1a2b4a]/40";
const field = "w-full rounded-lg border border-[#1a2b4a]/20 bg-white px-2 py-1.5 text-sm text-[#1a2b4a] dark:bg-[#1a2b4a]/30 dark:text-[#F8F5F0] dark:border-white/15";
const btn = "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-50";
const usd = (cents: number) => `${cents < 0 ? "-" : "+"}$${(Math.abs(cents) / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const day = (s: string) => new Date(`${s}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

declare global {
  interface Window {
    Stripe?: (key: string) => { collectFinancialConnectionsAccounts: (o: { clientSecret: string }) => Promise<{ financialConnectionsSession?: { id: string }; error?: { message?: string } }> };
  }
}
function loadStripeJs(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Stripe) return resolve();
    const s = document.createElement("script");
    s.src = "https://js.stripe.com/v3/";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Couldn't load Stripe's secure window."));
    document.head.appendChild(s);
  });
}

export default function BankFeeds() {
  const [d, setD] = useState<Data | null>(null);
  const [err, setErr] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState("");
  const [picked, setPicked] = useState<Record<string, boolean>>({});
  const [edits, setEdits] = useState<Record<string, Edit>>({});
  const [cats, setCats] = useState<{ income: string[]; expense: string[] }>({ income: [], expense: [] });

  const load = useCallback(() => {
    fetch("/api/bank-feeds", { cache: "no-store" })
      .then(async (r) => (r.ok ? setD(await r.json()) : setErr("Couldn't load bank feeds.")))
      .catch(() => setErr("Couldn't load bank feeds."));
  }, []);
  useEffect(load, [load]);
  useEffect(() => {
    (["income", "expense"] as const).forEach((t) =>
      fetch(`/api/finance/categories?type=${t}`, { cache: "no-store" })
        .then((r) => r.json())
        .then((j) => setCats((c) => ({ ...c, [t]: Array.isArray(j.categories) ? j.categories : [] })))
        .catch(() => null),
    );
  }, []);

  async function post(body: Record<string, unknown>) {
    const r = await fetch("/api/bank-feeds", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    return { ok: r.ok, j: await r.json().catch(() => ({})) };
  }

  async function link() {
    setErr("");
    setNote("");
    setBusy("link");
    try {
      const s = await post({ action: "start" });
      if (!s.ok) throw new Error(s.j.error || "Couldn't start.");
      await loadStripeJs();
      const stripe = window.Stripe!(s.j.publishableKey);
      const res = await stripe.collectFinancialConnectionsAccounts({ clientSecret: s.j.clientSecret });
      if (res.error) throw new Error(res.error.message || "The link was not finished.");
      const f = await post({ action: "finish", sessionId: res.financialConnectionsSession?.id });
      if (!f.ok) throw new Error(f.j.error || "Couldn't save the accounts.");
      setNote(`${f.j.added} account${f.j.added === 1 ? "" : "s"} linked.${f.j.leftOut ? ` ${f.j.leftOut} left out (over your plan's limit or already linked).` : ""} New transactions appear below within a few minutes.`);
      load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "That didn't work.");
    }
    setBusy("");
  }
  async function checkNow() {
    setBusy("sync");
    setErr("");
    const r = await post({ action: "sync" });
    setBusy("");
    if (!r.ok) return setErr("Couldn't check right now.");
    setNote(r.j.added ? `${r.j.added} new transaction${r.j.added === 1 ? "" : "s"} found.` : "Nothing new yet. Banks usually update once a day.");
    load();
  }
  async function unlinkOne(c: Conn) {
    if (!window.confirm(`Stop the feed from ${c.institution_name || "this bank"}? Transactions you already approved stay in your Finance Center. Ones still waiting here are removed.`)) return;
    await post({ action: "unlink", connectionId: c.id });
    load();
  }

  const review = useMemo(() => d?.review ?? [], [d]);
  const chosen = useMemo(() => review.filter((t) => picked[t.id]), [review, picked]);
  async function act(action: "approve" | "skip" | "restore", rows: Txn[]) {
    if (!rows.length) return;
    setBusy(action);
    const items = rows.map((t) => ({ id: t.id, ...(edits[t.id] ?? {}) }));
    const r = await post({ action, items });
    setBusy("");
    if (!r.ok) return setErr("That didn't work. Please try again.");
    setPicked({});
    setNote(action === "approve" ? `${r.j.done} added to your Finance Center.` : action === "skip" ? `${r.j.done} set aside.` : `${r.j.done} moved back to review.`);
    load();
  }
  const conn = (id: string) => d?.connections.find((c) => c.id === id);
  const atCap = d ? d.connections.length >= d.cap : false;

  return (
    <div className="w-full space-y-6 px-4 py-8 sm:px-6">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c9a227]">Finance</p>
        <h1 className="mt-2 text-3xl font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Bank &amp; card feeds</h1>
        <p className="mt-2 max-w-3xl text-[15px] text-[#5b5f73] dark:text-[#b8a898]">
          Link a business bank account or card once and new transactions arrive here every day, with a suggested category. <strong>Nothing reaches your{" "}
          <Link href="/finance" className="text-[#2E7C83] underline">Finance Center</Link> until you approve it.</strong> The link is read-only: it can see transactions but can never move money, and the Suite never sees your bank password.
        </p>
      </header>

      {err && <p className="text-sm text-[#8a2f2f]">{err}</p>}
      {note && <p className="text-sm text-[#2E7C83]">{note}</p>}
      {d && !d.configured && (
        <div className={card}><p className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Not switched on yet</p><p className="mt-1 text-sm text-[#5b5f73] dark:text-[#b8a898]">Bank linking is waiting on its final setup. Nothing is linked and nothing is charged.</p></div>
      )}

      {d && (
        <section className={card}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]"><Landmark className="h-4 w-4 text-[#2E7C83]" />Linked accounts <span className="text-sm font-normal text-[#7b6b8d]">{d.connections.length} of {d.cap} on your plan</span></h2>
            <div className="flex gap-2">
              {!!d.connections.length && <button type="button" onClick={checkNow} disabled={!!busy} className={`${btn} border border-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]`}>{busy === "sync" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}Check now</button>}
              <button type="button" onClick={link} disabled={!!busy || !d.configured || atCap} className={`${btn} bg-[#1a2b4a] text-white dark:bg-[#c9a227] dark:text-[#1a2b4a]`}>{busy === "link" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Banknote className="h-4 w-4" />}Link an account</button>
            </div>
          </div>
          {atCap && <p className="mt-2 text-xs text-[#7b6b8d]">Your plan&apos;s limit is {d.cap}. Unlink one to add another.</p>}
          {!d.connections.length && <p className="mt-3 text-sm text-[#7b6b8d]">No accounts linked yet.</p>}
          <ul className="mt-3 divide-y divide-[#1a2b4a]/10 dark:divide-white/10">
            {d.connections.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <span className="text-[#1a2b4a] dark:text-[#F8F5F0]"><span className="font-semibold">{c.institution_name || "Bank"}</span> · {c.display_name || c.category || "Account"}{c.last4 ? ` ••${c.last4}` : ""}
                  <span className="ml-2 text-xs text-[#7b6b8d]">{c.last_synced_at ? `checked ${new Date(c.last_synced_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : "first check coming"}</span>
                  {c.last_error && <span className="ml-2 text-xs text-[#8a2f2f]">{c.last_error}</span>}
                </span>
                <button type="button" onClick={() => unlinkOne(c)} className="text-xs font-semibold text-[#8a2f2f] hover:underline">Unlink</button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {d && !!d.connections.length && (
        <section className={card}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">To review <span className="text-sm font-normal text-[#7b6b8d]">{review.length}</span></h2>
            {!!review.length && (
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setPicked(chosen.length === review.length ? {} : Object.fromEntries(review.map((t) => [t.id, true])))} className={`${btn} border border-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]`}>{chosen.length === review.length ? "Select none" : "Select all"}</button>
                <button type="button" onClick={() => act("skip", chosen)} disabled={!chosen.length || !!busy} className={`${btn} border border-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]`}><X className="h-4 w-4" />Skip ({chosen.length})</button>
                <button type="button" onClick={() => act("approve", chosen)} disabled={!chosen.length || !!busy} className={`${btn} bg-[#2E7C83] text-white`}>{busy === "approve" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}Approve ({chosen.length})</button>
              </div>
            )}
          </div>
          {!review.length && <p className="mt-3 text-sm text-[#7b6b8d]">Nothing waiting. New transactions show up here after your bank updates, usually once a day.</p>}
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <tbody className="divide-y divide-[#1a2b4a]/10 dark:divide-white/10">
                {review.map((t) => {
                  const type = t.suggested_type === "income" ? "income" : "expense";
                  return (
                    <tr key={t.id} className="align-top">
                      <td className="py-2 pr-2"><input type="checkbox" checked={!!picked[t.id]} onChange={(e) => setPicked((p) => ({ ...p, [t.id]: e.target.checked }))} aria-label="Select" /></td>
                      <td className="whitespace-nowrap py-2 pr-3 text-xs text-[#7b6b8d]">{day(t.transacted_on)}<br />{conn(t.connection_id)?.institution_name || ""}</td>
                      <td className="py-2 pr-3 text-[#1a2b4a] dark:text-[#F8F5F0]"><span className="line-clamp-2">{t.description}</span></td>
                      <td className={`whitespace-nowrap py-2 pr-3 font-semibold ${t.amount_cents < 0 ? "text-[#8a2f2f]" : "text-[#2E7C83]"}`}>{usd(t.amount_cents)}</td>
                      <td className="py-2 pr-2"><input className={field} defaultValue={t.suggested_vendor || ""} onChange={(e) => setEdits((m) => ({ ...m, [t.id]: { ...m[t.id], vendor: e.target.value } }))} aria-label="Paid to or from" placeholder={t.amount_cents < 0 ? "Paid to" : "From"} /></td>
                      <td className="py-2"><input className={field} list={`cats-${type}`} defaultValue={t.suggested_category || ""} onChange={(e) => setEdits((m) => ({ ...m, [t.id]: { ...m[t.id], category: e.target.value } }))} aria-label="Category" placeholder="Category" /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <datalist id="cats-expense">{cats.expense.map((c) => <option key={c} value={c} />)}</datalist>
            <datalist id="cats-income">{cats.income.map((c) => <option key={c} value={c} />)}</datalist>
          </div>
        </section>
      )}

      {d && (!!d.setAside.length || !!d.duplicates.length) && (
        <section className={card}>
          <details>
            <summary className="cursor-pointer text-lg font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Set aside by the Suite <span className="text-sm font-normal text-[#7b6b8d]">{d.setAside.length + d.duplicates.length}</span></summary>
            <p className="mt-2 text-sm text-[#5b5f73] dark:text-[#b8a898]">Money moving between your own accounts, payouts from Stripe (already counted in your sales), and anything that matches a line you already have. They are not added unless you move them back.</p>
            <ul className="mt-3 divide-y divide-[#1a2b4a]/10 dark:divide-white/10">
              {[...d.setAside.map((t) => ({ t, why: "Looks like a transfer or payout" })), ...d.duplicates.map((t) => ({ t, why: "Looks like one you already entered" }))].map(({ t, why }) => (
                <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                  <span className="text-[#1a2b4a] dark:text-[#F8F5F0]"><span className={t.amount_cents < 0 ? "font-semibold text-[#8a2f2f]" : "font-semibold text-[#2E7C83]"}>{usd(t.amount_cents)}</span> · {day(t.transacted_on)} · {t.description}<span className="ml-2 text-xs text-[#7b6b8d]">{why}</span></span>
                  <button type="button" onClick={() => act("restore", [t])} className="inline-flex items-center gap-1 text-xs font-semibold text-[#2E7C83] hover:underline"><Undo2 className="h-3 w-3" />Move back to review</button>
                </li>
              ))}
            </ul>
          </details>
        </section>
      )}
      {!d && !err && <p className="flex items-center gap-2 text-sm text-[#7b6b8d]"><Loader2 className="h-4 w-4 animate-spin" />Loading…</p>}
    </div>
  );
}
