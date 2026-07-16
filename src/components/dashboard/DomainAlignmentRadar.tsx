"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
} from "recharts";

const data = [
  { domain: "Marketing", you: 72, ideal: 90 },
  { domain: "Sales", you: 64, ideal: 85 },
  { domain: "Operations", you: 58, ideal: 80 },
  { domain: "Finance", you: 62, ideal: 85 },
  { domain: "Team", you: 60, ideal: 80 },
  { domain: "Systems", you: 48, ideal: 85 },
  { domain: "Leadership", you: 70, ideal: 90 },
  { domain: "Vision", you: 78, ideal: 95 },
  { domain: "Product", you: 66, ideal: 85 },
  { domain: "Client Exp", you: 71, ideal: 90 },
  { domain: "Legal", you: 55, ideal: 80 },
  { domain: "Sustainability", you: 74, ideal: 85 },
];

export function DomainAlignmentRadar() {
  return (
    <Card className="h-full border-[#D4AF63]/30">
      <CardHeader>
        <CardTitle>12-Domain Business Alignment</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
              <PolarGrid
                stroke="#CDBED6"
                strokeOpacity={0.3}
              />
              <PolarAngleAxis
                dataKey="domain"
                tick={{
                  fill: "#5E3B6C",
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
                stroke="#5E3B6C"
                strokeWidth={2}
                fill="#5E3B6C"
                fillOpacity={0.3}
              />
              <Radar
                name="Ideal"
                dataKey="ideal"
                stroke="#D4AF63"
                strokeWidth={2}
                strokeDasharray="4 4"
                fill="#D4AF63"
                fillOpacity={0.1}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                wrapperStyle={{
                  fontSize: "12px",
                  color: "#5E3B6C",
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
