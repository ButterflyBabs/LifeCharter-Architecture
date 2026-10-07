"use client";

import { useState } from "react";

const box = "w-full rounded-lg border border-[#1a2b4a]/25 bg-white px-3 py-2.5 text-base text-[#1a2b4a] dark:bg-[#1a2b4a]/40 dark:text-[#F8F5F0]";

export default function SignupForm() {
  const [f, setF] = useState({ firstName: "", lastName: "", email: "", _hp: "" });
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "busy") return;
    setState("busy");
    setErr("");
    const r = await fetch("/api/masterclass-signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...f, _ref: new URLSearchParams(window.location.search).get("ref") || undefined }),
    }).catch(() => null);
    const d = r ? await r.json().catch(() => ({})) : {};
    if (!r?.ok) {
      setState("idle");
      return setErr(d.error || "Something went wrong. Please try again.");
    }
    setState("done");
  }

  if (state === "done")
    return (
      <div role="status" className="mt-6 rounded-2xl border border-[#2c6b3f]/30 bg-[#2c6b3f]/10 p-5">
        <p className="text-lg font-semibold text-[#2c6b3f]">You&apos;re in. Your seat is saved.</p>
        <p className="mt-2 text-[#1a2b4a] dark:text-[#F8F5F0]">Zoom is emailing your confirmation and personal join link to <b>{f.email}</b>. If it doesn&apos;t arrive in a few minutes, check your spam or promotions folder. You&apos;re registered once, and the link works for every session.</p>
      </div>
    );

  return (
    <form onSubmit={submit} className="mt-6 space-y-3 rounded-2xl border border-[#1a2b4a]/10 bg-white p-5 dark:bg-[#1a2b4a]/40">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">First name<input className={box} value={f.firstName} onChange={(e) => setF({ ...f, firstName: e.target.value })} autoComplete="given-name" required /></label>
        <label className="block text-sm font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">Last name<input className={box} value={f.lastName} onChange={(e) => setF({ ...f, lastName: e.target.value })} autoComplete="family-name" /></label>
      </div>
      <label className="block text-sm font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">Email<input type="email" className={box} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} autoComplete="email" required /></label>
      <input tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 opacity-0" value={f._hp} onChange={(e) => setF({ ...f, _hp: e.target.value })} name="website" />
      {err && <p role="alert" className="text-sm text-[#8a2f2f]">{err}</p>}
      <button disabled={state === "busy"} className="w-full rounded-full bg-[#1a2b4a] px-5 py-3 text-base font-semibold text-[#F8F5F0] disabled:opacity-60 dark:bg-[#c9a227] dark:text-[#1a2b4a]">{state === "busy" ? "Saving your seat…" : "Save my seat"}</button>
      <p className="text-xs text-[#5a6472] dark:text-[#b8c2cf]">Free. We&apos;ll email you your link, reminders and the replay.</p>
    </form>
  );
}
