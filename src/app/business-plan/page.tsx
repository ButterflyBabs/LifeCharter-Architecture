/**
 * Business Plan Page
 * AI-powered living business plan informed by Brain, Soul, Profit assessments
 */

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import { 
  Brain, 
  Heart, 
  DollarSign, 
  RefreshCw,
  Calendar,
  Target,
  AlertCircle,
  CheckCircle,
  FileText,
  BarChart3,
  Lightbulb,
  ArrowRight
} from "lucide-react";

interface BusinessPlanSection {
  id: string;
  title: string;
  status: "complete" | "in_progress" | "needs_attention";
  lastUpdated: string;
  aiGenerated: boolean;
  content?: string;
}

interface ReviewCycle {
  type: "monthly" | "quarterly" | "semi_annual" | "annual";
  status: "due" | "upcoming" | "completed";
  dueDate: string;
  completionRate?: number;
}

interface NextStep {
  id: string;
  title: string;
  priority: "high" | "medium" | "low";
  source: string;
  impact: string;
  completed: boolean;
}

interface PivotSignal {
  id: string;
  signal: string;
  severity: "warning" | "critical" | "opportunity";
  suggestedAction: string;
}

export default function BusinessPlanPage() {
  const [planHealth] = useState({
    overall: 78,
    vision: 85,
    revenue: 72,
    systems: 91,
  });
  
  const [sections] = useState<BusinessPlanSection[]>([
    { id: "executive_summary", title: "Executive Summary", status: "complete", lastUpdated: "2 days ago", aiGenerated: true },
    { id: "products", title: "Products & Services", status: "complete", lastUpdated: "1 week ago", aiGenerated: true },
    { id: "pricing", title: "Pricing Strategy", status: "in_progress", lastUpdated: "3 days ago", aiGenerated: true },
    { id: "revenue", title: "Revenue Model", status: "complete", lastUpdated: "1 week ago", aiGenerated: true },
    { id: "market", title: "Target Market", status: "complete", lastUpdated: "2 weeks ago", aiGenerated: true },
    { id: "marketing", title: "Marketing Strategy", status: "in_progress", lastUpdated: "4 days ago", aiGenerated: true },
    { id: "operations", title: "Operations Plan", status: "complete", lastUpdated: "1 week ago", aiGenerated: true },
    { id: "financials", title: "Financial Projections", status: "needs_attention", lastUpdated: "2 weeks ago", aiGenerated: true },
    { id: "team", title: "Team & Organization", status: "complete", lastUpdated: "3 weeks ago", aiGenerated: true },
    { id: "milestones", title: "Milestones & Metrics", status: "complete", lastUpdated: "5 days ago", aiGenerated: true },
  ]);
  
  const [reviewCycles] = useState<ReviewCycle[]>([
    { type: "monthly", status: "due", dueDate: "2026-07-20", completionRate: 67 },
    { type: "quarterly", status: "upcoming", dueDate: "2026-08-15" },
    { type: "semi_annual", status: "upcoming", dueDate: "2026-10-01" },
    { type: "annual", status: "upcoming", dueDate: "2027-01-01" },
  ]);
  
  const [nextSteps] = useState<NextStep[]>([
    { 
      id: "1", 
      title: "Review and increase Package B pricing by 15%", 
      priority: "high", 
      source: "Profit Architecture Assessment",
      impact: "+$2,400/month projected",
      completed: false 
    },
    { 
      id: "2", 
      title: "Schedule 2-hour vision retreat to reconnect with purpose", 
      priority: "high", 
      source: "Soul Assessment - Score declined",
      impact: "Restore alignment and energy",
      completed: false 
    },
    { 
      id: "3", 
      title: "Document SOP for client onboarding process", 
      priority: "medium", 
      source: "Brain Assessment",
      impact: "Improve consistency and reduce cognitive load",
      completed: true 
    },
    { 
      id: "4", 
      title: "Update financial projections with Q2 actuals", 
      priority: "medium", 
      source: "Monthly Review",
      impact: "More accurate forecasting",
      completed: false 
    },
  ]);
  
  const [pivotSignals] = useState<PivotSignal[]>([
    {
      id: "1",
      signal: "Revenue consistently 12% below plan for 3 months",
      severity: "warning",
      suggestedAction: "Consider shifting from 1:1 to group program model"
    },
    {
      id: "2",
      signal: "Soul score declined from 70% to 60%",
      severity: "critical",
      suggestedAction: "Immediate alignment check - purpose disconnect detected"
    },
  ]);
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastAiReview, setLastAiReview] = useState("3 days ago");

  const handleRefreshPlan = async () => {
    setIsRefreshing(true);
    // Simulate AI refresh
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
      default: return "text-gray-500";
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case "complete": return "bg-green-500/10";
      case "in_progress": return "bg-yellow-500/10";
      case "needs_attention": return "bg-red-500/10";
      default: return "bg-gray-500/10";
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "warning": return "border-yellow-500/30 bg-yellow-500/5";
      case "critical": return "border-red-500/30 bg-red-500/5";
      case "opportunity": return "border-green-500/30 bg-green-500/5";
      default: return "border-gray-500/30";
    }
  };

  return (
    <div className="py-8 px-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#1F315B] dark:text-[#F6F1E8] mb-2">
              Business Plan
            </h1>
            <p className="text-[#B9A9A9]">
              AI-powered living document • Last review: {lastAiReview}
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
            <Button variant="primary">
              <FileText className="w-4 h-4 mr-2" />
              Export Plan
            </Button>
          </div>
        </div>
      </div>

      {/* Executive Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="border-[#D4AF63]/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-[#B9A9A9]">Overall Health</span>
              <BarChart3 className="w-5 h-5 text-[#D4AF63]" />
            </div>
            <div className="text-3xl font-bold text-[#1F315B] dark:text-[#F6F1E8] mb-2">
              {planHealth.overall}%
            </div>
            <Progress value={planHealth.overall} className="h-2" />
          </CardContent>
        </Card>

        <Card className="border-[#5E3B6C]/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-[#B9A9A9]">Vision Alignment</span>
              <Heart className="w-5 h-5 text-[#5E3B6C]" />
            </div>
            <div className="text-3xl font-bold text-[#5E3B6C] mb-2">
              {planHealth.vision}%
            </div>
            <Progress value={planHealth.vision} className="h-2" />
          </CardContent>
        </Card>

        <Card className="border-[#D4AF63]/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-[#B9A9A9]">Revenue Health</span>
              <DollarSign className="w-5 h-5 text-[#D4AF63]" />
            </div>
            <div className="text-3xl font-bold text-[#D4AF63] mb-2">
              {planHealth.revenue}%
            </div>
            <Progress value={planHealth.revenue} className="h-2" />
          </CardContent>
        </Card>

        <Card className="border-[#2E7C83]/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-[#B9A9A9]">Systems Strength</span>
              <Brain className="w-5 h-5 text-[#2E7C83]" />
            </div>
            <div className="text-3xl font-bold text-[#2E7C83] mb-2">
              {planHealth.systems}%
            </div>
            <Progress value={planHealth.systems} className="h-2" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Plan Sections */}
        <div className="lg:col-span-2 space-y-6">
          {/* Plan Sections */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <h2 className="text-xl font-semibold text-[#1F315B] dark:text-[#F6F1E8]">
                Plan Sections
              </h2>
              <span className="text-sm text-[#B9A9A9]">
                {sections.filter(s => s.status === "complete").length}/{sections.length} Complete
              </span>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {sections.map((section) => (
                  <div 
                    key={section.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-[#1F315B]/10 hover:border-[#D4AF63]/30 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getStatusBg(section.status)}`}>
                        {section.status === "complete" ? (
                          <CheckCircle className={`w-5 h-5 ${getStatusColor(section.status)}`} />
                        ) : section.status === "needs_attention" ? (
                          <AlertCircle className={`w-5 h-5 ${getStatusColor(section.status)}`} />
                        ) : (
                          <FileText className={`w-5 h-5 ${getStatusColor(section.status)}`} />
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium text-[#1F315B] dark:text-[#F6F1E8]">
                          {section.title}
                        </h3>
                        <p className="text-sm text-[#B9A9A9]">
                          Updated {section.lastUpdated} • {section.aiGenerated ? "AI-generated" : "Manual"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm capitalize ${getStatusColor(section.status)}`}>
                        {section.status.replace("_", " ")}
                      </span>
                      <ArrowRight className="w-4 h-4 text-[#B9A9A9]" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Pivot Signals */}
          {pivotSignals.length > 0 && (
            <Card className="border-red-500/20">
              <CardHeader>
                <h2 className="text-xl font-semibold text-[#1F315B] dark:text-[#F6F1E8] flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-[#D4AF63]" />
                  Pivot Signals Detected
                </h2>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {pivotSignals.map((signal) => (
                    <div 
                      key={signal.id}
                      className={`p-4 rounded-lg border ${getSeverityColor(signal.severity)}`}
                    >
                      <div className="flex items-start gap-3">
                        <AlertCircle className={`w-5 h-5 mt-0.5 ${signal.severity === "critical" ? "text-red-500" : "text-yellow-500"}`} />
                        <div className="flex-1">
                          <p className="font-medium text-[#1F315B] dark:text-[#F6F1E8] mb-1">
                            {signal.signal}
                          </p>
                          <p className="text-sm text-[#B9A9A9] mb-3">
                            Suggested: {signal.suggestedAction}
                          </p>
                          <div className="flex gap-2">
                            <Button size="sm" variant="primary">
                              Explore Pivot
                            </Button>
                            <Button size="sm" variant="ghost">
                              Dismiss
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Reviews & Next Steps */}
        <div className="space-y-6">
          {/* Review Cycles */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-[#1F315B] dark:text-[#F6F1E8] flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#2E7C83]" />
                Review Cycles
              </h2>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {reviewCycles.map((cycle) => (
                  <div 
                    key={cycle.type}
                    className="flex items-center justify-between p-3 rounded-lg border border-[#1F315B]/10"
                  >
                    <div>
                      <p className="font-medium text-[#1F315B] dark:text-[#F6F1E8] capitalize">
                        {cycle.type.replace("_", " ")}
                      </p>
                      <p className="text-sm text-[#B9A9A9]">
                        Due: {new Date(cycle.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      {cycle.status === "due" ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-500">
                          Due Soon
                        </span>
                      ) : cycle.status === "completed" ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-500">
                          {cycle.completionRate}% Done
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500">
                          Upcoming
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <Button className="w-full mt-4" variant="outline">
                Start Monthly Review
              </Button>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-[#1F315B] dark:text-[#F6F1E8] flex items-center gap-2">
                <Target className="w-5 h-5 text-[#D4AF63]" />
                Three Steps Forward
              </h2>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {nextSteps.map((step, index) => (
                  <div 
                    key={step.id}
                    className={`p-4 rounded-lg border ${step.completed ? "border-green-500/20 bg-green-500/5" : "border-[#1F315B]/10"}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${step.completed ? "bg-green-500 text-white" : step.priority === "high" ? "bg-red-500 text-white" : "bg-[#D4AF63] text-white"}`}>
                        {step.completed ? "✓" : index + 1}
                      </div>
                      <div className="flex-1">
                        <p className={`font-medium text-[#1F315B] dark:text-[#F6F1E8] ${step.completed ? "line-through opacity-50" : ""}`}>
                          {step.title}
                        </p>
                        <p className="text-xs text-[#B9A9A9] mt-1">
                          Source: {step.source}
                        </p>
                        <p className="text-xs text-[#D4AF63] mt-1">
                          Impact: {step.impact}
                        </p>
                        {!step.completed && (
                          <div className="flex gap-2 mt-3">
                            <Button size="sm" variant="primary">
                              Mark Complete
                            </Button>
                            <Button size="sm" variant="ghost">
                              Snooze
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Button className="w-full mt-4" variant="outline">
                View All Action Items
              </Button>
            </CardContent>
          </Card>

          {/* Assessment Data Sources */}
          <Card className="bg-gradient-to-br from-[#1F315B] to-[#5E3B6C] text-white">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Brain className="w-5 h-5" />
                Data Sources
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span>Brain Assessment</span>
                  <span className="text-[#D4AF63]">Last: 1 week ago</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Soul Assessment</span>
                  <span className="text-[#D4AF63]">Last: 2 weeks ago</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Profit Architecture</span>
                  <span className="text-[#D4AF63]">Last: 3 days ago</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Quick Pulse</span>
                  <span className="text-[#D4AF63]">Last: 5 days ago</span>
                </div>
              </div>
              <Button className="w-full mt-4 bg-white/10 hover:bg-white/20 text-white border-0">
                Update All Assessments
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
