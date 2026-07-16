"use client";

import { OverallBusinessHealth } from "@/components/dashboard/OverallBusinessHealth";
import { DomainAlignmentRadar } from "@/components/dashboard/DomainAlignmentRadar";
import { AIBusinessGuide } from "@/components/dashboard/AIBusinessGuide";
import { NextThreeMoves } from "@/components/dashboard/NextThreeMoves";
import { DomainScores } from "@/components/dashboard/DomainScores";
import { BusinessHealthTrend } from "@/components/dashboard/BusinessHealthTrend";
import { OperatingRhythm } from "@/components/dashboard/OperatingRhythm";
import { MilestonesMomentum } from "@/components/dashboard/MilestonesMomentum";
import { RevenueSnapshot } from "@/components/dashboard/RevenueSnapshot";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-[#1F315B] dark:text-[#F6F1E8]">
            Welcome back, Seraphina
          </h1>
          <p className="text-sm text-[#5E3B6C] dark:text-[#CDBED6]">
            Here&apos;s your business at a glance
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-sm text-[#B9A9A9]">
          <span>Last updated:</span>
          <span className="text-[#1F315B] dark:text-[#F6F1E8]">Just now</span>
        </div>
      </div>

      {/* Dashboard Grid - 3 Columns */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Row 1 */}
        <OverallBusinessHealth
          score={68}
          status="Growth"
          focusAreas={["Sales", "Finance", "Systems"]}
          description="You're building momentum. Align your systems and cash flow to scale with ease and clarity."
        />
        <DomainAlignmentRadar />
        <AIBusinessGuide
          message="You're in a strong position to grow. Strengthen your systems and cash flow predictability to move into Expansion."
          suggestions={[
            "Improve cash flow forecasting",
            "Document and automate key processes",
            "Nurture warm leads into paying clients",
          ]}
        />

        {/* Row 2 */}
        <NextThreeMoves
          moves={[
            {
              id: 1,
              title: "Increase Monthly Recurring Revenue",
              subtitle: "Build 2 new subscription offers",
              impact: "High",
            },
            {
              id: 2,
              title: "Improve Cash Flow Visibility",
              subtitle: "Set up rolling 13-week forecast",
              impact: "High",
            },
            {
              id: 3,
              title: "Streamline Client Onboarding",
              subtitle: "Create SOP and automate steps",
              impact: "Medium",
            },
          ]}
        />
        <DomainScores />
        <BusinessHealthTrend period="90 Days" />

        {/* Row 3 */}
        <OperatingRhythm />
        <MilestonesMomentum
          quarter="Q2"
          goalTitle="Revenue Goal"
          progress={75}
          targetAmount="$50,000"
          currentAmount="$37,500"
          milestones={[
            { id: "1", label: "Launch new offer", completed: true },
            { id: "2", label: "Reach 100 leads", completed: true },
            { id: "3", label: "Close 5 new clients", completed: false },
            { id: "4", label: "Hit revenue target", completed: false },
          ]}
        />
        <RevenueSnapshot
          revenue={38450}
          profit={12760}
          profitMargin={33}
          changePercent={12}
        />
      </div>

      {/* Bottom decorative element */}
      <div className="flex items-center justify-center py-8 opacity-30">
        <svg
          viewBox="0 0 24 24"
          className="w-8 h-8 text-[#D4AF63]"
          fill="currentColor"
        >
          <path d="M12 3C12 3 11 5 11 7C11 9 12 11 12 11C12 11 13 9 13 7C13 5 12 3 12 3Z" />
          <path d="M7 7C7 7 3 5 1 9C-1 13 3 17 7 15C7 15 5 11 7 7Z" />
          <path d="M17 7C17 7 21 5 23 9C25 13 21 17 17 15C17 15 19 11 17 7Z" />
          <path d="M12 11C12 11 8 15 8 19C8 23 12 23 12 23C12 23 16 23 16 19C16 15 12 11 12 11Z" />
        </svg>
      </div>
    </div>
  );
}
