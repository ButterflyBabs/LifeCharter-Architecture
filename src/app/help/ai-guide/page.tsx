"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  ArrowLeft,
  Bot,
  Sparkles,
  MessageSquare,
  Settings,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Target,
  Zap,
  Shield,
  Lock,
  History,
  Mic,
  Plus
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface FAQItem {
  question: string;
  answer: string | React.ReactNode;
}

export default function AIGuideHelpPage() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  const faqs: FAQItem[] = [
    {
      question: "What is the AI Business Guide?",
      answer: "The AI Business Guide is your intelligent assistant integrated throughout the LifeCharter Architecture platform. It provides context-aware guidance, answers your questions about any business domain, and offers personalized recommendations based on your specific situation. Unlike generic AI chatbots, it understands your business data and can reference your assessments, plans, and progress."
    },
    {
      question: "How is the AI Guide different from other AI assistants?",
      answer: (
        <div className="space-y-2">
          <p>The AI Business Guide is uniquely designed for your LifeCharter journey:</p>
          <ul className="list-disc pl-5 space-y-1 text-[#5E3B6C] dark:text-[#CDBED6]">
            <li><strong>Context-Aware:</strong> Knows which page you're on and what you're working on</li>
            <li><strong>Business-Integrated:</strong> Can reference your assessments, scores, and plans</li>
            <li><strong>Domain-Specific:</strong> Understands the 12-domain business alignment framework</li>
            <li><strong>Action-Oriented:</strong> Provides specific next steps, not just general advice</li>
            <li><strong>Privacy-First:</strong> Your data stays yours; conversations are private</li>
          </ul>
        </div>
      )
    },
    {
      question: "How do I access the AI Guide?",
      answer: (
        <div className="space-y-2">
          <p>You can access the AI Guide in two ways:</p>
          <ol className="list-decimal pl-5 space-y-1 text-[#5E3B6C] dark:text-[#CDBED6]">
            <li><strong>Floating Widget:</strong> Look for the Bot icon in the bottom-right corner of any page. Click it to open the chat panel.</li>
            <li><strong>AI Guide Settings:</strong> Click "AI Guide" in the left sidebar to configure your preferences, API keys, and view conversation history.</li>
          </ol>
        </div>
      )
    },
    {
      question: "What can I ask the AI Guide?",
      answer: (
        <div className="space-y-2">
          <p>The AI Guide can help with virtually any business question, including:</p>
          <ul className="list-disc pl-5 space-y-1 text-[#5E3B6C] dark:text-[#CDBED6]">
            <li>"Analyze my business health score and suggest priorities"</li>
            <li>"Help me refine my value proposition"</li>
            <li>"What content should I create for my ideal client?"</li>
            <li>"Review my sales pipeline and identify bottlenecks"</li>
            <li>"Suggest ways to reduce my tech stack expenses"</li>
            <li>"How can I improve my customer onboarding?"</li>
            <li>"What should I focus on next?"</li>
          </ul>
        </div>
      )
    },
    {
      question: "How does the AI Guide know which page I'm on?",
      answer: "The AI Guide automatically detects your current location in the platform. When you're on the Business Plan page, it knows you're working on business strategy. On the Finance page, it understands you're analyzing financials. This context allows it to provide relevant suggestions and understand your questions in the proper context. The current page name appears at the top of the chat panel."
    },
    {
      question: "Can I use voice to talk to the AI Guide?",
      answer: "Yes! The AI Guide supports voice input. Click the microphone icon in the chat input area to speak your question instead of typing. Your speech will be transcribed and sent as a message. You can enable or disable voice input in the AI Guide settings. Note: Voice input requires microphone permissions in your browser."
    },
    {
      question: "What are Quick Suggestions?",
      answer: (
        <div className="space-y-2">
          <p>Quick Suggestions are context-aware buttons that appear when you open the AI Guide on a specific page. They offer common questions or actions relevant to that page:</p>
          <ul className="list-disc pl-5 space-y-1 text-[#5E3B6C] dark:text-[#CDBED6]">
            <li>On Business Plan: "Refine value prop," "Analyze competition"</li>
            <li>On Marketing Plan: "Content ideas," "Channel strategy"</li>
            <li>On Finance: "Expense analysis," "Cash flow tips"</li>
          </ul>
          <p>Clicking a suggestion instantly sends that question to the AI Guide.</p>
        </div>
      )
    },
    {
      question: "How do I connect my own AI API keys?",
      answer: (
        <div className="space-y-2">
          <p>To use your own AI provider:</p>
          <ol className="list-decimal pl-5 space-y-1 text-[#5E3B6C] dark:text-[#CDBED6]">
            <li>Go to AI Guide → API Keys tab in the sidebar</li>
            <li>Select your preferred provider (OpenAI, Anthropic, Moonshot, Google)</li>
            <li>Choose the model you want to use</li>
            <li>Enter your API key (stored securely and encrypted)</li>
            <li>Click "Save API Key"</li>
          </ol>
          <p>You can add multiple keys and switch between them. The active key will be used for all AI Guide conversations.</p>
        </div>
      )
    },
    {
      question: "Is my data and conversation history private?",
      answer: (
        <div className="space-y-2">
          <p className="font-medium text-[#2E7C83]">Yes, your privacy is our priority:</p>
          <ul className="list-disc pl-5 space-y-1 text-[#5E3B6C] dark:text-[#CDBED6]">
            <li>Your API keys are encrypted and never shared</li>
            <li>Conversations are stored locally in your browser (localStorage)</li>
            <li>We don't store your messages on our servers</li>
            <li>When you use your own API key, the provider's privacy policy applies</li>
            <li>You can clear conversation history anytime</li>
          </ul>
        </div>
      )
    },
    {
      question: "Can I change AI models mid-conversation?",
      answer: "Currently, the model is set at the start of each conversation. To switch models, you can start a new conversation by clicking the 'New conversation' button in the chat panel, then change your default model in the AI Guide settings. Future updates will allow mid-conversation model switching."
    },
    {
      question: "Does the AI Guide remember past conversations?",
      answer: "Yes, the AI Guide maintains conversation history per page. When you return to a page, you'll see your previous conversation with that page's AI Guide. You can view all conversation history from the AI Guide → History tab. Conversations are stored locally in your browser and persist until you clear them."
    },
    {
      question: "What if the AI Guide gives incorrect information?",
      answer: (
        <div className="space-y-2">
          <p>While the AI Guide is designed to be helpful and accurate, it's important to remember:</p>
          <ul className="list-disc pl-5 space-y-1 text-[#5E3B6C] dark:text-[#CDBED6]">
            <li>AI can make mistakes—always verify important business decisions</li>
            <li>The AI doesn't have access to real-time data unless you provide it</li>
            <li>Use AI suggestions as starting points, not final answers</li>
            <li>For legal, financial, or critical decisions, consult qualified professionals</li>
          </ul>
          <p>If you encounter issues, you can always start a new conversation or adjust your question for clarity.</p>
        </div>
      )
    },
    {
      question: "How do I clear my conversation history?",
      answer: (
        <div className="space-y-2">
          <p>To clear conversations:</p>
          <ol className="list-decimal pl-5 space-y-1 text-[#5E3B6C] dark:text-[#CDBED6]">
            <li>Open the AI Guide chat panel on any page</li>
            <li>Click "New conversation" to clear the current page's chat</li>
            <li>Or go to AI Guide → History to see and manage all conversations</li>
            <li>To disable history entirely, turn off "Save conversation history" in Settings</li>
          </ol>
        </div>
      )
    },
    {
      question: "Can I export my AI Guide conversations?",
      answer: "Currently, conversation export is not available, but it's on our roadmap. For now, you can manually copy important insights from conversations. We recommend documenting key recommendations in your Business Plan or relevant sections of the platform."
    },
    {
      question: "What happens if my API key runs out of credits?",
      answer: "If your API key has insufficient credits or expires, the AI Guide will display an error message. You'll need to add a new API key or update your existing one in the AI Guide → API Keys settings. The platform will notify you when there's an issue with your API connection."
    }
  ];

  return (
    <div className="py-8 px-4 max-w-4xl mx-auto">
      {/* Back Navigation */}
      <Link href="/help" className="flex items-center gap-2 text-[#5E3B6C] hover:text-[#1F315B] mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to Help Center
      </Link>

      {/* Hero Section */}
      <div className="text-center mb-10">
        <div className="w-16 h-16 rounded-full bg-[#D4AF63]/20 flex items-center justify-center mx-auto mb-4">
          <Bot className="w-8 h-8 text-[#D4AF63]" />
        </div>
        <h1 className="text-3xl font-bold text-[#1F315B] dark:text-[#F6F1E8] mb-3">
          AI Business Guide
        </h1>
        <p className="text-lg text-[#B9A9A9] max-w-2xl mx-auto">
          Your intelligent companion for business alignment and growth
        </p>
      </div>

      {/* What is AI Business Guide */}
      <Card className="mb-8 border-[#D4AF63]/30">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#D4AF63]" />
            What is the AI Business Guide?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-[#1F315B] dark:text-[#F6F1E8] leading-relaxed">
            The <strong>AI Business Guide</strong> is an intelligent assistant embedded throughout the LifeCharter Architecture platform. 
            Unlike generic AI chatbots, it understands your business context, references your assessments and plans, 
            and provides personalized guidance tailored to your specific situation.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="p-4 bg-[#1F315B]/5 rounded-lg text-center">
              <div className="w-10 h-10 rounded-full bg-[#2E7C83]/20 flex items-center justify-center mx-auto mb-2">
                <Target className="w-5 h-5 text-[#2E7C83]" />
              </div>
              <h3 className="font-semibold text-[#1F315B] dark:text-[#F6F1E8] mb-1">Context-Aware</h3>
              <p className="text-sm text-[#B9A9A9]">Knows which page you're on and what you're working on</p>
            </div>
            <div className="p-4 bg-[#1F315B]/5 rounded-lg text-center">
              <div className="w-10 h-10 rounded-full bg-[#5E3B6C]/20 flex items-center justify-center mx-auto mb-2">
                <Lightbulb className="w-5 h-5 text-[#5E3B6C]" />
              </div>
              <h3 className="font-semibold text-[#1F315B] dark:text-[#F6F1E8] mb-1">Intelligent</h3>
              <p className="text-sm text-[#B9A9A9]">References your business data for personalized advice</p>
            </div>
            <div className="p-4 bg-[#1F315B]/5 rounded-lg text-center">
              <div className="w-10 h-10 rounded-full bg-[#D4AF63]/20 flex items-center justify-center mx-auto mb-2">
                <Zap className="w-5 h-5 text-[#D4AF63]" />
              </div>
              <h3 className="font-semibold text-[#1F315B] dark:text-[#F6F1E8] mb-1">Actionable</h3>
              <p className="text-sm text-[#B9A9A9]">Provides specific next steps, not generic advice</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#D4AF63]" />
            How It Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#2E7C83] text-white flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold text-[#1F315B] dark:text-[#F6F1E8]">Access Anywhere</h3>
                <p className="text-[#B9A9A9] text-sm mt-1">
                  The AI Guide appears as a floating widget on every page. Click the Bot icon to open the chat panel.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#2E7C83] text-white flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold text-[#1F315B] dark:text-[#F6F1E8]">Ask Questions</h3>
                <p className="text-[#B9A9A9] text-sm mt-1">
                  Type or speak your questions. The AI understands context from your current page and business data.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#2E7C83] text-white flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold text-[#1F315B] dark:text-[#F6F1E8]">Get Personalized Guidance</h3>
                <p className="text-[#B9A9A9] text-sm mt-1">
                  Receive tailored recommendations, analysis, and actionable next steps specific to your business.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#2E7C83] text-white flex items-center justify-center font-bold">
                4
              </div>
              <div>
                <h3 className="font-semibold text-[#1F315B] dark:text-[#F6F1E8]">Configure Your Way</h3>
                <p className="text-[#B9A9A9] text-sm mt-1">
                  Use your own API keys, choose your preferred AI model, and customize settings in the AI Guide configuration page.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Features */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#D4AF63]" />
            Key Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-3 bg-[#1F315B]/5 rounded-lg">
              <Target className="w-5 h-5 text-[#2E7C83] mt-0.5" />
              <div>
                <h4 className="font-medium text-[#1F315B] dark:text-[#F6F1E8]">Page Context Awareness</h4>
                <p className="text-sm text-[#B9A9A9]">Knows what you're working on and offers relevant suggestions</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-[#1F315B]/5 rounded-lg">
              <Mic className="w-5 h-5 text-[#2E7C83] mt-0.5" />
              <div>
                <h4 className="font-medium text-[#1F315B] dark:text-[#F6F1E8]">Voice Input</h4>
                <p className="text-sm text-[#B9A9A9]">Speak your questions instead of typing</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-[#1F315B]/5 rounded-lg">
              <Plus className="w-5 h-5 text-[#2E7C83] mt-0.5" />
              <div>
                <h4 className="font-medium text-[#1F315B] dark:text-[#F6F1E8]">Quick Suggestions</h4>
                <p className="text-sm text-[#B9A9A9]">One-click common questions for each page</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-[#1F315B]/5 rounded-lg">
              <History className="w-5 h-5 text-[#2E7C83] mt-0.5" />
              <div>
                <h4 className="font-medium text-[#1F315B] dark:text-[#F6F1E8]">Conversation History</h4>
                <p className="text-sm text-[#B9A9A9]">Review past conversations per page</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-[#1F315B]/5 rounded-lg">
              <Settings className="w-5 h-5 text-[#2E7C83] mt-0.5" />
              <div>
                <h4 className="font-medium text-[#1F315B] dark:text-[#F6F1E8]">Customizable Models</h4>
                <p className="text-sm text-[#B9A9A9]">Use OpenAI, Anthropic, Moonshot, or Google AI</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-[#1F315B]/5 rounded-lg">
              <Lock className="w-5 h-5 text-[#2E7C83] mt-0.5" />
              <div>
                <h4 className="font-medium text-[#1F315B] dark:text-[#F6F1E8]">Privacy-First</h4>
                <p className="text-sm text-[#B9A9A9]">Your data stays local; API keys are encrypted</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQ Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-[#D4AF63]" />
            Frequently Asked Questions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="border border-[#1F315B]/10 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-[#1F315B]/5 transition-colors"
                >
                  <span className="font-medium text-[#1F315B] dark:text-[#F6F1E8] pr-4">
                    {faq.question}
                  </span>
                  {openFAQ === index ? (
                    <ChevronUp className="w-5 h-5 text-[#D4AF63] flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-[#B9A9A9] flex-shrink-0" />
                  )}
                </button>
                {openFAQ === index && (
                  <div className="px-4 pb-4 text-[#1F315B] dark:text-[#F6F1E8]">
                    <div className="pt-2 border-t border-[#1F315B]/10">
                      {typeof faq.answer === 'string' ? (
                        <p className="text-[#5E3B6C] dark:text-[#CDBED6] leading-relaxed">
                          {faq.answer}
                        </p>
                      ) : (
                        faq.answer
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Best Practices */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#D4AF63]" />
            Best Practices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">✓ Do:</h4>
              <ul className="list-disc pl-5 space-y-1 text-green-700 dark:text-green-300 text-sm">
                <li>Be specific in your questions for better answers</li>
                <li>Provide context about your business situation</li>
                <li>Use the AI Guide to brainstorm and explore ideas</li>
                <li>Verify important information before making decisions</li>
                <li>Start new conversations for different topics</li>
              </ul>
            </div>

            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2">✗ Don't:</h4>
              <ul className="list-disc pl-5 space-y-1 text-red-700 dark:text-red-300 text-sm">
                <li>Share sensitive personal information or passwords</li>
                <li>Make critical business decisions without verification</li>
                <li>Expect real-time data (stock prices, current events)</li>
                <li>Use AI advice as a substitute for professional counsel</li>
                <li>Ignore your own intuition and experience</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Getting Started CTA */}
      <Card className="bg-gradient-to-br from-[#1F315B] to-[#5E3B6C] text-[#F6F1E8]">
        <CardContent className="p-8 text-center">
          <Sparkles className="w-12 h-12 text-[#D4AF63] mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-3">Ready to Get Started?</h2>
          <p className="text-[#CDBED6] mb-6 max-w-lg mx-auto">
            The AI Business Guide is available on every page. Look for the Bot icon in the bottom-right corner, 
            or configure your settings and API keys in the AI Guide section.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/ai-guide">
              <Button className="bg-[#D4AF63] text-[#1F315B] hover:bg-[#D4AF63]/90">
                <Settings className="w-4 h-4 mr-2" />
                Configure AI Guide
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" className="border-[#D4AF63] text-[#D4AF63] hover:bg-[#D4AF63]/10">
                Try It Now
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Closing Quote */}
      <div className="mt-8 text-center">
        <blockquote className="text-lg italic text-[#5E3B6C] dark:text-[#CDBED6] border-l-4 border-[#D4AF63] pl-4 inline-block">
          &ldquo;The best AI assistant is one that understands your context, respects your privacy, 
          and empowers your decisions—not replaces them.&rdquo;
        </blockquote>
        <p className="text-sm text-[#B9A9A9] mt-2">— LifeCharter Architecture Team</p>
      </div>
    </div>
  );
}
