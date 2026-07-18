"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import {
  ArrowLeft,
  Heart,
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
    id: "core_values",
    question: "What are your company's core values?",
    type: "list",
    placeholder: "e.g., Integrity, Innovation, Customer First",
    hint: "The principles that guide decisions and behavior in your business"
  },
  {
    id: "team_size",
    question: "How many people are on your team?",
    type: "choice",
    options: [
      "Just me (solopreneur)",
      "2-5 people",
      "6-15 people",
      "16-50 people",
      "More than 50 people"
    ],
    hint: "Include employees, contractors, and regular collaborators"
  },
  {
    id: "sops_documented",
    question: "What percentage of your processes have written SOPs?",
    type: "choice",
    options: [
      "90-100% - Everything is documented",
      "50-90% - Most key processes",
      "25-50% - Some processes",
      "10-25% - A few documented",
      "Less than 10% - Mostly undocumented",
      "0% - Nothing formal"
    ],
    hint: "Standard Operating Procedures that someone else could follow"
  },
  {
    id: "critical_sops",
    question: "Which processes are most critical to document?",
    type: "list",
    placeholder: "e.g., Client onboarding, Content creation, Invoicing",
    hint: "What would break or be inconsistent if you weren't personally handling it?"
  },
  {
    id: "communication_tools",
    question: "What tools does your team use for communication?",
    type: "list",
    placeholder: "e.g., Slack, Email, Notion, Zoom",
    hint: "How does information flow between team members?"
  },
  {
    id: "meeting_rhythm",
    question: "What is your team's meeting rhythm?",
    type: "choice",
    options: [
      "Daily standups + weekly reviews",
      "Weekly team meetings only",
      "Bi-weekly or monthly meetings",
      "Ad-hoc as needed",
      "No regular meetings"
    ],
    hint: "How often does the team sync on priorities and progress?"
  },
  {
    id: "culture_description",
    question: "How would you describe your company culture in three words?",
    type: "text",
    placeholder: "e.g., Collaborative, Fast-paced, Purpose-driven",
    hint: "What does it feel like to work with/in your business?"
  },
  {
    id: "team_challenges",
    question: "What are your biggest team/operational challenges?",
    type: "textarea",
    placeholder: "Describe communication gaps, workflow issues, or cultural concerns...",
    hint: "Where does friction show up in how work gets done?"
  },
  {
    id: "delegation_comfort",
    question: "How comfortable are you with delegation?",
    type: "choice",
    options: [
      "Very - I delegate most tasks confidently",
      "Somewhat - I delegate but check in frequently",
      "Working on it - I want to delegate more",
      "Not very - I prefer to do things myself",
      "Struggle - I have trouble letting go"
    ],
    hint: "Your willingness and ability to hand off responsibility to others"
  }
];

export default function InternalCulturePage() {
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
            Internal Culture Assessment Complete!
          </h2>
          <p className="text-[#B9A9A9] mb-6">
            Your operational foundation insights have been saved.
          </p>

          <div className="text-left bg-[#1F315B]/5 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-[#1F315B] dark:text-[#F6F1E8] mb-4">Summary</h3>
            <div className="space-y-2 text-sm">
              <p><span className="text-[#B9A9A9]">Core Values:</span> {Array.isArray(answers.core_values) ? answers.core_values.join(", ") : answers.core_values}</p>
              <p><span className="text-[#B9A9A9]">Team Size:</span> {answers.team_size}</p>
              <p><span className="text-[#B9A9A9]">SOPs Documented:</span> {answers.sops_documented}</p>
              <p><span className="text-[#B9A9A9]">Culture:</span> {answers.culture_description}</p>
              <p><span className="text-[#B9A9A9]">Delegation:</span> {answers.delegation_comfort}</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#1F315B] to-[#5E3B6C] text-[#F6F1E8] rounded-lg p-6 mb-6">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#D4AF63]" />
              AI Recommendations for Operations
            </h3>
            <ul className="text-sm text-left space-y-2 text-[#CDBED6]">
              <li>• Prioritize documenting your top 3 critical SOPs first</li>
              <li>• Create a simple team handbook with values and key processes</li>
              <li>• Establish a weekly rhythm: planning, execution, review</li>
              <li>• Build a delegation framework: what only you can do vs. what to hand off</li>
              <li>• Schedule monthly culture check-ins with your team</li>
            </ul>
          </div>

          <div className="flex gap-3 justify-center">
            <Link href="/operations">
              <Button variant="outline">Back to Operations</Button>
            </Link>
            <Link href="/operations/referral">
              <Button>Continue to Referral Process</Button>
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
          <div className="w-10 h-10 rounded-full bg-[#5E3B6C]/20 flex items-center justify-center">
            <Heart className="w-5 h-5 text-[#5E3B6C]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#1F315B] dark:text-[#F6F1E8]">
              Internal Process & Culture
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
            className="bg-[#5E3B6C] h-2 rounded-full transition-all"
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
                      ? "border-[#5E3B6C] bg-[#5E3B6C]/10"
                      : "border-[#1F315B]/20 hover:border-[#5E3B6C]/50"
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
                    className="inline-flex items-center gap-1 px-3 py-1 bg-[#5E3B6C]/10 text-[#5E3B6C] rounded-full text-sm"
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
