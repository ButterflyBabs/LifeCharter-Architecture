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
  RefreshCw,
  Plus,
  X
} from "lucide-react";
import Link from "next/link";

interface Question {
  id: string;
  question: string;
  type: "text" | "textarea" | "choice" | "list" | "number";
  placeholder?: string;
  hint?: string;
  options?: string[];
}

interface Answer {
  questionId: string;
  answer: string | string[];
}

const pipelineQuestions: Question[] = [
  {
    id: "stages",
    question: "What are the stages of your sales pipeline?",
    type: "list",
    placeholder: "e.g., New Lead, Qualified, Proposal Sent, Negotiation, Closed Won...",
    hint: "Map the journey from first contact to closed deal. Most pipelines have 5-7 stages."
  },
  {
    id: "qualification-criteria",
    question: "How do you qualify a lead to move them forward?",
    type: "textarea",
    placeholder: "Budget, authority, need, timeline (BANT) or other criteria you use...",
    hint: "Having clear criteria prevents wasting time on unqualified prospects."
  },
  {
    id: "conversion-rates",
    question: "What are your approximate conversion rates between stages?",
    type: "textarea",
    placeholder: "e.g., Lead to Qualified: 30%, Qualified to Proposal: 50%, Proposal to Close: 40%...",
    hint: "Knowing these helps you forecast and identify where leads get stuck."
  },
  {
    id: "average-deal-size",
    question: "What is your average deal size?",
    type: "text",
    placeholder: "e.g., $2,500, $10,000, $50,000...",
    hint: "This helps you understand how many deals you need to hit revenue goals."
  },
  {
    id: "sales-cycle",
    question: "How long is your typical sales cycle?",
    type: "choice",
    options: [
      "Less than 1 week",
      "1-2 weeks",
      "2-4 weeks",
      "1-2 months",
      "3-6 months",
      "6+ months"
    ]
  },
  {
    id: "pipeline-goal",
    question: "How many active opportunities do you need in your pipeline?",
    type: "text",
    placeholder: "e.g., 10-15 active prospects at any given time...",
    hint: "Based on your conversion rates, how many leads do you need to hit your goals?"
  },
  {
    id: "lead-sources",
    question: "Where do your best leads come from?",
    type: "list",
    placeholder: "e.g., Referrals, LinkedIn, Website, Events, Partnerships...",
    hint: "Track this to double down on what works."
  },
  {
    id: "stuck-stage",
    question: "Where do most prospects get stuck in your pipeline?",
    type: "text",
    placeholder: "e.g., After the first call, during pricing discussions...",
    hint: "Identifying bottlenecks helps you fix the biggest leaks."
  }
];

export default function PipelinePage() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [currentList, setCurrentList] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const currentQuestion = pipelineQuestions[currentQuestionIndex];
  const progress = ((currentQuestionIndex) / pipelineQuestions.length) * 100;

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

    if (currentQuestionIndex < pipelineQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setIsComplete(true);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      const previousAnswer = answers.find(a => a.questionId === pipelineQuestions[currentQuestionIndex - 1].id);
      if (previousAnswer) {
        if (Array.isArray(previousAnswer.answer)) {
          setCurrentList(previousAnswer.answer);
          setCurrentAnswer("");
        } else {
          setCurrentAnswer(previousAnswer.answer);
          setCurrentList([]);
        }
      }
      setAnswers(prev => prev.filter(a => a.questionId !== pipelineQuestions[currentQuestionIndex].id));
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
    alert("Sales Pipeline saved!");
  };

  if (isComplete) {
    return (
      <div className="py-8 px-4 max-w-4xl mx-auto">
        <Link href="/sales" className="flex items-center gap-2 text-[#7b6b8d] hover:text-[#1a2b4a] mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Sales System
        </Link>

        <Card className="border-green-500/30">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0] mb-2">
              Sales Pipeline Complete!
            </h2>
            <p className="text-[#7b6b8d] dark:text-[#e8e4f0] mb-6">
              Your pipeline stages and conversion metrics are now defined.
            </p>

            <div className="text-left space-y-4 max-w-2xl mx-auto">
              {answers.map((answer, index) => (
                <div key={answer.questionId} className="bg-[#1a2b4a]/5 rounded-lg p-4">
                  <p className="text-sm text-[#b8a898] mb-1">
                    {pipelineQuestions[index]?.question}
                  </p>
                  {Array.isArray(answer.answer) ? (
                    <ul className="list-disc list-inside text-[#1a2b4a] dark:text-[#F8F5F0]">
                      {answer.answer.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[#1a2b4a] dark:text-[#F8F5F0] font-medium">
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
                Save Pipeline
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="py-8 px-4 max-w-4xl mx-auto">
      <Link href="/sales" className="flex items-center gap-2 text-[#7b6b8d] hover:text-[#1a2b4a] mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to Sales System
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-[#7b6b8d]/20 flex items-center justify-center">
            <Target className="w-6 h-6 text-[#7b6b8d]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">
              Sales Pipeline
            </h1>
            <p className="text-[#b8a898]">
              Stages from lead to closed deal
            </p>
          </div>
        </div>

        <div className="w-full bg-[#1a2b4a]/10 rounded-full h-2">
          <div 
            className="bg-[#c9a227] h-2 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-[#b8a898] mt-1">
          Question {currentQuestionIndex + 1} of {pipelineQuestions.length}
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#c9a227]" />
            <CardTitle className="text-lg text-[#1a2b4a] dark:text-[#F8F5F0]">
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
                      ? "border-[#c9a227] bg-[#c9a227]/10"
                      : "border-[#1a2b4a]/10 hover:border-[#c9a227]/50"
                  }`}
                >
                  <span className="text-[#1a2b4a] dark:text-[#F8F5F0]">{option}</span>
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
                      className="inline-flex items-center gap-1 px-3 py-1 bg-[#c9a227]/20 text-[#1a2b4a] dark:text-[#F8F5F0] rounded-full text-sm"
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
              
              <p className="text-sm text-[#b8a898]">
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
              className="flex items-center gap-2 text-sm text-[#c9a227] hover:underline"
            >
              <Lightbulb className="w-4 h-4" />
              {showHint ? "Hide hint" : "Need a hint?"}
            </button>
          )}

          {showHint && currentQuestion.hint && (
            <p className="text-sm text-[#b8a898] italic bg-[#1a2b4a]/5 p-3 rounded-lg">
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
                {currentQuestionIndex === pipelineQuestions.length - 1 ? "Complete" : "Next"}
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
