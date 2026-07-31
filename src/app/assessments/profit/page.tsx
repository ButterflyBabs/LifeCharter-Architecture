/**
 * Profit Assessment Page
 * 
 * 12-domain assessment with Unified Client Memory integration.
 * Features:
 * - 60 questions across 12 business domains
 * - Real-time sync to unified_client_responses
 * - Score aggregation to client_master_plans
 * - Insight generation to client_insights
 * - Action item creation for low scores
 * - Pre-fill of previous answers
 * - Cross-assessment context (Brain/Soul data)
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import { 
  TrendingUp, 
  ArrowLeft, 
  ArrowRight, 
  Save, 
  CheckCircle, 
  BarChart3,
  Sparkles,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { 
  UnifiedMemoryProvider, 
  useUnifiedMemoryContext 
} from "@/components/assessment/UnifiedMemoryProvider";
import { UnifiedMemoryQuestion } from "@/components/assessment/UnifiedMemoryQuestion";
import { CrossAssessmentSidebar } from "@/components/assessment/CrossAssessmentSidebar";
import { syncScoresToUnifiedMemory, autoGenerateActionItems } from "@/lib/unified-memory";

interface Question {
  id: string;
  text: string;
  type: "likert" | "radio" | "text" | "textarea" | "number";
  domain: string;
  domainNumber: number;
  options?: { value: string; label: string; score?: number }[];
}

interface DomainInfo {
  id: string;
  name: string;
  description: string;
  number: number;
}

const domains: DomainInfo[] = [
  { id: "marketing", name: "Marketing", description: "Brand clarity, audience reach, and lead generation", number: 1 },
  { id: "sales", name: "Sales", description: "Conversion, pipeline, and revenue predictability", number: 2 },
  { id: "operations", name: "Operations", description: "Efficiency, systems, and delivery excellence", number: 3 },
  { id: "finance", name: "Finance", description: "Cash flow, profitability, and financial health", number: 4 },
  { id: "team", name: "Team", description: "Talent, culture, and capacity", number: 5 },
  { id: "systems", name: "Systems", description: "Automation, tools, and processes", number: 6 },
  { id: "leadership", name: "Leadership", description: "Vision, decision-making, and team development", number: 7 },
  { id: "vision", name: "Vision", description: "Strategic direction and long-term planning", number: 8 },
  { id: "product", name: "Product", description: "Offer quality, innovation, and market fit", number: 9 },
  { id: "client", name: "Client Experience", description: "Satisfaction, retention, and advocacy", number: 10 },
  { id: "legal", name: "Legal", description: "Compliance, contracts, and risk management", number: 11 },
  { id: "sustainability", name: "Sustainability", description: "Environmental and social responsibility", number: 12 },
];

const likertOptions = [
  { value: "1", label: "1 - Very Poor", score: 20 },
  { value: "2", label: "2 - Poor", score: 40 },
  { value: "3", label: "3 - Average", score: 60 },
  { value: "4", label: "4 - Good", score: 80 },
  { value: "5", label: "5 - Excellent", score: 100 },
];

const questions: Question[] = [
  // Marketing (5 questions)
  { id: "m1", domain: "marketing", domainNumber: 1, type: "likert", text: "How clear is your brand message to your target audience?" },
  { id: "m2", domain: "marketing", domainNumber: 1, type: "likert", text: "How consistent is your marketing across all channels?" },
  { id: "m3", domain: "marketing", domainNumber: 1, type: "likert", text: "How effective is your lead generation system?" },
  { id: "m4", domain: "marketing", domainNumber: 1, type: "likert", text: "How well do you understand your customer journey?" },
  { id: "m5", domain: "marketing", domainNumber: 1, type: "radio", text: "What is your primary marketing channel?", options: [
    { value: "social", label: "Social Media", score: 60 },
    { value: "content", label: "Content Marketing", score: 80 },
    { value: "ads", label: "Paid Advertising", score: 70 },
    { value: "referral", label: "Referrals/Word of Mouth", score: 90 },
    { value: "partnerships", label: "Partnerships", score: 85 },
  ]},

  // Sales (5 questions)
  { id: "s1", domain: "sales", domainNumber: 2, type: "likert", text: "How predictable is your sales process?" },
  { id: "s2", domain: "sales", domainNumber: 2, type: "likert", text: "How well do you qualify prospects before engaging?" },
  { id: "s3", domain: "sales", domainNumber: 2, type: "likert", text: "How effective are your sales conversations?" },
  { id: "s4", domain: "sales", domainNumber: 2, type: "likert", text: "How clear is your pricing strategy?" },
  { id: "s5", domain: "sales", domainNumber: 2, type: "radio", text: "What is your average sales cycle length?", options: [
    { value: "short", label: "Less than 1 week", score: 90 },
    { value: "medium", label: "1-4 weeks", score: 80 },
    { value: "long", label: "1-3 months", score: 60 },
    { value: "enterprise", label: "3+ months", score: 50 },
    { value: "variable", label: "Highly variable", score: 40 },
  ]},

  // Operations (5 questions)
  { id: "o1", domain: "operations", domainNumber: 3, type: "likert", text: "How well-documented are your core processes?" },
  { id: "o2", domain: "operations", domainNumber: 3, type: "likert", text: "How efficiently do you deliver your products/services?" },
  { id: "o3", domain: "operations", domainNumber: 3, type: "likert", text: "How well do you manage quality control?" },
  { id: "o4", domain: "operations", domainNumber: 3, type: "likert", text: "How scalable is your delivery model?" },
  { id: "o5", domain: "operations", domainNumber: 3, type: "radio", text: "What is your biggest operational challenge?", options: [
    { value: "capacity", label: "Capacity constraints", score: 50 },
    { value: "quality", label: "Maintaining quality at scale", score: 60 },
    { value: "delivery", label: "Delivery timelines", score: 55 },
    { value: "communication", label: "Internal communication", score: 65 },
    { value: "tools", label: "Tool limitations", score: 60 },
  ]},

  // Finance (5 questions)
  { id: "f1", domain: "finance", domainNumber: 4, type: "likert", text: "How well do you understand your cash flow?" },
  { id: "f2", domain: "finance", domainNumber: 4, type: "likert", text: "How predictable is your monthly revenue?" },
  { id: "f3", domain: "finance", domainNumber: 4, type: "likert", text: "How healthy are your profit margins?" },
  { id: "f4", domain: "finance", domainNumber: 4, type: "likert", text: "How prepared are you for financial emergencies?" },
  { id: "f5", domain: "finance", domainNumber: 4, type: "radio", text: "How often do you review your financial statements?", options: [
    { value: "weekly", label: "Weekly", score: 100 },
    { value: "monthly", label: "Monthly", score: 90 },
    { value: "quarterly", label: "Quarterly", score: 70 },
    { value: "yearly", label: "Yearly", score: 50 },
    { value: "rarely", label: "Rarely/Never", score: 30 },
  ]},

  // Team (5 questions)
  { id: "t1", domain: "team", domainNumber: 5, type: "likert", text: "How clear are roles and responsibilities on your team?" },
  { id: "t2", domain: "team", domainNumber: 5, type: "likert", text: "How effective is your hiring process?" },
  { id: "t3", domain: "team", domainNumber: 5, type: "likert", text: "How strong is your team culture?" },
  { id: "t4", domain: "team", domainNumber: 5, type: "likert", text: "How well do you retain key talent?" },
  { id: "t5", domain: "team", domainNumber: 5, type: "radio", text: "What is your current team structure?", options: [
    { value: "solo", label: "Solo founder", score: 40 },
    { value: "contractors", label: "Contractors/Freelancers only", score: 50 },
    { value: "small", label: "Small team (2-10)", score: 70 },
    { value: "medium", label: "Medium team (11-50)", score: 85 },
    { value: "large", label: "Large team (50+)", score: 90 },
  ]},

  // Systems (5 questions)
  { id: "sy1", domain: "systems", domainNumber: 6, type: "likert", text: "How well integrated are your business tools?" },
  { id: "sy2", domain: "systems", domainNumber: 6, type: "likert", text: "How much of your workflow is automated?" },
  { id: "sy3", domain: "systems", domainNumber: 6, type: "likert", text: "How reliable is your technology infrastructure?" },
  { id: "sy4", domain: "systems", domainNumber: 6, type: "likert", text: "How secure is your data and customer information?" },
  { id: "sy5", domain: "systems", domainNumber: 6, type: "radio", text: "What is your biggest systems challenge?", options: [
    { value: "integration", label: "Tool integration", score: 55 },
    { value: "automation", label: "Lack of automation", score: 50 },
    { value: "cost", label: "Software costs", score: 60 },
    { value: "training", label: "Team training", score: 65 },
    { value: "legacy", label: "Legacy systems", score: 45 },
  ]},

  // Leadership (5 questions)
  { id: "l1", domain: "leadership", domainNumber: 7, type: "likert", text: "How clear is your decision-making process?" },
  { id: "l2", domain: "leadership", domainNumber: 7, type: "likert", text: "How well do you communicate vision to your team?" },
  { id: "l3", domain: "leadership", domainNumber: 7, type: "likert", text: "How effectively do you handle conflict?" },
  { id: "l4", domain: "leadership", domainNumber: 7, type: "likert", text: "How well do you develop future leaders?" },
  { id: "l5", domain: "leadership", domainNumber: 7, type: "radio", text: "What is your primary leadership style?", options: [
    { value: "visionary", label: "Visionary", score: 85 },
    { value: "servant", label: "Servant Leader", score: 90 },
    { value: "democratic", label: "Democratic", score: 80 },
    { value: "autocratic", label: "Autocratic", score: 60 },
    { value: "adaptive", label: "Adaptive/Situational", score: 85 },
  ]},

  // Vision (5 questions)
  { id: "v1", domain: "vision", domainNumber: 8, type: "likert", text: "How clear is your 3-5 year vision?" },
  { id: "v2", domain: "vision", domainNumber: 8, type: "likert", text: "How aligned is your team with the vision?" },
  { id: "v3", domain: "vision", domainNumber: 8, type: "likert", text: "How well do you track progress toward long-term goals?" },
  { id: "v4", domain: "vision", domainNumber: 8, type: "likert", text: "How adaptable is your strategy to market changes?" },
  { id: "v5", domain: "vision", domainNumber: 8, type: "radio", text: "What is your biggest strategic challenge?", options: [
    { value: "focus", label: "Maintaining focus", score: 60 },
    { value: "execution", label: "Strategy execution", score: 55 },
    { value: "adaptation", label: "Adapting to change", score: 65 },
    { value: "resources", label: "Resource allocation", score: 60 },
    { value: "clarity", label: "Vision clarity", score: 50 },
  ]},

  // Product (5 questions)
  { id: "p1", domain: "product", domainNumber: 9, type: "likert", text: "How well does your product solve customer problems?" },
  { id: "p2", domain: "product", domainNumber: 9, type: "likert", text: "How innovative is your offering compared to competitors?" },
  { id: "p3", domain: "product", domainNumber: 9, type: "likert", text: "How easy is it for customers to use your product?" },
  { id: "p4", domain: "product", domainNumber: 9, type: "likert", text: "How well do you gather and act on customer feedback?" },
  { id: "p5", domain: "product", domainNumber: 9, type: "radio", text: "What is your product development approach?", options: [
    { value: "agile", label: "Agile/Iterative", score: 90 },
    { value: "waterfall", label: "Waterfall/Planned", score: 70 },
    { value: "lean", label: "Lean Startup", score: 85 },
    { value: "customer", label: "Customer-driven", score: 90 },
    { value: "reactive", label: "Reactive/Ad-hoc", score: 45 },
  ]},

  // Client Experience (5 questions)
  { id: "c1", domain: "client", domainNumber: 10, type: "likert", text: "How satisfied are your customers overall?" },
  { id: "c2", domain: "client", domainNumber: 10, type: "likert", text: "How likely are customers to refer others?" },
  { id: "c3", domain: "client", domainNumber: 10, type: "likert", text: "How effective is your customer support?" },
  { id: "c4", domain: "client", domainNumber: 10, type: "likert", text: "How well do you retain customers over time?" },
  { id: "c5", domain: "client", domainNumber: 10, type: "radio", text: "What is your primary customer feedback channel?", options: [
    { value: "surveys", label: "Surveys", score: 75 },
    { value: "interviews", label: "Customer Interviews", score: 90 },
    { value: "support", label: "Support Tickets", score: 70 },
    { value: "reviews", label: "Reviews/Testimonials", score: 80 },
    { value: "informal", label: "Informal Conversations", score: 60 },
  ]},

  // Legal (5 questions)
  { id: "le1", domain: "legal", domainNumber: 11, type: "likert", text: "How well protected is your intellectual property?" },
  { id: "le2", domain: "legal", domainNumber: 11, type: "likert", text: "How comprehensive are your contracts and agreements?" },
  { id: "le3", domain: "legal", domainNumber: 11, type: "likert", text: "How compliant are you with industry regulations?" },
  { id: "le4", domain: "legal", domainNumber: 11, type: "likert", text: "How prepared are you for potential legal issues?" },
  { id: "le5", domain: "legal", domainNumber: 11, type: "radio", text: "What legal support do you currently have?", options: [
    { value: "inhouse", label: "In-house counsel", score: 100 },
    { value: "retainer", label: "Lawyer on retainer", score: 90 },
    { value: "asneeded", label: "As-needed legal services", score: 70 },
    { value: "templates", label: "Template contracts only", score: 50 },
    { value: "none", label: "No formal legal support", score: 30 },
  ]},

  // Sustainability (5 questions)
  { id: "su1", domain: "sustainability", domainNumber: 12, type: "likert", text: "How environmentally conscious are your operations?" },
  { id: "su2", domain: "sustainability", domainNumber: 12, type: "likert", text: "How well do you support your local community?" },
  { id: "su3", domain: "sustainability", domainNumber: 12, type: "likert", text: "How ethical are your supply chain practices?" },
  { id: "su4", domain: "sustainability", domainNumber: 12, type: "likert", text: "How diverse and inclusive is your organization?" },
  { id: "su5", domain: "sustainability", domainNumber: 12, type: "radio", text: "What is your approach to sustainability?", options: [
    { value: "core", label: "Core to our mission", score: 100 },
    { value: "important", label: "Important but not primary", score: 80 },
    { value: "growing", label: "Growing awareness", score: 65 },
    { value: "compliance", label: "Compliance-driven", score: 55 },
    { value: "minimal", label: "Minimal focus currently", score: 40 },
  ]},
];

// Inner component that uses unified memory context
function ProfitAssessmentContent() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [domainScores, setDomainScores] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  const { masterPlan, isSyncing, crossContext } = useUnifiedMemoryContext();

  // Load saved progress from localStorage and previous responses
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

    // Pre-fill from previous responses if available
    if (crossContext?.profitResponses) {
      const previousAnswers: Record<string, string> = {};
      crossContext.profitResponses.forEach((response: { question_id: string; answer_value: unknown }) => {
        if (typeof response.answer_value === 'string') {
          previousAnswers[response.question_id] = response.answer_value;
        }
      });
      setAnswers((prev) => ({ ...prev, ...previousAnswers }));
    }
  }, [crossContext?.profitResponses]);

  // Calculate domain scores
  useEffect(() => {
    const scores: Record<string, { total: number; count: number }> = {};
    
    Object.entries(answers).forEach(([questionId, answer]) => {
      const question = questions.find((q) => q.id === questionId);
      if (question && question.type === "likert") {
        if (!scores[question.domain]) {
          scores[question.domain] = { total: 0, count: 0 };
        }
        const option = likertOptions.find(o => o.value === answer);
        const score = option?.score ?? (parseInt(answer, 10) * 20 || 0);
        scores[question.domain].total += score;
        scores[question.domain].count += 1;
      } else if (question && question.type === "radio" && question.options) {
        if (!scores[question.domain]) {
          scores[question.domain] = { total: 0, count: 0 };
        }
        const option = question.options.find(o => o.value === answer);
        scores[question.domain].total += option?.score ?? 50;
        scores[question.domain].count += 1;
      }
    });

    const calculatedScores: Record<string, number> = {};
    Object.entries(scores).forEach(([domain, data]) => {
      calculatedScores[domain] = data.count > 0 ? Math.round(data.total / data.count) : 0;
    });

    setDomainScores(calculatedScores);
  }, [answers]);

  // Autosave to localStorage
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

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      handleComplete();
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

  const handleComplete = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      if (!masterPlan) {
        throw new Error('No master plan available');
      }

      // Prepare domain scores for sync
      const domainScoreData = domains.map((domain) => ({
        domainNumber: domain.number,
        domainName: domain.name,
        score: domainScores[domain.id] || 0,
        maxScore: 100,
        sources: ['profit_architecture'],
      }));

      // Calculate overall profit score
      const profitScore = Math.round(
        domainScoreData.reduce((sum, ds) => sum + ds.score, 0) / domainScoreData.length
      );

      // Sync scores to unified memory
      const result = await syncScoresToUnifiedMemory(
        { 
          masterPlanId: masterPlan.id, 
          workspaceId: masterPlan.workspace_id 
        },
        domainScoreData,
        {
          profitScore,
          brainScore: masterPlan.brain_score || undefined,
          soulScore: masterPlan.soul_score || undefined,
          overallScore: masterPlan.overall_alignment_score || undefined,
        }
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to sync scores');
      }

      // Auto-generate action items for low-scoring domains
      await autoGenerateActionItems(
        { masterPlanId: masterPlan.id, workspaceId: masterPlan.workspace_id },
        60
      );

      // Clear local storage
      localStorage.removeItem("profit-assessment");

      setIsComplete(true);
    } catch (err) {
      console.error('Error completing assessment:', err);
      setSubmitError(err instanceof Error ? err.message : 'Failed to complete assessment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentQ = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const currentDomainIndex = domains.findIndex((d) => d.id === currentQ.domain);
  const currentDomain = domains[currentDomainIndex];

  if (isComplete) {
    return (
      <div className="py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="border-[#c9a227]/30">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-[#c9a227]/10 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-[#c9a227]" />
              </div>
              <h1 className="text-2xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0] mb-4">
                Profit Assessment Complete!
              </h1>
              <p className="text-[#1a2b4a]/70 dark:text-[#F8F5F0]/70 mb-6">
                Congratulations! You&apos;ve completed all 12 domains. Your comprehensive
                Profit Architecture profile has been saved to your unified client plan.
              </p>
              <div className="grid grid-cols-3 gap-2 mb-6">
                {domains.map((domain) => (
                  <div
                    key={domain.id}
                    className="p-2 rounded-lg bg-[#c9a227]/10 text-center"
                  >
                    <p className="text-xs text-[#b8a898]">{domain.name}</p>
                    <p className="text-lg font-bold text-[#c9a227]">
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Main Content */}
      <div className="lg:col-span-2">
        {/* Header */}
        <div className="bg-[#1a2b4a] text-white py-8 px-4 -mx-4 mb-8 lg:rounded-lg lg:mx-0">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-[#c9a227]/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-[#c9a227]" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Profit Assessment</h1>
                <p className="text-sm text-[#e8e4f0]">Financial Health & Operations</p>
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
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {domains.map((domain, index) => {
              const isActive = domain.id === currentQ.domain;
              const isCompleted = domainScores[domain.id] !== undefined && domainScores[domain.id] > 0;
              return (
                <button
                  key={domain.id}
                  onClick={() => handleDomainJump(index)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    isActive
                      ? "bg-[#c9a227] text-white"
                      : isCompleted
                      ? "bg-[#c9a227]/20 text-[#c9a227]"
                      : "bg-[#1a2b4a]/10 text-[#1a2b4a] dark:text-[#e8e4f0]"
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
        <Card className="border-[#c9a227]/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-[#c9a227]">
                  {currentDomain.name}
                </span>
                <p className="text-xs text-[#b8a898] mt-1">
                  {currentDomain.description}
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-[#b8a898]">
                <Save className="w-4 h-4" />
                {isSyncing ? "Syncing..." : isSaving ? "Saving..." : lastSaved ? "Saved" : "Not saved"}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {masterPlan && (
              <UnifiedMemoryQuestion
                masterPlanId={masterPlan.id}
                workspaceId={masterPlan.workspace_id}
                questionId={currentQ.id}
                questionText={currentQ.text}
                sectionName={currentDomain.name}
                sectionType={currentDomain.id}
                questionType={currentQ.type === "likert" ? "scale" : (currentQ.type === "radio" ? "select" : currentQ.type)}
                options={currentQ.type === "likert" ? likertOptions : currentQ.options}
                maxScore={100}
                showCrossContext={true}
                onSyncComplete={(success) => {
                  if (success) {
                    console.log(`Synced question ${currentQ.id}`);
                  }
                }}
              />
            )}

            {/* Error Message */}
            {submitError && (
              <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Error completing assessment</p>
                  <p>{submitError}</p>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-[#c9a227]/20">
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
                disabled={!answers[currentQ.id] || isSubmitting}
              >
                {isSubmitting 
                  ? "Completing..." 
                  : currentQuestion === questions.length - 1 
                    ? "Complete Assessment" 
                    : "Next"
                }
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Domain Progress Summary */}
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-[#c9a227]" />
            <h3 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">
              Domain Scores
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {domains.map((domain) => {
              const score = domainScores[domain.id];
              const hasScore = score !== undefined && score > 0;
              return (
                <div
                  key={domain.id}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    domain.id === currentQ.domain
                      ? "border-[#c9a227] bg-[#c9a227]/5"
                      : "border-[#c9a227]/20"
                  }`}
                >
                  <p className="text-xs text-[#b8a898]">{domain.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1">
                      <Progress
                        value={hasScore ? score : 0}
                        variant="gold"
                        className="h-2"
                      />
                    </div>
                    <span className="text-sm font-bold text-[#c9a227]">
                      {hasScore ? `${score}%` : "—"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sidebar - Cross Assessment Context */}
      <div className="lg:col-span-1">
        <div className="sticky top-8">
          <CrossAssessmentSidebar currentSection={currentDomain.id} />
        </div>
      </div>
    </div>
  );
}

// Main page component with provider
export default function ProfitAssessmentPage() {
  const [masterPlanId, setMasterPlanId] = useState<string | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function initializeAssessment() {
      try {
        const supabase = createClient();
        
        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          throw new Error('Please sign in to take the assessment');
        }

        // Try to find existing master plan
        const { data: existingPlan } = await supabase
          .from('client_master_plans')
          .select('id, workspace_id')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single();

        if (existingPlan) {
          setMasterPlanId(existingPlan.id);
          setWorkspaceId(existingPlan.workspace_id);
        } else {
          // Create new master plan
          // First, get or create a workspace
          const { data: workspace } = await supabase
            .from('workspaces')
            .select('id')
            .eq('owner_id', user.id)
            .single();

          let workspaceId: string;
          
          if (workspace) {
            workspaceId = workspace.id;
          } else {
            // Create default workspace
            const { data: newWorkspace, error: wsError } = await supabase
              .from('workspaces')
              .insert({
                name: 'My Workspace',
                owner_id: user.id,
              })
              .select('id')
              .single();
            
            if (wsError || !newWorkspace) {
              throw new Error('Failed to create workspace');
            }
            workspaceId = newWorkspace.id;
          }

          // Create master plan
          const { data: newPlan, error: planError } = await supabase
            .from('client_master_plans')
            .insert({
              workspace_id: workspaceId,
              user_id: user.id,
              client_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Anonymous',
              client_email: user.email,
              status: 'active',
            })
            .select('id, workspace_id')
            .single();

          if (planError || !newPlan) {
            throw new Error('Failed to create master plan');
          }

          setMasterPlanId(newPlan.id);
          setWorkspaceId(newPlan.workspace_id);
        }
      } catch (err) {
        console.error('Error initializing assessment:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize assessment');
      } finally {
        setIsLoading(false);
      }
    }

    initializeAssessment();
  }, []);

  if (isLoading) {
    return (
      <div className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-[#c9a227] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-[#b8a898]">Loading assessment...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="border-red-200">
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h1 className="text-xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0] mb-2">
                Unable to Load Assessment
              </h1>
              <p className="text-[#b8a898] mb-6">{error}</p>
              <Link href="/assessments">
                <Button variant="primary">Back to Assessments</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!masterPlanId || !workspaceId) {
    return (
      <div className="py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <Sparkles className="w-12 h-12 text-[#c9a227] mx-auto mb-4" />
              <h1 className="text-xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0] mb-2">
                Welcome to Profit Assessment
              </h1>
              <p className="text-[#b8a898] mb-6">
                Please sign in to start your assessment and track your progress across all dimensions.
              </p>
              <Link href="/login">
                <Button variant="primary">Sign In</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <UnifiedMemoryProvider
      masterPlanId={masterPlanId}
      workspaceId={workspaceId}
      enableRealtime={true}
    >
      <div className="py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <ProfitAssessmentContent />
        </div>
      </div>
    </UnifiedMemoryProvider>
  );
}