"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import {
  ArrowLeft,
  UserPlus,
  CheckCircle,
  HelpCircle,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Plus,
  X
} from "lucide-react";
import Link from "next/link";

interface Question {
  id: string;
  question: string;
  type: "choice" | "text" | "textarea" | "list" | "number";
  options?: string[];
  placeholder?: string;
  hint?: string;
}

const questions: Question[] = [
  {
    id: "onboarding_steps",
    question: "What are the key steps in your current onboarding process?",
    type: "list",
    placeholder: "e.g., Welcome email, Kickoff call, Account setup",
    hint: "List every touchpoint a new customer experiences in their first 30 days"
  },
  {
    id: "onboarding_duration",
    question: "How long does your typical onboarding take?",
    type: "choice",
    options: [
      "Same day (immediate)",
      "1-3 days",
      "1 week",
      "2 weeks",
      "1 month",
      "More than 1 month",
      "Varies significantly"
    ],
    hint: "From first purchase to fully onboarded and receiving value"
  },
  {
    id: "welcome_sequence",
    question: "Do you have an automated welcome email sequence?",
    type: "choice",
    options: [
      "Yes, comprehensive multi-email sequence",
      "Yes, single welcome email",
      "No, but I send manual welcomes",
      "No, no formal welcome process",
      "Planning to create one"
    ],
    hint: "Automated emails that guide new customers through their first days/weeks"
  },
  {
    id: "personal_touch",
    question: "How do you add personal touch to onboarding?",
    type: "textarea",
    placeholder: "Describe personal touches like calls, gifts, handwritten notes...",
    hint: "What makes new customers feel seen and valued, not just processed?"
  },
  {
    id: "completion_rate",
    question: "What percentage of customers complete onboarding?",
    type: "choice",
    options: [
      "90-100%",
      "75-90%",
      "50-75%",
      "25-50%",
      "Less than 25%",
      "Not tracked"
    ],
    hint: "Those who fully complete all onboarding steps vs. those who start"
  },
  {
    id: "common_dropoff",
    question: "Where do customers typically drop off in onboarding?",
    type: "textarea",
    placeholder: "Describe the friction points or steps where people get stuck...",
    hint: "Identify the moments where customers lose momentum or disengage"
  },
  {
    id: "success_metrics",
    question: "How do you measure onboarding success?",
    type: "list",
    placeholder: "e.g., First login, Feature adoption, Support ticket resolution",
    hint: "What indicates a customer has successfully onboarded?"
  },
  {
    id: "improvement_priority",
    question: "What would most improve your onboarding experience?",
    type: "choice",
    options: [
      "More automation / less manual work",
      "Better communication / clearer expectations",
      "Faster time-to-value",
      "More personalization",
      "Better training materials",
      "More human touch / check-ins",
      "Simpler process / fewer steps"
    ],
    hint: "If you could change one thing about onboarding, what would it be?"
  }
];

export default function OnboardingPage() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [showHint, setShowHint] = useState(false);
  const [listInput, setListInput] = useState("");
  const [isComplete, setIsComplete] = useState(false);

  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  const handleAnswer = (value: string | string[]) => {
    setAnswers({ ...answers, [question.id]: value });
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setShowHint(false);
      setListInput("");
    } else {
      setIsComplete(true);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setShowHint(false);
    }
  };

  const handleAddToList = () => {
    if (!listInput.trim()) return;
    const current = (answers[question.id] as string[]) || [];
    handleAnswer([...current, listInput.trim()]);
    setListInput("");
  };

  const handleRemoveFromList = (index: number) => {
    const current = (answers[question.id] as string[]) || [];
    handleAnswer(current.filter((_item: string, i: number) => i !== index));
  };

  const canProceed = () => {
    const answer = answers[question.id];
    if (question.type === "list") {
      return answer && (answer as string[]).length > 0;
    }
    return answer && answer.toString().trim() !== "";
  };

  if (isComplete) {
    return (
      <div className="py-8 px-4 max-w-3xl mx-auto">
        <Link href="/operations" className="flex items-center gap-2 text-[#5E3B6C] hover:text-[#1F315B] mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Operations
        </Link>

        <Card className="text-center p-8">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-[#1F315B] dark:text-[#F6F1E8] mb-2">
            Onboarding Assessment Complete!
          </h2>
          <p className="text-[#B9A9A9] mb-6">
            Your onboarding insights have been saved. Here&apos;s what we learned:
          </p>

          <div className="text-left bg-[#1F315B]/5 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-[#1F315B] dark:text-[#F6F1E8] mb-4">Summary</h3>
            <div className="space-y-2 text-sm">
              <p><span className="text-[#B9A9A9]">Key Steps:</span> {answers.onboarding_steps?.length} defined</p>
              <p><span className="text-[#B9A9A9]">Duration:</span> {answers.onboarding_duration}</p>
              <p><span className="text-[#B9A9A9]">Welcome Sequence:</span> {answers.welcome_sequence}</p>
              <p><span className="text-[#B9A9A9]">Completion Rate:</span> {answers.completion_rate}</p>
              <p><span className="text-[#B9A9A9]">Top Priority:</span> {answers.improvement_priority}</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#1F315B] to-[#5E3B6C] text-[#F6F1E8] rounded-lg p-6 mb-6">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#D4AF63]" />
              AI Recommendations for Onboarding
            </h3>
            <ul className="text-sm text-left space-y-2 text-[#CDBED6]">
              <li>• Add milestone check-ins at Day 3, Day 7, and Day 14</li>
              <li>• Create a &quot;quick win&quot; moment within first 48 hours</li>
              <li>• Send personalized video welcome from founder/lead</li>
              <li>• Build a &quot;success path&quot; visual showing the journey ahead</li>
              <li>• Implement progress tracking so customers see completion %</li>
            </ul>
          </div>

          <div className="flex gap-3 justify-center">
            <Link href="/operations">
              <Button variant="outline">Back to Operations</Button>
            </Link>
            <Link href="/operations/support">
              <Button>Continue to Support</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="py-8 px-4 max-w-3xl mx-auto">
      {/* Header */}
      <Link href="/operations" className="flex items-center gap-2 text-[#5E3B6C] hover:text-[#1F315B] mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to Operations
      </Link>

      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
            <UserPlus className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#1F315B] dark:text-[#F6F1E8]">
              Onboarding
            </h1>
            <p className="text-sm text-[#B9A9A9]">
              Question {currentQuestion + 1} of {questions.length}
            </p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-[#B9A9A9] mb-2">
          <span>Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-[#1F315B]/10 rounded-full h-2">
          <div
            className="bg-orange-500 h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-6">
            <h2 className="text-lg font-medium text-[#1F315B] dark:text-[#F6F1E8]">
              {question.question}
            </h2>
            {question.hint && (
              <button
                onClick={() => setShowHint(!showHint)}
                className="text-[#B9A9A9] hover:text-[#D4AF63]"
              >
                <HelpCircle className="w-5 h-5" />
              </button>
            )}
          </div>

          {showHint && question.hint && (
            <div className="mb-4 p-3 bg-[#D4AF63]/10 rounded-lg text-sm text-[#5E3B6C] dark:text-[#CDBED6]">
              <span className="font-medium">Hint:</span> {question.hint}
            </div>
          )}

          {/* Input Types */}
          {question.type === "choice" && (
            <div className="space-y-2">
              {question.options?.map((option) => (
                <button
                  key={option}
                  onClick={() => handleAnswer(option)}
                  className={`w-full text-left p-4 rounded-lg border transition-all ${
                    answers[question.id] === option
                      ? "border-orange-500 bg-orange-500/10"
                      : "border-[#1F315B]/20 hover:border-orange-500/50"
                  }`}
                >
                  <span className="text-[#1F315B] dark:text-[#F6F1E8]">{option}</span>
                </button>
              ))}
            </div>
          )}

          {question.type === "text" && (
            <Input
              placeholder={question.placeholder}
              value={answers[question.id] || ""}
              onChange={(e) => handleAnswer(e.target.value)}
              className="w-full"
            />
          )}

          {question.type === "number" && (
            <Input
              type="number"
              placeholder={question.placeholder}
              value={answers[question.id] || ""}
              onChange={(e) => handleAnswer(e.target.value)}
              className="w-full"
            />
          )}

          {question.type === "textarea" && (
            <Textarea
              placeholder={question.placeholder}
              value={answers[question.id] || ""}
              onChange={(e) => handleAnswer(e.target.value)}
              className="w-full min-h-[120px]"
            />
          )}

          {question.type === "list" && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder={question.placeholder}
                  value={listInput}
                  onChange={(e) => setListInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAddToList()}
                  className="flex-1"
                />
                <Button onClick={handleAddToList} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {((answers[question.id] as string[]) || []).map((item: string, index: number) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-orange-500/10 text-orange-600 rounded-full text-sm"
                  >
                    {item}
                    <button
                      onClick={() => handleRemoveFromList(index)}
                      className="hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
            >
              {currentQuestion === questions.length - 1 ? "Complete" : "Next"}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
