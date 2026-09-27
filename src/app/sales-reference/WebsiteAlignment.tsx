"use client";

import { useEffect, useState } from "react";
import { useProspect } from "./ProspectContext";

// Website Alignment on the sales page (Babs, 2026-09-27): every client gets the free Review;
// the Build is sold here, $1,997 for founding clients (pay in full or 2 payments).
export function WebsiteAlignment() {
  const { prefill, version } = useProspect();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState<"full" | "two_pay" | null>(null);
  const [error, setError] = useState("");
  const [url, setUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!prefill || version === 0) return;
    if (prefill.email) setEmail(prefill.email);
    if (prefill.fullName) setFullName(prefill.fullName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);

  async function send(plan: "full" | "two_pay") {
    if (busy) return;
    setBusy(plan);
    setError("");
    setUrl(null);
    try {
      const res = await fetch("/api/sales/website-build-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, email: email || undefined, fullName: fullName || undefined }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || "Something went wrong");
      setUrl(data.url);
      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(null);
    }
  }

  const input = "rounded-lg border border-[#F3EEE4]/20 bg-[#141826] px-3 py-2 text-sm text-[#F8F5F0] placeholder:text-[#b8a898]/60 focus:outline-none focus:border-[#c9a227]";

  return (
    <section className="mt-12 rounded-2xl border border-[#F3EEE4]/12 bg-[#1C2236] p-6">
      <h2 className="text-2xl font-semibold text-[#F8F5F0]">Website Alignment</h2>
      <p className="mt-2 max-w-3xl text-sm text-[#b8a898]">
        <strong className="text-[#F3EEE4]">Every client gets a free Website Alignment Review</strong>: their site measured against the
        positioning, brand voice and offer they write in Command Suite, with the five changes that matter most, within 14 days.
        If their site needs rebuilding, founding clients (enrolling by Dec 17) get the <strong className="text-[#F3EEE4]">Website Build</strong>:
        up to 5 pages, live within 30 days, <strong className="text-[#F3EEE4]">$1,997</strong> (about $3,997 after the season). Only 5 Builds a month.
      </p>
      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <input type="text" placeholder="Client name (optional)" value={fullName} onChange={(e) => setFullName(e.target.value)} className={input} />
        <input type="email" placeholder="Client email (optional)" value={email} onChange={(e) => setEmail(e.target.value)} className={input} />
      </div>
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button type="button" onClick={() => send("full")} disabled={!!busy} className="rounded-lg bg-gradient-to-r from-[#D4AF63] to-[#c9a227] px-4 py-2.5 text-sm font-semibold text-[#1a2b4a] disabled:opacity-60">
          {busy === "full" ? "Creating checkout…" : "Send Build checkout: $1,997"}
        </button>
        <button type="button" onClick={() => send("two_pay")} disabled={!!busy} className="rounded-lg border border-[#c9a227]/60 px-4 py-2.5 text-sm font-semibold text-[#E3C27C] disabled:opacity-60">
          {busy === "two_pay" ? "Creating checkout…" : "Send Build checkout: 2 × $998.50"}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
      {url && (
        <div className="mt-3 flex items-center gap-2">
          <p className="flex-1 truncate text-xs text-[#b8a898]">{url}</p>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(url).catch(() => {});
              setCopied(true);
              setTimeout(() => setCopied(false), 1600);
            }}
            className="whitespace-nowrap text-xs text-[#E3C27C] underline"
          >
            {copied ? "Copied" : "Copy link"}
          </button>
        </div>
      )}
    </section>
  );
}
