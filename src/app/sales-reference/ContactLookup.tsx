"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useProspect } from "./ProspectContext";

interface LookupResult {
  found: boolean;
  name?: string;
  email?: string;
  phone?: string;
  status?: string;
  lastActiveAt?: string | null;
  lastContactedAt?: string | null;
  tags?: string[];
  customFields?: { name: string; value: string }[];
}

function fmtDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return null;
  }
}

// Custom-field names that have an obvious, unambiguous match to a New Client
// Onboarding field — the account has many other custom fields (event
// booking, assessment scores, ...) with no corresponding form field, so this
// stays a short, exact-name allowlist rather than guessing at fuzzy matches.
const FIELD_MAP: Record<string, "companyName" | "biggestChallenge"> = {
  "Company Name": "companyName",
  "Biggest Challenge": "biggestChallenge",
};

export function ContactLookup() {
  const params = useSearchParams();
  const { setProspect } = useProspect();
  const [email, setEmail] = useState(params.get("email") || "");
  const [state, setState] = useState<"idle" | "busy" | "error">("idle");
  const [result, setResult] = useState<LookupResult | null>(null);
  const [used, setUsed] = useState(false);

  function useContact() {
    if (!result?.found) return;
    const mapped: Record<string, string> = {};
    for (const cf of result.customFields || []) {
      const key = FIELD_MAP[cf.name];
      if (key) mapped[key] = cf.value;
    }
    setProspect({
      fullName: result.name,
      email: result.email,
      phone: result.phone,
      ...mapped,
    });
    setUsed(true);
  }

  async function lookup(e?: React.FormEvent) {
    e?.preventDefault();
    if (!email.trim() || state === "busy") return;
    setState("busy");
    setResult(null);
    setUsed(false);
    try {
      const res = await fetch(`/api/sales/lookup-contact?email=${encodeURIComponent(email.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lookup failed");
      setResult(data);
      setState("idle");
    } catch {
      setState("error");
    }
  }

  return (
    <section className="mb-10 rounded-2xl border border-[#F3EEE4]/12 bg-[#1C2236] p-5">
      <h3 className="text-sm font-semibold text-[#F8F5F0] mb-1">Look up a prospect</h3>
      <p className="text-xs text-[#b8a898] mb-4">
        Pulls their real Global Control record — tags, status, and any custom fields on file —
        before or during the call.
      </p>
      <form onSubmit={lookup} className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          placeholder="prospect@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 rounded-lg border border-[#F3EEE4]/20 bg-[#141826] px-3 py-2.5 text-sm text-[#F8F5F0] placeholder:text-[#b8a898]/60 focus:outline-none focus:border-[#c9a227]"
        />
        <button
          type="submit"
          disabled={state === "busy"}
          className="rounded-lg bg-gradient-to-r from-[#D4AF63] to-[#c9a227] text-[#1a2b4a] font-semibold px-5 py-2.5 text-sm disabled:opacity-60 whitespace-nowrap"
        >
          {state === "busy" ? "Looking up…" : "Look up"}
        </button>
      </form>

      {state === "error" && (
        <p className="mt-3 text-sm text-red-300">Couldn&apos;t reach Global Control — try again in a moment.</p>
      )}

      {result && !result.found && (
        <p className="mt-3 text-sm text-[#E3C27C]">
          No Global Control contact found for that email yet — they may not have registered for the
          MasterClass, Challenge, or a consultation before this call.
        </p>
      )}

      {result && result.found && (
        <div className="mt-4 rounded-xl border border-[#c9a227]/30 bg-[#141826] p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-base font-semibold text-[#F8F5F0]">{result.name}</p>
              <p className="text-xs text-[#b8a898] mt-0.5">
                {result.email}
                {result.phone ? ` · ${result.phone}` : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={useContact}
              className="rounded-lg border border-[#c9a227]/50 text-[#E3C27C] px-3 py-1.5 text-xs font-semibold hover:bg-[#c9a227]/10 whitespace-nowrap"
            >
              {used ? "✓ Added to form below" : "Use this contact ↓"}
            </button>
          </div>
          <div className="flex flex-wrap items-baseline gap-2 mt-2">
            {result.status && (
              <span className="text-[10px] font-semibold uppercase tracking-wide text-[#c9a227] bg-[#c9a227]/10 px-2 py-1 rounded-full">
                {result.status}
              </span>
            )}
          </div>

          {(fmtDate(result.lastContactedAt) || fmtDate(result.lastActiveAt)) && (
            <p className="text-xs text-[#b8a898]/70 mt-1">
              {fmtDate(result.lastContactedAt) && <>Last contacted {fmtDate(result.lastContactedAt)}</>}
              {fmtDate(result.lastContactedAt) && fmtDate(result.lastActiveAt) && " · "}
              {fmtDate(result.lastActiveAt) && <>Last active {fmtDate(result.lastActiveAt)}</>}
            </p>
          )}

          {!!result.tags?.length && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {result.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] font-medium text-[#F3EEE4]/80 bg-[#F3EEE4]/10 px-2 py-1 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {!!result.customFields?.length && (
            <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 border-t border-[#F3EEE4]/10 pt-3">
              {result.customFields.map((cf) => (
                <div key={cf.name}>
                  <dt className="text-[10px] uppercase tracking-wide text-[#b8a898]/70">{cf.name}</dt>
                  <dd className="text-sm text-[#F3EEE4] break-words">{cf.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      )}
    </section>
  );
}
