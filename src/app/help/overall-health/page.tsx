"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { HeartPulse, ChevronDown, ChevronUp, Activity, AlertCircle, CheckCircle } from "lucide-react";
import { useState } from "react";

export default function OverallBusinessHealthPage() {
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  const toggleFaq = (id: string) => {
    setOpenFaq(openFaq === id ? null : id);
  };

  const faqs = [
    {
      id: "what-good-score",
      question: "What is a good Overall Business Health score?",
      answer: "Scores are categorized into four phases: Survival (0-30), Building (31-60), Growth (61-80), and Expansion (81-100). Most businesses operate healthily in the 60-80 range. The goal is progress, not perfection—moving from 45 to 65 represents significant business improvement."
    },
    {
      id: "how-often-update",
      question: "How often does my Overall Business Health score update?",
      answer: "Your score updates in real-time as you complete assessments and input data across the 12 domains. We recommend quarterly comprehensive reassessments to track meaningful progress and identify shifting priorities."
    },
    {
      id: "why-score-dropped",
      question: "Why did my score drop even though I am working hard?",
      answer: "Score drops often happen when you are dismantling old systems to build better ones, or when new challenges emerge faster than solutions. This is normal during transformation periods. Focus on the trend over 3-6 months rather than week-to-week fluctuations."
    },
    {
      id: "focus-areas",
      question: "How are my Focus Areas determined?",
      answer: "Focus Areas are automatically identified based on your lowest-scoring domains and recent assessment responses. These represent the areas where improvement will have the biggest impact on your overall business health and daily experience."
    },
    {
      id: "different-scores",
      question: "Why does my Overall score differ from my individual domain scores?",
      answer: "Your Overall Business Health is a weighted calculation that considers not just domain scores, but also how well your domains work together. A business with all domains at 70% often scores higher than one with domains at 90% and 40%, because alignment matters as much as individual performance."
    },
    {
      id: "improve-score",
      question: "What is the fastest way to improve my Overall Business Health score?",
      answer: "Focus on your lowest-scoring domain first—improving a 35 to a 55 has more impact on your overall health than improving a 75 to an 85. Additionally, look for domains that support each other: improving Systems often helps Operations, Team, and Finance simultaneously."
    }
  ];

  const healthPhases = [
    {
      range: "81-100",
      name: "Expansion",
      color: "bg-green-500",
      description: "Your business is thriving with strong systems and predictable growth. Focus on scaling what works and developing leadership capacity.",
      characteristics: ["Consistent cash flow", "Strong team autonomy", "Clear market position", "Systems that scale"]
    },
    {
      range: "61-80",
      name: "Growth",
      color: "bg-[#D4AF63]",
      description: "You are building momentum with working systems. Align your operations and cash flow to scale with ease and clarity.",
      characteristics: ["Revenue growing", "Systems being built", "Team expanding", "Processes documented"]
    },
    {
      range: "31-60",
      name: "Building",
      color: "bg-yellow-500",
      description: "You are establishing foundations. Focus on systematizing what works and clarifying your next growth phase.",
      characteristics: ["Product-market fit found", "Early systems in place", "Revenue inconsistent", "Wearing many hats"]
    },
    {
      range: "0-30",
      name: "Survival",
      color: "bg-red-500",
      description: "You are navigating immediate challenges. Identify the one thing that will create the most stability right now.",
      characteristics: ["Cash flow tight", "Reactive mode", "Unclear systems", "High stress"]
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#D4AF63]/20 mb-4">
          <HeartPulse className="w-8 h-8 text-[#D4AF63]" />
        </div>
        <h1 className="text-3xl font-serif font-bold text-[#1F315B] dark:text-[#F6F1E8]">
          Overall Business Health
        </h1>
        <p className="text-[#5E3B6C] dark:text-[#CDBED6] mt-2 max-w-2xl mx-auto">
          Understanding your business vitality score and what it means for your journey
        </p>
      </div>

      {/* Main Explanation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-[#1F315B] dark:text-[#F6F1E8]">
            What is Overall Business Health?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-[#1F315B] dark:text-[#F6F1E8] leading-relaxed">
            Think of your Overall Business Health like a vital signs monitor for your company. Just as a doctor checks your heart rate, blood pressure, and temperature to assess your physical wellbeing, this score synthesizes data from all 12 business domains to reveal your organization&apos;s overall vitality.
          </p>
          <p className="text-[#5E3B6C] dark:text-[#CDBED6] leading-relaxed">
            This isn&apos;t just an average of your domain scores. It&apos;s a sophisticated calculation that weighs how well your business areas work <em>together</em>. A business with balanced, aligned domains often scores higher than one with stellar performance in some areas and critical gaps in others.
          </p>
          <p className="text-[#1F315B] dark:text-[#F6F1E8] leading-relaxed">
            Your Overall Business Health score helps you understand: Are you thriving? Are you surviving? Are you building toward something bigger? This number tells the story of where you truly are—and where you&apos;re headed.
          </p>
        </CardContent>
      </Card>

      {/* Your Score Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-[#1F315B] dark:text-[#F6F1E8]">
            Your Score: A Snapshot of Now
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-[#1F315B] dark:text-[#F6F1E8] leading-relaxed">
            Your Overall Business Health score reflects your <strong>current business reality</strong>—the culmination of your decisions, systems, challenges, and wins up to this moment.
          </p>
          <div className="bg-[#1F315B]/5 dark:bg-[#CDBED6]/10 rounded-lg p-4">
            <h4 className="font-semibold text-[#1F315B] dark:text-[#F6F1E8] mb-2">How we calculate it:</h4>
            <ul className="space-y-2 text-[#5E3B6C] dark:text-[#CDBED6]">
              <li>• We aggregate scores from all 12 business domains</li>
              <li>• We weight domains based on their interdependence and impact</li>
              <li>• We factor in trend direction—are you improving or declining?</li>
              <li>• We consider alignment—how well do your domains support each other?</li>
              <li>• The result is a 0-100 score that represents your holistic business vitality</li>
            </ul>
          </div>
          <p className="text-[#D4AF63] font-medium">
            This score is your starting point, not your destination. Every thriving business has been exactly where you are now.
          </p>
        </CardContent>
      </Card>

      {/* Health Phases */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-[#1F315B] dark:text-[#F6F1E8]">
            The Four Phases of Business Health
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-[#1F315B] dark:text-[#F6F1E8]">
            Business health exists on a spectrum. Understanding which phase you&apos;re in helps you focus on the right priorities and set realistic expectations for growth.
          </p>
          
          <div className="space-y-4">
            {healthPhases.map((phase) => (
              <div key={phase.name} className="border border-[#1F315B]/10 dark:border-[#CDBED6]/20 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-4 h-4 rounded-full ${phase.color}`} />
                  <h4 className="font-semibold text-[#1F315B] dark:text-[#F6F1E8]">
                    {phase.name} ({phase.range})
                  </h4>
                </div>
                <p className="text-[#5E3B6C] dark:text-[#CDBED6] mb-3">
                  {phase.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {phase.characteristics.map((char, i) => (
                    <span 
                      key={i}
                      className="text-xs px-2 py-1 bg-[#1F315B]/5 dark:bg-[#CDBED6]/10 rounded-full text-[#5E3B6C] dark:text-[#CDBED6]"
                    >
                      {char}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          <div className="bg-[#D4AF63]/10 rounded-lg p-4 border border-[#D4AF63]/30">
            <p className="text-[#1F315B] dark:text-[#F6F1E8] font-medium">
              Important: These phases are not judgments—they are information. A business in Survival mode with a clear plan often outperforms one in Growth mode that is coasting without direction.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Focus Areas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-[#1F315B] dark:text-[#F6F1E8]">
            Your Focus Areas: Where to Direct Energy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-[#1F315B] dark:text-[#F6F1E8] leading-relaxed">
            Focus Areas are automatically identified based on your lowest-scoring domains and recent assessment responses. These represent the 3-5 areas where improvement will have the biggest impact on your overall business health.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/20">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <h4 className="font-semibold text-red-600">Critical</h4>
              </div>
              <p className="text-sm text-[#5E3B6C] dark:text-[#CDBED6]">
                Domains scoring below 40. These are creating significant friction and need immediate attention.
              </p>
            </div>
            <div className="bg-yellow-500/10 rounded-lg p-4 border border-yellow-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-5 h-5 text-yellow-600" />
                <h4 className="font-semibold text-yellow-600">Developing</h4>
              </div>
              <p className="text-sm text-[#5E3B6C] dark:text-[#CDBED6]">
                Domains scoring 40-70. These are functional but have room for significant improvement.
              </p>
            </div>
            <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/20">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h4 className="font-semibold text-green-600">Strong</h4>
              </div>
              <p className="text-sm text-[#5E3B6C] dark:text-[#CDBED6]">
                Domains scoring above 70. These are working well and may be leveraged to support other areas.
              </p>
            </div>
          </div>
          <p className="text-[#1F315B] dark:text-[#F6F1E8]">
            We recommend focusing 70% of your improvement energy on Critical areas, 20% on Developing, and 10% on optimizing Strong domains.
          </p>
        </CardContent>
      </Card>

      {/* How Scores Evolve */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-[#1F315B] dark:text-[#F6F1E8]">
            How Your Score Evolves Over Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-[#1F315B] dark:text-[#F6F1E8] mb-4">
            Business health is dynamic. Your score will rise and fall as you grow, face challenges, and implement changes.
          </p>
          <ul className="space-y-3 text-[#5E3B6C] dark:text-[#CDBED6]">
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-[#D4AF63] mt-2 flex-shrink-0"></span>
              <span><strong className="text-[#1F315B] dark:text-[#F6F1E8]">Quarterly reassessments</strong> provide the most accurate picture of your trajectory</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-[#D4AF63] mt-2 flex-shrink-0"></span>
              <span><strong className="text-[#1F315B] dark:text-[#F6F1E8]">Trend matters more than points</strong>—a steady climb from 45 to 55 to 65 is excellent progress</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-[#D4AF63] mt-2 flex-shrink-0"></span>
              <span><strong className="text-[#1F315B] dark:text-[#F6F1E8]">Temporary dips are normal</strong> during major transitions like hiring, system changes, or market shifts</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-[#D4AF63] mt-2 flex-shrink-0"></span>
              <span><strong className="text-[#1F315B] dark:text-[#F6F1E8]">Plateaus are opportunities</strong> to consolidate gains before the next growth push</span>
            </li>
          </ul>
          <p className="text-[#1F315B] dark:text-[#F6F1E8] mt-4 font-medium">
            Most businesses see 10-15 point improvements in their Overall Business Health within 6-12 months of focused, consistent action.
          </p>
        </CardContent>
      </Card>

      {/* FAQ Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-[#1F315B] dark:text-[#F6F1E8]">
            Frequently Asked Questions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <div
                key={faq.id}
                className="border border-[#1F315B]/10 dark:border-[#CDBED6]/20 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => toggleFaq(faq.id)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-[#1F315B]/5 dark:hover:bg-[#CDBED6]/5 transition-colors"
                >
                  <span className="font-medium text-[#1F315B] dark:text-[#F6F1E8]">
                    {faq.question}
                  </span>
                  {openFaq === faq.id ? (
                    <ChevronUp className="w-5 h-5 text-[#B9A9A9] flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-[#B9A9A9] flex-shrink-0" />
                  )}
                </button>
                {openFaq === faq.id && (
                  <div className="px-4 pb-4">
                    <p className="text-[#5E3B6C] dark:text-[#CDBED6]">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Journey Section */}
      <Card className="bg-gradient-to-br from-[#1F315B] to-[#5E3B6C] text-[#F6F1E8]">
        <CardHeader>
          <CardTitle className="text-xl text-[#F6F1E8]">
            Your Health Journey
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-[#D4AF63] flex items-center justify-center text-[#1F315B] font-bold flex-shrink-0">
                1
              </div>
              <div>
                <p className="font-medium">Month 1: Baseline assessment reveals your starting point</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-[#D4AF63] flex items-center justify-center text-[#1F315B] font-bold flex-shrink-0">
                2
              </div>
              <div>
                <p className="font-medium">Month 2-3: Focus on critical domains; early wins build momentum</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-[#D4AF63] flex items-center justify-center text-[#1F315B] font-bold flex-shrink-0">
                3
              </div>
              <div>
                <p className="font-medium">Month 4-6: Systems integrate; score climbs as alignment improves</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-[#D4AF63] flex items-center justify-center text-[#1F315B] font-bold flex-shrink-0">
                4
              </div>
              <div>
                <p className="font-medium">Month 6-12: Compounding effects; health becomes your competitive edge</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-[#D4AF63] flex items-center justify-center text-[#1F315B] font-bold flex-shrink-0">
                ∞
              </div>
              <div>
                <p className="font-medium">Ongoing: Continuous monitoring prevents drift; health sustains success</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Closing Quote */}
      <div className="text-center py-8">
        <p className="text-lg text-[#5E3B6C] dark:text-[#CDBED6] italic">
          &quot;Your Overall Business Health score is not a grade—it is a compass. It shows you where you are so you can navigate to where you want to be.&quot;
        </p>
      </div>
    </div>
  );
}
