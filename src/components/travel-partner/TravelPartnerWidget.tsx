"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  Compass,
  MapPin,
  CheckCircle2,
  Circle,
  ChevronRight,
  ChevronUp,
  X,
  Sparkles,
  Target,
  TrendingUp,
  Calendar,
  FileText,
  Users,
  BarChart3,
  Share2,
  Phone,
  MessageSquare,
  Lightbulb,
  Award,
  Flag,
  GripVertical,
  Map,
  Send,
  Loader2,
  LifeBuoy,
  ExternalLink
} from "lucide-react";
import Link from "next/link";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  section: "business" | "daily";
  estimatedTime: number;
  completed: boolean;
}

interface JourneyStage {
  id: string;
  name: string;
  description: string;
  steps: OnboardingStep[];
}

const journeyStages: JourneyStage[] = [
  {
    id: "foundation",
    name: "Foundation",
    description: "Set up your business core",
    steps: [
      {
        id: "domain-assessment",
        title: "Complete Domain Assessment",
        description: "Rate your 12 business domains to establish your baseline",
        icon: <BarChart3 className="w-5 h-5" />,
        path: "/assessments",
        section: "business",
        estimatedTime: 15,
        completed: false
      },
      {
        id: "business-plan",
        title: "Create Business Plan",
        description: "Define your vision, goals, and strategic priorities",
        icon: <FileText className="w-5 h-5" />,
        path: "/business-plan",
        section: "business",
        estimatedTime: 30,
        completed: false
      },
      {
        id: "marketing-plan",
        title: "Build Marketing Plan",
        description: "Clarify your positioning, ideal client, and messaging",
        icon: <Share2 className="w-5 h-5" />,
        path: "/marketing-plan",
        section: "business",
        estimatedTime: 25,
        completed: false
      }
    ]
  },
  {
    id: "systems",
    name: "Systems",
    description: "Set up your operational infrastructure",
    steps: [
      {
        id: "sales-system",
        title: "Configure Sales System",
        description: "Set up your pipeline, offers, and sales process",
        icon: <Target className="w-5 h-5" />,
        path: "/sales",
        section: "business",
        estimatedTime: 20,
        completed: false
      },
      {
        id: "finance-setup",
        title: "Connect Finance Suite",
        description: "Link your accounts and set up expense tracking",
        icon: <TrendingUp className="w-5 h-5" />,
        path: "/finance",
        section: "business",
        estimatedTime: 15,
        completed: false
      },
      {
        id: "operations",
        title: "Map Operations",
        description: "Define your customer journey and operational pillars",
        icon: <MapPin className="w-5 h-5" />,
        path: "/operations",
        section: "business",
        estimatedTime: 25,
        completed: false
      }
    ]
  },
  {
    id: "daily",
    name: "Daily Practice",
    description: "Establish your daily execution rhythm",
    steps: [
      {
        id: "daily-compass",
        title: "Set Up Daily Compass",
        description: "Configure your daily focus and activity tracking",
        icon: <Compass className="w-5 h-5" />,
        path: "/daily-compass",
        section: "daily",
        estimatedTime: 10,
        completed: false
      },
      {
        id: "content-studio",
        title: "Create First Content",
        description: "Use AI to create your first social post or email",
        icon: <MessageSquare className="w-5 h-5" />,
        path: "/daily-compass/content-studio",
        section: "daily",
        estimatedTime: 15,
        completed: false
      },
      {
        id: "scripts",
        title: "Save Key Scripts",
        description: "Create or generate scripts for common conversations",
        icon: <Phone className="w-5 h-5" />,
        path: "/daily-compass/scripts",
        section: "daily",
        estimatedTime: 20,
        completed: false
      }
    ]
  },
  {
    id: "growth",
    name: "Growth",
    description: "Optimize and scale",
    steps: [
      {
        id: "reviews",
        title: "Set Up Reviews",
        description: "Configure testimonial collection system",
        icon: <Users className="w-5 h-5" />,
        path: "/reviews",
        section: "business",
        estimatedTime: 10,
        completed: false
      },
      {
        id: "ai-guide",
        title: "Configure AI Guide",
        description: "Set up your AI assistant preferences and API keys",
        icon: <Sparkles className="w-5 h-5" />,
        path: "/ai-guide",
        section: "business",
        estimatedTime: 10,
        completed: false
      },
      {
        id: "integrations",
        title: "Connect Integrations",
        description: "Link your favorite tools and platforms",
        icon: <Calendar className="w-5 h-5" />,
        path: "/settings",
        section: "business",
        estimatedTime: 15,
        completed: false
      }
    ]
  }
];

export default function TravelPartnerWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStage, setCurrentStage] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);

  // Live setup progress (foundation: 3 assessments + AI), from the same source
  // the /setup wizard uses — so the widget reflects real status.
  const [setupStatus, setSetupStatus] = useState<{ done: number; total: number; complete: boolean } | null>(null);
  useEffect(() => {
    fetch("/api/setup/status")
      .then((r) => r.json())
      .then((d) => {
        if (!d) return;
        const a = d.assessments || {};
        const done = [a.brain, a.soul, a.profit, d.ai?.connected].filter(Boolean).length;
        setSetupStatus({ done, total: 4, complete: Boolean(d.requiredComplete) });
      })
      .catch(() => {});
  }, []);

  // Ask mode — answers questions from the LifeCharter knowledge base.
  const [mode, setMode] = useState<"journey" | "ask">("journey");
  const [askInput, setAskInput] = useState("");
  const [askLoading, setAskLoading] = useState(false);
  const [askMessages, setAskMessages] = useState<
    { role: "user" | "guide"; text: string; escalate?: boolean }[]
  >([]);
  const askEndRef = useRef<HTMLDivElement>(null);

  const suggestedQuestions = [
    "How do Quick Wins work?",
    "Can I export financial reports?",
    "What are the 8 operational pillars?",
    "How does tax prep calculate quarterly taxes?",
  ];

  const askQuestion = async (q: string) => {
    const question = q.trim();
    if (!question || askLoading) return;
    setAskMessages((prev) => [...prev, { role: "user", text: question }]);
    setAskInput("");
    setAskLoading(true);
    try {
      const res = await fetch("/api/travel-partner/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const d = await res.json().catch(() => ({}));
      setAskMessages((prev) => [
        ...prev,
        {
          role: "guide",
          text: d.answer || "I couldn't find an answer for that.",
          escalate: Boolean(d.escalate),
        },
      ]);
    } catch {
      setAskMessages((prev) => [
        ...prev,
        { role: "guide", text: "I couldn't reach the assistant just now — try again in a moment.", escalate: true },
      ]);
    } finally {
      setAskLoading(false);
      setTimeout(() => askEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  };

  // Simple draggable state
  const [pos, setPos] = useState<{x: number, y: number} | null>(null);
  const [dragging, setDragging] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const dragStartMousePos = useRef({ x: 0, y: 0 });
  const widgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("travelPartnerCompleted");
    if (saved) setCompletedSteps(JSON.parse(saved));
    
    const savedPos = localStorage.getItem("travelPartnerPos");
    if (savedPos) setPos(JSON.parse(savedPos));
  }, []);

  // Global mouse handlers for dragging
  useEffect(() => {
    if (!dragging) return;
    
    const onMove = (e: MouseEvent) => {
      const newX = e.clientX - dragStartPos.current.x;
      const newY = e.clientY - dragStartPos.current.y;
      
      // Check if user actually dragged (moved more than 5 pixels)
      const moveDistance = Math.sqrt(
        Math.pow(e.clientX - dragStartMousePos.current.x, 2) +
        Math.pow(e.clientY - dragStartMousePos.current.y, 2)
      );
      
      if (moveDistance > 5) {
        setHasDragged(true);
      }
      
      // Allow dragging anywhere on screen, even partially off-screen
      setPos({ x: newX, y: newY });
    };
    
    const onUp = () => {
      setDragging(false);
      if (pos) localStorage.setItem("travelPartnerPos", JSON.stringify(pos));
      // Reset hasDragged after a short delay so click can check it
      setTimeout(() => setHasDragged(false), 50);
    };
    
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    document.body.style.userSelect = "none";
    
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.body.style.userSelect = "";
    };
  }, [dragging, pos]);

  const startDrag = (e: React.MouseEvent) => {
    // Only drag if clicking the header/grip area
    const target = e.target as HTMLElement;
    if (!target.closest("[data-drag]")) return;
    
    setDragging(true);
    setHasDragged(false);
    dragStartMousePos.current = { x: e.clientX, y: e.clientY };
    const rect = widgetRef.current?.getBoundingClientRect();
    if (rect) {
      dragStartPos.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
    e.preventDefault();
    e.stopPropagation();
  };

  const resetPos = () => {
    setPos(null);
    localStorage.removeItem("travelPartnerPos");
  };

  const toggleStep = (stepId: string) => {
    const newCompleted = completedSteps.includes(stepId)
      ? completedSteps.filter(id => id !== stepId)
      : [...completedSteps, stepId];
    
    setCompletedSteps(newCompleted);
    localStorage.setItem("travelPartnerCompleted", JSON.stringify(newCompleted));
    
    const totalSteps = journeyStages.reduce((acc, stage) => acc + stage.steps.length, 0);
    if (newCompleted.length === totalSteps) setShowCelebration(true);
  };

  const getProgress = () => {
    const totalSteps = journeyStages.reduce((acc, stage) => acc + stage.steps.length, 0);
    return Math.round((completedSteps.length / totalSteps) * 100);
  };

  const getCurrentStep = () => {
    for (const stage of journeyStages) {
      for (const step of stage.steps) {
        if (!completedSteps.includes(step.id)) return step;
      }
    }
    return null;
  };

  const currentStep = getCurrentStep();
  const progress = getProgress();

  const getStyle = (): React.CSSProperties => {
    if (!pos) return { position: "fixed", bottom: 16, right: 16, zIndex: 9999 };
    return { position: "fixed", left: pos.x, top: pos.y, zIndex: 9999 };
  };

  if (showCelebration) {
    return (
      <div ref={widgetRef} style={getStyle()}>
        <Card className="w-80 bg-gradient-to-br from-[#1a2b4a] to-[#7b6b8d] text-[#F8F5F0]">
          <CardContent className="p-6 text-center">
            <Award className="w-12 h-12 text-[#c9a227] mx-auto mb-3" />
            <h3 className="font-bold text-lg mb-2">Journey Complete!</h3>
            <p className="text-sm text-[#e8e4f0] mb-4">
              You have set up your LifeCharter Architecture!
            </p>
            <Button onClick={() => setShowCelebration(false)} className="bg-[#c9a227] text-[#1a2b4a]">
              Continue
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isOpen) {
    return (
      <div
        ref={widgetRef}
        style={getStyle()}
        className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-[#1a2b4a] to-[#7b6b8d] text-[#F8F5F0] rounded-full shadow-lg hover:scale-105 transition-transform cursor-move"
        onMouseDown={startDrag}
        onClick={() => {
          // Only open if user didn't drag
          if (!hasDragged) setIsOpen(true);
        }}
      >
        <GripVertical data-drag className="w-5 h-5 text-[#e8e4f0] opacity-60 cursor-grab active:cursor-grabbing" />
        <Compass className="w-5 h-5 text-[#c9a227]" />
        <span className="font-medium">Travel Partner</span>
        {progress > 0 && (
          <span className="ml-2 text-xs bg-[#c9a227] text-[#1a2b4a] px-2 py-0.5 rounded-full">{progress}%</span>
        )}
      </div>
    );
  }

  return (
    <div ref={widgetRef} style={getStyle()}>
      <Card className={`w-96 max-h-[80vh] overflow-hidden flex flex-col shadow-2xl ${dragging ? "cursor-grabbing" : ""}`}>
        {/* Draggable Header */}
        <div 
          data-drag
          onMouseDown={startDrag}
          className="bg-gradient-to-r from-[#1a2b4a] to-[#7b6b8d] text-[#F8F5F0] p-4 cursor-move select-none"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GripVertical data-drag className="w-5 h-5 text-[#e8e4f0] opacity-60" />
              <CardTitle className="text-lg flex items-center gap-2">
                <Compass className="w-5 h-5 text-[#c9a227]" />
                Travel Partner
              </CardTitle>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={resetPos} className="p-1.5 hover:bg-[#F8F5F0]/10 rounded text-xs text-[#e8e4f0]">
                Reset
              </button>
              <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-[#F8F5F0]/10 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <p className="text-sm text-[#e8e4f0] mt-1">
            {mode === "journey" ? "Your guide to setting up LifeCharter Architecture" : "Ask me anything about LifeCharter"}
          </p>

          {mode === "journey" && (
            <div className="mt-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#e8e4f0]">Progress</span>
                <span className="text-[#c9a227] font-medium">{progress}%</span>
              </div>
              <div className="w-full bg-[#F8F5F0]/20 rounded-full h-2">
                <div className="bg-gradient-to-r from-[#4a9b9b] to-[#c9a227] h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {/* Mode tabs */}
          <div className="mt-3 grid grid-cols-2 gap-1 bg-[#F8F5F0]/10 rounded-lg p-1">
            <button
              onClick={() => setMode("journey")}
              className={`flex items-center justify-center gap-1.5 text-xs font-medium py-1.5 rounded-md transition-colors ${
                mode === "journey" ? "bg-[#c9a227] text-[#1a2b4a]" : "text-[#e8e4f0] hover:bg-[#F8F5F0]/10"
              }`}
            >
              <Map className="w-3.5 h-3.5" /> Journey
            </button>
            <button
              onClick={() => setMode("ask")}
              className={`flex items-center justify-center gap-1.5 text-xs font-medium py-1.5 rounded-md transition-colors ${
                mode === "ask" ? "bg-[#c9a227] text-[#1a2b4a]" : "text-[#e8e4f0] hover:bg-[#F8F5F0]/10"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" /> Ask
            </button>
          </div>
        </div>

        {/* Live setup progress — foundation (assessments + AI) */}
        {setupStatus && !setupStatus.complete && (
          <Link
            href="/setup"
            onClick={() => setIsOpen(false)}
            className="block px-4 py-2.5 bg-[#c9a227]/10 border-b border-[#c9a227]/20 hover:bg-[#c9a227]/15"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">
                Finish setup — foundation {setupStatus.done}/{setupStatus.total}
              </span>
              <span className="text-xs text-[#2E7C83] font-medium">Continue →</span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-[#1a2b4a]/10 overflow-hidden">
              <div
                className="h-1.5 rounded-full bg-gradient-to-r from-[#4a9b9b] to-[#c9a227]"
                style={{ width: `${Math.round((setupStatus.done / setupStatus.total) * 100)}%` }}
              />
            </div>
          </Link>
        )}

        {mode === "ask" ? (
          <CardContent className="p-0 flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {askMessages.length === 0 ? (
                <div>
                  <p className="text-sm text-[#7b6b8d] dark:text-[#e8e4f0] mb-3">
                    I&apos;ll answer from everything LifeCharter can do. Try one of these:
                  </p>
                  <div className="space-y-2">
                    {suggestedQuestions.map((sq) => (
                      <button
                        key={sq}
                        onClick={() => askQuestion(sq)}
                        className="w-full text-left text-sm px-3 py-2 rounded-lg border border-[#1a2b4a]/12 hover:border-[#4a9b9b]/50 hover:bg-[#4a9b9b]/5 text-[#1a2b4a] dark:text-[#F8F5F0]"
                      >
                        {sq}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                askMessages.map((m, i) => (
                  <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                        m.role === "user"
                          ? "bg-[#1a2b4a] text-[#F8F5F0]"
                          : "bg-[#4a9b9b]/10 text-[#1a2b4a] dark:text-[#F8F5F0] border border-[#4a9b9b]/20"
                      }`}
                    >
                      <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>
                      {m.role === "guide" && m.escalate && (
                        <a
                          href="mailto:support@lifecharter.com?subject=LifeCharter%20support%20question"
                          className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-[#c0632f] hover:underline"
                        >
                          <LifeBuoy className="w-3.5 h-3.5" /> Contact support
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
              {askLoading && (
                <div className="flex justify-start">
                  <div className="bg-[#4a9b9b]/10 border border-[#4a9b9b]/20 rounded-2xl px-3 py-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#4a9b9b]" />
                  </div>
                </div>
              )}
              <div ref={askEndRef} />
            </div>
            <div className="p-3 border-t border-[#1a2b4a]/10 bg-white dark:bg-[#1a2b4a]/40">
              <div className="flex items-center gap-2">
                <input
                  value={askInput}
                  onChange={(e) => setAskInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") askQuestion(askInput);
                  }}
                  placeholder="Ask about any feature…"
                  className="flex-1 px-3 h-10 text-sm rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]"
                />
                <button
                  onClick={() => askQuestion(askInput)}
                  disabled={askLoading || !askInput.trim()}
                  className="w-10 h-10 flex items-center justify-center rounded-lg bg-[#1a2b4a] text-[#F8F5F0] hover:bg-[#1a2b4a]/90 disabled:opacity-50"
                  aria-label="Send"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[11px] text-[#b8a898] mt-2 text-center">
                Answers come from the LifeCharter knowledge base, kept current as features ship.
              </p>
            </div>
          </CardContent>
        ) : (
        <CardContent className="p-0 overflow-y-auto flex-1">
          {currentStep && (
            <div className="p-4 bg-[#c9a227]/10 border-b border-[#c9a227]/20">
              <div className="flex items-center gap-2 mb-2">
                <Flag className="w-4 h-4 text-[#c9a227]" />
                <span className="text-xs font-medium text-[#c9a227]">Next Step</span>
              </div>
              <Link href={currentStep.path} onClick={() => setIsOpen(false)}>
                <div className="flex items-start gap-3 p-3 bg-white dark:bg-[#1a2b4a]/50 rounded-lg hover:shadow-md cursor-pointer">
                  <div className="p-2 bg-[#4a9b9b]/20 rounded-lg">{currentStep.icon}</div>
                  <div className="flex-1">
                    <h4 className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">{currentStep.title}</h4>
                    <p className="text-xs text-[#b8a898] mt-1">{currentStep.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-[#4a9b9b]">{currentStep.section === "business" ? "Business" : "Daily"}</span>
                      <span className="text-xs text-[#b8a898]">• {currentStep.estimatedTime} min</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#b8a898]" />
                </div>
              </Link>
            </div>
          )}

          <div className="p-4 space-y-4">
            {journeyStages.map((stage, idx) => (
              <div key={stage.id}>
                <button
                  onClick={() => setCurrentStage(currentStage === idx ? -1 : idx)}
                  className="w-full flex items-center justify-between p-3 bg-[#1a2b4a]/5 rounded-lg hover:bg-[#1a2b4a]/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      stage.steps.every(s => completedSteps.includes(s.id)) ? "bg-green-500 text-white" : "bg-[#1a2b4a] text-[#F8F5F0]"
                    }`}>
                      {stage.steps.every(s => completedSteps.includes(s.id)) ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                    </div>
                    <div className="text-left">
                      <h4 className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">{stage.name}</h4>
                      <p className="text-xs text-[#b8a898]">{stage.description}</p>
                    </div>
                  </div>
                  {currentStage === idx ? <ChevronUp className="w-4 h-4 text-[#b8a898]" /> : <ChevronRight className="w-4 h-4 text-[#b8a898]" />}
                </button>

                {currentStage === idx && (
                  <div className="mt-2 ml-4 space-y-2">
                    {stage.steps.map((step) => {
                      const isDone = completedSteps.includes(step.id);
                      return (
                        <div key={step.id} className="flex items-start gap-3 p-3 bg-white dark:bg-[#1a2b4a]/30 rounded-lg border border-[#1a2b4a]/10">
                          <button onClick={() => toggleStep(step.id)} className="mt-0.5">
                            {isDone ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Circle className="w-5 h-5 text-[#b8a898] hover:text-[#4a9b9b]" />}
                          </button>
                          <div className="flex-1">
                            <Link href={step.path} onClick={() => setIsOpen(false)}>
                              <h5 className={`font-medium ${isDone ? "line-through text-[#b8a898]" : "text-[#1a2b4a] dark:text-[#F8F5F0]"}`}>
                                {step.title}
                              </h5>
                            </Link>
                            <p className="text-xs text-[#b8a898] mt-1">{step.description}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${step.section === "business" ? "bg-[#1a2b4a]/10 text-[#7b6b8d]" : "bg-[#4a9b9b]/10 text-[#4a9b9b]"}`}>
                                {step.section === "business" ? "Business" : "Daily"}
                              </span>
                              <span className="text-xs text-[#b8a898]">{step.estimatedTime} min</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="p-4 bg-[#c9a227]/10 border-t border-[#c9a227]/20">
            <div className="flex items-start gap-2">
              <Lightbulb className="w-4 h-4 text-[#c9a227] mt-0.5" />
              <p className="text-xs text-[#7b6b8d] dark:text-[#e8e4f0]">
                <strong>Tip:</strong> Drag the grip icon (≡) to move this widget anywhere!
              </p>
            </div>
          </div>
        </CardContent>
        )}
      </Card>
    </div>
  );
}
