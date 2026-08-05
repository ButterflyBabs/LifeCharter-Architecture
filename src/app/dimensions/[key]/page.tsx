"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, Circle, Clock, HelpCircle } from "lucide-react";

interface SourceBreakdown {
  kind: string;
  method: string;
  nominalWeight: number;
  effectiveWeight: number;
  subScore: number | null;
  fresh: boolean;
  note?: string;
}
interface DimensionResult {
  key: string;
  label: string;
  score: number | null;
  partial: boolean;
  lastMeasured: string | null;
  sources: SourceBreakdown[];
}

const healthColor = (s: number) => (s < 60 ? "#D83A34" : s < 80 ? "#c9a227" : "#2E7C83");
const bandLabel = (s: number) => (s < 60 ? "Needs attention" : s < 80 ? "Solid, room to grow" : "Thriving");

// What each source is, and where the client goes to improve it. Keyed by
// (source kind, dimension key) because the same kind means different things
// per dimension (operational finance vs sales vs operations).
function sourceInfo(kind: string, dim: string): { label: string; href: string; how: string } {
  switch (kind) {
    case "profit":
      return { label: "Profit Architecture assessment", href: "/assessments/profit", how: "Your self-scored rating of this area." };
    case "brain":
      return { label: "Brain assessment", href: "/assessments/brain", how: "AI-scored from what you wrote about your systems." };
    case "soul":
      return { label: "Soul assessment", href: "/assessments/soul", how: "AI-scored from your identity, values, and story." };
    case "pulse":
      return { label: "Quick Pulse check-in", href: "/assessments/quick-pulse-checkin", how: "Your latest gut-check on how this feels right now." };
    case "business_plan":
      if (dim === "marketing") return { label: "Marketing Plan completeness", href: "/marketing-plan", how: "How much of your Marketing Plan's foundation is written." };
      if (dim === "sales") return { label: "Sales Plan completeness", href: "/sales", how: "How much of your Sales Plan's foundation is written." };
      return { label: "Business Plan completeness", href: "/business-plan", how: "How much of your Business Plan's foundation is written." };
    case "operational":
      if (dim === "finance") return { label: "Live finances (your ledger)", href: "/finance", how: "Computed from real income, expenses, and your budget target." };
      if (dim === "sales") return { label: "Live sales activity", href: "/daily-compass/sales-activities", how: "Computed from your pipeline — conversion and recent activity." };
      if (dim === "operations") return { label: "Operational pillars", href: "/operations", how: "How many of your 8 pillars are solid or in progress." };
      if (dim === "systems") return { label: "Operating metrics", href: "/finance/monthly-review", how: "From your monthly review — hours, delegation, and documentation." };
      return { label: "Operating metrics", href: "/operations", how: "Computed from your live operating data." };
    default:
      return { label: kind, href: "/", how: "" };
  }
}

export default function DimensionDetailPage() {
  const params = useParams();
  const key = String(params?.key || "");
  const [dim, setDim] = useState<DimensionResult | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [needsAssessment, setNeedsAssessment] = useState(false);

  useEffect(() => {
    fetch("/api/alignment?ts=" + Date.now(), { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.needsAssessment) setNeedsAssessment(true);
        const breakdown = (d?.breakdown || []) as DimensionResult[];
        setDim(breakdown.find((x) => x.key === key) || null);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [key]);

  return (
    <div className="py-8 px-4 max-w-2xl mx-auto">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-[#2E7C83] hover:underline mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Business Health
      </Link>

      {!loaded ? (
        <p className="text-sm text-[#b8a898]">Loading…</p>
      ) : needsAssessment ? (
        <div className="rounded-2xl border border-[#c9a227]/40 bg-[#c9a227]/10 p-5">
          <p className="text-sm text-[#8a6a15]">
            This score comes to life once you complete your assessments.{" "}
            <Link href="/assessments" className="underline font-medium">Start your assessments</Link>.
          </p>
        </div>
      ) : !dim ? (
        <p className="text-sm text-[#b8a898]">We couldn&apos;t find that dimension.</p>
      ) : (
        <>
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-serif text-white flex-shrink-0"
              style={{ backgroundColor: dim.score !== null ? healthColor(dim.score) : "#9CA3AF" }}
            >
              {dim.score ?? "—"}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">{dim.label} health</h1>
              <p className="text-sm text-[#7a8a99] dark:text-[#b8c2cf]">
                {dim.score !== null ? bandLabel(dim.score) : "Not measured yet"}
                {dim.partial && dim.score !== null ? " · partial (some inputs still pending)" : ""}
              </p>
            </div>
          </div>

          <p className="text-sm text-[#3a3630] dark:text-[#d8d2c8] mb-5 leading-relaxed">
            This score is a weighted blend of everything below. Each input contributes at its own weight; when an input
            isn&apos;t available yet, its weight spreads across the rest. Improve any input and the score follows.
          </p>

          {/* Sources */}
          <div className="space-y-2">
            {dim.sources
              .slice()
              .sort((a, b) => b.effectiveWeight - a.effectiveWeight)
              .map((s, i) => {
                const info = sourceInfo(s.kind, dim.key);
                const pct = Math.round(s.effectiveWeight * 100);
                const measured = s.subScore !== null;
                return (
                  <Link
                    key={i}
                    href={info.href}
                    className="block rounded-xl border border-[#1a2b4a]/10 bg-white dark:bg-[#1a2b4a]/20 p-4 hover:border-[#2E7C83]/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex-shrink-0">
                        {measured ? (
                          s.fresh ? (
                            <CheckCircle2 className="w-5 h-5 text-[#2c6b3f]" />
                          ) : (
                            <Clock className="w-5 h-5 text-[#8a6a15]" />
                          )
                        ) : (
                          <Circle className="w-5 h-5 text-[#b8a898]" />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">{info.label}</span>
                          <span className="text-sm font-semibold text-[#1a2b4a] dark:text-[#F8F5F0] flex-shrink-0">
                            {measured ? s.subScore : "—"}
                            {measured && <span className="text-xs text-[#b8a898] font-normal"> /100</span>}
                          </span>
                        </div>
                        <p className="text-xs text-[#7a8a99] dark:text-[#b8c2cf] mt-0.5">{info.how}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[11px] text-[#b8a898]">{pct}% of this score</span>
                          {measured && !s.fresh && <span className="text-[11px] text-[#8a6a15]">· getting stale</span>}
                          {!measured && <span className="text-[11px] text-[#b8a898]">· {s.note || "not measured yet"}</span>}
                          <ArrowRight className="w-3 h-3 text-[#2E7C83] ml-auto" />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
          </div>

          <div className="mt-5 flex items-center gap-2 text-xs text-[#b8a898]">
            <HelpCircle className="w-3.5 h-3.5" />
            Tap any input above to go where you can improve it.
          </div>
        </>
      )}
    </div>
  );
}
