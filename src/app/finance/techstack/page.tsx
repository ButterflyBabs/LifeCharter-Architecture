"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  ArrowLeft,
  Zap,
  Plus,
  X,
  CheckCircle,
  AlertCircle,
  Sparkles,
  TrendingDown,
  Copy,
  Clock,
  Tag,
  ExternalLink,
  RefreshCw
} from "lucide-react";
import Link from "next/link";

interface TechTool {
  id: string;
  name: string;
  category: string;
  monthlyCost: number;
  annualCost: number;
  billingCycle: "monthly" | "annual";
  usageLevel: "high" | "medium" | "low" | "none";
  renewalDate: string;
  website: string;
  description: string;
}

interface AIInsight {
  id: string;
  type: "duplicate" | "underutilized" | "savings" | "warning";
  title: string;
  description: string;
  potentialSavings: number;
  tools?: string[];
  action: string;
}

interface DiscountOpportunity {
  id: string;
  toolName: string;
  currentPrice: number;
  discountPrice: number;
  discountSource: string;
  expiresAt?: string;
  url: string;
}

const categories = [
  "Communication",
  "Project Management",
  "Marketing",
  "Design",
  "Finance",
  "CRM",
  "Email",
  "Hosting",
  "Storage",
  "Analytics",
  "Other"
];

export default function TechStackPage() {
  const [tools, setTools] = useState<TechTool[]>([
    {
      id: "1",
      name: "Notion",
      category: "Project Management",
      monthlyCost: 15,
      annualCost: 144,
      billingCycle: "monthly",
      usageLevel: "high",
      renewalDate: "2026-08-15",
      website: "notion.so",
      description: "Team workspace and documentation"
    },
    {
      id: "2",
      name: "Asana",
      category: "Project Management",
      monthlyCost: 24,
      annualCost: 228,
      billingCycle: "monthly",
      usageLevel: "low",
      renewalDate: "2026-09-01",
      website: "asana.com",
      description: "Task management"
    },
    {
      id: "3",
      name: "Slack",
      category: "Communication",
      monthlyCost: 8,
      annualCost: 75,
      billingCycle: "annual",
      usageLevel: "high",
      renewalDate: "2027-01-10",
      website: "slack.com",
      description: "Team messaging"
    },
    {
      id: "4",
      name: "Zoom",
      category: "Communication",
      monthlyCost: 15,
      annualCost: 150,
      billingCycle: "monthly",
      usageLevel: "medium",
      renewalDate: "2026-08-20",
      website: "zoom.us",
      description: "Video conferencing"
    },
    {
      id: "5",
      name: "Canva Pro",
      category: "Design",
      monthlyCost: 13,
      annualCost: 120,
      billingCycle: "annual",
      usageLevel: "high",
      renewalDate: "2026-12-05",
      website: "canva.com",
      description: "Design tool"
    },
    {
      id: "6",
      name: "Adobe Creative Cloud",
      category: "Design",
      monthlyCost: 55,
      annualCost: 600,
      billingCycle: "monthly",
      usageLevel: "low",
      renewalDate: "2026-08-30",
      website: "adobe.com",
      description: "Professional design suite"
    },
    {
      id: "7",
      name: "Stripe",
      category: "Finance",
      monthlyCost: 0,
      annualCost: 0,
      billingCycle: "monthly",
      usageLevel: "high",
      renewalDate: "N/A",
      website: "stripe.com",
      description: "Payment processing (usage-based)"
    },
    {
      id: "8",
      name: "QuickBooks",
      category: "Finance",
      monthlyCost: 35,
      annualCost: 350,
      billingCycle: "monthly",
      usageLevel: "medium",
      renewalDate: "2026-09-15",
      website: "quickbooks.intuit.com",
      description: "Accounting software"
    }
  ]);

  const [aiInsights] = useState<AIInsight[]>([
    {
      id: "1",
      type: "duplicate",
      title: "Duplicate Project Management Tools",
      description: "You're paying for both Notion and Asana. They have overlapping features.",
      potentialSavings: 288,
      tools: ["Notion", "Asana"],
      action: "Consolidate to one platform"
    },
    {
      id: "2",
      type: "underutilized",
      title: "Adobe Creative Cloud Underutilized",
      description: "You only use 10% of Adobe features. Canva Pro covers your needs.",
      potentialSavings: 660,
      tools: ["Adobe Creative Cloud"],
      action: "Cancel or downgrade Adobe"
    },
    {
      id: "3",
      type: "savings",
      title: "Annual Billing Savings Available",
      description: "Switch monthly subscriptions to annual for 15-20% savings.",
      potentialSavings: 180,
      action: "Switch to annual billing"
    },
    {
      id: "4",
      type: "warning",
      title: "Multiple Communication Tools",
      description: "Slack and Zoom both handle communication. Consider consolidating.",
      potentialSavings: 180,
      tools: ["Slack", "Zoom"],
      action: "Evaluate communication stack"
    }
  ]);

  const [discounts] = useState<DiscountOpportunity[]>([
    {
      id: "1",
      toolName: "Notion",
      currentPrice: 15,
      discountPrice: 12,
      discountSource: "Annual plan + startup discount",
      url: "https://notion.so/pricing"
    },
    {
      id: "2",
      toolName: "Canva Pro",
      currentPrice: 13,
      discountPrice: 10,
      discountSource: "Annual billing discount",
      expiresAt: "2026-08-01",
      url: "https://canva.com/pricing"
    },
    {
      id: "3",
      toolName: "QuickBooks",
      currentPrice: 35,
      discountPrice: 25,
      discountSource: "First 6 months 50% off",
      expiresAt: "2026-07-25",
      url: "https://quickbooks.intuit.com"
    }
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);

  const [newTool, setNewTool] = useState({
    name: "",
    category: "",
    monthlyCost: "",
    annualCost: "",
    billingCycle: "monthly" as "monthly" | "annual",
    usageLevel: "medium" as "high" | "medium" | "low" | "none",
    renewalDate: "",
    website: "",
    description: ""
  });

  const handleAddTool = () => {
    if (!newTool.name || !newTool.category) return;

    const tool: TechTool = {
      id: Date.now().toString(),
      name: newTool.name,
      category: newTool.category,
      monthlyCost: parseFloat(newTool.monthlyCost) || 0,
      annualCost: parseFloat(newTool.annualCost) || 0,
      billingCycle: newTool.billingCycle,
      usageLevel: newTool.usageLevel,
      renewalDate: newTool.renewalDate,
      website: newTool.website,
      description: newTool.description
    };

    setTools(prev => [...prev, tool]);
    setNewTool({
      name: "",
      category: "",
      monthlyCost: "",
      annualCost: "",
      billingCycle: "monthly",
      usageLevel: "medium",
      renewalDate: "",
      website: "",
      description: ""
    });
    setShowAddForm(false);
  };

  const handleRemoveTool = (id: string) => {
    setTools(prev => prev.filter(t => t.id !== id));
  };

  const handleRunAIAssessment = () => {
    setIsScanning(true);
    setScanComplete(false);
    
    setTimeout(() => {
      setIsScanning(false);
      setScanComplete(true);
    }, 3000);
  };

  const totalMonthly = tools.reduce((sum, t) => sum + t.monthlyCost, 0);
  const totalAnnual = tools.reduce((sum, t) => sum + (t.billingCycle === "annual" ? t.annualCost : t.monthlyCost * 12), 0);
  const potentialSavings = aiInsights.reduce((sum, i) => sum + i.potentialSavings, 0);

  return (
    <div className="py-8 px-4 max-w-7xl mx-auto">
      {/* Header */}
      <Link href="/finance" className="flex items-center gap-2 text-[#7b6b8d] hover:text-[#1a2b4a] mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to Finance Center
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-[#c9a227]/20 flex items-center justify-center">
            <Zap className="w-6 h-6 text-[#c9a227]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">
              Tech Stack Optimizer
            </h1>
            <p className="text-[#b8a898]">
              Software inventory with AI-powered cost optimization
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-[#b8a898] mb-1">Monthly Cost</p>
            <p className="text-3xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">
              ${totalMonthly.toFixed(0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-[#b8a898] mb-1">Annual Cost</p>
            <p className="text-3xl font-bold text-[#4a9b9b]">
              ${totalAnnual.toFixed(0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-[#b8a898] mb-1">Tools</p>
            <p className="text-3xl font-bold text-[#c9a227]">
              {tools.length}
            </p>
          </CardContent>
        </Card>
        <Card className="border-green-500/30">
          <CardContent className="p-6">
            <p className="text-sm text-[#b8a898] mb-1">Potential Savings</p>
            <p className="text-3xl font-bold text-green-600">
              ${potentialSavings.toFixed(0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* AI Assessment Button */}
      <Card className="mb-8 border-[#c9a227]/30">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#c9a227]/20 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-[#c9a227]" />
              </div>
              <div>
                <h3 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">
                  AI Tech Stack Assessment
                </h3>
                <p className="text-sm text-[#b8a898]">
                  Scan for duplicates, underutilized tools, and savings opportunities
                </p>
              </div>
            </div>
            <Button 
              onClick={handleRunAIAssessment}
              disabled={isScanning}
              className={isScanning ? "opacity-70" : ""}
            >
              {isScanning ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Scanning...
                </>
              ) : scanComplete ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Scan Complete
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Run Assessment
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Tools List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Add Tool Button */}
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">
              Your Tech Stack
            </h2>
            <Button onClick={() => setShowAddForm(!showAddForm)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Tool
            </Button>
          </div>

          {/* Add Tool Form */}
          {showAddForm && (
            <Card className="border-[#c9a227]/30">
              <CardHeader>
                <CardTitle className="text-lg">Add New Tool</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-[#b8a898] mb-1 block">Tool Name</label>
                    <Input
                      placeholder="e.g., Slack, Notion..."
                      value={newTool.name}
                      onChange={(e) => setNewTool({...newTool, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-[#b8a898] mb-1 block">Category</label>
                    <select
                      className="w-full p-2 rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a] text-[#1a2b4a] dark:text-[#F8F5F0]"
                      value={newTool.category}
                      onChange={(e) => setNewTool({...newTool, category: e.target.value})}
                    >
                      <option value="">Select category...</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-[#b8a898] mb-1 block">Monthly Cost</label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={newTool.monthlyCost}
                      onChange={(e) => setNewTool({...newTool, monthlyCost: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-[#b8a898] mb-1 block">Annual Cost</label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={newTool.annualCost}
                      onChange={(e) => setNewTool({...newTool, annualCost: e.target.value})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-[#b8a898] mb-1 block">Billing Cycle</label>
                    <select
                      className="w-full p-2 rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a] text-[#1a2b4a] dark:text-[#F8F5F0]"
                      value={newTool.billingCycle}
                      onChange={(e) => setNewTool({...newTool, billingCycle: e.target.value as "monthly" | "annual"})}
                    >
                      <option value="monthly">Monthly</option>
                      <option value="annual">Annual</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-[#b8a898] mb-1 block">Usage Level</label>
                    <select
                      className="w-full p-2 rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a] text-[#1a2b4a] dark:text-[#F8F5F0]"
                      value={newTool.usageLevel}
                      onChange={(e) => setNewTool({...newTool, usageLevel: e.target.value as "high" | "medium" | "low" | "none"})}
                    >
                      <option value="high">High - Daily use</option>
                      <option value="medium">Medium - Weekly use</option>
                      <option value="low">Low - Monthly use</option>
                      <option value="none">None - Not using</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-[#b8a898] mb-1 block">Renewal Date</label>
                  <Input
                    type="date"
                    value={newTool.renewalDate}
                    onChange={(e) => setNewTool({...newTool, renewalDate: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-sm text-[#b8a898] mb-1 block">Website</label>
                  <Input
                    placeholder="e.g., slack.com"
                    value={newTool.website}
                    onChange={(e) => setNewTool({...newTool, website: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-sm text-[#b8a898] mb-1 block">Description</label>
                  <Input
                    placeholder="What do you use this tool for?"
                    value={newTool.description}
                    onChange={(e) => setNewTool({...newTool, description: e.target.value})}
                  />
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddTool}>
                    Add Tool
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tools List */}
          <Card>
            <CardContent className="p-0">
              {tools.map((tool, index) => (
                <div
                  key={tool.id}
                  className={`p-4 ${index !== tools.length - 1 ? 'border-b border-[#1a2b4a]/10' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        tool.usageLevel === 'high' ? 'bg-green-500/10' :
                        tool.usageLevel === 'medium' ? 'bg-yellow-500/10' :
                        tool.usageLevel === 'low' ? 'bg-orange-500/10' :
                        'bg-red-500/10'
                      }`}>
                        {tool.usageLevel === 'high' ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : tool.usageLevel === 'none' ? (
                          <AlertCircle className="w-5 h-5 text-red-500" />
                        ) : (
                          <Clock className="w-5 h-5 text-yellow-500" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">
                            {tool.name}
                          </p>
                          <span className="text-xs px-2 py-0.5 bg-[#1a2b4a]/10 rounded-full text-[#b8a898]">
                            {tool.category}
                          </span>
                        </div>
                        <p className="text-sm text-[#b8a898]">
                          ${tool.monthlyCost}/mo • Renews {tool.renewalDate}
                        </p>
                        {tool.description && (
                          <p className="text-xs text-[#7b6b8d] dark:text-[#e8e4f0] mt-1">
                            {tool.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            tool.usageLevel === 'high' ? 'bg-green-500/10 text-green-600' :
                            tool.usageLevel === 'medium' ? 'bg-yellow-500/10 text-yellow-600' :
                            tool.usageLevel === 'low' ? 'bg-orange-500/10 text-orange-600' :
                            'bg-red-500/10 text-red-600'
                          }`}>
                            {tool.usageLevel} usage
                          </span>
                          {tool.website && (
                            <a 
                              href={`https://${tool.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-[#c9a227] hover:underline flex items-center gap-1"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Visit
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveTool(tool.id)}
                      className="text-[#b8a898] hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - AI Insights & Discounts */}
        <div className="space-y-6">
          {/* AI Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#c9a227]" />
                AI Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {aiInsights.map((insight) => (
                <div
                  key={insight.id}
                  className={`p-4 rounded-lg border ${
                    insight.type === 'duplicate' ? 'border-red-500/30 bg-red-500/5' :
                    insight.type === 'underutilized' ? 'border-orange-500/30 bg-orange-500/5' :
                    insight.type === 'savings' ? 'border-green-500/30 bg-green-500/5' :
                    'border-yellow-500/30 bg-yellow-500/5'
                  }`}
                >
                  <div className="flex items-start gap-2 mb-2">
                    {insight.type === 'duplicate' ? (
                      <Copy className="w-4 h-4 text-red-500 mt-0.5" />
                    ) : insight.type === 'underutilized' ? (
                      <Clock className="w-4 h-4 text-orange-500 mt-0.5" />
                    ) : insight.type === 'savings' ? (
                      <TrendingDown className="w-4 h-4 text-green-500 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5" />
                    )}
                    <div>
                      <p className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0] text-sm">
                        {insight.title}
                      </p>
                      <p className="text-xs text-[#7b6b8d] dark:text-[#e8e4f0] mt-1">
                        {insight.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-sm font-medium text-green-600">
                      Save ${insight.potentialSavings}/year
                    </span>
                    <Button size="sm" variant="outline">
                      {insight.action}
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Discount Opportunities */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Tag className="w-5 h-5 text-[#c9a227]" />
                Found Discounts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {discounts.map((discount) => (
                <div
                  key={discount.id}
                  className="p-4 bg-[#c9a227]/5 rounded-lg border border-[#c9a227]/20"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">
                      {discount.toolName}
                    </p>
                    <span className="text-xs px-2 py-0.5 bg-green-500/10 text-green-600 rounded-full">
                      Save ${(discount.currentPrice - discount.discountPrice).toFixed(0)}/mo
                    </span>
                  </div>
                  <p className="text-xs text-[#7b6b8d] dark:text-[#e8e4f0] mb-2">
                    {discount.discountSource}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <span className="text-[#b8a898] line-through">${discount.currentPrice}</span>
                      <span className="text-green-600 font-medium ml-2">${discount.discountPrice}/mo</span>
                    </div>
                    <a
                      href={discount.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#c9a227] hover:underline flex items-center gap-1"
                    >
                      Claim
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  {discount.expiresAt && (
                    <p className="text-xs text-red-500 mt-2">
                      Expires {discount.expiresAt}
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Category Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">By Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {categories.map(cat => {
                  const catTools = tools.filter(t => t.category === cat);
                  const catCost = catTools.reduce((sum, t) => sum + t.monthlyCost, 0);
                  if (catCost === 0) return null;
                  return (
                    <div key={cat} className="flex items-center justify-between py-2">
                      <span className="text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">{cat}</span>
                      <div className="text-right">
                        <span className="text-sm font-medium text-[#b8a898]">
                          ${catCost.toFixed(0)}/mo
                        </span>
                        <span className="text-xs text-[#b8a898] ml-2">
                          ({catTools.length} tools)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
