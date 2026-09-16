"use client";

import { useState, useEffect } from "react";
import { useProspect } from "./ProspectContext";

const FIELD_CLASS =
  "w-full rounded-lg border border-[#F3EEE4]/20 bg-[#141826] px-3 py-2.5 text-sm text-[#F8F5F0] placeholder:text-[#b8a898]/60 focus:outline-none focus:border-[#c9a227]";
const LABEL_CLASS = "block text-xs font-medium text-[#b8a898] mb-1.5";

interface FormState {
  fullName: string;
  email: string;
  phone: string;
  companyName: string;
  website: string;
  industry: string;
  yearsInBusiness: string;
  tier: "starter" | "growth" | "vip";
  implementationAmountCents: string;
  implementationDate: string;
  monthlyRevenueRange: string;
  teamSize: string;
  primaryOffer: string;
  biggestChallenge: string;
  weakestDimension: string;
  loginEmail: string;
  timezone: string;
  preferredCallTime: string;
  year1AgreementAccepted: boolean;
}

const INITIAL: FormState = {
  fullName: "",
  email: "",
  phone: "",
  companyName: "",
  website: "",
  industry: "",
  yearsInBusiness: "",
  tier: "starter",
  implementationAmountCents: "",
  implementationDate: "",
  monthlyRevenueRange: "",
  teamSize: "",
  primaryOffer: "",
  biggestChallenge: "",
  weakestDimension: "",
  loginEmail: "",
  timezone: "",
  preferredCallTime: "",
  year1AgreementAccepted: false,
};

const DIMENSIONS = [
  "Marketing", "Sales", "Operations", "Finance", "Team", "Systems",
  "Leadership", "Vision", "Product", "Client Experience", "Legal", "Sustainability",
];

type Result = { success: true; isNewAccount: boolean; gcTagStatus: string; loginUrl: string | null } | null;

export function NewClientForm() {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [state, setState] = useState<"idle" | "busy" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [result, setResult] = useState<Result>(null);
  const [copied, setCopied] = useState(false);
  const [justPrefilled, setJustPrefilled] = useState(false);

  // Picked up from the contact lookup panel above — merges over whatever's
  // already typed rather than replacing it, and stays fully editable so
  // Marcello can confirm or correct anything live on the call.
  const { prefill, version } = useProspect();
  useEffect(() => {
    if (!prefill || version === 0) return;
    setForm((prev) => ({
      ...prev,
      ...(prefill.fullName ? { fullName: prefill.fullName } : {}),
      ...(prefill.email ? { email: prefill.email } : {}),
      ...(prefill.phone ? { phone: prefill.phone } : {}),
      ...(prefill.companyName ? { companyName: prefill.companyName } : {}),
      ...(prefill.biggestChallenge ? { biggestChallenge: prefill.biggestChallenge } : {}),
    }));
    setJustPrefilled(true);
    setTimeout(() => setJustPrefilled(false), 2500);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "busy") return;
    if (!form.year1AgreementAccepted) {
      setState("error");
      setErrorMsg("The year-1 agreement must be acknowledged before creating the account.");
      return;
    }
    setState("busy");
    setErrorMsg("");
    try {
      const res = await fetch("/api/sales/onboard-client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          implementationAmountCents: form.implementationAmountCents
            ? Math.round(parseFloat(form.implementationAmountCents) * 100)
            : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to onboard client");
      setResult(data);
      setState("idle");
    } catch (err) {
      setState("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  function copyLoginUrl() {
    if (!result?.loginUrl) return;
    navigator.clipboard.writeText(result.loginUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  if (result) {
    return (
      <section className="mb-14 rounded-2xl border border-[#c9a227]/40 bg-[#1C2236] p-6">
        <h2 className="text-xl font-semibold text-[#F8F5F0]">
          {result.isNewAccount ? "Account created" : "Account updated"} — {form.fullName}
        </h2>
        <p className="mt-2 text-sm text-[#b8a898]">
          Global Control tag:{" "}
          <span className={result.gcTagStatus === "tagged" ? "text-[#7FC4C9]" : "text-[#E3C27C]"}>
            {result.gcTagStatus === "tagged" ? "applied" : result.gcTagStatus}
          </span>
          {result.gcTagStatus !== "tagged" && (
            <span className="text-[#b8a898]"> — check GC_CLIENT_TAG_ID is configured</span>
          )}
        </p>

        {result.loginUrl ? (
          <div className="mt-4">
            <p className="text-xs text-[#b8a898] mb-2">
              Send this link to the client — it lets them set their own password and sign in.
              There&apos;s no automatic email yet, so copy and send it yourself.
            </p>
            <div className="flex gap-2 flex-wrap">
              <input
                readOnly
                value={result.loginUrl}
                className="flex-1 min-w-[240px] rounded-lg border border-[#F3EEE4]/20 bg-[#141826] px-3 py-2 text-xs text-[#b8a898]"
                onFocus={(e) => e.currentTarget.select()}
              />
              <button
                type="button"
                onClick={copyLoginUrl}
                className="rounded-lg bg-gradient-to-r from-[#D4AF63] to-[#c9a227] text-[#1a2b4a] font-semibold px-4 py-2 text-sm"
              >
                {copied ? "Copied" : "Copy link"}
              </button>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm text-[#E3C27C]">
            {result.isNewAccount ? "Account created" : "Account updated"}, but the login link
            couldn&apos;t be generated — have them use &ldquo;Forgot password&rdquo; at /login with{" "}
            {form.loginEmail || form.email}.
          </p>
        )}

        <button
          type="button"
          onClick={() => {
            setForm(INITIAL);
            setResult(null);
          }}
          className="mt-6 text-xs text-[#b8a898] underline"
        >
          Onboard another client
        </button>
      </section>
    );
  }

  return (
    <section className="mb-14">
      <h2 className="text-2xl font-semibold text-[#F8F5F0] mb-2">New Client Onboarding</h2>
      <p className="text-sm text-[#b8a898] max-w-2xl mb-6">
        Fill this out before the end of the call. Creates their Command Suite login if they
        don&apos;t already have one — or updates their existing account if they do — tags their
        existing Global Control contact as a client, and saves the business info from this call.
      </p>

      {justPrefilled && (
        <p className="mb-4 text-sm text-[#7FC4C9]">
          &#10003; Filled in from their Global Control record below &mdash; check it over and fill in the rest.
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border border-[#F3EEE4]/12 bg-[#1C2236] p-5">
          <h3 className="text-sm font-semibold text-[#F8F5F0] mb-4">Contact &amp; business basics</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={LABEL_CLASS}>Full name *</label>
              <input required className={FIELD_CLASS} value={form.fullName} onChange={(e) => set("fullName", e.target.value)} />
            </div>
            <div>
              <label className={LABEL_CLASS}>Email * (matches their existing Global Control contact)</label>
              <input required type="email" className={FIELD_CLASS} value={form.email} onChange={(e) => set("email", e.target.value)} />
            </div>
            <div>
              <label className={LABEL_CLASS}>Phone</label>
              <input className={FIELD_CLASS} value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </div>
            <div>
              <label className={LABEL_CLASS}>Company name</label>
              <input className={FIELD_CLASS} value={form.companyName} onChange={(e) => set("companyName", e.target.value)} />
            </div>
            <div>
              <label className={LABEL_CLASS}>Website</label>
              <input className={FIELD_CLASS} value={form.website} onChange={(e) => set("website", e.target.value)} />
            </div>
            <div>
              <label className={LABEL_CLASS}>Industry / niche</label>
              <input className={FIELD_CLASS} value={form.industry} onChange={(e) => set("industry", e.target.value)} />
            </div>
            <div>
              <label className={LABEL_CLASS}>Years in business</label>
              <input className={FIELD_CLASS} value={form.yearsInBusiness} onChange={(e) => set("yearsInBusiness", e.target.value)} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#F3EEE4]/12 bg-[#1C2236] p-5">
          <h3 className="text-sm font-semibold text-[#F8F5F0] mb-4">Plan &amp; engagement</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={LABEL_CLASS}>Tier *</label>
              <select
                required
                className={FIELD_CLASS}
                value={form.tier}
                onChange={(e) => set("tier", e.target.value as FormState["tier"])}
              >
                <option value="starter">Starter</option>
                <option value="growth">Growth</option>
                <option value="vip">VIP</option>
              </select>
            </div>
            <div>
              <label className={LABEL_CLASS}>Implementation fee paid ($)</label>
              <input
                type="number"
                step="0.01"
                className={FIELD_CLASS}
                value={form.implementationAmountCents}
                onChange={(e) => set("implementationAmountCents", e.target.value)}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Implementation date</label>
              <input
                type="date"
                className={FIELD_CLASS}
                value={form.implementationDate}
                onChange={(e) => set("implementationDate", e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#F3EEE4]/12 bg-[#1C2236] p-5">
          <h3 className="text-sm font-semibold text-[#F8F5F0] mb-4">Business snapshot</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={LABEL_CLASS}>Current monthly revenue (range)</label>
              <input placeholder="e.g. $5k–10k" className={FIELD_CLASS} value={form.monthlyRevenueRange} onChange={(e) => set("monthlyRevenueRange", e.target.value)} />
            </div>
            <div>
              <label className={LABEL_CLASS}>Team size</label>
              <input placeholder="e.g. just me, or 3 contractors" className={FIELD_CLASS} value={form.teamSize} onChange={(e) => set("teamSize", e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className={LABEL_CLASS}>Primary offer — what they actually sell</label>
              <input className={FIELD_CLASS} value={form.primaryOffer} onChange={(e) => set("primaryOffer", e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className={LABEL_CLASS}>Their #1 challenge right now</label>
              <textarea rows={3} className={FIELD_CLASS} value={form.biggestChallenge} onChange={(e) => set("biggestChallenge", e.target.value)} />
            </div>
            <div>
              <label className={LABEL_CLASS}>Weakest dimension (optional)</label>
              <select className={FIELD_CLASS} value={form.weakestDimension} onChange={(e) => set("weakestDimension", e.target.value)}>
                <option value="">Not sure yet</option>
                {DIMENSIONS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#F3EEE4]/12 bg-[#1C2236] p-5">
          <h3 className="text-sm font-semibold text-[#F8F5F0] mb-4">Logistics</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={LABEL_CLASS}>Login email (if different)</label>
              <input type="email" placeholder={form.email || "defaults to email above"} className={FIELD_CLASS} value={form.loginEmail} onChange={(e) => set("loginEmail", e.target.value)} />
            </div>
            <div>
              <label className={LABEL_CLASS}>Timezone</label>
              <input placeholder="e.g. America/Denver" className={FIELD_CLASS} value={form.timezone} onChange={(e) => set("timezone", e.target.value)} />
            </div>
            <div>
              <label className={LABEL_CLASS}>Preferred coaching call day/time</label>
              <input className={FIELD_CLASS} value={form.preferredCallTime} onChange={(e) => set("preferredCallTime", e.target.value)} />
              <a
                href="https://app.globalcontrol.io/appointment-booking/test-calendar"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1.5 inline-block text-xs text-[#E3C27C] underline"
              >
                Schedule first 1:1 time on Babs&apos;s calendar &rarr;
              </a>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#c9a227]/40 bg-[#1C2236] p-5">
          <label className="flex items-start gap-3 text-sm text-[#d8d3c8] cursor-pointer">
            <input
              type="checkbox"
              className="mt-1"
              checked={form.year1AgreementAccepted}
              onChange={(e) => set("year1AgreementAccepted", e.target.checked)}
            />
            <span>
              Client has acknowledged the{" "}
              <a
                href="/legal/year-1-agreement"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#E3C27C] underline"
              >
                year-1 commitment terms
              </a>
              . *
            </span>
          </label>
        </div>

        {state === "error" && (
          <p className="text-sm text-red-300">{errorMsg}</p>
        )}

        <button
          type="submit"
          disabled={state === "busy"}
          className="rounded-lg bg-gradient-to-r from-[#D4AF63] to-[#c9a227] text-[#1a2b4a] font-semibold px-6 py-3 text-sm disabled:opacity-60"
        >
          {state === "busy" ? "Saving…" : "Save client & tag contact"}
        </button>
      </form>
    </section>
  );
}
