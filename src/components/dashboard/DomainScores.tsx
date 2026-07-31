"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ArrowUp, ArrowDown } from "lucide-react";

interface DomainScore {
  name: string;
  score: number;
  change: number;
  icon: string;
}

interface DomainScoresProps {
  scores?: DomainScore[];
}

const defaultScores: DomainScore[] = [
  { name: "Marketing", score: 72, change: 6, icon: "M" },
  { name: "Sales", score: 64, change: 8, icon: "S" },
  { name: "Operations", score: 58, change: -2, icon: "O" },
  { name: "Finance", score: 62, change: 5, icon: "F" },
  { name: "Team", score: 60, change: 4, icon: "T" },
  { name: "Systems", score: 48, change: -3, icon: "Sy" },
  { name: "Leadership", score: 70, change: 6, icon: "L" },
  { name: "Vision", score: 78, change: 7, icon: "V" },
  { name: "Product", score: 66, change: 3, icon: "P" },
  { name: "Client Exp", score: 71, change: 6, icon: "C" },
  { name: "Legal", score: 55, change: -1, icon: "Le" },
  { name: "Sustainability", score: 74, change: 5, icon: "Su" },
];

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

  useEffect(() => {
    if (props.scores) return;
    fetch("/api/alignment?ts=" + Date.now(), { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.hasData) {
          const domains = d.domains as Array<{ name: string; score: number; icon: string }>;
          setLive(domains.map((x) => ({ name: x.name, score: x.score, change: 0, icon: x.icon })));
        }
      })
      .catch(() => {});
  }, [props.scores]);

  const scores = props.scores ?? live ?? defaultScores;
  return (
    <Card className="h-full border-[#c9a227]/30">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Domain Scores</CardTitle>
        <button className="text-xs text-[#7b6b8d] dark:text-[#e8e4f0] hover:text-[#1a2b4a] dark:hover:text-[#F8F5F0] transition-colors">
          View All Domains →
        </button>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
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

              {/* Change */}
              <div
                className={`flex items-center justify-center gap-0.5 text-xs ${
                  domain.change >= 0 ? "text-[#4a9b9b]" : "text-red-500"
                }`}
              >
                {domain.change >= 0 ? (
                  <ArrowUp className="w-3 h-3" />
                ) : (
                  <ArrowDown className="w-3 h-3" />
                )}
                <span>{Math.abs(domain.change)}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
