/**
 * Quick Pulse Check-in Assessment Page
 * 
 * 18-question follow-up assessment (6 Brain, 6 Soul, 6 Profit)
 * Tracks client progress over time against initial assessments
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import { 
  Activity, 
  ArrowLeft, 
  ArrowRight, 
  Save, 
  CheckCircle, 
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  AlertCircle,
  Brain,
  Heart,
  DollarSign,
  Zap
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { 
  UnifiedMemoryProvider, 
  useUnifiedMemoryContext 
} from "@/components/assessment/UnifiedMemoryProvider";

interface Question {
  id: string;
  text: string;
  dimension: "brain" | "soul" | "profit";
  dimensionLabel: string;
  options: { value: string; label: string; description: string }[];
}

const questions: Question[] = [
  // SECTION 1: BRAIN (Questions 1-6)
  {
    id: "qpc_brain_01",
    text: "How clear are your business systems right now?",
    dimension: "brain",
    dimensionLabel: "Systems Clarity",
    options: [
      { value: "1", label: "1", description: "Chaos - I don't know what's happening" },
      { value: "2", label: "2", description: "Unclear - Systems exist but aren't documented" },
      { value: "3", label: "3", description: "Okay - Some systems work, others don't" },
      { value: "4", label: "4", description: "Clear - Most systems are documented and followed" },
      { value: "5", label: "5", description: "Crystal Clear - Everything runs smoothly without me" },
    ],
  },
  {
    id: "qpc_brain_02",
    text: "How confident are you in your business decisions this week?",
    dimension: "brain",
    dimensionLabel: "Decision Making",
    options: [
      { value: "1", label: "1", description: "Paralyzed - Avoiding decisions" },
      { value: "2", label: "2", description: "Uncertain - Second-guessing everything" },
      { value: "3", label: "3", description: "Cautious - Making decisions but slowly" },
      { value: "4", label: "4", description: "Confident - Trusting my judgment" },
      { value: "5", label: "5", description: "Decisive - Clear, aligned, swift decisions" },
    ],
  },
  {
    id: "qpc_brain_03",
    text: "How supported do you feel by your team/delegation systems?",
    dimension: "brain",
    dimensionLabel: "Team Capacity",
    options: [
      { value: "1", label: "1", description: "Alone - Doing everything myself" },
      { value: "2", label: "2", description: "Burdened - Trying to delegate but failing" },
      { value: "3", label: "3", description: "Learning - Some delegation working" },
      { value: "4", label: "4", description: "Supported - Team handles key areas" },
      { value: "5", label: "5", description: "Fully Supported - I focus on my genius zone" },
    ],
  },
  {
    id: "qpc_brain_04",
    text: "How clear is your financial picture right now?",
    dimension: "brain",
    dimensionLabel: "Financial Visibility",
    options: [
      { value: "1", label: "1", description: "Blind - No idea where money is" },
      { value: "2", label: "2", description: "Worried - Checking accounts nervously" },
      { value: "3", label: "3", description: "Aware - I know basics but not details" },
      { value: "4", label: "4", description: "Clear - Regular reviews, understand metrics" },
      { value: "5", label: "5", description: "Crystal Clear - Predictable, planned, healthy" },
    ],
  },
  {
    id: "qpc_brain_05",
    text: "How effective has your marketing been recently?",
    dimension: "brain",
    dimensionLabel: "Marketing Effectiveness",
    options: [
      { value: "1", label: "1", description: "Silent - No outreach, no leads" },
      { value: "2", label: "2", description: "Scattered - Trying things, no results" },
      { value: "3", label: "3", description: "Okay - Some leads coming in" },
      { value: "4", label: "4", description: "Working - Consistent lead flow" },
      { value: "5", label: "5", description: "Thriving - Predictable, scalable system" },
    ],
  },
  {
    id: "qpc_brain_06",
    text: "How stressed do you feel about daily operations?",
    dimension: "brain",
    dimensionLabel: "Operational Stress",
    options: [
      { value: "1", label: "1", description: "Overwhelmed - Constant firefighting" },
      { value: "2", label: "2", description: "Stressed - Too many moving parts" },
      { value: "3", label: "3", description: "Managing - Keeping up but tired" },
      { value: "4", label: "4", description: "Smooth - Mostly under control" },
      { value: "5", label: "5", description: "Effortless - Systems handle the load" },
    ],
  },
  // SECTION 2: SOUL (Questions 7-12)
  {
    id: "qpc_soul_01",
    text: "How connected do you feel to your deeper mission right now?",
    dimension: "soul",
    dimensionLabel: "Mission Connection",
    options: [
      { value: "1", label: "1", description: "Lost - Forgot why I started" },
      { value: "2", label: "2", description: "Distant - Mission feels far away" },
      { value: "3", label: "3", description: "Remembering - Touching it sometimes" },
      { value: "4", label: "4", description: "Connected - Mission guides my work" },
      { value: "5", label: "5", description: "On Fire - Living my purpose daily" },
    ],
  },
  {
    id: "qpc_soul_02",
    text: "How is your energy for the work you're doing?",
    dimension: "soul",
    dimensionLabel: "Energy Levels",
    options: [
      { value: "1", label: "1", description: "Depleted - Running on empty" },
      { value: "2", label: "2", description: "Tired - Dragging through days" },
      { value: "3", label: "3", description: "Okay - Some good days, some bad" },
      { value: "4", label: "4", description: "Good - Generally energized" },
      { value: "5", label: "5", description: "Vibrant - Full of life and creativity" },
    ],
  },
  {
    id: "qpc_soul_03",
    text: "How aligned are your daily actions with your core values?",
    dimension: "soul",
    dimensionLabel: "Values Alignment",
    options: [
      { value: "1", label: "1", description: "Compromised - Acting against my values" },
      { value: "2", label: "2", description: "Conflicted - Some alignment, some not" },
      { value: "3", label: "3", description: "Trying - Aiming for alignment" },
      { value: "4", label: "4", description: "Mostly Aligned - Living my values" },
      { value: "5", label: "5", description: "Fully Aligned - Every action reflects who I am" },
    ],
  },
  {
    id: "qpc_soul_04",
    text: "How much inner peace do you feel about your business journey?",
    dimension: "soul",
    dimensionLabel: "Inner Peace",
    options: [
      { value: "1", label: "1", description: "Anxious - Constant worry and fear" },
      { value: "2", label: "2", description: "Uneasy - Underlying tension" },
      { value: "3", label: "3", description: "Neutral - Neither peaceful nor anxious" },
      { value: "4", label: "4", description: "Peaceful - Generally calm and trusting" },
      { value: "5", label: "5", description: "Deep Peace - Unshakeable trust in the process" },
    ],
  },
  {
    id: "qpc_soul_05",
    text: "How aware are you of your patterns and triggers right now?",
    dimension: "soul",
    dimensionLabel: "Shadow Work",
    options: [
      { value: "1", label: "1", description: "Unaware - Reacting without knowing why" },
      { value: "2", label: "2", description: "Starting - Noticing patterns after the fact" },
      { value: "3", label: "3", description: "Learning - Catching myself sometimes" },
      { value: "4", label: "4", description: "Aware - Recognizing patterns in the moment" },
      { value: "5", label: "5", description: "Masterful - Choosing response over reaction" },
    ],
  },
  {
    id: "qpc_soul_06",
    text: "How much joy and fulfillment are you experiencing in your work?",
    dimension: "soul",
    dimensionLabel: "Joy & Fulfillment",
    options: [
      { value: "1", label: "1", description: "None - Work feels like a burden" },
      { value: "2", label: "2", description: "Little - Mostly grinding" },
      { value: "3", label: "3", description: "Some - Moments of joy" },
      { value: "4", label: "4", description: "Good - Regularly fulfilled" },
      { value: "5", label: "5", description: "Abundant - Deep joy in what I do" },
    ],
  },
  // SECTION 3: PROFIT (Questions 13-18)
  {
    id: "qpc_profit_01",
    text: "How stable and predictable is your revenue right now?",
    dimension: "profit",
    dimensionLabel: "Revenue Stability",
    options: [
      { value: "1", label: "1", description: "Volatile - Unpredictable income" },
      { value: "2", label: "2", description: "Uncertain - Worried about next month" },
      { value: "3", label: "3", description: "Okay - Meeting basics but tight" },
      { value: "4", label: "4", description: "Stable - Predictable, comfortable" },
      { value: "5", label: "5", description: "Thriving - Growing, secure, abundant" },
    ],
  },
  {
    id: "qpc_profit_02",
    text: "How confident do you feel in your sales process?",
    dimension: "profit",
    dimensionLabel: "Sales Confidence",
    options: [
      { value: "1", label: "1", description: "Avoiding - Hate selling, avoid it" },
      { value: "2", label: "2", description: "Uncomfortable - Forcing myself" },
      { value: "3", label: "3", description: "Learning - Getting better" },
      { value: "4", label: "4", description: "Confident - Comfortable with sales" },
      { value: "5", label: "5", description: "Masterful - Sales feel like service" },
    ],
  },
  {
    id: "qpc_profit_03",
    text: "How confident are you in your pricing?",
    dimension: "profit",
    dimensionLabel: "Pricing Power",
    options: [
      { value: "1", label: "1", description: "Undercharging - Know I'm worth more" },
      { value: "2", label: "2", description: "Hesitant - Afraid to raise prices" },
      { value: "3", label: "3", description: "Okay - Fair pricing but not premium" },
      { value: "4", label: "4", description: "Confident - Pricing reflects value" },
      { value: "5", label: "5", description: "Premium - Charging what I'm worth" },
    ],
  },
  {
    id: "qpc_profit_04",
    text: "How aligned are your current clients with your ideal?",
    dimension: "profit",
    dimensionLabel: "Client Quality",
    options: [
      { value: "1", label: "1", description: "Misaligned - Working with wrong people" },
      { value: "2", label: "2", description: "Mixed - Some good, some draining" },
      { value: "3", label: "3", description: "Improving - Attracting better clients" },
      { value: "4", label: "4", description: "Aligned - Mostly ideal clients" },
      { value: "5", label: "5", description: "Perfect - Dream clients only" },
    ],
  },
  {
    id: "qpc_profit_05",
    text: "How do you feel about your business growth trajectory?",
    dimension: "profit",
    dimensionLabel: "Growth Trajectory",
    options: [
      { value: "1", label: "1", description: "Stuck - No growth, feeling stagnant" },
      { value: "2", label: "2", description: "Slow - Minimal progress" },
      { value: "3", label: "3", description: "Steady - Slow but consistent growth" },
      { value: "4", label: "4", description: "Growing - Clear upward trend" },
      { value: "5", label: "5", description: "Accelerating - Rapid, sustainable growth" },
    ],
  },
  {
    id: "qpc_profit_06",
    text: "Overall, how healthy is your business right now?",
    dimension: "profit",
    dimensionLabel: "Overall Health",
    options: [
      { value: "1", label: "1", description: "Critical - Needs immediate attention" },
      { value: "2", label: "2", description: "Struggling - Multiple challenges" },
      { value: "3", label: "3", description: "Okay - Surviving, not thriving" },
      { value: "4", label: "4", description: "Healthy - Solid foundation" },
      { value: "5", label: "5", description: "Thriving - Strong in all areas" },
    ],
  },
];

interface CheckInResult {
  brainScore: number;
  soulScore: number;
  profitScore: number;
  totalScore: number;
  healthLevel: string;
  healthColor: string;
}

interface PreviousCheckIn {
  id: string;
  created_at: string;
  brain_score: number;
  soul_score: number;
  profit_score: number;
  total_score: number;
}

interface ActionStep {
  id: string;
  title: string;
  description: string;
  dimension: string;
  priority: "high" | "medium" | "low";
}

function QuickPulseCheckinContent() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [previousCheckins, setPreviousCheckins] = useState<PreviousCheckIn[]>([]);
  const [actionSteps, setActionSteps] = useState<ActionStep[]>([]);
  
  const { masterPlan, isSyncing } = useUnifiedMemoryContext();
  const supabase = createClient();

  useEffect(() => {
    const saved = localStorage.getItem("quick-pulse-checkin");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setAnswers(parsed.answers || {});
        setCurrentQuestion(parsed.currentQuestion || 0);
        setLastSaved(new Date(parsed.savedAt));
      } catch {
        // Invalid saved data, start fresh
      }
    }

    async function fetchHistory() {
      if (!masterPlan?.id) return;
      
      try {
        const { data: checkins } = await supabase
          .from('quick_pulse_checkins')
          .select('*')
          .eq('master_plan_id', masterPlan.id)
          .order('created_at', { ascending: false });
        
        if (checkins) {
          setPreviousCheckins(checkins);
        }
      } catch (err) {
        console.error('Error fetching history:', err);
      }
    }

    fetchHistory();
  }, [masterPlan, supabase]);

  const calculateScores = useCallback((): CheckInResult => {
    const brainQuestions = questions.filter(q => q.dimension === "brain");
    const soulQuestions = questions.filter(q => q.dimension === "soul");
    const profitQuestions = questions.filter(q => q.dimension === "profit");

    const brainScore = brainQuestions.reduce((sum, q) => sum + (parseInt(answers[q.id] || "0", 10)), 0);
    const soulScore = soulQuestions.reduce((sum, q) => sum + (parseInt(answers[q.id] || "0", 10)), 0);
    const profitScore = profitQuestions.reduce((sum, q) => sum + (parseInt(answers[q.id] || "0", 10)), 0);
    const totalScore = brainScore + soulScore + profitScore;

    let healthLevel = "";
    let healthColor = "";

    if (totalScore >= 81) {
      healthLevel = "Thriving";
      healthColor = "#22c55e";
    } else if (totalScore >= 61) {
      healthLevel = "Healthy";
      healthColor = "#84cc16";
    } else if (totalScore >= 41) {
      healthLevel = "Building";
      healthColor = "#eab308";
    } else if (totalScore >= 21) {
      healthLevel = "Challenged";
      healthColor = "#f97316";
    } else {
      healthLevel = "Critical";
      healthColor = "#ef4444";
    }

    return { brainScore, soulScore, profitScore, totalScore, healthLevel, healthColor };
  }, [answers]);

  const generateActionSteps = useCallback((scores: CheckInResult): ActionStep[] => {
    const steps: ActionStep[] = [];
    const previous = previousCheckins[0];

    const dimensionScores = [
      { dim: "brain", score: scores.brainScore, max: 30, label: "Brain (Systems)" },
      { dim: "soul", score: scores.soulScore, max: 30, label: "Soul (Purpose)" },
      { dim: "profit", score: scores.profitScore, max: 30, label: "Profit (Financial)" },
    ];
    
    const lowest = dimensionScores.sort((a, b) => (a.score/a.max) - (b.score/b.max))[0];
    
    if (lowest.dim === "brain") {
      steps.push({
        id: "1",
        title: "Strengthen Your Systems",
        description: "Your Brain score indicates system gaps. Document your top 3 repetitive tasks this week and create simple checklists for each.",
        dimension: "brain",
        priority: "high",
      });
    } else if (lowest.dim === "soul") {
      steps.push({
        id: "1",
        title: "Reconnect with Your Mission",
        description: "Your Soul score needs attention. Schedule 2 hours this week for values alignment work.",
        dimension: "soul",
        priority: "high",
      });
    } else {
      steps.push({
        id: "1",
        title: "Boost Your Profit Confidence",
        description: "Your Profit score is the lowest. Review your pricing strategy and identify one client you'd feel comfortable raising rates with.",
        dimension: "profit",
        priority: "high",
      });
    }

    if (previous) {
      const brainChange = scores.brainScore - previous.brain_score;
      const soulChange = scores.soulScore - previous.soul_score;
      const profitChange = scores.profitScore - previous.profit_score;

      const changes = [
        { dim: "brain", change: brainChange, label: "Brain" },
        { dim: "soul", change: soulChange, label: "Soul" },
        { dim: "profit", change: profitChange, label: "Profit" },
      ];

      const biggestDecline = changes.filter(c => c.change < 0).sort((a, b) => a.change - b.change)[0];

      if (biggestDecline) {
        steps.push({
          id: "2",
          title: `Address ${biggestDecline.label} Decline`,
          description: `Your ${biggestDecline.label} score dropped ${Math.abs(biggestDecline.change)} points. Identify what changed since your last check-in.`,
          dimension: biggestDecline.dim,
          priority: "high",
        });
      }
    }

    if (steps.length < 3) {
      steps.push({
        id: "3",
        title: "Schedule Your Next Check-in",
        description: "Set a calendar reminder for your next Quick Pulse Check-in (recommended: monthly) to track your progress over time.",
        dimension: "general",
        priority: "low",
      });
    }

    return steps.slice(0, 3);
  }, [previousCheckins]);

  const saveProgress = useCallback(() => {
    setIsSaving(true);
    const data = {
      answers,
      currentQuestion,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem("quick-pulse-checkin", JSON.stringify(data));
    setTimeout(() => {
      setLastSaved(new Date());
      setIsSaving(false);
    }, 500);
  }, [answers, currentQuestion]);

  useEffect(() => {
    const timer = setTimeout(saveProgress, 1000);
    return () => clearTimeout(timer);
  }, [answers, currentQuestion, saveProgress]);

  const handleAnswer = (value: string) => {
    setAnswers(prev => ({ ...prev, [questions[currentQuestion].id]: value }));
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      if (!masterPlan) {
        throw new Error('No master plan available');
      }

      const scores = calculateScores();
      setResult(scores);

      const { error: checkinError } = await supabase
        .from('quick_pulse_checkins')
        .insert({
          master_plan_id: masterPlan.id,
          workspace_id: masterPlan.workspace_id,
          brain_score: scores.brainScore,
          soul_score: scores.soulScore,
          profit_score: scores.profitScore,
          total_score: scores.totalScore,
          health_level: scores.healthLevel,
          responses: answers,
        });

      if (checkinError) throw checkinError;

      const responsePromises = Object.entries(answers).map(([questionId, value]) => {
        const question = questions.find(q => q.id === questionId);
        if (!question) return Promise.resolve();
        
        return supabase.from('unified_client_responses').insert({
          master_plan_id: masterPlan.id,
          workspace_id: masterPlan.workspace_id,
          assessment_type: 'quick_pulse',
          question_id: questionId,
          section_name: question.dimensionLabel,
          section_type: question.dimension,
          answer_value: value,
          answer_text: question.options.find(o => o.value === value)?.description,
          score: parseInt(value, 10) * 20,
          answered_at: new Date().toISOString(),
        });
      });

      await Promise.all(responsePromises);

      const steps = generateActionSteps(scores);
      setActionSteps(steps);

      const actionPromises = steps.map(step => 
        supabase.from('client_action_items').insert({
          master_plan_id: masterPlan.id,
          workspace_id: masterPlan.workspace_id,
          title: step.title,
          description: step.description,
          category: step.dimension,
          priority: step.priority,
          source: 'quick_pulse_checkin',
          status: 'pending',
        })
      );

      await Promise.all(actionPromises);

      localStorage.removeItem("quick-pulse-checkin");

      setIsComplete(true);
    } catch (err) {
      console.error('Error completing check-in:', err);
      setSubmitError(err instanceof Error ? err.message : 'Failed to complete check-in');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentQ = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  const getDimensionIcon = (dimension: string) => {
    switch (dimension) {
      case "brain": return <Brain className="w-5 h-5" />;
      case "soul": return <Heart className="w-5 h-5" />;
      case "profit": return <DollarSign className="w-5 h-5" />;
      default: return <Activity className="w-5 h-5" />;
    }
  };

  const getDimensionColor = (dimension: string) => {
    switch (dimension) {
      case "brain": return "#4a9b9b";
      case "soul": return "#7b6b8d";
      case "profit": return "#c9a227";
      default: return "#1a2b4a";
    }
  };

  if (isComplete && result) {
    const previous = previousCheckins[0];
    
    return (
      <div className="py-12 px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          <Card className="border-[#c9a227]/30">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-[#c9a227]/10 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-[#c9a227]" />
              </div>
              <h1 className="text-2xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0] mb-2">
                Quick Pulse Complete!
              </h1>
              <p className="text-[#1a2b4a]/70 dark:text-[#F8F5F0]/70">
                Your check-in has been saved. Here&apos;s how you&apos;re doing:
              </p>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-[#4a9b9b]/20">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-[#4a9b9b]/10 flex items-center justify-center mx-auto mb-3">
                  <Brain className="w-6 h-6 text-[#4a9b9b]" />
                </div>
                <p className="text-sm text-[#b8a898] mb-1">Brain</p>
                <p className="text-3xl font-bold text-[#4a9b9b]">{result.brainScore}<span className="text-lg text-[#b8a898]">/30</span></p>
                {previous && (
                  <div className="flex items-center justify-center gap-1 mt-2 text-sm">
                    {result.brainScore > previous.brain_score ? (
                      <><TrendingUp className="w-4 h-4 text-green-500" /><span className="text-green-500">+{result.brainScore - previous.brain_score}</span></>
                    ) : result.brainScore < previous.brain_score ? (
                      <><TrendingDown className="w-4 h-4 text-red-500" /><span className="text-red-500">{result.brainScore - previous.brain_score}</span></>
                    ) : (
                      <><Minus className="w-4 h-4 text-gray-400" /><span className="text-gray-400">0</span></>
                    )}
                    <span className="text-[#b8a898]">vs last</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-[#7b6b8d]/20">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-[#7b6b8d]/10 flex items-center justify-center mx-auto mb-3">
                  <Heart className="w-6 h-6 text-[#7b6b8d]" />
                </div>
                <p className="text-sm text-[#b8a898] mb-1">Soul</p>
                <p className="text-3xl font-bold text-[#7b6b8d]">{result.soulScore}<span className="text-lg text-[#b8a898]">/30</span></p>
                {previous && (
                  <div className="flex items-center justify-center gap-1 mt-2 text-sm">
                    {result.soulScore > previous.soul_score ? (
                      <><TrendingUp className="w-4 h-4 text-green-500" /><span className="text-green-500">+{result.soulScore - previous.soul_score}</span></>
                    ) : result.soulScore < previous.soul_score ? (
                      <><TrendingDown className="w-4 h-4 text-red-500" /><span className="text-red-500">{result.soulScore - previous.soul_score}</span></>
                    ) : (
                      <><Minus className="w-4 h-4 text-gray-400" /><span className="text-gray-400">0</span></>
                    )}
                    <span className="text-[#b8a898]">vs last</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-[#c9a227]/20">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-[#c9a227]/10 flex items-center justify-center mx-auto mb-3">
                  <DollarSign className="w-6 h-6 text-[#c9a227]" />
                </div>
                <p className="text-sm text-[#b8a898] mb-1">Profit</p>
                <p className="text-3xl font-bold text-[#c9a227]">{result.profitScore}<span className="text-lg text-[#b8a898]">/30</span></p>
                {previous && (
                  <div className="flex items-center justify-center gap-1 mt-2 text-sm">
                    {result.profitScore > previous.profit_score ? (
                      <><TrendingUp className="w-4 h-4 text-green-500" /><span className="text-green-500">+{result.profitScore - previous.profit_score}</span></>
                    ) : result.profitScore < previous.profit_score ? (
                      <><TrendingDown className="w-4 h-4 text-red-500" /><span className="text-red-500">{result.profitScore - previous.profit_score}</span></>
                    ) : (
                      <><Minus className="w-4 h-4 text-gray-400" /><span className="text-gray-400">0</span></>
                    )}
                    <span className="text-[#b8a898]">vs last</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-2" style={{ borderColor: result.healthColor }}>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: `${result.healthColor}20` }}>
                  <Activity className="w-6 h-6" style={{ color: result.healthColor }} />
                </div>
                <p className="text-sm text-[#b8a898] mb-1">Total Score</p>
                <p className="text-3xl font-bold" style={{ color: result.healthColor }}>{result.totalScore}<span className="text-lg text-[#b8a898]">/90</span></p>
                <p className="text-sm font-medium mt-1" style={{ color: result.healthColor }}>{result.healthLevel}</p>
              </CardContent>
            </Card>
          </div>

          {/* Three Steps Forward */}
          <Card className="border-[#c9a227]/30">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#c9a227]/20 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-[#c9a227]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">Three Steps Forward</h2>
                  <p className="text-sm text-[#b8a898]">Personalized actions based on your results</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {actionSteps.map((step, index) => (
                  <div key={step.id} className="flex gap-4 p-4 rounded-lg bg-[#1a2b4a]/5 dark:bg-[#1a2b4a]/20">
                    <div className="w-8 h-8 rounded-full bg-[#c9a227] text-white flex items-center justify-center font-bold flex-shrink-0">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{step.title}</h3>
                      <p className="text-sm text-[#1a2b4a]/70 dark:text-[#F8F5F0]/70 mt-1">{step.description}</p>
                      <span className={`inline-block mt-2 text-xs px-2 py-1 rounded-full ${
                        step.priority === 'high' ? 'bg-red-100 text-red-700' :
                        step.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {step.priority} priority
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* History Chart Placeholder */}
          {previousCheckins.length > 0 && (
            <Card className="border-[#1a2b4a]/20">
              <CardHeader>
                <h2 className="text-lg font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">Your Progress Over Time</h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {previousCheckins.slice(0, 5).map((checkin) => (
                    <div key={checkin.id} className="flex items-center justify-between p-3 rounded-lg bg-[#1a2b4a]/5">
                      <span className="text-sm text-[#b8a898]">{new Date(checkin.created_at).toLocaleDateString()}</span>
                      <div className="flex gap-4 text-sm">
                        <span className="text-[#4a9b9b]">Brain: {checkin.brain_score}</span>
                        <span className="text-[#7b6b8d]">Soul: {checkin.soul_score}</span>
                        <span className="text-[#c9a227]">Profit: {checkin.profit_score}</span>
                        <span className="font-bold">Total: {checkin.total_score}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard">
              <Button variant="primary" size="lg">View Dashboard</Button>
            </Link>
            <Link href="/assessments">
              <Button variant="secondary" size="lg">Back to Assessments</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-[#1a2b4a] text-white py-8 px-4 -mx-4 mb-8 lg:rounded-lg lg:mx-0">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-[#c9a227]/20 flex items-center justify-center">
                <Activity className="w-5 h-5 text-[#c9a227]" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Quick Pulse Check-in</h1>
                <p className="text-sm text-[#e8e4f0]">Track your progress across Brain, Soul, and Profit</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2">
                  {getDimensionIcon(currentQ.dimension)}
                  <span style={{ color: getDimensionColor(currentQ.dimension) }}>
                    {currentQ.dimension === "brain" ? "Brain" : currentQ.dimension === "soul" ? "Soul" : "Profit"}
                  </span>
                  <span className="text-[#e8e4f0]">• {currentQ.dimensionLabel}</span>
                </span>
                <span>Question {currentQuestion + 1} of {questions.length}</span>
              </div>
              <Progress value={progress} variant="gold" />
            </div>
          </div>
        </div>

        {/* Question Card */}
        <Card className="border-[#c9a227]/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium" style={{ color: getDimensionColor(currentQ.dimension) }}>
                {currentQ.dimensionLabel}
              </span>
              <div className="flex items-center gap-2 text-sm text-[#b8a898]">
                <Save className="w-4 h-4" />
                {isSyncing ? "Syncing..." : isSaving ? "Saving..." : lastSaved ? "Saved" : "Not saved"}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <h2 className="text-xl font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">
              {currentQ.text}
            </h2>

            {/* Options */}
            <div className="space-y-3">
              {currentQ.options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleAnswer(option.value)}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    answers[currentQ.id] === option.value
                      ? "border-[#c9a227] bg-[#c9a227]/10"
                      : "border-[#1a2b4a]/10 hover:border-[#c9a227]/50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      answers[currentQ.id] === option.value
                        ? "bg-[#c9a227] text-white"
                        : "bg-[#1a2b4a]/10 text-[#1a2b4a] dark:text-[#e8e4f0]"
                    }`}>
                      {option.label}
                    </span>
                    <span className="text-[#1a2b4a] dark:text-[#F8F5F0] pt-1">{option.description}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Error Message */}
            {submitError && (
              <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Error completing check-in</p>
                  <p>{submitError}</p>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-[#c9a227]/20">
              <Button
                variant="ghost"
                onClick={handlePrevious}
                disabled={currentQuestion === 0}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              <Button
                variant="primary"
                onClick={handleNext}
                disabled={!answers[currentQ.id] || isSubmitting}
              >
                {isSubmitting 
                  ? "Completing..." 
                  : currentQuestion === questions.length - 1 
                    ? "Complete Check-in" 
                    : "Next"
                }
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Progress Summary */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          {["brain", "soul", "profit"].map((dim) => {
            const dimQuestions = questions.filter(q => q.dimension === dim);
            const answeredCount = dimQuestions.filter(q => answers[q.id]).length;
            const isActive = currentQ.dimension === dim;
            return (
              <div 
                key={dim} 
                className={`p-3 rounded-xl border-2 text-center transition-all ${
                  isActive ? "border-[#c9a227] bg-[#c9a227]/5" : "border-[#1a2b4a]/10"
                }`}
              >
                <p className="text-xs text-[#b8a898] capitalize">{dim}</p>
                <p className="text-lg font-bold" style={{ color: getDimensionColor(dim) }}>
                  {answeredCount}/{dimQuestions.length}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Main page component with provider
export default function QuickPulseCheckinPage() {
  const [masterPlanId, setMasterPlanId] = useState<string | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    async function initializeAssessment() {
      try {
        const supabase = createClient();
        
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        // If no user, enable demo mode with local-only storage
        if (authError || !user) {
          setIsDemoMode(true);
          // Use demo IDs that don't need database
          setMasterPlanId('demo-master-plan');
          setWorkspaceId('demo-workspace');
          setIsLoading(false);
          return;
        }

        const { data: existingPlan } = await supabase
          .from('client_master_plans')
          .select('id, workspace_id')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single();

        if (existingPlan) {
          setMasterPlanId(existingPlan.id);
          setWorkspaceId(existingPlan.workspace_id);
        } else {
          const { data: workspace } = await supabase
            .from('workspaces')
            .select('id')
            .eq('owner_id', user.id)
            .single();

          let workspaceId: string;
          
          if (workspace) {
            workspaceId = workspace.id;
          } else {
            const { data: newWorkspace, error: wsError } = await supabase
              .from('workspaces')
              .insert({
                name: 'My Workspace',
                owner_id: user.id,
              })
              .select('id')
              .single();
            
            if (wsError || !newWorkspace) {
              throw new Error('Failed to create workspace');
            }
            workspaceId = newWorkspace.id;
          }

          const { data: newPlan, error: planError } = await supabase
            .from('client_master_plans')
            .insert({
              workspace_id: workspaceId,
              user_id: user.id,
              client_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Anonymous',
              client_email: user.email,
              status: 'active',
            })
            .select('id, workspace_id')
            .single();

          if (planError || !newPlan) {
            throw new Error('Failed to create master plan');
          }

          setMasterPlanId(newPlan.id);
          setWorkspaceId(newPlan.workspace_id);
        }
      } catch (err) {
        console.error('Error initializing assessment:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize assessment');
      } finally {
        setIsLoading(false);
      }
    }

    initializeAssessment();
  }, []);

  if (isLoading) {
    return (
      <div className="py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-[#c9a227] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-[#b8a898]">Loading check-in...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="border-red-200">
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h1 className="text-xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0] mb-2">
                Unable to Load Check-in
              </h1>
              <p className="text-[#b8a898] mb-6">{error}</p>
              <Link href="/assessments">
                <Button variant="primary">Back to Assessments</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!masterPlanId || !workspaceId) {
    return (
      <div className="py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <Sparkles className="w-12 h-12 text-[#c9a227] mx-auto mb-4" />
              <h1 className="text-xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0] mb-2">
                Welcome to Quick Pulse Check-in
              </h1>
              <p className="text-[#b8a898] mb-6">
                {isDemoMode 
                  ? "Demo Mode: Try the Quick Pulse Check-in without signing in. Your data won't be saved permanently."
                  : "Please sign in to start your check-in and track your progress across all dimensions."
                }
              </p>
              {isDemoMode ? (
                <Button 
                  variant="primary" 
                  onClick={() => window.location.reload()}
                >
                  Start Demo Check-in
                </Button>
              ) : (
                <Link href="/login">
                  <Button variant="primary">Sign In</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <UnifiedMemoryProvider
      masterPlanId={masterPlanId}
      workspaceId={workspaceId}
      enableRealtime={true}
    >
      <QuickPulseCheckinContent />
    </UnifiedMemoryProvider>
  );
}
