/**
 * Monthly Review
 * Comprehensive monthly check-in for business health
 * Captures data from Finance, Sales, Operations for Business Plan
 */

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Progress } from "@/components/ui/Progress";
import { 
  CheckCircle, 
  Circle,
  DollarSign,
  Users,
  Clock,
  Target,
  TrendingUp,
  ArrowLeft,
  Sparkles
} from "lucide-react";
import Link from "next/link";

interface ReviewSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  questions: {
    id: string;
    question: string;
    type: "currency" | "number" | "text" | "textarea" | "percent";
    placeholder?: string;
  }[];
}

const reviewSections: ReviewSection[] = [
  {
    id: "finance",
    title: "Financial Performance",
    icon: <DollarSign className="w-5 h-5" />,
    questions: [
      { id: "revenue", question: "Total Revenue (Money received this month)", type: "currency" },
      { id: "expenses", question: "Total Expenses (All costs this month)", type: "currency" },
      { id: "revenue_goal", question: "Revenue Goal for this month", type: "currency" },
      { id: "cash_in_bank", question: "Cash in Bank (Current balance)", type: "currency" },
    ]
  },
  {
    id: "sales",
    title: "Sales & Clients",
    icon: <Users className="w-5 h-5" />,
    questions: [
      { id: "new_clients", question: "New Clients Acquired", type: "number" },
      { id: "total_clients", question: "Total Active Clients", type: "number" },
      { id: "leads", question: "New Leads/Inquiries", type: "number" },
      { id: "conversion_rate", question: "Lead to Client Conversion Rate (%)", type: "percent" },
    ]
  },
  {
    id: "operations",
    title: "Operations & Time",
    icon: <Clock className="w-5 h-5" />,
    questions: [
      { id: "hours_worked", question: "Hours Worked This Month", type: "number" },
      { id: "target_hours", question: "Target Hours (what you want to work)", type: "number" },
      { id: "sops_created", question: "New SOPs Documented", type: "number" },
      { id: "delegated_tasks", question: "Tasks Delegated to Team/AI", type: "number" },
    ]
  },
  {
    id: "goals",
    title: "Goals & Reflection",
    icon: <Target className="w-5 h-5" />,
    questions: [
      { id: "goal_progress", question: "Main Goal Progress (%)", type: "percent" },
      { id: "wins", question: "Biggest Win This Month", type: "textarea" },
      { id: "challenges", question: "Biggest Challenge", type: "textarea" },
      { id: "next_month", question: "Top Priority for Next Month", type: "textarea" },
    ]
  },
];

export default function MonthlyReviewPage() {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentSection, setCurrentSection] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const handleAnswer = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const calculateProgress = () => {
    const totalQuestions = reviewSections.reduce((sum, s) => sum + s.questions.length, 0);
    const answered = Object.keys(answers).length;
    return (answered / totalQuestions) * 100;
  };

  const handleNext = () => {
    if (currentSection < reviewSections.length - 1) {
      setCurrentSection(currentSection + 1);
    }
  };

  const handlePrevious = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Persist the metrics so Finance / Systems / Sales score from real data.
      // (Read live by the scoring engine — no AI recompute needed.)
      await fetch("/api/operational", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metrics: answers }),
      });
    } catch (err) {
      console.error("monthly review save failed:", err);
    }
    setIsSubmitting(false);
    setIsComplete(true);
  };

  const renderInput = (question: ReviewSection["questions"][0]) => {
    const value = answers[question.id] || "";
    
    switch (question.type) {
      case "textarea":
        return (
          <Textarea
            value={value}
            onChange={(e) => handleAnswer(question.id, e.target.value)}
            placeholder={question.placeholder || "Enter your answer..."}
            className="min-h-[100px]"
          />
        );
      case "number":
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleAnswer(question.id, e.target.value)}
            placeholder={question.placeholder || "0"}
          />
        );
      case "currency":
        return (
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#b8a898]">$</span>
            <Input
              type="number"
              value={value}
              onChange={(e) => handleAnswer(question.id, e.target.value)}
              placeholder="0"
              className="pl-8"
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
              className="pr-8"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#b8a898]">%</span>
          </div>
        );
      default:
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => handleAnswer(question.id, e.target.value)}
            placeholder={question.placeholder || "Enter your answer..."}
          />
        );
    }
  };

  const section = reviewSections[currentSection];
  const progress = calculateProgress();

  if (isComplete) {
    return (
      <div className="py-8 px-4 max-w-3xl mx-auto">
        <Card className="text-center py-12">
          <CardContent>
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0] mb-2">
              Monthly Review Complete!
            </h2>
            <p className="text-[#b8a898] mb-6">
              Your Business Plan health scores have been updated based on this month&apos;s data.
            </p>
            <div className="flex justify-center gap-3">
              <Link href="/finance">
                <Button variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Finance
                </Button>
              </Link>
              <Link href="/business-plan">
                <Button>
                  <TrendingUp className="w-4 h-4 mr-2" />
                  View Updated Business Plan
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="py-8 px-4 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link 
          href="/finance"
          className="inline-flex items-center text-sm text-[#b8a898] hover:text-[#1a2b4a] dark:hover:text-[#F8F5F0] mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Finance
        </Link>
        <h1 className="text-3xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0] mb-2">
          Monthly Review
        </h1>
        <p className="text-[#b8a898]">
          July 2026 • Takes 5-10 minutes
        </p>
      </div>

      {/* Progress */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[#b8a898]">
              Section {currentSection + 1} of {reviewSections.length}
            </span>
            <span className="text-sm font-medium text-[#c9a227]">
              {Math.round(progress)}% Complete
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      {/* Current Section */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#c9a227]/10 flex items-center justify-center">
            {section.icon}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">
              {section.title}
            </h2>
            <p className="text-sm text-[#b8a898]">
              {section.questions.length} questions
            </p>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            {section.questions.map((question) => (
              <div key={question.id}>
                <div className="flex items-start gap-3 mb-2">
                  {answers[question.id] ? (
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  ) : (
                    <Circle className="w-5 h-5 text-[#b8a898] mt-0.5" />
                  )}
                  <label className="block text-[#1a2b4a] dark:text-[#F8F5F0] font-medium">
                    {question.question}
                  </label>
                </div>
                <div className="ml-8">
                  {renderInput(question)}
                </div>
              </div>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-[#1a2b4a]/10">
            <Button 
              variant="ghost" 
              onClick={handlePrevious}
              disabled={currentSection === 0}
            >
              Previous
            </Button>
            
            {currentSection < reviewSections.length - 1 ? (
              <Button onClick={handleNext}>
                Next Section
                <TrendingUp className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {isSubmitting ? "Submitting..." : "Complete Review"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Section Navigation Dots */}
      <div className="flex justify-center gap-2 mt-6">
        {reviewSections.map((s, idx) => (
          <button
            key={s.id}
            onClick={() => setCurrentSection(idx)}
            className={`w-2 h-2 rounded-full transition-all ${
              idx === currentSection 
                ? "bg-[#c9a227] w-6" 
                : idx < currentSection 
                  ? "bg-green-500" 
                  : "bg-[#1a2b4a]/20"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
