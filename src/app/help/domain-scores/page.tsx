"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  ArrowLeft,
  Activity,
  Target,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  Lightbulb,
  Zap
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface FAQItem {
  question: string;
  answer: string | React.ReactNode;
}

export default function DomainScoresHelpPage() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  const faqs: FAQItem[] = [
    {
      question: "What are Domain Scores?",
      answer: "Domain Scores are numerical ratings (0-100) for each of the 12 business domains in the LifeCharter Command Suite framework. They show up on the Business Alignment page (Alignment in the left menu) and as cards on Executive Home, and they represent the current health of each specific area of your business. They provide a granular view of where your business is thriving and where attention is needed."
    },
    {
      question: "How are Domain Scores calculated?",
      answer: (
        <div className="space-y-2">
          <p>Each Domain Score is a weighted blend of the inputs that apply to that domain:</p>
          <ul className="list-disc pl-5 space-y-1 text-[#7b6b8d] dark:text-[#e8e4f0]">
            <li><strong>Profit assessment:</strong> Your own rating of that area, one of its 12 business domains</li>
            <li><strong>Brain and Soul assessments:</strong> Your written answers about your systems, and about your purpose, values and story, scored by your AI assistant (anything you mark sensitive in the Soul assessment is never used)</li>
            <li><strong>Quick Pulse check-in:</strong> Your latest gut-check on how the area feels right now</li>
            <li><strong>Live Suite data:</strong> Your income and expenses against your budget target, your sales activity, your operational pillar scores (each pillar is scored for you), your Legal &amp; Compliance checklist, and how complete your plans are</li>
          </ul>
          <p>Each domain uses its own mix and weights. If an input hasn&apos;t been answered yet, its weight is shared among the inputs you do have, and the score is marked partial. Click any domain card on Executive Home to see every input, its score and what share of the total it carries.</p>
        </div>
      )
    },
    {
      question: "What do the score ranges mean?",
      answer: (
        <div className="space-y-2">
          <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/20 rounded">
            <span className="font-bold text-red-600">0-40:</span>
            <span className="text-red-700 dark:text-red-300">Survival - The best place to start, one thing at a time</span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
            <span className="font-bold text-yellow-600">41-60:</span>
            <span className="text-yellow-700 dark:text-yellow-300">Growth - The foundation is there and systems are taking shape</span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-teal-50 dark:bg-teal-900/20 rounded">
            <span className="font-bold text-teal-600">61-80:</span>
            <span className="text-teal-700 dark:text-teal-300">Expansion - Working well, ready to scale</span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded">
            <span className="font-bold text-green-600">81-100:</span>
            <span className="text-green-700 dark:text-green-300">Legacy - This domain is a strength</span>
          </div>
        </div>
      )
    },
    {
      question: "How often should I review my Domain Scores?",
      answer: "A monthly look works well, right after your Quick Pulse check-in. The key is consistency: regular reviews help you spot trends and catch issues before they become problems. An input that is more than 90 days old (14 days for a Quick Pulse) is marked as getting stale on the domain&apos;s detail page, which is a good nudge to revisit it."
    },
    {
      question: "Can I improve my Domain Scores quickly?",
      answer: (
        <div className="space-y-2">
          <p>Improvement speed depends on the domain and your resources. As a rough guide:</p>
          <ul className="list-disc pl-5 space-y-1 text-[#7b6b8d] dark:text-[#e8e4f0]">
            <li><strong>Quicker:</strong> Things you control directly, like writing a plan section, recording your income and expenses, ticking off your Legal &amp; Compliance checklist, or writing your first SOP</li>
            <li><strong>Medium-term:</strong> Marketing systems, sales processes, customer support</li>
            <li><strong>Longer:</strong> Brand reputation, team culture, market position</li>
          </ul>
          <p>Focus on one or two domains at a time rather than trying to improve everything simultaneously.</p>
        </div>
      )
    },
    {
      question: "Why did one of my Domain Scores drop?",
      answer: "Scores can decrease when you answer more honestly or in more detail, when a new Quick Pulse check-in shows a lower number than before, or when your live data changes: slower income against your goal, a weaker sales conversion rate, or fewer operational pillars marked solid. A dropping score is not failure. It is information, and it often shows up before problems become visible in your revenue or customer feedback."
    },
    {
      question: "How do Domain Scores relate to Overall Business Health?",
      answer: "Your Overall Business Health score is the average of your Domain Scores, with every scored domain counting equally. A very low score in one domain, like Finance or Legal, can still affect your business even if the average looks healthy, which is why the Suite shows both the overall score and each individual domain."
    },
    {
      question: "Should I focus on my lowest scores first?",
      answer: (
        <div className="space-y-2">
          <p>Usually, yes, but consider both score AND what matters to you right now:</p>
          <ul className="list-disc pl-5 space-y-1 text-[#7b6b8d] dark:text-[#e8e4f0]">
            <li><strong>Fix Survival first:</strong> Domains scoring 0-40, especially ones critical to how you operate</li>
            <li><strong>Quick wins second:</strong> Domains where a small effort yields a big score improvement</li>
            <li><strong>Strengths third:</strong> High-scoring domains that could become your advantage</li>
          </ul>
          <p>Your Next 3 Moves start with your lowest domains, and your AI assistant can help you prioritize based on your specific situation.</p>
        </div>
      )
    },
    {
      question: "Can I customize how Domain Scores are calculated?",
      answer: "The scoring weights are standardized so your scores stay consistent over time. You can influence your scores by completing all three assessments thoroughly, keeping your finances, sales activity, operational pillars and Legal &amp; Compliance checklist up to date, filling in your plans, doing your monthly Quick Pulse, and using your AI assistant to find improvement ideas for a specific domain."
    },
    {
      question: "How do I compare my Domain Scores to others?",
      answer: "You don&apos;t, and that&apos;s on purpose. The Suite measures you against your own baseline, not against other businesses. The Domain Scores card shows how far each domain has moved since you started, and the Progress page (Alignment in the left menu) shows your trajectory over time. Your goal is continuous improvement, not matching someone else&apos;s scores."
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
        <div className="w-16 h-16 rounded-full bg-[#4a9b9b]/20 flex items-center justify-center mx-auto mb-4">
          <Activity className="w-8 h-8 text-[#4a9b9b]" />
        </div>
        <h1 className="text-3xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0] mb-3">
          Domain Scores
        </h1>
        <p className="text-lg text-[#b8a898] max-w-2xl mx-auto">
          Understanding your 12-domain business health metrics
        </p>
      </div>

      {/* What are Domain Scores */}
      <Card className="mb-8 border-[#c9a227]/30">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Target className="w-5 h-5 text-[#c9a227]" />
            What are Domain Scores?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-[#1a2b4a] dark:text-[#F8F5F0] leading-relaxed">
            <strong>Domain Scores</strong> provide a numerical snapshot (0-100) of each of the 12 business domains 
            in your LifeCharter Command Suite. Think of them as vital signs for your business. Each score tells you 
            how healthy that specific area is right now, and the small arrow under it shows how far it has moved since your baseline.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="p-4 bg-[#1a2b4a]/5 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-5 h-5 text-[#4a9b9b]" />
                <h3 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Granular Insight</h3>
              </div>
              <p className="text-sm text-[#b8a898]">
                See exactly which areas need attention versus which are strengths
              </p>
            </div>
            <div className="p-4 bg-[#1a2b4a]/5 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-[#7b6b8d]" />
                <h3 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Track Progress</h3>
              </div>
              <p className="text-sm text-[#b8a898]">
                Monitor improvement over time as you implement changes
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Score Ranges */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#c9a227]" />
            Understanding Score Ranges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-800 flex items-center justify-center flex-shrink-0">
                <TrendingDown className="w-8 h-8 text-red-600 dark:text-red-300" />
              </div>
              <div>
                <h3 className="font-semibold text-red-800 dark:text-red-200">0-40: Survival</h3>
                <p className="text-sm text-red-700 dark:text-red-300">
                  This domain needs real work and may be blocking growth or creating risk. Start here, one thing at a time.
                  On Executive Home, a domain scoring below 60 also links to short lessons on how to lift it.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="w-16 h-16 rounded-full bg-yellow-100 dark:bg-yellow-800 flex items-center justify-center flex-shrink-0">
                <Minus className="w-8 h-8 text-yellow-600 dark:text-yellow-300" />
              </div>
              <div>
                <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">41-60: Growth</h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  The foundation is there and systems are taking shape. Strengthen this domain next with steady, focused effort.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-teal-50 dark:bg-teal-900/20 rounded-lg border border-teal-200 dark:border-teal-800">
              <div className="w-16 h-16 rounded-full bg-teal-100 dark:bg-teal-800 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-8 h-8 text-teal-600 dark:text-teal-300" />
              </div>
              <div>
                <h3 className="font-semibold text-teal-800 dark:text-teal-200">61-80: Expansion</h3>
                <p className="text-sm text-teal-700 dark:text-teal-300">
                  This domain supports your business well. The work now is scaling what works and keeping it steady.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-300" />
              </div>
              <div>
                <h3 className="font-semibold text-green-800 dark:text-green-200">81-100: Legacy</h3>
                <p className="text-sm text-green-700 dark:text-green-300">
                  This domain is a strength. Protect it, and lean on it while you focus on other areas.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* The 12 Domains */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#c9a227]" />
            The 12 Business Domains
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { name: "Marketing", focus: "Reaching and attracting your ideal clients" },
              { name: "Sales", focus: "Turning interest into paying clients" },
              { name: "Operations", focus: "How your work gets delivered, including your 8 operational pillars (each scored for you, then averaged)" },
              { name: "Finance", focus: "Income, expenses and cash against your goals" },
              { name: "Team", focus: "The people and roles that help you run the business" },
              { name: "Systems", focus: "Documented processes, delegation and your tools" },
              { name: "Leadership", focus: "Decision-making, values and how you show up" },
              { name: "Vision", focus: "Clarity of mission, purpose and direction" },
              { name: "Product", focus: "Your offers and the value they deliver" },
              { name: "Client Experience", focus: "The client journey, satisfaction and retention" },
              { name: "Legal", focus: "Contracts, insurance, licenses and compliance" },
              { name: "Sustainability", focus: "Energy, resilience and long-term wellbeing" }
            ].map((domain, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-[#1a2b4a]/5 rounded-lg">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#c9a227]/20 text-[#c9a227] text-xs font-bold flex items-center justify-center">
                  {index + 1}
                </span>
                <div>
                  <h4 className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">{domain.name}</h4>
                  <p className="text-xs text-[#b8a898]">{domain.focus}</p>
                </div>
              </div>
            ))}
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

      {/* Tips for Improvement */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-[#c9a227]" />
            Tips for Improving Domain Scores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-[#1a2b4a]/5 rounded-lg">
              <h4 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0] mb-2 flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#c9a227]" />
                Start with Assessment
              </h4>
              <p className="text-sm text-[#b8a898]">
                Finish the Brain, Soul and Profit assessments, then open a low-scoring domain on Executive Home 
                to see exactly which input is holding it back. Often, simply documenting 
                what you have reveals quick wins and improvement opportunities.
              </p>
            </div>

            <div className="p-4 bg-[#1a2b4a]/5 rounded-lg">
              <h4 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0] mb-2 flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#c9a227]" />
                Focus on Connections
              </h4>
              <p className="text-sm text-[#b8a898]">
                Domains don&apos;t exist in isolation, and some of your answers count toward more than one domain. 
                Better Operations supports Finance. Look for synergies.
              </p>
            </div>

            <div className="p-4 bg-[#1a2b4a]/5 rounded-lg">
              <h4 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0] mb-2 flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#c9a227]" />
                Ask Your Assistant
              </h4>
              <p className="text-sm text-[#b8a898]">
                Ask your AI assistant for domain-specific recommendations. It reads your 
                scores and can suggest prioritized action steps.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CTA */}
      <Card className="bg-gradient-to-br from-[#1a2b4a] to-[#7b6b8d] text-[#F8F5F0]">
        <CardContent className="p-8 text-center">
          <Activity className="w-12 h-12 text-[#c9a227] mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-3">Ready to Check Your Scores?</h2>
          <p className="text-[#e8e4f0] mb-6 max-w-lg mx-auto">
            View your current Domain Scores on the Business Alignment page, complete assessments to update them, 
            and track your progress over time.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/business-alignment">
              <Button className="bg-[#c9a227] text-[#1a2b4a] hover:bg-[#c9a227]/90">
                <BarChart3 className="w-4 h-4 mr-2" />
                View My Scores
              </Button>
            </Link>
            <Link href="/assessments">
              <Button variant="outline" className="border-[#c9a227] text-[#c9a227] hover:bg-[#c9a227]/10">
                Take Assessment
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Quote */}
      <div className="mt-8 text-center">
        <blockquote className="text-lg italic text-[#7b6b8d] dark:text-[#e8e4f0] border-l-4 border-[#c9a227] pl-4 inline-block">
          &ldquo;What gets measured gets managed. Domain Scores turn business intuition into actionable data.&rdquo;
        </blockquote>
        <p className="text-sm text-[#b8a898] mt-2">— LifeCharter Command Suite Team</p>
      </div>
    </div>
  );
}
