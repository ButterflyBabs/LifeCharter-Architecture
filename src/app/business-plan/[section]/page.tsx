/**
 * Business Plan Section Detail Page
 * Hybrid approach: AI base + targeted questions + manual edits + metrics tracking
 */

"use client";

import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";

import { 
  ArrowLeft,
  Brain,
  Heart,
  DollarSign,
  FileText,
  Sparkles,
  TrendingUp,
  Users,
  Target,
  BarChart3,
  Calendar,
  Settings
} from "lucide-react";
import Link from "next/link";
import { SectionContent } from "./SectionContent";

const sectionMeta: Record<string, { 
  title: string; 
  icon: React.ReactNode; 
  description: string;
  dataSources: string[];
}> = {
  "executive_summary": {
    title: "Executive Summary",
    icon: <FileText className="w-5 h-5" />,
    description: "High-level overview of your business, informed by all assessments",
    dataSources: ["Brain", "Soul", "Profit"]
  },
  "products": {
    title: "Products & Services",
    icon: <Sparkles className="w-5 h-5" />,
    description: "Your offerings, pricing, and product ecosystem",
    dataSources: ["Brain - Business Model", "Profit Architecture"]
  },
  "pricing": {
    title: "Pricing Strategy",
    icon: <DollarSign className="w-5 h-5" />,
    description: "Pricing models, confidence levels, and optimization",
    dataSources: ["Profit Architecture - Pricing Section"]
  },
  "revenue": {
    title: "Revenue Model",
    icon: <TrendingUp className="w-5 h-5" />,
    description: "Revenue streams, projections, and financial goals",
    dataSources: ["Profit Architecture - Revenue"]
  },
  "market": {
    title: "Target Market",
    icon: <Users className="w-5 h-5" />,
    description: "Ideal clients, positioning, and competitive landscape",
    dataSources: ["Soul - Ideal Client", "Brain - Market Positioning"]
  },
  "marketing": {
    title: "Marketing Strategy",
    icon: <Target className="w-5 h-5" />,
    description: "Channels, content strategy, and lead generation",
    dataSources: ["Brain - Marketing System"]
  },
  "operations": {
    title: "Operations Plan",
    icon: <Settings className="w-5 h-5" />,
    description: "Systems, SOPs, team structure, and workflows",
    dataSources: ["Brain - Operations & Systems"]
  },
  "financials": {
    title: "Financial Projections",
    icon: <BarChart3 className="w-5 h-5" />,
    description: "Financial forecasts, scenarios, and break-even analysis",
    dataSources: ["Profit Architecture - Financials"]
  },
  "team": {
    title: "Team & Organization",
    icon: <Heart className="w-5 h-5" />,
    description: "Current team, future hires, and culture",
    dataSources: ["Brain - Team & Roles"]
  },
  "milestones": {
    title: "Milestones & Metrics",
    icon: <Calendar className="w-5 h-5" />,
    description: "KPIs, goals, and progress tracking",
    dataSources: ["All Assessments", "Quick Pulse Check-ins"]
  },
};

export default function BusinessPlanSectionPage() {
  const params = useParams();
  const sectionId = params.section as string;
  
  const meta = sectionMeta[sectionId] || {
    title: "Section Not Found",
    icon: <FileText className="w-5 h-5" />,
    description: "This section does not exist",
    dataSources: []
  };

  return (
    <div className="py-8 px-4 max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <Link 
        href="/business-plan"
        className="inline-flex items-center text-sm text-[#B9A9A9] hover:text-[#1F315B] dark:hover:text-[#F6F1E8] mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Business Plan
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-[#D4AF63]/10 flex items-center justify-center">
            {meta.icon}
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-[#1F315B] dark:text-[#F6F1E8] mb-2">
              {meta.title}
            </h1>
            <p className="text-[#B9A9A9] mb-3">
              {meta.description}
            </p>
            <div className="flex items-center gap-2 text-sm">
              <Brain className="w-4 h-4 text-[#2E7C83]" />
              <span className="text-[#B9A9A9]">Informed by:</span>
              {meta.dataSources.map((source, i) => (
                <span key={i}>
                  <span className="text-[#1F315B] dark:text-[#F6F1E8]">{source}</span>
                  {i < meta.dataSources.length - 1 && <span className="text-[#B9A9A9]">, </span>}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <Card className="mb-6 border-[#D4AF63]/20 bg-[#D4AF63]/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-[#D4AF63] mt-0.5" />
            <div>
              <p className="text-sm text-[#1F315B] dark:text-[#F6F1E8]">
                <strong>How this works:</strong> Answer the targeted questions below. 
                The AI uses your Brain, Soul, and Profit assessment results combined with 
                your specific answers to generate a personalized business plan section. 
                You can then edit, refine, and track metrics against your plan.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section Content with Questions */}
      <SectionContent sectionId={sectionId} />
    </div>
  );
}
