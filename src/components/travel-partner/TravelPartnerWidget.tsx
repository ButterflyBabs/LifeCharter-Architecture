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
  GripVertical
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

  // Simple draggable state
  const [pos, setPos] = useState<{x: number, y: number} | null>(null);
  const [dragging, setDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
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
      
      // Bounds
      const maxX = window.innerWidth - 400;
      const maxY = window.innerHeight - 600;
      
      const bounded = {
        x: Math.max(10, Math.min(newX, maxX)),
        y: Math.max(10, Math.min(newY, maxY))
      };
      
      setPos(bounded);
    };
    
    const onUp = () => {
      setDragging(false);
      if (pos) localStorage.setItem("travelPartnerPos", JSON.stringify(pos));
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
        <Card className="w-80 bg-gradient-to-br from-[#1F315B] to-[#5E3B6C] text-[#F6F1E8]">
          <CardContent className="p-6 text-center">
            <Award className="w-12 h-12 text-[#D4AF63] mx-auto mb-3" />
            <h3 className="font-bold text-lg mb-2">Journey Complete!</h3>
            <p className="text-sm text-[#CDBED6] mb-4">
              You have set up your LifeCharter Architecture!
            </p>
            <Button onClick={() => setShowCelebration(false)} className="bg-[#D4AF63] text-[#1F315B]">
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
        className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-[#1F315B] to-[#5E3B6C] text-[#F6F1E8] rounded-full shadow-lg hover:scale-105 transition-transform cursor-move"
        onMouseDown={startDrag}
        onClick={() => {
          // Only open if not dragging
          if (!dragging) setIsOpen(true);
        }}
      >
        <GripVertical data-drag className="w-5 h-5 text-[#CDBED6] opacity-60 cursor-grab active:cursor-grabbing" />
        <Compass className="w-5 h-5 text-[#D4AF63]" />
        <span className="font-medium">Travel Partner</span>
        {progress > 0 && (
          <span className="ml-2 text-xs bg-[#D4AF63] text-[#1F315B] px-2 py-0.5 rounded-full">{progress}%</span>
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
          className="bg-gradient-to-r from-[#1F315B] to-[#5E3B6C] text-[#F6F1E8] p-4 cursor-move select-none"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GripVertical data-drag className="w-5 h-5 text-[#CDBED6] opacity-60" />
              <CardTitle className="text-lg flex items-center gap-2">
                <Compass className="w-5 h-5 text-[#D4AF63]" />
                Travel Partner
              </CardTitle>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={resetPos} className="p-1.5 hover:bg-[#F6F1E8]/10 rounded text-xs text-[#CDBED6]">
                Reset
              </button>
              <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-[#F6F1E8]/10 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <p className="text-sm text-[#CDBED6] mt-1">Your guide to setting up LifeCharter Architecture</p>
          
          <div className="mt-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-[#CDBED6]">Progress</span>
              <span className="text-[#D4AF63] font-medium">{progress}%</span>
            </div>
            <div className="w-full bg-[#F6F1E8]/20 rounded-full h-2">
              <div className="bg-gradient-to-r from-[#2E7C83] to-[#D4AF63] h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>

        <CardContent className="p-0 overflow-y-auto flex-1">
          {currentStep && (
            <div className="p-4 bg-[#D4AF63]/10 border-b border-[#D4AF63]/20">
              <div className="flex items-center gap-2 mb-2">
                <Flag className="w-4 h-4 text-[#D4AF63]" />
                <span className="text-xs font-medium text-[#D4AF63]">Next Step</span>
              </div>
              <Link href={currentStep.path} onClick={() => setIsOpen(false)}>
                <div className="flex items-start gap-3 p-3 bg-white dark:bg-[#1F315B]/50 rounded-lg hover:shadow-md cursor-pointer">
                  <div className="p-2 bg-[#2E7C83]/20 rounded-lg">{currentStep.icon}</div>
                  <div className="flex-1">
                    <h4 className="font-medium text-[#1F315B] dark:text-[#F6F1E8]">{currentStep.title}</h4>
                    <p className="text-xs text-[#B9A9A9] mt-1">{currentStep.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-[#2E7C83]">{currentStep.section === "business" ? "Business" : "Daily"}</span>
                      <span className="text-xs text-[#B9A9A9]">• {currentStep.estimatedTime} min</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#B9A9A9]" />
                </div>
              </Link>
            </div>
          )}

          <div className="p-4 space-y-4">
            {journeyStages.map((stage, idx) => (
              <div key={stage.id}>
                <button
                  onClick={() => setCurrentStage(currentStage === idx ? -1 : idx)}
                  className="w-full flex items-center justify-between p-3 bg-[#1F315B]/5 rounded-lg hover:bg-[#1F315B]/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      stage.steps.every(s => completedSteps.includes(s.id)) ? "bg-green-500 text-white" : "bg-[#1F315B] text-[#F6F1E8]"
                    }`}>
                      {stage.steps.every(s => completedSteps.includes(s.id)) ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                    </div>
                    <div className="text-left">
                      <h4 className="font-medium text-[#1F315B] dark:text-[#F6F1E8]">{stage.name}</h4>
                      <p className="text-xs text-[#B9A9A9]">{stage.description}</p>
                    </div>
                  </div>
                  {currentStage === idx ? <ChevronUp className="w-4 h-4 text-[#B9A9A9]" /> : <ChevronRight className="w-4 h-4 text-[#B9A9A9]" />}
                </button>

                {currentStage === idx && (
                  <div className="mt-2 ml-4 space-y-2">
                    {stage.steps.map((step) => {
                      const isDone = completedSteps.includes(step.id);
                      return (
                        <div key={step.id} className="flex items-start gap-3 p-3 bg-white dark:bg-[#1F315B]/30 rounded-lg border border-[#1F315B]/10">
                          <button onClick={() => toggleStep(step.id)} className="mt-0.5">
                            {isDone ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Circle className="w-5 h-5 text-[#B9A9A9] hover:text-[#2E7C83]" />}
                          </button>
                          <div className="flex-1">
                            <Link href={step.path} onClick={() => setIsOpen(false)}>
                              <h5 className={`font-medium ${isDone ? "line-through text-[#B9A9A9]" : "text-[#1F315B] dark:text-[#F6F1E8]"}`}>
                                {step.title}
                              </h5>
                            </Link>
                            <p className="text-xs text-[#B9A9A9] mt-1">{step.description}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${step.section === "business" ? "bg-[#1F315B]/10 text-[#5E3B6C]" : "bg-[#2E7C83]/10 text-[#2E7C83]"}`}>
                                {step.section === "business" ? "Business" : "Daily"}
                              </span>
                              <span className="text-xs text-[#B9A9A9]">{step.estimatedTime} min</span>
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

          <div className="p-4 bg-[#D4AF63]/10 border-t border-[#D4AF63]/20">
            <div className="flex items-start gap-2">
              <Lightbulb className="w-4 h-4 text-[#D4AF63] mt-0.5" />
              <p className="text-xs text-[#5E3B6C] dark:text-[#CDBED6]">
                <strong>Tip:</strong> Drag the grip icon (≡) to move this widget anywhere!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
