"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import { Heart, ArrowLeft, ArrowRight, Save, CheckCircle, Shield } from "lucide-react";
import Link from "next/link";

interface Question {
  id: string;
  text: string;
  type: "radio" | "text" | "multiselect";
  options?: { value: string; label: string }[];
  section: string;
  sensitive?: boolean;
}

const questions: Question[] = [
  // Section 1: Founder Alignment
  {
    id: "fa1",
    text: "Why did you start this business?",
    type: "radio",
    section: "Founder Alignment",
    options: [
      { value: "purpose", label: "To fulfill a deeper purpose or calling" },
      { value: "freedom", label: "To create freedom and flexibility in my life" },
      { value: "problem", label: "To solve a specific problem I experienced" },
      { value: "opportunity", label: "I saw a market opportunity" },
      { value: "transition", label: "Transitioned from job/circumstances" },
    ],
  },
  {
    id: "fa2",
    text: "What does success look like for you personally?",
    type: "radio",
    section: "Founder Alignment",
    options: [
      { value: "impact", label: "Making a meaningful impact on others" },
      { value: "balance", label: "Work-life balance and personal fulfillment" },
      { value: "wealth", label: "Financial abundance and security" },
      { value: "recognition", label: "Recognition and status in my field" },
      { value: "freedom", label: "Freedom to do what I want, when I want" },
    ],
  },
  {
    id: "fa3",
    text: "What drains your energy in your business?",
    type: "text",
    section: "Founder Alignment",
    sensitive: true,
  },
  {
    id: "fa4",
    text: "What gives you energy and makes you feel alive?",
    type: "text",
    section: "Founder Alignment",
  },
  {
    id: "fa5",
    text: "What would you do if money was not a concern?",
    type: "radio",
    section: "Founder Alignment",
    options: [
      { value: "same", label: "Continue doing exactly what I'm doing now" },
      { value: "similar", label: "Something similar but with changes" },
      { value: "different", label: "Something completely different" },
      { value: "pause", label: "Take a long pause to reflect and rest" },
      { value: "unclear", label: "I'm not sure - I need to think about it" },
    ],
  },
  // Section 2: Values & Vision
  {
    id: "vv1",
    text: "What are your top 3 personal values?",
    type: "text",
    section: "Values & Vision",
  },
  {
    id: "vv2",
    text: "How do your values show up in your business?",
    type: "radio",
    section: "Values & Vision",
    options: [
      { value: "fully", label: "Fully integrated into every decision" },
      { value: "mostly", label: "Mostly aligned with some compromises" },
      { value: "sometimes", label: "Sometimes, but often overlooked" },
      { value: "rarely", label: "Rarely - business demands come first" },
      { value: "unclear", label: "Unclear how to align values with business" },
    ],
  },
  {
    id: "vv3",
    text: "What legacy do you want to create through your work?",
    type: "text",
    section: "Values & Vision",
  },
  {
    id: "vv4",
    text: "What does 'enough' look like for you?",
    type: "radio",
    section: "Values & Vision",
    options: [
      { value: "defined", label: "Clearly defined - I know my 'enough' number" },
      { value: "evolving", label: "Evolving - it changes as I grow" },
      { value: "more", label: "Always more - I haven't found my limit" },
      { value: "simple", label: "Simple living - I need very little" },
      { value: "unclear", label: "Unclear - I haven't defined it yet" },
    ],
  },
  {
    id: "vv5",
    text: "What would make you proud when you look back in 10 years?",
    type: "text",
    section: "Values & Vision",
  },
];

const sections = ["Founder Alignment", "Values & Vision"];

export default function SoulAssessmentPage() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [showSensitive, setShowSensitive] = useState(true);

  // Load saved progress
  useEffect(() => {
    const saved = localStorage.getItem("soul-assessment");
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
    localStorage.setItem("soul-assessment", JSON.stringify(data));
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
          <Card className="border-[#5E3B6C]/30">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-[#5E3B6C]/10 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-[#5E3B6C]" />
              </div>
              <h1 className="text-2xl font-bold text-[#1F315B] dark:text-[#F6F1E8] mb-4">
                Soul Assessment Complete!
              </h1>
              <p className="text-[#1F315B]/70 dark:text-[#F6F1E8]/70 mb-6">
                Thank you for the deep reflection. Your responses reveal important
                insights about your alignment with your business and purpose.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/assessments/profit">
                  <Button variant="primary">
                    Continue to Profit Assessment
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
            <div className="w-10 h-10 rounded-lg bg-[#5E3B6C]/20 flex items-center justify-center">
              <Heart className="w-5 h-5 text-[#5E3B6C]" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Soul Assessment</h1>
              <p className="text-sm text-[#CDBED6]">Purpose & Alignment</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Overall Progress</span>
              <span>
                {currentQuestion + 1} of {questions.length}
              </span>
            </div>
            <Progress value={progress} variant="lavender" />
          </div>
        </div>
      </div>

      {/* Sensitive Questions Toggle */}
      <div className="max-w-3xl mx-auto px-4 pt-4">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => setShowSensitive(!showSensitive)}
            className="flex items-center gap-2 text-sm text-[#5E3B6C] hover:text-[#5E3B6C]/80 transition-colors"
          >
            <Shield className="w-4 h-4" />
            {showSensitive ? "Hide sensitive questions" : "Show sensitive questions"}
          </button>
        </div>
      </div>

      {/* Question Card */}
      <div className="max-w-3xl mx-auto px-4 py-4">
        {currentQ.sensitive && !showSensitive ? (
          <Card className="border-[#5E3B6C]/20">
            <CardContent className="p-8 text-center">
              <Shield className="w-12 h-12 text-[#5E3B6C] mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-[#1F315B] dark:text-[#F6F1E8] mb-2">
                Sensitive Question Hidden
              </h2>
              <p className="text-[#1F315B]/70 dark:text-[#F6F1E8]/70 mb-4">
                This question is marked as sensitive. Toggle above to view and answer.
              </p>
              <Button variant="secondary" onClick={() => setShowSensitive(true)}>
                Show Question
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-[#5E3B6C]/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[#5E3B6C]">
                  {currentQ.section}
                </span>
                <div className="flex items-center gap-2 text-sm text-[#B9A9A9]">
                  <Save className="w-4 h-4" />
                  {isSaving ? "Saving..." : lastSaved ? "Saved" : "Not saved"}
                </div>
              </div>
              <div className="mt-2">
                <Progress value={sectionProgress} variant="lavender" className="h-1" />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start gap-3">
                <h2 className="text-xl font-semibold text-[#1F315B] dark:text-[#F6F1E8]">
                  {currentQ.text}
                </h2>
                {currentQ.sensitive && (
                  <Shield className="w-5 h-5 text-[#5E3B6C] flex-shrink-0 mt-1" />
                )}
              </div>

              {currentQ.type === "radio" && currentQ.options && (
                <div className="space-y-3">
                  {currentQ.options.map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        answers[currentQ.id] === option.value
                          ? "border-[#5E3B6C] bg-[#5E3B6C]/5"
                          : "border-[#D4AF63]/20 hover:border-[#D4AF63]/40"
                      }`}
                    >
                      <input
                        type="radio"
                        name={currentQ.id}
                        value={option.value}
                        checked={answers[currentQ.id] === option.value}
                        onChange={(e) => handleAnswer(e.target.value)}
                        className="mt-1 w-4 h-4 text-[#5E3B6C] focus:ring-[#5E3B6C]"
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
                  placeholder="Take your time to reflect..."
                  rows={4}
                  className="w-full p-4 rounded-xl border-2 border-[#D4AF63]/20 focus:border-[#5E3B6C] focus:ring-2 focus:ring-[#5E3B6C]/20 outline-none resize-none bg-white dark:bg-[#1a1a2e] text-[#1F315B] dark:text-[#F6F1E8]"
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
        )}

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
                    ? "border-[#5E3B6C] bg-[#5E3B6C]/5"
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
                    variant="lavender"
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
