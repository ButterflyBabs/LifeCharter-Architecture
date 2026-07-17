/**
 * Section Content with Hybrid Editor
 * Option D: AI base + targeted questions + manual edits
 */

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { 
  CheckCircle, 
  Circle, 
  Sparkles,
  Save,
  ChevronRight,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus
} from "lucide-react";

interface Question {
  id: string;
  question: string;
  type: "text" | "number" | "textarea" | "currency" | "percent";
  placeholder?: string;
  required: boolean;
  aiSuggested?: string;
}

interface Metric {
  label: string;
  current: string;
  target: string;
  unit: string;
  trend: "up" | "down" | "stable";
}

const sectionConfigs: Record<string, { questions: Question[]; metrics: Metric[] }> = {
  "products": {
    questions: [
      { id: "p1", question: "What is your flagship product/service name?", type: "text", required: true },
      { id: "p2", question: "Current price point", type: "currency", required: true },
      { id: "p3", question: "How many clients have purchased this?", type: "number", required: true },
      { id: "p4", question: "What transformation does this provide?", type: "textarea", required: true },
      { id: "p5", question: "Delivery format (1:1, group, digital, hybrid)", type: "text", required: true },
      { id: "p6", question: "Time to deliver results", type: "text", required: false },
      { id: "p7", question: "What makes this different from competitors?", type: "textarea", required: true },
    ],
    metrics: [
      { label: "Products Live", current: "4", target: "6", unit: "count", trend: "stable" },
      { label: "Avg. Price Point", current: "$297", target: "$397", unit: "$", trend: "up" },
      { label: "Product-Market Fit", current: "Strong", target: "Very Strong", unit: "rating", trend: "up" },
    ]
  },
  "pricing": {
    questions: [
      { id: "pr1", question: "Current hourly rate (if applicable)", type: "currency", required: false },
      { id: "pr2", question: "Package price range (low to high)", type: "text", required: true },
      { id: "pr3", question: "How confident are you in your pricing? (1-10)", type: "number", required: true },
      { id: "pr4", question: "What would you charge if you were 2x more confident?", type: "currency", required: true },
      { id: "pr5", question: "Payment plans currently offered?", type: "text", required: false },
    ],
    metrics: [
      { label: "Pricing Confidence", current: "3/10", target: "8/10", unit: "score", trend: "up" },
      { label: "Avg. Client LTV", current: "$1,200", target: "$1,800", unit: "$", trend: "up" },
      { label: "Price Increase Potential", current: "+25%", target: "+40%", unit: "%", trend: "stable" },
    ]
  },
  "revenue": {
    questions: [
      { id: "r1", question: "Last month's revenue", type: "currency", required: true },
      { id: "r2", question: "Revenue 12 months ago", type: "currency", required: true },
      { id: "r3", question: "Primary revenue source (% of total)", type: "text", required: true },
      { id: "r4", question: "Monthly revenue goal for next quarter", type: "currency", required: true },
      { id: "r5", question: "Annual revenue target", type: "currency", required: true },
    ],
    metrics: [
      { label: "Monthly Revenue", current: "$8,500", target: "$12,000", unit: "$", trend: "up" },
      { label: "Revenue Growth", current: "15%", target: "25%", unit: "%", trend: "up" },
      { label: "Revenue per Client", current: "$1,200", target: "$1,500", unit: "$", trend: "stable" },
    ]
  },
  "market": {
    questions: [
      { id: "m1", question: "Describe your ideal client in one sentence", type: "text", required: true },
      { id: "m2", question: "Age range of typical client", type: "text", required: false },
      { id: "m3", question: "Top 3 problems your clients face", type: "textarea", required: true },
      { id: "m4", question: "Where do they hang out online?", type: "textarea", required: true },
      { id: "m5", question: "What have they tried before working with you?", type: "textarea", required: true },
    ],
    metrics: [
      { label: "Ideal Client Clarity", current: "75%", target: "90%", unit: "%", trend: "up" },
      { label: "Market Position", current: "Differentiated", target: "Category Leader", unit: "rating", trend: "stable" },
      { label: "Competitive Advantage", current: "Strong", target: "Very Strong", unit: "rating", trend: "up" },
    ]
  },
  "marketing": {
    questions: [
      { id: "mk1", question: "Primary marketing channel", type: "text", required: true },
      { id: "mk2", question: "Email list size", type: "number", required: true },
      { id: "mk3", question: "Social media followers (total across platforms)", type: "number", required: false },
      { id: "mk4", question: "Content pieces published per week", type: "number", required: true },
      { id: "mk5", question: "Current lead generation strategy", type: "textarea", required: true },
    ],
    metrics: [
      { label: "Email List Size", current: "450", target: "1,000", unit: "subscribers", trend: "up" },
      { label: "Content Consistency", current: "3/week", target: "5/week", unit: "posts", trend: "up" },
      { label: "Lead Conversion", current: "2%", target: "5%", unit: "%", trend: "stable" },
    ]
  },
  "operations": {
    questions: [
      { id: "o1", question: "Hours worked per week", type: "number", required: true },
      { id: "o2", question: "Team members (including contractors)", type: "number", required: true },
      { id: "o3", question: "Biggest operational bottleneck", type: "textarea", required: true },
      { id: "o4", question: "Systems/tools currently used", type: "textarea", required: false },
    ],
    metrics: [
      { label: "Hours per Week", current: "45", target: "35", unit: "hours", trend: "down" },
      { label: "Systemization Level", current: "60%", target: "85%", unit: "%", trend: "up" },
      { label: "Delegation Ratio", current: "30%", target: "60%", unit: "%", trend: "up" },
    ]
  },
  "financials": {
    questions: [
      { id: "f1", question: "Monthly fixed expenses", type: "currency", required: true },
      { id: "f2", question: "Monthly variable expenses", type: "currency", required: true },
      { id: "f3", question: "Current profit margin (%)", type: "percent", required: true },
      { id: "f4", question: "Cash runway (months)", type: "number", required: false },
      { id: "f5", question: "Break-even revenue per month", type: "currency", required: true },
    ],
    metrics: [
      { label: "Profit Margin", current: "35%", target: "45%", unit: "%", trend: "up" },
      { label: "Monthly Expenses", current: "$5,500", target: "$6,000", unit: "$", trend: "stable" },
      { label: "Cash Runway", current: "6 months", target: "12 months", unit: "months", trend: "up" },
    ]
  },
  "team": {
    questions: [
      { id: "t1", question: "Current team size", type: "number", required: true },
      { id: "t2", question: "Roles currently filled", type: "textarea", required: true },
      { id: "t3", question: "Next hire needed", type: "text", required: false },
      { id: "t4", question: "Delegation comfort level (1-10)", type: "number", required: true },
    ],
    metrics: [
      { label: "Team Size", current: "3", target: "5", unit: "people", trend: "up" },
      { label: "Delegation Comfort", current: "5/10", target: "8/10", unit: "score", trend: "up" },
      { label: "Time on $10k Tasks", current: "40%", target: "70%", unit: "%", trend: "up" },
    ]
  },
  "milestones": {
    questions: [
      { id: "mi1", question: "Revenue goal for next 90 days", type: "currency", required: true },
      { id: "mi2", question: "Number of new clients goal", type: "number", required: true },
      { id: "mi3", question: "One major project to complete this quarter", type: "text", required: true },
      { id: "mi4", question: "Personal/work-life goal", type: "text", required: false },
    ],
    metrics: [
      { label: "Q3 Goal Progress", current: "45%", target: "100%", unit: "%", trend: "up" },
      { label: "Milestones Hit", current: "3/8", target: "8/8", unit: "count", trend: "up" },
      { label: "Goal Clarity", current: "80%", target: "95%", unit: "%", trend: "stable" },
    ]
  },
};

interface SectionContentProps {
  sectionId: string;
}

export function SectionContent({ sectionId }: SectionContentProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<"questions" | "plan" | "metrics">("questions");
  const [isGenerating, setIsGenerating] = useState(false);

  const config = sectionConfigs[sectionId] || { questions: [], metrics: [] };
  const completedCount = config.questions.filter(q => answers[q.id]).length;
  const progress = config.questions.length > 0 ? (completedCount / config.questions.length) * 100 : 0;

  const handleAnswer = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleGeneratePlan = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setActiveTab("plan");
    }, 1500);
  };

  const renderInput = (question: Question) => {
    const value = answers[question.id] || "";
    
    switch (question.type) {
      case "textarea":
        return (
          <Textarea
            value={value}
            onChange={(e) => handleAnswer(question.id, e.target.value)}
            placeholder={question.placeholder || "Enter your answer..."}
            className="min-h-[100px] bg-white dark:bg-[#1F315B]/20"
          />
        );
      case "number":
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleAnswer(question.id, e.target.value)}
            placeholder={question.placeholder || "0"}
            className="bg-white dark:bg-[#1F315B]/20"
          />
        );
      case "currency":
        return (
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B9A9A9]">$</span>
            <Input
              type="number"
              value={value}
              onChange={(e) => handleAnswer(question.id, e.target.value)}
              placeholder="0"
              className="pl-8 bg-white dark:bg-[#1F315B]/20"
            />
          </div>
        );
      case "percent":
        return (
          <div className="relative">
            <Input
              type="number"
              value={value}
              onChange={(e) => handleAnswer(question.id, e.target.value)}
              placeholder="0"
              className="pr-8 bg-white dark:bg-[#1F315B]/20"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B9A9A9]">%</span>
          </div>
        );
      default:
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => handleAnswer(question.id, e.target.value)}
            placeholder={question.placeholder || "Enter your answer..."}
            className="bg-white dark:bg-[#1F315B]/20"
          />
        );
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up": return <TrendingUp className="w-4 h-4 text-green-500" />;
      case "down": return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <Minus className="w-4 h-4 text-[#B9A9A9]" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <Card className="border-[#D4AF63]/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-[#B9A9A9] mb-1">
                {completedCount} of {config.questions.length} questions answered
              </p>
              <div className="w-48 bg-[#1F315B]/10 rounded-full h-2">
                <div 
                  className="bg-[#D4AF63] h-2 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            {progress === 100 && (
              <Button onClick={handleGeneratePlan} disabled={isGenerating}>
                <Sparkles className="w-4 h-4 mr-2" />
                {isGenerating ? "Generating..." : "Generate Plan Section"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[#1F315B]/10">
        {[
          { id: "questions", label: "Questions", count: completedCount },
          { id: "plan", label: "Business Plan", count: null },
          { id: "metrics", label: "Metrics", count: config.metrics.length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 text-sm font-medium relative ${
              activeTab === tab.id 
                ? "text-[#D4AF63]" 
                : "text-[#B9A9A9] hover:text-[#1F315B] dark:hover:text-[#F6F1E8]"
            }`}
          >
            {tab.label}
            {tab.count !== null && tab.count > 0 && (
              <span className="ml-2 text-xs bg-[#1F315B]/10 px-2 py-0.5 rounded-full">
                {tab.count}
              </span>
            )}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D4AF63]" />
            )}
          </button>
        ))}
      </div>

      {/* Questions Tab */}
      {activeTab === "questions" && (
        <div className="space-y-4">
          {config.questions.map((question, index) => (
            <Card 
              key={question.id} 
              className={answers[question.id] ? "border-green-500/30" : "border-[#1F315B]/10"}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    {answers[question.id] ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <Circle className="w-5 h-5 text-[#B9A9A9]" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs text-[#B9A9A9]">Q{index + 1}</span>
                      {question.required && (
                        <span className="text-xs text-red-500">*Required</span>
                      )}
                    </div>
                    <label className="block text-[#1F315B] dark:text-[#F6F1E8] font-medium mb-3">
                      {question.question}
                    </label>
                    {renderInput(question)}
                    
                    {question.aiSuggested && !answers[question.id] && (
                      <div className="mt-3 p-3 bg-[#D4AF63]/10 rounded-lg border border-[#D4AF63]/20">
                        <div className="flex items-center gap-2 text-sm text-[#D4AF63] mb-1">
                          <Sparkles className="w-4 h-4" />
                          <span>AI Suggestion from your assessments</span>
                        </div>
                        <p className="text-sm text-[#1F315B] dark:text-[#F6F1E8]">
                          {question.aiSuggested}
                        </p>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="mt-2 text-[#D4AF63]"
                          onClick={() => handleAnswer(question.id, question.aiSuggested!)}
                        >
                          Use This Answer
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Plan Tab */}
      {activeTab === "plan" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h3 className="font-semibold text-[#1F315B] dark:text-[#F6F1E8]">
              AI-Generated Business Plan Content
            </h3>
            <Button variant="outline" size="sm">
              <Sparkles className="w-4 h-4 mr-2" />
              Regenerate
            </Button>
          </CardHeader>
          <CardContent className="p-6">
            {progress < 100 ? (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-[#B9A9A9] mx-auto mb-4" />
                <p className="text-[#B9A9A9]">
                  Answer all questions to generate your personalized business plan section
                </p>
                <Button 
                  className="mt-4" 
                  onClick={() => setActiveTab("questions")}
                >
                  Complete Questions
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            ) : (
              <div className="prose dark:prose-invert max-w-none">
                <div className="p-4 bg-[#D4AF63]/10 rounded-lg border border-[#D4AF63]/20 mb-6">
                  <p className="text-sm text-[#1F315B] dark:text-[#F6F1E8] m-0">
                    <strong>Generated based on your answers</strong> • 
                    This content is informed by your Brain, Soul, and Profit assessments, 
                    plus the specific details you provided above.
                  </p>
                </div>
                <p className="text-[#B9A9A9] italic">
                  Your personalized business plan content will appear here once generated...
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Metrics Tab */}
      {activeTab === "metrics" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {config.metrics.map((metric, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <p className="text-sm text-[#B9A9A9] mb-2">{metric.label}</p>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-2xl font-bold text-[#1F315B] dark:text-[#F6F1E8]">
                      {metric.current}
                    </p>
                    <p className="text-xs text-[#B9A9A9]">
                      Target: {metric.target}
                    </p>
                  </div>
                  {getTrendIcon(metric.trend)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
