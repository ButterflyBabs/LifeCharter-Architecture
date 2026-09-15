"use client";

import { useState } from "react";

export function StarterSignupForm() {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "busy") return;
    setState("busy");
    setErrorMsg("");
    try {
      const res = await fetch("/api/stripe/starter-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, fullName }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || "Something went wrong");
      window.location.href = data.url;
    } catch (err) {
      setState("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label htmlFor="starter-fullname" className="sr-only">
          Full name
        </label>
        <input
          id="starter-fullname"
          type="text"
          required
          placeholder="Full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full rounded-lg border border-[#F3EEE4]/20 bg-[#141826] px-3 py-2.5 text-sm text-[#F8F5F0] placeholder:text-[#b8a898]/60 focus:outline-none focus:border-[#c9a227]"
        />
      </div>
      <div>
        <label htmlFor="starter-email" className="sr-only">
          Email
        </label>
        <input
          id="starter-email"
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-[#F3EEE4]/20 bg-[#141826] px-3 py-2.5 text-sm text-[#F8F5F0] placeholder:text-[#b8a898]/60 focus:outline-none focus:border-[#c9a227]"
        />
      </div>
      <button
        type="submit"
        disabled={state === "busy"}
        className="w-full rounded-lg bg-gradient-to-r from-[#D4AF63] to-[#c9a227] text-[#1a2b4a] font-semibold px-4 py-2.5 text-sm disabled:opacity-60"
      >
        {state === "busy" ? "Redirecting to checkout…" : "Get started with Starter"}
      </button>
      {state === "error" && <p className="text-xs text-red-300">{errorMsg}</p>}
      <p className="text-[11px] text-[#b8a898]/80 text-center">
        You&apos;ll pay the one-time implementation fee now. Monthly billing starts once
        implementation is complete.
      </p>
    </form>
  );
}
