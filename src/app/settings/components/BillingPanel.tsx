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
  onboarding_fee: number | null; // cents
  capabilities: Record<string, unknown>;
}
interface Current {
  planId: string;
  planName: string | null;
  status: string;
  currentPeriodEnd: string | null;
  comped: boolean;
}

// Marketing verbiage per tier (the launch-honest copy). Keyed by plan id.
const COPY: Record<string, { tagline: string; onboarding: string; features: string[]; popular?: boolean }> = {
  starter: {
    tagline: "For the founder building it herself",
    onboarding: "+ $1,997 one-time onboarding",
    features: [
      "Your 12-dimension business health, scored from your own assessments",
      "AI-built Business, Marketing & Sales plans — up to 10 builds or refreshes a month",
      "Monthly check-ins and a living progress trajectory",
      "Unlimited conversations with your AI business guide",
      "Your business, mapped into segments and scored dimension by dimension",
      "1 user · guided, self-paced onboarding",
    ],
  },
  growth: {
    tagline: "For the coach running more than one business",
    onboarding: "+ $2,497 one-time onboarding",
    popular: true,
    features: [
      "Everything in Starter, plus:",
      "Up to 50 plan builds or refreshes a month",
      "Run multiple businesses side by side, each scored on its own",
      "Up to 5 users on your team",
      "Priority support",
    ],
  },
  vip: {
    tagline: "For founders who want it built with them",
    onboarding: "No onboarding fee — the hands-on work is the point",
    features: [
      "Everything in Growth, plus:",
      "Unlimited plan builds and re-scores",
      "Unlimited businesses and team members",
      "Dedicated Done-With-You implementation — we build it with you",
      "Direct, priority access when you need us",
    ],
  },
};

const ROADMAP = [
  "Separate branded client workspaces",
  "Full white-label",
  "Custom AI agents tuned to your business",
  "Operations & review center",
];

function usd(cents: number): string {
  return `$${Math.round(cents / 100).toLocaleString()}`;
}

export default function BillingPanel() {
  const [plans, setPlans] = useState<PlanRow[] | null>(null);
  const [current, setCurrent] = useState<Current | null>(null);

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

      {/* Pricing plans */}
      <div>
        <h3 className="text-xl font-semibold text-[#1a2b4a] dark:text-[#F8F5F0] mb-6">Plans</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const copy = COPY[plan.id] ?? { tagline: plan.description ?? "", onboarding: "", features: [] };
            const isCurrent = current?.planId === plan.id;
            return (
              <Card key={plan.id} className={`relative ${copy.popular ? "border-[#c9a227] border-2" : ""}`}>
                {copy.popular && !isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-[#c9a227] text-[#1a2b4a] text-xs font-semibold px-3 py-1 rounded-full">
                      Most popular
                    </span>
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-[#2E7C83] text-white text-xs font-semibold px-3 py-1 rounded-full">
                      Your plan
                    </span>
                  </div>
                )}
                <CardContent className="p-6">
                  <h4 className="text-lg font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{plan.name}</h4>
                  <p className="text-sm text-[#b8a898] mt-0.5">{copy.tagline}</p>
                  <div className="mt-3 flex items-baseline">
                    <span className="text-3xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">
                      {usd(plan.price_monthly)}
                    </span>
                    <span className="text-[#b8a898] ml-1">/month</span>
                  </div>
                  {copy.onboarding && <p className="text-xs text-[#b8a898] mt-1">{copy.onboarding}</p>}

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
                        Talk to us about {plan.name}
                      </Button>
                    </a>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Roadmap */}
      <div className="rounded-xl border border-dashed border-[#c9a227]/40 p-5">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-[#c9a227]" />
          <h4 className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">Coming soon to Growth &amp; VIP</h4>
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
