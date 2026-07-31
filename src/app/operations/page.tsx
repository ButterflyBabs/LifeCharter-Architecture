"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  Settings,
  Users,
  ShoppingCart,
  UserPlus,
  HeadphonesIcon,
  MessageSquare,
  Package,
  Heart,
  Share2,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowRight,
  Sparkles,
  Target,
  Zap,
  BarChart3
} from "lucide-react";
import Link from "next/link";

interface OperationsSection {
  id: string;
  name: string;
  description: string;
  status: "complete" | "in_progress" | "needs_attention" | "not_started";
  completionRate: number;
  icon: React.ReactNode;
  route: string;
  metrics: {
    label: string;
    value: string;
    trend?: "up" | "down" | "neutral";
  }[];
}

interface AIInsight {
  id: string;
  type: "opportunity" | "warning" | "suggestion";
  message: string;
  section?: string;
}

interface NextStep {
  id: string;
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  effort: "high" | "medium" | "low";
  section: string;
}

export default function OperationsPage() {
  const [sections] = useState<OperationsSection[]>([
    {
      id: "acquisition",
      name: "Customer Acquisition",
      description: "Lead generation, traffic sources, and conversion optimization",
      status: "in_progress",
      completionRate: 65,
      icon: <Users className="w-5 h-5" />,
      route: "/operations/acquisition",
      metrics: [
        { label: "Monthly Leads", value: "127", trend: "up" },
        { label: "Cost per Lead", value: "$23", trend: "down" },
        { label: "Conversion Rate", value: "4.2%", trend: "up" }
      ]
    },
    {
      id: "sales-journey",
      name: "Sales Journey",
      description: "Pipeline stages, touchpoints, and closing processes",
      status: "in_progress",
      completionRate: 70,
      icon: <ShoppingCart className="w-5 h-5" />,
      route: "/operations/sales-journey",
      metrics: [
        { label: "Active Opportunities", value: "18", trend: "up" },
        { label: "Avg Deal Size", value: "$2,400", trend: "up" },
        { label: "Close Rate", value: "28%", trend: "neutral" }
      ]
    },
    {
      id: "onboarding",
      name: "Onboarding",
      description: "New client welcome, setup, and first 30-day experience",
      status: "needs_attention",
      completionRate: 45,
      icon: <UserPlus className="w-5 h-5" />,
      route: "/operations/onboarding",
      metrics: [
        { label: "Avg Onboarding Time", value: "5.2 days", trend: "down" },
        { label: "Completion Rate", value: "78%", trend: "up" },
        { label: "Satisfaction", value: "4.6/5", trend: "up" }
      ]
    },
    {
      id: "support",
      name: "Support - Customer Service",
      description: "Help desk, ticket management, and issue resolution",
      status: "complete",
      completionRate: 85,
      icon: <HeadphonesIcon className="w-5 h-5" />,
      route: "/operations/support",
      metrics: [
        { label: "Avg Response Time", value: "2.3 hrs", trend: "down" },
        { label: "Resolution Rate", value: "94%", trend: "up" },
        { label: "CSAT Score", value: "4.8/5", trend: "up" }
      ]
    },
    {
      id: "communication",
      name: "Communication",
      description: "Email sequences, notifications, and client touchpoints",
      status: "in_progress",
      completionRate: 60,
      icon: <MessageSquare className="w-5 h-5" />,
      route: "/operations/communication",
      metrics: [
        { label: "Email Open Rate", value: "42%", trend: "up" },
        { label: "Click Rate", value: "8.5%", trend: "up" },
        { label: "Unsubscribe Rate", value: "0.8%", trend: "down" }
      ]
    },
    {
      id: "fulfillment",
      name: "Fulfillment",
      description: "Service delivery, product shipping, and promise keeping",
      status: "in_progress",
      completionRate: 75,
      icon: <Package className="w-5 h-5" />,
      route: "/operations/fulfillment",
      metrics: [
        { label: "On-Time Delivery", value: "96%", trend: "up" },
        { label: "Quality Score", value: "4.7/5", trend: "neutral" },
        { label: "Refund Rate", value: "2.1%", trend: "down" }
      ]
    },
    {
      id: "internal-culture",
      name: "Internal Process & Culture",
      description: "Team workflows, SOPs, values, and company culture",
      status: "not_started",
      completionRate: 25,
      icon: <Heart className="w-5 h-5" />,
      route: "/operations/internal-culture",
      metrics: [
        { label: "SOPs Documented", value: "12/40", trend: "up" },
        { label: "Team Satisfaction", value: "4.5/5", trend: "neutral" },
        { label: "Process Adherence", value: "68%", trend: "up" }
      ]
    },
    {
      id: "referral",
      name: "Referral Process",
      description: "Advocate programs, incentives, and word-of-mouth systems",
      status: "needs_attention",
      completionRate: 35,
      icon: <Share2 className="w-5 h-5" />,
      route: "/operations/referral",
      metrics: [
        { label: "Referral Rate", value: "12%", trend: "up" },
        { label: "Advocates Active", value: "23", trend: "up" },
        { label: "Referred Revenue", value: "$8,400", trend: "up" }
      ]
    }
  ]);

  const [aiInsights] = useState<AIInsight[]>([
    {
      id: "1",
      type: "warning",
      message: "Onboarding completion rate dropped 8% this month. Consider adding a mid-journey check-in.",
      section: "Onboarding"
    },
    {
      id: "2",
      type: "opportunity",
      message: "Your referral rate is above industry average. Formalizing an advocate program could 2x this.",
      section: "Referral Process"
    },
    {
      id: "3",
      type: "suggestion",
      message: "Support response times are excellent. Consider creating a self-service knowledge base to scale further.",
      section: "Support"
    },
    {
      id: "4",
      type: "warning",
      message: "Only 30% of SOPs are documented. This creates risk if team members transition.",
      section: "Internal Process & Culture"
    }
  ]);

  const [nextSteps] = useState<NextStep[]>([
    {
      id: "1",
      title: "Create Onboarding Milestone Checkpoints",
      description: "Add Day 3, Day 7, and Day 14 touchpoints to improve completion",
      impact: "high",
      effort: "medium",
      section: "Onboarding"
    },
    {
      id: "2",
      title: "Launch Formal Referral Program",
      description: "Design tiered rewards for advocates with tracking system",
      impact: "high",
      effort: "medium",
      section: "Referral Process"
    },
    {
      id: "3",
      title: "Document Core SOPs",
      description: "Prioritize client-facing processes: onboarding, support, fulfillment",
      impact: "high",
      effort: "high",
      section: "Internal Process & Culture"
    },
    {
      id: "4",
      title: "Optimize Sales Journey Touchpoints",
      description: "Add video testimonials and case studies to proposal stage",
      impact: "medium",
      effort: "low",
      section: "Sales Journey"
    }
  ]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "complete":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "in_progress":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case "needs_attention":
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-[#b8a898]" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "complete":
        return "bg-green-500";
      case "in_progress":
        return "bg-yellow-500";
      case "needs_attention":
        return "bg-orange-500";
      default:
        return "bg-[#b8a898]";
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high":
        return "text-green-600 bg-green-50";
      case "medium":
        return "text-yellow-600 bg-yellow-50";
      default:
        return "text-[#b8a898] bg-[#F8F5F0]";
    }
  };

  const overallHealth = Math.round(
    sections.reduce((acc, s) => acc + s.completionRate, 0) / sections.length
  );

  return (
    <div className="py-8 px-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-[#4a9b9b]/20 flex items-center justify-center">
            <Settings className="w-6 h-6 text-[#4a9b9b]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">
              Operations Center
            </h1>
            <p className="text-[#b8a898]">
              End-to-end operational excellence across the customer lifecycle
            </p>
          </div>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-[#b8a898]">Overall Health</p>
              <BarChart3 className="w-4 h-4 text-[#c9a227]" />
            </div>
            <p className="text-3xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">
              {overallHealth}%
            </p>
            <div className="w-full bg-[#1a2b4a]/10 rounded-full h-2 mt-2">
              <div
                className="bg-[#4a9b9b] h-2 rounded-full transition-all"
                style={{ width: `${overallHealth}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-[#b8a898]">Active Sections</p>
              <Zap className="w-4 h-4 text-[#c9a227]" />
            </div>
            <p className="text-3xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">
              {sections.filter(s => s.status !== "not_started").length}/{sections.length}
            </p>
            <p className="text-xs text-[#b8a898] mt-1">
              {sections.filter(s => s.status === "complete").length} complete
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-[#b8a898]">Need Attention</p>
              <AlertCircle className="w-4 h-4 text-orange-500" />
            </div>
            <p className="text-3xl font-bold text-orange-500">
              {sections.filter(s => s.status === "needs_attention").length}
            </p>
            <p className="text-xs text-[#b8a898] mt-1">
              Requires immediate focus
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-[#b8a898]">Client Satisfaction</p>
              <Heart className="w-4 h-4 text-[#c9a227]" />
            </div>
            <p className="text-3xl font-bold text-[#7b6b8d]">
              4.7/5
            </p>
            <p className="text-xs text-[#b8a898] mt-1">
              Across all touchpoints
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content - Operations Sections */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-semibold text-[#1a2b4a] dark:text-[#F8F5F0] flex items-center gap-2">
            <Target className="w-5 h-5 text-[#c9a227]" />
            Operational Pillars
          </h2>

          <div className="grid grid-cols-1 gap-4">
            {sections.map((section) => (
              <Link key={section.id} href={section.route}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-[#1a2b4a]/5 flex items-center justify-center text-[#1a2b4a] dark:text-[#F8F5F0] group-hover:bg-[#c9a227]/20 group-hover:text-[#c9a227] transition-colors">
                        {section.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">
                            {section.name}
                          </h3>
                          {getStatusIcon(section.status)}
                        </div>
                        <p className="text-sm text-[#b8a898] mb-3">
                          {section.description}
                        </p>

                        {/* Metrics */}
                        <div className="grid grid-cols-3 gap-4 mb-3">
                          {section.metrics.map((metric, idx) => (
                            <div key={idx}>
                              <p className="text-xs text-[#b8a898]">{metric.label}</p>
                              <div className="flex items-center gap-1">
                                <span className="text-sm font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">
                                  {metric.value}
                                </span>
                                {metric.trend && (
                                  <TrendingUp
                                    className={`w-3 h-3 ${
                                      metric.trend === "up"
                                        ? "text-green-500"
                                        : metric.trend === "down"
                                        ? "text-red-500 rotate-180"
                                        : "text-[#b8a898]"
                                    }`}
                                  />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Progress Bar */}
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-[#1a2b4a]/10 rounded-full h-2">
                            <div
                              className={`${getStatusColor(section.status)} h-2 rounded-full transition-all`}
                              style={{ width: `${section.completionRate}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">
                            {section.completionRate}%
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-[#b8a898] group-hover:text-[#c9a227] transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* AI Insights */}
          <Card className="bg-gradient-to-br from-[#1a2b4a] to-[#7b6b8d] text-[#F8F5F0]">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#c9a227]" />
                AI Operations Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {aiInsights.map((insight) => (
                <div
                  key={insight.id}
                  className={`p-3 rounded-lg ${
                    insight.type === "opportunity"
                      ? "bg-green-500/20"
                      : insight.type === "warning"
                      ? "bg-orange-500/20"
                      : "bg-[#c9a227]/20"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {insight.type === "opportunity" ? (
                      <TrendingUp className="w-4 h-4 text-green-400 mt-0.5" />
                    ) : insight.type === "warning" ? (
                      <AlertCircle className="w-4 h-4 text-orange-400 mt-0.5" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-[#c9a227] mt-0.5" />
                    )}
                    <div>
                      <p className="text-sm">{insight.message}</p>
                      <p className="text-xs text-[#e8e4f0] mt-1">
                        {insight.section}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Next Steps */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-[#c9a227]" />
                Priority Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {nextSteps.map((step, index) => (
                <div
                  key={step.id}
                  className="p-4 bg-[#1a2b4a]/5 rounded-lg"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#c9a227] text-[#1a2b4a] text-xs font-bold flex items-center justify-center">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <h4 className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0] text-sm">
                        {step.title}
                      </h4>
                      <p className="text-xs text-[#b8a898] mt-1">
                        {step.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-xs px-2 py-0.5 rounded ${getImpactColor(step.impact)}`}>
                          {step.impact} impact
                        </span>
                        <span className="text-xs text-[#b8a898]">
                          {step.effort} effort
                        </span>
                      </div>
                      <p className="text-xs text-[#7b6b8d] dark:text-[#e8e4f0] mt-1">
                        {step.section}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <UserPlus className="w-4 h-4 mr-2" />
                Review Onboarding Flow
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Share2 className="w-4 h-4 mr-2" />
                Check Referral Activity
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <HeadphonesIcon className="w-4 h-4 mr-2" />
                View Support Tickets
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Heart className="w-4 h-4 mr-2" />
                Update Team SOPs
              </Button>
            </CardContent>
          </Card>

          {/* Operations Lifecycle */}
          <Card className="bg-gradient-to-br from-[#4a9b9b]/20 to-[#7b6b8d]/20">
            <CardHeader>
              <CardTitle className="text-lg">Customer Lifecycle</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { stage: "Acquisition", icon: Users, status: "active" },
                  { stage: "Sales Journey", icon: ShoppingCart, status: "active" },
                  { stage: "Onboarding", icon: UserPlus, status: "warning" },
                  { stage: "Fulfillment", icon: Package, status: "active" },
                  { stage: "Support", icon: HeadphonesIcon, status: "active" },
                  { stage: "Referral", icon: Share2, status: "attention" }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      item.status === "active" ? "bg-green-500/20 text-green-600" :
                      item.status === "warning" ? "bg-orange-500/20 text-orange-600" :
                      "bg-yellow-500/20 text-yellow-600"
                    }`}>
                      <item.icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">
                      {item.stage}
                    </span>
                    {item.status === "active" && (
                      <CheckCircle className="w-4 h-4 text-green-500 ml-auto" />
                    )}
                    {item.status === "warning" && (
                      <AlertCircle className="w-4 h-4 text-orange-500 ml-auto" />
                    )}
                    {item.status === "attention" && (
                      <Clock className="w-4 h-4 text-yellow-500 ml-auto" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
