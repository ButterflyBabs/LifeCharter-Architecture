"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { CheckCircle2, Circle, Clock } from "lucide-react";

interface RhythmItem {
  id: string;
  label: string;
  completed: boolean;
}

interface RhythmSection {
  title: string;
  icon: "daily" | "weekly" | "monthly";
  items: RhythmItem[];
}

interface OperatingRhythmProps {
  sections?: RhythmSection[];
}

const defaultSections: RhythmSection[] = [
  {
    title: "Daily",
    icon: "daily",
    items: [
      { id: "d1", label: "Review cash position", completed: true },
      { id: "d2", label: "Check key metrics", completed: true },
      { id: "d3", label: "Prioritize top 3 tasks", completed: false },
    ],
  },
  {
    title: "Weekly",
    icon: "weekly",
    items: [
      { id: "w1", label: "Team sync meeting", completed: true },
      { id: "w2", label: "Review sales pipeline", completed: false },
      { id: "w3", label: "Client follow-ups", completed: false },
    ],
  },
  {
    title: "Monthly",
    icon: "monthly",
    items: [
      { id: "m1", label: "Financial review", completed: false },
      { id: "m2", label: "Goal progress check", completed: false },
      { id: "m3", label: "Strategic planning", completed: false },
    ],
  },
];

const sectionColors = {
  daily: "#2E7C83",
  weekly: "#5E3B6C",
  monthly: "#D4AF63",
};

export function OperatingRhythm({ sections = defaultSections }: OperatingRhythmProps) {
  return (
    <Card className="h-full border-[#D4AF63]/30">
      <CardHeader>
        <CardTitle>Operating Rhythm</CardTitle>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div className="space-y-4">
          {sections.map((section) => (
            <div key={section.title} className="space-y-2">
              {/* Section Header */}
              <div className="flex items-center gap-2">
                <Clock
                  className="w-4 h-4"
                  style={{ color: sectionColors[section.icon] }}
                />
                <h3
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: sectionColors[section.icon] }}
                >
                  {section.title}
                </h3>
              </div>

              {/* Items */}
              <div className="space-y-1.5 pl-6">
                {section.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    {item.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-[#2E7C83] flex-shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-[#B9A9A9] flex-shrink-0" />
                    )}
                    <span
                      className={`${
                        item.completed
                          ? "text-[#1F315B]/60 dark:text-[#F6F1E8]/60 line-through"
                          : "text-[#1F315B] dark:text-[#F6F1E8]"
                      }`}
                    >
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Progress summary */}
        <div className="mt-4 pt-4 border-t border-[#D4AF63]/20">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#5E3B6C] dark:text-[#CDBED6]">
              {sections.reduce(
                (acc, section) => acc + section.items.filter((i) => i.completed).length,
                0
              )}{" "}
              of{" "}
              {sections.reduce((acc, section) => acc + section.items.length, 0)} completed
            </span>
            <button className="text-[#2E7C83] hover:text-[#2E7C83]/80 transition-colors">
              View all →
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
