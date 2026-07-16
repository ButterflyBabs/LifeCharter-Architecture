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
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-2xl font-serif font-bold text-[#1F315B] dark:text-[#F6F1E8]">
          Welcome back, Seraphina
        </h1>
        <p className="text-[#5E3B6C] dark:text-[#CDBED6]">
          Here&apos;s your business at a glance
        </p>
      </div>

      {/* Top Row - 3 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <OverallBusinessHealth />
        <DomainAlignmentRadar />
        <AIBusinessGuide />
      </div>

      {/* Second Row - 3 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <NextThreeMoves />
        <DomainScores />
        <BusinessHealthTrend />
      </div>

      {/* Third Row - 3 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <OperatingRhythm />
        <MilestonesMomentum />
        <RevenueSnapshot />
      </div>
    </div>
  );
}
