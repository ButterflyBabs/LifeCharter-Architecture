"use client";

import { Term } from "@/components/Term";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ArrowUp, ArrowDown } from "lucide-react";

interface DomainScore {
  name: string;
  score: number;
  change: number | null;
  icon: string;
}

interface DomainScoresProps {
  scores?: DomainScore[];
}


const domainColors: Record<string, string> = {
  Marketing: "#1a2b4a",
  Sales: "#7b6b8d",
  Operations: "#4a9b9b",
  Finance: "#e8e4f0",
  Team: "#c9a227",
  Systems: "#b8a898",
  Leadership: "#1a2b4a",
  Vision: "#7b6b8d",
  Product: "#4a9b9b",
  "Client Exp": "#e8e4f0",
  Legal: "#c9a227",
  Sustainability: "#b8a898",
};

export function DomainScores(props: DomainScoresProps) {
  const [live, setLive] = useState<DomainScore[] | null>(null);
  const [needsAssessment, setNeedsAssessment] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (props.scores) return;
    fetch("/api/alignment?ts=" + Date.now(), { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.hasData) {
          const domains = d.domains as Array<{ name: string; score: number; icon: string; delta?: number | null }>;
          setLive(domains.map((x) => ({ name: x.name, score: x.score, change: x.delta ?? null, icon: x.icon })));
        } else setNeedsAssessment(true);
      })
      .catch(() => setFailed(true));
  }, [props.scores]);

  // No thin-air fallback: empty until assessments produce real scores.
  const scores = props.scores ?? live ?? [];
  return (
    <Card className="h-full border-[#c9a227]/30">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle><Term id="domain-scores">Domain Scores</Term></CardTitle>
        <Link href="/progress" className="text-xs text-[#7b6b8d] dark:text-[#e8e4f0] hover:text-[#1a2b4a] dark:hover:text-[#F8F5F0] transition-colors">
          See your progress →
        </Link>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        {scores.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#1a2b4a]/20 p-5 text-center">
            <p className="text-sm text-[#7a8a99]">
              {needsAssessment ? "Your 12 domain scores appear here once you've answered some assessment questions." : failed ? "Couldn't load your scores right now." : "Reading your scores…"}
            </p>
            {needsAssessment && <Link href="/assessments" className="mt-2 inline-block text-sm font-medium text-[#2E7C83] hover:underline">Start an assessment →</Link>}
          </div>
        ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(76px,1fr))] gap-3">
          {scores.map((domain) => (
            <div
              key={domain.name}
              className="p-3 rounded-xl bg-[#1a2b4a]/5 dark:bg-[#e8e4f0]/5 hover:bg-[#1a2b4a]/10 dark:hover:bg-[#e8e4f0]/10 transition-colors text-center"
            >
              {/* Icon */}
              <div
                className="w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center text-xs font-bold text-white"
                style={{ backgroundColor: domainColors[domain.name] || "#1a2b4a" }}
              >
                {domain.icon}
              </div>

              {/* Name */}
              <p className="text-xs font-medium text-[#1a2b4a] dark:text-[#F8F5F0] mb-1 truncate">
                {domain.name}
              </p>

              {/* Score */}
              <p className="text-lg font-serif font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">
                {domain.score}
              </p>

              {/* Change since baseline — shown only when there is real movement */}
              {domain.change ? (
                <div className={`flex items-center justify-center gap-0.5 text-xs ${domain.change >= 0 ? "text-[#4a9b9b]" : "text-red-500"}`} title="Change since your baseline">
                  {domain.change >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                  <span>{Math.abs(domain.change)}</span>
                </div>
              ) : (
                <div className="text-xs text-[#b8a898]">—</div>
              )}
            </div>
          ))}
        </div>
        )}
      </CardContent>
    </Card>
  );
}
