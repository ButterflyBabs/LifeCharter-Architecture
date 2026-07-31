"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface OverallBusinessHealthProps {
  score?: number;
  status?: string;
  focusAreas?: string[];
  description?: string;
}

export function OverallBusinessHealth(props: OverallBusinessHealthProps) {
  const [live, setLive] = useState<{
    overall: number;
    status: string;
    focusAreas: string[];
    description: string;
  } | null>(null);

  useEffect(() => {
    if (props.score !== undefined) return;
    fetch("/api/alignment?ts=" + Date.now(), { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.hasData) setLive(d);
      })
      .catch(() => {});
  }, [props.score]);

  const score = props.score ?? live?.overall ?? 68;
  const status = props.status ?? live?.status ?? "Growth";
  const focusAreas = props.focusAreas ?? live?.focusAreas ?? ["Sales", "Finance", "Systems"];
  const description =
    props.description ??
    live?.description ??
    "You're building momentum. Align your systems and cash flow to scale with ease and clarity.";

  // Calculate stroke dasharray for circular progress
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <Card className="h-full border-[#c9a227]/30">
      <CardContent className="p-6">
        <div className="flex items-start gap-6">
          {/* Circular Score Gauge */}
          <div className="relative flex-shrink-0">
            <svg
              width="120"
              height="120"
              viewBox="0 0 120 120"
              className="transform -rotate-90"
            >
              {/* Background circle */}
              <circle
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke="#e8e4f0"
                strokeWidth="8"
                opacity="0.3"
              />
              {/* Progress circle */}
              <circle
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke="#1a2b4a"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-1000 ease-out"
              />
              {/* Gold accent arc */}
              <circle
                cx="60"
                cy="60"
                r={radius + 6}
                fill="none"
                stroke="#c9a227"
                strokeWidth="2"
                strokeDasharray="40 287"
                strokeDashoffset="0"
                opacity="0.6"
              />
            </svg>
            {/* Score text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-serif font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">
                {score}
              </span>
              <span className="text-xs text-[#b8a898]">/ 100</span>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xs font-semibold tracking-wider uppercase text-[#7b6b8d] dark:text-[#e8e4f0]">
                Overall Business Health
              </h2>
              {/* Butterfly decoration */}
              <svg
                viewBox="0 0 24 24"
                className="w-4 h-4 text-[#c9a227]"
                fill="currentColor"
              >
                <path d="M12 3C12 3 11 5 11 7C11 9 12 11 12 11C12 11 13 9 13 7C13 5 12 3 12 3Z" />
                <path d="M7 7C7 7 3 5 1 9C-1 13 3 17 7 15C7 15 5 11 7 7Z" />
                <path d="M17 7C17 7 21 5 23 9C25 13 21 17 17 15C17 15 19 11 17 7Z" />
                <path d="M12 11C12 11 8 15 8 19C8 23 12 23 12 23C12 23 16 23 16 19C16 15 12 11 12 11Z" />
              </svg>
            </div>

            <p className="text-2xl font-serif font-bold text-[#1a2b4a] dark:text-[#F8F5F0] mb-2">
              {status}
            </p>

            <Badge variant="success" className="mb-3">
              On Track
            </Badge>

            <p className="text-sm text-[#7b6b8d] dark:text-[#e8e4f0] mb-2">
              <span className="font-medium">Primary focus:</span>{" "}
              {focusAreas.join(", ")}
            </p>

            <p className="text-sm text-[#1a2b4a]/70 dark:text-[#F8F5F0]/70 leading-relaxed">
              {description}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
