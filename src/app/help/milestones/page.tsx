"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  ArrowLeft,
  Flag,
  Target,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Trophy,
  Rocket,
  Zap,
  TrendingUp,
  CheckCircle,
  Lightbulb,
  Star
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface FAQItem {
  question: string;
  answer: string | React.ReactNode;
}

export default function MilestonesHelpPage() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  const faqs: FAQItem[] = [
    {
      question: "What are Milestones in LifeCharter?",
      answer: "Milestones are significant achievements and markers of progress in your business journey. They represent key accomplishments, transitions, and growth moments that deserve recognition. Milestones help you track progress, celebrate wins, and maintain momentum as you build your business. They range from small victories (first customer) to major achievements (hitting revenue goals, launching new products)."
    },
    {
      question: "Why do Milestones matter?",
      answer: (
        <div className="space-y-2">
          <p>Milestones serve multiple important functions:</p>
          <ul className="list-disc pl-5 space-y-1 text-[#5E3B6C] dark:text-[#CDBED6]">
            <li><strong>Progress Tracking:</strong> They show you how far you have come</li>
            <li><strong>Motivation:</strong> Celebrating wins keeps you energized</li>
            <li><strong>Team Alignment:</strong> Shared milestones build collective purpose</li>
            <li><strong>Momentum:</strong> Each milestone creates forward motion</li>
            <li><strong>Storytelling:</strong> They become part of your business narrative</li>
          </ul>
        </div>
      )
    },
    {
      question: "What types of Milestones should I track?",
      answer: (
        <div className="space-y-2">
          <p>Track milestones across all 12 business domains:</p>
          <ul className="list-disc pl-5 space-y-1 text-[#5E3B6C] dark:text-[#CDBED6]">
            <li><strong>Launch Milestones:</strong> Product launches, website live, first sale</li>
            <li><strong>Revenue Milestones:</strong> First $1K, $10K, $100K months</li>
            <li><strong>Customer Milestones:</strong> First 10, 100, 1,000 customers</li>
            <li><strong>Team Milestones:</strong> First hire, team of 5, 10, 50</li>
            <li><strong>Impact Milestones:</strong> Lives changed, testimonials received</li>
            <li><strong>Personal Milestones:</strong> Work-life balance achievements</li>
          </ul>
        </div>
      )
    },
    {
      question: "How do I create effective Milestones?",
      answer: (
        <div className="space-y-2">
          <p>Effective milestones are:</p>
          <ul className="list-disc pl-5 space-y-1 text-[#5E3B6C] dark:text-[#CDBED6]">
            <li><strong>Specific:</strong> Clear and unambiguous</li>
            <li><strong>Measurable:</strong> You know when you have achieved it</li>
            <li><strong>Meaningful:</strong> It matters to your business journey</li>
            <li><strong>Time-bound:</strong> Has a target date or season</li>
            <li><strong>Challenging but Achievable:</strong> Stretch, but not impossible</li>
          </ul>
          <p>Break big goals into smaller milestone steps. Instead of &quot;grow the business,&quot; try &quot;launch new website,&quot; &quot;reach 100 email subscribers,&quot; &quot;make first $5K month.&quot;</p>
        </div>
      )
    },
    {
      question: "What is Momentum and why does it matter?",
      answer: "Momentum is the forward motion created by consistent progress. When you hit milestones regularly, you build confidence, energy, and belief that you can achieve the next one. Momentum makes hard things feel easier because you are already moving. Without momentum, every task feels like starting from zero. With momentum, you ride the wave of previous wins."
    },
    {
      question: "How do I build and maintain Momentum?",
      answer: (
        <div className="space-y-2">
          <ol className="list-decimal pl-5 space-y-1 text-[#5E3B6C] dark:text-[#CDBED6]">
            <li><strong>Set frequent small milestones:</strong> Weekly wins build momentum faster than quarterly goals</li>
            <li><strong>Celebrate immediately:</strong> Do not wait—acknowledge wins right away</li>
            <li><strong>Share progress:</strong> Tell your team, community, or accountability partner</li>
            <li><strong>Review regularly:</strong> Look at what you have accomplished, not just what is left</li>
            <li><strong>Keep moving:</strong> After one milestone, immediately focus on the next</li>
            <li><strong>Do not break the chain:</strong> Consistency matters more than intensity</li>
          </ol>
        </div>
      )
    },
    {
      question: "What if I miss a Milestone?",
      answer: "Missing a milestone is information, not failure. Ask: Was the milestone unrealistic? Did circumstances change? Did I lose focus? What can I learn? Adjust the milestone or the timeline, but do not abandon it. Use misses as data to improve your planning. The key is to maintain momentum—do not let one missed milestone stop your progress."
    },
    {
      question: "How do Milestones relate to Domain Scores?",
      answer: "Milestones and Domain Scores work together. Domain Scores show you WHERE to focus. Milestones define WHAT you will achieve in that domain. For example, if your Marketing domain score is low, you might set milestones like: Launch content calendar, Reach 1,000 email subscribers, Publish 10 blog posts. Each milestone improves the domain score, which improves overall health."
    },
    {
      question: "Should I celebrate small Milestones?",
      answer: "Absolutely! Small milestones are the building blocks of big achievements. Celebrating them: Reinforces positive behavior, Keeps motivation high, Creates a culture of progress, Makes the journey enjoyable. Celebration does not have to be elaborate—a moment of acknowledgment, a team message, a small treat. The point is to pause and recognize progress."
    },
    {
      question: "How do I track Milestones in LifeCharter?",
      answer: "Use the Milestones section of your Dashboard to: Set and view upcoming milestones, Track progress toward each milestone, Record completion dates, Celebrate achievements, Review milestone history. Connect milestones to specific domains so you can see how they impact your business health scores. The AI Guide can also suggest milestones based on your current domain scores."
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
        <div className="w-16 h-16 rounded-full bg-[#D4AF63]/20 flex items-center justify-center mx-auto mb-4">
          <Flag className="w-8 h-8 text-[#D4AF63]" />
        </div>
        <h1 className="text-3xl font-bold text-[#1F315B] dark:text-[#F6F1E8] mb-3">
          Milestones & Momentum
        </h1>
        <p className="text-lg text-[#B9A9A9] max-w-2xl mx-auto">
          Mark your progress and ride the wave of achievement
        </p>
      </div>

      {/* What are Milestones */}
      <Card className="mb-8 border-[#D4AF63]/30">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#D4AF63]" />
            What are Milestones?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-[#1F315B] dark:text-[#F6F1E8] leading-relaxed">
            <strong>Milestones</strong> are the markers that show you are making progress. They are the proof 
            that your efforts are working, the checkpoints that validate your direction, and the celebrations 
            that fuel your journey.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="p-4 bg-[#1F315B]/5 rounded-lg text-center">
              <Target className="w-8 h-8 text-[#2E7C83] mx-auto mb-2" />
              <h3 className="font-semibold text-[#1F315B] dark:text-[#F6F1E8]">Focus</h3>
              <p className="text-sm text-[#B9A9A9]">Clear targets to aim for</p>
            </div>
            <div className="p-4 bg-[#1F315B]/5 rounded-lg text-center">
              <Rocket className="w-8 h-8 text-[#5E3B6C] mx-auto mb-2" />
              <h3 className="font-semibold text-[#1F315B] dark:text-[#F6F1E8]">Momentum</h3>
              <p className="text-sm text-[#B9A9A9]">Forward motion from wins</p>
            </div>
            <div className="p-4 bg-[#1F315B]/5 rounded-lg text-center">
              <Star className="w-8 h-8 text-[#D4AF63] mx-auto mb-2" />
              <h3 className="font-semibold text-[#1F315B] dark:text-[#F6F1E8]">Celebration</h3>
              <p className="text-sm text-[#B9A9A9]">Acknowledge progress</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* The Power of Momentum */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#D4AF63]" />
            The Power of Momentum
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-[#1F315B] dark:text-[#F6F1E8]">
              Momentum is the invisible force that makes success easier the closer you get to it. 
              Each milestone achieved makes the next one more attainable.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  With Momentum
                </h4>
                <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                  <li>• Tasks feel easier</li>
                  <li>• Confidence is high</li>
                  <li>• Energy is sustainable</li>
                  <li>• Setbacks feel temporary</li>
                  <li>• Progress compounds</li>
                </ul>
              </div>

              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 rotate-180" />
                  Without Momentum
                </h4>
                <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                  <li>• Every task feels hard</li>
                  <li>• Doubt creeps in</li>
                  <li>• Energy drains quickly</li>
                  <li>• Setbacks feel permanent</li>
                  <li>• Progress stalls</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Milestone Examples */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-[#D4AF63]" />
            Milestone Examples by Stage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-[#1F315B]/5 rounded-lg">
              <h4 className="font-semibold text-[#1F315B] dark:text-[#F6F1E8] mb-2">Early Stage (0-1 year)</h4>
              <ul className="text-sm text-[#5E3B6C] dark:text-[#CDBED6] space-y-1">
                <li>• First customer or client</li>
                <li>• First $1,000 in revenue</li>
                <li>• Website launched</li>
                <li>• First 100 email subscribers</li>
                <li>• First product/service delivered</li>
              </ul>
            </div>

            <div className="p-4 bg-[#1F315B]/5 rounded-lg">
              <h4 className="font-semibold text-[#1F315B] dark:text-[#F6F1E8] mb-2">Growth Stage (1-3 years)</h4>
              <ul className="text-sm text-[#5E3B6C] dark:text-[#CDBED6] space-y-1">
                <li>• Consistent $10K+ months</li>
                <li>• First team member hired</li>
                <li>• 1,000 customers served</li>
                <li>• First major partnership</li>
                <li>• Systems and processes documented</li>
              </ul>
            </div>

            <div className="p-4 bg-[#1F315B]/5 rounded-lg">
              <h4 className="font-semibold text-[#1F315B] dark:text-[#F6F1E8] mb-2">Scale Stage (3+ years)</h4>
              <ul className="text-sm text-[#5E3B6C] dark:text-[#CDBED6] space-y-1">
                <li>• Six or seven-figure revenue</li>
                <li>• Team of 10+ people</li>
                <li>• Multiple product lines</li>
                <li>• Industry recognition</li>
                <li>• Sustainable work-life balance</li>
              </ul>
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
            Building Momentum: Quick Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-3 bg-[#1F315B]/5 rounded-lg">
              <Zap className="w-5 h-5 text-[#D4AF63] mt-0.5" />
              <div>
                <h4 className="font-medium text-[#1F315B] dark:text-[#F6F1E8]">Start Small</h4>
                <p className="text-sm text-[#B9A9A9]">
                  Weekly milestones build momentum faster than big quarterly goals
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-[#1F315B]/5 rounded-lg">
              <Trophy className="w-5 h-5 text-[#D4AF63] mt-0.5" />
              <div>
                <h4 className="font-medium text-[#1F315B] dark:text-[#F6F1E8]">Celebrate Fast</h4>
                <p className="text-sm text-[#B9A9A9]">
                  Acknowledge wins immediately, not at the end of the quarter
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-[#1F315B]/5 rounded-lg">
              <Target className="w-5 h-5 text-[#D4AF63] mt-0.5" />
              <div>
                <h4 className="font-medium text-[#1F315B] dark:text-[#F6F1E8]">Stack Wins</h4>
                <p className="text-sm text-[#B9A9A9]">
                  Set up milestones so each one leads naturally to the next
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-[#1F315B]/5 rounded-lg">
              <Rocket className="w-5 h-5 text-[#D4AF63] mt-0.5" />
              <div>
                <h4 className="font-medium text-[#1F315B] dark:text-[#F6F1E8]">Keep Moving</h4>
                <p className="text-sm text-[#B9A9A9]">
                  After celebrating, immediately focus on the next milestone
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CTA */}
      <Card className="bg-gradient-to-br from-[#1F315B] to-[#5E3B6C] text-[#F6F1E8]">
        <CardContent className="p-8 text-center">
          <Flag className="w-12 h-12 text-[#D4AF63] mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-3">Set Your Next Milestone</h2>
          <p className="text-[#CDBED6] mb-6 max-w-lg mx-auto">
            What is the next milestone that will move your business forward? 
            Define it, pursue it, achieve it, celebrate it.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/dashboard">
              <Button className="bg-[#D4AF63] text-[#1F315B] hover:bg-[#D4AF63]/90">
                <Target className="w-4 h-4 mr-2" />
                Set a Milestone
              </Button>
            </Link>
            <Link href="/help/domain-scores">
              <Button variant="outline" className="border-[#D4AF63] text-[#D4AF63] hover:bg-[#D4AF63]/10">
                Review Domain Scores
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Quote */}
      <div className="mt-8 text-center">
        <blockquote className="text-lg italic text-[#5E3B6C] dark:text-[#CDBED6] border-l-4 border-[#D4AF63] pl-4 inline-block">
          &ldquo;Success is the sum of small efforts, repeated day in and day out. Milestones mark the path.&rdquo;
        </blockquote>
        <p className="text-sm text-[#B9A9A9] mt-2">— LifeCharter Team</p>
      </div>
    </div>
  );
}
