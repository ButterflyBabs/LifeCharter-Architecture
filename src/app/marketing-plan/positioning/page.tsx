"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { 
  ArrowLeft, 
  Target, 
  CheckCircle, 
  Sparkles, 
  ChevronRight,
  Lightbulb,
  Save,
  RefreshCw
} from "lucide-react";
import Link from "next/link";

interface Question {
  id: string;
  question: string;
  type: "text" | "textarea" | "choice";
  placeholder?: string;
  hint?: string;
  options?: string[];
}

interface Answer {
  questionId: string;
  answer: string;
}

const positioningQuestions: Question[] = [
  {
    id: "what-you-do",
    question: "What do you do, in the simplest terms?",
    type: "text",
    placeholder: "e.g., I help working moms lose weight without giving up family dinners",
    hint: "Avoid jargon. Imagine explaining to a 10-year-old."
  },
  {
    id: "who-you-help",
    question: "Who specifically do you help?",
    type: "text",
    placeholder: "e.g., Working moms with kids under 10 who struggle with meal prep",
    hint: "The more specific, the better. 'Everyone' is not a target."
  },
  {
    id: "transformation",
    question: "What transformation do you create for them?",
    type: "textarea",
    placeholder: "Describe the before and after. What changes in their life after working with you?",
    hint: "Focus on outcomes, not processes."
  },
  {
    id: "differentiation",
    question: "What makes your approach different from others?",
    type: "textarea",
    placeholder: "Your unique methodology, perspective, or experience...",
    hint: "This is your competitive advantage. What do you believe that others don't?"
  },
  {
    id: "why-you",
    question: "Why do clients choose YOU specifically?",
    type: "choice",
    options: [
      "My specific expertise/credentials",
      "My unique methodology",
      "My personal story/experience",
      "My personality/approach",
      "Results I've gotten for others",
      "Something else"
    ]
  },
  {
    id: "promise",
    question: "What's the main promise you make to clients?",
    type: "text",
    placeholder: "e.g., Lose 20 pounds in 90 days without giving up family dinners",
    hint: "Make it specific and measurable if possible."
  },
  {
    id: "tagline-ideas",
    question: "Based on your answers, here are some tagline ideas. Which resonates most?",
    type: "choice",
    options: [
      "[AI will generate options based on previous answers]",
      "I want to create my own",
      "None of these feel right yet"
    ]
  }
];

export default function PositioningPage() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const currentQuestion = positioningQuestions[currentQuestionIndex];
  const progress = ((currentQuestionIndex) / positioningQuestions.length) * 100;

  const handleNext = () => {
    if (!currentAnswer.trim()) return;

    const newAnswer: Answer = {
      questionId: currentQuestion.id,
      answer: currentAnswer
    };

    setAnswers(prev => [...prev, newAnswer]);
    setCurrentAnswer("");
    setShowHint(false);

    if (currentQuestionIndex < positioningQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setIsComplete(true);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      const previousAnswer = answers.find(a => a.questionId === positioningQuestions[currentQuestionIndex - 1].id);
      setCurrentAnswer(previousAnswer?.answer || "");
      setAnswers(prev => prev.filter(a => a.questionId !== positioningQuestions[currentQuestionIndex].id));
    }
  };

  const handleSave = () => {
    // Save to database
    alert("Positioning saved!");
  };

  if (isComplete) {
    return (
      <div className="py-8 px-4 max-w-4xl mx-auto">
        <Link href="/marketing-plan" className="flex items-center gap-2 text-[#5E3B6C] hover:text-[#1F315B] mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Marketing Plan
        </Link>

        <Card className="border-green-500/30">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-[#1F315B] dark:text-[#F6F1E8] mb-2">
              Positioning Complete!
            </h2>
            <p className="text-[#5E3B6C] dark:text-[#CDBED6] mb-6">
              Your unique value proposition is now defined. Here&apos;s what we captured:
            </p>

            <div className="text-left space-y-4 max-w-2xl mx-auto">
              {answers.map((answer, index) => (
                <div key={answer.questionId} className="bg-[#1F315B]/5 rounded-lg p-4">
                  <p className="text-sm text-[#B9A9A9] mb-1">
                    {positioningQuestions[index]?.question}
                  </p>
                  <p className="text-[#1F315B] dark:text-[#F6F1E8] font-medium">
                    {answer.answer}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex gap-3 justify-center mt-8">
              <Button variant="outline" onClick={() => setIsComplete(false)}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Edit Answers
              </Button>
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Save Positioning
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="py-8 px-4 max-w-4xl mx-auto">
      {/* Header */}
      <Link href="/marketing-plan" className="flex items-center gap-2 text-[#5E3B6C] hover:text-[#1F315B] mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to Marketing Plan
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-[#5E3B6C]/20 flex items-center justify-center">
            <Target className="w-6 h-6 text-[#5E3B6C]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1F315B] dark:text-[#F6F1E8]">
              Positioning & UVP
            </h1>
            <p className="text-[#B9A9A9]">
              Define what makes you different and why clients choose you
            </p>
          </div>
        </div>

        {/* Progress */}
        <div className="w-full bg-[#1F315B]/10 rounded-full h-2">
          <div 
            className="bg-[#D4AF63] h-2 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-[#B9A9A9] mt-1">
          Question {currentQuestionIndex + 1} of {positioningQuestions.length}
        </p>
      </div>

      {/* Question Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#D4AF63]" />
            <CardTitle className="text-lg text-[#1F315B] dark:text-[#F6F1E8]">
              {currentQuestion.question}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentQuestion.type === "choice" ? (
            <div className="space-y-2">
              {currentQuestion.options?.map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    setCurrentAnswer(option);
                    setTimeout(() => handleNext(), 100);
                  }}
                  className={`w-full p-4 text-left rounded-lg border transition-all ${
                    currentAnswer === option
                      ? "border-[#D4AF63] bg-[#D4AF63]/10"
                      : "border-[#1F315B]/10 hover:border-[#D4AF63]/50"
                  }`}
                >
                  <span className="text-[#1F315B] dark:text-[#F6F1E8]">{option}</span>
                </button>
              ))}
            </div>
          ) : currentQuestion.type === "textarea" ? (
            <Textarea
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              placeholder={currentQuestion.placeholder}
              className="min-h-[120px]"
            />
          ) : (
            <Input
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              placeholder={currentQuestion.placeholder}
            />
          )}

          {currentQuestion.hint && (
            <button
              onClick={() => setShowHint(!showHint)}
              className="flex items-center gap-2 text-sm text-[#D4AF63] hover:underline"
            >
              <Lightbulb className="w-4 h-4" />
              {showHint ? "Hide hint" : "Need a hint?"}
            </button>
          )}

          {showHint && currentQuestion.hint && (
            <p className="text-sm text-[#B9A9A9] italic bg-[#1F315B]/5 p-3 rounded-lg">
              💡 {currentQuestion.hint}
            </p>
          )}

          {currentQuestion.type !== "choice" && (
            <div className="flex justify-between pt-4">
              <Button 
                variant="outline" 
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
              >
                Previous
              </Button>
              <Button 
                onClick={handleNext}
                disabled={!currentAnswer.trim()}
              >
                {currentQuestionIndex === positioningQuestions.length - 1 ? "Complete" : "Next"}
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Previous Answers Summary */}
      {answers.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-sm text-[#B9A9A9]">Your Answers So Far</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {answers.map((answer, index) => (
                <div key={answer.questionId} className="flex items-start gap-3 text-sm">
                  <span className="w-5 h-5 rounded-full bg-[#D4AF63]/20 text-[#D4AF63] flex items-center justify-center text-xs flex-shrink-0">
                    {index + 1}
                  </span>
                  <p className="text-[#5E3B6C] dark:text-[#CDBED6] line-clamp-2">
                    {answer.answer}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
