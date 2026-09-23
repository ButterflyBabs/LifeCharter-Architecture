"use client";

import { useState, type FormEvent } from "react";
import { AuthShell, authInputClass, authLabelClass, authButtonClass } from "@/components/login/auth-shell";

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const email = String(new FormData(e.currentTarget).get("email") ?? "").trim();
    // Sent by our own endpoint so the link works in any browser or device
    // (see src/app/api/auth/forgot/route.ts).
    const res = await fetch("/api/auth/forgot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }).catch(() => null);
    const out = res ? await res.json().catch(() => ({})) : {};

    setLoading(false);
    if (!res || !res.ok) {
      setError(out.error || "Something went wrong. Please try again.");
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <AuthShell
        title="Check your email"
        subtitle="If an account exists for that address, we've sent a link to reset your password. It expires in an hour."
      >
        <p className="rounded-lg border border-brand-teal/40 bg-brand-teal/10 px-4 py-3 text-center text-[12.5px] text-brand-lavender">
          Didn&apos;t get it? It comes from community@lccommandsuite.com — check Other, Promotions and Spam, or wait a moment and try again.
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Reset your password" subtitle="Enter your email and we'll send you a link to set a new one.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-[18px]">
        <div>
          <label htmlFor="email" className={authLabelClass}>
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@lifecharter.com"
            className={authInputClass}
          />
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-lg border border-brand-plum/50 bg-brand-plum/15 px-3 py-2 text-[12.5px] text-brand-lavender"
          >
            {error}
          </p>
        )}

        <button type="submit" disabled={loading} className={authButtonClass}>
          {loading ? "Sending…" : "Send reset link"}
        </button>
      </form>
    </AuthShell>
  );
}
