"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CheckCircle, Sparkles } from "lucide-react";

interface PlanRow {
  id: string;
  name: string;
  description: string | null;
  price_monthly: number; // cents
  price_yearly: number | null; // cents — pay-in-full, all-in first year
  onboarding_fee: number | null; // cents — one-time implementation
  capabilities: Record<string, unknown>;
}
interface Current {
  planId: string;
  planName: string | null;
  status: string;
  currentPeriodEnd: string | null;
  comped: boolean;
}

type Cycle = "monthly" | "annual";

// Positioning line + what scales per tier. Every tier includes the full Command
// Suite + community layer (shown once, below the cards) — this list is only the
// differentiation. Keyed by plan id.
const COPY: Record<string, { tagline: string; features: string[]; popular?: boolean }> = {
  starter: {
    tagline: "Find your clarity in the cohort — self-driven, running one business.",
    features: [
      "Weekly group coaching + weekly tech-support call",
      "2× monthly Growth Sessions + 2× monthly Hope Seat",
      "Guided, self-paced Suite setup",
      "1 business workspace · just you",
      "Standard AI for scoring and AI features",
    ],
  },
  growth: {
    tagline: "Get hands-on help implementing it — a monthly hand on the wheel.",
    popular: true,
    features: [
      "Everything in Starter, plus:",
      "1× / month 1:1 with the Alignment Architect",
      "Done-with-you kickoff intensive",
      "Priority in Hope Seat & community",
      "Up to 3 business workspaces · + 1 collaborator seat",
      "Expanded AI limits",
    ],
  },
  vip: {
    tagline: "Have it built with you, at your side — white-glove, room to run everything.",
    features: [
      "Everything in Growth, plus:",
      "2× / month 1:1 + async access to the Architect",
      "White-glove, ongoing done-with-you setup",
      "First seat in Hope Seat & community",
      "Unlimited business workspaces · team seats",
      "Priority AI — highest limits",
      "Early access to new modules",
    ],
  },
};

// Included in EVERY tier — nothing is locked.
const SUITE_INCLUDED = [
  "12 live business dimensions",
  "8 operational pillars",
  "3 assessments — Profit Architecture, Brain, Soul",
  "Daily Compass operating surface",
  "Live finance ledger",
  "Sales pipeline & conversion tracking",
  "Business, Marketing, Sales & Forecasting plans",
  "Scripts & templates library",
  "Guided step-by-step setup",
];
const COMMUNITY_INCLUDED = [
  "Weekly community / group coaching call (1:1 as needed)",
  "Weekly tech-support call for the Command Suite",
  "2× monthly Growth Sessions (cohort learning)",
  "2× monthly Hope Seat (bring a real challenge; worked live)",
  "Standalone private community (off Facebook)",
];

const ROADMAP = [
  "Separate branded client workspaces",
  "Full white-label",
  "Custom AI agents tuned to your business",
];

function usd(cents: number): string {
  return `$${Math.round(cents / 100).toLocaleString()}`;
}

export default function BillingPanel() {
  const [plans, setPlans] = useState<PlanRow[] | null>(null);
  const [current, setCurrent] = useState<Current | null>(null);
  const [cycle, setCycle] = useState<Cycle>("monthly");

  useEffect(() => {
    fetch("/api/billing?ts=" + Date.now(), { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        setPlans(Array.isArray(d?.plans) ? d.plans : []);
        setCurrent(d?.current ?? null);
      })
      .catch(() => setPlans([]));
  }, []);

  if (plans === null) {
    return <p className="text-sm text-[#b8a898]">Loading plans…</p>;
  }

  return (
    <div className="space-y-8">
      {/* Current plan banner */}
      {current && (
        <Card className="bg-gradient-to-br from-[#c9a227]/20 to-[#7b6b8d]/20 border-[#c9a227]/30">
          <CardContent className="p-6">
            <p className="text-sm text-[#b8a898]">Current plan</p>
            <h3 className="text-2xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">
              {current.planName ?? current.planId}
            </h3>
            <p className="text-sm text-[#b8a898] mt-1">
              {current.comped
                ? "Complimentary — full access, no billing"
                : current.currentPeriodEnd
                ? `Renews ${new Date(current.currentPeriodEnd).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`
                : "Active"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Header + billing-cycle toggle */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
          <div>
            <h3 className="text-xl font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Plans</h3>
            <p className="text-sm text-[#b8a898] mt-0.5">
              Executive coaching + the full Command Suite, together. Every tier includes the whole Suite —
              tiers scale on coaching depth and capacity.
            </p>
          </div>
          {/* Monthly vs pay-in-full */}
          <div className="inline-flex rounded-full border border-[#1a2b4a]/15 bg-[#1a2b4a]/5 p-1 self-start">
            <button
              onClick={() => setCycle("monthly")}
              className={`px-4 py-1.5 text-sm rounded-full transition-colors ${
                cycle === "monthly"
                  ? "bg-white dark:bg-[#1a2b4a] text-[#1a2b4a] dark:text-[#F8F5F0] shadow-sm font-medium"
                  : "text-[#b8a898]"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setCycle("annual")}
              className={`px-4 py-1.5 text-sm rounded-full transition-colors ${
                cycle === "annual"
                  ? "bg-white dark:bg-[#1a2b4a] text-[#1a2b4a] dark:text-[#F8F5F0] shadow-sm font-medium"
                  : "text-[#b8a898]"
              }`}
            >
              Pay in full · save ~20%
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {plans.map((plan) => {
            const copy = COPY[plan.id] ?? { tagline: plan.description ?? "", features: [] };
            const isCurrent = current?.planId === plan.id;
            const impl = plan.onboarding_fee ?? 0;
            const annual = plan.price_yearly ?? null;
            // Year-one on the monthly path = implementation + 12 months.
            const monthlyYearOne = impl + plan.price_monthly * 12;
            const savings = annual !== null ? monthlyYearOne - annual : 0;

            return (
              <div key={plan.id} className="relative pt-3">
                {copy.popular && !isCurrent && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10">
                    <span className="bg-[#c9a227] text-[#1a2b4a] text-xs font-semibold px-3 py-1 rounded-full shadow-sm whitespace-nowrap">
                      Most popular
                    </span>
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10">
                    <span className="bg-[#2E7C83] text-white text-xs font-semibold px-3 py-1 rounded-full shadow-sm whitespace-nowrap">
                      Your plan
                    </span>
                  </div>
                )}
                <Card className={`relative h-full ${copy.popular ? "border-[#c9a227] border-2" : ""}`}>
                  <CardContent className="p-6">
                    <h4 className="text-lg font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{plan.name}</h4>
                    <p className="text-sm text-[#b8a898] mt-0.5 min-h-[40px]">{copy.tagline}</p>

                    {/* Price */}
                    {cycle === "monthly" ? (
                      <>
                        <div className="mt-3 flex items-baseline">
                          <span className="text-3xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">
                            {usd(plan.price_monthly)}
                          </span>
                          <span className="text-[#b8a898] ml-1">/month</span>
                        </div>
                        <p className="text-xs text-[#b8a898] mt-1">
                          + {usd(impl)} one-time implementation
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="mt-3 flex items-baseline">
                          <span className="text-3xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">
                            {annual !== null ? usd(annual) : "—"}
                          </span>
                          <span className="text-[#b8a898] ml-1">first year</span>
                        </div>
                        <p className="text-xs text-[#b8a898] mt-1">
                          Implementation + 12 months, paid upfront
                        </p>
                        {annual !== null && savings > 0 && (
                          <p className="text-xs font-medium text-[#2E7C83] mt-1">
                            Save {usd(savings)} vs. paying monthly
                          </p>
                        )}
                      </>
                    )}

                    <ul className="mt-4 space-y-2">
                      {copy.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-[#2E7C83] mt-0.5 flex-shrink-0" />
                          <span className="text-[#1a2b4a] dark:text-[#F8F5F0]">{f}</span>
                        </li>
                      ))}
                    </ul>

                    {isCurrent ? (
                      <Button className="w-full mt-6" variant="outline" disabled>
                        Your current plan
                      </Button>
                    ) : (
                      <a
                        href={`mailto:babs@lifecharter.architecture?subject=${encodeURIComponent(plan.name + " plan")}`}
                        className="block mt-6"
                      >
                        <Button className="w-full" variant={copy.popular ? "primary" : "outline"}>
                          Get started with {plan.name}
                        </Button>
                      </a>
                    )}
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-[#b8a898] mt-4">
          Your first year is a commitment; cancel anytime after that. The implementation fee is a one-time charge
          collected at signup (or included in the pay-in-full total).
        </p>
      </div>

      {/* Included in every tier */}
      <div className="rounded-xl border border-[#1a2b4a]/10 bg-[#1a2b4a]/[0.03] p-6">
        <h4 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0] mb-1">Included in every tier</h4>
        <p className="text-sm text-[#b8a898] mb-4">The full Command Suite — nothing is locked.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#c9a227] mb-2">Command Suite</p>
            <ul className="space-y-1.5">
              {SUITE_INCLUDED.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-[#2E7C83] mt-0.5 flex-shrink-0" />
                  <span className="text-[#1a2b4a] dark:text-[#F8F5F0]">{f}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#c9a227] mb-2">Coaching community</p>
            <ul className="space-y-1.5">
              {COMMUNITY_INCLUDED.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-[#2E7C83] mt-0.5 flex-shrink-0" />
                  <span className="text-[#1a2b4a] dark:text-[#F8F5F0]">{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Roadmap */}
      <div className="rounded-xl border border-dashed border-[#c9a227]/40 p-5">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-[#c9a227]" />
          <h4 className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">On the roadmap</h4>
        </div>
        <div className="flex flex-wrap gap-2">
          {ROADMAP.map((r) => (
            <span key={r} className="text-xs px-2.5 py-1 rounded-full bg-[#1a2b4a]/8 text-[#1a2b4a] dark:text-[#e8e4f0]">
              {r}
            </span>
          ))}
        </div>
      </div>

      <p className="text-xs text-[#b8a898]">
        Self-serve checkout and invoices are being finalized. For now, plan changes are handled directly — reach out
        and we&apos;ll get you set up.
      </p>
    </div>
  );
}
