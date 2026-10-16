"use client";

import { useEffect, useState } from "react";
import { useProspect } from "./ProspectContext";

interface Props {
  tier: "starter" | "growth" | "vip";
  implementationDisplay: string;
  monthlyDisplay: string;
  /** Annual pay-in-full: the implementation fee plus the first 12 monthly fees, about 20% off. Comes from src/lib/pricing.ts. */
  annualDisplay: string;
  /** The two halves of the implementation fee on the 50/50 plan. */
  halfFirstDisplay: string;
  halfSecondDisplay: string;
}

export function CombinedCheckoutButton({ tier, implementationDisplay, monthlyDisplay, annualDisplay, halfFirstDisplay, halfSecondDisplay }: Props) {
  const { prefill, version } = useProspect();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [alumni, setAlumni] = useState(false);
  const [split, setSplit] = useState(false);
  const [annual, setAnnual] = useState(false);
  const [state, setState] = useState<"idle" | "busy" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!prefill || version === 0) return;
    if (prefill.email) setEmail(prefill.email);
    if (prefill.fullName) setFullName(prefill.fullName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);

  async function handleClick() {
    if (state === "busy") return;
    setState("busy");
    setErrorMsg("");
    setCheckoutUrl(null);
    try {
      const res = await fetch("/api/sales/checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, email: email || undefined, fullName: fullName || undefined, alumni, split, annual }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || "Something went wrong");
      setCheckoutUrl(data.url);
      window.open(data.url, "_blank", "noopener,noreferrer");
      setState("idle");
    } catch (err) {
      setState("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  function copyUrl() {
    if (!checkoutUrl) return;
    navigator.clipboard.writeText(checkoutUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="mt-4 rounded-xl border border-[#c9a227]/40 bg-[#c9a227]/[0.06] p-4">
      <p className="text-xs uppercase tracking-wide text-[#c9a227] font-semibold">
        One link, both charges
      </p>
      <p className="text-xs text-[#b8a898] mt-1">
        {annual
          ? `${annualDisplay} today covers the implementation fee and the first 12 months; ${monthlyDisplay} begins in month 13`
          : split
            ? `${halfFirstDisplay} today (half of the ${implementationDisplay} implementation fee) + ${monthlyDisplay} starting in one billing cycle; the other ${halfSecondDisplay} is added 30 days later, on the same invoice as the first monthly charge`
            : `${implementationDisplay} today + ${monthlyDisplay} starting in one billing cycle`}
        {annual ? (alumni ? " (the $500 alumni credit is taken off)" : "") : <> — {alumni ? "$500 alumni implementation credit" : "FIRSTMONTHFREE"} applied automatically</>}, nothing for the client to type.
      </p>

      <div className="mt-3" role="radiogroup" aria-label="How they are paying">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#E3C27C]">How are they paying?</p>
        <div className="mt-1.5 grid gap-1.5">
          {([
            { key: "full", label: `Implementation in full: ${implementationDisplay} today, then ${monthlyDisplay}`, note: "" },
            { key: "split", label: `50 / 50: ${halfFirstDisplay} today + ${halfSecondDisplay} in 30 days, then ${monthlyDisplay}`, note: "Use cautiously and sparingly." },
            { key: "annual", label: `Annual, paid in full: ${annualDisplay} (implementation + first 12 months, about 20% off)`, note: "" },
          ] as const).map((o) => {
            const on = (o.key === "split" && split) || (o.key === "annual" && annual) || (o.key === "full" && !split && !annual);
            return (
              <button
                key={o.key}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => {
                  setSplit(o.key === "split");
                  setAnnual(o.key === "annual");
                }}
                className={`rounded-lg border px-3 py-2 text-left text-xs ${on ? "border-[#c9a227] bg-[#c9a227]/10 text-[#F8F5F0]" : "border-[#F3EEE4]/12 bg-[#141826] text-[#b8a898]"}`}
              >
                <span className="font-semibold">{on ? "● " : "○ "}{o.label}</span>
                {o.note && <span className="ml-1 text-[#E3C27C]">{o.note}</span>}
              </button>
            );
          })}
        </div>
      </div>

      <label className="mt-3 flex items-center gap-2 text-xs text-[#b8a898]">
        <input
          type="checkbox"
          checked={alumni}
          onChange={(e) => setAlumni(e.target.checked)}
          className="rounded border-[#F3EEE4]/30 bg-[#141826] accent-[#c9a227]"
        />
        I&apos;m a LifeCharter graduate — $500 off implementation instead of FIRSTMONTHFREE
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
        <input
          type="text"
          placeholder="Client name (optional)"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="rounded-lg border border-[#F3EEE4]/20 bg-[#141826] px-3 py-2 text-sm text-[#F8F5F0] placeholder:text-[#b8a898]/60 focus:outline-none focus:border-[#c9a227]"
        />
        <input
          type="email"
          placeholder="Client email (optional)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-lg border border-[#F3EEE4]/20 bg-[#141826] px-3 py-2 text-sm text-[#F8F5F0] placeholder:text-[#b8a898]/60 focus:outline-none focus:border-[#c9a227]"
        />
      </div>

      <button
        type="button"
        onClick={handleClick}
        disabled={state === "busy"}
        className="mt-3 w-full rounded-lg bg-gradient-to-r from-[#D4AF63] to-[#c9a227] text-[#1a2b4a] font-semibold px-4 py-2.5 text-sm disabled:opacity-60"
      >
        {state === "busy" ? "Creating checkout…" : annual ? "Send annual checkout" : split ? "Send 50/50 checkout" : "Send combined checkout"}
      </button>
      {state === "error" && <p className="text-xs text-red-300 mt-2">{errorMsg}</p>}

      {checkoutUrl && (
        <div className="mt-3 flex items-center gap-2">
          <p className="text-xs text-[#b8a898] truncate flex-1">{checkoutUrl}</p>
          <button
            type="button"
            onClick={copyUrl}
            className="text-xs text-[#E3C27C] underline whitespace-nowrap"
          >
            {copied ? "Copied" : "Copy link"}
          </button>
        </div>
      )}
    </div>
  );
}
