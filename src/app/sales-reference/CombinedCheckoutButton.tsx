"use client";

import { useEffect, useState } from "react";
import { useProspect } from "./ProspectContext";

interface Props {
  tier: "starter" | "growth" | "vip";
  implementationDisplay: string;
  monthlyDisplay: string;
}

export function CombinedCheckoutButton({ tier, implementationDisplay, monthlyDisplay }: Props) {
  const { prefill, version } = useProspect();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
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
        body: JSON.stringify({ tier, email: email || undefined, fullName: fullName || undefined }),
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
        {implementationDisplay} today + {monthlyDisplay} starting in one billing cycle — FIRSTMONTHFREE
        applied automatically, nothing for the client to type.
      </p>

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
        {state === "busy" ? "Creating checkout…" : "Send combined checkout"}
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
