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
      answer: "The Business Health Trend tracks how your overall business health score changes over time. It shows you whether your business is improving, declining, or staying steady across weeks, months, or quarters. This trend line helps you see the impact of your actions and identify patterns in your business performance."
    },
    {
      question: "How is the trend calculated?",
      answer: (
        <div className="space-y-2">
          <p>The trend is calculated by:</p>
          <ul className="list-disc pl-5 space-y-1 text-[#5E3B6C] dark:text-[#CDBED6]">
            <li>Recording your Overall Business Health score at regular intervals</li>
            <li>Plotting these scores on a timeline</li>
            <li>Calculating the moving average to smooth out short-term fluctuations</li>
            <li>Identifying the direction and rate of change</li>
            <li>Comparing current performance to your baseline</li>
          </ul>
          <p>The trend shows both the direction (up/down) and velocity (how fast) of change.</p>
        </div>
      )
    },
    {
      question: "What time periods can I view?",
      answer: (
        <div className="space-y-2">
          <p>You can view trends across multiple timeframes:</p>
          <ul className="list-disc pl-5 space-y-1 text-[#5E3B6C] dark:text-[#CDBED6]">
            <li><strong>Weekly:</strong> Best for seeing immediate impact of recent actions</li>
            <li><strong>Monthly:</strong> Good for identifying short-term patterns</li>
            <li><strong>Quarterly:</strong> Ideal for strategic review and seasonal patterns</li>
            <li><strong>Yearly:</strong> Shows long-term trajectory and major milestones</li>
          </ul>
          <p>We recommend reviewing monthly trends during regular business reviews.</p>
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
      answer: "A flat trend means your business health is stable. This can be good or bad depending on context: If your score is high (70+), stability means you are maintaining strong performance. If your score is low (below 60), flat means you are stuck and need to shake things up. If you have been making changes but see no trend movement, your actions may not be impactful enough or may need more time. Use the flat period to dig deeper into specific domains."
    },
    {
      question: "How do I improve my trend?",
      answer: (
        <div className="space-y-2">
          <p>To create a positive trend:</p>
          <ol className="list-decimal pl-5 space-y-1 text-[#5E3B6C] dark:text-[#CDBED6]">
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
      answer: "Yes! While the main trend shows overall health, you can drill down into trends for each of the 12 domains. This helps you identify: Which domains are driving overall improvement or decline. Whether changes in one domain are affecting others. Seasonal patterns in specific areas (e.g., Sales may spike in Q4). Access domain-specific trends from the Domain Scores section of your Dashboard."
    },
    {
      question: "How often should I check my trend?",
      answer: "For most businesses, we recommend: Weekly: Quick check during operating rhythm meetings. Monthly: Deep review as part of monthly planning. Quarterly: Strategic assessment alongside quarterly reviews. Annually: Big-picture evaluation for annual planning. Avoid obsessing over daily fluctuations—trends matter more than single data points."
    },
    {
      question: "What if my trend doesn't match how I feel about my business?",
      answer: "This is common and valuable information. If the trend is better than you feel: You may be being too hard on yourself, or there are strengths you are not acknowledging. If the trend is worse than you feel: You may be avoiding hard truths, or there are issues you have normalized. Use the disconnect as a prompt for deeper inquiry. Talk to your team, review customer feedback, or consult with a mentor to understand the gap."
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
        <div className="w-16 h-16 rounded-full bg-[#5E3B6C]/20 flex items-center justify-center mx-auto mb-4">
          <TrendingUp className="w-8 h-8 text-[#5E3B6C]" />
        </div>
        <h1 className="text-3xl font-bold text-[#1F315B] dark:text-[#F6F1E8] mb-3">
          Business Health Trend
        </h1>
        <p className="text-lg text-[#B9A9A9] max-w-2xl mx-auto">
          Track your business trajectory over time
        </p>
      </div>

      {/* What is Health Trend */}
      <Card className="mb-8 border-[#D4AF63]/30">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <LineChart className="w-5 h-5 text-[#D4AF63]" />
            What is the Business Health Trend?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-[#1F315B] dark:text-[#F6F1E8] leading-relaxed">
            Your <strong>Business Health Trend</strong> is the story your data tells over time. While a single 
            score shows where you are today, the trend reveals where you are heading—and how fast.
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
            <Target className="w-5 h-5 text-[#D4AF63]" />
            Why Trends Matter More Than Single Scores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-[#2E7C83]/20 flex items-center justify-center flex-shrink-0">
                <span className="text-[#2E7C83] font-bold">1</span>
              </div>
              <div>
                <h4 className="font-semibold text-[#1F315B] dark:text-[#F6F1E8]">Early Warning System</h4>
                <p className="text-sm text-[#B9A9A9]">
                  A declining trend alerts you to problems before they become crises. You can intervene 
                  while issues are still manageable.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-[#5E3B6C]/20 flex items-center justify-center flex-shrink-0">
                <span className="text-[#5E3B6C] font-bold">2</span>
              </div>
              <div>
                <h4 className="font-semibold text-[#1F315B] dark:text-[#F6F1E8]">Validation of Actions</h4>
                <p className="text-sm text-[#B9A9A9]">
                  When you invest time or money in improvements, the trend shows if those investments 
                  are paying off. No more guessing.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-[#D4AF63]/20 flex items-center justify-center flex-shrink-0">
                <span className="text-[#D4AF63] font-bold">3</span>
              </div>
              <div>
                <h4 className="font-semibold text-[#1F315B] dark:text-[#F6F1E8]">Momentum Awareness</h4>
                <p className="text-sm text-[#B9A9A9]">
                  Trends reveal momentum. A rising trend builds confidence and attracts opportunities. 
                  A falling trend signals the need for decisive action.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-[#2E7C83]/20 flex items-center justify-center flex-shrink-0">
                <span className="text-[#2E7C83] font-bold">4</span>
              </div>
              <div>
                <h4 className="font-semibold text-[#1F315B] dark:text-[#F6F1E8]">Strategic Planning</h4>
                <p className="text-sm text-[#B9A9A9]">
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
            <Calendar className="w-5 h-5 text-[#D4AF63]" />
            Reading Your Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-[#1F315B]/5 rounded-lg">
              <h4 className="font-semibold text-[#1F315B] dark:text-[#F6F1E8] mb-2">Short-Term (Weekly)</h4>
              <p className="text-sm text-[#B9A9A9] mb-2">
                Shows immediate impact of recent actions. Useful for testing quick changes.
              </p>
              <p className="text-xs text-[#5E3B6C] dark:text-[#CDBED6]">
                <strong>Best for:</strong> Checking if a new tactic is working, spotting urgent issues
              </p>
            </div>

            <div className="p-4 bg-[#1F315B]/5 rounded-lg">
              <h4 className="font-semibold text-[#1F315B] dark:text-[#F6F1E8] mb-2">Medium-Term (Monthly)</h4>
              <p className="text-sm text-[#B9A9A9] mb-2">
                Reveals patterns and the effectiveness of your monthly focus areas.
              </p>
              <p className="text-xs text-[#5E3B6C] dark:text-[#CDBED6]">
                <strong>Best for:</strong> Monthly reviews, adjusting priorities, tracking campaign results
              </p>
            </div>

            <div className="p-4 bg-[#1F315B]/5 rounded-lg">
              <h4 className="font-semibold text-[#1F315B] dark:text-[#F6F1E8] mb-2">Long-Term (Quarterly/Yearly)</h4>
              <p className="text-sm text-[#B9A9A9] mb-2">
                Shows your true trajectory and the cumulative effect of your strategy.
              </p>
              <p className="text-xs text-[#5E3B6C] dark:text-[#CDBED6]">
                <strong>Best for:</strong> Strategic planning, investor updates, annual reviews
              </p>
            </div>
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

      {/* Tips */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-[#D4AF63]" />
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
      <Card className="bg-gradient-to-br from-[#1F315B] to-[#5E3B6C] text-[#F6F1E8]">
        <CardContent className="p-8 text-center">
          <TrendingUp className="w-12 h-12 text-[#D4AF63] mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-3">See Your Trend</h2>
          <p className="text-[#CDBED6] mb-6 max-w-lg mx-auto">
            View your Business Health Trend on the Dashboard. Track your progress, 
            identify patterns, and make data-driven decisions.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/dashboard">
              <Button className="bg-[#D4AF63] text-[#1F315B] hover:bg-[#D4AF63]/90">
                <LineChart className="w-4 h-4 mr-2" />
                View My Trend
              </Button>
            </Link>
            <Link href="/help/overall-health">
              <Button variant="outline" className="border-[#D4AF63] text-[#D4AF63] hover:bg-[#D4AF63]/10">
                Learn About Health Scores
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Quote */}
      <div className="mt-8 text-center">
        <blockquote className="text-lg italic text-[#5E3B6C] dark:text-[#CDBED6] border-l-4 border-[#D4AF63] pl-4 inline-block">
          &ldquo;The trend is your friend—until it ends. Stay vigilant, stay adaptive, stay aligned.&rdquo;
        </blockquote>
        <p className="text-sm text-[#B9A9A9] mt-2">— LifeCharter Architecture Team</p>
      </div>
    </div>
  );
}
