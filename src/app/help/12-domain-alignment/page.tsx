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
      answer: "Not at all. A lower score simply means there&apos;s more room for growth. Some of our most successful clients started with overall scores in the 40s. The score is information, not judgment."
    },
    {
      id: "need-ideal",
      question: "Do I need to be at &apos;Ideal&apos; in all 12 domains?",
      answer: "No business is perfect in all areas. The most successful businesses we work with typically have 3-4 domains at or near ideal, with the rest in the 70-85% range. The key is knowing which domains need attention now."
    },
    {
      id: "reassess",
      question: "How often should I reassess?",
      answer: "We recommend quarterly reassessments. Business moves fast, and your alignment shifts as you implement changes. Quarterly checks help you celebrate progress and catch drift before it becomes a problem."
    },
    {
      id: "score-down",
      question: "Can my score go down?",
      answer: "Yes, and that&apos;s okay. Sometimes addressing one domain temporarily lowers your score there as you dismantle old systems to build better ones. The overall trend matters more than any single measurement."
    },
    {
      id: "disagree",
      question: "What if I disagree with my score?",
      answer: "Trust your instincts. The assessment is a mirror, not a verdict. If a score feels off, explore why. Sometimes the gap between your self-perception and the score reveals blind spots worth investigating."
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
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#D4AF63]/20 mb-4">
          <Target className="w-8 h-8 text-[#D4AF63]" />
        </div>
        <h1 className="text-3xl font-serif font-bold text-[#1F315B] dark:text-[#F6F1E8]">
          12-Domain Business Alignment
        </h1>
        <p className="text-[#5E3B6C] dark:text-[#CDBED6] mt-2">
          Understanding your business ecosystem score
        </p>
      </div>

      {/* Main Explanation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-[#1F315B] dark:text-[#F6F1E8]">
            What is the 12-Domain Business Alignment?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-[#1F315B] dark:text-[#F6F1E8] leading-relaxed">
            Think of your business like a living ecosystem with 12 vital organs. Just as your heart, lungs, and brain all need to work together for you to thrive, your business has 12 essential areas that must align for sustainable success.
          </p>
          <p className="text-[#5E3B6C] dark:text-[#CDBED6] leading-relaxed">
            Our assessment looks at: <strong className="text-[#1F315B] dark:text-[#F6F1E8]">Marketing • Sales • Operations • Finance • Team • Systems • Leadership • Vision • Product • Client Experience • Legal • Sustainability</strong>
          </p>
          <p className="text-[#1F315B] dark:text-[#F6F1E8] leading-relaxed">
            Each domain represents a critical piece of your business puzzle. When they work in harmony, you experience flow, growth, and fulfillment. When one area is neglected, it creates stress that ripples through everything else.
          </p>
        </CardContent>
      </Card>

      {/* Your Score Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-[#1F315B] dark:text-[#F6F1E8]">
            Your &quot;You&quot; Score: Where You Are Today
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-[#1F315B] dark:text-[#F6F1E8] leading-relaxed">
            This score reflects your <strong>actual business reality</strong>—not theory, not wishful thinking, but where you truly stand right now.
          </p>
          <div className="bg-[#1F315B]/5 dark:bg-[#CDBED6]/10 rounded-lg p-4">
            <h4 className="font-semibold text-[#1F315B] dark:text-[#F6F1E8] mb-2">How we calculate it:</h4>
            <ul className="space-y-2 text-[#5E3B6C] dark:text-[#CDBED6]">
              <li>• You answer thoughtful questions about each domain (about 5 minutes per area)</li>
              <li>• Your responses are scored based on proven business benchmarks</li>
              <li>• Each domain receives a score from 0-100</li>
              <li>• We average all 12 domains for your overall alignment score</li>
            </ul>
          </div>
          <p className="text-[#D4AF63] font-medium">
            This is your starting line, not a judgment. Every successful business owner began exactly where you are.
          </p>
        </CardContent>
      </Card>

      {/* Ideal Score Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-[#1F315B] dark:text-[#F6F1E8]">
            The &quot;Ideal&quot; Score: Your North Star
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-[#1F315B] dark:text-[#F6F1E8] leading-relaxed">
            The ideal represents <strong>best-practice standards</strong>—what healthy, thriving businesses typically achieve in each area. These aren&apos;t arbitrary numbers; they&apos;re based on:
          </p>
          <ul className="space-y-2 text-[#5E3B6C] dark:text-[#CDBED6]">
            <li>• Research from thousands of successful businesses</li>
            <li>• Industry standards for sustainable growth</li>
            <li>• The threshold where businesses typically experience momentum rather than struggle</li>
          </ul>
          <div className="bg-[#D4AF63]/10 rounded-lg p-4 border border-[#D4AF63]/30">
            <p className="text-[#1F315B] dark:text-[#F6F1E8] font-medium">
              Important: You don&apos;t need 100% in every domain. The ideal is a guidepost, not a requirement. Even businesses doing seven figures often have domains in the 70-80% range.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* The Gap Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-[#1F315B] dark:text-[#F6F1E8]">
            The Gap: Your Roadmap to Growth
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-[#1F315B] dark:text-[#F6F1E8] leading-relaxed">
            The space between &quot;You&quot; and &quot;Ideal&quot; isn&apos;t a problem—<strong>it&apos;s your opportunity</strong>.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/20">
              <h4 className="font-semibold text-green-600 mb-2">Small Gaps (0-15 points)</h4>
              <p className="text-sm text-[#5E3B6C] dark:text-[#CDBED6]">You&apos;re doing well; fine-tuning will create excellence</p>
            </div>
            <div className="bg-yellow-500/10 rounded-lg p-4 border border-yellow-500/20">
              <h4 className="font-semibold text-yellow-600 mb-2">Medium Gaps (15-30 points)</h4>
              <p className="text-sm text-[#5E3B6C] dark:text-[#CDBED6]">This is your growth edge; focused attention here yields big results</p>
            </div>
            <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/20">
              <h4 className="font-semibold text-red-600 mb-2">Large Gaps (30+ points)</h4>
              <p className="text-sm text-[#5E3B6C] dark:text-[#CDBED6]">This domain is likely creating friction; addressing it unlocks energy for everything else</p>
            </div>
          </div>
          <p className="text-[#1F315B] dark:text-[#F6F1E8]">
            We help you prioritize which domains to strengthen first based on your unique situation and goals.
          </p>
        </CardContent>
      </Card>

      {/* How Scores Evolve */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-[#1F315B] dark:text-[#F6F1E8]">
            How Your Score Evolves
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-[#1F315B] dark:text-[#F6F1E8] mb-4">
            Your alignment isn&apos;t static—it grows as you grow.
          </p>
          <ul className="space-y-3 text-[#5E3B6C] dark:text-[#CDBED6]">
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-[#D4AF63] mt-2 flex-shrink-0"></span>
              <span><strong className="text-[#1F315B] dark:text-[#F6F1E8]">Quarterly reassessments</strong> track your progress</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-[#D4AF63] mt-2 flex-shrink-0"></span>
              <span><strong className="text-[#1F315B] dark:text-[#F6F1E8]">Unified Memory</strong> remembers your journey, so you&apos;re not starting from scratch</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-[#D4AF63] mt-2 flex-shrink-0"></span>
              <span><strong className="text-[#1F315B] dark:text-[#F6F1E8]">AI-powered insights</strong> suggest your next best moves based on your current scores</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-[#D4AF63] mt-2 flex-shrink-0"></span>
              <span><strong className="text-[#1F315B] dark:text-[#F6F1E8]">Action items</strong> are automatically generated for your lowest-scoring domains</span>
            </li>
          </ul>
          <p className="text-[#1F315B] dark:text-[#F6F1E8] mt-4 font-medium">
            Many clients see 10-20 point improvements in their lowest domains within 90 days of focused attention.
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
            Your Alignment Journey
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-[#D4AF63] flex items-center justify-center text-[#1F315B] font-bold flex-shrink-0">
                1
              </div>
              <div>
                <p className="font-medium">Month 1: Assessment reveals your current reality</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-[#D4AF63] flex items-center justify-center text-[#1F315B] font-bold flex-shrink-0">
                2
              </div>
              <div>
                <p className="font-medium">Month 2-3: Focused action on 1-2 priority domains</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-[#D4AF63] flex items-center justify-center text-[#1F315B] font-bold flex-shrink-0">
                3
              </div>
              <div>
                <p className="font-medium">Month 4: Reassessment shows progress; new priorities emerge</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-[#D4AF63] flex items-center justify-center text-[#1F315B] font-bold flex-shrink-0">
                4
              </div>
              <div>
                <p className="font-medium">Month 5-6: Momentum builds as domains strengthen each other</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-[#D4AF63] flex items-center justify-center text-[#1F315B] font-bold flex-shrink-0">
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
        <p className="text-lg text-[#5E3B6C] dark:text-[#CDBED6] italic">
          &quot;The goal isn&apos;t perfection. The goal is alignment—having all 12 domains working together so your business supports your life, rather than draining it.&quot;
        </p>
      </div>
    </div>
  );
}
