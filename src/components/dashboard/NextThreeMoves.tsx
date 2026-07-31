"use client";

import { useEffect, useState } from "react";
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
  High: "bg-[#7b6b8d] text-[#F8F5F0]",
  Medium: "bg-[#4a9b9b] text-[#F8F5F0]",
  Low: "bg-[#e8e4f0] text-[#1a2b4a]",
};

const numberColors = {
  1: "bg-[#7b6b8d]",
  2: "bg-[#4a9b9b]",
  3: "bg-[#e8e4f0] text-[#1a2b4a]",
};

export function NextThreeMoves({ moves: movesProp }: NextThreeMovesProps) {
  const [fetched, setFetched] = useState<Move[] | null>(null);

  useEffect(() => {
    if (movesProp) return;
    fetch("/api/next-moves", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setFetched(d?.moves?.length ? d.moves : defaultMoves))
      .catch(() => setFetched(defaultMoves));
  }, [movesProp]);

  const moves = movesProp ?? fetched ?? defaultMoves;

  return (
    <Card className="h-full border-[#c9a227]/30">
      <CardHeader>
        <CardTitle>Next 3 Moves</CardTitle>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div className="space-y-3">
          {moves.map((move) => (
            <div
              key={move.id}
              className="flex items-center gap-4 p-3 rounded-xl bg-[#1a2b4a]/5 dark:bg-[#e8e4f0]/5 hover:bg-[#1a2b4a]/10 dark:hover:bg-[#e8e4f0]/10 transition-colors"
            >
              {/* Number badge */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0 ${
                  numberColors[move.id as keyof typeof numberColors] || "bg-[#7b6b8d]"
                }`}
              >
                {move.id}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-[#1a2b4a] dark:text-[#F8F5F0] truncate">
                  {move.title}
                </h3>
                <p className="text-xs text-[#7b6b8d] dark:text-[#e8e4f0]">
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
