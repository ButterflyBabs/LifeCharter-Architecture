"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Check, Copy, CreditCard, ExternalLink, Loader2, Receipt, X } from "lucide-react";
import ContactLookupInput, { lookupName, type LookupContact } from "@/components/crm/ContactLookupInput";
import { formatMoney, otherCurrency, sumByCurrency, toCurrency, type Currency } from "@/lib/currency";
import { useHomeCurrency } from "@/components/money/useHomeCurrency";
import { CurrencySelect, OtherCurrencyNote } from "@/components/money/CurrencySelect";
import { OUTSIDE_LABEL, PROVINCES, isTaxPlace, type TaxPlace } from "@/lib/salesTax";

type Payment = { id: string; livemode: boolean; kind: string; amount: number; currency: string | null; refunded: number; email: string | null; name: string | null; contact_id: string | null; description: string; paid_at: string; tax_amount?: number | null; tax_province?: string | null };
type Invoice = { id: string; contact_id: string | null; livemode: boolean; number: string | null; email: string; name: string | null; description: string; amount: number; currency: string | null; payment_count: number; payments_made: number; status: string; hosted_url: string | null; pdf_url: string | null; due_date: string | null; paid_at: string | null; created_at: string; tax_amount?: number | null; tax_province?: string | null };
type Data = { connected: boolean; salesTax?: boolean; livemode: boolean | null; payments: Payment[]; invoices: Invoice[]; offers: { id: string; name: string; price: number | null; currency: string | null }[]; contact: { id: string; email: string; first_name: string | null; last_name: string | null } | null };

const label = "block text-[11px] font-semibold uppercase tracking-wide text-[#7b6b8d] dark:text-[#b8a898] mb-1";
const input = "w-full rounded-lg border border-[#1a2b4a]/20 bg-white px-3 py-2 text-sm text-[#1a2b4a] dark:bg-[#1a2b4a]/30 dark:text-[#F8F5F0] dark:border-white/15";
const card = "rounded-2xl border border-[#1a2b4a]/10 bg-white p-5 shadow-[0_8px_24px_rgba(26,43,74,0.08)] dark:border-white/10 dark:bg-[#1a2b4a]/40";
/** An amount in its own currency, always with cents ("$1,500.00"; "CA$1,500.00" on a USD account). */
const money = (n: number, currency: string | null | undefined, home: Currency) => formatMoney(Number(n), toCurrency(currency, home), { home, cents: true });
const day = (s: string) => new Date(s.length === 10 ? `${s}T12:00:00` : s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const KIND: Record<string, string> = { link: "Payment link", invoice: "Invoice", plan: "Payment plan", subscription: "Monthly" };
/** "HST, Ontario" / "outside Canada" for a stored tax place. */
const placeName = (p: string | null | undefined) => (p === "OUTSIDE" ? "outside Canada" : PROVINCES.find((x) => x.code === p)?.name ?? "");
const STATUS: Record<string, string> = { open: "Unpaid", paid: "Paid", void: "Voided", uncollectible: "Uncollectible", plan_active: "Plan running", plan_done: "Plan complete", plan_cancelled: "Plan stopped" };

function Test() {
  return <span className="ml-1 rounded bg-[#c9a227]/20 px-1.5 text-[10px] font-semibold text-[#8a6a15]">TEST</span>;
}

export default function Payments({ contactId }: { contactId: string | null }) {
  const [d, setD] = useState<Data | null>(null);
  const [err, setErr] = useState("");
  const { currency: home } = useHomeCurrency();
  const other = otherCurrency(home);
  const load = useCallback(() => {
    fetch("/api/payments", { cache: "no-store" })
      .then(async (r) => (r.ok ? setD(await r.json()) : setErr("Couldn't load payments.")))
      .catch(() => setErr("Couldn't load payments."));
  }, []);
  useEffect(load, [load]);

  const thisMonth = new Date().toISOString().slice(0, 7);
  const live = (d?.payments ?? []).filter((p) => p.livemode === (d?.livemode ?? true));
  // Totals are kept per currency (task 1520): the home currency is the big number, the other one a small line under it.
  const monthTotals = sumByCurrency(live.filter((p) => p.paid_at.slice(0, 7) === thisMonth), (p) => Number(p.amount) - Number(p.refunded), (p) => p.currency ?? home);
  const unpaid = (d?.invoices ?? []).filter((i) => i.status === "open");
  const unpaidTotals = sumByCurrency(unpaid, (i) => Number(i.amount), (i) => i.currency ?? home);
  const otherNote = (t: Partial<Record<Currency, number>>) => (t[other] ? money(t[other] as number, other, home) : null);
  const plans = (d?.invoices ?? []).filter((i) => i.status === "plan_active");

  return (
    <div className="w-full space-y-6 px-4 py-8 sm:px-6">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c9a227]">Finance</p>
        <h1 className="mt-2 text-3xl font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Payments &amp; Invoices</h1>
        <p className="mt-2 max-w-3xl text-[15px] text-[#5b5f73] dark:text-[#b8a898]">
          Every payment goes straight to your own Stripe account. Each one is added here, to the person&apos;s contact record and timeline, to your{" "}
          <Link href="/finance" className="text-[#2E7C83] underline">Finance Center</Link>, and their open deal is marked Won. Payment links for your offers live on{" "}
          <Link href="/sales/offers" className="text-[#2E7C83] underline">Offers &amp; Packages</Link>.
        </p>
      </header>

      {err && <p className="text-sm text-[#8a2f2f]">{err}</p>}
      {d && !d.connected && (
        <div className={card}>
          <p className="flex items-center gap-2 font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]"><CreditCard className="h-4 w-4 text-[#635bff]" />Connect your Stripe account to send invoices</p>
          <p className="mt-1 text-sm text-[#5b5f73] dark:text-[#b8a898]">One click on <Link href="/settings?tab=integrations" className="font-semibold text-[#2E7C83] hover:underline">Settings › Integrations › Connect with Stripe</Link>. Your money goes straight to you.</p>
        </div>
      )}

      {d && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className={card}><p className={label}>Paid this month</p><p className="text-2xl font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{money(monthTotals[home] ?? 0, home, home)}{d.livemode === false && <Test />}</p><OtherCurrencyNote text={otherNote(monthTotals)} /></div>
          <div className={card}><p className={label}>Unpaid invoices</p><p className="text-2xl font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{unpaid.length} · {money(unpaidTotals[home] ?? 0, home, home)}</p><OtherCurrencyNote text={otherNote(unpaidTotals)} /></div>
          <div className={card}><p className={label}>Payment plans running</p><p className="text-2xl font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{plans.length}</p></div>
        </div>
      )}

      {d?.connected && <NewInvoice data={d} contactId={contactId} onDone={load} home={home} />}

      {d && (
        <div className="grid gap-6 xl:grid-cols-2">
          <section className={card}>
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]"><Receipt className="h-4 w-4 text-[#2E7C83]" />Invoices</h2>
            {!d.invoices.length && <p className="text-sm text-[#7b6b8d]">No invoices yet.</p>}
            <ul className="divide-y divide-[#1a2b4a]/10 dark:divide-white/10">
              {d.invoices.map((i) => <InvoiceRow key={i.id} i={i} onChange={load} home={home} />)}
            </ul>
          </section>
          <section className={card}>
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]"><CreditCard className="h-4 w-4 text-[#635bff]" />Payments</h2>
            {!d.payments.length && <p className="text-sm text-[#7b6b8d]">No payments yet. They appear here the moment Stripe confirms them.</p>}
            <ul className="divide-y divide-[#1a2b4a]/10 dark:divide-white/10">
              {d.payments.map((p) => (
                <li key={p.id} className="flex flex-wrap items-baseline justify-between gap-2 py-2 text-sm">
                  <span className="text-[#1a2b4a] dark:text-[#F8F5F0]">
                    <span className="font-semibold">{money(p.amount, p.currency, home)}</span>
                    {p.contact_id ? <Link href={`/contacts?contact=${p.contact_id}`} className="ml-2 text-[#2E7C83] hover:underline">{p.name || p.email}</Link> : <span className="ml-2">{p.name || p.email || "Someone"}</span>}
                    {p.description && <span className="text-[#5b5f73] dark:text-[#b8a898]"> · {p.description}</span>}
                    {!p.livemode && <Test />}
                  </span>
                  <span className="text-xs text-[#7b6b8d]">{KIND[p.kind] || p.kind} · {day(p.paid_at)}{Number(p.tax_amount) > 0 ? ` · includes ${money(Number(p.tax_amount), p.currency, home)} GST/HST${p.tax_province ? ` (${placeName(p.tax_province)})` : ""}` : ""}{Number(p.refunded) > 0 ? ` · refunded ${money(p.refunded, p.currency, home)}` : ""}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
      {!d && !err && <p className="flex items-center gap-2 text-sm text-[#7b6b8d]"><Loader2 className="h-4 w-4 animate-spin" />Loading…</p>}
    </div>
  );
}

function InvoiceRow({ i, onChange, home }: { i: Invoice; onChange: () => void; home: Currency }) {
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [msg, setMsg] = useState("");
  const plan = i.payment_count > 1;
  async function cancel() {
    if (!window.confirm(plan ? "Stop this payment plan? Payments already made stay paid; no more invoices go out." : "Void this invoice? The link stops working.")) return;
    setBusy(true);
    const r = await fetch("/api/payments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "cancel", id: i.id }) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return setMsg(j.error || "That didn't work.");
    onChange();
  }
  async function copy() {
    if (!i.hosted_url) return;
    try {
      await navigator.clipboard.writeText(i.hosted_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setMsg(i.hosted_url);
    }
  }
  const open = i.status === "open" || i.status === "plan_active";
  return (
    <li className="py-2 text-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-[#1a2b4a] dark:text-[#F8F5F0]">
          <span className="font-semibold">{money(i.amount, i.currency, home)}</span>
          {Number(i.tax_amount) > 0 && <span className="text-xs text-[#7b6b8d]"> + {money(Number(i.tax_amount), i.currency, home)} GST/HST</span>}
          {i.contact_id ? <Link href={`/contacts?contact=${i.contact_id}`} className="ml-2 text-[#2E7C83] hover:underline">{i.name || i.email}</Link> : <span className="ml-2">{i.name || i.email}</span>}
          <span className="text-[#5b5f73] dark:text-[#b8a898]"> · {i.description}</span>
          {!i.livemode && <Test />}
        </span>
        <span className="text-xs text-[#7b6b8d]">
          {STATUS[i.status] || i.status}
          {plan ? ` · ${i.payments_made} of ${i.payment_count} paid` : i.due_date && i.status === "open" ? ` · due ${day(i.due_date)}` : ""}
          {i.number ? ` · ${i.number}` : ""}
        </span>
      </div>
      <div className="mt-1 flex flex-wrap gap-3 text-xs">
        {i.hosted_url && open && <button onClick={() => void copy()} className="inline-flex items-center gap-1 font-semibold text-[#2E7C83] hover:underline">{copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}{copied ? "Copied" : "Copy pay link"}</button>}
        {i.hosted_url && <a href={i.hosted_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-[#2E7C83] hover:underline"><ExternalLink className="h-3 w-3" />Open</a>}
        {i.pdf_url && <a href={i.pdf_url} target="_blank" rel="noreferrer" className="font-semibold text-[#2E7C83] hover:underline">PDF</a>}
        {open && <button onClick={() => void cancel()} disabled={busy} className="font-semibold text-[#8a2f2f] hover:underline disabled:opacity-50">{plan ? "Stop plan" : "Void"}</button>}
      </div>
      {msg && <p className="mt-1 break-all text-xs text-[#8a2f2f]">{msg}</p>}
    </li>
  );
}

function NewInvoice({ data, contactId, onDone, home }: { data: Data; contactId: string | null; onDone: () => void; home: Currency }) {
  const { canChoose } = useHomeCurrency();
  const [open, setOpen] = useState(Boolean(contactId));
  const [who, setWho] = useState<LookupContact | null>(null);
  const [search, setSearch] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [count, setCount] = useState("1");
  const [days, setDays] = useState("7");
  const [offerId, setOfferId] = useState("");
  // null = the home currency (follows Settings once it loads); an offer or the picker sets it.
  const [currencyPick, setCurrencyPick] = useState<Currency | null>(null);
  const currency = currencyPick ?? home;
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  // GST/HST: where the customer is. "" = not chosen (the contact's stored address fills it in when it can).
  const [place, setPlace] = useState<TaxPlace | "">("");
  const [placeTouched, setPlaceTouched] = useState(false);
  const taxOn = Boolean(data.salesTax);

  useEffect(() => {
    if (!contactId) return;
    fetch(`/api/payments?contact=${contactId}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j?.contact) {
          setWho({ ...j.contact, phone: null });
          setSearch(lookupName(j.contact));
        }
      })
      .catch(() => {});
  }, [contactId]);

  useEffect(() => {
    if (!who || !(Number(amount) > 0)) return setNote("");
    const t = setTimeout(() => {
      fetch("/api/payments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "preview", contactId: who.id, email: who.email, description: description || "x", amount: Number(amount), paymentCount: Number(count), daysUntilDue: Number(days), currency, taxPlace: taxOn && place ? place : undefined }) })
        .then((r) => r.json())
        .then((j) => {
          setNote(j.note || j.error || "");
          // The contact's stored address prefills "Customer is in" until someone picks.
          if (taxOn && !placeTouched && isTaxPlace(j.place)) setPlace(j.place);
        })
        .catch(() => setNote(""));
    }, 300);
    return () => clearTimeout(t);
  }, [who, amount, count, days, description, currency, place, placeTouched, taxOn]);
  // A different contact: their own address decides again.
  useEffect(() => {
    setPlace("");
    setPlaceTouched(false);
  }, [who?.id]);

  function pickOffer(id: string) {
    setOfferId(id);
    const o = data.offers.find((x) => x.id === id);
    // The invoice follows the offer's currency; no offer = the home currency.
    setCurrencyPick(o ? toCurrency(o.currency, home) : null);
    if (o) {
      if (!description) setDescription(o.name);
      if (!amount && o.price) setAmount(String(o.price));
    }
  }

  async function send() {
    if (!who) return setMsg("Choose a contact.");
    if (taxOn && !place) return setMsg("Choose where the customer is, so the right GST/HST is added.");
    setBusy(true);
    setMsg("");
    const r = await fetch("/api/payments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "invoice", contactId: who.id, description, amount: Number(amount), paymentCount: Number(count), daysUntilDue: Number(days), offerId: offerId || null, currency, taxPlace: taxOn ? place : undefined }) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return setMsg(j.error || "That didn't work.");
    setDescription("");
    setAmount("");
    setCount("1");
    setOfferId("");
    setCurrencyPick(null);
    setPlace("");
    setPlaceTouched(false);
    setOpen(false);
    setMsg("");
    onDone();
  }

  if (!open)
    return (
      <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-full bg-[#2E7C83] px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
        <Receipt className="h-4 w-4" />New invoice
      </button>
    );
  return (
    <section className={card}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">New invoice{data.livemode === false && <Test />}</h2>
        <button onClick={() => setOpen(false)} aria-label="Close" className="text-[#7b6b8d] hover:text-[#1a2b4a]"><X className="h-4 w-4" /></button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="md:col-span-2 xl:col-span-1">
          <label className={label} htmlFor="inv-who">Contact</label>
          <ContactLookupInput id="inv-who" value={search} onChange={(v) => { setSearch(v); setWho(null); }} onPick={(c) => { setWho(c); setSearch(lookupName(c)); }} placeholder="Start typing a name or email" className={input} pickLabel="Invoice" />
          {who && <p className="mt-1 text-xs text-[#7b6b8d]">Sends to {who.email}</p>}
        </div>
        <div>
          <label className={label} htmlFor="inv-offer">Offer (optional)</label>
          <select id="inv-offer" className={input} value={offerId} onChange={(e) => pickOffer(e.target.value)}>
            <option value="">None</option>
            {data.offers.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        </div>
        <div>
          <label className={label} htmlFor="inv-desc">What it&apos;s for</label>
          <input id="inv-desc" className={input} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="VIP strategy day" />
        </div>
        <div>
          <label className={label} htmlFor="inv-amount">Total amount ({currency.toUpperCase()}){taxOn ? ", before tax" : ""}</label>
          {canChoose || currency !== home ? (
            <div className="flex gap-2">
              <input id="inv-amount" inputMode="decimal" className={input} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="1500" />
              <CurrencySelect value={currency} onChange={setCurrencyPick} aria-label="Invoice currency" className={`${input} w-24`} />
            </div>
          ) : (
            <input id="inv-amount" inputMode="decimal" className={input} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="1500" />
          )}
        </div>
        <div>
          <label className={label} htmlFor="inv-count">Payments</label>
          <select id="inv-count" className={input} value={count} onChange={(e) => setCount(e.target.value)}>
            <option value="1">Paid in full</option>
            {Array.from({ length: 23 }, (_, k) => k + 2).map((n) => <option key={n} value={n}>{n} monthly payments</option>)}
          </select>
        </div>
        {taxOn && (
          <div>
            <label className={label} htmlFor="inv-place">Customer is in *</label>
            <select id="inv-place" className={input} value={place} onChange={(e) => { setPlace(e.target.value as TaxPlace | ""); setPlaceTouched(true); }}>
              <option value="">Choose where they are</option>
              {PROVINCES.map((p) => <option key={p.code} value={p.code}>{p.name} ({p.kind} {p.rate}%)</option>)}
              <option value="OUTSIDE">{OUTSIDE_LABEL} (no GST/HST)</option>
            </select>
            <p className="mt-1 text-xs text-[#7b6b8d]">GST/HST is charged by where your customer is.</p>
          </div>
        )}
        <div>
          <label className={label} htmlFor="inv-days">Due within (days)</label>
          <input id="inv-days" inputMode="numeric" className={input} value={days} onChange={(e) => setDays(e.target.value)} />
        </div>
      </div>
      {note && <p className="mt-3 text-sm text-[#5b5f73] dark:text-[#b8a898]">{note}</p>}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button onClick={() => void send()} disabled={busy || !who} className="inline-flex items-center gap-2 rounded-full bg-[#2E7C83] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Receipt className="h-4 w-4" />}Send invoice
        </button>
        <span className="text-xs text-[#7b6b8d]">Stripe emails it from your own Stripe account, with a secure pay page. {Number(count) > 1 ? "A new invoice goes out each month, and the plan stops itself after the last payment." : ""}</span>
      </div>
      {msg && <p className="mt-2 text-sm text-[#8a2f2f]">{msg}</p>}
    </section>
  );
}
