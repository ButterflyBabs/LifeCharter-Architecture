"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { 
  ArrowLeft, 
  FileText, 
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

const contentQuestions: Question[] = [
  {
    id: "content-pillars",
    question: "What are your 3 core content pillars?",
    type: "list",
    placeholder: "e.g., Mindset shifts, Practical strategies, Client success stories...",
    hint: "These 3 topics will be the foundation of everything you create."
  },
  {
    id: "content-formats",
    question: "What content formats will you create?",
    type: "list",
    placeholder: "e.g., Carousel posts, Reels, Long-form articles, Live videos...",
    hint: "Choose formats that match your strengths and your audience's preferences."
  },
  {
    id: "content-strength",
    question: "What type of content do you naturally create best?",
    type: "choice",
    options: [
      "Writing/articles",
      "Short-form video (Reels/TikTok)",
      "Long-form video (YouTube)",
      "Audio/podcasts",
      "Visuals/graphics",
      "Live streaming"
    ]
  },
  {
    id: "batch-creation",
    question: "Will you batch-create content or create in real-time?",
    type: "choice",
    options: [
      "Batch create weekly",
      "Batch create monthly",
      "Create in real-time",
      "Mix of both"
    ]
  },
  {
    id: "content-calendar",
    question: "What does your ideal content calendar look like?",
    type: "textarea",
    placeholder: "Monday: Educational post, Wednesday: Client story, Friday: Call-to-action...",
    hint: "Having a repeatable structure makes creation easier."
  },
  {
    id: "repurposing",
    question: "How will you repurpose content across channels?",
    type: "textarea",
    placeholder: "e.g., Blog post becomes email, social posts, and video script...",
    hint: "One piece of core content can become 5-10 pieces across channels."
  },
  {
    id: "content-tools",
    question: "What tools will you use for content creation?",
    type: "list",
    placeholder: "e.g., Canva, CapCut, Notion, ChatGPT...",
    hint: "Keep your tech stack simple. Master a few tools rather than juggling many."
  },
  {
    id: "content-struggles",
    question: "What do you anticipate being your biggest content challenge?",
    type: "choice",
    options: [
      "Coming up with ideas",
      "Finding time to create",
      "Staying consistent",
      "Creating quality content",
      "Getting engagement",
      "Converting viewers to leads"
    ]
  },
  {
    id: "content-goals",
    question: "What are your 90-day content goals?",
    type: "list",
    placeholder: "e.g., Post 3x per week, grow email list by 100, get first 5 leads...",
    hint: "Be specific and realistic. What would success look like in 90 days?"
  }
];

export default function ContentPage() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [currentList, setCurrentList] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const currentQuestion = contentQuestions[currentQuestionIndex];
  const progress = ((currentQuestionIndex) / contentQuestions.length) * 100;

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

    if (currentQuestionIndex < contentQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setIsComplete(true);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      const previousAnswer = answers.find(a => a.questionId === contentQuestions[currentQuestionIndex - 1].id);
      if (previousAnswer) {
        if (Array.isArray(previousAnswer.answer)) {
          setCurrentList(previousAnswer.answer);
          setCurrentAnswer("");
        } else {
          setCurrentAnswer(previousAnswer.answer);
          setCurrentList([]);
        }
      }
      setAnswers(prev => prev.filter(a => a.questionId !== contentQuestions[currentQuestionIndex].id));
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
    alert("Content Strategy saved!");
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
              Content Strategy Complete!
            </h2>
            <p className="text-[#7b6b8d] dark:text-[#e8e4f0] mb-6">
              Your content pillars and creation plan are now defined.
            </p>

            <div className="text-left space-y-4 max-w-2xl mx-auto">
              {answers.map((answer, index) => (
                <div key={answer.questionId} className="bg-[#1a2b4a]/5 rounded-lg p-4">
                  <p className="text-sm text-[#b8a898] mb-1">
                    {contentQuestions[index]?.question}
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
                Save Strategy
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
          <div className="w-12 h-12 rounded-full bg-[#4a9b9b]/20 flex items-center justify-center">
            <FileText className="w-6 h-6 text-[#4a9b9b]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">
              Content Strategy
            </h1>
            <p className="text-[#b8a898]">
              What you&apos;ll create and your content pillars
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
          Question {currentQuestionIndex + 1} of {contentQuestions.length}
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
                {currentQuestionIndex === contentQuestions.length - 1 ? "Complete" : "Next"}
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
