"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Loader2, Plus, RefreshCw, X } from "lucide-react";
import { marginOf, money, perClientCents, vendorLabel, type Entry, type MonthRow } from "@/lib/platformCosts";

interface Data {
  entries: Entry[];
  months: MonthRow[];
  clients: { count: number; auto: number; override: number | null; names: string[] };
  prices: { id: string; name: string; monthlyCents: number }[];
  stripeFees: Record<string, number>;
  vendors: { key: string; label: string; category: string; hint: string | null }[];
}

const TARGET_MARGIN = 0.85;
const monthName = (m: string) => new Date(`${m}T12:00:00`).toLocaleDateString("en-US", { month: "long", year: "numeric" });
const thisMonth = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Denver" }).slice(0, 7);

export default function PlatformCosts() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string>("");
  const [note, setNote] = useState("");
  const [form, setForm] = useState({ vendor: "supabase", label: "", amount: "", month: thisMonth(), counts: true });
  const [override, setOverride] = useState("");

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/platform-costs", { cache: "no-store" });
      if (!r.ok) throw new Error(r.status === 404 ? "This page is for the Alignment Architect." : "Couldn't load the numbers.");
      const d = (await r.json()) as Data;
      setData(d);
      setOverride(d.clients.override === null ? "" : String(d.clients.override));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load.");
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const post = async (body: Record<string, unknown>, tag: string) => {
    setBusy(tag);
    setNote("");
    try {
      const r = await fetch("/api/platform-costs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "That didn't save.");
      return j as Record<string, unknown>;
    } catch (e) {
      setNote(e instanceof Error ? e.message : "That didn't save.");
      return null;
    } finally {
      setBusy("");
    }
  };

  const scan = async () => {
    const j = await post({ action: "scan" }, "scan");
    if (j) setNote(`Looked at ${j.scanned} receipt emails: ${j.added} new waiting for you, ${j.skipped} already known or unreadable.`);
    await load();
  };

  const cur = useMemo(() => {
    if (!data) return null;
    const m = thisMonth() + "-01";
    const row = data.months.find((x) => x.month === m) ?? data.months.find((x) => x.platformCents > 0) ?? null;
    return row;
  }, [data]);

  if (error) return <div className="mx-auto max-w-3xl p-6 text-sm text-[#8a3f14]">{error}</div>;
  if (!data) return <div className="p-6 text-sm text-[#7a8a99]">Loading the numbers…</div>;

  const clients = data.clients.count;
  const per = cur ? perClientCents(cur.platformCents, clients) : null;
  const starter = data.prices.find((p) => p.id === "starter") ?? data.prices[0];
  const margin = starter && per !== null ? marginOf(starter.monthlyCents, per) : null;
  const proposed = data.entries.filter((e) => e.status === "proposed");
  const confirmed = data.entries.filter((e) => e.status === "confirmed");
  const feeThis = cur ? data.stripeFees[cur.month] ?? null : null;

  const card = "rounded-2xl border border-[#e5dccb] bg-white p-4 shadow-[0_4px_14px_rgba(26,43,74,0.08)] dark:border-[#2a3a5a] dark:bg-[#10203a]";
  const lab = "text-[11px] font-semibold uppercase tracking-wide text-[#7a8a99]";
  const inp = "rounded-lg border border-[#d9cfbd] bg-white px-2 py-1.5 text-sm text-[#1a2b4a] dark:border-[#2a3a5a] dark:bg-[#0b1730] dark:text-[#F8F5F0]";

  return (
    <div className="w-full space-y-5 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Platform Costs</h1>
          <p className="mt-1 max-w-2xl text-sm text-[#5b6b7b] dark:text-[#b8c4d0]">
            What it really costs to run the Command Suite, month by month and per client. Client numbers and plan prices are live. Vendor bills are
            read from receipt emails in your inbox on the 2nd of each month and wait here for you to confirm.
          </p>
        </div>
        <button
          onClick={scan}
          disabled={busy === "scan"}
          className="inline-flex items-center gap-2 rounded-full bg-[#1a2b4a] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 dark:bg-[#c9a227] dark:text-[#10203a]"
        >
          {busy === "scan" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Scan my inbox now
        </button>
      </div>
      {note && <p className="rounded-lg bg-[#c9a227]/15 px-3 py-2 text-sm text-[#7a5a12] dark:text-[#e8c766]">{note}</p>}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className={card}>
          <div className={lab}>{cur ? monthName(cur.month) : "This month"} platform cost</div>
          <div className="mt-1 text-2xl font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{cur ? money(cur.platformCents) : "No bills confirmed"}</div>
          <div className="mt-1 text-xs text-[#7a8a99]">Confirmed bills that count toward the platform</div>
        </div>
        <div className={card}>
          <div className={lab}>Active clients</div>
          <div className="mt-1 text-2xl font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{clients}</div>
          <div className="mt-1 text-xs text-[#7a8a99]">
            {data.clients.override !== null ? `Set by you (auto count is ${data.clients.auto})` : "Counted from accounts; excludes house, demo, test and team"}
          </div>
        </div>
        <div className={card}>
          <div className={lab}>Cost per client</div>
          <div className="mt-1 text-2xl font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{per === null ? "n/a" : money(per)}</div>
          <div className="mt-1 text-xs text-[#7a8a99]">Your working estimate was $20.00</div>
        </div>
        <div className={card}>
          <div className={lab}>Margin on {starter ? starter.name : "Starter"} ({starter ? money(starter.monthlyCents) : "n/a"}/mo)</div>
          <div className={`mt-1 text-2xl font-semibold ${margin !== null && margin < TARGET_MARGIN ? "text-[#b3261e]" : "text-[#1a2b4a] dark:text-[#F8F5F0]"}`}>
            {margin === null ? "n/a" : `${(margin * 100).toFixed(1)}%`}
          </div>
          <div className="mt-1 text-xs text-[#7a8a99]">Target is 85% or better. Card fees not included.</div>
        </div>
      </div>

      {proposed.length > 0 && (
        <section className={card}>
          <h2 className="text-base font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Waiting for you ({proposed.length})</h2>
          <p className="mt-1 text-xs text-[#7a8a99]">Found in your inbox. Fix the amount if it read wrong, decide whether it counts, then confirm.</p>
          <div className="mt-3 divide-y divide-[#eee6d6] dark:divide-[#22324f]">
            {proposed.map((e) => (
              <ProposedRow key={e.id} e={e} busy={busy} onSave={(patch, tag) => post({ action: "confirm", id: e.id, ...patch }, tag).then(load)} onReject={() => post({ action: "reject", id: e.id }, e.id).then(load)} hint={data.vendors.find((v) => v.key === e.vendor)?.hint ?? null} />
            ))}
          </div>
        </section>
      )}

      <section className={card}>
        <h2 className="text-base font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">By month</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-[#7a8a99]">
              <tr>
                <th className="py-2 pr-3">Month</th>
                <th className="py-2 pr-3">Platform cost</th>
                <th className="py-2 pr-3">Per client*</th>
                <th className="py-2 pr-3">Card fees (Stripe)</th>
                <th className="py-2">What it was</th>
              </tr>
            </thead>
            <tbody>
              {data.months.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 text-[#7a8a99]">Nothing confirmed yet. Press “Scan my inbox now” or add a bill below.</td>
                </tr>
              )}
              {data.months.map((m) => (
                <tr key={m.month} className="border-t border-[#eee6d6] align-top dark:border-[#22324f]">
                  <td className="py-2 pr-3 font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">{monthName(m.month)}</td>
                  <td className="py-2 pr-3">{money(m.platformCents)}{m.proposedCount > 0 && <span className="ml-1 text-xs text-[#8a3f14]">+{m.proposedCount} to confirm</span>}</td>
                  <td className="py-2 pr-3">{clients > 0 ? money(Math.round(m.platformCents / clients)) : "n/a"}</td>
                  <td className="py-2 pr-3">{data.stripeFees[m.month] !== undefined ? money(data.stripeFees[m.month]) : "n/a"}</td>
                  <td className="py-2 text-xs text-[#5b6b7b] dark:text-[#b8c4d0]">{m.byVendor.map((v) => `${vendorLabel(v.vendor)} ${money(v.cents)}`).join(" · ") || "n/a"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-[#7a8a99]">*Uses today&apos;s client count for every month; change the count below if you want a past month judged differently.{feeThis !== null && ` Card fees this month: ${money(feeThis)}.`}</p>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className={card}>
          <h2 className="text-base font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Add a bill by hand</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <label className="text-xs text-[#7a8a99]">Vendor
              <select className={`${inp} mt-1 w-full`} value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })}>
                {data.vendors.map((v) => <option key={v.key} value={v.key}>{v.label}</option>)}
                <option value="other">Other</option>
              </select>
            </label>
            <label className="text-xs text-[#7a8a99]">Label (optional)
              <input className={`${inp} mt-1 w-full`} value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Main org, test branches…" />
            </label>
            <label className="text-xs text-[#7a8a99]">Amount ($)
              <input className={`${inp} mt-1 w-full`} inputMode="decimal" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="35.00" />
            </label>
            <label className="text-xs text-[#7a8a99]">Month
              <input type="month" className={`${inp} mt-1 w-full`} value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} />
            </label>
          </div>
          <label className="mt-2 flex items-center gap-2 text-xs text-[#5b6b7b] dark:text-[#b8c4d0]">
            <input type="checkbox" checked={form.counts} onChange={(e) => setForm({ ...form, counts: e.target.checked })} /> Counts toward the platform cost
          </label>
          <button
            disabled={busy === "add"}
            onClick={async () => {
              const cents = Math.round(parseFloat(form.amount.replace(/[$,\s]/g, "")) * 100);
              if (!Number.isFinite(cents) || cents === 0) return setNote("Enter an amount, like 35.00.");
              const j = await post({ action: "add", vendor: form.vendor, label: form.label, amountCents: cents, month: form.month, counts: form.counts }, "add");
              if (j) {
                setForm({ ...form, amount: "", label: "" });
                await load();
              }
            }}
            className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#1a2b4a] px-4 py-1.5 text-sm font-semibold text-[#1a2b4a] disabled:opacity-60 dark:border-[#c9a227] dark:text-[#e8c766]"
          >
            <Plus className="h-4 w-4" /> Add bill
          </button>
        </section>

        <section className={card}>
          <h2 className="text-base font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Who counts as a client</h2>
          <p className="mt-1 text-xs text-[#7a8a99]">
            Auto count: {data.clients.auto}. House, demo, Eloise test accounts and the team (Sumbal, Marcello) are left out.
            {data.clients.names.length > 0 && ` Counted: ${data.clients.names.join(", ")}.`}
          </p>
          <div className="mt-3 flex items-end gap-2">
            <label className="text-xs text-[#7a8a99]">Use this number instead (blank = auto)
              <input className={`${inp} mt-1 block w-32`} inputMode="numeric" value={override} onChange={(e) => setOverride(e.target.value.replace(/[^0-9]/g, ""))} />
            </label>
            <button
              onClick={async () => {
                if (await post({ action: "setting", key: "client_count_override", value: override }, "ov")) await load();
              }}
              className="rounded-full border border-[#1a2b4a] px-4 py-1.5 text-sm font-semibold text-[#1a2b4a] dark:border-[#c9a227] dark:text-[#e8c766]"
            >
              Save
            </button>
          </div>
          <p className="mt-4 text-xs text-[#7a8a99]">
            <strong>AI is not measured per client.</strong> Each client&apos;s AI runs on their own key and the Suite does not count tokens, so only the AI bills
            you pay yourself (your key, Collective Plus, Fledge) appear above.
          </p>
        </section>
      </div>

      {confirmed.length > 0 && (
        <section className={card}>
          <h2 className="text-base font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Every confirmed bill ({confirmed.length})</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <tbody>
                {confirmed.map((e) => (
                  <tr key={e.id} className="border-t border-[#eee6d6] dark:border-[#22324f]">
                    <td className="py-1.5 pr-3 text-[#5b6b7b] dark:text-[#b8c4d0]">{monthName(e.month)}</td>
                    <td className="py-1.5 pr-3 font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">{vendorLabel(e.vendor)}{e.label ? ` · ${e.label}` : ""}</td>
                    <td className="py-1.5 pr-3">{money(e.amountCents)}</td>
                    <td className="py-1.5 pr-3 text-xs text-[#7a8a99]">{e.counts ? "counts" : "not counted"} · {e.source === "receipt" ? "from receipt" : "typed in"}</td>
                    <td className="py-1.5 text-right">
                      <button onClick={() => post({ action: "reject", id: e.id }, e.id).then(load)} className="text-xs text-[#8a3f14] underline" aria-label="Remove this bill">Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

function ProposedRow({
  e,
  hint,
  busy,
  onSave,
  onReject,
}: {
  e: Entry;
  hint: string | null;
  busy: string;
  onSave: (patch: { amountCents: number; counts: boolean; label: string }, tag: string) => Promise<unknown>;
  onReject: () => Promise<unknown>;
}) {
  const [amount, setAmount] = useState((e.amountCents / 100).toFixed(2));
  const [counts, setCounts] = useState(e.counts);
  const [label, setLabel] = useState(e.label ?? "");
  const inp = "rounded-lg border border-[#d9cfbd] bg-white px-2 py-1.5 text-sm text-[#1a2b4a] dark:border-[#2a3a5a] dark:bg-[#0b1730] dark:text-[#F8F5F0]";
  return (
    <div className="flex flex-wrap items-end gap-3 py-3">
      <div className="min-w-[200px] flex-1">
        <div className="text-sm font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">{vendorLabel(e.vendor)} · {monthName(e.month)}</div>
        <div className="truncate text-xs text-[#7a8a99]" title={e.receiptSubject ?? ""}>{e.receiptSubject}</div>
        {hint && <div className="text-xs text-[#8a3f14]">{hint}</div>}
      </div>
      <label className="text-xs text-[#7a8a99]">Label
        <input className={`${inp} mt-1 block w-40`} value={label} onChange={(x) => setLabel(x.target.value)} placeholder="optional" />
      </label>
      <label className="text-xs text-[#7a8a99]">Amount ($)
        <input className={`${inp} mt-1 block w-28`} inputMode="decimal" value={amount} onChange={(x) => setAmount(x.target.value)} />
      </label>
      <label className="flex items-center gap-1 pb-2 text-xs text-[#5b6b7b] dark:text-[#b8c4d0]">
        <input type="checkbox" checked={counts} onChange={(x) => setCounts(x.target.checked)} /> Counts
      </label>
      <div className="flex gap-2 pb-0.5">
        <button
          disabled={busy === e.id}
          onClick={() => {
            const cents = Math.round(parseFloat(amount.replace(/[$,\s]/g, "")) * 100);
            if (Number.isFinite(cents) && cents !== 0) void onSave({ amountCents: cents, counts, label }, e.id);
          }}
          className="inline-flex items-center gap-1 rounded-full bg-[#2c6b3f] px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          <CheckCircle2 className="h-4 w-4" /> Confirm
        </button>
        <button onClick={() => void onReject()} className="inline-flex items-center gap-1 rounded-full border border-[#d9cfbd] px-3 py-1.5 text-sm text-[#5b6b7b] dark:border-[#2a3a5a] dark:text-[#b8c4d0]">
          <X className="h-4 w-4" /> Not a platform bill
        </button>
      </div>
    </div>
  );
}
