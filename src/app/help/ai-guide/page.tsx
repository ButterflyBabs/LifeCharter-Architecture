"use client";

import { Term } from "@/components/Term";
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
      answer: "The AI Business Guide is your AI assistant. You name it yourself in Settings → AI Assistant, and until you do it is called Sidekick. It is woven throughout the LifeCharter Command Suite: it answers your questions in the Travel Partner widget, on the AI Assistant card on Executive Home and on the AI Business Guide card on your Business Alignment page, and it writes the briefings, roadmaps and drafts you see across the app. Unlike generic AI chatbots, it reads your own assessments, scores and plans, so its guidance is about your business."
    },
    {
      question: "How is the AI Guide different from other AI assistants?",
      answer: (
        <div className="space-y-2">
          <p>Your assistant is built around your Suite:</p>
          <ul className="list-disc pl-5 space-y-1 text-[#7b6b8d] dark:text-[#e8e4f0]">
            <li><strong>Business-Integrated:</strong> Reads your Brain, Soul and Profit answers, your live scores, your tasks and routines, your offers and pipeline, your income against your goals, your plans, and the next seven days on the calendars you have connected</li>
            <li><strong>Knows the Suite:</strong> Answers how-to questions from the same Help library you find under Help &amp; Q&amp;A, and says so if the library doesn&apos;t cover your question instead of guessing</li>
            <li><strong>Yours to shape:</strong> Follows the reply instructions you write, and keeps the notes you give it about you, your team and how you work</li>
            <li><strong>Action-Oriented:</strong> Provides specific next steps, not just general advice</li>
            <li><strong>Privacy-First:</strong> Your data is only ever used for your own account, and anything you mark sensitive in the Soul assessment is never shown to it</li>
          </ul>
        </div>
      )
    },
    {
      question: "How do I access the AI Guide?",
      answer: (
        <div className="space-y-2">
          <p>You can reach your assistant in three places:</p>
          <ol className="list-decimal pl-5 space-y-1 text-[#7b6b8d] dark:text-[#e8e4f0]">
            <li><strong><Term id="travel-partner">Travel Partner</Term> widget:</strong> Look for the Travel Partner button, with the compass icon, in the bottom-right corner of the page (you can drag it elsewhere). Open it and choose the &quot;Ask&quot; tab with your assistant&apos;s name. The other tab, Help &amp; setup, guides you through setting up and answers how-to questions.</li>
            <li><strong>Executive Home:</strong> The AI Assistant card has an ask box, your conversation (newest first), and links for New conversation, Past conversations and Teach.</li>
            <li><strong>Business Alignment:</strong> The AI Business Guide card shows a greeting built from your score and your next moves, with an Ask button to chat.</li>
          </ol>
          <p>All three share the same memory of your recent conversation. To change its name, replies or notes, click AI Assistant under Settings in the left menu.</p>
        </div>
      )
    },
    {
      question: "What can I ask the AI Guide?",
      answer: (
        <div className="space-y-2">
          <p>Anything about your business or about using the Suite, including:</p>
          <ul className="list-disc pl-5 space-y-1 text-[#7b6b8d] dark:text-[#e8e4f0]">
            <li>&quot;Analyze my business health score and suggest priorities&quot;</li>
            <li>&quot;What should I focus on this week?&quot;</li>
            <li>&quot;Where is my business most out of alignment?&quot;</li>
            <li>&quot;Help me refine my value proposition&quot;</li>
            <li>&quot;What does my pipeline look like?&quot;</li>
            <li>&quot;Where do I add an offer?&quot; or &quot;How do I connect my calendar?&quot;</li>
          </ul>
        </div>
      )
    },
    {
      question: "Can my assistant do things for me, not just answer questions?",
      answer: (
        <div className="space-y-2">
          <p>Yes. Ask in plain words and your assistant prepares the change for you. It can:</p>
          <ul className="list-disc pl-5 space-y-1 text-[#7b6b8d] dark:text-[#e8e4f0]">
            <li>Tag or untag contacts, and add a contact</li>
            <li>Create tasks and change their priority, effort, due date or status</li>
            <li>Create an outreach pipeline, add people to it and move them between stages, and add a deal to your Sales Pipeline</li>
            <li>Write a broadcast email or a full email campaign as a draft</li>
            <li>Write social posts or a content plan and add them to your Content Calendar</li>
            <li>Create a page in your own left menu, keep it updated, and delete it when you are done</li>
            <li>Save lasting facts you mention (like who handles your bookings) to your Teach notes</li>
          </ul>
          <p>If it can&apos;t do something yet, it says so and offers the closest thing it can do.</p>
        </div>
      )
    },
    {
      question: "What do Approve, Edit and Cancel mean?",
      answer: (
        <div className="space-y-2">
          <p>Whenever your assistant wants to change something, it first shows a preview card and nothing happens yet.</p>
          <ul className="list-disc pl-5 space-y-1 text-[#7b6b8d] dark:text-[#e8e4f0]">
            <li><strong>Approve</strong> does it. Most actions then show an Undo link.</li>
            <li><strong>Edit</strong> lets you say what to change (&quot;rename it&quot;, &quot;drop the third step&quot;, &quot;make it warmer&quot;). The old preview is cancelled and a corrected one comes back.</li>
            <li><strong>Cancel</strong> throws the preview away. Nothing was changed.</li>
          </ul>
          <p>Emails are only ever saved as drafts. Your assistant never sends, schedules or turns on an email or message, and it never publishes a post right now. You review and send from Campaigns &amp; Broadcasts yourself. It only works in your own account, and a team member can only approve what their role allows.</p>
        </div>
      )
    },
    {
      question: "Can I keep my assistant open while I work on another page?",
      answer: "Yes. On the AI Assistant card on Executive Home, click Pop out. Your assistant floats over whatever page you open, tells you it knows which page you are on, and keeps the same conversation. Drag it by its title bar, resize it from the corner, minimize it, or press Bring back to Executive Home. The conversation lists newest first."
    },
    {
      question: "How does the AI Guide know which page I&apos;m on?",
      answer: "When you ask from the Travel Partner widget, it sends the part of the app you are in (like Finance, Pipeline or the Business Plan) along with your question, so the answer fits what you are working on. The widget also offers a suggestion that picks up where you are, like &quot;Help me with my Finance.&quot; Your assistant doesn&apos;t see anything on your screen beyond that. When you pop your assistant out, it does the same for the page you are on."
    },
    {
      question: "Can I use voice to talk to the AI Guide?",
      answer: "Not at the moment. You type your questions into the ask box. If your phone or computer has built-in dictation, you can use that to speak your question into the box."
    },
    {
      question: "What are the suggested questions?",
      answer: (
        <div className="space-y-2">
          <p>When you open a new chat in the Travel Partner widget you will see a few suggestions you can click to ask instantly:</p>
          <ul className="list-disc pl-5 space-y-1 text-[#7b6b8d] dark:text-[#e8e4f0]">
            <li>&quot;What should I focus on this week?&quot;</li>
            <li>&quot;Where is my business most out of alignment?&quot;</li>
            <li>&quot;Help me with my [the page you are on]&quot;</li>
          </ul>
          <p>On the Business Alignment page, the AI Business Guide card instead suggests your Next 3 Moves once they are ready.</p>
        </div>
      )
    },
    {
      question: "How do I connect my own AI key?",
      answer: (
        <div className="space-y-2">
          <p>Your assistant runs on your own OpenAI key:</p>
          <ol className="list-decimal pl-5 space-y-1 text-[#7b6b8d] dark:text-[#e8e4f0]">
            <li>Click AI Assistant under Settings in the left menu (or go to Settings → AI Assistant)</li>
            <li>Use the &quot;Get an OpenAI key&quot; link to create a key on OpenAI&apos;s site</li>
            <li>Paste it into the OpenAI API key box</li>
            <li>Click Save AI settings</li>
          </ol>
          <p>You will see &quot;Key configured&quot; once it is saved. Your key is stored securely and used only to power your assistant. Paste a new key any time to replace it. The Suite doesn&apos;t offer a choice of other AI providers or models.</p>
        </div>
      )
    },
    {
      question: "How do I teach my assistant about me and how I work?",
      answer: (
        <div className="space-y-2">
          <p>Settings → AI Assistant has three things you can set:</p>
          <ul className="list-disc pl-5 space-y-1 text-[#7b6b8d] dark:text-[#e8e4f0]">
            <li><strong>Assistant name:</strong> What it is called across the app</li>
            <li><strong>How should it reply?</strong> Standing instructions for tone, length and format, like &quot;keep answers under 80 words&quot; (up to 1,500 characters)</li>
            <li><strong>What should it know about you and how you work?</strong> Plain sentences about your team, your hours, your busy season and what matters most right now (up to 3,000 characters)</li>
          </ul>
          <p>The Teach link on the Executive Home AI Assistant card takes you to Settings. Click Save and it applies to your next question.</p>
        </div>
      )
    },
    {
      question: "Is my data and conversation history private?",
      answer: (
        <div className="space-y-2">
          <p className="font-medium text-[#4a9b9b]">Yes, your privacy is our priority:</p>
          <ul className="list-disc pl-5 space-y-1 text-[#7b6b8d] dark:text-[#e8e4f0]">
            <li>Your OpenAI key is stored securely and used only to power your assistant</li>
            <li>Your data and your conversations belong to your account and are only used for your account</li>
            <li>Anything you mark sensitive in the Soul assessment is never shown to your assistant</li>
            <li>When your assistant answers, the question and the relevant parts of your information go to OpenAI under your own key, so OpenAI&apos;s privacy policy applies</li>
            <li>You can clear your conversation history any time</li>
          </ul>
        </div>
      )
    },
    {
      question: "Can I change AI models mid-conversation?",
      answer: "No. The Suite chooses the model for you, and there is no model setting to change. What you can change is how your assistant replies, from Settings → AI Assistant."
    },
    {
      question: "Does the AI Guide remember past conversations?",
      answer: "Your conversation stays on the AI Assistant card (and in the Business Alignment panel), newest first, even when you leave the page and come back. For answering you, your assistant follows roughly the last six hours of it, so older advice never overrides what is true in your account today. Its long-term memory is your Teach notes in Settings, which it offers to add to when you mention something lasting. New conversation saves the current chat under Past conversations, where you can read it, continue it or delete it. Each time you ask, it reads your account fresh."
    },
    {
      question: "What if the AI Guide gives incorrect information?",
      answer: (
        <div className="space-y-2">
          <p>While your assistant is designed to be helpful and accurate, it&apos;s important to remember:</p>
          <ul className="list-disc pl-5 space-y-1 text-[#7b6b8d] dark:text-[#e8e4f0]">
            <li>AI can make mistakes. Always verify important business decisions</li>
            <li>It knows what is in your Suite, but not outside information like market news or current events</li>
            <li>Use AI suggestions as starting points, not final answers</li>
            <li>For legal, financial, or critical decisions, consult qualified professionals</li>
          </ul>
          <p>If an answer looks out of date, clear its memory (see below) and ask again. If it is still wrong, send us what it said from Help → Contact Support, or with the light bulb in the top bar, and we will fix it for everyone.</p>
        </div>
      )
    },
    {
      question: "How do I clear my conversation history?",
      answer: (
        <div className="space-y-2">
          <p>To start a fresh conversation (the old one is saved, not erased):</p>
          <ol className="list-decimal pl-5 space-y-1 text-[#7b6b8d] dark:text-[#e8e4f0]">
            <li>Click New conversation on the AI Assistant card on Executive Home, or</li>
            <li>Click New conversation in the Travel Partner widget&apos;s Ask tab</li>
          </ol>
          <p>Your old conversation is kept under Past conversations, where you can read it, continue it or delete it. Your assistant still knows your account, your Teach notes and your settings.</p>
        </div>
      )
    },
    {
      question: "Can I export my AI Guide conversations?",
      answer: "Conversation export isn't available. For now, you can copy important insights from a conversation by hand. We recommend noting key recommendations in your Business Plan or the relevant section of the Suite."
    },
    {
      question: "What happens if my OpenAI key runs out of credits?",
      answer: "If your key has no credits left or is no longer valid, your assistant won't be able to answer and may show a short message asking you to try again. Check your balance on OpenAI's site, then update your key in Settings → AI Assistant if you need to. Until a key is saved, your assistant stays offline and will point you to Settings."
    }
  ];

  return (
    <div className="py-8 px-4 max-w-4xl mx-auto">
      {/* Back Navigation */}
      <Link href="/help/qa" className="flex items-center gap-2 text-[#7b6b8d] hover:text-[#1a2b4a] mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to Help &amp; Q&amp;A
      </Link>

      {/* Hero Section */}
      <div className="text-center mb-10">
        <div className="w-16 h-16 rounded-full bg-[#c9a227]/20 flex items-center justify-center mx-auto mb-4">
          <Bot className="w-8 h-8 text-[#c9a227]" />
        </div>
        <h1 className="text-3xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0] mb-3">
          AI Business Guide
        </h1>
        <p className="text-lg text-[#b8a898] max-w-2xl mx-auto">
          Your intelligent companion for business alignment and growth
        </p>
      </div>

      {/* What is AI Business Guide */}
      <Card className="mb-8 border-[#c9a227]/30">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#c9a227]" />
            What is the AI Business Guide?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-[#1a2b4a] dark:text-[#F8F5F0] leading-relaxed">
            The <strong>AI Business Guide</strong> is your own AI assistant, embedded throughout the LifeCharter Command Suite platform. 
            You name it yourself (it is called <Term id="sidekick">Sidekick</Term> until you do). Unlike generic AI chatbots, it understands your business context, references your assessments and plans, 
            answers how-to questions about the Suite, and provides personalized guidance tailored to your specific situation.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="p-4 bg-[#1a2b4a]/5 rounded-lg text-center">
              <div className="w-10 h-10 rounded-full bg-[#4a9b9b]/20 flex items-center justify-center mx-auto mb-2">
                <Target className="w-5 h-5 text-[#4a9b9b]" />
              </div>
              <h3 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0] mb-1">Context-Aware</h3>
              <p className="text-sm text-[#b8a898]">Knows your business and which part of the app you&apos;re in</p>
            </div>
            <div className="p-4 bg-[#1a2b4a]/5 rounded-lg text-center">
              <div className="w-10 h-10 rounded-full bg-[#7b6b8d]/20 flex items-center justify-center mx-auto mb-2">
                <Lightbulb className="w-5 h-5 text-[#7b6b8d]" />
              </div>
              <h3 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0] mb-1">Intelligent</h3>
              <p className="text-sm text-[#b8a898]">References your business data for personalized advice</p>
            </div>
            <div className="p-4 bg-[#1a2b4a]/5 rounded-lg text-center">
              <div className="w-10 h-10 rounded-full bg-[#c9a227]/20 flex items-center justify-center mx-auto mb-2">
                <Zap className="w-5 h-5 text-[#c9a227]" />
              </div>
              <h3 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0] mb-1">Actionable</h3>
              <p className="text-sm text-[#b8a898]">Provides specific next steps, not generic advice</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#c9a227]" />
            How It Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#4a9b9b] text-white flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Access Anywhere</h3>
                <p className="text-[#b8a898] text-sm mt-1">
                  Your assistant is a click away on the Travel Partner button in the corner of the page, on the AI Assistant card on Executive Home, and on the AI Business Guide card on Business Alignment.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#4a9b9b] text-white flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Ask Questions</h3>
                <p className="text-[#b8a898] text-sm mt-1">
                  Type your questions. Your assistant understands context from your business data, and from the part of the app you&apos;re in when you ask in the Travel Partner.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#4a9b9b] text-white flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Get Personalized Guidance</h3>
                <p className="text-[#b8a898] text-sm mt-1">
                  Receive tailored recommendations, analysis, and actionable next steps specific to your business.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#4a9b9b] text-white flex items-center justify-center font-bold">
                4
              </div>
              <div>
                <h3 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Configure Your Way</h3>
                <p className="text-[#b8a898] text-sm mt-1">
                  Connect your own OpenAI key, name your assistant, set how it replies and teach it about you in Settings → AI Assistant.
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
            <MessageSquare className="w-5 h-5 text-[#c9a227]" />
            Key Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-3 bg-[#1a2b4a]/5 rounded-lg">
              <Target className="w-5 h-5 text-[#4a9b9b] mt-0.5" />
              <div>
                <h4 className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">Page Context Awareness</h4>
                <p className="text-sm text-[#b8a898]">In the Travel Partner, knows what you&apos;re working on and offers relevant suggestions</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-[#1a2b4a]/5 rounded-lg">
              <HelpCircle className="w-5 h-5 text-[#4a9b9b] mt-0.5" />
              <div>
                <h4 className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">How-To Answers</h4>
                <p className="text-sm text-[#b8a898]">Answers &quot;where do I...&quot; questions from the Suite&apos;s Help library</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-[#1a2b4a]/5 rounded-lg">
              <Plus className="w-5 h-5 text-[#4a9b9b] mt-0.5" />
              <div>
                <h4 className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">Suggested Questions</h4>
                <p className="text-sm text-[#b8a898]">One-click starters, including your Next 3 Moves on Business Alignment</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-[#1a2b4a]/5 rounded-lg">
              <History className="w-5 h-5 text-[#4a9b9b] mt-0.5" />
              <div>
                <h4 className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">Short-Term Memory</h4>
                <p className="text-sm text-[#b8a898]">Remembers your recent conversation; clear it any time</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-[#1a2b4a]/5 rounded-lg">
              <Settings className="w-5 h-5 text-[#4a9b9b] mt-0.5" />
              <div>
                <h4 className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">Made Yours</h4>
                <p className="text-sm text-[#b8a898]">Name it, set how it replies, and teach it about you and your team</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-[#1a2b4a]/5 rounded-lg">
              <Lock className="w-5 h-5 text-[#4a9b9b] mt-0.5" />
              <div>
                <h4 className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">Privacy-First</h4>
                <p className="text-sm text-[#b8a898]">Your data stays with your account; sensitive Soul answers are never shown to it</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQ Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-[#c9a227]" />
            Frequently Asked Questions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="border border-[#1a2b4a]/10 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-[#1a2b4a]/5 transition-colors"
                >
                  <span className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0] pr-4">
                    {faq.question}
                  </span>
                  {openFAQ === index ? (
                    <ChevronUp className="w-5 h-5 text-[#c9a227] flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-[#b8a898] flex-shrink-0" />
                  )}
                </button>
                {openFAQ === index && (
                  <div className="px-4 pb-4 text-[#1a2b4a] dark:text-[#F8F5F0]">
                    <div className="pt-2 border-t border-[#1a2b4a]/10">
                      {typeof faq.answer === 'string' ? (
                        <p className="text-[#7b6b8d] dark:text-[#e8e4f0] leading-relaxed">
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
            <Shield className="w-5 h-5 text-[#c9a227]" />
            Best Practices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">Do:</h4>
              <ul className="list-disc pl-5 space-y-1 text-green-700 dark:text-green-300 text-sm">
                <li>Be specific in your questions for better answers</li>
                <li>Provide context about your business situation</li>
                <li>Use the AI Guide to brainstorm and explore ideas</li>
                <li>Verify important information before making decisions</li>
                <li>Clear its memory if an answer feels out of date</li>
              </ul>
            </div>

            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2">Don&apos;t:</h4>
              <ul className="list-disc pl-5 space-y-1 text-red-700 dark:text-red-300 text-sm">
                <li>Share passwords or financial account numbers</li>
                <li>Make critical business decisions without verification</li>
                <li>Expect outside information (stock prices, current events)</li>
                <li>Use AI advice as a substitute for professional counsel</li>
                <li>Ignore your own intuition and experience</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Getting Started CTA */}
      <Card className="bg-gradient-to-br from-[#1a2b4a] to-[#7b6b8d] text-[#F8F5F0]">
        <CardContent className="p-8 text-center">
          <Sparkles className="w-12 h-12 text-[#c9a227] mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-3">Ready to Get Started?</h2>
          <p className="text-[#e8e4f0] mb-6 max-w-lg mx-auto">
            Your assistant is available from the Travel Partner button in the bottom-right corner of the page. 
            Name it and connect your OpenAI key in Settings › AI Assistant.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/settings?tab=ai">
              <Button className="bg-[#c9a227] text-[#1a2b4a] hover:bg-[#c9a227]/90">
                <Settings className="w-4 h-4 mr-2" />
                AI Assistant settings
              </Button>
            </Link>
            <Link href="/business-alignment">
              <Button variant="outline" className="border-[#c9a227] text-[#c9a227] hover:bg-[#c9a227]/10">
                Try It Now
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Closing Quote */}
      <div className="mt-8 text-center">
        <blockquote className="text-lg italic text-[#7b6b8d] dark:text-[#e8e4f0] border-l-4 border-[#c9a227] pl-4 inline-block">
          &ldquo;The best AI assistant is one that understands your context, respects your privacy, 
          and empowers your decisions—not replaces them.&rdquo;
        </blockquote>
        <p className="text-sm text-[#b8a898] mt-2">— LifeCharter Command Suite Team</p>
      </div>
    </div>
  );
}
