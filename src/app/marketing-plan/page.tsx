import { Metadata } from "next";
import Link from "next/link";
import { Compass } from "lucide-react";
import PlanWorkspace from "@/components/plans/PlanWorkspace";
import { socialPlannerEnabled } from "@/lib/social/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Marketing Plan | LifeCharter Command Suite",
  description: "Your living marketing plan — built from your assessments with AI.",
};

export default async function MarketingPlanPage() {
  const social = await socialPlannerEnabled();
  return (
    <PlanWorkspace
      planType="marketing"
      extra={
        social && (
          <Link
            href="/marketing-plan/social-planner"
            className="mb-6 flex items-center gap-4 rounded-2xl border border-[#D4AF63]/50 bg-[#FAF8F3] dark:bg-[#1E2A48] p-4 font-ui hover:border-[#D4AF63]"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0F1A38]">
              <Compass className="h-5 w-5 text-[#D4AF63]" />
            </span>
            <span className="flex-1">
              <span className="block font-display text-xl font-semibold text-[#0F1A38] dark:text-[#FAF8F3]">Social Planner</span>
              <span className="block text-sm text-[#334155] dark:text-[#CBD5E1]">Weekly goals, audience growth, offers and voice for your Content Calendar.</span>
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#8C6D24] dark:text-[#D4AF63]">Open →</span>
          </Link>
        )
      }
    />
  );
}
