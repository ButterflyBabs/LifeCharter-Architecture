"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Progress } from "@/components/ui/Progress";
import { Target, TrendingUp, Award, Calendar } from "lucide-react";

interface Milestone {
  id: string;
  label: string;
  completed: boolean;
}

interface MilestonesMomentumProps {
  quarter?: string;
  goalTitle?: string;
  progress?: number;
  targetAmount?: string;
  currentAmount?: string;
  milestones?: Milestone[];
}

const defaultMilestones: Milestone[] = [
  { id: "1", label: "Launch new offer", completed: true },
  { id: "2", label: "Reach 100 leads", completed: true },
  { id: "3", label: "Close 5 new clients", completed: false },
  { id: "4", label: "Hit revenue target", completed: false },
];

export function MilestonesMomentum({
  quarter = "Q2",
  goalTitle = "Revenue Goal",
  progress = 75,
  targetAmount = "$50,000",
  currentAmount = "$37,500",
  milestones = defaultMilestones,
}: MilestonesMomentumProps) {
  const completedCount = milestones.filter((m) => m.completed).length;
  const totalCount = milestones.length;

  return (
    <Card className="h-full border-[#D4AF63]/30">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Milestones & Momentum</CardTitle>
        <div className="flex items-center gap-1 text-xs text-[#B9A9A9]">
          <Calendar className="w-3 h-3" />
          <span>{quarter} 2026</span>
        </div>
      </CardHeader>
      <CardContent className="p-6 pt-0 space-y-5">
        {/* Main Goal Progress */}
        <div className="p-4 rounded-xl bg-[#1F315B]/5 dark:bg-[#CDBED6]/5">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-5 h-5 text-[#D4AF63]" />
            <h3 className="text-sm font-semibold text-[#1F315B] dark:text-[#F6F1E8]">
              {goalTitle}
            </h3>
          </div>

          <div className="flex items-end justify-between mb-2">
            <div>
              <span className="text-2xl font-serif font-bold text-[#1F315B] dark:text-[#F6F1E8]">
                {progress}%
              </span>
              <span className="text-sm text-[#B9A9A9] ml-1">complete</span>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-[#1F315B] dark:text-[#F6F1E8]">
                {currentAmount}
              </p>
              <p className="text-xs text-[#B9A9A9]">of {targetAmount}</p>
            </div>
          </div>

          <Progress value={progress} variant="gold" className="h-2.5" />
        </div>

        {/* Milestones List */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-4 h-4 text-[#5E3B6C]" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#5E3B6C] dark:text-[#CDBED6]">
              Key Milestones
            </h3>
            <span className="text-xs text-[#B9A9A9]">
              ({completedCount}/{totalCount})
            </span>
          </div>

          <div className="space-y-2">
            {milestones.map((milestone, index) => (
              <div
                key={milestone.id}
                className="flex items-center gap-3 p-2.5 rounded-lg bg-[#1F315B]/5 dark:bg-[#CDBED6]/5"
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    milestone.completed
                      ? "bg-[#2E7C83] text-white"
                      : "bg-[#CDBED6]/50 text-[#5E3B6C]"
                  }`}
                >
                  {milestone.completed ? "✓" : index + 1}
                </div>
                <span
                  className={`text-sm ${
                    milestone.completed
                      ? "text-[#1F315B]/60 dark:text-[#F6F1E8]/60 line-through"
                      : "text-[#1F315B] dark:text-[#F6F1E8]"
                  }`}
                >
                  {milestone.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Momentum indicator */}
        <div className="flex items-center gap-2 p-3 rounded-lg bg-[#2E7C83]/10">
          <TrendingUp className="w-4 h-4 text-[#2E7C83]" />
          <span className="text-xs text-[#2E7C83]">
            On track to hit goal by end of {quarter}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
