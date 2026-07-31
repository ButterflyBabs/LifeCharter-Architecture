"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import { 
  DollarSign, 
  Users, 
  Target, 
  TrendingUp,
  Phone,
  CheckCircle,
  AlertCircle,
  FileText,
  BarChart3,
  Lightbulb,
  ArrowRight,
  RefreshCw,
  ChevronRight,
  Sparkles
} from "lucide-react";
import Link from "next/link";

interface SalesSection {
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

export default function SalesPage() {
  const [salesHealth] = useState({
    overall: 62,
    pipeline: 70,
    conversion: 55,
    process: 60,
    followup: 65,
  });

  const [sections] = useState<SalesSection[]>([
    { 
      id: "pipeline", 
      title: "Sales Pipeline", 
      status: "in_progress", 
      lastUpdated: "2 days ago", 
      aiGenerated: true,
      completionRate: 70,
      description: "Stages from lead to closed deal"
    },
    { 
      id: "offers", 
      title: "Offers & Packages", 
      status: "complete", 
      lastUpdated: "1 week ago", 
      aiGenerated: true,
      completionRate: 100,
      description: "What you sell and how it's priced"
    },
    { 
      id: "discovery", 
      title: "Discovery Process", 
      status: "in_progress", 
      lastUpdated: "3 days ago", 
      aiGenerated: true,
      completionRate: 60,
      description: "Qualifying and understanding prospects"
    },
    { 
      id: "proposals", 
      title: "Proposals & Contracts", 
      status: "in_progress", 
      lastUpdated: "4 days ago", 
      aiGenerated: true,
      completionRate: 45,
      description: "How you present and close deals"
    },
    { 
      id: "objections", 
      title: "Objection Handling", 
      status: "not_started", 
      lastUpdated: "Never", 
      aiGenerated: false,
      completionRate: 0,
      description: "Responses to common concerns"
    },
    { 
      id: "followup", 
      title: "Follow-Up System", 
      status: "in_progress", 
      lastUpdated: "5 days ago", 
      aiGenerated: true,
      completionRate: 50,
      description: "Nurturing leads who aren't ready yet"
    },
    { 
      id: "metrics", 
      title: "Sales Metrics", 
      status: "not_started", 
      lastUpdated: "Never", 
      aiGenerated: false,
      completionRate: 0,
      description: "What to track and measure"
    },
    { 
      id: "scripts", 
      title: "Sales Scripts", 
      status: "needs_attention", 
      lastUpdated: "2 weeks ago", 
      aiGenerated: true,
      completionRate: 30,
      description: "What to say in key conversations"
    },
    { 
      id: "closing", 
      title: "Closing Techniques", 
      status: "in_progress", 
      lastUpdated: "1 week ago", 
      aiGenerated: true,
      completionRate: 40,
      description: "How to ask for and secure the sale"
    },
    { 
      id: "action-plan", 
      title: "90-Day Action Plan", 
      status: "in_progress", 
      lastUpdated: "3 days ago", 
      aiGenerated: true,
      completionRate: 75,
      description: "Specific tasks to improve sales performance"
    },
  ]);

  const [nextSteps] = useState<NextStep[]>([
    { 
      id: "1", 
      title: "Map out your sales pipeline stages", 
      priority: "high", 
      source: "Pipeline Assessment",
      impact: "Creates clarity on your conversion process",
      completed: false 
    },
    { 
      id: "2", 
      title: "Create objection response templates", 
      priority: "high", 
      source: "Objection Handling",
      impact: "Increases confidence in sales conversations",
      completed: false 
    },
    { 
      id: "3", 
      title: "Set up follow-up automation", 
      priority: "medium", 
      source: "Follow-Up System",
      impact: "Captures more opportunities",
      completed: true 
    },
    { 
      id: "4", 
      title: "Define your key sales metrics", 
      priority: "medium", 
      source: "Sales Metrics",
      impact: "Enables data-driven improvements",
      completed: false 
    },
  ]);

  const [insights] = useState<Insight[]>([
    {
      id: "1",
      type: "opportunity",
      message: "Your offer is strong—focus on discovery to improve conversion",
      action: "Complete the Discovery Process questions"
    },
    {
      id: "2",
      type: "warning",
      message: "No objection handling system—losing deals to unaddressed concerns",
      action: "Build out objection responses"
    },
    {
      id: "3",
      type: "suggestion",
      message: "Add a formal proposal template to increase close rates",
      action: "Complete Proposals & Contracts section"
    },
  ]);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastAiReview, setLastAiReview] = useState("2 days ago");

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
              Sales System
            </h1>
            <p className="text-[#b8a898]">
              AI-powered sales strategy • Last review: {lastAiReview}
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
              {salesHealth.overall}%
            </div>
            <Progress value={salesHealth.overall} className="h-2" />
          </CardContent>
        </Card>

        <Card className="border-[#7b6b8d]/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-[#b8a898]">Pipeline</span>
              <Target className="w-5 h-5 text-[#7b6b8d]" />
            </div>
            <div className="text-3xl font-bold text-[#7b6b8d] mb-2">
              {salesHealth.pipeline}%
            </div>
            <Progress value={salesHealth.pipeline} className="h-2" />
          </CardContent>
        </Card>

        <Card className="border-[#4a9b9b]/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-[#b8a898]">Conversion</span>
              <TrendingUp className="w-5 h-5 text-[#4a9b9b]" />
            </div>
            <div className="text-3xl font-bold text-[#4a9b9b] mb-2">
              {salesHealth.conversion}%
            </div>
            <Progress value={salesHealth.conversion} className="h-2" />
          </CardContent>
        </Card>

        <Card className="border-[#c9a227]/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-[#b8a898]">Process</span>
              <Phone className="w-5 h-5 text-[#c9a227]" />
            </div>
            <div className="text-3xl font-bold text-[#c9a227] mb-2">
              {salesHealth.process}%
            </div>
            <Progress value={salesHealth.process} className="h-2" />
          </CardContent>
        </Card>

        <Card className="border-[#1a2b4a]/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-[#b8a898]">Follow-Up</span>
              <Users className="w-5 h-5 text-[#1a2b4a]" />
            </div>
            <div className="text-3xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0] mb-2">
              {salesHealth.followup}%
            </div>
            <Progress value={salesHealth.followup} className="h-2" />
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
                    href={`/sales/${section.id}`}
                    className="flex items-center justify-between p-4 rounded-lg border border-[#1a2b4a]/10 hover:border-[#c9a227]/30 transition-colors cursor-pointer no-underline"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getStatusBg(section.status)}`}>
                        {section.status === "complete" ? (
                          <CheckCircle className={`w-5 h-5 ${getStatusColor(section.status)}`} />
                        ) : section.status === "needs_attention" ? (
                          <AlertCircle className={`w-5 h-5 ${getStatusColor(section.status)}`} />
                        ) : (
                          <DollarSign className={`w-5 h-5 ${getStatusColor(section.status)}`} />
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
                <Button variant="outline" className="w-full justify-start text-left">
                  <Phone className="w-4 h-4 mr-2" />
                  Log a Call
                </Button>
                <Button variant="outline" className="w-full justify-start text-left">
                  <Target className="w-4 h-4 mr-2" />
                  Update Pipeline
                </Button>
                <Button variant="outline" className="w-full justify-start text-left">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  View Reports
                </Button>
                <Button variant="outline" className="w-full justify-start text-left">
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
                Stuck on a sales challenge? Ask Brujula for guidance on closing more deals.
              </p>
              <Button variant="outline" className="w-full border-[#c9a227] text-[#c9a227] hover:bg-[#c9a227] hover:text-[#1a2b4a]">
                <Phone className="w-4 h-4 mr-2" />
                Ask Brujula
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
