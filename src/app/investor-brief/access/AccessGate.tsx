"use client";

import { useState } from "react";

// The front door of the investor page: one access code, nothing else on the site is affected.
export default function AccessGate() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/investor-access/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, code }) });
      const d = await r.json().catch(() => ({}));
      if (r.ok) {
        window.location.href = "/investor-brief";
        return;
      }
      setError(d.error || "That email and access code do not match an approved request.");
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setBusy(false);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[linear-gradient(160deg,#0B1630_0%,#121F44_60%,#1F2B59_100%)] px-5 py-12 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/investor-brief/logo-reversed.png" alt="LifeCharter Command Suite" className="h-20 w-auto" />
      <p className="mt-10 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#D4AF63]">Investor brief</p>
      <h1 className="mt-3 font-serif text-4xl font-semibold leading-tight text-[#FAF8F3] sm:text-5xl">Investor documents</h1>
      <p className="mt-3 max-w-md text-[15px] leading-relaxed text-[#CBD5E1]">
        Sign in with the email address you used to request access and the personal access code we sent you.
      </p>
      <form onSubmit={submit} className="mt-8 w-full max-w-sm">
        <label htmlFor="ib-email" className="sr-only">Email</label>
        <input
          id="ib-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
          className="mb-3 w-full rounded-full border border-[#D4AF63]/60 bg-white/95 px-5 py-3 text-center text-base text-[#0F1A38] outline-none focus:ring-2 focus:ring-[#D4AF63]"
        />
        <label htmlFor="ib-code" className="sr-only">Access code</label>
        <input
          id="ib-code"
          type="password"
          autoComplete="current-password"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Access code"
          className="w-full rounded-full border border-[#D4AF63]/60 bg-white/95 px-5 py-3 text-center text-base text-[#0F1A38] outline-none focus:ring-2 focus:ring-[#D4AF63]"
        />
        <button
          type="submit"
          disabled={busy || !code.trim() || !email.trim()}
          className="mt-4 w-full rounded-full bg-[#D4AF63] px-5 py-3 text-sm font-semibold uppercase tracking-wider text-[#0F1A38] hover:bg-[#E9D7A9] disabled:opacity-50"
        >
          {busy ? "Checking…" : "Open the investor documents"}
        </button>
        {error && <p role="alert" className="mt-4 text-sm text-[#F2B8B5]">{error}</p>}
      </form>
      <p className="mt-8 max-w-sm text-sm text-[#CBD5E1]">
        Do not have an access code yet? The investor documents are provided during or after a short Zoom conversation with AmiLynne.{" "}
        <a className="font-semibold text-[#E9D7A9] underline" href="https://www.amilynnecarroll.com/investors">Request a call</a>.
      </p>
      <p className="mt-10 font-serif text-lg italic text-[#E9D7A9]">The command cockpit for founders</p>
    </main>
  );
}
