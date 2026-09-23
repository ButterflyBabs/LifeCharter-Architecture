"use client";

// "Request your invitation" — emails the visitor their personal join link and
// invite code. Records where they came from (utm/ref + referrer).
import Link from "next/link";
import { useState, type FormEvent } from "react";

const field =
  "w-full rounded-xl border border-[#DCD3C1] bg-white px-4 py-3.5 text-[15px] text-[#1F315B] outline-none transition placeholder:text-[#A9AEBB] focus:border-[#D4AF63] focus:ring-[3px] focus:ring-[#D4AF63]/25";

export function InviteForm({ source, dark = false }: { source: string; dark?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const f = new FormData(e.currentTarget);
    const params = new URLSearchParams(window.location.search);
    const utm: Record<string, string> = {};
    for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "ref"]) {
      const v = params.get(k);
      if (v) utm[k] = v;
    }
    const email = String(f.get("email") ?? "");
    const res = await fetch("/api/collective/request-invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: f.get("name"), email, company: f.get("company"), source, utm, referrer: document.referrer }),
    });
    const out = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(out.error ?? "Something went wrong — please try again.");
    setSentTo(email);
  }

  if (sentTo) {
    return (
      <div className={`rounded-2xl p-5 text-left ${dark ? "bg-white/10 text-[#F8F5F0]" : "border border-[#E9E2D3] bg-white text-[#1F315B]"}`} role="status">
        <p className="font-display text-[24px] font-semibold leading-tight">Your invitation is on its way.</p>
        <p className={`mt-1.5 text-[14.5px] leading-relaxed ${dark ? "text-[#EDE6D6]/85" : "text-[#5B6275]"}`}>
          Check <strong>{sentTo}</strong> for an email from The LifeCharter Collective with your personal link and invite code. If it isn&rsquo;t there in a minute, look in
          Promotions or Spam.
        </p>
        <button onClick={() => setSentTo(null)} className={`mt-3 text-[13px] underline underline-offset-2 ${dark ? "text-[#E6C988]" : "text-[#A8873F]"}`}>
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="w-full text-left" aria-label="Request your invitation">
      <div className="grid gap-2.5 sm:grid-cols-[1fr_1.3fr]">
        <label className="sr-only" htmlFor={`name-${source}`}>
          First name
        </label>
        <input id={`name-${source}`} name="name" placeholder="First name" autoComplete="given-name" className={field} />
        <label className="sr-only" htmlFor={`email-${source}`}>
          Email
        </label>
        <input id={`email-${source}`} name="email" type="email" required placeholder="Email address" autoComplete="email" className={field} />
      </div>
      {/* Honeypot — hidden from people, tempting to bots. */}
      <input name="company" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 opacity-0" />
      <button
        disabled={busy}
        className="mt-2.5 w-full rounded-xl bg-gradient-to-br from-[#E6C988] via-[#D4AF63] to-[#B8923F] py-4 text-[15.5px] font-semibold tracking-[0.02em] text-[#0F1A38] shadow-[0_14px_30px_-14px_rgba(184,146,63,0.95)] transition hover:brightness-105 disabled:opacity-70"
      >
        {busy ? "Sending your invitation…" : "Request your free invitation"}
      </button>
      {error && (
        <p role="alert" className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13.5px] text-red-700">
          {error}
        </p>
      )}
      <p className={`mt-2.5 text-[12.5px] leading-relaxed ${dark ? "text-[#EDE6D6]/70" : "text-[#8A8FA0]"}`}>
        Free to join. Your invitation arrives by email in under a minute. Already have a code?{" "}
        <Link href="/join/collective" className={`font-semibold underline underline-offset-2 ${dark ? "text-[#E6C988]" : "text-[#A8873F]"}`}>
          Join here
        </Link>
        .
      </p>
    </form>
  );
}
