"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ListChecks, ChevronDown, ChevronUp, Target, Zap, Clock, ArrowRight } from "lucide-react";
import { useState } from "react";

export default function NextThreeMovesPage() {
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  const toggleFaq = (id: string) => {
    setOpenFaq(openFaq === id ? null : id);
  };

  const faqs = [
    {
      id: "how-generated",
      question: "How are my Next 3 Moves generated?",
      answer: "Your Next 3 Moves are intelligently generated based on multiple factors: your lowest-scoring domains from assessments, upcoming milestones in your business plan, action items you've created, operating rhythm tasks, and AI analysis of your business patterns. The system prioritizes moves that will have the highest impact on your overall business health."
    },
    {
      id: "how-often-update",
      question: "How often do my Next 3 Moves update?",
      answer: "Your Next 3 Moves refresh automatically as you complete items, when new assessment data comes in, or when you reach milestones. You can also manually refresh them if your priorities shift. We recommend reviewing them weekly as part of your planning rhythm."
    },
    {
      id: "change-moves",
      question: "Can I change or customize my Next 3 Moves?",
      answer: "Absolutely. While the system generates recommendations based on data, you know your business best. You can edit, reorder, replace, or mark moves as complete. The AI learns from your choices and will factor your preferences into future recommendations."
    },
    {
      id: "impact-levels",
      question: "What do the Impact levels (High, Medium, Low) mean?",
      answer: "High Impact moves significantly improve your business health score or address critical gaps. Medium Impact moves build important systems or capabilities. Low Impact moves are maintenance tasks or quick wins that keep momentum going. We recommend tackling High Impact moves first when possible."
    },
    {
      id: "not-accurate",
      question: "What if the suggested moves don't feel right for my business?",
      answer: "Trust your intuition. The AI makes recommendations based on patterns and data, but you have context it doesn't. If a move doesn't resonate, replace it with something that does. Over time, as you provide feedback by accepting or changing suggestions, the recommendations will align more closely with your style and priorities."
    },
    {
      id: "complete-all-three",
      question: "Do I need to complete all three moves before getting new ones?",
      answer: "Not at all. You can mark moves complete individually, and new ones will appear to take their place. Some entrepreneurs prefer to focus on one move at a time; others work on all three in parallel. Find the rhythm that works for you and your capacity."
    }
  ];

  const moveTypes = [
    {
      title: "Domain-Driven Moves",
      description: "Generated from your lowest-scoring 12-Domain areas",
      example: "Build cash flow forecast (Finance domain scoring 45)",
      icon: "📊"
    },
    {
      title: "Milestone Moves",
      description: "Tasks needed to reach upcoming business plan milestones",
      example: "Finalize speaker agreement for Q3 workshop",
      icon: "🎯"
    },
    {
      title: "Operating Rhythm Moves",
      description: "Regular practices that maintain business health",
      example: "Weekly team alignment meeting",
      icon: "🔄"
    },
    {
      title: "Quick Wins",
      description: "Low-effort, high-impact actions for momentum",
      example: "Send follow-up to 5 warm leads",
      icon: "⚡"
    }
  ];

  const prioritizationFramework = [
    {
      factor: "Impact on Business Health",
      weight: "40%",
      description: "How much will this move improve your overall score?"
    },
    {
      factor: "Urgency",
      weight: "25%",
      description: "Is there a deadline or time-sensitive opportunity?"
    },
    {
      factor: "Effort Required",
      weight: "20%",
      description: "Can you complete this with your current capacity?"
    },
    {
      factor: "Strategic Alignment",
      weight: "15%",
      description: "Does this support your 90-day and annual goals?"
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#D4AF63]/20 mb-4">
          <ListChecks className="w-8 h-8 text-[#D4AF63]" />
        </div>
        <h1 className="text-3xl font-serif font-bold text-[#1F315B] dark:text-[#F6F1E8]">
          Next 3 Moves
        </h1>
        <p className="text-[#5E3B6C] dark:text-[#CDBED6] mt-2 max-w-2xl mx-auto">
          Your prioritized action plan for moving from insight to impact
        </p>
      </div>

      {/* Main Explanation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-[#1F315B] dark:text-[#F6F1E8]">
            What are Next 3 Moves?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-[#1F315B] dark:text-[#F6F1E8] leading-relaxed">
            In a world of infinite possibilities and limited time, the question is not <em>what could you do?</em> but <strong>what should you do next?</strong> Your Next 3 Moves answer that question with clarity and precision.
          </p>
          <p className="text-[#5E3B6C] dark:text-[#CDBED6] leading-relaxed">
            These are not arbitrary to-do items. They are intelligently curated actions drawn from your assessments, business plan, operating rhythm, and AI analysis of what will move the needle most for your business right now.
          </p>
          <p className="text-[#1F315B] dark:text-[#F6F1E8] leading-relaxed">
            Think of your Next 3 Moves as your business&apos;s immediate priorities—the three actions that, if completed, will create the most positive momentum and bring you closer to your vision with the least wasted effort.
          </p>
        </CardContent>
      </Card>

      {/* How Moves Are Generated */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-[#1F315B] dark:text-[#F6F1E8]">
            How Your Moves Are Generated
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-[#1F315B] dark:text-[#F6F1E8]">
            Your Next 3 Moves are synthesized from multiple data sources across the LifeCharter platform:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {moveTypes.map((type) => (
              <div key={type.title} className="border border-[#1F315B]/10 dark:border-[#CDBED6]/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{type.icon}</span>
                  <h4 className="font-semibold text-[#1F315B] dark:text-[#F6F1E8]">{type.title}</h4>
                </div>
                <p className="text-sm text-[#5E3B6C] dark:text-[#CDBED6] mb-2">{type.description}</p>
                <p className="text-xs text-[#B9A9A9] italic">Example: {type.example}</p>
              </div>
            ))}
          </div>

          <div className="bg-[#1F315B]/5 dark:bg-[#CDBED6]/10 rounded-lg p-4">
            <h4 className="font-semibold text-[#1F315B] dark:text-[#F6F1E8] mb-3 flex items-center gap-2">
              <Target className="w-5 h-5 text-[#D4AF63]" />
              The Prioritization Algorithm
            </h4>
            <div className="space-y-3">
              {prioritizationFramework.map((item) => (
                <div key={item.factor} className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-[#1F315B] dark:text-[#F6F1E8]">{item.factor}</p>
                    <p className="text-sm text-[#5E3B6C] dark:text-[#CDBED6]">{item.description}</p>
                  </div>
                  <span className="text-[#D4AF63] font-semibold whitespace-nowrap">{item.weight}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Understanding Impact Levels */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-[#1F315B] dark:text-[#F6F1E8]">
            Understanding Impact Levels
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-[#1F315B] dark:text-[#F6F1E8] mb-4">
            Each move is tagged with an Impact level to help you prioritize your energy and attention:
          </p>
          
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-[#5E3B6C]/10 rounded-lg border-l-4 border-[#5E3B6C]">
              <div className="w-10 h-10 rounded-full bg-[#5E3B6C] flex items-center justify-center text-white font-bold flex-shrink-0">
                H
              </div>
              <div>
                <h4 className="font-semibold text-[#1F315B] dark:text-[#F6F1E8]">High Impact</h4>
                <p className="text-[#5E3B6C] dark:text-[#CDBED6]">
                  These moves significantly improve your business health score (10+ points), address critical gaps, or unlock major opportunities. They often require more effort but yield disproportionate results. Prioritize these when you have focused time and energy.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-[#2E7C83]/10 rounded-lg border-l-4 border-[#2E7C83]">
              <div className="w-10 h-10 rounded-full bg-[#2E7C83] flex items-center justify-center text-white font-bold flex-shrink-0">
                M
              </div>
              <div>
                <h4 className="font-semibold text-[#1F315B] dark:text-[#F6F1E8]">Medium Impact</h4>
                <p className="text-[#5E3B6C] dark:text-[#CDBED6]">
                  These moves build important systems, capabilities, or relationships. They typically improve domain scores by 5-10 points. These are your bread-and-butter growth actions—steady progress that compounds over time.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-[#CDBED6]/20 rounded-lg border-l-4 border-[#CDBED6]">
              <div className="w-10 h-10 rounded-full bg-[#CDBED6] flex items-center justify-center text-[#1F315B] font-bold flex-shrink-0">
                L
              </div>
              <div>
                <h4 className="font-semibold text-[#1F315B] dark:text-[#F6F1E8]">Low Impact</h4>
                <p className="text-[#5E3B6C] dark:text-[#CDBED6]">
                  These are maintenance tasks, quick wins, or relationship-nurturing activities. While individually small, they keep momentum going and prevent backsliding. Perfect for low-energy days or when you need a sense of accomplishment.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-[#D4AF63]/10 rounded-lg border border-[#D4AF63]/30">
            <p className="text-[#1F315B] dark:text-[#F6F1E8] font-medium">
              Strategy Tip: Aim for a mix of impact levels. Complete one High Impact move per week, steady progress on Medium moves, and sprinkle in Low Impact wins to maintain momentum.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Working Your Moves */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-[#1F315B] dark:text-[#F6F1E8]">
            Working Your Moves: Best Practices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-[#1F315B] flex items-center justify-center text-white font-bold flex-shrink-0">
                1
              </div>
              <div>
                <h4 className="font-semibold text-[#1F315B] dark:text-[#F6F1E8]">Review Weekly</h4>
                <p className="text-[#5E3B6C] dark:text-[#CDBED6]">
                  Set a recurring calendar block—Monday morning works well—to review your Next 3 Moves. Ask: Are these still the right priorities? What has changed in my business? Do I need to refresh the list?
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-[#1F315B] flex items-center justify-center text-white font-bold flex-shrink-0">
                2
              </div>
              <div>
                <h4 className="font-semibold text-[#1F315B] dark:text-[#F6F1E8]">Time-Block Deep Work</h4>
                <p className="text-[#5E3B6C] dark:text-[#CDBED6]">
                  High Impact moves deserve uninterrupted focus. Block 2-4 hours on your calendar for deep work on your most important move. Turn off notifications, close unnecessary tabs, and give it your full attention.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-[#1F315B] flex items-center justify-center text-white font-bold flex-shrink-0">
                3
              </div>
              <div>
                <h4 className="font-semibold text-[#1F315B] dark:text-[#F6F1E8]">Break Down Big Moves</h4>
                <p className="text-[#5E3B6C] dark:text-[#CDBED6]">
                  If a move feels overwhelming, break it into smaller sub-tasks. &quot;Build cash flow forecast&quot; becomes: (1) Gather last 6 months data, (2) Create spreadsheet template, (3) Input projections, (4) Review with advisor.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-[#1F315B] flex items-center justify-center text-white font-bold flex-shrink-0">
                4
              </div>
              <div>
                <h4 className="font-semibold text-[#1F315B] dark:text-[#F6F1E8]">Celebrate Completion</h4>
                <p className="text-[#5E3B6C] dark:text-[#CDBED6]">
                  When you complete a move, take a moment to acknowledge it. Check it off, reflect on what you learned, and notice how it feels to make progress. This positive reinforcement builds momentum.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* The Power of Three */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-[#1F315B] dark:text-[#F6F1E8]">
            Why Three Moves?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-[#1F315B] dark:text-[#F6F1E8] leading-relaxed">
            Three is the magic number for focus and productivity. Research in cognitive psychology shows that the human brain can effectively hold 3-5 items in working memory. By limiting your immediate priorities to three moves, we help you:
          </p>
          <ul className="space-y-2 text-[#5E3B6C] dark:text-[#CDBED6]">
            <li className="flex items-start gap-2">
              <ArrowRight className="w-5 h-5 text-[#D4AF63] mt-0.5 flex-shrink-0" />
              <span><strong className="text-[#1F315B] dark:text-[#F6F1E8]">Avoid overwhelm</strong>—a long to-do list paralyzes; three moves energize</span>
            </li>
            <li className="flex items-start gap-2">
              <ArrowRight className="w-5 h-5 text-[#D4AF63] mt-0.5 flex-shrink-0" />
              <span><strong className="text-[#1F315B] dark:text-[#F6F1E8]">Maintain flexibility</strong>—business changes fast; three moves let you pivot</span>
            </li>
            <li className="flex items-start gap-2">
              <ArrowRight className="w-5 h-5 text-[#D4AF63] mt-0.5 flex-shrink-0" />
              <span><strong className="text-[#1F315B] dark:text-[#F6F1E8]">Create completion energy</strong>—finishing three things feels achievable</span>
            </li>
            <li className="flex items-start gap-2">
              <ArrowRight className="w-5 h-5 text-[#D4AF63] mt-0.5 flex-shrink-0" />
              <span><strong className="text-[#1F315B] dark:text-[#F6F1E8]">Force prioritization</strong>—if you only have three slots, you choose what matters</span>
            </li>
          </ul>
          <p className="text-[#1F315B] dark:text-[#F6F1E8] leading-relaxed">
            You are not limited to only doing three things—you are focused on completing three <em>important</em> things. Other tasks and responsibilities continue, but these three moves get priority attention.
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
            From Moves to Momentum
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-[#D4AF63] flex items-center justify-center text-[#1F315B] font-bold flex-shrink-0">
                1
              </div>
              <div>
                <p className="font-medium">Week 1: You review and accept your first set of Next 3 Moves</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-[#D4AF63] flex items-center justify-center text-[#1F315B] font-bold flex-shrink-0">
                2
              </div>
              <div>
                <p className="font-medium">Week 2-3: You complete your first High Impact move; energy builds</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-[#D4AF63] flex items-center justify-center text-[#1F315B] font-bold flex-shrink-0">
                3
              </div>
              <div>
                <p className="font-medium">Month 2: Completing moves becomes a habit; business health improves</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-[#D4AF63] flex items-center justify-center text-[#1F315B] font-bold flex-shrink-0">
                4
              </div>
              <div>
                <p className="font-medium">Month 3: You start anticipating moves; strategic thinking sharpens</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-[#D4AF63] flex items-center justify-center text-[#1F315B] font-bold flex-shrink-0">
                ∞
              </div>
              <div>
                <p className="font-medium">Ongoing: Focused action becomes your default; success compounds</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Closing Quote */}
      <div className="text-center py-8">
        <p className="text-lg text-[#5E3B6C] dark:text-[#CDBED6] italic">
          &quot;You don&apos;t need to do everything. You need to do the right things. Your Next 3 Moves show you what those are.&quot;
        </p>
      </div>
    </div>
  );
}
