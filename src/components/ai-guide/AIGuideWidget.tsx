"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Bot,
  X,
  Send,
  Mic,
  MicOff,
  ChevronUp,
  ChevronDown,
  Sparkles,
  MessageSquare,
  Settings,
  History,
  Plus
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  pageContext?: string;
}

interface QuickAction {
  id: string;
  label: string;
  prompt: string;
}

// Page-specific context and suggestions
const pageContexts: Record<string, { label: string; suggestions: QuickAction[] }> = {
  "/": {
    label: "Overview",
    suggestions: [
      { id: "1", label: "What's my business health?", prompt: "Analyze my overall business health score and suggest priorities" },
      { id: "2", label: "Review my domains", prompt: "Help me understand which business domains need attention" },
      { id: "3", label: "Next steps", prompt: "What should I focus on next based on my current progress?" }
    ]
  },
  "/business-plan": {
    label: "Business Plan",
    suggestions: [
      { id: "1", label: "Refine value prop", prompt: "Help me refine my value proposition" },
      { id: "2", label: "Analyze competition", prompt: "Analyze my competitive positioning" },
      { id: "3", label: "Revenue model ideas", prompt: "Suggest revenue model improvements" }
    ]
  },
  "/marketing-plan": {
    label: "Marketing Plan",
    suggestions: [
      { id: "1", label: "Content ideas", prompt: "Generate content ideas for my ideal client" },
      { id: "2", label: "Channel strategy", prompt: "Optimize my marketing channel strategy" },
      { id: "3", label: "Messaging help", prompt: "Improve my core messaging" }
    ]
  },
  "/sales": {
    label: "Sales",
    suggestions: [
      { id: "1", label: "Pipeline review", prompt: "Review my sales pipeline health" },
      { id: "2", label: "Offer optimization", prompt: "Suggest improvements to my offers" },
      { id: "3", label: "Closing tactics", prompt: "Help me improve my closing rate" }
    ]
  },
  "/finance": {
    label: "Finance",
    suggestions: [
      { id: "1", label: "Expense analysis", prompt: "Analyze my expenses for savings opportunities" },
      { id: "2", label: "Cash flow tips", prompt: "Suggest cash flow improvements" },
      { id: "3", label: "Tech stack review", prompt: "Review my tech stack for optimization" }
    ]
  },
  "/operations": {
    label: "Operations",
    suggestions: [
      { id: "1", label: "Onboarding help", prompt: "Improve my customer onboarding process" },
      { id: "2", label: "SOP creation", prompt: "Help me document key SOPs" },
      { id: "3", label: "Referral strategy", prompt: "Build a better referral program" }
    ]
  },
  "/assessments": {
    label: "Assessments",
    suggestions: [
      { id: "1", label: "Explain results", prompt: "Explain my assessment results" },
      { id: "2", label: "Action items", prompt: "What are my priority action items?" },
      { id: "3", label: "Track progress", prompt: "Help me track my progress over time" }
    ]
  }
};

export default function AIGuideWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const currentContext = pageContexts[pathname] || { label: "General", suggestions: [] };

  // Load messages from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(`ai-guide-messages-${pathname}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      setMessages(parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
    }
  }, [pathname]);

  // Save messages to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(`ai-guide-messages-${pathname}`, JSON.stringify(messages));
    }
  }, [messages, pathname]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (content: string = inputValue) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
      pageContext: currentContext.label
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setShowSuggestions(false);
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: generateAIResponse(content, currentContext.label),
        timestamp: new Date(),
        pageContext: currentContext.label
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const generateAIResponse = (userMessage: string, context: string): string => {
    // Placeholder AI responses - in production, this would call the actual API
    const responses: Record<string, string[]> = {
      "Overview": [
        "Based on your business data, I recommend focusing on your Marketing Plan next. Your Business Plan is 75% complete, which is excellent!",
        "Your overall business health is strong at 82%. The main area for improvement is Operations - specifically your onboarding process.",
        "Looking at your 12 domains, I see strong performance in Vision and Finance. Consider giving more attention to Marketing Systems."
      ],
      "Business Plan": [
        "Your value proposition is solid! Consider adding more specific outcomes for your ideal client. What transformation do they experience?",
        "For competitive positioning, focus on what makes LifeCharter unique - the spiritual + practical integration is your differentiator.",
        "Your revenue model looks diversified. Have you considered adding a high-ticket mastermind tier?"
      ],
      "Marketing Plan": [
        "For content ideas, consider creating 'day in the life' stories showing alignment in action. Your audience craves authenticity.",
        "Your channel strategy should prioritize where your ideal client already spends time. Based on your profile, LinkedIn and Instagram are strong bets.",
        "For messaging, lead with the transformation: 'Move from fear and overwhelm to clarity and aligned action.'"
      ],
      "Sales": [
        "Your pipeline shows good top-of-funnel activity. Focus on improving your qualification process to increase close rates.",
        "Consider adding a 'strategy session' offer between your free workshop and Circle membership. This bridges the gap nicely.",
        "Your offers are well-structured. Test adding payment plans to remove price objections."
      ],
      "Finance": [
        "I analyzed your expenses - you could save $200/month by consolidating your project management tools (Notion + Asana).",
        "Your cash flow looks healthy. Consider setting aside 3 months of operating expenses as a buffer.",
        "QuickBooks has a 50% off offer for 6 months. Would you like me to help you claim it?"
      ],
      "Operations": [
        "Your onboarding completion rate is 78%. Adding a Day 3 check-in could push this to 90%.",
        "For SOPs, start with your top 3: client onboarding, content publishing, and sales follow-up.",
        "Your referral rate is above average! Formalize an advocate program with tiered rewards."
      ]
    };

    const contextResponses = responses[context] || ["I'm here to help! What would you like to know about your business?"];
    return contextResponses[Math.floor(Math.random() * contextResponses.length)];
  };

  const handleVoiceInput = () => {
    if (!isRecording) {
      setIsRecording(true);
      // Simulate voice recording
      setTimeout(() => {
        setIsRecording(false);
        handleSend("Help me analyze my current page");
      }, 2000);
    } else {
      setIsRecording(false);
    }
  };

  const clearConversation = () => {
    setMessages([]);
    localStorage.removeItem(`ai-guide-messages-${pathname}`);
    setShowSuggestions(true);
  };

  // Don't show on AI Guide settings page
  if (pathname === "/ai-guide") return null;

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-[#1F315B] to-[#5E3B6C] text-[#F6F1E8] shadow-lg hover:shadow-xl transition-all hover:scale-105 z-50 flex items-center justify-center"
        >
          <Bot className="w-7 h-7" />
        </button>
      )}

      {/* Chat Widget */}
      {isOpen && (
        <div
          className={`fixed right-6 bottom-6 bg-white dark:bg-[#1F315B] rounded-2xl shadow-2xl z-50 transition-all duration-300 overflow-hidden ${
            isExpanded
              ? "w-[500px] h-[600px]"
              : "w-[380px] h-[500px]"
          }`}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#1F315B] to-[#5E3B6C] text-[#F6F1E8] p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#D4AF63]/20 flex items-center justify-center">
                <Bot className="w-5 h-5 text-[#D4AF63]" />
              </div>
              <div>
                <h3 className="font-semibold">AI Guide</h3>
                <p className="text-xs text-[#CDBED6]">Context: {currentContext.label}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
              <Link href="/ai-guide">
                <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <Settings className="w-4 h-4" />
                </button>
              </Link>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 h-[calc(100%-140px)] bg-[#F6F1E8]/50 dark:bg-[#1F315B]/50">
            {messages.length === 0 && showSuggestions && (
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#D4AF63]/20 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-[#D4AF63]" />
                  </div>
                  <div className="bg-white dark:bg-[#2a3a5c] rounded-lg p-3 shadow-sm">
                    <p className="text-sm text-[#1F315B] dark:text-[#F6F1E8]">
                      Hi! I&apos;m your AI Guide. I can help you with {currentContext.label.toLowerCase()} questions. 
                      What would you like to explore?
                    </p>
                  </div>
                </div>

                {/* Quick Actions */}
                {currentContext.suggestions.length > 0 && (
                  <div className="ml-11 space-y-2">
                    <p className="text-xs text-[#B9A9A9] mb-2">Quick suggestions:</p>
                    {currentContext.suggestions.map((action) => (
                      <button
                        key={action.id}
                        onClick={() => handleSend(action.prompt)}
                        className="w-full text-left p-3 bg-white dark:bg-[#2a3a5c] rounded-lg border border-[#1F315B]/10 hover:border-[#D4AF63]/50 transition-colors text-sm text-[#1F315B] dark:text-[#F6F1E8]"
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start gap-3 mb-4 ${
                  message.role === "user" ? "flex-row-reverse" : ""
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.role === "user"
                      ? "bg-[#2E7C83]/20"
                      : "bg-[#D4AF63]/20"
                  }`}
                >
                  {message.role === "user" ? (
                    <MessageSquare className="w-4 h-4 text-[#2E7C83]" />
                  ) : (
                    <Bot className="w-4 h-4 text-[#D4AF63]" />
                  )}
                </div>
                <div
                  className={`rounded-lg p-3 shadow-sm max-w-[80%] ${
                    message.role === "user"
                      ? "bg-[#2E7C83] text-white"
                      : "bg-white dark:bg-[#2a3a5c] text-[#1F315B] dark:text-[#F6F1E8]"
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className="text-xs opacity-60 mt-1">
                    {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-[#D4AF63]/20 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-[#D4AF63]" />
                </div>
                <div className="bg-white dark:bg-[#2a3a5c] rounded-lg p-3 shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-[#D4AF63] rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-[#D4AF63] rounded-full animate-bounce delay-100" />
                    <span className="w-2 h-2 bg-[#D4AF63] rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white dark:bg-[#1F315B] border-t border-[#1F315B]/10">
            {messages.length > 0 && (
              <div className="flex justify-between items-center mb-2">
                <button
                  onClick={clearConversation}
                  className="text-xs text-[#B9A9A9] hover:text-red-500 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3 rotate-45" />
                  New conversation
                </button>
                <Link href="/ai-guide" className="text-xs text-[#D4AF63] hover:underline">
                  View all history
                </Link>
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={handleVoiceInput}
                className={`p-3 rounded-lg transition-colors ${
                  isRecording
                    ? "bg-red-500 text-white animate-pulse"
                    : "bg-[#1F315B]/5 hover:bg-[#1F315B]/10 text-[#1F315B] dark:text-[#F6F1E8]"
                }`}
              >
                {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
              <Input
                placeholder="Ask me anything..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSend()}
                className="flex-1"
              />
              <Button
                onClick={() => handleSend()}
                disabled={!inputValue.trim() || isLoading}
                size="icon"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
