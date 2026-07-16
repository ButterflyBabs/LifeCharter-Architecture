"use client";

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
  Marketing: "#1F315B",
  Sales: "#5E3B6C",
  Operations: "#2E7C83",
  Finance: "#CDBED6",
  Team: "#D4AF63",
  Systems: "#B9A9A9",
  Leadership: "#1F315B",
  Vision: "#5E3B6C",
  Product: "#2E7C83",
  "Client Exp": "#CDBED6",
  Legal: "#D4AF63",
  Sustainability: "#B9A9A9",
};

export function DomainScores({ scores = defaultScores }: DomainScoresProps) {
  return (
    <Card className="h-full border-[#D4AF63]/30">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Domain Scores</CardTitle>
        <button className="text-xs text-[#5E3B6C] dark:text-[#CDBED6] hover:text-[#1F315B] dark:hover:text-[#F6F1E8] transition-colors">
          View All Domains →
        </button>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {scores.map((domain) => (
            <div
              key={domain.name}
              className="p-3 rounded-xl bg-[#1F315B]/5 dark:bg-[#CDBED6]/5 hover:bg-[#1F315B]/10 dark:hover:bg-[#CDBED6]/10 transition-colors text-center"
            >
              {/* Icon */}
              <div
                className="w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center text-xs font-bold text-white"
                style={{ backgroundColor: domainColors[domain.name] || "#1F315B" }}
              >
                {domain.icon}
              </div>

              {/* Name */}
              <p className="text-xs font-medium text-[#1F315B] dark:text-[#F6F1E8] mb-1 truncate">
                {domain.name}
              </p>

              {/* Score */}
              <p className="text-lg font-serif font-bold text-[#1F315B] dark:text-[#F6F1E8]">
                {domain.score}
              </p>

              {/* Change */}
              <div
                className={`flex items-center justify-center gap-0.5 text-xs ${
                  domain.change >= 0 ? "text-[#2E7C83]" : "text-red-500"
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
