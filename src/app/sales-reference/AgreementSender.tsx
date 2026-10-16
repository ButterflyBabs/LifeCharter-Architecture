"use client";

import { useEffect, useState } from "react";
import { useProspect } from "./ProspectContext";

// Sends the Year-1 Operating Agreement for signature (BoldSign) to the client, from the live close. The name and
// email come from the contact picked in the lookup; they can be typed too. It asks once more before sending.
export function AgreementSender() {
  const { prefill, version } = useProspect();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [business, setBusiness] = useState("");
  const [tier, setTier] = useState("");
  const [payment, setPayment] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [state, setState] = useState<"idle" | "busy" | "sent" | "error">("idle");
  const [msg, setMsg] = useState("");
  const [configured, setConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/sales/send-agreement", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setConfigured(Boolean(d?.configured)))
      .catch(() => setConfigured(null));
  }, []);
  useEffect(() => {
    if (!prefill || version === 0) return;
    if (prefill.fullName) setName(prefill.fullName);
    if (prefill.email) setEmail(prefill.email);
    if (prefill.phone) setPhone(prefill.phone);
    if (prefill.companyName) setBusiness(prefill.companyName);
    if (prefill.tier) setTier(prefill.tier);
    setConfirm(false);
    setState("idle");
    setMsg("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);

  const ready = name.trim().length > 1 && /^\S+@\S+\.\S+$/.test(email.trim()) && Boolean(tier) && Boolean(payment);

  async function send() {
    setState("busy");
    setMsg("");
    const r = await fetch("/api/sales/send-agreement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone, businessName: business, tier, payment, contactId: prefill?.email && prefill.email.toLowerCase() === email.trim().toLowerCase() ? prefill.contactId : undefined }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) {
      setState("error");
      setMsg(d.error || "That didn't send. Try again in a minute.");
      setConfirm(false);
      return;
    }
    setState("sent");
    setConfirm(false);
  }

  const field = "w-full rounded-lg border border-[#F3EEE4]/20 bg-[#141826] px-3 py-2 text-sm text-[#F3EEE4] placeholder:text-[#b8a898]/60 focus:outline-none focus:border-[#c9a227]";
  return (
    <div className="mt-3 rounded-lg border border-emerald-400/30 bg-[#141826] p-3">
      {configured === false && (
        <p className="mb-2 text-xs text-[#E3C27C]">
          Sending from here isn&rsquo;t switched on yet. For now, send it from BoldSign:{" "}
          <a href="https://app.boldsign.com/templates/all" target="_blank" rel="noopener noreferrer" className="underline">Templates</a>, open &ldquo;LCCS Year-1 Operating Agreement&rdquo;, Use template.
        </p>
      )}
      <div className="grid gap-2 sm:grid-cols-2">
        <input className={field} aria-label="Client name" placeholder="Client name" value={name} onChange={(e) => { setName(e.target.value); setConfirm(false); setState("idle"); }} />
        <input className={field} aria-label="Client email" type="email" placeholder="Client email" value={email} onChange={(e) => { setEmail(e.target.value); setConfirm(false); setState("idle"); }} />
        <input className={field} aria-label="Business name" placeholder="Business name" value={business} onChange={(e) => { setBusiness(e.target.value); setConfirm(false); }} />
        <input className={field} aria-label="Client phone" placeholder="Client phone" value={phone} onChange={(e) => { setPhone(e.target.value); setConfirm(false); }} />
        <select className={field} aria-label="Tier" value={tier} onChange={(e) => { setTier(e.target.value); setConfirm(false); }}>
          <option value="">Which tier did they choose?</option>
          <option value="Starter">Starter</option>
          <option value="Growth">Growth</option>
          <option value="VIP">VIP</option>
        </select>
        <select className={field} aria-label="Payment option" value={payment} onChange={(e) => { setPayment(e.target.value); setConfirm(false); }}>
          <option value="">How are they paying?</option>
          <option value="full">Implementation fee in full</option>
          <option value="split">50 / 50</option>
          <option value="annual">Annual, paid in full</option>
        </select>
      </div>
      <p className="mt-2 text-[11px] text-[#b8a898]">These fill in the agreement for them, so all they do is read and sign.</p>
      {state === "sent" ? (
        <p className="mt-3 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-200">
          Sent to {email}. They will have it in their inbox in a moment. It shows on their contact card, and Babs will be asked to countersign after they sign.
        </p>
      ) : (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {!confirm ? (
            <button type="button" disabled={!ready || state === "busy" || configured === false} onClick={() => setConfirm(true)} className="rounded-lg bg-gradient-to-r from-[#D4AF63] to-[#c9a227] px-4 py-2 text-sm font-semibold text-[#1a2b4a] disabled:opacity-50">
              Send the Year-1 Agreement for signature
            </button>
          ) : (
            <>
              <span className="text-sm text-[#F3EEE4]">Send to <strong>{name}</strong> at <strong>{email}</strong>?</span>
              <button type="button" disabled={state === "busy"} onClick={send} className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-[#0b2a1d] disabled:opacity-60">{state === "busy" ? "Sending…" : "Yes, send it"}</button>
              <button type="button" disabled={state === "busy"} onClick={() => setConfirm(false)} className="text-xs text-[#b8a898] underline">Cancel</button>
            </>
          )}
        </div>
      )}
      {state === "error" && msg && <p className="mt-2 text-xs text-red-300">{msg}</p>}
    </div>
  );
}
