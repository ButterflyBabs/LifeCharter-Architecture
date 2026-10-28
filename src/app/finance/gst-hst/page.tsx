"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, Download, Landmark, AlertTriangle, CalendarClock } from "lucide-react";
import { formatMoney } from "@/lib/currency";
import { useHomeCurrency } from "@/components/money/useHomeCurrency";
import { MoneyInput } from "@/components/finance/MoneyInput";
import { PROVINCES, OUTSIDE_LABEL, taxFor, isTaxPlace, type Period } from "@/lib/salesTax";
import { placeName } from "@/lib/finance/gstReport";

// Finance › Sales tax returns (task 1520 follow-up + provincial): the totals for a GST/HST return and for each
// provincial registration (Quebec QST, BC/Saskatchewan PST, Manitoba RST), in plain words, from the Canadian-dollar
// entries in the ledger. A guide for the owner and their accountant, not tax advice; nothing is filed for them.

type Prov = {
  province: "QC" | "BC" | "SK" | "MB";
  kind: string;
  title: string;
  rate: number;
  number: string;
  frequency: "monthly" | "quarterly" | "annual";
  period: Period;
  prev: Period | null;
  next: Period | null;
  isCurrent: boolean;
  claimable: boolean;
  taxableSales: number;
  collected: number;
  claimBack: number;
  net: number;
  refunded: number;
  usdLeftOut: number;
};

type Data =
  | { registered: false; provincial?: Prov[] }
  | {
      registered: true;
      provincial?: Prov[];
      businessNumber: string;
      province: string | null;
      frequency: "monthly" | "quarterly" | "annual";
      period: Period;
      prev: Period | null;
      next: Period | null;
      isCurrent: boolean;
      lines: { line101: number; line103: number; line106: number; line109: number };
      byProvince: Record<string, number>;
      usdLeftOut: { sales: number; tax: number; taxPaid: number };
      refunds: { sales: number; tax: number };
      check: { id: string; date: string; description: string; amount: number }[];
      counts: { sales: number; expenses: number; refunds: number };
    };

const FREQ_WORD = { monthly: "every month", quarterly: "every three months", annual: "once a year" } as const;

const longDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-CA", { month: "long", day: "numeric", year: "numeric" });
};

// The period asked for in the link (a reminder links to its own period): ?start= for GST/HST, ?qc= ?bc= ?sk= ?mb=.
function fromUrl(key: string): string | null {
  if (typeof window === "undefined") return null;
  const v = new URLSearchParams(window.location.search).get(key);
  return v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
}

export default function GstHstReport() {
  const [start, setStart] = useState<string | null>(() => fromUrl("start"));
  const [provStarts, setProvStarts] = useState<Record<string, string | null>>(() => ({ qc: fromUrl("qc"), bc: fromUrl("bc"), sk: fromUrl("sk"), mb: fromUrl("mb") }));
  const [d, setD] = useState<Data | null>(null);
  const [err, setErr] = useState("");
  const { currency: home } = useHomeCurrency();
  const cad = (n: number) => formatMoney(n, "cad", { home, cents: true });
  const usd = (n: number) => formatMoney(n, "usd", { home, cents: true });

  const query = (s: string | null, ps: Record<string, string | null>) => {
    const q = new URLSearchParams();
    if (s) q.set("start", s);
    for (const [k, v] of Object.entries(ps)) if (v) q.set(k, v);
    const t = q.toString();
    return t ? `?${t}` : "";
  };
  const load = useCallback(async (s: string | null, ps: Record<string, string | null>) => {
    setErr("");
    const r = await fetch(`/api/finance/gst-hst${query(s, ps)}`, { cache: "no-store" }).catch(() => null);
    const x = r ? await r.json().catch(() => null) : null;
    if (!r?.ok || !x) return setErr(x?.error || "Couldn't load the sales tax report. Please try again.");
    setD(x as Data);
  }, []);
  useEffect(() => {
    void load(start, provStarts);
  }, [start, provStarts, load]);
  const setProv = (code: string, v: string | null) => setProvStarts((p) => ({ ...p, [code.toLowerCase()]: v }));

  const header = (
    <>
      <Link href="/finance/tax" className="mb-3 inline-flex items-center gap-1 text-sm text-[#2E7C83] hover:underline">
        <ArrowLeft className="h-4 w-4" /> Tax Preparation
      </Link>
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#2E7C83]/15">
          <Landmark className="h-6 w-6 text-[#2E7C83]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">Sales tax returns</h1>
          <p className="text-sm text-[#7b6b8d]">The numbers for your sales tax returns, worked out from your income and expenses.</p>
        </div>
      </div>
    </>
  );

  if (err) return <div className="w-full px-4 py-6 sm:px-6">{header}<p className="text-sm text-red-600">{err}</p></div>;
  if (!d) return <div className="w-full px-4 py-6 sm:px-6">{header}<p className="text-sm text-[#7b6b8d]">Loading…</p></div>;

  const provs = d.provincial ?? [];
  const provBlock = provs.length > 0 && (
    <div className="mt-8 space-y-8">
      {provs.map((x) => (
        <ProvSectionView key={x.province} x={x} cad={cad} usd={usd} onPeriod={(v) => setProv(x.province, v)} />
      ))}
    </div>
  );

  if (!d.registered && provs.length > 0) {
    return (
      <div className="w-full px-4 py-6 sm:px-6">
        {header}
        {provBlock}
      </div>
    );
  }

  if (!d.registered) {
    return (
      <div className="w-full px-4 py-6 sm:px-6">
        {header}
        <div className="max-w-2xl rounded-xl border border-[#1a2b4a]/10 bg-white p-5 text-sm text-[#3F4654] dark:bg-[#1a2b4a]/40 dark:text-[#e8e4f0]">
          <p className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">GST/HST is not turned on for your account.</p>
          <p className="mt-2">
            A Canadian business registered for GST/HST charges it to customers and sends it to the Canada Revenue Agency. Once you turn it on, the Suite adds it to your
            invoices and payment links, keeps it apart from your income, and works out your return here.
          </p>
          <p className="mt-2">
            Most businesses must register once their sales pass $30,000 in four quarters in a row (or in one quarter). The Suite lets you know when you get close.
          </p>
          <Link href="/settings?tab=integrations" className="mt-4 inline-flex h-10 items-center rounded-lg bg-[#1a2b4a] px-4 font-semibold text-white hover:opacity-90">
            Turn on GST/HST in Settings
          </Link>
        </div>
      </div>
    );
  }

  const L = d.lines;
  const provinces = Object.entries(d.byProvince).sort((a, b) => b[1] - a[1]);
  const owing = L.line109 >= 0;
  const hasUsd = d.usdLeftOut.sales > 0 || d.usdLeftOut.tax > 0 || d.usdLeftOut.taxPaid > 0;
  const tile = "rounded-xl border border-[#1a2b4a]/10 bg-white p-4 dark:bg-[#1a2b4a]/40";

  return (
    <div className="w-full px-4 py-6 sm:px-6">
      {header}

      {provs.length > 0 && <h2 className="mb-3 text-lg font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">GST/HST</h2>}

      {/* Period picker + download */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => d.prev && setStart(d.prev.start)} disabled={!d.prev} aria-label="Previous period" className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#1a2b4a]/20 hover:bg-[#1a2b4a]/5 disabled:opacity-40">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="min-w-[12rem] text-center">
            <p className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{d.period.label}</p>
            <p className="text-xs text-[#7b6b8d]">{d.isCurrent ? "This period, so far" : `${longDate(d.period.start)} to ${longDate(d.period.end)}`}</p>
          </div>
          <button onClick={() => d.next && setStart(d.next.start)} disabled={!d.next} aria-label="Next period" className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#1a2b4a]/20 hover:bg-[#1a2b4a]/5 disabled:opacity-40">
            <ChevronRight className="h-4 w-4" />
          </button>
          {!d.isCurrent && (
            <button onClick={() => setStart(null)} className="ml-1 text-sm text-[#2E7C83] hover:underline">
              Back to this period
            </button>
          )}
        </div>
        <a href={`/api/finance/gst-hst?start=${d.period.start}&format=csv`} className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-[#1a2b4a]/20 px-3 text-sm font-medium hover:bg-[#1a2b4a]/5">
          <Download className="h-4 w-4" />
          Download for my accountant (CSV)
        </a>
      </div>

      {/* The four lines */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className={tile}>
          <p className="text-sm text-[#7b6b8d]">Sales before tax</p>
          <p className="text-2xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">{cad(L.line101)}</p>
          <p className="text-[11px] text-[#b8a898]">CRA line 101</p>
        </div>
        <div className={tile}>
          <p className="text-sm text-[#7b6b8d]">GST/HST you collected</p>
          <p className="text-2xl font-bold text-[#2E7C83]">{cad(L.line103)}</p>
          <p className="text-[11px] text-[#b8a898]">CRA line 103</p>
        </div>
        <div className={tile}>
          <p className="text-sm text-[#7b6b8d]">GST/HST you paid that you can claim back</p>
          <p className="text-2xl font-bold text-[#7b6b8d]">{cad(L.line106)}</p>
          <p className="text-[11px] text-[#b8a898]">CRA line 106 (input tax credits)</p>
        </div>
        <div className={tile} style={{ borderColor: owing ? "#b06a5a55" : "#2c6b3f55" }}>
          <p className="text-sm text-[#7b6b8d]">{owing ? "Net tax to pay" : "Net tax to get back (a refund)"}</p>
          <p className="text-2xl font-bold" style={{ color: owing ? "#b06a5a" : "#2c6b3f" }}>{cad(Math.abs(L.line109))}</p>
          <p className="text-[11px] text-[#b8a898]">CRA line 109 (collected minus claimed back)</p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* Due dates */}
        <div className={tile}>
          <p className="mb-2 flex items-center gap-2 font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">
            <CalendarClock className="h-4 w-4 text-[#2E7C83]" /> When it&apos;s due
          </p>
          <p className="text-sm text-[#3F4654] dark:text-[#e8e4f0]">File by <strong>{longDate(d.period.fileBy)}</strong></p>
          <p className="text-sm text-[#3F4654] dark:text-[#e8e4f0]">Pay by <strong>{longDate(d.period.payBy)}</strong></p>
          <p className="mt-2 text-xs text-[#7b6b8d]">
            You file {FREQ_WORD[d.frequency]}{d.businessNumber ? ` under ${d.businessNumber}` : ""}.
            {d.frequency === "annual" ? " These dates assume a December 31 year end and a sole proprietor; a corporation's return is due three months after year end." : ""} Change this in{" "}
            <Link href="/settings?tab=integrations" className="text-[#2E7C83] hover:underline">Settings</Link>.
          </p>
        </div>

        {/* Per province */}
        <div className={tile}>
          <p className="mb-2 font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Tax you collected, by where the customer is</p>
          {provinces.length === 0 ? (
            <p className="text-sm text-[#7b6b8d]">No GST/HST collected in this period.</p>
          ) : (
            <div className="space-y-1.5">
              {provinces.map(([p, n]) => (
                <div key={p} className="flex items-center justify-between text-sm">
                  <span className="text-[#3F4654] dark:text-[#e8e4f0]">{placeName(p)}{isTaxPlace(p) && p !== "OUTSIDE" ? ` (${taxFor(p).kind} ${taxFor(p).rate}%)` : ""}</span>
                  <span className="tabular-nums font-medium text-[#2E7C83]">{cad(n)}</span>
                </div>
              ))}
            </div>
          )}
          {d.refunds.tax > 0 && (
            <p className="mt-2 text-xs text-[#7b6b8d]">
              Includes {cad(d.refunds.tax)} of GST/HST you gave back on {cad(d.refunds.sales)} of refunds, already taken off sales and tax collected.
            </p>
          )}
        </div>
      </div>

      {hasUsd && (
        <div className="mt-4 flex gap-2 rounded-xl border border-[#c9a227]/40 bg-[#c9a227]/10 p-4 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#c9a227]" />
          <div>
            <p className="font-semibold">US-dollar money is left out</p>
            <p className="mt-1">
              {[
                d.usdLeftOut.sales > 0 && `${usd(d.usdLeftOut.sales)} of sales`,
                d.usdLeftOut.tax > 0 && `${usd(d.usdLeftOut.tax)} of GST/HST collected`,
                d.usdLeftOut.taxPaid > 0 && `${usd(d.usdLeftOut.taxPaid)} of GST/HST paid`,
              ]
                .filter(Boolean)
                .join(", ")}{" "}
              are not in the totals above: the CRA needs Canadian dollars, and your accountant converts these. They are in the download.
            </p>
          </div>
        </div>
      )}

      <CheckList items={d.check} cad={cad} onSaved={() => load(start, provStarts)} />

      <p className="mt-6 max-w-3xl text-xs text-[#7b6b8d]">
        This is a guide worked out from what you recorded, not tax advice. Only Canadian-dollar entries are counted, the amount on each entry is before tax, and nothing is
        filed with the CRA for you. Adjustments (lines 104 and 107), instalments and anything unusual are for your accountant.
      </p>

      {provBlock}
    </div>
  );
}

// One provincial registration (QST, PST or RST): its own period, totals, due dates and download.
function ProvSectionView({ x, cad, usd, onPeriod }: { x: Prov; cad: (n: number) => string; usd: (n: number) => string; onPeriod: (start: string | null) => void }) {
  const tile = "rounded-xl border border-[#1a2b4a]/10 bg-white p-4 dark:bg-[#1a2b4a]/40";
  const owing = x.net >= 0;
  const agency = x.province === "QC" ? "Revenu Québec" : x.province === "BC" ? "the BC government" : x.province === "SK" ? "the Saskatchewan government" : "the Manitoba government";
  return (
    <section id={x.province.toLowerCase()} className="scroll-mt-6 border-t border-[#1a2b4a]/10 pt-6">
      <h2 className="mb-3 text-lg font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{x.title}</h2>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => x.prev && onPeriod(x.prev.start)} disabled={!x.prev} aria-label="Previous period" className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#1a2b4a]/20 hover:bg-[#1a2b4a]/5 disabled:opacity-40">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="min-w-[12rem] text-center">
            <p className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{x.period.label}</p>
            <p className="text-xs text-[#7b6b8d]">{x.isCurrent ? "This period, so far" : `${longDate(x.period.start)} to ${longDate(x.period.end)}`}</p>
          </div>
          <button onClick={() => x.next && onPeriod(x.next.start)} disabled={!x.next} aria-label="Next period" className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#1a2b4a]/20 hover:bg-[#1a2b4a]/5 disabled:opacity-40">
            <ChevronRight className="h-4 w-4" />
          </button>
          {!x.isCurrent && (
            <button onClick={() => onPeriod(null)} className="ml-1 text-sm text-[#2E7C83] hover:underline">
              Back to this period
            </button>
          )}
        </div>
        <a
          href={`/api/finance/gst-hst?${x.province.toLowerCase()}=${x.period.start}&tax=${x.province}&format=csv`}
          className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-[#1a2b4a]/20 px-3 text-sm font-medium hover:bg-[#1a2b4a]/5"
        >
          <Download className="h-4 w-4" />
          Download {x.kind} for my accountant (CSV)
        </a>
      </div>

      <div className={`grid gap-3 sm:grid-cols-2 ${x.claimable ? "xl:grid-cols-4" : "xl:grid-cols-3"}`}>
        <div className={tile}>
          <p className="text-sm text-[#7b6b8d]">Sales you charged {x.kind} on (before tax)</p>
          <p className="text-2xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">{cad(x.taxableSales)}</p>
        </div>
        <div className={tile}>
          <p className="text-sm text-[#7b6b8d]">{x.kind} you collected</p>
          <p className="text-2xl font-bold text-[#2E7C83]">{cad(x.collected)}</p>
          {x.refunded > 0 && <p className="text-[11px] text-[#b8a898]">After {cad(x.refunded)} given back on refunds</p>}
        </div>
        {x.claimable && (
          <div className={tile}>
            <p className="text-sm text-[#7b6b8d]">QST you paid that you can claim back</p>
            <p className="text-2xl font-bold text-[#7b6b8d]">{cad(x.claimBack)}</p>
            <p className="text-[11px] text-[#b8a898]">Input tax refunds</p>
          </div>
        )}
        <div className={tile} style={{ borderColor: owing ? "#b06a5a55" : "#2c6b3f55" }}>
          <p className="text-sm text-[#7b6b8d]">{owing ? `${x.claimable ? "Net QST" : x.kind} to pay` : "Net tax to get back (a refund)"}</p>
          <p className="text-2xl font-bold" style={{ color: owing ? "#b06a5a" : "#2c6b3f" }}>{cad(Math.abs(x.net))}</p>
          {x.claimable && <p className="text-[11px] text-[#b8a898]">Collected minus claimed back</p>}
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className={tile}>
          <p className="mb-2 flex items-center gap-2 font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">
            <CalendarClock className="h-4 w-4 text-[#2E7C83]" /> When it&apos;s due
          </p>
          <p className="text-sm text-[#3F4654] dark:text-[#e8e4f0]">File by <strong>{longDate(x.period.fileBy)}</strong></p>
          <p className="text-sm text-[#3F4654] dark:text-[#e8e4f0]">Pay by <strong>{longDate(x.period.payBy)}</strong></p>
          <p className="mt-2 text-xs text-[#7b6b8d]">
            You file {FREQ_WORD[x.frequency]}{x.number ? ` under ${x.number}` : ""}. These are the GST/HST dates; {agency}&apos;s own due dates can differ, so confirm them with your
            accountant. Change this in{" "}
            <Link href="/settings?tab=integrations" className="text-[#2E7C83] hover:underline">Settings</Link>.
          </p>
        </div>
        {x.usdLeftOut !== 0 && (
          <div className="flex gap-2 rounded-xl border border-[#c9a227]/40 bg-[#c9a227]/10 p-4 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#c9a227]" />
            <div>
              <p className="font-semibold">US-dollar money is left out</p>
              <p className="mt-1">
                {usd(Math.abs(x.usdLeftOut))} of {x.kind} {x.usdLeftOut < 0 ? "given back on US-dollar refunds" : "collected in US dollars"} is not in the totals above: the return needs
                Canadian dollars, and your accountant converts it. It is in the download.
              </p>
            </div>
          </div>
        )}
      </div>
      <p className="mt-4 max-w-3xl text-xs text-[#7b6b8d]">
        A guide worked out from what you recorded, not tax advice. Only Canadian-dollar entries are counted{x.claimable ? "" : `, and ${x.kind} you paid on purchases is part of their cost, so there is nothing to claim back`}.
      </p>
    </section>
  );
}

// Canadian-dollar sales with no GST/HST recorded: each can be fixed right here.
function CheckList({ items, cad, onSaved }: { items: { id: string; date: string; description: string; amount: number }[]; cad: (n: number) => string; onSaved: () => void }) {
  const [open, setOpen] = useState<string | null>(null);
  const [tax, setTax] = useState("");
  const [place, setPlace] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  if (!items.length) return null;

  async function save(id: string) {
    setBusy(true);
    setMsg("");
    const r = await fetch(`/api/finance/entries/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taxAmount: Number(tax) || 0, taxProvince: place || null }),
    }).catch(() => null);
    setBusy(false);
    if (!r?.ok) return setMsg("That didn't save. Please try again.");
    setOpen(null);
    onSaved();
  }

  return (
    <div className="mt-4 rounded-xl border border-[#1a2b4a]/10 bg-white p-4 dark:bg-[#1a2b4a]/40">
      <p className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{items.length === 1 ? "Check this sale" : `Check these ${items.length} sales`}</p>
      <p className="mt-1 text-sm text-[#7b6b8d]">
        These Canadian-dollar sales have no GST/HST recorded. That is right for a zero-rated sale or a customer outside Canada (choose Outside Canada and it leaves this list); otherwise add the tax you charged. They are counted in sales (line 101) either way.
      </p>
      <div className="mt-3 divide-y divide-[#1a2b4a]/8">
        {items.map((x) => (
          <div key={x.id} className="py-2">
            <div className="flex items-center justify-between gap-3 text-sm">
              <div className="min-w-0">
                <p className="truncate text-[#1a2b4a] dark:text-[#F8F5F0]">{x.description}</p>
                <p className="text-xs text-[#b8a898]">{x.date}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="tabular-nums font-medium text-[#2E7C83]">{cad(x.amount)}</span>
                <button
                  onClick={() => {
                    setOpen(open === x.id ? null : x.id);
                    setTax("");
                    setPlace("");
                    setMsg("");
                  }}
                  className="text-xs font-medium text-[#2E7C83] hover:underline"
                >
                  {open === x.id ? "Close" : "Add GST/HST"}
                </button>
              </div>
            </div>
            {open === x.id && (
              <div className="mt-2 flex flex-wrap items-end gap-2">
                <label className="text-xs text-[#7b6b8d]">
                  Where the customer is
                  <select
                    value={place}
                    onChange={(e) => {
                      const p = e.target.value;
                      setPlace(p);
                      if (p === "OUTSIDE") setTax("0");
                      else if (p && isTaxPlace(p)) setTax(String(Math.round(x.amount * taxFor(p).rate) / 100));
                    }}
                    className="mt-1 block h-10 rounded-lg border border-[#1a2b4a]/20 bg-white px-2 text-sm text-[#1a2b4a] dark:bg-[#1a2b4a]/20 dark:text-[#F8F5F0]"
                  >
                    <option value="">Choose…</option>
                    {PROVINCES.map((p) => (
                      <option key={p.code} value={p.code}>{p.name} ({p.kind} {p.rate}%)</option>
                    ))}
                    <option value="OUTSIDE">{OUTSIDE_LABEL} (no GST/HST)</option>
                  </select>
                </label>
                <label className="text-xs text-[#7b6b8d]">
                  GST/HST charged
                  <MoneyInput className="mt-1 w-36" value={tax} onChange={setTax} placeholder="0.00" aria-label="GST/HST charged" currency="cad" home="cad" />
                </label>
                <button onClick={() => save(x.id)} disabled={busy} className="h-10 rounded-lg bg-[#1a2b4a] px-4 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60">
                  {busy ? "Saving…" : "Save"}
                </button>
                {msg && <p className="w-full text-xs text-red-600">{msg}</p>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
