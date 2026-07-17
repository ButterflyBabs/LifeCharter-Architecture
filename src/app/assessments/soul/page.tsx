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
  // Section 1: Core Identity (10 questions)
  {
    id: "ci1",
    text: "What is your full name?",
    type: "text",
    section: "Core Identity",
  },
  {
    id: "ci2",
    text: "What name do you prefer to be called professionally?",
    type: "text",
    section: "Core Identity",
  },
  {
    id: "ci3",
    text: "What name do you prefer to be called personally?",
    type: "text",
    section: "Core Identity",
  },
  {
    id: "ci4",
    text: "What pronouns do you use?",
    type: "text",
    section: "Core Identity",
  },
  {
    id: "ci5",
    text: "Where are you based?",
    type: "text",
    section: "Core Identity",
  },
  {
    id: "ci6",
    text: "What communities, cultures, or regions have shaped how you see the world?",
    type: "text",
    section: "Core Identity",
  },
  {
    id: "ci7",
    text: "How do you currently describe who you are in one sentence?",
    type: "text",
    section: "Core Identity",
  },
  {
    id: "ci8",
    text: "What parts of your identity feel most central to your work?",
    type: "text",
    section: "Core Identity",
  },
  {
    id: "ci9",
    text: "What season of life are you currently in?",
    type: "text",
    section: "Core Identity",
  },
  {
    id: "ci10",
    text: "What are you learning, releasing, and building right now?",
    type: "text",
    section: "Core Identity",
  },
  // Section 2: Origin Story (10 questions)
  {
    id: "os1",
    text: "What were you like as a child?",
    type: "text",
    section: "Origin Story",
    sensitive: true,
  },
  {
    id: "os2",
    text: "What did people often notice about you when you were young?",
    type: "text",
    section: "Origin Story",
  },
  {
    id: "os3",
    text: "What did you love before the world told you what was practical?",
    type: "text",
    section: "Origin Story",
    sensitive: true,
  },
  {
    id: "os4",
    text: "What did you have to become good at to survive, belong, succeed, or be loved?",
    type: "text",
    section: "Origin Story",
    sensitive: true,
  },
  {
    id: "os5",
    text: "What role did you play in your family? (caretaker, achiever, rebel, peacekeeper, etc.)",
    type: "text",
    section: "Origin Story",
    sensitive: true,
  },
  {
    id: "os6",
    text: "What did you learn too early?",
    type: "text",
    section: "Origin Story",
    sensitive: true,
  },
  {
    id: "os7",
    text: "What are the major life events that shaped who you are?",
    type: "text",
    section: "Origin Story",
    sensitive: true,
  },
  {
    id: "os8",
    text: "Which experiences broke something open in you? Which gave you wisdom you could not have learned otherwise?",
    type: "text",
    section: "Origin Story",
    sensitive: true,
  },
  {
    id: "os9",
    text: "What losses and victories have shaped your worldview and confidence?",
    type: "text",
    section: "Origin Story",
    sensitive: true,
  },
  {
    id: "os10",
    text: "Was there a specific moment when your life or work changed direction?",
    type: "text",
    section: "Origin Story",
  },
  // Section 3: Calling and Purpose (10 questions)
  {
    id: "cp1",
    text: "Why do you do the work you do?",
    type: "text",
    section: "Calling and Purpose",
  },
  {
    id: "cp2",
    text: "What problem can you not unsee?",
    type: "text",
    section: "Calling and Purpose",
  },
  {
    id: "cp3",
    text: "What transformation do you feel assigned to help others experience?",
    type: "text",
    section: "Calling and Purpose",
  },
  {
    id: "cp4",
    text: "Who are you here to serve?",
    type: "text",
    section: "Calling and Purpose",
  },
  {
    id: "cp5",
    text: "What do you want people to feel in your presence?",
    type: "text",
    section: "Calling and Purpose",
  },
  {
    id: "cp6",
    text: "What would still matter even if no one applauded?",
    type: "text",
    section: "Calling and Purpose",
  },
  {
    id: "cp7",
    text: "What is your current mission?",
    type: "text",
    section: "Calling and Purpose",
  },
  {
    id: "cp8",
    text: "What does aligned success feel like to you?",
    type: "text",
    section: "Calling and Purpose",
  },
  {
    id: "cp9",
    text: "What are you unwilling to sacrifice for success?",
    type: "text",
    section: "Calling and Purpose",
    sensitive: true,
  },
  {
    id: "cp10",
    text: "What makes your work feel sacred or meaningful?",
    type: "text",
    section: "Calling and Purpose",
  },
  // Section 4: Values and Standards (10 questions)
  {
    id: "vs1",
    text: "What are your top 5-10 core values?",
    type: "text",
    section: "Values and Standards",
  },
  {
    id: "vs2",
    text: "Which value do you protect most fiercely?",
    type: "text",
    section: "Values and Standards",
  },
  {
    id: "vs3",
    text: "Which value has cost you something?",
    type: "text",
    section: "Values and Standards",
    sensitive: true,
  },
  {
    id: "vs4",
    text: "What are your personal non-negotiables?",
    type: "text",
    section: "Values and Standards",
    sensitive: true,
  },
  {
    id: "vs5",
    text: "What are your professional non-negotiables?",
    type: "text",
    section: "Values and Standards",
  },
  {
    id: "vs6",
    text: "What will you no longer tolerate in your life or work?",
    type: "text",
    section: "Values and Standards",
    sensitive: true,
  },
  {
    id: "vs7",
    text: "What does integrity mean to you?",
    type: "text",
    section: "Values and Standards",
  },
  {
    id: "vs8",
    text: "What compromises are dangerous for you?",
    type: "text",
    section: "Values and Standards",
    sensitive: true,
  },
  {
    id: "vs9",
    text: "How do your values show up in your daily decisions?",
    type: "text",
    section: "Values and Standards",
  },
  {
    id: "vs10",
    text: "What boundaries do you need to protect what matters most?",
    type: "text",
    section: "Values and Standards",
  },
  // Section 5: Beliefs and Worldview (10 questions)
  {
    id: "bw1",
    text: "What do you believe about people?",
    type: "text",
    section: "Beliefs and Worldview",
  },
  {
    id: "bw2",
    text: "What do you believe about transformation?",
    type: "text",
    section: "Beliefs and Worldview",
  },
  {
    id: "bw3",
    text: "What do you believe about healing and growth?",
    type: "text",
    section: "Beliefs and Worldview",
  },
  {
    id: "bw4",
    text: "What do you believe about suffering?",
    type: "text",
    section: "Beliefs and Worldview",
    sensitive: true,
  },
  {
    id: "bw5",
    text: "What do you believe about resilience?",
    type: "text",
    section: "Beliefs and Worldview",
  },
  {
    id: "bw6",
    text: "What do you believe about purpose?",
    type: "text",
    section: "Beliefs and Worldview",
  },
  {
    id: "bw7",
    text: "What do you believe that goes against common advice in your industry?",
    type: "text",
    section: "Beliefs and Worldview",
  },
  {
    id: "bw8",
    text: "What popular belief do you disagree with?",
    type: "text",
    section: "Beliefs and Worldview",
  },
  {
    id: "bw9",
    text: "Do you have a spiritual or philosophical foundation that shapes your work?",
    type: "text",
    section: "Beliefs and Worldview",
  },
  {
    id: "bw10",
    text: "What truth do you keep coming back to, no matter what changes?",
    type: "text",
    section: "Beliefs and Worldview",
  },
];

const sections = [
  "Core Identity",
  "Origin Story",
  "Calling and Purpose",
  "Values and Standards",
  "Beliefs and Worldview",
];

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
                <Link href="/assessments/brain">
                  <Button variant="primary">
                    Continue to Brain Assessment
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

              {currentQ.type === "text" && (
                <textarea
                  value={answers[currentQ.id] || ""}
                  onChange={(e) => handleAnswer(e.target.value)}
                  placeholder="Take your time to reflect..."
                  rows={6}
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
        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
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
