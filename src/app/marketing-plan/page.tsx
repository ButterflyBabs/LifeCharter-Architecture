"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import { 
  Target, 
  Users, 
  MessageSquare, 
  TrendingUp,
  Megaphone,
  CheckCircle,
  AlertCircle,
  FileText,
  BarChart3,
  Lightbulb,
  ArrowRight,
  RefreshCw,
  ChevronRight,
  Sparkles,
  Edit3,
  Eye
} from "lucide-react";
import Link from "next/link";

interface MarketingPlanSection {
  id: string;
  title: string;
  status: "complete" | "in_progress" | "needs_attention" | "not_started";
  lastUpdated: string;
  aiGenerated: boolean;
  completionRate: number;
  description: string;
}

interface NextStep {
  id: string;
  title: string;
  priority: "high" | "medium" | "low";
  source: string;
  impact: string;
  completed: boolean;
}

interface Insight {
  id: string;
  type: "opportunity" | "warning" | "suggestion";
  message: string;
  action: string;
}

export default function MarketingPlanPage() {
  const [planHealth] = useState({
    overall: 68,
    positioning: 75,
    audience: 60,
    messaging: 70,
    channels: 65,
  });

  const [sections] = useState<MarketingPlanSection[]>([
    { 
      id: "positioning", 
      title: "Positioning & UVP", 
      status: "complete", 
      lastUpdated: "2 days ago", 
      aiGenerated: true,
      completionRate: 100,
      description: "What makes you different and why clients choose you"
    },
    { 
      id: "ideal-client", 
      title: "Ideal Client Profile", 
      status: "in_progress", 
      lastUpdated: "1 week ago", 
      aiGenerated: true,
      completionRate: 60,
      description: "Deep understanding of who you serve and their pain points"
    },
    { 
      id: "messaging", 
      title: "Core Messaging", 
      status: "complete", 
      lastUpdated: "3 days ago", 
      aiGenerated: true,
      completionRate: 100,
      description: "Taglines, talking points, and your brand story"
    },
    { 
      id: "channels", 
      title: "Channel Strategy", 
      status: "in_progress", 
      lastUpdated: "4 days ago", 
      aiGenerated: true,
      completionRate: 45,
      description: "Where you&apos;ll show up and how often"
    },
    { 
      id: "content", 
      title: "Content Strategy", 
      status: "not_started", 
      lastUpdated: "Never", 
      aiGenerated: false,
      completionRate: 0,
      description: "What you&apos;ll create and your content pillars"
    },
    { 
      id: "lead-gen", 
      title: "Lead Generation", 
      status: "in_progress", 
      lastUpdated: "5 days ago", 
      aiGenerated: true,
      completionRate: 50,
      description: "How you&apos;ll attract and capture potential clients"
    },
    { 
      id: "nurture", 
      title: "Nurture Sequence", 
      status: "not_started", 
      lastUpdated: "Never", 
      aiGenerated: false,
      completionRate: 0,
      description: "Email sequence to build trust and convert leads"
    },
    { 
      id: "conversion", 
      title: "Conversion Strategy", 
      status: "needs_attention", 
      lastUpdated: "2 weeks ago", 
      aiGenerated: true,
      completionRate: 30,
      description: "How you&apos;ll turn interest into sales"
    },
    { 
      id: "metrics", 
      title: "Metrics & KPIs", 
      status: "in_progress", 
      lastUpdated: "1 week ago", 
      aiGenerated: true,
      completionRate: 40,
      description: "What you&apos;ll track to measure success"
    },
    { 
      id: "action-plan", 
      title: "90-Day Action Plan", 
      status: "in_progress", 
      lastUpdated: "3 days ago", 
      aiGenerated: true,
      completionRate: 75,
      description: "Specific tasks and timeline for implementation"
    },
  ]);

  const [nextSteps] = useState<NextStep[]>([
    { 
      id: "1", 
      title: "Complete Ideal Client deep-dive questions", 
      priority: "high", 
      source: "Positioning Assessment",
      impact: "Unlocks all messaging and channel decisions",
      completed: false 
    },
    { 
      id: "2", 
      title: "Define your 3 content pillars", 
      priority: "high", 
      source: "Content Strategy",
      impact: "Creates consistency in your messaging",
      completed: false 
    },
    { 
      id: "3", 
      title: "Set up primary marketing channel", 
      priority: "medium", 
      source: "Channel Strategy",
      impact: "Establishes your home base",
      completed: true 
    },
    { 
      id: "4", 
      title: "Create lead magnet outline", 
      priority: "medium", 
      source: "Lead Generation",
      impact: "Starts your list-building engine",
      completed: false 
    },
  ]);

  const [insights] = useState<Insight[]>([
    {
      id: "1",
      type: "opportunity",
      message: "Your positioning is strong—consider expanding to LinkedIn",
      action: "Add LinkedIn to your channel strategy"
    },
    {
      id: "2",
      type: "warning",
      message: "Conversion strategy needs attention—no clear path to sale",
      action: "Complete the conversion funnel questions"
    },
    {
      id: "3",
      type: "suggestion",
      message: "Add video content based on your comfort level",
      action: "Explore video content options"
    },
  ]);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastAiReview, setLastAiReview] = useState("3 days ago");

  const handleRefreshPlan = async () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setLastAiReview("Just now");
    }, 2000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "complete": return "text-green-500";
      case "in_progress": return "text-yellow-500";
      case "needs_attention": return "text-red-500";
      case "not_started": return "text-gray-400";
      default: return "text-gray-500";
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case "complete": return "bg-green-500/10";
      case "in_progress": return "bg-yellow-500/10";
      case "needs_attention": return "bg-red-500/10";
      case "not_started": return "bg-gray-500/10";
      default: return "bg-gray-500/10";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "complete": return "Complete";
      case "in_progress": return "In Progress";
      case "needs_attention": return "Needs Attention";
      case "not_started": return "Not Started";
      default: return status;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case "opportunity": return "border-green-500/30 bg-green-500/5";
      case "warning": return "border-red-500/30 bg-red-500/5";
      case "suggestion": return "border-[#c9a227]/30 bg-[#c9a227]/5";
      default: return "border-gray-500/30";
    }
  };

  const completedSections = sections.filter(s => s.status === "complete").length;
  const inProgressSections = sections.filter(s => s.status === "in_progress").length;

  return (
    <div className="py-8 px-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0] mb-2">
              Marketing Plan
            </h1>
            <p className="text-[#b8a898]">
              AI-powered strategy • Last review: {lastAiReview}
            </p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={handleRefreshPlan}
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              {isRefreshing ? "Refreshing..." : "AI Refresh"}
            </Button>
            <Button>
              <FileText className="w-4 h-4 mr-2" />
              Export Plan
            </Button>
          </div>
        </div>
      </div>

      {/* Executive Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <Card className="border-[#c9a227]/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-[#b8a898]">Overall Health</span>
              <BarChart3 className="w-5 h-5 text-[#c9a227]" />
            </div>
            <div className="text-3xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0] mb-2">
              {planHealth.overall}%
            </div>
            <Progress value={planHealth.overall} className="h-2" />
          </CardContent>
        </Card>

        <Card className="border-[#7b6b8d]/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-[#b8a898]">Positioning</span>
              <Target className="w-5 h-5 text-[#7b6b8d]" />
            </div>
            <div className="text-3xl font-bold text-[#7b6b8d] mb-2">
              {planHealth.positioning}%
            </div>
            <Progress value={planHealth.positioning} className="h-2" />
          </CardContent>
        </Card>

        <Card className="border-[#4a9b9b]/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-[#b8a898]">Audience</span>
              <Users className="w-5 h-5 text-[#4a9b9b]" />
            </div>
            <div className="text-3xl font-bold text-[#4a9b9b] mb-2">
              {planHealth.audience}%
            </div>
            <Progress value={planHealth.audience} className="h-2" />
          </CardContent>
        </Card>

        <Card className="border-[#c9a227]/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-[#b8a898]">Messaging</span>
              <MessageSquare className="w-5 h-5 text-[#c9a227]" />
            </div>
            <div className="text-3xl font-bold text-[#c9a227] mb-2">
              {planHealth.messaging}%
            </div>
            <Progress value={planHealth.messaging} className="h-2" />
          </CardContent>
        </Card>

        <Card className="border-[#1a2b4a]/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-[#b8a898]">Channels</span>
              <TrendingUp className="w-5 h-5 text-[#1a2b4a]" />
            </div>
            <div className="text-3xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0] mb-2">
              {planHealth.channels}%
            </div>
            <Progress value={planHealth.channels} className="h-2" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Plan Sections */}
        <div className="lg:col-span-2 space-y-6">
          {/* Plan Sections */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <h2 className="text-xl font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">
                Plan Sections
              </h2>
              <span className="text-sm text-[#b8a898]">
                {completedSections}/{sections.length} Complete • {inProgressSections} In Progress
              </span>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {sections.map((section) => (
                  <Link 
                    key={section.id}
                    href={`/marketing-plan/${section.id}`}
                    className="flex items-center justify-between p-4 rounded-lg border border-[#1a2b4a]/10 hover:border-[#c9a227]/30 transition-colors cursor-pointer no-underline"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getStatusBg(section.status)}`}>
                        {section.status === "complete" ? (
                          <CheckCircle className={`w-5 h-5 ${getStatusColor(section.status)}`} />
                        ) : section.status === "needs_attention" ? (
                          <AlertCircle className={`w-5 h-5 ${getStatusColor(section.status)}`} />
                        ) : (
                          <FileText className={`w-5 h-5 ${getStatusColor(section.status)}`} />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">
                            {section.title}
                          </h3>
                          {section.aiGenerated && (
                            <Sparkles className="w-3 h-3 text-[#c9a227]" />
                          )}
                        </div>
                        <p className="text-sm text-[#b8a898]">{section.description}</p>
                        <div className="flex items-center gap-4 mt-1">
                          <span className={`text-xs ${getStatusColor(section.status)}`}>
                            {getStatusLabel(section.status)}
                          </span>
                          <span className="text-xs text-[#b8a898]">
                            {section.completionRate}% complete
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-24">
                        <Progress value={section.completionRate} className="h-1.5" />
                      </div>
                      <ChevronRight className="w-5 h-5 text-[#b8a898]" />
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* AI Insights */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-[#1a2b4a] dark:text-[#F8F5F0] flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-[#c9a227]" />
                AI Insights
              </h2>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {insights.map((insight) => (
                  <div 
                    key={insight.id}
                    className={`p-4 rounded-lg border ${getInsightColor(insight.type)}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <p className="text-[#1a2b4a] dark:text-[#F8F5F0] font-medium mb-1">
                          {insight.message}
                        </p>
                        <p className="text-sm text-[#7b6b8d] dark:text-[#e8e4f0]">
                          Suggested action: {insight.action}
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Next Steps & Quick Actions */}
        <div className="space-y-6">
          {/* Next Steps */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">
                Next Steps
              </h2>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {nextSteps.map((step) => (
                  <div 
                    key={step.id}
                    className={`p-4 rounded-lg border ${step.completed ? 'border-green-500/30 bg-green-500/5' : 'border-[#1a2b4a]/10'} transition-colors`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 ${step.completed ? 'text-green-500' : 'text-[#c9a227]'}`}>
                        {step.completed ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          <div className={`w-5 h-5 rounded-full border-2 ${step.priority === 'high' ? 'border-red-500' : 'border-[#c9a227]'}`} />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`font-medium ${step.completed ? 'line-through text-[#b8a898]' : 'text-[#1a2b4a] dark:text-[#F8F5F0]'}`}>
                          {step.title}
                        </p>
                        <p className="text-xs text-[#b8a898] mt-1">
                          From: {step.source}
                        </p>
                        <p className="text-xs text-[#7b6b8d] dark:text-[#e8e4f0] mt-1">
                          Impact: {step.impact}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4">
                View All Tasks
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">
                Quick Actions
              </h2>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit Plan
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Megaphone className="w-4 h-4 mr-2" />
                  Start Campaign
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Eye className="w-4 h-4 mr-2" />
                  Preview Plan
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="w-4 h-4 mr-2" />
                  Export PDF
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Help Card */}
          <Card className="bg-gradient-to-br from-[#1a2b4a] to-[#7b6b8d] text-[#F8F5F0]">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#c9a227]" />
                Need Help?
              </h3>
              <p className="text-sm text-[#e8e4f0] mb-4">
                Stuck on a section? Ask Brujula for guidance on your marketing strategy.
              </p>
              <Button variant="outline" className="w-full border-[#c9a227] text-[#c9a227] hover:bg-[#c9a227] hover:text-[#1a2b4a]">
                <MessageSquare className="w-4 h-4 mr-2" />
                Ask Brujula
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
