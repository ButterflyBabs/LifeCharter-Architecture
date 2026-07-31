"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { 
  ArrowLeft, 
  MessageSquare, 
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

const messagingQuestions: Question[] = [
  {
    id: "core-message",
    question: "What is the ONE thing you want people to remember about your business?",
    type: "textarea",
    placeholder: "The single most important message that should stick with your audience...",
    hint: "If they forget everything else, what should they remember?"
  },
  {
    id: "tagline",
    question: "What is your tagline or headline?",
    type: "text",
    placeholder: "e.g., Lose 20 pounds without giving up family dinners",
    hint: "Short, memorable, benefit-focused. Think billboard test."
  },
  {
    id: "brand-voice",
    question: "How would you describe your brand voice?",
    type: "choice",
    options: [
      "Warm and compassionate",
      "Direct and no-nonsense",
      "Professional and authoritative",
      "Playful and energetic",
      "Calm and contemplative",
      "Bold and provocative"
    ]
  },
  {
    id: "talking-points",
    question: "What are your 3-5 key talking points?",
    type: "list",
    placeholder: "Add a key message...",
    hint: "These are the core ideas you repeat across all your content."
  },
  {
    id: "origin-story",
    question: "What is your origin story? Why do you do this work?",
    type: "textarea",
    placeholder: "The journey that led you to this work, the moment you knew this was your calling...",
    hint: "People connect with stories, not just services. What makes your journey relatable?"
  },
  {
    id: "client-transformation",
    question: "Describe a typical client transformation story",
    type: "textarea",
    placeholder: "Where they start, the journey, where they end up...",
    hint: "Before/during/after. Make it concrete and emotional."
  },
  {
    id: "objection-handling",
    question: "How do you address common objections in your messaging?",
    type: "textarea",
    placeholder: "Price concerns, time concerns, skepticism... how do you reframe these?",
    hint: "Anticipate resistance and address it proactively in your content."
  },
  {
    id: "call-to-action",
    question: "What is your primary call-to-action?",
    type: "text",
    placeholder: "e.g., Book a free discovery call, Download the guide, Join the waitlist",
    hint: "What ONE action do you want people to take?"
  }
];

export default function MessagingPage() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [currentList, setCurrentList] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const currentQuestion = messagingQuestions[currentQuestionIndex];
  const progress = ((currentQuestionIndex) / messagingQuestions.length) * 100;

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

    if (currentQuestionIndex < messagingQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setIsComplete(true);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      const previousAnswer = answers.find(a => a.questionId === messagingQuestions[currentQuestionIndex - 1].id);
      if (previousAnswer) {
        if (Array.isArray(previousAnswer.answer)) {
          setCurrentList(previousAnswer.answer);
          setCurrentAnswer("");
        } else {
          setCurrentAnswer(previousAnswer.answer);
          setCurrentList([]);
        }
      }
      setAnswers(prev => prev.filter(a => a.questionId !== messagingQuestions[currentQuestionIndex].id));
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
    alert("Core Messaging saved!");
  };

  if (isComplete) {
    return (
      <div className="py-8 px-4 max-w-4xl mx-auto">
        <Link href="/marketing-plan" className="flex items-center gap-2 text-[#7b6b8d] hover:text-[#1a2b4a] mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Marketing Plan
        </Link>

        <Card className="border-green-500/30">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0] mb-2">
              Core Messaging Complete!
            </h2>
            <p className="text-[#7b6b8d] dark:text-[#e8e4f0] mb-6">
              Your brand voice and key messages are now defined.
            </p>

            <div className="text-left space-y-4 max-w-2xl mx-auto">
              {answers.map((answer, index) => (
                <div key={answer.questionId} className="bg-[#1a2b4a]/5 rounded-lg p-4">
                  <p className="text-sm text-[#b8a898] mb-1">
                    {messagingQuestions[index]?.question}
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
                Save Messaging
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="py-8 px-4 max-w-4xl mx-auto">
      <Link href="/marketing-plan" className="flex items-center gap-2 text-[#7b6b8d] hover:text-[#1a2b4a] mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to Marketing Plan
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-[#c9a227]/20 flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-[#c9a227]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">
              Core Messaging
            </h1>
            <p className="text-[#b8a898]">
              Taglines, talking points, and your brand story
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
          Question {currentQuestionIndex + 1} of {messagingQuestions.length}
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
                {currentQuestionIndex === messagingQuestions.length - 1 ? "Complete" : "Next"}
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
