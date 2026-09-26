import type { Metadata } from "next";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { StarterSignupForm } from "./StarterSignupForm";
import { emailAccountsLabel } from "@/lib/planLabels";

export const metadata: Metadata = {
  title: "Get Started — LifeCharter Command Suite",
  description: "Start on Starter today. Growth and VIP are a conversation, not a checkout.",
};

export const dynamic = "force-dynamic";

interface PlanRow {
  id: string;
  name: string;
  description: string | null;
  price_monthly: number;
  onboarding_fee: number | null;
  capabilities: { mailboxes?: number } | null;
}

function usd(cents: number): string {
  return `$${Math.round(cents / 100).toLocaleString()}`;
}

const TAGLINES: Record<string, string> = {
  starter: "Find your clarity in the cohort — self-driven, running one business.",
  growth: "Get hands-on help implementing it — a monthly hand on the wheel.",
  vip: "Have it built with you, at your side — white-glove, room to run everything.",
};

async function getPlans(): Promise<PlanRow[]> {
  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  const { data } = await supabase
    .from("plans")
    .select("id, name, description, price_monthly, onboarding_fee, capabilities")
    .eq("is_active", true)
    .order("price_monthly", { ascending: true });
  return data ?? [];
}

export default async function GetStartedPage({
  searchParams,
}: {
  searchParams: { src?: string };
}) {
  const plans = await getPlans();
  const starter = plans.find((p) => p.id === "starter");
  const others = plans.filter((p) => p.id !== "starter");
  const src = searchParams.src;
  const websiteConsultHref = src ? `/schedule/website?src=${encodeURIComponent(src)}` : "/schedule/website";

  return (
    <main className="min-h-screen bg-[#141826] text-[#F3EEE4]">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <div className="text-center mb-14">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c9a227]">
            LifeCharter Command Suite
          </p>
          <h1 className="mt-3 text-4xl sm:text-5xl font-semibold text-[#F8F5F0]">Get started</h1>
          <p className="mt-4 text-[#b8a898] max-w-xl mx-auto">
            Executive coaching + the full Command Suite, together. Starter is the self-serve
            doorway — Growth and VIP are a conversation, not a checkout.
          </p>
          <p className="mt-3 text-sm text-[#b8a898]/80 max-w-xl mx-auto">
            Starter is built for one business running lean; Growth gives you room to grow — three
            businesses, monthly 1:1 coaching, and more AI horsepower; VIP removes every limit and
            puts a dedicated, white-glove team behind you.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {starter && (
            <div className="relative rounded-2xl border-2 border-[#c9a227] bg-[#1C2236] p-6">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#c9a227] text-[#1a2b4a] text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
                Start here
              </span>
              <h3 className="text-lg font-semibold text-[#F8F5F0] mt-2">{starter.name}</h3>
              <p className="text-sm text-[#b8a898] mt-1 min-h-[40px]">{TAGLINES.starter}</p>
              <div className="mt-4 flex items-baseline">
                <span className="text-3xl font-bold text-[#F8F5F0]">{usd(starter.price_monthly)}</span>
                <span className="text-[#b8a898] ml-1">/month</span>
              </div>
              <p className="text-xs text-[#b8a898] mt-1">
                + {usd(starter.onboarding_fee ?? 0)} one-time implementation
              </p>
              <p className="text-xs text-[#E3C27C] mt-3">{emailAccountsLabel(starter.capabilities?.mailboxes)}</p>
              <div className="mt-6">
                <StarterSignupForm sessionSource={src} />
              </div>
            </div>
          )}

          {others.map((plan) => (
            <div key={plan.id} className="rounded-2xl border border-[#F3EEE4]/12 bg-[#1C2236]/60 p-6">
              <h3 className="text-lg font-semibold text-[#F8F5F0]">{plan.name}</h3>
              <p className="text-sm text-[#b8a898] mt-1 min-h-[40px]">
                {TAGLINES[plan.id] ?? plan.description ?? ""}
              </p>
              <div className="mt-4 flex items-baseline">
                <span className="text-3xl font-bold text-[#F8F5F0]">{usd(plan.price_monthly)}</span>
                <span className="text-[#b8a898] ml-1">/month</span>
              </div>
              <p className="text-xs text-[#b8a898] mt-1">
                + {usd(plan.onboarding_fee ?? 0)} one-time implementation
              </p>
              <p className="text-xs text-[#E3C27C] mt-3">{emailAccountsLabel(plan.capabilities?.mailboxes)}</p>
              <a
                href={websiteConsultHref}
                className="mt-6 block text-center rounded-lg border border-[#c9a227]/50 text-[#E3C27C] px-4 py-2.5 text-sm font-medium hover:bg-[#c9a227]/10 transition-colors"
              >
                Book an Executive Consultation
              </a>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-[#b8a898] mt-10">
          Already have an account? <a href="/login" className="underline">Sign in</a>
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-[#b8a898]/60">
          <a href="/legal/terms-of-sale" className="hover:text-[#b8a898]">Terms of Sale</a>
          <a href="/legal/year-1-agreement" className="hover:text-[#b8a898]">Year-1 Agreement</a>
          <a href="/legal/privacy-policy" className="hover:text-[#b8a898]">Privacy Policy</a>
        </div>
      </div>
    </main>
  );
}
