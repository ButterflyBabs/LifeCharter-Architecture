"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import { 
  DollarSign, 
  TrendingDown, 
  TrendingUp, 
  Wallet,
  CreditCard,
  PieChart,
  CheckCircle,
  AlertCircle,
  FileText,
  BarChart3,
  Lightbulb,
  ArrowRight,
  RefreshCw,
  ChevronRight,
  Sparkles,
  Upload,
  Link as LinkIcon,
  Zap
} from "lucide-react";
import Link from "next/link";

interface FinanceSection {
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

export default function FinancePage() {
  const [financeHealth, setFinanceHealth] = useState({
    overall: 0,
    income: 0,
    expenses: 0,
    techstack: 45,
    cashflow: 60,
  });

  // Pull the real health score + this-month income/expense from the ledger.
  useEffect(() => {
    const tz =
      (typeof window !== "undefined" &&
        (localStorage.getItem("userTimezone") || Intl.DateTimeFormat().resolvedOptions().timeZone)) ||
      "UTC";
    fetch(`/api/finance/entries?tz=${encodeURIComponent(tz)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        const score = d.health?.score ?? 0;
        const inc = d.mtd?.income ?? 0;
        const exp = d.mtd?.expense ?? 0;
        setFinanceHealth((h) => ({
          ...h,
          overall: score,
          income: inc > 0 ? Math.min(100, Math.round((inc / Math.max(inc, exp)) * 100)) : 0,
          expenses: exp > 0 ? Math.min(100, Math.round((1 - Math.min(1, exp / Math.max(inc, 1))) * 100)) : 0,
        }));
      })
      .catch(() => {});
  }, []);

  const [sections] = useState<FinanceSection[]>([
    { 
      id: "income", 
      title: "Income Tracker", 
      status: "in_progress", 
      lastUpdated: "2 days ago", 
      aiGenerated: true,
      completionRate: 65,
      description: "Revenue from all sources with payment processor connections"
    },
    { 
      id: "expenses", 
      title: "Expense Manager", 
      status: "in_progress", 
      lastUpdated: "1 week ago", 
      aiGenerated: true,
      completionRate: 55,
      description: "Track and categorize all business expenses"
    },
    { 
      id: "techstack", 
      title: "Tech Stack Optimizer", 
      status: "in_progress", 
      lastUpdated: "3 days ago", 
      aiGenerated: true,
      completionRate: 45,
      description: "Software inventory with AI-powered cost optimization"
    },
    { 
      id: "cashflow", 
      title: "Cash Flow Dashboard", 
      status: "in_progress", 
      lastUpdated: "4 days ago", 
      aiGenerated: true,
      completionRate: 60,
      description: "Real-time view of money in and out"
    },
    { 
      id: "reports", 
      title: "Financial Reports", 
      status: "not_started", 
      lastUpdated: "Never", 
      aiGenerated: false,
      completionRate: 0,
      description: "P&L, tax reports, and business health summaries"
    },
    { 
      id: "budget", 
      title: "Budget Planner", 
      status: "not_started", 
      lastUpdated: "Never", 
      aiGenerated: false,
      completionRate: 0,
      description: "Set and track spending limits by category"
    },
    { 
      id: "taxes", 
      title: "Tax Preparation", 
      status: "needs_attention", 
      lastUpdated: "2 weeks ago", 
      aiGenerated: true,
      completionRate: 30,
      description: "Organize deductions and estimated payments"
    },
  ]);

  const [nextSteps] = useState<NextStep[]>([
    { 
      id: "1", 
      title: "Connect Stripe account for automatic income tracking", 
      priority: "high", 
      source: "Income Tracker",
      impact: "Eliminates manual data entry",
      completed: false 
    },
    { 
      id: "2", 
      title: "Upload bank statements for expense categorization", 
      priority: "high", 
      source: "Expense Manager",
      impact: "Complete financial picture",
      completed: false 
    },
    { 
      id: "3", 
      title: "Run Tech Stack AI assessment", 
      priority: "medium", 
      source: "Tech Stack Optimizer",
      impact: "Identify $200-500/month in savings",
      completed: true 
    },
    { 
      id: "4", 
      title: "Review duplicate software subscriptions", 
      priority: "medium", 
      source: "Tech Stack Analysis",
      impact: "Reduce redundant expenses",
      completed: false 
    },
  ]);

  const [insights] = useState<Insight[]>([
    {
      id: "1",
      type: "opportunity",
      message: "You may be paying for 3 overlapping project management tools",
      action: "Run Tech Stack assessment"
    },
    {
      id: "2",
      type: "warning",
      message: "Q3 estimated tax payment due in 15 days",
      action: "Review tax preparation section"
    },
    {
      id: "3",
      type: "suggestion",
      message: "Connect payment processors to automate income tracking",
      action: "Set up Stripe/PayPal integration"
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
              Finance Center
            </h1>
            <p className="text-[#b8a898]">
              AI-powered financial management • Last review: {lastAiReview}
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/finance/pulse">
              <Button>
                <BarChart3 className="w-4 h-4 mr-2" />
                Financial Pulse
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={handleRefreshPlan}
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              {isRefreshing ? "Refreshing..." : "AI Refresh"}
            </Button>
            <Link href="/finance/pnl">
              <Button>
                <FileText className="w-4 h-4 mr-2" />
                Export Report
              </Button>
            </Link>
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
              {financeHealth.overall}%
            </div>
            <Progress value={financeHealth.overall} className="h-2" />
          </CardContent>
        </Card>

        <Card className="border-[#7b6b8d]/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-[#b8a898]">Income</span>
              <TrendingUp className="w-5 h-5 text-[#7b6b8d]" />
            </div>
            <div className="text-3xl font-bold text-[#7b6b8d] mb-2">
              {financeHealth.income}%
            </div>
            <Progress value={financeHealth.income} className="h-2" />
          </CardContent>
        </Card>

        <Card className="border-[#4a9b9b]/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-[#b8a898]">Expenses</span>
              <TrendingDown className="w-5 h-5 text-[#4a9b9b]" />
            </div>
            <div className="text-3xl font-bold text-[#4a9b9b] mb-2">
              {financeHealth.expenses}%
            </div>
            <Progress value={financeHealth.expenses} className="h-2" />
          </CardContent>
        </Card>

        <Card className="border-[#c9a227]/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-[#b8a898]">Tech Stack</span>
              <Zap className="w-5 h-5 text-[#c9a227]" />
            </div>
            <div className="text-3xl font-bold text-[#c9a227] mb-2">
              {financeHealth.techstack}%
            </div>
            <Progress value={financeHealth.techstack} className="h-2" />
          </CardContent>
        </Card>

        <Card className="border-[#1a2b4a]/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-[#b8a898]">Cash Flow</span>
              <Wallet className="w-5 h-5 text-[#1a2b4a]" />
            </div>
            <div className="text-3xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0] mb-2">
              {financeHealth.cashflow}%
            </div>
            <Progress value={financeHealth.cashflow} className="h-2" />
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
                Finance Sections
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
                    href={`/finance/${section.id}`}
                    className="flex items-center justify-between p-4 rounded-lg border border-[#1a2b4a]/10 hover:border-[#c9a227]/30 transition-colors cursor-pointer no-underline"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getStatusBg(section.status)}`}>
                        {section.status === "complete" ? (
                          <CheckCircle className={`w-5 h-5 ${getStatusColor(section.status)}`} />
                        ) : section.status === "needs_attention" ? (
                          <AlertCircle className={`w-5 h-5 ${getStatusColor(section.status)}`} />
                        ) : section.id === "income" ? (
                          <TrendingUp className={`w-5 h-5 ${getStatusColor(section.status)}`} />
                        ) : section.id === "expenses" ? (
                          <TrendingDown className={`w-5 h-5 ${getStatusColor(section.status)}`} />
                        ) : section.id === "techstack" ? (
                          <Zap className={`w-5 h-5 ${getStatusColor(section.status)}`} />
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
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Statement
                </Button>
                <Button variant="outline" className="w-full justify-start text-left">
                  <LinkIcon className="w-4 h-4 mr-2" />
                  Connect Account
                </Button>
                <Button variant="outline" className="w-full justify-start text-left">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Add Expense
                </Button>
                <Button variant="outline" className="w-full justify-start text-left">
                  <PieChart className="w-4 h-4 mr-2" />
                  View Reports
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
                Questions about your finances? Ask Brujula for guidance on optimizing cash flow.
              </p>
              <Button variant="outline" className="w-full border-[#c9a227] text-[#c9a227] hover:bg-[#c9a227] hover:text-[#1a2b4a]">
                <DollarSign className="w-4 h-4 mr-2" />
                Ask Brujula
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
