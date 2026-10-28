"use client";

import { useEffect, useState } from "react";
import { Check, CreditCard, Loader2 } from "lucide-react";
import { formatMoney, type Currency } from "@/lib/currency";
import { OUTSIDE_LABEL, PROVINCES, isTaxPlace, taxCents, taxFor, type TaxPlace } from "@/lib/salesTax";

// An offer's pay page: lccommandsuite.com/pay/<link id>. Made for accounts that charge GST/HST (task 1520 follow-up):
// Stripe Payment Links can't add a fixed tax rate, so the buyer says where they are here, sees the tax and the total,
// then goes on to Stripe Checkout on the seller's own Stripe account. Plain, neutral look (like a client's booking page).
type Info = { active: true; offer: string; seller: string | null; kind: "one_time" | "monthly" | "payment_plan"; amount: number; currency: Currency; home: Currency; count: number | null; tax: boolean; livemode: boolean };

const accent = "#2E7C83";
const line = "#EADFCF";
const ink = "#1F2B3A";
const serif = "'EB Garamond', Georgia, 'Times New Roman', serif";

export default function PayPage({ params }: { params: { id: string } }) {
  const [info, setInfo] = useState<Info | null>(null);
  const [gone, setGone] = useState(false);
  const [place, setPlace] = useState<TaxPlace | "">("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [state, setState] = useState<"" | "paid" | "cancelled">("");

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    setState(q.get("paid") === "1" ? "paid" : q.get("cancelled") === "1" ? "cancelled" : "");
    fetch(`/api/pay/${params.id}`, { cache: "no-store" })
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (!r.ok || !d.active) return setGone(true);
        setInfo(d as Info);
      })
      .catch(() => setGone(true));
  }, [params.id]);

  const money = (n: number) => (info ? formatMoney(n, info.currency, { home: info.home, cents: true }) : "");
  const cents = info ? Math.round(info.amount * 100) : 0;
  const tax = info?.tax && isTaxPlace(place) ? taxFor(place) : null;
  const taxC = tax ? taxCents(cents, tax.rate) : 0;
  const every = info?.kind === "monthly" ? " every month" : info?.kind === "payment_plan" ? ` a month, for ${info.count} months` : "";

  async function go() {
    if (!info) return;
    if (info.tax && !isTaxPlace(place)) return setErr("Choose where you are so the right tax is added.");
    setBusy(true);
    setErr("");
    const r = await fetch(`/api/pay/${params.id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ place: place || null }) });
    const d = await r.json().catch(() => ({}));
    if (r.ok && d.url) {
      window.location.href = d.url;
      return;
    }
    setBusy(false);
    if (r.status === 404) return setGone(true);
    setErr(d.error || "Something went wrong. Please try again.");
  }

  return (
    <main className="min-h-screen bg-white [color-scheme:light]" style={{ color: ink }}>
      <div className="h-1.5" style={{ background: accent }} />
      <div className="mx-auto max-w-xl px-5 pb-16 pt-12 sm:px-8">
        {gone ? (
          <div className="rounded-2xl border p-8 text-center" style={{ borderColor: line }}>
            <h1 className="text-2xl font-semibold" style={{ fontFamily: serif }}>This link is no longer active</h1>
            <p className="mt-2 text-[15px] opacity-70">Please contact the person who sent it to you for a new one.</p>
          </div>
        ) : !info ? (
          <p className="flex items-center justify-center gap-2 text-sm opacity-70"><Loader2 className="h-4 w-4 animate-spin" />Loading…</p>
        ) : state === "paid" ? (
          <div className="rounded-2xl border p-8" style={{ borderColor: line }}>
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full" style={{ background: "#E6F1F1", color: accent }}><Check className="h-5 w-5" /></span>
              <h1 className="text-2xl font-semibold" style={{ fontFamily: serif }}>Thank you</h1>
            </div>
            <p className="text-[15px]">Your payment for <strong>{info.offer}</strong> went through. Your receipt comes from Stripe by email.</p>
          </div>
        ) : (
          <>
            {info.seller && <p className="text-center text-sm opacity-70">{info.seller}</p>}
            <h1 className="mt-1 text-center text-4xl font-bold" style={{ fontFamily: serif }}>{info.offer}</h1>
            {!info.livemode && <p className="mt-2 text-center text-xs font-semibold text-[#8a6a15]">TEST: no real money is charged</p>}
            {state === "cancelled" && <p className="mt-4 text-center text-sm text-[#8a2f2f]">Your payment wasn&apos;t finished. You can try again below.</p>}

            <div className="mt-8 space-y-4 rounded-2xl border p-6" style={{ borderColor: line }}>
              {info.tax && (
                <label className="block text-sm font-semibold">
                  Where are you? *
                  <select value={place} onChange={(e) => { setPlace(e.target.value as TaxPlace | ""); setErr(""); }} className="mt-1 w-full rounded-xl border bg-white px-4 py-2.5 text-[15px]" style={{ borderColor: line }}>
                    <option value="" disabled>Choose your province or territory</option>
                    {PROVINCES.map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}
                    <option value="OUTSIDE">{OUTSIDE_LABEL}</option>
                  </select>
                  <span className="mt-1 block text-xs font-normal opacity-70">Sales tax (GST/HST) depends on where you are.</span>
                </label>
              )}
              <div className="space-y-1.5 border-t pt-4 text-[15px]" style={{ borderColor: line }}>
                <p className="flex justify-between"><span>Price</span><span>{money(cents / 100)}</span></p>
                {info.tax && (
                  <p className="flex justify-between opacity-80">
                    <span>{tax ? (tax.rate > 0 ? `${tax.kind} ${tax.rate}%` : "No GST/HST (outside Canada)") : "GST/HST"}</span>
                    <span>{tax ? money(taxC / 100) : "Choose where you are"}</span>
                  </p>
                )}
                <p className="flex justify-between border-t pt-2 text-lg font-semibold" style={{ borderColor: line }}>
                  <span>Total</span>
                  <span>{!info.tax || tax ? `${money((cents + taxC) / 100)}${every}` : "—"}</span>
                </p>
              </div>
              {err && <p className="text-sm text-[#8a2f2f]">{err}</p>}
              <button onClick={() => void go()} disabled={busy || (info.tax && !tax)} className="flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-base font-semibold text-white disabled:opacity-60" style={{ background: accent }}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}Continue to payment
              </button>
              <p className="text-center text-xs opacity-60">You pay securely with Stripe.{info.kind === "payment_plan" ? " The payments stop by themselves after the last one." : ""}</p>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
