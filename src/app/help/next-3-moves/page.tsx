"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ListChecks, ChevronDown, ChevronUp, Target, ArrowRight } from "lucide-react";
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
      answer: "Your Next 3 Moves are built from your own information. If your AI assistant has written you an alignment briefing in the last 30 days, its three moves are shown. Otherwise the card builds them from your three lowest-scoring domains, looking at what is really going on there: overdue tasks, slipped plan goals, and goals still in play. Until you have enough assessment answers to score at least three domains, the card asks you to start your assessments instead of showing made-up moves."
    },
    {
      id: "how-often-update",
      question: "How often do my Next 3 Moves update?",
      answer: "They update whenever your scores, tasks or plan goals change, and when you ask your assistant for a fresh briefing: press Brief me (or Refresh) in the alignment briefing at the top of the Business Alignment page. A briefing's moves are shown for 30 days, then the card goes back to building them from your latest data. Reviewing them weekly, along with your Weekly Review, is a good habit."
    },
    {
      id: "change-moves",
      question: "Can I change or customize my Next 3 Moves?",
      answer: "You can't edit the three moves themselves, but you stay in charge of what you do with them. Click a move's title to open the right screen for it, and press Add to tasks to put it on your task list for today, where you can edit it, change its date or remove it like any other task. Your moves change as your scores, tasks and goals change, and you can ask your assistant for a fresh briefing at any time."
    },
    {
      id: "impact-levels",
      question: "What do the Impact levels (High, Medium, Low) mean?",
      answer: "When the moves are built from your data, each one shows an impact tag. High Impact means the domain scores below 50, or it has a slipped plan goal or overdue tasks. Medium Impact means the domain scores between 50 and 69. Low Impact means the domain is already scoring 70 or higher. When the moves come from your assistant's briefing, they show the area they belong to instead of an impact tag. Tackling High Impact moves first is a good rule of thumb."
    },
    {
      id: "not-accurate",
      question: "What if the suggested moves don't feel right for my business?",
      answer: "Trust your intuition. The moves come from your scores, tasks and plan goals, and you have context they don't. If a move doesn't resonate, skip it, and put the work you do want to do on your task list. Keeping your assessments, Quick Pulse and plan goals up to date, and asking your assistant for a new briefing, makes the moves line up more closely with where you are now."
    },
    {
      id: "complete-all-three",
      question: "Do I need to complete all three moves before getting new ones?",
      answer: "Not at all. Moves are not checked off on the card. When you add one to your tasks, you complete it there, like any other task. Some entrepreneurs prefer to focus on one move at a time; others work on all three in parallel. Find the rhythm that works for you and your capacity."
    }
  ];

  const moveTypes = [
    {
      title: "Score-Driven Moves",
      description: "Built from your three lowest-scoring domains",
      example: "Tighten cash flow & margins (Finance 45)",
      icon: "📊"
    },
    {
      title: "Overdue Task Moves",
      description: "When a weak domain has overdue tasks, the move is to clear them",
      example: "Clear your overdue Marketing tasks",
      icon: "⏰"
    },
    {
      title: "Plan Goal Moves",
      description: "When a yearly plan goal in a weak domain has slipped, the move is to get it back on track",
      example: "Get a slipped plan goal back on track",
      icon: "🎯"
    },
    {
      title: "Assistant Briefing Moves",
      description: "When your assistant has written a recent alignment briefing, its three moves are shown instead",
      example: "A move written by your assistant, with a one-click Add to tasks",
      icon: "✨"
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#c9a227]/20 mb-4">
          <ListChecks className="w-8 h-8 text-[#c9a227]" />
        </div>
        <h1 className="text-3xl font-serif font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">
          Next 3 Moves
        </h1>
        <p className="text-[#7b6b8d] dark:text-[#e8e4f0] mt-2 max-w-2xl mx-auto">
          Your prioritized action plan for moving from insight to impact
        </p>
      </div>

      {/* Main Explanation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-[#1a2b4a] dark:text-[#F8F5F0]">
            What are Next 3 Moves?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-[#1a2b4a] dark:text-[#F8F5F0] leading-relaxed">
            In a world of infinite possibilities and limited time, the question is not <em>what could you do?</em> but <strong>what should you do next?</strong> Your Next 3 Moves answer that question with clarity and precision.
          </p>
          <p className="text-[#7b6b8d] dark:text-[#e8e4f0] leading-relaxed">
            These are not arbitrary to-do items. They are drawn from your own scores, tasks and plan goals, and from your AI assistant&apos;s briefing when it has written one, so they point at what will move the needle most for your business right now. You&apos;ll find them on the Business Alignment page (Alignment in the left menu).
          </p>
          <p className="text-[#1a2b4a] dark:text-[#F8F5F0] leading-relaxed">
            Think of your Next 3 Moves as your business&apos;s immediate priorities—the three actions that, if completed, will create the most positive momentum and bring you closer to your vision with the least wasted effort.
          </p>
        </CardContent>
      </Card>

      {/* How Moves Are Generated */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-[#1a2b4a] dark:text-[#F8F5F0]">
            How Your Moves Are Generated
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-[#1a2b4a] dark:text-[#F8F5F0]">
            Your Next 3 Moves are built from your own information in the Suite, in one of these ways:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {moveTypes.map((type) => (
              <div key={type.title} className="border border-[#1a2b4a]/10 dark:border-[#e8e4f0]/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{type.icon}</span>
                  <h4 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{type.title}</h4>
                </div>
                <p className="text-sm text-[#7b6b8d] dark:text-[#e8e4f0] mb-2">{type.description}</p>
                <p className="text-xs text-[#b8a898] italic">Example: {type.example}</p>
              </div>
            ))}
          </div>

          <div className="bg-[#1a2b4a]/5 dark:bg-[#e8e4f0]/10 rounded-lg p-4">
            <h4 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0] mb-3 flex items-center gap-2">
              <Target className="w-5 h-5 text-[#c9a227]" />
              How a Move Is Chosen
            </h4>
            <ul className="space-y-2 text-sm text-[#7b6b8d] dark:text-[#e8e4f0]">
              <li>• If your assistant wrote an alignment briefing in the last 30 days, its three moves are shown.</li>
              <li>• Otherwise the card takes your three lowest-scoring domains, weakest first.</li>
              <li>• Each one is described with what is really going on there: its score, overdue or open tasks, and slipped or in-play plan goals.</li>
              <li>• Each move links to the right screen to work on it, and Add to tasks puts it on your list for today.</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Understanding Impact Levels */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-[#1a2b4a] dark:text-[#F8F5F0]">
            Understanding Impact Levels
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-[#1a2b4a] dark:text-[#F8F5F0] mb-4">
            When your moves are built from your data, each one is tagged with an Impact level to help you prioritize your energy and attention:
          </p>
          
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-[#7b6b8d]/10 rounded-lg border-l-4 border-[#7b6b8d]">
              <div className="w-10 h-10 rounded-full bg-[#7b6b8d] flex items-center justify-center text-white font-bold flex-shrink-0">
                H
              </div>
              <div>
                <h4 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">High Impact</h4>
                <p className="text-[#7b6b8d] dark:text-[#e8e4f0]">
                  The domain scores below 50, or it has a slipped plan goal or overdue tasks. These moves address your most pressing gaps and often yield disproportionate results. Prioritize these when you have focused time and energy.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-[#4a9b9b]/10 rounded-lg border-l-4 border-[#4a9b9b]">
              <div className="w-10 h-10 rounded-full bg-[#4a9b9b] flex items-center justify-center text-white font-bold flex-shrink-0">
                M
              </div>
              <div>
                <h4 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Medium Impact</h4>
                <p className="text-[#7b6b8d] dark:text-[#e8e4f0]">
                  The domain scores between 50 and 69. These moves build important systems, capabilities, or relationships. These are your bread-and-butter growth actions: steady progress that compounds over time.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-[#e8e4f0]/20 rounded-lg border-l-4 border-[#e8e4f0]">
              <div className="w-10 h-10 rounded-full bg-[#e8e4f0] flex items-center justify-center text-[#1a2b4a] font-bold flex-shrink-0">
                L
              </div>
              <div>
                <h4 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Low Impact</h4>
                <p className="text-[#7b6b8d] dark:text-[#e8e4f0]">
                  The domain already scores 70 or higher, so the move is about keeping it strong. While individually small, these moves keep momentum going and prevent backsliding. Perfect for low-energy days or when you need a sense of accomplishment.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-[#c9a227]/10 rounded-lg border border-[#c9a227]/30">
            <p className="text-[#1a2b4a] dark:text-[#F8F5F0] font-medium">
              Strategy Tip: Aim for a mix of impact levels. Make steady progress on High Impact moves, keep Medium moves moving, and sprinkle in Low Impact wins to maintain momentum.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Working Your Moves */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-[#1a2b4a] dark:text-[#F8F5F0]">
            Working Your Moves: Best Practices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-[#1a2b4a] flex items-center justify-center text-white font-bold flex-shrink-0">
                1
              </div>
              <div>
                <h4 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Review Weekly</h4>
                <p className="text-[#7b6b8d] dark:text-[#e8e4f0]">
                  Set a recurring calendar block, or use your Weekly Review (Planning &amp; Numbers in the left menu), to look at your Next 3 Moves. Ask: Are these still the right priorities? What has changed in my business? Do I want a fresh briefing from my assistant?
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-[#1a2b4a] flex items-center justify-center text-white font-bold flex-shrink-0">
                2
              </div>
              <div>
                <h4 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Time-Block Deep Work</h4>
                <p className="text-[#7b6b8d] dark:text-[#e8e4f0]">
                  High Impact moves deserve uninterrupted focus. Block 2-4 hours on your calendar for deep work on your most important move. Turn off notifications, close unnecessary tabs, and give it your full attention.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-[#1a2b4a] flex items-center justify-center text-white font-bold flex-shrink-0">
                3
              </div>
              <div>
                <h4 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Break Down Big Moves</h4>
                <p className="text-[#7b6b8d] dark:text-[#e8e4f0]">
                  If a move feels overwhelming, break it into smaller steps. Add it to your tasks, then add a few smaller tasks of your own to cover the steps. &quot;Tighten cash flow&quot; becomes: (1) Record this month&apos;s income and expenses, (2) Add your regular bills, (3) Review your budget, (4) Look at your forecast.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-[#1a2b4a] flex items-center justify-center text-white font-bold flex-shrink-0">
                4
              </div>
              <div>
                <h4 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Celebrate Completion</h4>
                <p className="text-[#7b6b8d] dark:text-[#e8e4f0]">
                  When you complete a move, take a moment to acknowledge it. Check off its task, reflect on what you learned, and notice how it feels to make progress. This positive reinforcement builds momentum.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* The Power of Three */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-[#1a2b4a] dark:text-[#F8F5F0]">
            Why Three Moves?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-[#1a2b4a] dark:text-[#F8F5F0] leading-relaxed">
            Three is the magic number for focus and productivity. Three is a number most of us can actually hold in mind. By limiting your immediate priorities to three moves, we help you:
          </p>
          <ul className="space-y-2 text-[#7b6b8d] dark:text-[#e8e4f0]">
            <li className="flex items-start gap-2">
              <ArrowRight className="w-5 h-5 text-[#c9a227] mt-0.5 flex-shrink-0" />
              <span><strong className="text-[#1a2b4a] dark:text-[#F8F5F0]">Avoid overwhelm</strong>—a long to-do list paralyzes; three moves energize</span>
            </li>
            <li className="flex items-start gap-2">
              <ArrowRight className="w-5 h-5 text-[#c9a227] mt-0.5 flex-shrink-0" />
              <span><strong className="text-[#1a2b4a] dark:text-[#F8F5F0]">Maintain flexibility</strong>—business changes fast; three moves let you pivot</span>
            </li>
            <li className="flex items-start gap-2">
              <ArrowRight className="w-5 h-5 text-[#c9a227] mt-0.5 flex-shrink-0" />
              <span><strong className="text-[#1a2b4a] dark:text-[#F8F5F0]">Create completion energy</strong>—finishing three things feels achievable</span>
            </li>
            <li className="flex items-start gap-2">
              <ArrowRight className="w-5 h-5 text-[#c9a227] mt-0.5 flex-shrink-0" />
              <span><strong className="text-[#1a2b4a] dark:text-[#F8F5F0]">Force prioritization</strong>—if you only have three slots, you choose what matters</span>
            </li>
          </ul>
          <p className="text-[#1a2b4a] dark:text-[#F8F5F0] leading-relaxed">
            You are not limited to only doing three things—you are focused on completing three <em>important</em> things. Other tasks and responsibilities continue, but these three moves get priority attention.
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
            From Moves to Momentum
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-[#c9a227] flex items-center justify-center text-[#1a2b4a] font-bold flex-shrink-0">
                1
              </div>
              <div>
                <p className="font-medium">Week 1: You finish your assessments and add your first Next 3 Moves to your tasks</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-[#c9a227] flex items-center justify-center text-[#1a2b4a] font-bold flex-shrink-0">
                2
              </div>
              <div>
                <p className="font-medium">Week 2-3: You complete your first High Impact move; energy builds</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-[#c9a227] flex items-center justify-center text-[#1a2b4a] font-bold flex-shrink-0">
                3
              </div>
              <div>
                <p className="font-medium">Month 2: Completing moves becomes a habit; business health improves</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-[#c9a227] flex items-center justify-center text-[#1a2b4a] font-bold flex-shrink-0">
                4
              </div>
              <div>
                <p className="font-medium">Month 3: You start anticipating moves; strategic thinking sharpens</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-[#c9a227] flex items-center justify-center text-[#1a2b4a] font-bold flex-shrink-0">
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
        <p className="text-lg text-[#7b6b8d] dark:text-[#e8e4f0] italic">
          &quot;You don&apos;t need to do everything. You need to do the right things. Your Next 3 Moves show you what those are.&quot;
        </p>
      </div>
    </div>
  );
}
