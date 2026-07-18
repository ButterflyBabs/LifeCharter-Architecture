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
      answer: "Domain Scores are numerical ratings (0-100) assigned to each of the 12 business domains in the LifeCharter Architecture framework. These scores represent the current health, maturity, and alignment of each specific area of your business. They provide a granular view of where your business is thriving and where attention is needed."
    },
    {
      question: "How are Domain Scores calculated?",
      answer: (
        <div className="space-y-2">
          <p>Domain Scores are calculated based on multiple factors:</p>
          <ul className="list-disc pl-5 space-y-1 text-[#5E3B6C] dark:text-[#CDBED6]">
            <li><strong>Assessment Responses:</strong> Your answers to domain-specific questions</li>
            <li><strong>Completion Status:</strong> How thoroughly you have documented each domain</li>
            <li><strong>Metrics Integration:</strong> Connected data from your business tools (if enabled)</li>
            <li><strong>AI Analysis:</strong> Pattern recognition across your business data</li>
            <li><strong>Time Trends:</strong> Historical performance in each domain</li>
          </ul>
          <p>Each domain uses a weighted algorithm specific to its unique characteristics.</p>
        </div>
      )
    },
    {
      question: "What do the score ranges mean?",
      answer: (
        <div className="space-y-2">
          <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/20 rounded">
            <span className="font-bold text-red-600">0-40:</span>
            <span className="text-red-700 dark:text-red-300">Needs Attention - Significant work needed</span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
            <span className="font-bold text-yellow-600">41-60:</span>
            <span className="text-yellow-700 dark:text-yellow-300">Developing - Foundation exists but needs strengthening</span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
            <span className="font-bold text-blue-600">61-80:</span>
            <span className="text-blue-700 dark:text-blue-300">Strong - Good performance with room for optimization</span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded">
            <span className="font-bold text-green-600">81-100:</span>
            <span className="text-green-700 dark:text-green-300">Excellent - Domain is a strength and competitive advantage</span>
          </div>
        </div>
      )
    },
    {
      question: "How often should I review my Domain Scores?",
      answer: "We recommend reviewing your Domain Scores monthly as part of your business rhythm. However, the frequency can vary based on your business stage: Early-stage businesses may benefit from weekly reviews, while established businesses might review quarterly. The key is consistency—regular reviews help you spot trends and catch issues before they become problems."
    },
    {
      question: "Can I improve my Domain Scores quickly?",
      answer: (
        <div className="space-y-2">
          <p>Improvement speed depends on the domain and your resources:</p>
          <ul className="list-disc pl-5 space-y-1 text-[#5E3B6C] dark:text-[#CDBED6]">
            <li><strong>Quick Wins (1-4 weeks):</strong> Documentation, basic processes, simple automations</li>
            <li><strong>Medium-term (1-3 months):</strong> Marketing systems, sales processes, customer support</li>
            <li><strong>Long-term (3-12 months):</strong> Brand reputation, team culture, market position</li>
          </ul>
          <p>Focus on one or two domains at a time rather than trying to improve everything simultaneously.</p>
        </div>
      )
    },
    {
      question: "Why did one of my Domain Scores drop?",
      answer: "Scores can decrease for several reasons: New assessment questions that reveal gaps, changes in your business metrics, overdue action items, or shifting benchmarks as your business grows. A dropping score is not failure—it is information. It highlights where your business needs attention, often before problems become visible in your revenue or customer feedback."
    },
    {
      question: "How do Domain Scores relate to Overall Business Health?",
      answer: "Your Overall Business Health score is a weighted average of all 12 Domain Scores, with some domains contributing more than others based on their impact on business success. However, a low score in any critical domain (like Cash Flow or Legal Compliance) can disproportionately affect your business even if other scores are high. This is why we show both the overall score and individual domain scores."
    },
    {
      question: "Should I focus on my lowest scores first?",
      answer: (
        <div className="space-y-2">
          <p>Not necessarily. Consider both score AND impact:</p>
          <ul className="list-disc pl-5 space-y-1 text-[#5E3B6C] dark:text-[#CDBED6]">
            <li><strong>Fix Critical First:</strong> Domains that are both low-scoring AND critical to operations</li>
            <li><strong>Quick Wins Second:</strong> Domains where small effort yields big score improvements</li>
            <li><strong>Strengths Third:</strong> High-scoring domains that could become competitive advantages</li>
          </ul>
          <p>The AI Business Guide can help you prioritize based on your specific situation.</p>
        </div>
      )
    },
    {
      question: "Can I customize how Domain Scores are calculated?",
      answer: "Currently, the scoring algorithms are standardized to ensure consistency and benchmarking. However, you can influence your scores by: Completing all assessments thoroughly, connecting integrations for real-time data, setting domain-specific goals that adjust weightings, and using the AI Guide to identify domain-specific improvement strategies. Future updates will include more customization options for advanced users."
    },
    {
      question: "How do I compare my Domain Scores to others?",
      answer: "The platform provides anonymous benchmarking data showing how your scores compare to businesses at similar stages and in similar industries. Access this through the Insights tab on your Dashboard. Remember: Comparison is for context, not competition. Your goal is continuous improvement against your own baseline, not matching someone else&apos;s scores."
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
        <div className="w-16 h-16 rounded-full bg-[#2E7C83]/20 flex items-center justify-center mx-auto mb-4">
          <Activity className="w-8 h-8 text-[#2E7C83]" />
        </div>
        <h1 className="text-3xl font-bold text-[#1F315B] dark:text-[#F6F1E8] mb-3">
          Domain Scores
        </h1>
        <p className="text-lg text-[#B9A9A9] max-w-2xl mx-auto">
          Understanding your 12-domain business health metrics
        </p>
      </div>

      {/* What are Domain Scores */}
      <Card className="mb-8 border-[#D4AF63]/30">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Target className="w-5 h-5 text-[#D4AF63]" />
            What are Domain Scores?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-[#1F315B] dark:text-[#F6F1E8] leading-relaxed">
            <strong>Domain Scores</strong> provide a numerical snapshot (0-100) of each of the 12 business domains 
            in your LifeCharter Architecture. Think of them as vital signs for your business—each score tells you 
            how healthy, mature, and aligned that specific area is.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="p-4 bg-[#1F315B]/5 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-5 h-5 text-[#2E7C83]" />
                <h3 className="font-semibold text-[#1F315B] dark:text-[#F6F1E8]">Granular Insight</h3>
              </div>
              <p className="text-sm text-[#B9A9A9]">
                See exactly which areas need attention versus which are strengths
              </p>
            </div>
            <div className="p-4 bg-[#1F315B]/5 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-[#5E3B6C]" />
                <h3 className="font-semibold text-[#1F315B] dark:text-[#F6F1E8]">Track Progress</h3>
              </div>
              <p className="text-sm text-[#B9A9A9]">
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
            <Activity className="w-5 h-5 text-[#D4AF63]" />
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
                <h3 className="font-semibold text-red-800 dark:text-red-200">0-40: Needs Attention</h3>
                <p className="text-sm text-red-700 dark:text-red-300">
                  This domain requires significant work. It may be blocking growth or creating risk. 
                  Prioritize improvements here.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="w-16 h-16 rounded-full bg-yellow-100 dark:bg-yellow-800 flex items-center justify-center flex-shrink-0">
                <Minus className="w-8 h-8 text-yellow-600 dark:text-yellow-300" />
              </div>
              <div>
                <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">41-60: Developing</h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Foundation exists but needs strengthening. This domain is functional but not yet 
                  optimized or fully systematized.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center flex-shrink-0">
                <Activity className="w-8 h-8 text-blue-600 dark:text-blue-300" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-800 dark:text-blue-200">61-80: Strong</h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Good performance with room for optimization. This domain supports your business well 
                  but could become exceptional.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-300" />
              </div>
              <div>
                <h3 className="font-semibold text-green-800 dark:text-green-200">81-100: Excellent</h3>
                <p className="text-sm text-green-700 dark:text-green-300">
                  This domain is a strength and competitive advantage. Maintain it while focusing 
                  on other areas.
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
            <BarChart3 className="w-5 h-5 text-[#D4AF63]" />
            The 12 Business Domains
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { name: "Vision & Purpose", focus: "Clarity of mission and direction" },
              { name: "Leadership & Mindset", focus: "Personal growth and decision-making" },
              { name: "Brand & Positioning", focus: "Market identity and differentiation" },
              { name: "Products & Services", focus: "Offerings and value delivery" },
              { name: "Marketing & Visibility", focus: "Audience growth and awareness" },
              { name: "Sales & Conversion", focus: "Revenue generation and closing" },
              { name: "Operations & Systems", focus: "Efficiency and processes" },
              { name: "Customer Experience", focus: "Satisfaction and retention" },
              { name: "Team & Culture", focus: "People and workplace environment" },
              { name: "Finance & Cash Flow", focus: "Money management and profitability" },
              { name: "Legal & Compliance", focus: "Protection and risk management" },
              { name: "Technology & Tools", focus: "Infrastructure and automation" }
            ].map((domain, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-[#1F315B]/5 rounded-lg">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#D4AF63]/20 text-[#D4AF63] text-xs font-bold flex items-center justify-center">
                  {index + 1}
                </span>
                <div>
                  <h4 className="font-medium text-[#1F315B] dark:text-[#F6F1E8]">{domain.name}</h4>
                  <p className="text-xs text-[#B9A9A9]">{domain.focus}</p>
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

      {/* Tips for Improvement */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-[#D4AF63]" />
            Tips for Improving Domain Scores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-[#1F315B]/5 rounded-lg">
              <h4 className="font-semibold text-[#1F315B] dark:text-[#F6F1E8] mb-2 flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#D4AF63]" />
                Start with Assessment
              </h4>
              <p className="text-sm text-[#B9A9A9]">
                Complete the full assessment for any domain with a low score. Often, simply documenting 
                what you have reveals quick wins and improvement opportunities.
              </p>
            </div>

            <div className="p-4 bg-[#1F315B]/5 rounded-lg">
              <h4 className="font-semibold text-[#1F315B] dark:text-[#F6F1E8] mb-2 flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#D4AF63]" />
                Focus on Connections
              </h4>
              <p className="text-sm text-[#B9A9A9]">
                Domains don&apos;t exist in isolation. Improving Customer Experience often boosts Sales. 
                Better Operations supports Finance. Look for synergies.
              </p>
            </div>

            <div className="p-4 bg-[#1F315B]/5 rounded-lg">
              <h4 className="font-semibold text-[#1F315B] dark:text-[#F6F1E8] mb-2 flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#D4AF63]" />
                Use the AI Guide
              </h4>
              <p className="text-sm text-[#B9A9A9]">
                Ask your AI Business Guide for domain-specific recommendations. It can analyze your 
                scores and suggest prioritized action steps.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CTA */}
      <Card className="bg-gradient-to-br from-[#1F315B] to-[#5E3B6C] text-[#F6F1E8]">
        <CardContent className="p-8 text-center">
          <Activity className="w-12 h-12 text-[#D4AF63] mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-3">Ready to Check Your Scores?</h2>
          <p className="text-[#CDBED6] mb-6 max-w-lg mx-auto">
            View your current Domain Scores on the Dashboard, complete assessments to update them, 
            and track your progress over time.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/dashboard">
              <Button className="bg-[#D4AF63] text-[#1F315B] hover:bg-[#D4AF63]/90">
                <BarChart3 className="w-4 h-4 mr-2" />
                View My Scores
              </Button>
            </Link>
            <Link href="/assessments">
              <Button variant="outline" className="border-[#D4AF63] text-[#D4AF63] hover:bg-[#D4AF63]/10">
                Take Assessment
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Quote */}
      <div className="mt-8 text-center">
        <blockquote className="text-lg italic text-[#5E3B6C] dark:text-[#CDBED6] border-l-4 border-[#D4AF63] pl-4 inline-block">
          &ldquo;What gets measured gets managed. Domain Scores turn business intuition into actionable data.&rdquo;
        </blockquote>
        <p className="text-sm text-[#B9A9A9] mt-2">— LifeCharter Architecture Team</p>
      </div>
    </div>
  );
}
