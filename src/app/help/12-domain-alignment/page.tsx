"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Target, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

export default function TwelveDomainAlignmentPage() {
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  const toggleFaq = (id: string) => {
    setOpenFaq(openFaq === id ? null : id);
  };

  const faqs = [
    {
      id: "score-bad",
      question: "Is a lower score bad?",
      answer: "Not at all. A lower score simply means there&apos;s more room for growth. The score is information, not judgment, and it is measured against your own baseline, not against anyone else."
    },
    {
      id: "need-ideal",
      question: "Do I need to be at 100 in all 12 domains?",
      answer: "No. No business is perfect in all areas, and every business has stronger and lighter domains. The key is knowing which domains need attention now. Your Next 3 Moves point you to them."
    },
    {
      id: "reassess",
      question: "How often should I reassess?",
      answer: "Your alignment shifts as you implement changes, so check in on a rhythm: a Quick Pulse (about 5 minutes, 18 questions) every month, your Profit assessment every quarter, your Brain assessment twice a year, and your Soul assessment once a year. Regular check-ins help you celebrate progress and catch drift before it becomes a problem."
    },
    {
      id: "score-down",
      question: "Can my score go down?",
      answer: "Yes, and that&apos;s okay. Sometimes addressing one domain temporarily lowers your score there as you dismantle old systems to build better ones. The overall trend matters more than any single measurement."
    },
    {
      id: "disagree",
      question: "What if I disagree with my score?",
      answer: "Trust your instincts. The assessment is a mirror, not a verdict. If a score feels off, click the domain on Executive Home to see which inputs make it up, and update any answer that no longer fits. Sometimes the gap between your self-perception and the score reveals blind spots worth investigating."
    },
    {
      id: "different",
      question: "How is this different from other business assessments?",
      answer: "Most assessments look at one area (like marketing or finances). The 12-Domain approach recognizes that your marketing can&apos;t thrive if your operations are broken, and your team can&apos;t excel without clear leadership. We look at the whole ecosystem."
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#c9a227]/20 mb-4">
          <Target className="w-8 h-8 text-[#c9a227]" />
        </div>
        <h1 className="text-3xl font-serif font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">
          12-Domain Business Alignment
        </h1>
        <p className="text-[#7b6b8d] dark:text-[#e8e4f0] mt-2">
          Understanding your business ecosystem score
        </p>
      </div>

      {/* Main Explanation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-[#1a2b4a] dark:text-[#F8F5F0]">
            What is the 12-Domain Business Alignment?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-[#1a2b4a] dark:text-[#F8F5F0] leading-relaxed">
            Think of your business like a living ecosystem with 12 vital organs. Just as your heart, lungs, and brain all need to work together for you to thrive, your business has 12 essential areas that must align for sustainable success.
          </p>
          <p className="text-[#7b6b8d] dark:text-[#e8e4f0] leading-relaxed">
            Our assessment looks at: <strong className="text-[#1a2b4a] dark:text-[#F8F5F0]">Marketing • Sales • Operations • Finance • Team • Systems • Leadership • Vision • Product • Client Experience • Legal • Sustainability</strong>
          </p>
          <p className="text-[#1a2b4a] dark:text-[#F8F5F0] leading-relaxed">
            Each domain represents a critical piece of your business puzzle. When they work in harmony, you experience flow, growth, and fulfillment. When one area is neglected, it creates stress that ripples through everything else. You will find your chart on the Business Alignment page (Alignment in the left menu).
          </p>
        </CardContent>
      </Card>

      {/* Your Score Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-[#1a2b4a] dark:text-[#F8F5F0]">
            Your &quot;You&quot; Score: Where You Are Today
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-[#1a2b4a] dark:text-[#F8F5F0] leading-relaxed">
            This score reflects your <strong>actual business reality</strong>—not theory, not wishful thinking, but where you truly stand right now.
          </p>
          <div className="bg-[#1a2b4a]/5 dark:bg-[#e8e4f0]/10 rounded-lg p-4">
            <h4 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0] mb-2">How we calculate it:</h4>
            <ul className="space-y-2 text-[#7b6b8d] dark:text-[#e8e4f0]">
              <li>• You take the Brain (systems &amp; operations), Soul (purpose, values &amp; story) and Profit (financial health) assessments, plus a short Quick Pulse check-in each month</li>
              <li>• Your answers are blended with live data from the Suite, like your income and expenses, sales activity, operational pillars and plan completeness</li>
              <li>• Each domain receives a score from 0-100</li>
              <li>• We average your scored domains for your overall alignment score</li>
            </ul>
          </div>
          <p className="text-[#c9a227] font-medium">
            This is your starting line, not a judgment. Every successful business owner began exactly where you are.
          </p>
        </CardContent>
      </Card>

      {/* Ideal Score Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-[#1a2b4a] dark:text-[#F8F5F0]">
            Your Baseline: Your Own Starting Line
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-[#1a2b4a] dark:text-[#F8F5F0] leading-relaxed">
            Your chart shows only <strong>your</strong> scores on each of the 12 domains, with no one else&apos;s numbers drawn over it. The first time you have scores, the Suite saves them as your <strong>baseline</strong>, and every later change is measured against it:
          </p>
          <ul className="space-y-2 text-[#7b6b8d] dark:text-[#e8e4f0]">
            <li>• The Domain Scores card shows how far each domain has moved since your baseline</li>
            <li>• The Progress page (Alignment in the left menu) shows your trajectory for every domain and for your overall score</li>
            <li>• Each Quick Pulse check-in adds a dated point to your Business Health Trend</li>
          </ul>
          <div className="bg-[#c9a227]/10 rounded-lg p-4 border border-[#c9a227]/30">
            <p className="text-[#1a2b4a] dark:text-[#F8F5F0] font-medium">
              Important: You don&apos;t need 100 in every domain. Your goal is steady movement against your own baseline, not matching anyone else&apos;s numbers.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* The Gap Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-[#1a2b4a] dark:text-[#F8F5F0]">
            Reading Your Chart: Your Roadmap to Growth
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-[#1a2b4a] dark:text-[#F8F5F0] leading-relaxed">
            The space between where a domain is today and where you want it isn&apos;t a problem. <strong>It&apos;s your opportunity</strong>. The Suite uses the same four phases for each domain as it does for your overall score:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/20">
              <h4 className="font-semibold text-red-600 mb-2">Survival (0-40)</h4>
              <p className="text-sm text-[#7b6b8d] dark:text-[#e8e4f0]">This domain is likely creating friction; addressing it unlocks energy for everything else</p>
            </div>
            <div className="bg-yellow-500/10 rounded-lg p-4 border border-yellow-500/20">
              <h4 className="font-semibold text-yellow-600 mb-2">Growth (41-60)</h4>
              <p className="text-sm text-[#7b6b8d] dark:text-[#e8e4f0]">This is your growth edge; focused attention here yields big results</p>
            </div>
            <div className="bg-teal-500/10 rounded-lg p-4 border border-teal-500/20">
              <h4 className="font-semibold text-teal-600 mb-2">Expansion (61-80)</h4>
              <p className="text-sm text-[#7b6b8d] dark:text-[#e8e4f0]">Working well; scale what works and keep it steady</p>
            </div>
            <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/20">
              <h4 className="font-semibold text-green-600 mb-2">Legacy (81-100)</h4>
              <p className="text-sm text-[#7b6b8d] dark:text-[#e8e4f0]">You&apos;re doing well; fine-tuning will create excellence</p>
            </div>
          </div>
          <p className="text-[#1a2b4a] dark:text-[#F8F5F0]">
            Your Next 3 Moves and your 90-day Growth Roadmap, both on the Business Alignment page, start with your lowest-scoring domains, built from your own answers.
          </p>
        </CardContent>
      </Card>

      {/* How Scores Evolve */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-[#1a2b4a] dark:text-[#F8F5F0]">
            How Your Score Evolves
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-[#1a2b4a] dark:text-[#F8F5F0] mb-4">
            Your alignment isn&apos;t static—it grows as you grow.
          </p>
          <ul className="space-y-3 text-[#7b6b8d] dark:text-[#e8e4f0]">
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-[#c9a227] mt-2 flex-shrink-0"></span>
              <span><strong className="text-[#1a2b4a] dark:text-[#F8F5F0]">Regular check-ins</strong> track your progress: a monthly Quick Pulse, plus your Profit, Brain and Soul assessments on their own rhythms</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-[#c9a227] mt-2 flex-shrink-0"></span>
              <span><strong className="text-[#1a2b4a] dark:text-[#F8F5F0]">Saved answers</strong> remember your journey, so you&apos;re not starting from scratch (the Brain and Soul assessments save as you go)</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-[#c9a227] mt-2 flex-shrink-0"></span>
              <span><strong className="text-[#1a2b4a] dark:text-[#F8F5F0]">Your AI assistant</strong> writes an alignment briefing and a 90-day Growth Roadmap from your current scores, with three moves you can add to your tasks</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-[#c9a227] mt-2 flex-shrink-0"></span>
              <span><strong className="text-[#1a2b4a] dark:text-[#F8F5F0]">Next 3 Moves</strong> are built around your lowest-scoring domains, and one click adds any of them to your tasks</span>
            </li>
          </ul>
          <p className="text-[#1a2b4a] dark:text-[#F8F5F0] mt-4 font-medium">
            Focused attention on your lowest domains is what moves your chart, and the Progress page shows exactly how far each one has come.
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
            Your Alignment Journey
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-[#c9a227] flex items-center justify-center text-[#1a2b4a] font-bold flex-shrink-0">
                1
              </div>
              <div>
                <p className="font-medium">Month 1: Your Brain, Soul and Profit assessments reveal your current reality</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-[#c9a227] flex items-center justify-center text-[#1a2b4a] font-bold flex-shrink-0">
                2
              </div>
              <div>
                <p className="font-medium">Month 2-3: Focused action on 1-2 priority domains</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-[#c9a227] flex items-center justify-center text-[#1a2b4a] font-bold flex-shrink-0">
                3
              </div>
              <div>
                <p className="font-medium">Month 4: Reassessment shows progress; new priorities emerge</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-[#c9a227] flex items-center justify-center text-[#1a2b4a] font-bold flex-shrink-0">
                4
              </div>
              <div>
                <p className="font-medium">Month 5-6: Momentum builds as domains strengthen each other</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-[#c9a227] flex items-center justify-center text-[#1a2b4a] font-bold flex-shrink-0">
                ∞
              </div>
              <div>
                <p className="font-medium">Ongoing: Continuous alignment becomes your competitive advantage</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Closing Quote */}
      <div className="text-center py-8">
        <p className="text-lg text-[#7b6b8d] dark:text-[#e8e4f0] italic">
          &quot;The goal isn&apos;t perfection. The goal is alignment—having all 12 domains working together so your business supports your life, rather than draining it.&quot;
        </p>
      </div>
    </div>
  );
}
