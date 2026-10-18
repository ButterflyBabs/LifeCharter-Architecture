"use client";

import { useState } from "react";

// "Send me my link": anyone with a client portal gets their current link by email.
export default function PortalLinkPage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const hp = (new FormData(e.currentTarget).get("_hp") as string) || "";
    const r = await fetch("/api/portal/send-link", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, _hp: hp }) });
    const d = await r.json().catch(() => ({}));
    setMsg(d.message || "If you have a client portal, a link is on its way.");
    setBusy(false);
  }
  return (
    <main className="min-h-screen bg-[#FBF8F1] px-4 py-16 text-[#1F2B3A]">
      <div className="mx-auto max-w-md rounded-2xl border border-[#E5DDCF] bg-white p-6">
        <h1 className="text-2xl font-semibold" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>Get your portal link</h1>
        <p className="mt-1 text-sm text-[#56616E]">Enter the email address you use with your coach or service provider. We&apos;ll email you your private link.</p>
        {msg ? (
          <p className="mt-4 rounded-xl bg-[#E6F1F1] px-4 py-3 text-sm" role="status">{msg}</p>
        ) : (
          <form onSubmit={(e) => void submit(e)} className="mt-4 space-y-3">
            <label htmlFor="portal-email" className="block text-sm font-semibold">Email</label>
            <input id="portal-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className="w-full rounded-xl border border-[#E5DDCF] px-3 py-2.5 outline-none focus:ring-2 focus:ring-[#2E7C83]/40" />
            <input name="_hp" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
            <button disabled={busy} className="w-full rounded-full bg-[#2E7C83] px-5 py-3 font-semibold text-white disabled:opacity-60">{busy ? "Sending…" : "Email me my link"}</button>
          </form>
        )}
      </div>
      <p className="mt-6 text-center text-xs text-[#9aa3ad]">Powered by LifeCharter Command Suite</p>
    </main>
  );
}
