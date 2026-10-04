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
      answer: "Scores are grouped into four phases: Survival (0-40), Growth (41-60), Expansion (61-80), and Legacy (81-100). The goal is progress, not perfection. Moving from 45 to 65 represents significant business improvement, and your own trend matters more than any single number."
    },
    {
      id: "how-often-update",
      question: "How often does my Overall Business Health score update?",
      answer: "Your score updates as your answers and your live Suite data change: finishing or revisiting an assessment, a monthly Quick Pulse check-in, and the numbers you keep in your finances, sales activity, operations and plans. A good rhythm is a Quick Pulse every month, your Profit assessment every quarter, your Brain assessment twice a year, and your Soul assessment once a year."
    },
    {
      id: "why-score-dropped",
      question: "Why did my score drop even though I am working hard?",
      answer: "Score drops often happen when you are dismantling old systems to build better ones, or when new challenges emerge faster than solutions. This is normal during transformation periods. Focus on the trend over 3-6 months rather than week-to-week fluctuations."
    },
    {
      id: "focus-areas",
      question: "How are my Focus Areas determined?",
      answer: "Your Primary focus on the Overall Business Health card is simply your three lowest-scoring domains. Those are the areas where improvement will move your overall health the most, and the areas your Next 3 Moves are built to address."
    },
    {
      id: "different-scores",
      question: "Why does my Overall score differ from my individual domain scores?",
      answer: "Your Overall Business Health is the average of your domain scores, so a very low domain pulls it down even when others are strong. A business with every domain at 70 scores higher than one with domains at 90 and 40. Each domain score is itself a blend of your assessment answers and your live data, which is why a domain can look different from the answers you remember giving."
    },
    {
      id: "improve-score",
      question: "What is the fastest way to improve my Overall Business Health score?",
      answer: "Focus on your lowest-scoring domain first. Improving a 35 to a 55 has more impact on your overall health than improving a 75 to an 85. Also look for work that counts twice: some answers feed more than one domain (your operations and internal systems answers count toward both Operations and Systems, for example), so one strong piece of work can lift more than one score."
    }
  ];

  const healthPhases = [
    {
      range: "81-100",
      name: "Legacy",
      color: "bg-green-500",
      description: "Your business is thriving with strong systems and predictable growth. Focus on lasting impact and freedom, and on developing leadership capacity.",
      characteristics: ["Consistent cash flow", "Strong team autonomy", "Clear market position", "Systems that scale"]
    },
    {
      range: "61-80",
      name: "Expansion",
      color: "bg-[#c9a227]",
      description: "You have working systems and real momentum. Align your operations and cash flow to scale what works with ease and clarity.",
      characteristics: ["Revenue growing", "Systems being built", "Team expanding", "Processes documented"]
    },
    {
      range: "41-60",
      name: "Growth",
      color: "bg-yellow-500",
      description: "You are building momentum and establishing foundations. Focus on systematizing what works and clarifying your next phase.",
      characteristics: ["Product-market fit found", "Early systems in place", "Revenue inconsistent", "Wearing many hats"]
    },
    {
      range: "0-40",
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
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#c9a227]/20 mb-4">
          <HeartPulse className="w-8 h-8 text-[#c9a227]" />
        </div>
        <h1 className="text-3xl font-serif font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">
          Overall Business Health
        </h1>
        <p className="text-[#7b6b8d] dark:text-[#e8e4f0] mt-2 max-w-2xl mx-auto">
          Understanding your business vitality score and what it means for your journey
        </p>
      </div>

      {/* Main Explanation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-[#1a2b4a] dark:text-[#F8F5F0]">
            What is Overall Business Health?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-[#1a2b4a] dark:text-[#F8F5F0] leading-relaxed">
            Think of your Overall Business Health like a vital signs monitor for your company. Just as a doctor checks your heart rate, blood pressure, and temperature to assess your physical wellbeing, this score brings together all 12 business domains to reveal your organization&apos;s overall vitality. You will find it at the top of the Business Alignment page (Alignment in the left menu).
          </p>
          <p className="text-[#7b6b8d] dark:text-[#e8e4f0] leading-relaxed">
            It is the average of your 12 domain scores, and each domain score is built from your own answers and your own live data. That means a business with balanced, aligned domains scores higher than one with stellar performance in some areas and critical gaps in others. Your score appears once at least three domains have been scored.
          </p>
          <p className="text-[#1a2b4a] dark:text-[#F8F5F0] leading-relaxed">
            Your Overall Business Health score helps you understand: Are you thriving? Are you surviving? Are you building toward something bigger? This number tells the story of where you truly are—and where you&apos;re headed.
          </p>
        </CardContent>
      </Card>

      {/* Your Score Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-[#1a2b4a] dark:text-[#F8F5F0]">
            Your Score: A Snapshot of Now
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-[#1a2b4a] dark:text-[#F8F5F0] leading-relaxed">
            Your Overall Business Health score reflects your <strong>current business reality</strong>—the culmination of your decisions, systems, challenges, and wins up to this moment.
          </p>
          <div className="bg-[#1a2b4a]/5 dark:bg-[#e8e4f0]/10 rounded-lg p-4">
            <h4 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0] mb-2">How we calculate it:</h4>
            <ul className="space-y-2 text-[#7b6b8d] dark:text-[#e8e4f0]">
              <li>• Each of your 12 domains gets its own 0-100 score</li>
              <li>• A domain score blends your Brain, Soul and Profit assessment answers, your monthly Quick Pulse check-in, and live data from the Suite (your finances, sales activity, operational pillars, Legal &amp; Compliance checklist and plan completeness)</li>
              <li>• If one of those inputs hasn&apos;t been answered yet, the others carry its weight until it is</li>
              <li>• Your Overall Business Health is the average of your domain scores, a 0-100 number</li>
              <li>• Once all three assessments are done, your Business Health Score, three next moves, a 90-day Growth Roadmap and your Alignment Profile are built from your own answers</li>
            </ul>
          </div>
          <p className="text-[#c9a227] font-medium">
            This score is your starting point, not your destination. Every thriving business has been exactly where you are now.
          </p>
        </CardContent>
      </Card>

      {/* Health Phases */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-[#1a2b4a] dark:text-[#F8F5F0]">
            The Four Phases of Business Health
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-[#1a2b4a] dark:text-[#F8F5F0]">
            Business health exists on a spectrum. Understanding which phase you&apos;re in helps you focus on the right priorities and set realistic expectations for growth.
          </p>
          
          <div className="space-y-4">
            {healthPhases.map((phase) => (
              <div key={phase.name} className="border border-[#1a2b4a]/10 dark:border-[#e8e4f0]/20 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-4 h-4 rounded-full ${phase.color}`} />
                  <h4 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">
                    {phase.name} ({phase.range})
                  </h4>
                </div>
                <p className="text-[#7b6b8d] dark:text-[#e8e4f0] mb-3">
                  {phase.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {phase.characteristics.map((char, i) => (
                    <span 
                      key={i}
                      className="text-xs px-2 py-1 bg-[#1a2b4a]/5 dark:bg-[#e8e4f0]/10 rounded-full text-[#7b6b8d] dark:text-[#e8e4f0]"
                    >
                      {char}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          <div className="bg-[#c9a227]/10 rounded-lg p-4 border border-[#c9a227]/30">
            <p className="text-[#1a2b4a] dark:text-[#F8F5F0] font-medium">
              Important: These phases are not judgments—they are information. A business in Survival mode with a clear plan often outperforms one in Growth mode that is coasting without direction.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Focus Areas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-[#1a2b4a] dark:text-[#F8F5F0]">
            Your Focus Areas: Where to Direct Energy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-[#1a2b4a] dark:text-[#F8F5F0] leading-relaxed">
            Your Focus Areas (shown as &quot;Primary focus&quot; on the card) are your three lowest-scoring domains. These are the areas where improvement will have the biggest impact on your overall business health. Click any domain card on Executive Home to see exactly which inputs make up its score.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/20">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <h4 className="font-semibold text-red-600">Survival (0-40)</h4>
              </div>
              <p className="text-sm text-[#7b6b8d] dark:text-[#e8e4f0]">
                These domains are creating the most friction and are the best place to start. One thing at a time.
              </p>
            </div>
            <div className="bg-yellow-500/10 rounded-lg p-4 border border-yellow-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-5 h-5 text-yellow-600" />
                <h4 className="font-semibold text-yellow-600">Growth (41-60)</h4>
              </div>
              <p className="text-sm text-[#7b6b8d] dark:text-[#e8e4f0]">
                The foundation is there and systems are taking shape. Strengthen these next.
              </p>
            </div>
            <div className="bg-teal-500/10 rounded-lg p-4 border border-teal-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-5 h-5 text-teal-600" />
                <h4 className="font-semibold text-teal-600">Expansion (61-80)</h4>
              </div>
              <p className="text-sm text-[#7b6b8d] dark:text-[#e8e4f0]">
                Working well. The work here is scaling what works and keeping it steady.
              </p>
            </div>
            <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/20">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h4 className="font-semibold text-green-600">Legacy (81-100)</h4>
              </div>
              <p className="text-sm text-[#7b6b8d] dark:text-[#e8e4f0]">
                A real strength. Protect it, and lean on it to support your other areas.
              </p>
            </div>
          </div>
          <p className="text-[#1a2b4a] dark:text-[#F8F5F0]">
            The same four phases describe your overall score and each of the 12 domains, so one scale is all you need to learn. Put most of your improvement energy into your Survival and Growth domains, keep the Expansion ones moving, and let your Legacy domains keep doing what they do.
          </p>
        </CardContent>
      </Card>

      {/* How Scores Evolve */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-[#1a2b4a] dark:text-[#F8F5F0]">
            How Your Score Evolves Over Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-[#1a2b4a] dark:text-[#F8F5F0] mb-4">
            Business health is dynamic. Your score will rise and fall as you grow, face challenges, and implement changes.
          </p>
          <ul className="space-y-3 text-[#7b6b8d] dark:text-[#e8e4f0]">
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-[#c9a227] mt-2 flex-shrink-0"></span>
              <span><strong className="text-[#1a2b4a] dark:text-[#F8F5F0]">Regular check-ins</strong> keep your picture current: a Quick Pulse monthly, Profit quarterly, Brain twice a year and Soul once a year</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-[#c9a227] mt-2 flex-shrink-0"></span>
              <span><strong className="text-[#1a2b4a] dark:text-[#F8F5F0]">Trend matters more than points</strong>—a steady climb from 45 to 55 to 65 is excellent progress</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-[#c9a227] mt-2 flex-shrink-0"></span>
              <span><strong className="text-[#1a2b4a] dark:text-[#F8F5F0]">Temporary dips are normal</strong> during major transitions like hiring, system changes, or market shifts</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-[#c9a227] mt-2 flex-shrink-0"></span>
              <span><strong className="text-[#1a2b4a] dark:text-[#F8F5F0]">Plateaus are opportunities</strong> to consolidate gains before the next growth push</span>
            </li>
          </ul>
          <p className="text-[#1a2b4a] dark:text-[#F8F5F0] mt-4 font-medium">
            Each Quick Pulse and re-score adds a dated point to your Business Health Trend, so you can watch your own progress against your baseline on the Progress page.
          </p>
        </CardContent>
      </Card>

      {/* FAQ Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-[#1a2b4a] dark:text-[#F8F5F0]">
            Frequently Asked Questions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <div
                key={faq.id}
                className="border border-[#1a2b4a]/10 dark:border-[#e8e4f0]/20 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => toggleFaq(faq.id)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-[#1a2b4a]/5 dark:hover:bg-[#e8e4f0]/5 transition-colors"
                >
                  <span className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">
                    {faq.question}
                  </span>
                  {openFaq === faq.id ? (
                    <ChevronUp className="w-5 h-5 text-[#b8a898] flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-[#b8a898] flex-shrink-0" />
                  )}
                </button>
                {openFaq === faq.id && (
                  <div className="px-4 pb-4">
                    <p className="text-[#7b6b8d] dark:text-[#e8e4f0]">
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
      <Card className="bg-gradient-to-br from-[#1a2b4a] to-[#7b6b8d] text-[#F8F5F0]">
        <CardHeader>
          <CardTitle className="text-xl text-[#F8F5F0]">
            Your Health Journey
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-[#c9a227] flex items-center justify-center text-[#1a2b4a] font-bold flex-shrink-0">
                1
              </div>
              <div>
                <p className="font-medium">Month 1: Your Brain, Soul and Profit assessments reveal your starting point, and your first scores become your baseline</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-[#c9a227] flex items-center justify-center text-[#1a2b4a] font-bold flex-shrink-0">
                2
              </div>
              <div>
                <p className="font-medium">Month 2-3: Focus on critical domains; early wins build momentum</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-[#c9a227] flex items-center justify-center text-[#1a2b4a] font-bold flex-shrink-0">
                3
              </div>
              <div>
                <p className="font-medium">Month 4-6: Systems integrate; score climbs as alignment improves</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-[#c9a227] flex items-center justify-center text-[#1a2b4a] font-bold flex-shrink-0">
                4
              </div>
              <div>
                <p className="font-medium">Month 6-12: Compounding effects; health becomes your competitive edge</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-[#c9a227] flex items-center justify-center text-[#1a2b4a] font-bold flex-shrink-0">
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
        <p className="text-lg text-[#7b6b8d] dark:text-[#e8e4f0] italic">
          &quot;Your Overall Business Health score is not a grade—it is a compass. It shows you where you are so you can navigate to where you want to be.&quot;
        </p>
      </div>
    </div>
  );
}
