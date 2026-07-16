"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import { Brain, ArrowLeft, ArrowRight, Save, CheckCircle } from "lucide-react";
import Link from "next/link";

interface Question {
  id: string;
  text: string;
  type: "radio" | "text" | "multiselect";
  options?: { value: string; label: string }[];
  section: string;
}

const questions: Question[] = [
  // Section 1: Business Clarity
  {
    id: "bc1",
    text: "What is your primary business model?",
    type: "radio",
    section: "Business Clarity",
    options: [
      { value: "product", label: "Product-based (selling physical/digital products)" },
      { value: "service", label: "Service-based (consulting, coaching, agency)" },
      { value: "subscription", label: "Subscription/Membership" },
      { value: "marketplace", label: "Marketplace/Platform" },
      { value: "hybrid", label: "Hybrid (combination of above)" },
    ],
  },
  {
    id: "bc2",
    text: "Who is your ideal client?",
    type: "radio",
    section: "Business Clarity",
    options: [
      { value: "very_clear", label: "Very clear - I can describe them in detail" },
      { value: "somewhat_clear", label: "Somewhat clear - I have a general idea" },
      { value: "unclear", label: "Unclear - I serve anyone who needs my help" },
      { value: "multiple", label: "I have multiple ideal client types" },
      { value: "evolving", label: "Still figuring it out" },
    ],
  },
  {
    id: "bc3",
    text: "What problem do you solve for your clients?",
    type: "radio",
    section: "Business Clarity",
    options: [
      { value: "clearly_defined", label: "Clearly defined and validated" },
      { value: "mostly_clear", label: "Mostly clear, some refinement needed" },
      { value: "vague", label: "Vague or too broad" },
      { value: "multiple", label: "Multiple problems across different offerings" },
      { value: "unclear", label: "Not sure / hard to articulate" },
    ],
  },
  {
    id: "bc4",
    text: "What is your unique value proposition?",
    type: "radio",
    section: "Business Clarity",
    options: [
      { value: "strong", label: "Strong and differentiated from competitors" },
      { value: "developing", label: "Developing, needs refinement" },
      { value: "generic", label: "Generic / similar to others in my space" },
      { value: "unclear", label: "Unclear or not articulated" },
      { value: "untested", label: "Not tested with real customers" },
    ],
  },
  {
    id: "bc5",
    text: "What are your top 3 revenue streams?",
    type: "text",
    section: "Business Clarity",
  },
  // Section 2: Strategic Thinking
  {
    id: "st1",
    text: "What are your 90-day priorities?",
    type: "radio",
    section: "Strategic Thinking",
    options: [
      { value: "clear", label: "Crystal clear with specific milestones" },
      { value: "mostly_clear", label: "Mostly clear, some ambiguity" },
      { value: "reactive", label: "Reactive - dealing with what comes up" },
      { value: "too_many", label: "Too many priorities (scattered focus)" },
      { value: "none", label: "No formal 90-day plan" },
    ],
  },
  {
    id: "st2",
    text: "What metrics matter most to your business?",
    type: "radio",
    section: "Strategic Thinking",
    options: [
      { value: "tracked", label: "Tracked and reviewed regularly" },
      { value: "known", label: "Known but not consistently tracked" },
      { value: "some", label: "Some metrics, not comprehensive" },
      { value: "vanity", label: "Mostly vanity metrics" },
      { value: "none", label: "Not sure what to track" },
    ],
  },
  {
    id: "st3",
    text: "What is your competitive advantage?",
    type: "radio",
    section: "Strategic Thinking",
    options: [
      { value: "sustainable", label: "Sustainable and defensible" },
      { value: "temporary", label: "Temporary or easily copied" },
      { value: "price", label: "Price (lowest cost provider)" },
      { value: "unclear", label: "Unclear what sets me apart" },
      { value: "none", label: "No distinct advantage" },
    ],
  },
  {
    id: "st4",
    text: "What partnerships could accelerate your growth?",
    type: "radio",
    section: "Strategic Thinking",
    options: [
      { value: "active", label: "Active partnerships in place" },
      { value: "identified", label: "Identified and pursuing" },
      { value: "considering", label: "Considering but not actively pursuing" },
      { value: "unclear", label: "Unclear who would be good partners" },
      { value: "solo", label: "Prefer to grow independently" },
    ],
  },
  {
    id: "st5",
    text: "What is your exit strategy (if any)?",
    type: "radio",
    section: "Strategic Thinking",
    options: [
      { value: "defined", label: "Clearly defined with timeline" },
      { value: "considering", label: "Considering options" },
      { value: "lifestyle", label: "Lifestyle business - no exit planned" },
      { value: "legacy", label: "Legacy/impact focus - pass to family/team" },
      { value: "none", label: "Haven't thought about it" },
    ],
  },
];

const sections = ["Business Clarity", "Strategic Thinking"];

export default function BrainAssessmentPage() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  // Load saved progress
  useEffect(() => {
    const saved = localStorage.getItem("brain-assessment");
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

  // Autosave
  const saveProgress = useCallback(() => {
    setIsSaving(true);
    const data = {
      answers,
      currentQuestion,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem("brain-assessment", JSON.stringify(data));
    setTimeout(() => {
      setLastSaved(new Date());
      setIsSaving(false);
    }, 500);
  }, [answers, currentQuestion]);

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

  const currentQ = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const currentSection = currentQ.section;
  const sectionQuestions = questions.filter((q) => q.section === currentSection);
  const sectionProgress =
    ((sectionQuestions.findIndex((q) => q.id === currentQ.id) + 1) /
      sectionQuestions.length) *
    100;

  if (isComplete) {
    return (
      <div className="min-h-screen bg-[#F6F1E8] dark:bg-[#1a1a2e] py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="border-[#2E7C83]/30">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-[#2E7C83]/10 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-[#2E7C83]" />
              </div>
              <h1 className="text-2xl font-bold text-[#1F315B] dark:text-[#F6F1E8] mb-4">
                Brain Assessment Complete!
              </h1>
              <p className="text-[#1F315B]/70 dark:text-[#F6F1E8]/70 mb-6">
                Thank you for completing the Brain Assessment. Your responses have been
                saved and will contribute to your overall Business Health Score.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/assessments/soul">
                  <Button variant="primary">
                    Continue to Soul Assessment
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="secondary">Go to Dashboard</Button>
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
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-[#2E7C83]/20 flex items-center justify-center">
              <Brain className="w-5 h-5 text-[#2E7C83]" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Brain Assessment</h1>
              <p className="text-sm text-[#CDBED6]">Systems & Operations</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Overall Progress</span>
              <span>
                {currentQuestion + 1} of {questions.length}
              </span>
            </div>
            <Progress value={progress} variant="teal" />
          </div>
        </div>
      </div>

      {/* Question Card */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Card className="border-[#2E7C83]/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[#2E7C83]">
                {currentQ.section}
              </span>
              <div className="flex items-center gap-2 text-sm text-[#B9A9A9]">
                <Save className="w-4 h-4" />
                {isSaving ? "Saving..." : lastSaved ? "Saved" : "Not saved"}
              </div>
            </div>
            <div className="mt-2">
              <Progress value={sectionProgress} variant="teal" className="h-1" />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <h2 className="text-xl font-semibold text-[#1F315B] dark:text-[#F6F1E8]">
              {currentQ.text}
            </h2>

            {currentQ.type === "radio" && currentQ.options && (
              <div className="space-y-3">
                {currentQ.options.map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      answers[currentQ.id] === option.value
                        ? "border-[#2E7C83] bg-[#2E7C83]/5"
                        : "border-[#D4AF63]/20 hover:border-[#D4AF63]/40"
                    }`}
                  >
                    <input
                      type="radio"
                      name={currentQ.id}
                      value={option.value}
                      checked={answers[currentQ.id] === option.value}
                      onChange={(e) => handleAnswer(e.target.value)}
                      className="mt-1 w-4 h-4 text-[#2E7C83] focus:ring-[#2E7C83]"
                    />
                    <span className="text-[#1F315B] dark:text-[#F6F1E8]">
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            )}

            {currentQ.type === "text" && (
              <textarea
                value={answers[currentQ.id] || ""}
                onChange={(e) => handleAnswer(e.target.value)}
                placeholder="Type your answer here..."
                rows={4}
                className="w-full p-4 rounded-xl border-2 border-[#D4AF63]/20 focus:border-[#2E7C83] focus:ring-2 focus:ring-[#2E7C83]/20 outline-none resize-none bg-white dark:bg-[#1a1a2e] text-[#1F315B] dark:text-[#F6F1E8]"
              />
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

        {/* Section Summary */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          {sections.map((section) => {
            const sectionQs = questions.filter((q) => q.section === section);
            const answeredQs = sectionQs.filter((q) => answers[q.id]).length;
            const isCurrent = section === currentSection;
            return (
              <div
                key={section}
                className={`p-4 rounded-xl border-2 transition-all ${
                  isCurrent
                    ? "border-[#2E7C83] bg-[#2E7C83]/5"
                    : "border-[#D4AF63]/20"
                }`}
              >
                <p className="text-sm font-medium text-[#1F315B] dark:text-[#F6F1E8]">
                  {section}
                </p>
                <p className="text-xs text-[#B9A9A9] mt-1">
                  {answeredQs} of {sectionQs.length} answered
                </p>
                <div className="mt-2">
                  <Progress
                    value={(answeredQs / sectionQs.length) * 100}
                    variant="teal"
                    className="h-1"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
