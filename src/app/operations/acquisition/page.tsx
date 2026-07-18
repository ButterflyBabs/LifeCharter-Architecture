"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import {
  ArrowLeft,
  Users,
  Target,
  TrendingUp,
  DollarSign,
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
    id: "primary_channels",
    question: "What are your primary customer acquisition channels?",
    type: "list",
    placeholder: "e.g., Instagram, LinkedIn, Referrals, Paid Ads",
    hint: "List all channels that currently bring you leads or customers"
  },
  {
    id: "channel_effectiveness",
    question: "Which channel is currently most effective for you?",
    type: "choice",
    options: [
      "Organic Social Media",
      "Paid Advertising",
      "Content Marketing / SEO",
      "Referrals / Word of Mouth",
      "Partnerships / Affiliates",
      "Email Marketing",
      "Events / Speaking",
      "Direct Outreach",
      "Not sure / Need to track better"
    ],
    hint: "Consider both volume of leads AND quality of conversions"
  },
  {
    id: "monthly_leads",
    question: "How many leads do you generate per month on average?",
    type: "number",
    placeholder: "e.g., 50",
    hint: "A lead is anyone who expresses interest in your offer"
  },
  {
    id: "lead_to_customer",
    question: "What percentage of leads become paying customers?",
    type: "choice",
    options: [
      "Less than 5%",
      "5-10%",
      "10-20%",
      "20-30%",
      "30-50%",
      "More than 50%",
      "Not tracked"
    ],
    hint: "This is your lead-to-customer conversion rate"
  },
  {
    id: "customer_acquisition_cost",
    question: "Do you know your Customer Acquisition Cost (CAC)?",
    type: "choice",
    options: [
      "Yes, tracked precisely",
      "Yes, estimated range",
      "No, but I want to track it",
      "No, doesn't apply to my model"
    ],
    hint: "CAC = Total marketing & sales costs / Number of new customers"
  },
  {
    id: "cac_amount",
    question: "What is your estimated Customer Acquisition Cost?",
    type: "text",
    placeholder: "e.g., $150 per customer",
    hint: "Include all marketing spend, tools, and time invested"
  },
  {
    id: "acquisition_challenges",
    question: "What are your biggest customer acquisition challenges?",
    type: "textarea",
    placeholder: "Describe your main obstacles...",
    hint: "Be specific: not enough leads? Poor quality? High cost? Low conversion?"
  }
];

export default function AcquisitionPage() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [showHint, setShowHint] = useState(false);
  const [listInput, setListInput] = useState("");
  const [isComplete, setIsComplete] = useState(false);

  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  const handleAnswer = (value: any) => {
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
    const current = answers[question.id] || [];
    handleAnswer([...current, listInput.trim()]);
    setListInput("");
  };

  const handleRemoveFromList = (index: number) => {
    const current = answers[question.id] || [];
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
            Section Complete!
          </h2>
          <p className="text-[#B9A9A9] mb-6">
            Your customer acquisition insights have been saved. Here&apos;s what we learned:
          </p>

          <div className="text-left bg-[#1F315B]/5 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-[#1F315B] dark:text-[#F6F1E8] mb-4">Summary</h3>
            <div className="space-y-2 text-sm">
              <p><span className="text-[#B9A9A9]">Primary Channels:</span> {answers.primary_channels?.join(", ")}</p>
              <p><span className="text-[#B9A9A9]">Most Effective:</span> {answers.channel_effectiveness}</p>
              <p><span className="text-[#B9A9A9]">Monthly Leads:</span> {answers.monthly_leads}</p>
              <p><span className="text-[#B9A9A9]">Conversion Rate:</span> {answers.lead_to_customer}</p>
              <p><span className="text-[#B9A9A9]">CAC Tracking:</span> {answers.customer_acquisition_cost}</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#1F315B] to-[#5E3B6C] text-[#F6F1E8] rounded-lg p-6 mb-6">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#D4AF63]" />
              AI Recommendations
            </h3>
            <ul className="text-sm text-left space-y-2 text-[#CDBED6]">
              <li>• Focus 70% of effort on your top 2 performing channels</li>
              <li>• Implement lead scoring to improve conversion rates</li>
              <li>• Set up UTM tracking to measure true CAC by channel</li>
              <li>• Create a referral incentive to lower acquisition costs</li>
            </ul>
          </div>

          <div className="flex gap-3 justify-center">
            <Link href="/operations">
              <Button variant="outline">Back to Operations</Button>
            </Link>
            <Link href="/operations/sales-journey">
              <Button>Continue to Sales Journey</Button>
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
          <div className="w-10 h-10 rounded-full bg-[#2E7C83]/20 flex items-center justify-center">
            <Users className="w-5 h-5 text-[#2E7C83]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#1F315B] dark:text-[#F6F1E8]">
              Customer Acquisition
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
            className="bg-[#2E7C83] h-2 rounded-full transition-all"
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
                      ? "border-[#2E7C83] bg-[#2E7C83]/10"
                      : "border-[#1F315B]/20 hover:border-[#2E7C83]/50"
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
                {(answers[question.id] || []).map((item: string, index: number) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-[#2E7C83]/10 text-[#2E7C83] rounded-full text-sm"
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
