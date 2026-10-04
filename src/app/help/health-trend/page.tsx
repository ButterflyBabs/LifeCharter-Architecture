"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  LineChart,
  Calendar,
  Target,
  AlertCircle,
  Lightbulb
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface FAQItem {
  question: string;
  answer: string | React.ReactNode;
}

export default function HealthTrendHelpPage() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  const faqs: FAQItem[] = [
    {
      question: "What is the Business Health Trend?",
      answer: "The Business Health Trend is a line on the Business Alignment page (Alignment in the left menu) that tracks how your overall business health score changes over time. It shows you whether your business is improving, declining, or staying steady. This trend line helps you see the impact of your actions and identify patterns in your business performance. The line appears once you have at least two dated points."
    },
    {
      question: "How is the trend calculated?",
      answer: (
        <div className="space-y-2">
          <p>The trend is built from dated points on your score:</p>
          <ul className="list-disc pl-5 space-y-1 text-[#7b6b8d] dark:text-[#e8e4f0]">
            <li>The first time you have scores, the Suite saves them as your baseline, the first point on the line</li>
            <li>A new point is added each time you complete a Quick Pulse check-in, and when your Brain or Soul answers are re-scored</li>
            <li>Each point is your Overall Business Health score on that date, plotted on a timeline from 0 to 100</li>
          </ul>
          <p>The card shows the line, and the Progress page shows the same history with your change since baseline.</p>
        </div>
      )
    },
    {
      question: "How do I see more detail or other time periods?",
      answer: (
        <div className="space-y-2">
          <p>Press View progress on the Business Health Trend card, or open Progress in the Alignment section of the left menu. There you will find:</p>
          <ul className="list-disc pl-5 space-y-1 text-[#7b6b8d] dark:text-[#e8e4f0]">
            <li>Your overall score now, your baseline, and the change between them</li>
            <li>A trend line with a menu to switch between Overall and any one of your 12 domains</li>
            <li>Your change since baseline in every domain</li>
            <li>How your plan goals are tracking (met, in progress, not started, slipped)</li>
          </ul>
          <p>The line shows every recorded check-in, so the more often you check in, the more detail it holds. A monthly Quick Pulse during your regular business review is a good rhythm.</p>
        </div>
      )
    },
    {
      question: "What does an upward trend mean?",
      answer: "An upward trend indicates that your business health is improving over time. This could mean: Your actions are working—improvements in specific domains are lifting the overall score. You are gaining momentum—as one area strengthens, it supports others. Your business is maturing—systems and processes are becoming more effective. However, ensure the trend is sustainable and not just short-term spikes."
    },
    {
      question: "What does a downward trend mean?",
      answer: "A downward trend signals that your business health is declining. This is not failure—it is early warning data. Common causes include: Neglected domains—one weak area is pulling down the whole system. External changes—market shifts, seasonality, or competitive pressure. Growing pains—rapid growth without proper systems. The key is to identify which domains are driving the decline and address them quickly."
    },
    {
      question: "What if my trend is flat?",
      answer: "A flat trend means your business health is stable. This can be good or bad depending on context: If your score is high (Expansion or Legacy, above 60), stability means you are maintaining strong performance. If your score is lower (Survival or Growth, 60 or below), flat means you are stuck and may need to shake things up. If you have been making changes but see no trend movement, your actions may not be impactful enough or may need more time. Use the flat period to dig deeper into specific domains."
    },
    {
      question: "How do I improve my trend?",
      answer: (
        <div className="space-y-2">
          <p>To create a positive trend:</p>
          <ol className="list-decimal pl-5 space-y-1 text-[#7b6b8d] dark:text-[#e8e4f0]">
            <li>Focus on your lowest-scoring domains first—they have the most upside</li>
            <li>Make consistent small improvements rather than sporadic big efforts</li>
            <li>Track leading indicators (actions) not just lagging indicators (scores)</li>
            <li>Review trends monthly and adjust your strategy</li>
            <li>Celebrate wins to maintain momentum</li>
          </ol>
          <p>Remember: Sustainable trends come from systems, not sprints.</p>
        </div>
      )
    },
    {
      question: "Can I see trends for individual domains?",
      answer: "Yes! While the card on Business Alignment shows overall health, the Progress page lets you choose any of the 12 domains from the menu above its trend line. This helps you identify: Which domains are driving overall improvement or decline. Whether changes in one domain are affecting others. The Domain Scores card also shows how far each domain has moved since your baseline."
    },
    {
      question: "How often should I check my trend?",
      answer: "A monthly look is plenty for most businesses, right after your Quick Pulse check-in, with a bigger look each quarter alongside your Profit assessment. Avoid obsessing over single points. Trends matter more than any one data point."
    },
    {
      question: "What if my trend doesn't match how I feel about my business?",
      answer: "This is common and valuable information. If the trend is better than you feel: You may be being too hard on yourself, or there are strengths you are not acknowledging. If the trend is worse than you feel: You may be avoiding hard truths, or there are issues you have normalized. Use the disconnect as a prompt for deeper inquiry. Talk to your team, review customer feedback, or consult with a mentor to understand the gap."
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
        <div className="w-16 h-16 rounded-full bg-[#7b6b8d]/20 flex items-center justify-center mx-auto mb-4">
          <TrendingUp className="w-8 h-8 text-[#7b6b8d]" />
        </div>
        <h1 className="text-3xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0] mb-3">
          Business Health Trend
        </h1>
        <p className="text-lg text-[#b8a898] max-w-2xl mx-auto">
          Track your business trajectory over time
        </p>
      </div>

      {/* What is Health Trend */}
      <Card className="mb-8 border-[#c9a227]/30">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <LineChart className="w-5 h-5 text-[#c9a227]" />
            What is the Business Health Trend?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-[#1a2b4a] dark:text-[#F8F5F0] leading-relaxed">
            Your <strong>Business Health Trend</strong> is the story your data tells over time. While a single 
            score shows where you are today, the trend reveals where you are heading.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-center border border-green-200 dark:border-green-800">
              <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold text-green-800 dark:text-green-200">Rising</h3>
              <p className="text-sm text-green-700 dark:text-green-300">Business is improving</p>
            </div>
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-center border border-yellow-200 dark:border-yellow-800">
              <LineChart className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
              <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">Stable</h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">Holding steady</p>
            </div>
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-center border border-red-200 dark:border-red-800">
              <TrendingDown className="w-8 h-8 text-red-600 mx-auto mb-2" />
              <h3 className="font-semibold text-red-800 dark:text-red-200">Declining</h3>
              <p className="text-sm text-red-700 dark:text-red-300">Needs attention</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Why Trends Matter */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Target className="w-5 h-5 text-[#c9a227]" />
            Why Trends Matter More Than Single Scores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-[#4a9b9b]/20 flex items-center justify-center flex-shrink-0">
                <span className="text-[#4a9b9b] font-bold">1</span>
              </div>
              <div>
                <h4 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Early Warning System</h4>
                <p className="text-sm text-[#b8a898]">
                  A declining trend alerts you to problems before they become crises. You can intervene 
                  while issues are still manageable.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-[#7b6b8d]/20 flex items-center justify-center flex-shrink-0">
                <span className="text-[#7b6b8d] font-bold">2</span>
              </div>
              <div>
                <h4 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Validation of Actions</h4>
                <p className="text-sm text-[#b8a898]">
                  When you invest time or money in improvements, the trend shows if those investments 
                  are paying off. No more guessing.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-[#c9a227]/20 flex items-center justify-center flex-shrink-0">
                <span className="text-[#c9a227] font-bold">3</span>
              </div>
              <div>
                <h4 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Momentum Awareness</h4>
                <p className="text-sm text-[#b8a898]">
                  Trends reveal momentum. A rising trend builds confidence and attracts opportunities. 
                  A falling trend signals the need for decisive action.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-[#4a9b9b]/20 flex items-center justify-center flex-shrink-0">
                <span className="text-[#4a9b9b] font-bold">4</span>
              </div>
              <div>
                <h4 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Strategic Planning</h4>
                <p className="text-sm text-[#b8a898]">
                  Understanding your trajectory helps you set realistic goals and allocate resources 
                  where they will have the most impact.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reading Your Trend */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#c9a227]" />
            Reading Your Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-[#1a2b4a]/5 rounded-lg">
              <h4 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0] mb-2">The Gold Marker</h4>
              <p className="text-sm text-[#b8a898] mb-2">
                On the Progress page, the gold dot on your trend line marks your baseline: where you started.
              </p>
              <p className="text-xs text-[#7b6b8d] dark:text-[#e8e4f0]">
                <strong>Best for:</strong> Seeing how far you have come since your first scores
              </p>
            </div>

            <div className="p-4 bg-[#1a2b4a]/5 rounded-lg">
              <h4 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0] mb-2">Each Point on the Line</h4>
              <p className="text-sm text-[#b8a898] mb-2">
                Every point is a recorded check-in or re-score. Hover over a point to see its date and score.
              </p>
              <p className="text-xs text-[#7b6b8d] dark:text-[#e8e4f0]">
                <strong>Best for:</strong> Checking whether a change you made is paying off, and spotting dips early
              </p>
            </div>

            <div className="p-4 bg-[#1a2b4a]/5 rounded-lg">
              <h4 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0] mb-2">Overall or One Domain</h4>
              <p className="text-sm text-[#b8a898] mb-2">
                The menu above the line on the Progress page switches between your overall score and any single domain.
              </p>
              <p className="text-xs text-[#7b6b8d] dark:text-[#e8e4f0]">
                <strong>Best for:</strong> Finding which domain is driving a rise or a dip
              </p>
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

      {/* Tips */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-[#c9a227]" />
            Making the Most of Your Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <TrendingUp className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-800 dark:text-green-200">When Trending Up</h4>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Document what is working. Double down on successful strategies. 
                  Share wins with your team to build momentum.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <TrendingDown className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-800 dark:text-red-200">When Trending Down</h4>
                <p className="text-sm text-red-700 dark:text-red-300">
                  Act quickly but calmly. Identify the root cause. Focus on one 
                  high-impact fix rather than trying everything.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <LineChart className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800 dark:text-yellow-200">When Flat</h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  If score is high: Maintain and optimize. If score is low: 
                  Disrupt your approach. Try something new.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-800 dark:text-blue-200">Always</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Look at domain-specific trends, not just overall. Context matters. 
                  External factors affect trends.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CTA */}
      <Card className="bg-gradient-to-br from-[#1a2b4a] to-[#7b6b8d] text-[#F8F5F0]">
        <CardContent className="p-8 text-center">
          <TrendingUp className="w-12 h-12 text-[#c9a227] mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-3">See Your Trend</h2>
          <p className="text-[#e8e4f0] mb-6 max-w-lg mx-auto">
            View your Business Health Trend on the Business Alignment page, and open Progress for the full picture. Track your progress, 
            identify patterns, and make data-driven decisions.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/progress">
              <Button className="bg-[#c9a227] text-[#1a2b4a] hover:bg-[#c9a227]/90">
                <LineChart className="w-4 h-4 mr-2" />
                View My Trend
              </Button>
            </Link>
            <Link href="/help/overall-health">
              <Button variant="outline" className="border-[#c9a227] text-[#c9a227] hover:bg-[#c9a227]/10">
                Learn About Health Scores
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Quote */}
      <div className="mt-8 text-center">
        <blockquote className="text-lg italic text-[#7b6b8d] dark:text-[#e8e4f0] border-l-4 border-[#c9a227] pl-4 inline-block">
          &ldquo;The trend is your friend—until it ends. Stay vigilant, stay adaptive, stay aligned.&rdquo;
        </blockquote>
        <p className="text-sm text-[#b8a898] mt-2">— LifeCharter Command Suite Team</p>
      </div>
    </div>
  );
}
