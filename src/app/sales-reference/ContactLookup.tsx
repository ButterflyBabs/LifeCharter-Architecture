"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useProspect } from "./ProspectContext";

interface ContactSummary {
  name: string;
  email: string;
  phone?: string;
  status?: string;
}

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

  const [query, setQuery] = useState(params.get("email") || params.get("name") || "");
  const [searchState, setSearchState] = useState<"idle" | "busy" | "error">("idle");
  const [results, setResults] = useState<ContactSummary[] | null>(null);

  const [detail, setDetail] = useState<LookupResult | null>(null);
  const [detailState, setDetailState] = useState<"idle" | "busy" | "error">("idle");
  const [used, setUsed] = useState(false);

  const fetchDetail = useCallback(async (email: string) => {
    setDetailState("busy");
    setDetail(null);
    setUsed(false);
    try {
      const res = await fetch(`/api/sales/lookup-contact?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lookup failed");
      setDetail(data);
      setDetailState("idle");
    } catch {
      setDetailState("error");
    }
  }, []);

  const search = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!query.trim() || searchState === "busy") return;
      setSearchState("busy");
      setResults(null);
      setDetail(null);
      try {
        const res = await fetch(`/api/sales/search-contacts?q=${encodeURIComponent(query.trim())}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Search failed");
        const found: ContactSummary[] = data.results || [];
        if (found.length === 1) {
          // A single match — skip the extra click and go straight to detail.
          setResults(null);
          fetchDetail(found[0].email);
        } else {
          setResults(found);
        }
        setSearchState("idle");
      } catch {
        setSearchState("error");
      }
    },
    [query, searchState, fetchDetail]
  );

  // A link with ?email=... (e.g. from a personalized email) skips straight
  // to the full record instead of making Marcello search and click again.
  useEffect(() => {
    const email = params.get("email");
    if (email) fetchDetail(email);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function useContact() {
    if (!detail?.found) return;
    const mapped: Record<string, string> = {};
    for (const cf of detail.customFields || []) {
      const key = FIELD_MAP[cf.name];
      if (key) mapped[key] = cf.value;
    }
    setProspect({
      fullName: detail.name,
      email: detail.email,
      phone: detail.phone,
      ...mapped,
    });
    setUsed(true);
  }

  return (
    <section className="mb-10 rounded-2xl border border-[#F3EEE4]/12 bg-[#1C2236] p-5">
      <h3 className="text-sm font-semibold text-[#F8F5F0] mb-1">Look up a prospect</h3>
      <p className="text-xs text-[#b8a898] mb-4">
        Search by name or email — pulls their real Global Control record before or during the call.
      </p>
      <form onSubmit={search} className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          placeholder="Name or email"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 rounded-lg border border-[#F3EEE4]/20 bg-[#141826] px-3 py-2.5 text-sm text-[#F8F5F0] placeholder:text-[#b8a898]/60 focus:outline-none focus:border-[#c9a227]"
        />
        <button
          type="submit"
          disabled={searchState === "busy"}
          className="rounded-lg bg-gradient-to-r from-[#D4AF63] to-[#c9a227] text-[#1a2b4a] font-semibold px-5 py-2.5 text-sm disabled:opacity-60 whitespace-nowrap"
        >
          {searchState === "busy" ? "Searching…" : "Search"}
        </button>
      </form>

      {searchState === "error" && (
        <p className="mt-3 text-sm text-red-300">Couldn&apos;t reach Global Control — try again in a moment.</p>
      )}
      {detailState === "error" && (
        <p className="mt-3 text-sm text-red-300">Couldn&apos;t load that contact — try again in a moment.</p>
      )}

      {results && results.length === 0 && (
        <p className="mt-3 text-sm text-[#E3C27C]">
          No Global Control contact matches that yet — they may not have registered for the
          MasterClass, Challenge, or a consultation before this call.
        </p>
      )}

      {results && results.length > 1 && (
        <div className="mt-3 space-y-1.5">
          <p className="text-xs text-[#b8a898]">{results.length} matches — pick one:</p>
          {results.map((r) => (
            <button
              key={r.email}
              type="button"
              onClick={() => fetchDetail(r.email)}
              className="w-full text-left rounded-lg border border-[#F3EEE4]/15 bg-[#141826] px-3 py-2 text-sm hover:border-[#c9a227]/50"
            >
              <span className="font-medium text-[#F8F5F0]">{r.name}</span>
              <span className="text-[#b8a898]">
                {" "}
                — {r.email}
                {r.phone ? ` · ${r.phone}` : ""}
              </span>
            </button>
          ))}
        </div>
      )}

      {detailState === "busy" && <p className="mt-3 text-sm text-[#b8a898]">Loading their record…</p>}

      {detail && detail.found && (
        <div className="mt-4 rounded-xl border border-[#c9a227]/30 bg-[#141826] p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-base font-semibold text-[#F8F5F0]">{detail.name}</p>
              <p className="text-xs text-[#b8a898] mt-0.5">
                {detail.email}
                {detail.phone ? ` · ${detail.phone}` : ""}
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
            {detail.status && (
              <span className="text-[10px] font-semibold uppercase tracking-wide text-[#c9a227] bg-[#c9a227]/10 px-2 py-1 rounded-full">
                {detail.status}
              </span>
            )}
          </div>

          {(fmtDate(detail.lastContactedAt) || fmtDate(detail.lastActiveAt)) && (
            <p className="text-xs text-[#b8a898]/70 mt-1">
              {fmtDate(detail.lastContactedAt) && <>Last contacted {fmtDate(detail.lastContactedAt)}</>}
              {fmtDate(detail.lastContactedAt) && fmtDate(detail.lastActiveAt) && " · "}
              {fmtDate(detail.lastActiveAt) && <>Last active {fmtDate(detail.lastActiveAt)}</>}
            </p>
          )}

          {!!detail.tags?.length && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {detail.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] font-medium text-[#F3EEE4]/80 bg-[#F3EEE4]/10 px-2 py-1 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {!!detail.customFields?.length && (
            <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 border-t border-[#F3EEE4]/10 pt-3">
              {detail.customFields.map((cf) => (
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
