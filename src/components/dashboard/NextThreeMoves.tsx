"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface Move {
  id: number;
  title: string;
  subtitle: string;
  impact: "High" | "Medium" | "Low";
}

interface NextThreeMovesProps {
  moves?: Move[];
}

const defaultMoves: Move[] = [
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
];

const impactColors = {
  High: "bg-[#5E3B6C] text-[#F6F1E8]",
  Medium: "bg-[#2E7C83] text-[#F6F1E8]",
  Low: "bg-[#CDBED6] text-[#1F315B]",
};

const numberColors = {
  1: "bg-[#5E3B6C]",
  2: "bg-[#2E7C83]",
  3: "bg-[#CDBED6] text-[#1F315B]",
};

export function NextThreeMoves({ moves = defaultMoves }: NextThreeMovesProps) {
  return (
    <Card className="h-full border-[#D4AF63]/30">
      <CardHeader>
        <CardTitle>Next 3 Moves</CardTitle>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div className="space-y-3">
          {moves.map((move) => (
            <div
              key={move.id}
              className="flex items-center gap-4 p-3 rounded-xl bg-[#1F315B]/5 dark:bg-[#CDBED6]/5 hover:bg-[#1F315B]/10 dark:hover:bg-[#CDBED6]/10 transition-colors"
            >
              {/* Number badge */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0 ${
                  numberColors[move.id as keyof typeof numberColors] || "bg-[#5E3B6C]"
                }`}
              >
                {move.id}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-[#1F315B] dark:text-[#F6F1E8] truncate">
                  {move.title}
                </h3>
                <p className="text-xs text-[#5E3B6C] dark:text-[#CDBED6]">
                  {move.subtitle}
                </p>
              </div>

              {/* Impact badge */}
              <Badge
                className={`${impactColors[move.impact]} text-xs whitespace-nowrap`}
              >
                {move.impact} Impact
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
