"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Sparkles, ArrowRight, Send, Loader2, X } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  suggestions?: string[];
}

interface AIBusinessGuideProps {
  brainScore?: number;
  soulScore?: number;
  profitScore?: number;
  overallScore?: number;
}

export function AIBusinessGuide({
  brainScore,
  soulScore,
  profitScore,
  overallScore,
}: AIBusinessGuideProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initial welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: getInitialMessage(overallScore),
          suggestions: getInitialSuggestions(brainScore, soulScore, profitScore),
        },
      ]);
    }
  }, [brainScore, soulScore, profitScore, overallScore]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getInitialMessage = (score?: number) => {
    if (score === undefined) {
      return "I'm your AI Business Guide. I can help you navigate challenges, prioritize your focus, and grow your business with alignment. What would you like guidance on today?";
    }
    if (score >= 81) {
      return "You're in a strong position to grow. Strengthen your systems and cash flow predictability to move into Expansion. What would you like to focus on?";
    } else if (score >= 61) {
      return "You're building solid foundations. Focus on systematizing what's working and clarifying your next growth phase. How can I help you today?";
    } else if (score >= 31) {
      return "You're in the building phase. Let's identify the highest-impact areas to strengthen your foundation. What feels most urgent right now?";
    } else {
      return "You're in Survival Mode, and that's okay. Every thriving business started here. Let's identify the one thing that will create the most stability. What's your biggest challenge?";
    }
  };

  const getInitialSuggestions = (
    brain?: number,
    soul?: number,
    profit?: number
  ): string[] => {
    const suggestions: string[] = [];

    if (brain !== undefined && brain < 50) {
      suggestions.push("Document your core processes");
    }
    if (soul !== undefined && soul < 50) {
      suggestions.push("Reconnect with your mission");
    }
    if (profit !== undefined && profit < 50) {
      suggestions.push("Review pricing and cash flow");
    }

    if (suggestions.length === 0) {
      suggestions.push(
        "Improve cash flow forecasting",
        "Document and automate key processes",
        "Nurture warm leads into paying clients"
      );
    }

    return suggestions.slice(0, 3);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/ai-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          brainScore,
          soulScore,
          profitScore,
          overallScore,
          context: "User is viewing their business dashboard and seeking guidance.",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
        suggestions: data.suggestions,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "I'm having trouble connecting right now. Please try again in a moment.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickAsk = (question: string) => {
    setInput(question);
    // Small delay to let the input update
    setTimeout(() => {
      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: question,
      };
      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setLoading(true);

      fetch("/api/ai-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: question,
          brainScore,
          soulScore,
          profitScore,
          overallScore,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: data.response,
            suggestions: data.suggestions,
          };
          setMessages((prev) => [...prev, assistantMessage]);
        })
        .catch(() => {
          const errorMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: "I'm having trouble connecting. Please try again.",
          };
          setMessages((prev) => [...prev, errorMessage]);
        })
        .finally(() => setLoading(false));
    }, 10);
  };

  // Collapsed view
  if (!isOpen) {
    return (
      <Card className="h-full border-[#D4AF63]/30 relative overflow-hidden">
        {/* Decorative watercolor background effect */}
        <div className="absolute top-0 right-0 w-48 h-48 opacity-10 pointer-events-none">
          <svg viewBox="0 0 200 200" className="w-full h-full text-[#2E7C83]">
            <path
              fill="currentColor"
              d="M44.5,-76.3C58.9,-69.3,72.4,-59.6,82.9,-47.2C93.4,-34.8,100.9,-19.7,100.3,-5.1C99.7,9.5,91,23.6,80.8,35.3C70.6,47,58.9,56.3,46.2,63.6C33.5,70.9,19.8,76.2,5.3,78.8C-9.2,81.4,-24.5,81.3,-38.3,76.3C-52.1,71.3,-64.4,61.4,-73.6,49.1C-82.8,36.8,-88.9,22.1,-89.4,7.2C-89.9,-7.7,-84.8,-22.8,-76.3,-35.8C-67.8,-48.8,-55.9,-59.7,-42.5,-67.2C-29.1,-74.7,-14.6,-78.8,0.7,-80.1C15.9,-81.4,31.8,-80,44.5,-76.3Z"
              transform="translate(100 100)"
            />
          </svg>
        </div>

        <CardContent className="p-6 relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-[#D4AF63]" />
            <h2 className="text-xs font-semibold tracking-wider uppercase text-[#5E3B6C] dark:text-[#CDBED6]">
              AI Business Guide
            </h2>
          </div>

          {/* Butterfly emblem */}
          <div className="absolute top-4 right-4">
            <svg
              viewBox="0 0 24 24"
              className="w-10 h-10 text-[#D4AF63]/30"
              fill="currentColor"
            >
              <circle
                cx="12"
                cy="12"
                r="11"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              />
              <path d="M12 4C12 4 11 6 11 8C11 10 12 12 12 12C12 12 13 10 13 8C13 6 12 4 12 4Z" />
              <path d="M7 8C7 8 3 6 1 10C-1 14 3 18 7 16C7 16 5 12 7 8Z" />
              <path d="M17 8C17 8 21 6 23 10C25 14 21 18 17 16C17 16 19 12 17 8Z" />
              <path d="M12 12C12 12 8 16 8 20C8 24 12 24 12 24C12 24 16 24 16 20C16 16 12 12 12 12Z" />
            </svg>
          </div>

          <p className="text-[#1F315B] dark:text-[#F6F1E8] font-medium mb-6 leading-relaxed">
            {messages[0]?.content || getInitialMessage(overallScore)}
          </p>

          {messages[0]?.suggestions && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-[#5E3B6C] dark:text-[#CDBED6] mb-3">
                Suggested Focus
              </h3>
              <ul className="space-y-2">
                {messages[0].suggestions.map((suggestion, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-sm text-[#1F315B]/80 dark:text-[#F6F1E8]/80"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2E7C83] mt-2 flex-shrink-0" />
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Button variant="primary" className="w-full" onClick={() => setIsOpen(true)}>
              <Sparkles className="w-4 h-4 mr-2" />
              Ask AI Guide
            </Button>
            <button
              onClick={() => setIsOpen(true)}
              className="text-sm text-[#5E3B6C] dark:text-[#CDBED6] hover:text-[#1F315B] dark:hover:text-[#F6F1E8] flex items-center justify-center gap-1 transition-colors"
            >
              View full recommendations
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </CardContent>

        {/* Decorative corner ornament */}
        <div className="absolute bottom-0 left-0 w-16 h-16 opacity-20 pointer-events-none">
          <svg viewBox="0 0 100 100" className="w-full h-full text-[#D4AF63]">
            <path
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              d="M0,100 Q30,70 50,50 T100,0 M20,100 Q40,80 60,60 M0,80 Q25,60 40,40"
            />
          </svg>
        </div>
      </Card>
    );
  }

  // Expanded chat view
  return (
    <Card className="h-full border-[#D4AF63]/30 relative overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[#D4AF63]/20 flex items-center justify-between bg-[#F6F1E8]/30 dark:bg-[#1F315B]/20">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#D4AF63]" />
          <h2 className="text-sm font-semibold text-[#5E3B6C] dark:text-[#CDBED6]">
            AI Business Guide
          </h2>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-[#B9A9A9] hover:text-[#1F315B] dark:hover:text-[#F6F1E8] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-4 py-2.5 text-sm ${
                message.role === "user"
                  ? "bg-[#2E7C83] text-white"
                  : "bg-[#F6F1E8] dark:bg-[#1F315B]/40 text-[#1F315B] dark:text-[#F6F1E8]"
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>

              {/* Suggestions */}
              {message.suggestions && message.suggestions.length > 0 && (
                <div className="mt-3 pt-3 border-t border-[#D4AF63]/20">
                  <p className="text-xs font-medium mb-2 opacity-70">Quick actions:</p>
                  <div className="flex flex-wrap gap-2">
                    {message.suggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => quickAsk(`Tell me more about: ${suggestion}`)}
                        className="text-xs px-2 py-1 rounded-full bg-[#D4AF63]/20 hover:bg-[#D4AF63]/30 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-[#F6F1E8] dark:bg-[#1F315B]/40 rounded-lg px-4 py-3">
              <Loader2 className="w-4 h-4 animate-spin text-[#2E7C83]" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </CardContent>

      {/* Input */}
      <div className="p-4 border-t border-[#D4AF63]/20 bg-white dark:bg-[#1F315B]/10">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask for guidance..."
            className="flex-1 px-4 py-2 text-sm border border-[#D4AF63]/30 rounded-lg bg-white dark:bg-[#1F315B] text-[#1F315B] dark:text-[#F6F1E8] placeholder-[#B9A9A9] focus:outline-none focus:ring-2 focus:ring-[#2E7C83]"
            disabled={loading}
          />
          <Button
            variant="primary"
            size="sm"
            onClick={sendMessage}
            disabled={!input.trim() || loading}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-[#B9A9A9] mt-2 text-center">
          AI guidance is for informational purposes. Trust your own wisdom for final decisions.
        </p>
      </div>
    </Card>
  );
}