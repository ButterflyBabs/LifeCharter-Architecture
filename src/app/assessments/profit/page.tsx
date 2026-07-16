"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import { TrendingUp, ArrowLeft, ArrowRight, Save, CheckCircle, BarChart3 } from "lucide-react";
import Link from "next/link";

interface Question {
  id: string;
  text: string;
  type: "likert" | "radio" | "text";
  domain: string;
  options?: { value: string; label: string }[];
}

const domains = [
  { id: "marketing", name: "Marketing", description: "Brand clarity, audience reach, and lead generation" },
  { id: "sales", name: "Sales", description: "Conversion, pipeline, and revenue predictability" },
  { id: "operations", name: "Operations", description: "Efficiency, systems, and delivery excellence" },
  { id: "finance", name: "Finance", description: "Cash flow, profitability, and financial health" },
  { id: "team", name: "Team", description: "Talent, culture, and capacity" },
  { id: "systems", name: "Systems", description: "Automation, tools, and processes" },
  { id: "leadership", name: "Leadership", description: "Vision, decision-making, and team development" },
  { id: "vision", name: "Vision", description: "Strategic direction and long-term planning" },
  { id: "product", name: "Product", description: "Offer quality, innovation, and market fit" },
  { id: "client", name: "Client Experience", description: "Satisfaction, retention, and advocacy" },
  { id: "legal", name: "Legal", description: "Compliance, contracts, and risk management" },
  { id: "sustainability", name: "Sustainability", description: "Environmental and social responsibility" },
];

const questions: Question[] = [
  // Marketing (5 questions)
  { id: "m1", domain: "marketing", type: "likert", text: "How clear is your brand message to your target audience?" },
  { id: "m2", domain: "marketing", type: "likert", text: "How consistent is your marketing across all channels?" },
  { id: "m3", domain: "marketing", type: "likert", text: "How effective is your lead generation system?" },
  { id: "m4", domain: "marketing", type: "likert", text: "How well do you understand your customer journey?" },
  { id: "m5", domain: "marketing", type: "radio", text: "What is your primary marketing channel?", options: [
    { value: "social", label: "Social Media" },
    { value: "content", label: "Content Marketing" },
    { value: "ads", label: "Paid Advertising" },
    { value: "referral", label: "Referrals/Word of Mouth" },
    { value: "partnerships", label: "Partnerships" },
  ]},

  // Sales (5 questions)
  { id: "s1", domain: "sales", type: "likert", text: "How predictable is your sales process?" },
  { id: "s2", domain: "sales", type: "likert", text: "How well do you qualify prospects before engaging?" },
  { id: "s3", domain: "sales", type: "likert", text: "How effective are your sales conversations?" },
  { id: "s4", domain: "sales", type: "likert", text: "How clear is your pricing strategy?" },
  { id: "s5", domain: "sales", type: "radio", text: "What is your average sales cycle length?", options: [
    { value: "short", label: "Less than 1 week" },
    { value: "medium", label: "1-4 weeks" },
    { value: "long", label: "1-3 months" },
    { value: "enterprise", label: "3+ months" },
    { value: "variable", label: "Highly variable" },
  ]},

  // Operations (5 questions)
  { id: "o1", domain: "operations", type: "likert", text: "How well-documented are your core processes?" },
  { id: "o2", domain: "operations", type: "likert", text: "How efficiently do you deliver your products/services?" },
  { id: "o3", domain: "operations", type: "likert", text: "How well do you manage quality control?" },
  { id: "o4", domain: "operations", type: "likert", text: "How scalable is your delivery model?" },
  { id: "o5", domain: "operations", type: "radio", text: "What is your biggest operational challenge?", options: [
    { value: "capacity", label: "Capacity constraints" },
    { value: "quality", label: "Maintaining quality at scale" },
    { value: "delivery", label: "Delivery timelines" },
    { value: "communication", label: "Internal communication" },
    { value: "tools", label: "Tool limitations" },
  ]},

  // Finance (5 questions)
  { id: "f1", domain: "finance", type: "likert", text: "How well do you understand your cash flow?" },
  { id: "f2", domain: "finance", type: "likert", text: "How predictable is your monthly revenue?" },
  { id: "f3", domain: "finance", type: "likert", text: "How healthy are your profit margins?" },
  { id: "f4", domain: "finance", type: "likert", text: "How prepared are you for financial emergencies?" },
  { id: "f5", domain: "finance", type: "radio", text: "How often do you review your financial statements?", options: [
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" },
    { value: "quarterly", label: "Quarterly" },
    { value: "yearly", label: "Yearly" },
    { value: "rarely", label: "Rarely/Never" },
  ]},

  // Team (5 questions)
  { id: "t1", domain: "team", type: "likert", text: "How clear are roles and responsibilities on your team?" },
  { id: "t2", domain: "team", type: "likert", text: "How effective is your hiring process?" },
  { id: "t3", domain: "team", type: "likert", text: "How strong is your team culture?" },
  { id: "t4", domain: "team", type: "likert", text: "How well do you retain key talent?" },
  { id: "t5", domain: "team", type: "radio", text: "What is your current team structure?", options: [
    { value: "solo", label: "Solo founder" },
    { value: "contractors", label: "Contractors/Freelancers only" },
    { value: "small", label: "Small team (2-10)" },
    { value: "medium", label: "Medium team (11-50)" },
    { value: "large", label: "Large team (50+)" },
  ]},

  // Systems (5 questions)
  { id: "sy1", domain: "systems", type: "likert", text: "How well integrated are your business tools?" },
  { id: "sy2", domain: "systems", type: "likert", text: "How much of your workflow is automated?" },
  { id: "sy3", domain: "systems", type: "likert", text: "How reliable is your technology infrastructure?" },
  { id: "sy4", domain: "systems", type: "likert", text: "How secure is your data and customer information?" },
  { id: "sy5", domain: "systems", type: "radio", text: "What is your biggest systems challenge?", options: [
    { value: "integration", label: "Tool integration" },
    { value: "automation", label: "Lack of automation" },
    { value: "cost", label: "Software costs" },
    { value: "training", label: "Team training" },
    { value: "legacy", label: "Legacy systems" },
  ]},

  // Leadership (5 questions)
  { id: "l1", domain: "leadership", type: "likert", text: "How clear is your decision-making process?" },
  { id: "l2", domain: "leadership", type: "likert", text: "How well do you communicate vision to your team?" },
  { id: "l3", domain: "leadership", type: "likert", text: "How effectively do you handle conflict?" },
  { id: "l4", domain: "leadership", type: "likert", text: "How well do you develop future leaders?" },
  { id: "l5", domain: "leadership", type: "radio", text: "What is your primary leadership style?", options: [
    { value: "visionary", label: "Visionary" },
    { value: "servant", label: "Servant Leader" },
    { value: "democratic", label: "Democratic" },
    { value: "autocratic", label: "Autocratic" },
    { value: "adaptive", label: "Adaptive/Situational" },
  ]},

  // Vision (5 questions)
  { id: "v1", domain: "vision", type: "likert", text: "How clear is your 3-5 year vision?" },
  { id: "v2", domain: "vision", type: "likert", text: "How aligned is your team with the vision?" },
  { id: "v3", domain: "vision", type: "likert", text: "How well do you track progress toward long-term goals?" },
  { id: "v4", domain: "vision", type: "likert", text: "How adaptable is your strategy to market changes?" },
  { id: "v5", domain: "vision", type: "radio", text: "What is your biggest strategic challenge?", options: [
    { value: "focus", label: "Maintaining focus" },
    { value: "execution", label: "Strategy execution" },
    { value: "adaptation", label: "Adapting to change" },
    { value: "resources", label: "Resource allocation" },
    { value: "clarity", label: "Vision clarity" },
  ]},

  // Product (5 questions)
  { id: "p1", domain: "product", type: "likert", text: "How well does your product solve customer problems?" },
  { id: "p2", domain: "product", type: "likert", text: "How innovative is your offering compared to competitors?" },
  { id: "p3", domain: "product", type: "likert", text: "How easy is it for customers to use your product?" },
  { id: "p4", domain: "product", type: "likert", text: "How well do you gather and act on customer feedback?" },
  { id: "p5", domain: "product", type: "radio", text: "What is your product development approach?", options: [
    { value: "agile", label: "Agile/Iterative" },
    { value: "waterfall", label: "Waterfall/Planned" },
    { value: "lean", label: "Lean Startup" },
    { value: "customer", label: "Customer-driven" },
    { value: "reactive", label: "Reactive/Ad-hoc" },
  ]},

  // Client Experience (5 questions)
  { id: "c1", domain: "client", type: "likert", text: "How satisfied are your customers overall?" },
  { id: "c2", domain: "client", type: "likert", text: "How likely are customers to refer others?" },
  { id: "c3", domain: "client", type: "likert", text: "How effective is your customer support?" },
  { id: "c4", domain: "client", type: "likert", text: "How well do you retain customers over time?" },
  { id: "c5", domain: "client", type: "radio", text: "What is your primary customer feedback channel?", options: [
    { value: "surveys", label: "Surveys" },
    { value: "interviews", label: "Customer Interviews" },
    { value: "support", label: "Support Tickets" },
    { value: "reviews", label: "Reviews/Testimonials" },
    { value: "informal", label: "Informal Conversations" },
  ]},

  // Legal (5 questions)
  { id: "le1", domain: "legal", type: "likert", text: "How well protected is your intellectual property?" },
  { id: "le2", domain: "legal", type: "likert", text: "How comprehensive are your contracts and agreements?" },
  { id: "le3", domain: "legal", type: "likert", text: "How compliant are you with industry regulations?" },
  { id: "le4", domain: "legal", type: "likert", text: "How prepared are you for potential legal issues?" },
  { id: "le5", domain: "legal", type: "radio", text: "What legal support do you currently have?", options: [
    { value: "inhouse", label: "In-house counsel" },
    { value: "retainer", label: "Lawyer on retainer" },
    { value: "asneeded", label: "As-needed legal services" },
    { value: "templates", label: "Template contracts only" },
    { value: "none", label: "No formal legal support" },
  ]},

  // Sustainability (5 questions)
  { id: "su1", domain: "sustainability", type: "likert", text: "How environmentally conscious are your operations?" },
  { id: "su2", domain: "sustainability", type: "likert", text: "How well do you support your local community?" },
  { id: "su3", domain: "sustainability", type: "likert", text: "How ethical are your supply chain practices?" },
  { id: "su4", domain: "sustainability", type: "likert", text: "How diverse and inclusive is your organization?" },
  { id: "su5", domain: "sustainability", type: "radio", text: "What is your approach to sustainability?", options: [
    { value: "core", label: "Core to our mission" },
    { value: "important", label: "Important but not primary" },
    { value: "growing", label: "Growing awareness" },
    { value: "compliance", label: "Compliance-driven" },
    { value: "minimal", label: "Minimal focus currently" },
  ]},
];

const likertOptions = [
  { value: "1", label: "1 - Very Poor", score: 1 },
  { value: "2", label: "2 - Poor", score: 2 },
  { value: "3", label: "3 - Average", score: 3 },
  { value: "4", label: "4 - Good", score: 4 },
  { value: "5", label: "5 - Excellent", score: 5 },
];

export default function ProfitAssessmentPage() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [domainScores, setDomainScores] = useState<Record<string, number>>({});

  // Load saved progress
  useEffect(() => {
    const saved = localStorage.getItem("profit-assessment");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setAnswers(parsed.answers || {});
        setCurrentQuestion(parsed.currentQuestion || 0);
        setLastSaved(new Date(parsed.savedAt));
      } catch {
        // Invalid saved data, start fresh
      }
    }
  }, []);

  // Calculate domain scores
  useEffect(() => {
    const scores: Record<string, { total: number; count: number }> = {};
    
    Object.entries(answers).forEach(([questionId, answer]) => {
      const question = questions.find((q) => q.id === questionId);
      if (question && question.type === "likert") {
        if (!scores[question.domain]) {
          scores[question.domain] = { total: 0, count: 0 };
        }
        const score = parseInt(answer, 10);
        if (!isNaN(score)) {
          scores[question.domain].total += score;
          scores[question.domain].count += 1;
        }
      }
    });

    const calculatedScores: Record<string, number> = {};
    Object.entries(scores).forEach(([domain, data]) => {
      calculatedScores[domain] = data.count > 0 ? Math.round((data.total / data.count) * 20) : 0;
    });

    setDomainScores(calculatedScores);
  }, [answers]);

  // Autosave
  const saveProgress = useCallback(() => {
    setIsSaving(true);
    const data = {
      answers,
      currentQuestion,
      domainScores,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem("profit-assessment", JSON.stringify(data));
    setTimeout(() => {
      setLastSaved(new Date());
      setIsSaving(false);
    }, 500);
  }, [answers, currentQuestion, domainScores]);

  useEffect(() => {
    const timer = setTimeout(saveProgress, 1000);
    return () => clearTimeout(timer);
  }, [answers, currentQuestion, saveProgress]);

  const handleAnswer = (value: string) => {
    setAnswers((prev) => ({ ...prev, [questions[currentQuestion].id]: value }));
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setIsComplete(true);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleDomainJump = (domainIndex: number) => {
    const domainId = domains[domainIndex].id;
    const firstQuestionIndex = questions.findIndex((q) => q.domain === domainId);
    if (firstQuestionIndex !== -1) {
      setCurrentQuestion(firstQuestionIndex);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const currentQ = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const currentDomainIndex = domains.findIndex((d) => d.id === currentQ.domain);
  const currentDomain = domains[currentDomainIndex];

  if (isComplete) {
    return (
      <div className="min-h-screen bg-[#F6F1E8] dark:bg-[#1a1a2e] py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="border-[#D4AF63]/30">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-[#D4AF63]/10 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-[#D4AF63]" />
              </div>
              <h1 className="text-2xl font-bold text-[#1F315B] dark:text-[#F6F1E8] mb-4">
                Profit Assessment Complete!
              </h1>
              <p className="text-[#1F315B]/70 dark:text-[#F6F1E8]/70 mb-6">
                Congratulations! You've completed all 12 domains. Your comprehensive
                Profit Architecture profile is ready.
              </p>
              <div className="grid grid-cols-3 gap-2 mb-6">
                {domains.map((domain) => (
                  <div
                    key={domain.id}
                    className="p-2 rounded-lg bg-[#D4AF63]/10 text-center"
                  >
                    <p className="text-xs text-[#B9A9A9]">{domain.name}</p>
                    <p className="text-lg font-bold text-[#D4AF63]">
                      {domainScores[domain.id] || 0}%
                    </p>
                  </div>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/dashboard">
                  <Button variant="primary">View Full Dashboard</Button>
                </Link>
                <Link href="/assessments">
                  <Button variant="secondary">Back to Assessments</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F1E8] dark:bg-[#1a1a2e]">
      {/* Header */}
      <div className="bg-[#1F315B] text-white py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-[#D4AF63]/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-[#D4AF63]" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Profit Assessment</h1>
              <p className="text-sm text-[#CDBED6]">Financial Health & Operations</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>
                Domain {currentDomainIndex + 1} of {domains.length}: {currentDomain.name}
              </span>
              <span>
                Question {currentQuestion + 1} of {questions.length}
              </span>
            </div>
            <Progress value={progress} variant="gold" />
          </div>
        </div>
      </div>

      {/* Domain Navigation */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex flex-wrap gap-2">
          {domains.map((domain, index) => {
            const isActive = domain.id === currentQ.domain;
            const isCompleted = domainScores[domain.id] !== undefined;
            return (
              <button
                key={domain.id}
                onClick={() => handleDomainJump(index)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  isActive
                    ? "bg-[#D4AF63] text-white"
                    : isCompleted
                    ? "bg-[#D4AF63]/20 text-[#D4AF63]"
                    : "bg-[#1F315B]/10 text-[#1F315B] dark:text-[#CDBED6]"
                }`}
              >
                {domain.name}
                {isCompleted && (
                  <span className="ml-1">({domainScores[domain.id]}%)</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Question Card */}
      <div className="max-w-3xl mx-auto px-4 pb-8">
        <Card className="border-[#D4AF63]/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-[#D4AF63]">
                  {currentDomain.name}
                </span>
                <p className="text-xs text-[#B9A9A9] mt-1">
                  {currentDomain.description}
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-[#B9A9A9]">
                <Save className="w-4 h-4" />
                {isSaving ? "Saving..." : lastSaved ? "Saved" : "Not saved"}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <h2 className="text-xl font-semibold text-[#1F315B] dark:text-[#F6F1E8]">
              {currentQ.text}
            </h2>

            {currentQ.type === "likert" && (
              <div className="space-y-3">
                {likertOptions.map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      answers[currentQ.id] === option.value
                        ? "border-[#D4AF63] bg-[#D4AF63]/5"
                        : "border-[#D4AF63]/20 hover:border-[#D4AF63]/40"
                    }`}
                  >
                    <input
                      type="radio"
                      name={currentQ.id}
                      value={option.value}
                      checked={answers[currentQ.id] === option.value}
                      onChange={(e) => handleAnswer(e.target.value)}
                      className="w-4 h-4 text-[#D4AF63] focus:ring-[#D4AF63]"
                    />
                    <span className="text-[#1F315B] dark:text-[#F6F1E8]">
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            )}

            {currentQ.type === "radio" && currentQ.options && (
              <div className="space-y-3">
                {currentQ.options.map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      answers[currentQ.id] === option.value
                        ? "border-[#D4AF63] bg-[#D4AF63]/5"
                        : "border-[#D4AF63]/20 hover:border-[#D4AF63]/40"
                    }`}
                  >
                    <input
                      type="radio"
                      name={currentQ.id}
                      value={option.value}
                      checked={answers[currentQ.id] === option.value}
                      onChange={(e) => handleAnswer(e.target.value)}
                      className="mt-1 w-4 h-4 text-[#D4AF63] focus:ring-[#D4AF63]"
                    />
                    <span className="text-[#1F315B] dark:text-[#F6F1E8]">
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between pt-6 border-t border-[#D4AF63]/20">
              <Button
                variant="ghost"
                onClick={handlePrevious}
                disabled={currentQuestion === 0}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              <Button
                variant="primary"
                onClick={handleNext}
                disabled={!answers[currentQ.id]}
              >
                {currentQuestion === questions.length - 1 ? "Complete" : "Next"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Domain Progress Summary */}
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-[#D4AF63]" />
            <h3 className="font-semibold text-[#1F315B] dark:text-[#F6F1E8]">
              Domain Scores
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {domains.map((domain) => {
              const score = domainScores[domain.id];
              const hasScore = score !== undefined;
              return (
                <div
                  key={domain.id}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    domain.id === currentQ.domain
                      ? "border-[#D4AF63] bg-[#D4AF63]/5"
                      : "border-[#D4AF63]/20"
                  }`}
                >
                  <p className="text-xs text-[#B9A9A9]">{domain.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1">
                      <Progress
                        value={hasScore ? score : 0}
                        variant="gold"
                        className="h-2"
                      />
                    </div>
                    <span className="text-sm font-bold text-[#D4AF63]">
                      {hasScore ? `${score}%` : "—"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
