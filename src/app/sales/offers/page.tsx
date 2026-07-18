"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import {
  ArrowLeft,
  DollarSign,
  CheckCircle,
  Sparkles,
  ChevronRight,
  Lightbulb,
  Save,
  RefreshCw,
  Plus,
  X
} from "lucide-react";
import Link from "next/link";

interface Question {
  id: string;
  question: string;
  type: "text" | "textarea" | "choice" | "list";
  placeholder?: string;
  hint?: string;
  options?: string[];
}

interface Answer {
  questionId: string;
  answer: string | string[];
}

const offersQuestions: Question[] = [
  {
    id: "main-offer",
    question: "What is your main offer or signature service?",
    type: "textarea",
    placeholder: "Describe your primary service, program, or product...",
    hint: "This is your flagship offer—the thing you're most known for."
  },
  {
    id: "offer-structure",
    question: "How is your offer structured?",
    type: "choice",
    options: [
      "One-on-one coaching/consulting",
      "Group program",
      "Online course",
      "Done-for-you service",
      "Retainer/agreement",
      "Product/package",
      "Hybrid model"
    ]
  },
  {
    id: "pricing",
    question: "What is your pricing?",
    type: "text",
    placeholder: "e.g., $2,500, $500/month, $10,000 package...",
    hint: "Be specific. Include payment plan options if applicable."
  },
  {
    id: "deliverables",
    question: "What exactly does the client receive?",
    type: "list",
    placeholder: "e.g., 6 coaching sessions, workbook, email support, community access...",
    hint: "List all the tangible and intangible components."
  },
  {
    id: "transformation",
    question: "What transformation does your offer create?",
    type: "textarea",
    placeholder: "The before state, the journey, the after state...",
    hint: "Sell the transformation, not the deliverables."
  },
  {
    id: "timeline",
    question: "What is the timeline or duration?",
    type: "text",
    placeholder: "e.g., 3 months, 6 weeks, ongoing...",
    hint: "How long does it take to achieve the transformation?"
  },
  {
    id: "ideal-client",
    question: "Who is this offer perfect for?",
    type: "textarea",
    placeholder: "The specific person who gets the best results...",
    hint: "Be specific. This helps you qualify prospects."
  },
  {
    id: "not-for",
    question: "Who is this offer NOT for?",
    type: "textarea",
    placeholder: "People who aren't ready, wrong fit, better served elsewhere...",
    hint: "Being clear about who you don't serve attracts the right people."
  },
  {
    id: "guarantee",
    question: "Do you offer any guarantee or risk reversal?",
    type: "textarea",
    placeholder: "e.g., 30-day money-back guarantee, satisfaction promise...",
    hint: "Reducing risk makes it easier for people to say yes."
  }
];

export default function OffersPage() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [currentList, setCurrentList] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const currentQuestion = offersQuestions[currentQuestionIndex];
  const progress = ((currentQuestionIndex) / offersQuestions.length) * 100;

  const handleNext = () => {
    let answerValue: string | string[] = currentAnswer;

    if (currentQuestion.type === "list") {
      if (currentList.length === 0) return;
      answerValue = currentList;
    } else if (!currentAnswer.trim()) {
      return;
    }

    const newAnswer: Answer = {
      questionId: currentQuestion.id,
      answer: answerValue
    };

    setAnswers(prev => [...prev, newAnswer]);
    setCurrentAnswer("");
    setCurrentList([]);
    setShowHint(false);

    if (currentQuestionIndex < offersQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setIsComplete(true);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      const previousAnswer = answers.find(a => a.questionId === offersQuestions[currentQuestionIndex - 1].id);
      if (previousAnswer) {
        if (Array.isArray(previousAnswer.answer)) {
          setCurrentList(previousAnswer.answer);
          setCurrentAnswer("");
        } else {
          setCurrentAnswer(previousAnswer.answer);
          setCurrentList([]);
        }
      }
      setAnswers(prev => prev.filter(a => a.questionId !== offersQuestions[currentQuestionIndex].id));
    }
  };

  const addToList = () => {
    if (currentAnswer.trim() && !currentList.includes(currentAnswer.trim())) {
      setCurrentList(prev => [...prev, currentAnswer.trim()]);
      setCurrentAnswer("");
    }
  };

  const removeFromList = (item: string) => {
    setCurrentList(prev => prev.filter(i => i !== item));
  };

  const handleSave = () => {
    alert("Offers & Packages saved!");
  };

  if (isComplete) {
    return (
      <div className="py-8 px-4 max-w-4xl mx-auto">
        <Link href="/sales" className="flex items-center gap-2 text-[#5E3B6C] hover:text-[#1F315B] mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Sales System
        </Link>

        <Card className="border-green-500/30">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-[#1F315B] dark:text-[#F6F1E8] mb-2">
              Offers & Packages Complete!
            </h2>
            <p className="text-[#5E3B6C] dark:text-[#CDBED6] mb-6">
              Your offer structure and pricing are now defined.
            </p>

            <div className="text-left space-y-4 max-w-2xl mx-auto">
              {answers.map((answer, index) => (
                <div key={answer.questionId} className="bg-[#1F315B]/5 rounded-lg p-4">
                  <p className="text-sm text-[#B9A9A9] mb-1">
                    {offersQuestions[index]?.question}
                  </p>
                  {Array.isArray(answer.answer) ? (
                    <ul className="list-disc list-inside text-[#1F315B] dark:text-[#F6F1E8]">
                      {answer.answer.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[#1F315B] dark:text-[#F6F1E8] font-medium">
                      {answer.answer}
                    </p>
                  )}
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
                Save Offers
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="py-8 px-4 max-w-4xl mx-auto">
      <Link href="/sales" className="flex items-center gap-2 text-[#5E3B6C] hover:text-[#1F315B] mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to Sales System
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-[#D4AF63]/20 flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-[#D4AF63]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1F315B] dark:text-[#F6F1E8]">
              Offers & Packages
            </h1>
            <p className="text-[#B9A9A9]">
              What you sell and how it&apos;s priced
            </p>
          </div>
        </div>

        <div className="w-full bg-[#1F315B]/10 rounded-full h-2">
          <div
            className="bg-[#D4AF63] h-2 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-[#B9A9A9] mt-1">
          Question {currentQuestionIndex + 1} of {offersQuestions.length}
        </p>
      </div>

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
          ) : currentQuestion.type === "list" ? (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  placeholder={currentQuestion.placeholder}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addToList();
                    }
                  }}
                />
                <Button onClick={addToList} variant="outline">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {currentList.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {currentList.map((item, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-[#D4AF63]/20 text-[#1F315B] dark:text-[#F6F1E8] rounded-full text-sm"
                    >
                      {item}
                      <button
                        onClick={() => removeFromList(item)}
                        className="hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <p className="text-sm text-[#B9A9A9]">
                {currentList.length} items added
              </p>
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
                disabled={currentQuestion.type === "list" ? currentList.length === 0 : !currentAnswer.trim()}
              >
                {currentQuestionIndex === offersQuestions.length - 1 ? "Complete" : "Next"}
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
