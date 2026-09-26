import { Metadata } from "next";
import Link from "next/link";
import { socialPlannerEnabled } from "@/lib/social/server";
import { SocialPlanner } from "@/components/social/SocialPlanner";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Social Planner | LifeCharter Command Suite",
  description: "Weekly social goals, audience growth, offers and voice, feeding your Content Calendar.",
};

export default async function SocialPlannerPage() {
  if (!(await socialPlannerEnabled())) {
    return (
      <div className="py-16 px-4 max-w-xl mx-auto text-center font-ui">
        <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#8C6D24]">Coming soon</p>
        <h1 className="font-display text-4xl font-semibold text-[#0F1A38] dark:text-[#FAF8F3] mt-2">Social Planner</h1>
        <p className="mt-3 text-sm text-[#334155] dark:text-[#CBD5E1]">
          Your Social Planner is on its way and will appear here soon, included in your Command Suite subscription.
        </p>
        <Link href="/marketing-plan" className="mt-6 inline-block text-sm text-[#0F1A38] underline dark:text-[#FAF8F3]">
          Back to Marketing Plan
        </Link>
      </div>
    );
  }
  return <SocialPlanner />;
}
