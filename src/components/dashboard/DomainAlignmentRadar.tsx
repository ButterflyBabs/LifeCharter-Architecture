"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import dynamic from "next/dynamic";

// Dynamic import to avoid SSR issues with recharts
const RadarChart = dynamic(
  () => import("recharts").then((mod) => mod.RadarChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);
const Radar = dynamic(
  () => import("recharts").then((mod) => mod.Radar),
  { ssr: false }
);
const PolarGrid = dynamic(
  () => import("recharts").then((mod) => mod.PolarGrid),
  { ssr: false }
);
const PolarAngleAxis = dynamic(
  () => import("recharts").then((mod) => mod.PolarAngleAxis),
  { ssr: false }
);
const PolarRadiusAxis = dynamic(
  () => import("recharts").then((mod) => mod.PolarRadiusAxis),
  { ssr: false }
);
const Legend = dynamic(
  () => import("recharts").then((mod) => mod.Legend),
  { ssr: false }
);
const ResponsiveContainer = dynamic(
  () => import("recharts").then((mod) => mod.ResponsiveContainer),
  { ssr: false }
);

// Loading skeleton for chart
function ChartSkeleton() {
  return (
    <div className="h-[320px] flex items-center justify-center">
      <div className="w-48 h-48 rounded-full border-4 border-[#e8e4f0]/30 border-t-[#1a2b4a] animate-spin" />
    </div>
  );
}


interface RadarDatum {
  domain: string;
  you: number;
  ideal: number;
}

export function DomainAlignmentRadar({ data: propData }: { data?: RadarDatum[] }) {
  const [live, setLive] = useState<RadarDatum[] | null>(null);
  const [needsAssessment, setNeedsAssessment] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (propData) return;
    fetch("/api/alignment?ts=" + Date.now(), { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.hasData) {
          const domains = d.domains as Array<{ name: string; score: number }>;
          setLive(domains.map((x) => ({ domain: x.name, you: x.score, ideal: 90 })));
        } else setNeedsAssessment(true);
      })
      .catch(() => setFailed(true));
  }, [propData]);

  // No thin-air fallback: empty radar until assessments produce real scores.
  const chartData = propData ?? live ?? [];

  return (
    <Card className="h-full border-[#c9a227]/30">
      <CardHeader>
        <CardTitle>12-Domain Business Alignment</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {chartData.length === 0 ? (
          <div className="h-[320px] flex items-center justify-center text-center px-4">
            <p className="text-sm text-[#7a8a99] max-w-xs">
              {needsAssessment ? "Your alignment chart draws itself as you answer assessment questions — each answer moves it." : failed ? "Couldn't load your alignment right now." : "Reading your scores…"}
            </p>
          </div>
        ) : (
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
              <PolarGrid
                stroke="#e8e4f0"
                strokeOpacity={0.3}
              />
              <PolarAngleAxis
                dataKey="domain"
                tick={{
                  fill: "#7b6b8d",
                  fontSize: 10,
                  fontWeight: 500,
                }}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, 100]}
                tick={false}
                axisLine={false}
              />
              <Radar
                name="You"
                dataKey="you"
                stroke="#7b6b8d"
                strokeWidth={2}
                fill="#7b6b8d"
                fillOpacity={0.3}
              />
              <Radar
                name="Ideal"
                dataKey="ideal"
                stroke="#c9a227"
                strokeWidth={2}
                strokeDasharray="4 4"
                fill="#c9a227"
                fillOpacity={0.1}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                wrapperStyle={{
                  fontSize: "12px",
                  color: "#7b6b8d",
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        )}
      </CardContent>
    </Card>
  );
}
