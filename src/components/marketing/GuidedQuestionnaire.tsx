"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle, ChevronRight, Lightbulb, Loader2, Plus, RefreshCw, Save, Sparkles, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { GUIDE_PAGES, type GuideAnswer, type GuideAnswers, type GuidePage } from "@/lib/marketing/guideQuestions";

type SaveState = "idle" | "saving" | "saved" | "error";

// One guided Marketing Plan questionnaire (Ideal Client, Positioning, …).
// Answers save to the account after every question and on "Save", and the
// page picks up where the client left off.
export function GuidedQuestionnaire({
  page, subtitle, icon, iconBg, completeTitle, completeText, saveLabel, showRunningSummary,
}: {
  page: GuidePage;
  subtitle: string;
  icon: ReactNode;
  iconBg: string;
  completeTitle: string;
  completeText: string;
  saveLabel: string;
  showRunningSummary?: boolean;
}) {
  const { title, questions } = GUIDE_PAGES[page];
  const [loaded, setLoaded] = useState(false);
  const [answers, setAnswers] = useState<GuideAnswers>({});
  const [index, setIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [currentList, setCurrentList] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  const question = questions[index];
  const progress = (index / questions.length) * 100;

  // Show question i with its saved answer filled in.
  const goTo = useCallback(
    (i: number, from: GuideAnswers) => {
      const saved = from[questions[i].id];
      setIndex(i);
      setCurrentList(Array.isArray(saved) ? saved : []);
      setCurrentAnswer(typeof saved === "string" ? saved : "");
      setShowHint(false);
    },
    [questions]
  );

  useEffect(() => {
    (async () => {
      let saved: GuideAnswers = {};
      try {
        const res = await fetch(`/api/marketing-plan/answers?page=${page}`);
        if (res.ok) saved = ((await res.json()).answers as GuideAnswers) || {};
      } catch {
        // Start fresh if answers can't be loaded.
      }
      setAnswers(saved);
      const firstOpen = questions.findIndex((q) => saved[q.id] === undefined);
      if (firstOpen === -1) {
        setIsComplete(true);
        goTo(0, saved);
      } else goTo(firstOpen, saved);
      setLoaded(true);
    })();
  }, [page, questions, goTo]);

  const persist = async (next: GuideAnswers, complete: boolean): Promise<boolean> => {
    setSaveState("saving");
    try {
      const res = await fetch("/api/marketing-plan/answers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page, answers: next, complete }),
      });
      setSaveState(res.ok ? "saved" : "error");
      return res.ok;
    } catch {
      setSaveState("error");
      return false;
    }
  };

  // `value` is passed directly for multiple-choice clicks, so the choice is
  // recorded without waiting for state to update.
  const handleNext = (value?: GuideAnswer) => {
    let answer: GuideAnswer;
    if (value !== undefined) answer = value;
    else if (question.type === "list") {
      if (currentList.length === 0) return;
      answer = currentList;
    } else {
      if (!currentAnswer.trim()) return;
      answer = currentAnswer.trim();
    }
    const next = { ...answers, [question.id]: answer };
    setAnswers(next);
    const last = index === questions.length - 1;
    const complete = questions.every((q) => next[q.id] !== undefined);
    persist(next, complete);
    if (!last) goTo(index + 1, next);
    else setIsComplete(true);
  };

  const handlePrevious = () => {
    if (index > 0) goTo(index - 1, answers);
  };

  const addToList = () => {
    const v = currentAnswer.trim();
    if (v && !currentList.includes(v)) {
      setCurrentList((prev) => [...prev, v]);
      setCurrentAnswer("");
    }
  };

  const saveNote =
    saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : saveState === "error" ? "Couldn't save. Check your connection and try again." : "";

  const back = (
    <Link href="/marketing-plan" className="flex items-center gap-2 text-[#7b6b8d] hover:text-[#1a2b4a] mb-6">
      <ArrowLeft className="w-4 h-4" />
      Back to Marketing Plan
    </Link>
  );

  if (!loaded) {
    return (
      <div className="py-8 px-4 max-w-4xl mx-auto">
        {back}
        <p className="flex items-center gap-2 text-sm text-[#b8a898]">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading your answers…
        </p>
      </div>
    );
  }

  if (isComplete) {
    const allAnswered = questions.every((q) => answers[q.id] !== undefined);
    return (
      <div className="py-8 px-4 max-w-4xl mx-auto">
        {back}
        <Card className="border-green-500/30">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0] mb-2">{completeTitle}</h2>
            <p className="text-[#7b6b8d] dark:text-[#e8e4f0] mb-6">{completeText}</p>

            <div className="text-left space-y-4 max-w-2xl mx-auto">
              {questions
                .filter((q) => answers[q.id] !== undefined)
                .map((q) => {
                  const a = answers[q.id];
                  return (
                    <div key={q.id} className="bg-[#1a2b4a]/5 rounded-lg p-4">
                      <p className="text-sm text-[#b8a898] mb-1">{q.question}</p>
                      {Array.isArray(a) ? (
                        <ul className="list-disc list-inside text-[#1a2b4a] dark:text-[#F8F5F0]">
                          {a.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-[#1a2b4a] dark:text-[#F8F5F0] font-medium whitespace-pre-wrap">{a}</p>
                      )}
                    </div>
                  );
                })}
            </div>

            <div className="flex gap-3 justify-center mt-8">
              <Button
                variant="outline"
                onClick={() => {
                  setIsComplete(false);
                  setSaveState("idle");
                  goTo(0, answers);
                }}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Edit Answers
              </Button>
              <Button onClick={() => persist(answers, allAnswered)} disabled={saveState === "saving"}>
                {saveState === "saved" ? <CheckCircle className="w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                {saveState === "saved" ? "Saved" : saveLabel}
              </Button>
            </div>
            <p className={`mt-3 text-sm ${saveState === "error" ? "text-red-600" : "text-[#b8a898]"}`} role="status">
              {saveState === "error" ? saveNote : saveState === "saved" ? "Your answers are saved to your account." : ""}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const answeredSoFar = questions.filter((q) => answers[q.id] !== undefined);

  return (
    <div className="py-8 px-4 max-w-4xl mx-auto">
      {back}

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-12 h-12 rounded-full ${iconBg} flex items-center justify-center`}>{icon}</div>
          <div>
            <h1 className="text-2xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">{title}</h1>
            <p className="text-[#b8a898]">{subtitle}</p>
          </div>
        </div>

        <div className="w-full bg-[#1a2b4a]/10 rounded-full h-2">
          <div className="bg-[#c9a227] h-2 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex justify-between gap-3 mt-1 text-xs text-[#b8a898]">
          <span>
            Question {index + 1} of {questions.length}
          </span>
          <span role="status" className={saveState === "error" ? "text-red-600" : ""}>
            {saveNote || "Your answers save each time you press Next."}
          </span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#c9a227]" />
            <CardTitle className="text-lg text-[#1a2b4a] dark:text-[#F8F5F0]">{question.question}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {question.type === "choice" ? (
            <div className="space-y-2">
              {question.options?.map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    setCurrentAnswer(option);
                    handleNext(option);
                  }}
                  className={`w-full p-4 text-left rounded-lg border transition-all ${
                    currentAnswer === option ? "border-[#c9a227] bg-[#c9a227]/10" : "border-[#1a2b4a]/10 hover:border-[#c9a227]/50"
                  }`}
                >
                  <span className="text-[#1a2b4a] dark:text-[#F8F5F0]">{option}</span>
                </button>
              ))}
            </div>
          ) : question.type === "list" ? (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  placeholder={question.placeholder}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addToList();
                    }
                  }}
                />
                <Button onClick={addToList} variant="outline" aria-label="Add to list">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {currentList.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {currentList.map((item, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-[#c9a227]/20 text-[#1a2b4a] dark:text-[#F8F5F0] rounded-full text-sm"
                    >
                      {item}
                      <button onClick={() => setCurrentList((prev) => prev.filter((x) => x !== item))} className="hover:text-red-500" aria-label={`Remove ${item}`}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <p className="text-sm text-[#b8a898]">{currentList.length} items added</p>
            </div>
          ) : question.type === "textarea" ? (
            <Textarea value={currentAnswer} onChange={(e) => setCurrentAnswer(e.target.value)} placeholder={question.placeholder} className="min-h-[120px]" />
          ) : (
            <Input value={currentAnswer} onChange={(e) => setCurrentAnswer(e.target.value)} placeholder={question.placeholder} />
          )}

          {question.hint && (
            <button onClick={() => setShowHint(!showHint)} className="flex items-center gap-2 text-sm text-[#c9a227] hover:underline">
              <Lightbulb className="w-4 h-4" />
              {showHint ? "Hide hint" : "Need a hint?"}
            </button>
          )}

          {showHint && question.hint && <p className="text-sm text-[#b8a898] italic bg-[#1a2b4a]/5 p-3 rounded-lg">💡 {question.hint}</p>}

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={handlePrevious} disabled={index === 0}>
              Previous
            </Button>
            {question.type !== "choice" && (
              <Button
                onClick={() => handleNext()}
                disabled={question.type === "list" ? currentList.length === 0 : !currentAnswer.trim()}
              >
                {index === questions.length - 1 ? "Complete" : "Next"}
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {showRunningSummary && answeredSoFar.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-sm text-[#b8a898]">Your Answers So Far</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {answeredSoFar.map((q, i) => {
                const a = answers[q.id];
                return (
                  <div key={q.id} className="flex items-start gap-3 text-sm">
                    <span className="w-5 h-5 rounded-full bg-[#c9a227]/20 text-[#c9a227] flex items-center justify-center text-xs flex-shrink-0">{i + 1}</span>
                    <p className="text-[#7b6b8d] dark:text-[#e8e4f0] line-clamp-2">{Array.isArray(a) ? a.join(", ") : a}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
