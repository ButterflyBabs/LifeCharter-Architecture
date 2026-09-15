import type { Metadata } from "next";
import { SalesScript } from "./SalesScript";

export const metadata: Metadata = {
  title: "Sales Call Reference — LifeCharter Command Suite",
  description: "Internal reference for live sales calls — correct Payment Link per tier.",
};

interface Tier {
  id: string;
  name: string;
  tagline: string;
  monthly: string;
  implementation: string;
  implementationUrl: string;
  monthlyUrl: string;
}

// Real, live Stripe Payment Links confirmed against the Billing tab Sept 15 —
// not generated dynamically, so this page never creates new Stripe objects.
// Leads with the Implementation Fee link per Babs's decision: monthly billing
// doesn't start until implementation is complete, so that's not what closes
// the sale on the call.
const TIERS: Tier[] = [
  {
    id: "starter",
    name: "Starter",
    tagline: "Find your clarity in the cohort — self-driven, running one business.",
    monthly: "$347/mo",
    implementation: "$2,497",
    implementationUrl: "https://buy.stripe.com/6oUbJ22JxeB511caGS4ow05",
    monthlyUrl: "https://buy.stripe.com/6oUeVeesfgJdbFQcP04ow02",
  },
  {
    id: "growth",
    name: "Growth",
    tagline: "Get hands-on help implementing it — a monthly hand on the wheel.",
    monthly: "$497/mo",
    implementation: "$2,997",
    implementationUrl: "https://buy.stripe.com/fZu5kE0BpgJd39k4iu4ow04",
    monthlyUrl: "https://buy.stripe.com/eVq4gA83RboT8tE5my4ow01",
  },
  {
    id: "vip",
    name: "VIP",
    tagline: "Have it built with you, at your side — white-glove, room to run everything.",
    monthly: "$997/mo",
    implementation: "$4,997",
    implementationUrl: "https://buy.stripe.com/fZu3cw83R78D7pAdT44ow03",
    monthlyUrl: "https://buy.stripe.com/6oUcN6ck7boTaBMaGS4ow00",
  },
];

export default function SalesReferencePage() {
  return (
    <main className="min-h-screen bg-[#141826] text-[#F3EEE4]">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <div className="mb-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c9a227]">
            Internal — Sales Call Reference
          </p>
          <h1 className="mt-3 text-3xl sm:text-4xl font-semibold text-[#F8F5F0]">
            LifeCharter Command Suite pricing
          </h1>
          <p className="mt-3 text-[#b8a898] max-w-2xl">
            Charge the <strong className="text-[#F3EEE4]">Implementation Fee</strong> to close on the
            call — monthly billing starts only once implementation is complete, so the monthly link
            below isn&apos;t what you send a prospect today.
          </p>
        </div>

        <SalesScript />

        <h2 className="text-2xl font-semibold text-[#F8F5F0] mb-6">Pricing</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TIERS.map((tier) => (
            <div key={tier.id} className="rounded-2xl border border-[#F3EEE4]/12 bg-[#1C2236] p-6 flex flex-col">
              <h3 className="text-lg font-semibold text-[#F8F5F0]">{tier.name}</h3>
              <p className="text-sm text-[#b8a898] mt-1 min-h-[40px]">{tier.tagline}</p>

              <div className="mt-4">
                <span className="text-xs uppercase tracking-wide text-[#b8a898]">Implementation (one-time)</span>
                <div className="text-3xl font-bold text-[#F8F5F0] mt-0.5">{tier.implementation}</div>
              </div>

              <a
                href={tier.implementationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 block text-center rounded-lg bg-gradient-to-r from-[#D4AF63] to-[#c9a227] text-[#1a2b4a] font-semibold px-4 py-2.5 text-sm"
              >
                Charge Implementation — {tier.implementation}
              </a>

              <div className="mt-6 pt-4 border-t border-[#F3EEE4]/10">
                <span className="text-xs uppercase tracking-wide text-[#b8a898]">
                  Monthly (starts after implementation)
                </span>
                <div className="text-sm text-[#b8a898] mt-0.5">{tier.monthly}</div>
                <a
                  href={tier.monthlyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-xs text-[#E3C27C] underline"
                >
                  Monthly billing link
                </a>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-10 text-xs text-[#b8a898]/80">
          Links open Stripe&apos;s hosted checkout directly — same Payment Links live on the Billing
          tab. Prospect enters their own card; nothing here creates a new Stripe object.
        </p>
      </div>
    </main>
  );
}
