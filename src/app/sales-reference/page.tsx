import type { Metadata } from "next";
import { Suspense } from "react";
import { SalesScript } from "./SalesScript";
import { NewClientForm } from "./NewClientForm";
import { ContactLookup } from "./ContactLookup";
import { ProspectProvider } from "./ProspectContext";
import { CombinedCheckoutButton } from "./CombinedCheckoutButton";

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
  emailAccounts: string;
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
    emailAccounts: "1 connected email account",
    implementationUrl: "https://buy.stripe.com/6oUbJ22JxeB511caGS4ow05",
    monthlyUrl: "https://buy.stripe.com/6oUeVeesfgJdbFQcP04ow02",
  },
  {
    id: "growth",
    name: "Growth",
    tagline: "Get hands-on help implementing it — a monthly hand on the wheel.",
    monthly: "$497/mo",
    implementation: "$2,997",
    emailAccounts: "3 connected email accounts",
    implementationUrl: "https://buy.stripe.com/fZu5kE0BpgJd39k4iu4ow04",
    monthlyUrl: "https://buy.stripe.com/eVq4gA83RboT8tE5my4ow01",
  },
  {
    id: "vip",
    name: "VIP",
    tagline: "Have it built with you, at your side — white-glove, room to run everything.",
    monthly: "$997/mo",
    implementation: "$4,997",
    emailAccounts: "Unlimited connected email accounts",
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
            &ldquo;Send combined checkout&rdquo; puts the Implementation Fee and the monthly
            subscription in one cart — the client pays the Implementation Fee now, and monthly
            billing is already set up to begin automatically about 30 days later.
            The <strong className="text-[#F3EEE4]">FIRSTMONTHFREE</strong> discount is applied
            for you — nothing for the client to type.
          </p>
        </div>

        <ProspectProvider>
        <Suspense fallback={null}>
          <ContactLookup />
        </Suspense>

        <SalesScript />

        <h2 className="text-2xl font-semibold text-[#F8F5F0] mb-2">Pricing</h2>
        <p className="text-sm text-[#b8a898] max-w-2xl mb-6">
          What actually separates the tiers: Starter is built for one business running lean; Growth
          gives you room to grow — three businesses, monthly 1:1 coaching, and more AI horsepower;
          VIP removes every limit and puts a dedicated, white-glove team behind you.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TIERS.map((tier) => (
            <div key={tier.id} className="rounded-2xl border border-[#F3EEE4]/12 bg-[#1C2236] p-6 flex flex-col">
              <h3 className="text-lg font-semibold text-[#F8F5F0]">{tier.name}</h3>
              <p className="text-sm text-[#b8a898] mt-1 min-h-[40px]">{tier.tagline}</p>

              <div className="mt-4">
                <span className="text-xs uppercase tracking-wide text-[#b8a898]">Implementation (one-time)</span>
                <div className="text-3xl font-bold text-[#F8F5F0] mt-0.5">{tier.implementation}</div>
                <p className="text-xs text-[#b8a898] mt-0.5">+ {tier.monthly} after implementation</p>
                <p className="text-xs text-[#E3C27C] mt-2">{tier.emailAccounts}</p>
              </div>

              <CombinedCheckoutButton
                tier={tier.id as "starter" | "growth" | "vip"}
                implementationDisplay={tier.implementation}
                monthlyDisplay={tier.monthly}
              />

              <details className="mt-4 pt-4 border-t border-[#F3EEE4]/10 group">
                <summary className="text-xs uppercase tracking-wide text-[#b8a898] cursor-pointer select-none">
                  Or send separately ▾
                </summary>
                <div className="mt-3 space-y-3">
                  <a
                    href={tier.implementationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-center rounded-lg border border-[#c9a227]/50 text-[#E3C27C] px-4 py-2 text-sm font-medium hover:bg-[#c9a227]/10 transition-colors"
                  >
                    Charge Implementation only — {tier.implementation}
                  </a>
                  <div>
                    <a
                      href={tier.monthlyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-xs text-[#E3C27C] underline"
                    >
                      Monthly billing link only
                    </a>
                    <p className="mt-1 text-[11px] text-[#b8a898]">
                      Give them code{" "}
                      <span className="font-mono font-semibold text-[#c9a227]">FIRSTMONTHFREE</span>{" "}
                      at checkout — delays their first charge one cycle.
                    </p>
                  </div>
                </div>
              </details>
            </div>
          ))}
        </div>

        <p className="mt-10 mb-14 text-xs text-[#b8a898]/80">
          &ldquo;Send combined checkout&rdquo; creates a fresh Stripe Checkout Session per click —
          the client enters their own card there. The &ldquo;Or send separately&rdquo; links use
          the same static Payment Links live on the Billing tab and create nothing new.
        </p>

        <NewClientForm />
        </ProspectProvider>
      </div>
    </main>
  );
}
