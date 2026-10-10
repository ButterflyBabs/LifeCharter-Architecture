"use client";

import { useEffect, useState } from "react";
import { useProspect } from "./ProspectContext";

interface Props {
  tier: "starter" | "growth" | "vip";
  implementationDisplay: string;
  monthlyDisplay: string;
}

// Annual pay-in-full: Implementation Fee + first 12 monthly fees, about 20% off.
const ANNUAL_DISPLAY: Record<string, string> = { starter: "$5,000", growth: "$7,000", vip: "$13,500" };

export function CombinedCheckoutButton({ tier, implementationDisplay, monthlyDisplay }: Props) {
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
          ? `${ANNUAL_DISPLAY[tier]} today covers the implementation fee and the first 12 months; ${monthlyDisplay} begins in month 13`
          : split
            ? `Half of the ${implementationDisplay} implementation fee today + ${monthlyDisplay} starting in one billing cycle, the other half 30 days later, on the same invoice as the first monthly charge`
            : `${implementationDisplay} today + ${monthlyDisplay} starting in one billing cycle`}
        {annual ? (alumni ? " (the $500 alumni credit is taken off)" : "") : <> — {alumni ? "$500 alumni implementation credit" : "FIRSTMONTHFREE"} applied automatically</>}, nothing for the client to type.
      </p>

      <label className="mt-3 flex items-center gap-2 text-xs text-[#b8a898]">
        <input
          type="checkbox"
          checked={split}
          onChange={(e) => {
            setSplit(e.target.checked);
            if (e.target.checked) setAnnual(false);
          }}
          className="rounded border-[#F3EEE4]/30 bg-[#141826] accent-[#c9a227]"
        />
        Exception only: split the implementation fee, 50% today and 50% in 30 days (offer when you are comfortable)
      </label>
      <label className="mt-2 flex items-center gap-2 text-xs text-[#b8a898]">
        <input
          type="checkbox"
          checked={annual}
          onChange={(e) => {
            setAnnual(e.target.checked);
            if (e.target.checked) setSplit(false);
          }}
          className="rounded border-[#F3EEE4]/30 bg-[#141826] accent-[#c9a227]"
        />
        Annual pay-in-full: {ANNUAL_DISPLAY[tier]} for the implementation fee and the first 12 months (about 20% off)
      </label>

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
