"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Copy, CreditCard, ExternalLink, Loader2 } from "lucide-react";

export type PayLink = { offer_id: string; url: string; kind: string; amount: number; currency?: string; livemode: boolean; created_at: string };
export type PayLinks = { connected: boolean; salesTax?: boolean; taxWord?: string; livemode: boolean | null; links: Record<string, PayLink>; plans: Record<string, { ok: boolean; text: string }> };

// One offer's payment link, made on the client's OWN Stripe account: create it, copy it, open it, or turn it off.
export default function OfferPaymentLink({ offerId, data, onChange }: { offerId: string; data: PayLinks; onChange: () => void }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [copied, setCopied] = useState(false);
  const link = data.links[offerId];
  const plan = data.plans[offerId];

  async function post(body: Record<string, unknown>) {
    setBusy(true);
    setMsg("");
    const r = await fetch("/api/offers/payment-links", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ offerId, ...body }) });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return setMsg(d.error || "That didn't work.");
    onChange();
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(link.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setMsg(link.url);
    }
  }

  return (
    <div className="mt-3 rounded-lg border border-[#635bff]/25 bg-[#635bff]/5 px-3 py-2 text-sm">
      {link ? (
        <>
          <p className="flex items-center gap-1.5 font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">
            <CreditCard className="h-3.5 w-3.5 text-[#635bff]" /> Payment link{!link.livemode && <span className="rounded bg-[#c9a227]/20 px-1.5 text-[10px] font-semibold text-[#8a6a15]">TEST</span>}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs">
            <button onClick={() => void copy()} className="inline-flex items-center gap-1 font-semibold text-[#2E7C83] hover:underline">{copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}{copied ? "Copied" : "Copy link"}</button>
            <a href={link.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-[#2E7C83] hover:underline"><ExternalLink className="h-3 w-3" />Open</a>
            <button onClick={() => void post({})} disabled={busy} className="font-semibold text-[#2E7C83] hover:underline disabled:opacity-50" title="Make a fresh link with the offer's current price (the old one stops working)">Remake</button>
            <button onClick={() => void post({ action: "off" })} disabled={busy} className="font-semibold text-[#8a2f2f] hover:underline disabled:opacity-50">Turn off</button>
          </div>
          <p className="mt-1 text-[11px] text-[#7b6b8d]">Payments go straight to your own Stripe account. Changed the price? Press Remake.</p>
          {link.url.includes("/pay/") ? (
            <p className="mt-1 text-[11px] text-[#7b6b8d]">This link opens a short page where the buyer picks their province (or Outside Canada) and sees the {data.taxWord || "GST/HST"} before paying with Stripe. Your price is before tax.</p>
          ) : data.salesTax ? (
            <p className="mt-1 text-[11px] text-[#8a6a15]">You now charge {data.taxWord || "GST/HST"}, but this link was made before and adds no tax. Press Remake to get a link that adds it.</p>
          ) : null}
        </>
      ) : !data.connected ? (
        <p className="text-xs text-[#5b5f73] dark:text-[#b8a898]"><CreditCard className="mr-1 inline h-3.5 w-3.5 text-[#635bff]" />Take payment for this offer: <Link href="/settings?tab=integrations" className="font-semibold text-[#2E7C83] hover:underline">Connect with Stripe</Link> first.</p>
      ) : plan?.ok ? (
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => void post({})} disabled={busy} className="inline-flex items-center gap-1.5 rounded-full bg-[#635bff] px-3 py-1 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50">{busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CreditCard className="h-3.5 w-3.5" />}Create payment link</button>
          <span className="text-[11px] text-[#7b6b8d]">{plan.text}</span>
        </div>
      ) : (
        <p className="text-xs text-[#7b6b8d]"><CreditCard className="mr-1 inline h-3.5 w-3.5 text-[#635bff]" />{plan?.text || "Add a price to make a payment link."}</p>
      )}
      {msg && <p className="mt-1 break-all text-xs text-[#8a2f2f]">{msg}</p>}
    </div>
  );
}
