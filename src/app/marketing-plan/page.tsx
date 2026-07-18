"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { 
  Send, 
  Sparkles, 
  ChevronRight, 
  RefreshCw, 
  CheckCircle, 
  Target, 
  Users, 
  MessageSquare, 
  TrendingUp,
  Calendar,
  Lightbulb,
  ArrowRight,
  Save,
  Edit3,
  HelpCircle
} from "lucide-react";

// Types for the conversation flow
type QuestionType = "open" | "choice" | "scale" | "yesno";

interface Question {
  id: string;
  phase: number;
  text: string;
  type: QuestionType;
  options?: string[];
  placeholder?: string;
  followUp?: (answer: string) => string | null;
  hint?: string;
}

interface Answer {
  questionId: string;
  question: string;
  answer: string;
  timestamp: Date;
}

interface MarketingPlan {
  executiveSummary: {
    positioning: string;
    primaryGoal: string;
    keyMetric: string;
  };
  idealClient: {
    description: string;
    painPoints: string[];
    whereToFind: string[];
  };
  coreMessage: {
    tagline: string;
    talkingPoints: string[];
    story: string;
  };
  channelStrategy: {
    primary: string[];
    contentTypes: string[];
    frequency: string;
    first30Days: string[];
  };
  leadGeneration: {
    leadMagnet: string;
    nurtureSequence: string[];
    conversionPath: string;
  };
  actionPlan: {
    month1: string[];
    month2: string[];
    month3: string[];
  };
  metrics: {
    leading: string[];
    lagging: string[];
  };
}

// The 15-question conversational flow
const questions: Question[] = [
  // Phase 1: Discovery (Questions 1-5)
  {
    id: "q1",
    phase: 1,
    text: "What does your business do, and who do you help?",
    type: "open",
    placeholder: "I help [target audience] achieve [specific transformation] through [your method/offer]...",
    hint: "Be specific. Instead of 'I help women,' try 'I help working moms lose 20 pounds without giving up family dinners.'"
  },
  {
    id: "q2",
    phase: 1,
    text: "What's working now to bring you clients?",
    type: "open",
    placeholder: "Describe any channels, methods, or strategies that are currently bringing you business...",
    followUp: (answer) => {
      if (answer.toLowerCase().includes("nothing") || answer.toLowerCase().includes("not much")) {
        return "I hear you. Let's dig deeper—have you gotten clients from referrals, networking events, social media, or anywhere else, even sporadically?";
      }
      return null;
    }
  },
  {
    id: "q3",
    phase: 1,
    text: "Where do your best clients typically come from?",
    type: "choice",
    options: ["Referrals/word of mouth", "Social media", "Networking/events", "Content/marketing", "Paid advertising", "I'm not sure yet"]
  },
  {
    id: "q4",
    phase: 1,
    text: "What marketing have you tried that didn't work?",
    type: "open",
    placeholder: "Be honest—this helps us avoid repeating mistakes and understand your learning curve...",
    hint: "This isn't about judgment. Understanding what flopped helps us find what will fly."
  },
  {
    id: "q5",
    phase: 1,
    text: "How do clients typically find and choose you?",
    type: "open",
    placeholder: "Walk me through their journey—from first hearing about you to saying yes...",
    hint: "Do they Google? Get referred? See you speak? Find you on Instagram?"
  },
  
  // Phase 2: Strategy (Questions 6-10)
  {
    id: "q6",
    phase: 2,
    text: "What makes someone choose you over alternatives?",
    type: "open",
    placeholder: "Your unique approach, specific results, personality, methodology, or experience...",
    followUp: (answer) => {
      if (answer.length < 20) {
        return "Can you tell me more? What do clients specifically say they love about working with you?";
      }
      return null;
    }
  },
  {
    id: "q7",
    phase: 2,
    text: "What do you want to be known for in your market?",
    type: "open",
    placeholder: "The go-to expert for... The person who helps... Known for transforming..."
  },
  {
    id: "q8",
    phase: 2,
    text: "What type of content or expertise do you naturally share?",
    type: "choice",
    options: ["Writing/articles", "Video/being on camera", "Audio/podcasts", "Visuals/graphics", "Teaching/speaking", "1-on-1 conversations"]
  },
  {
    id: "q9",
    phase: 2,
    text: "Where does your ideal client already spend time online?",
    type: "choice",
    options: ["Instagram", "LinkedIn", "Facebook groups", "YouTube", "TikTok", "Podcasts", "Email/newsletters", "I'm not sure"]
  },
  {
    id: "q10",
    phase: 2,
    text: "What would consistent marketing make possible for your business?",
    type: "open",
    placeholder: "Revenue goals, number of clients, freedom, impact, or something else...",
    hint: "Think big but specific. 'More clients' is vague. '3 new clients monthly' is actionable."
  },
  
  // Phase 3: Tactics (Questions 11-15)
  {
    id: "q11",
    phase: 3,
    text: "How much time can you realistically dedicate to marketing weekly?",
    type: "choice",
    options: ["Less than 2 hours", "2-5 hours", "5-10 hours", "10+ hours"]
  },
  {
    id: "q12",
    phase: 3,
    text: "Do you prefer creating content or connecting with people directly?",
    type: "choice",
    options: ["Creating content (inbound)", "Connecting directly (outbound)", "A mix of both", "Not sure yet"]
  },
  {
    id: "q13",
    phase: 3,
    text: "What's your comfort level with showing up on video or audio?",
    type: "choice",
    options: ["Love it—bring it on!", "Willing to learn", "Prefer not to", "Camera shy but audio is fine"]
  },
  {
    id: "q14",
    phase: 3,
    text: "Do you have any existing assets we can leverage?",
    type: "choice",
    options: ["Email list (even small)", "Existing content/blog", "Strong social following", "Great network/referrals", "Not much yet"]
  },
  {
    id: "q15",
    phase: 3,
    text: "What's one marketing action you could take this week that would feel doable?",
    type: "open",
    placeholder: "Something small but meaningful—post one piece of content, reach out to 3 people, etc...",
    hint: "Start where you are. Small consistent actions beat big inconsistent ones."
  }
];

// AI response generator based on answers
function generateAIResponse(questionId: string, answer: string, allAnswers: Answer[]): string {
  const responses: Record<string, string[]> = {
    q1: [
      "Perfect—that clarity is gold. I can already see who we're serving.",
      "Great specificity. Knowing exactly who you help makes everything else easier.",
      "I love that transformation. That's the story we'll tell."
    ],
    q2: [
      "Excellent—let's double down on what's working.",
      "Good intel. We'll build from that foundation.",
      "Noted. Sometimes the best strategy is doing more of what already works."
    ],
    q3: [
      "Perfect. That's where we'll focus our energy.",
      "Smart. Let's optimize that channel.",
      "Great insight—that's your growth lever."
    ],
    q6: [
      "That's your superpower. We'll make sure everyone knows it.",
      "Perfect differentiation. That's your competitive edge.",
      "Exactly—that's what makes you the obvious choice."
    ],
    q10: [
      "That's the vision. Let's build the bridge to get there.",
      "Perfect goal. We'll reverse-engineer the path.",
      "I can see it. Let's make it happen."
    ],
    q15: [
      "Perfect starting point. Small steps create big momentum.",
      "Excellent—that's how we begin. One action at a time.",
      "Love it. Consistency beats intensity every time."
    ]
  };
  
  const questionResponses = responses[questionId];
  if (questionResponses) {
    return questionResponses[Math.floor(Math.random() * questionResponses.length)];
  }
  
  return "Great insight. I'm building your plan with this information.";
}

// Generate marketing plan from answers
function generateMarketingPlan(answers: Answer[]): MarketingPlan {
  const getAnswer = (id: string) => answers.find(a => a.questionId === id)?.answer || "";
  
  const q1 = getAnswer("q1");
  const q3 = getAnswer("q3");
  const q6 = getAnswer("q6");
  const q8 = getAnswer("q8");
  const q9 = getAnswer("q9");
  const q10 = getAnswer("q10");
  const q11 = getAnswer("q11");
  const q12 = getAnswer("q12");
  const q13 = getAnswer("q13");
  
  // Determine primary channels based on answers
  const primaryChannels: string[] = [];
  if (q9.includes("LinkedIn")) primaryChannels.push("LinkedIn");
  if (q9.includes("Instagram")) primaryChannels.push("Instagram");
  if (q12.includes("content")) primaryChannels.push("Content Marketing");
  if (q12.includes("connecting")) primaryChannels.push("Direct Outreach");
  if (primaryChannels.length === 0) primaryChannels.push("LinkedIn", "Email");
  
  // Determine content types
  const contentTypes: string[] = [];
  if (q8.includes("Writing")) contentTypes.push("Articles/Posts");
  if (q8.includes("Video") && !q13.includes("Prefer not")) contentTypes.push("Short-form Video");
  if (q8.includes("Audio")) contentTypes.push("Podcast/Audio");
  if (contentTypes.length === 0) contentTypes.push("Written Posts", "Stories");
  
  // Determine frequency based on time available
  let frequency = "2-3 times per week";
  if (q11.includes("Less than 2")) frequency = "Once per week";
  if (q11.includes("10+")) frequency = "Daily";
  
  return {
    executiveSummary: {
      positioning: q1 || "Your positioning statement will appear here",
      primaryGoal: q10 || "Define your primary marketing goal",
      keyMetric: "New qualified leads per month"
    },
    idealClient: {
      description: "Based on your answers, your ideal client profile will be detailed here",
      painPoints: ["Pain point 1", "Pain point 2", "Pain point 3"],
      whereToFind: primaryChannels
    },
    coreMessage: {
      tagline: q6 || "Your compelling tagline",
      talkingPoints: ["Key message 1", "Key message 2", "Key message 3"],
      story: "Your origin story and why you do this work"
    },
    channelStrategy: {
      primary: primaryChannels,
      contentTypes: contentTypes,
      frequency: frequency,
      first30Days: [
        "Set up/optimize your primary channel profile",
        "Create your lead magnet",
        "Post your first piece of content",
        "Reach out to 10 potential clients/partners"
      ]
    },
    leadGeneration: {
      leadMagnet: "A valuable free resource that solves a specific problem",
      nurtureSequence: ["Welcome email", "Value email 1", "Value email 2", "Soft pitch"],
      conversionPath: "Lead magnet → Nurture sequence → Discovery call → Offer"
    },
    actionPlan: {
      month1: [
        "Finalize messaging and positioning",
        "Set up primary marketing channel",
        "Create and publish lead magnet",
        "Establish content rhythm"
      ],
      month2: [
        "Consistent content creation",
        "Build engagement and community",
        "Refine based on what's working",
        "Expand to secondary channel if ready"
      ],
      month3: [
        "Optimize high-performing content",
        "Increase posting frequency if sustainable",
        "Launch first promotional campaign",
        "Measure and adjust strategy"
      ]
    },
    metrics: {
      leading: ["Content pieces published", "Engagement rate", "Outreach conversations"],
      lagging: ["New leads", "Discovery calls booked", "New clients", "Revenue from marketing"]
    }
  };
}

export default function MarketingPlanPage() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [planGenerated, setPlanGenerated] = useState(false);
  const [marketingPlan, setMarketingPlan] = useState<MarketingPlan | null>(null);
  const [showHint, setShowHint] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex) / questions.length) * 100;

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [answers, currentQuestionIndex, isTyping]);

  const handleSubmit = async () => {
    if (!currentAnswer.trim()) return;

    // Add user's answer
    const newAnswer: Answer = {
      questionId: currentQuestion.id,
      question: currentQuestion.text,
      answer: currentAnswer,
      timestamp: new Date()
    };

    setAnswers(prev => [...prev, newAnswer]);
    setCurrentAnswer("");
    setShowHint(false);

    // Show AI typing
    setIsTyping(true);
    
    // Simulate AI response time
    await new Promise(resolve => setTimeout(resolve, 800));
    
    setIsTyping(false);

    // Check for follow-up
    if (currentQuestion.followUp) {
      const followUpText = currentQuestion.followUp(currentAnswer);
      if (followUpText) {
        // Add follow-up as a system message
        setAnswers(prev => [...prev, {
          questionId: `followup-${currentQuestion.id}`,
          question: followUpText,
          answer: "",
          timestamp: new Date()
        }]);
        return; // Don't advance, wait for follow-up response
      }
    }

    // Advance to next question or generate plan
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Generate plan
      const plan = generateMarketingPlan([...answers, newAnswer]);
      setMarketingPlan(plan);
      setPlanGenerated(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const resetConversation = () => {
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setCurrentAnswer("");
    setPlanGenerated(false);
    setMarketingPlan(null);
    setShowHint(false);
  };

  if (planGenerated && marketingPlan) {
    return <MarketingPlanDashboard plan={marketingPlan} onReset={resetConversation} />;
  }

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-2rem)] flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-[#D4AF63]/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-[#D4AF63]" />
          </div>
          <div>
            <h1 className="text-2xl font-serif font-bold text-[#1F315B] dark:text-[#F6F1E8]">
              Marketing Plan Builder
            </h1>
            <p className="text-sm text-[#5E3B6C] dark:text-[#CDBED6]">
              A conversation to create your personalized marketing strategy
            </p>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-[#1F315B]/10 rounded-full h-2">
          <div 
            className="bg-[#D4AF63] h-2 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-[#B9A9A9] mt-1 text-right">
          Question {currentQuestionIndex + 1} of {questions.length}
        </p>
      </div>

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardContent className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Welcome Message */}
          {answers.length === 0 && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#1F315B] flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-[#D4AF63]" />
              </div>
              <div className="bg-[#1F315B]/5 dark:bg-[#CDBED6]/10 rounded-lg p-4 max-w-[80%]">
                <p className="text-[#1F315B] dark:text-[#F6F1E8]">
                  Hi! I'm here to help you build a marketing plan that actually works for your business. 
                  This will be a conversation—not a form. I'll ask you 15 questions, adapt based on your answers, 
                  and create a personalized strategy you can start using immediately.
                </p>
                <p className="text-[#5E3B6C] dark:text-[#CDBED6] mt-2">
                  Ready? Let's start with the first question...
                </p>
              </div>
            </div>
          )}

          {/* Previous Q&A */}
          {answers.map((answer, index) => (
            <div key={index} className="space-y-3">
              {/* AI Question */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#1F315B] flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-[#D4AF63]" />
                </div>
                <div className="bg-[#1F315B]/5 dark:bg-[#CDBED6]/10 rounded-lg p-4 max-w-[80%]">
                  <p className="text-[#1F315B] dark:text-[#F6F1E8]">{answer.question}</p>
                </div>
              </div>
              
              {/* User Answer */}
              {answer.answer && (
                <div className="flex items-start gap-3 justify-end">
                  <div className="bg-[#D4AF63]/20 rounded-lg p-4 max-w-[80%]">
                    <p className="text-[#1F315B] dark:text-[#F6F1E8]">{answer.answer}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#5E3B6C] flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">You</span>
                  </div>
                </div>
              )}

              {/* AI Response */}
              {index < answers.length - 1 && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#1F315B] flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-[#D4AF63]" />
                  </div>
                  <div className="bg-[#1F315B]/5 dark:bg-[#CDBED6]/10 rounded-lg p-4 max-w-[80%]">
                    <p className="text-[#5E3B6C] dark:text-[#CDBED6]">
                      {generateAIResponse(answer.questionId, answer.answer, answers)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Current Question */}
          {!planGenerated && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#1F315B] flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-[#D4AF63]" />
              </div>
              <div className="bg-[#1F315B]/5 dark:bg-[#CDBED6]/10 rounded-lg p-4 max-w-[80%]">
                <p className="text-[#1F315B] dark:text-[#F6F1E8] font-medium">
                  {currentQuestion.text}
                </p>
                {currentQuestion.hint && (
                  <button
                    onClick={() => setShowHint(!showHint)}
                    className="text-xs text-[#D4AF63] mt-2 flex items-center gap-1 hover:underline"
                  >
                    <Lightbulb className="w-3 h-3" />
                    {showHint ? "Hide hint" : "Need a hint?"}
                  </button>
                )}
                {showHint && currentQuestion.hint && (
                  <p className="text-xs text-[#B9A9A9] mt-2 italic">
                    💡 {currentQuestion.hint}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* AI Typing Indicator */}
          {isTyping && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#1F315B] flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-[#D4AF63]" />
              </div>
              <div className="bg-[#1F315B]/5 dark:bg-[#CDBED6]/10 rounded-lg p-4">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-[#D4AF63] rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-[#D4AF63] rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                  <div className="w-2 h-2 bg-[#D4AF63] rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </CardContent>

        {/* Input Area */}
        <div className="p-4 border-t border-[#1F315B]/10">
          {currentQuestion.type === "choice" ? (
            <div className="grid grid-cols-2 gap-2">
              {currentQuestion.options?.map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    setCurrentAnswer(option);
                    setTimeout(() => handleSubmit(), 100);
                  }}
                  className="p-3 text-left rounded-lg border border-[#1F315B]/10 hover:bg-[#1F315B]/5 hover:border-[#D4AF63]/50 transition-all text-sm text-[#1F315B] dark:text-[#F6F1E8]"
                >
                  {option}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex gap-2">
              {currentQuestion.type === "open" ? (
                <Textarea
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={currentQuestion.placeholder}
                  className="flex-1 min-h-[80px] resize-none"
                />
              ) : (
                <Input
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={currentQuestion.placeholder}
                  className="flex-1"
                />
              )}
              <Button 
                onClick={handleSubmit}
                disabled={!currentAnswer.trim() || isTyping}
                className="self-end"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

// Marketing Plan Dashboard Component
function MarketingPlanDashboard({ plan, onReset }: { plan: MarketingPlan; onReset: () => void }) {
  const [activeSection, setActiveSection] = useState("overview");

  const sections = [
    { id: "overview", label: "Overview", icon: Target },
    { id: "client", label: "Ideal Client", icon: Users },
    { id: "message", label: "Core Message", icon: MessageSquare },
    { id: "channels", label: "Channels", icon: TrendingUp },
    { id: "leads", label: "Lead Gen", icon: CheckCircle },
    { id: "action", label: "90-Day Plan", icon: Calendar },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#D4AF63]/20 flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-[#D4AF63]" />
          </div>
          <div>
            <h1 className="text-2xl font-serif font-bold text-[#1F315B] dark:text-[#F6F1E8]">
              Your Marketing Plan
            </h1>
            <p className="text-sm text-[#5E3B6C] dark:text-[#CDBED6]">
              Personalized strategy based on your answers
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onReset}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Start Over
          </Button>
          <Button>
            <Save className="w-4 h-4 mr-2" />
            Save Plan
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeSection === section.id
                  ? "bg-[#1F315B] text-[#F6F1E8]"
                  : "bg-[#1F315B]/5 text-[#1F315B] dark:text-[#CDBED6] hover:bg-[#1F315B]/10"
              }`}
            >
              <Icon className="w-4 h-4" />
              {section.label}
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {activeSection === "overview" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-[#D4AF63]" />
                  Executive Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-[#1F315B] dark:text-[#F6F1E8] mb-1">Positioning</h4>
                  <p className="text-[#5E3B6C] dark:text-[#CDBED6]">{plan.executiveSummary.positioning}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-[#1F315B] dark:text-[#F6F1E8] mb-1">Primary Goal</h4>
                  <p className="text-[#5E3B6C] dark:text-[#CDBED6]">{plan.executiveSummary.primaryGoal}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-[#1F315B] dark:text-[#F6F1E8] mb-1">Key Metric</h4>
                  <p className="text-[#5E3B6C] dark:text-[#CDBED6]">{plan.executiveSummary.keyMetric}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === "client" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#D4AF63]" />
                  Ideal Client Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-[#1F315B] dark:text-[#F6F1E8] mb-1">Description</h4>
                  <p className="text-[#5E3B6C] dark:text-[#CDBED6]">{plan.idealClient.description}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-[#1F315B] dark:text-[#F6F1E8] mb-2">Pain Points</h4>
                  <ul className="list-disc list-inside space-y-1 text-[#5E3B6C] dark:text-[#CDBED6]">
                    {plan.idealClient.painPoints.map((point, i) => (
                      <li key={i}>{point}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-[#1F315B] dark:text-[#F6F1E8] mb-2">Where to Find Them</h4>
                  <div className="flex flex-wrap gap-2">
                    {plan.idealClient.whereToFind.map((channel, i) => (
                      <span key={i} className="px-3 py-1 bg-[#D4AF63]/10 text-[#1F315B] dark:text-[#F6F1E8] rounded-full text-sm">
                        {channel}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === "message" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-[#D4AF63]" />
                  Core Message Framework
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-[#D4AF63]/10 rounded-lg p-4 border-l-4 border-[#D4AF63]">
                  <h4 className="font-semibold text-[#1F315B] dark:text-[#F6F1E8] mb-1">Tagline</h4>
                  <p className="text-lg text-[#1F315B] dark:text-[#F6F1E8] font-medium italic">
                    &quot;{plan.coreMessage.tagline}&quot;
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-[#1F315B] dark:text-[#F6F1E8] mb-2">Key Talking Points</h4>
                  <ul className="space-y-2">
                    {plan.coreMessage.talkingPoints.map((point, i) => (
                      <li key={i} className="flex items-start gap-2 text-[#5E3B6C] dark:text-[#CDBED6]">
                        <ChevronRight className="w-4 h-4 text-[#D4AF63] mt-0.5 flex-shrink-0" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-[#1F315B] dark:text-[#F6F1E8] mb-1">Your Story</h4>
                  <p className="text-[#5E3B6C] dark:text-[#CDBED6]">{plan.coreMessage.story}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === "channels" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#D4AF63]" />
                  Channel Strategy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-[#1F315B] dark:text-[#F6F1E8] mb-2">Primary Channels</h4>
                  <div className="flex flex-wrap gap-2">
                    {plan.channelStrategy.primary.map((channel, i) => (
                      <span key={i} className="px-3 py-1 bg-[#5E3B6C] text-[#F6F1E8] rounded-full text-sm">
                        {channel}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-[#1F315B] dark:text-[#F6F1E8] mb-2">Content Types</h4>
                  <div className="flex flex-wrap gap-2">
                    {plan.channelStrategy.contentTypes.map((type, i) => (
                      <span key={i} className="px-3 py-1 bg-[#2E7C83]/20 text-[#1F315B] dark:text-[#F6F1E8] rounded-full text-sm">
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-[#1F315B] dark:text-[#F6F1E8] mb-1">Posting Frequency</h4>
                  <p className="text-[#5E3B6C] dark:text-[#CDBED6]">{plan.channelStrategy.frequency}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-[#1F315B] dark:text-[#F6F1E8] mb-2">First 30 Days</h4>
                  <ul className="space-y-2">
                    {plan.channelStrategy.first30Days.map((action, i) => (
                      <li key={i} className="flex items-start gap-2 text-[#5E3B6C] dark:text-[#CDBED6]">
                        <span className="w-5 h-5 rounded-full bg-[#D4AF63] text-[#1F315B] text-xs flex items-center justify-center flex-shrink-0">
                          {i + 1}
                        </span>
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === "leads" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-[#D4AF63]" />
                  Lead Generation System
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-[#1F315B]/5 rounded-lg p-4">
                  <h4 className="font-semibold text-[#1F315B] dark:text-[#F6F1E8] mb-1">Lead Magnet</h4>
                  <p className="text-[#5E3B6C] dark:text-[#CDBED6]">{plan.leadGeneration.leadMagnet}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-[#1F315B] dark:text-[#F6F1E8] mb-2">Nurture Sequence</h4>
                  <div className="space-y-2">
                    {plan.leadGeneration.nurtureSequence.map((email, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-[#2E7C83] text-white text-xs flex items-center justify-center">
                          {i + 1}
                        </span>
                        <span className="text-[#5E3B6C] dark:text-[#CDBED6]">{email}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-[#1F315B] dark:text-[#F6F1E8] mb-1">Conversion Path</h4>
                  <p className="text-[#5E3B6C] dark:text-[#CDBED6]">{plan.leadGeneration.conversionPath}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === "action" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#D4AF63]" />
                  90-Day Action Plan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="border-l-4 border-[#5E3B6C] pl-4">
                  <h4 className="font-semibold text-[#1F315B] dark:text-[#F6F1E8] mb-2">Month 1: Foundation</h4>
                  <ul className="space-y-2">
                    {plan.actionPlan.month1.map((action, i) => (
                      <li key={i} className="flex items-start gap-2 text-[#5E3B6C] dark:text-[#CDBED6]">
                        <CheckCircle className="w-4 h-4 text-[#5E3B6C] mt-0.5 flex-shrink-0" />
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="border-l-4 border-[#2E7C83] pl-4">
                  <h4 className="font-semibold text-[#1F315B] dark:text-[#F6F1E8] mb-2">Month 2: Consistency</h4>
                  <ul className="space-y-2">
                    {plan.actionPlan.month2.map((action, i) => (
                      <li key={i} className="flex items-start gap-2 text-[#5E3B6C] dark:text-[#CDBED6]">
                        <CheckCircle className="w-4 h-4 text-[#2E7C83] mt-0.5 flex-shrink-0" />
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="border-l-4 border-[#D4AF63] pl-4">
                  <h4 className="font-semibold text-[#1F315B] dark:text-[#F6F1E8] mb-2">Month 3: Optimization</h4>
                  <ul className="space-y-2">
                    {plan.actionPlan.month3.map((action, i) => (
                      <li key={i} className="flex items-start gap-2 text-[#5E3B6C] dark:text-[#CDBED6]">
                        <CheckCircle className="w-4 h-4 text-[#D4AF63] mt-0.5 flex-shrink-0" />
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#D4AF63]" />
                Metrics to Track
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-[#1F315B] dark:text-[#F6F1E8] mb-2 uppercase tracking-wide">
                  Leading Indicators
                </h4>
                <ul className="space-y-1">
                  {plan.metrics.leading.map((metric, i) => (
                    <li key={i} className="text-sm text-[#5E3B6C] dark:text-[#CDBED6] flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#2E7C83]" />
                      {metric}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-[#1F315B] dark:text-[#F6F1E8] mb-2 uppercase tracking-wide">
                  Lagging Indicators
                </h4>
                <ul className="space-y-1">
                  {plan.metrics.lagging.map((metric, i) => (
                    <li key={i} className="text-sm text-[#5E3B6C] dark:text-[#CDBED6] flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF63]" />
                      {metric}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#1F315B] to-[#5E3B6C] text-[#F6F1E8]">
            <CardContent className="p-6">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#D4AF63]" />
                Need Help?
              </h4>
              <p className="text-sm text-[#CDBED6] mb-4">
                Questions about implementing your plan? Ask Brujula for guidance.
              </p>
              <Button variant="outline" className="w-full border-[#D4AF63] text-[#D4AF63] hover:bg-[#D4AF63] hover:text-[#1F315B]">
                <MessageSquare className="w-4 h-4 mr-2" />
                Ask Brujula
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h4 className="font-semibold text-[#1F315B] dark:text-[#F6F1E8] mb-2">Quick Actions</h4>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start text-left">
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit Plan
                </Button>
                <Button variant="outline" className="w-full justify-start text-left">
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule Actions
                </Button>
                <Button variant="outline" className="w-full justify-start text-left">
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Export PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}