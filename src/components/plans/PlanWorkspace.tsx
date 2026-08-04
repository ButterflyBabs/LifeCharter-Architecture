"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, Target, Sparkles, ClipboardList } from "lucide-react";
import PlanBuilder from "@/components/plans/PlanBuilder";
import ReviewsPanel from "@/components/plans/ReviewsPanel";
import PlanView, { type PlanType } from "@/components/plans/PlanView";

const META: Record<string, { label: string; blurb: string }> = {
  business: { label: "Business Plan", blurb: "Your vision, model, and objectives — the backbone of everything." },
  marketing: { label: "Marketing Plan", blurb: "How the right people find, trust, and choose you." },
  sales: { label: "Sales Plan", blurb: "Turning interest into committed, well-served clients." },
};

type Tab = "build" | "goals" | "reviews";

export default function PlanWorkspace({ planType }: { planType: PlanType }) {
  const [tab, setTab] = useState<Tab>("build");
  const meta = META[planType] || { label: "Plan", blurb: "" };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "build", label: "Build", icon: <FileText className="w-4 h-4" /> },
    { id: "goals", label: "Goals", icon: <Target className="w-4 h-4" /> },
    { id: "reviews", label: "Reviews", icon: <Sparkles className="w-4 h-4" /> },
  ];

  return (
    <div className="py-8 px-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#7b6b8d] to-[#2E7C83] flex items-center justify-center">
            <ClipboardList className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">{meta.label}</h1>
            <p className="text-[#b8a898]">{meta.blurb}</p>
          </div>
        </div>
        <Link href="/planning" className="text-sm text-[#2E7C83] hover:underline">
          ← Planning Hub
        </Link>
      </div>

      <p className="text-xs text-[#b8a898] mb-5">
        Drawn from your{" "}
        <Link href="/assessments" className="text-[#2E7C83] hover:underline">Brain, Soul &amp; Profit assessments</Link>{" "}
        — build the sections, let AI draft from what it knows about you, then track goals and run reviews.
      </p>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#1a2b4a]/5 rounded-xl p-1 mb-6 w-fit">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg transition-colors ${
              tab === t.id
                ? "bg-white dark:bg-[#1a2b4a] text-[#1a2b4a] dark:text-[#F8F5F0] shadow-sm"
                : "text-[#7a8a99] hover:text-[#1a2b4a] dark:hover:text-[#F8F5F0]"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === "build" && <PlanBuilder planType={planType} />}
      {tab === "goals" && (
        <div className="-mt-8">
          {/* PlanView renders its own header/padding; nest it under the Goals tab. */}
          <PlanView planType={planType} />
        </div>
      )}
      {tab === "reviews" && <ReviewsPanel planType={planType} />}
    </div>
  );
}
