"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  ArrowLeft,
  Timer,
  Calendar,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Target,
  Repeat,
  Zap,
  CheckCircle,
  AlertCircle,
  Lightbulb
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface FAQItem {
  question: string;
  answer: string | React.ReactNode;
}

export default function OperatingRhythmHelpPage() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  const faqs: FAQItem[] = [
    {
      question: "What is Operating Rhythm?",
      answer: "Operating Rhythm is the heartbeat of your business—the predictable cadence of meetings, reviews, and rituals that keep your business aligned, accountable, and moving forward. It is the drumbeat that ensures important things get done consistently, not just when you remember them. A strong operating rhythm reduces chaos, increases team alignment, and creates space for strategic thinking."
    },
    {
      question: "Why does Operating Rhythm matter?",
      answer: (
        <div className="space-y-2">
          <p>Without a clear operating rhythm:</p>
          <ul className="list-disc pl-5 space-y-1 text-[#7b6b8d] dark:text-[#e8e4f0]">
            <li>Important tasks fall through the cracks</li>
            <li>Teams work in silos without alignment</li>
            <li>Problems fester until they become crises</li>
            <li>Strategic goals get lost in daily firefighting</li>
            <li>Decision-making becomes reactive instead of proactive</li>
          </ul>
          <p>With a strong operating rhythm, your business runs with consistency, clarity, and momentum—even when you are not personally driving every decision.</p>
        </div>
      )
    },
    {
      question: "What are the components of Operating Rhythm?",
      answer: (
        <div className="space-y-2">
          <p>Operating Rhythm typically includes:</p>
          <ul className="list-disc pl-5 space-y-1 text-[#7b6b8d] dark:text-[#e8e4f0]">
            <li><strong>Daily:</strong> Stand-ups, priority setting, quick check-ins</li>
            <li><strong>Weekly:</strong> Team meetings, metric reviews, planning sessions</li>
            <li><strong>Monthly:</strong> Business reviews, goal tracking, strategy adjustments</li>
            <li><strong>Quarterly:</strong> Strategic planning, major goal setting, deep reviews</li>
            <li><strong>Annual:</strong> Vision setting, major planning, celebration and reflection</li>
          </ul>
          <p>Each business finds its own rhythm based on size, stage, and industry.</p>
        </div>
      )
    },
    {
      question: "How do I establish my Operating Rhythm?",
      answer: (
        <div className="space-y-2">
          <p>Start simple and build:</p>
          <ol className="list-decimal pl-5 space-y-1 text-[#7b6b8d] dark:text-[#e8e4f0]">
            <li><strong>Identify what matters most:</strong> What decisions or reviews happen repeatedly?</li>
            <li><strong>Choose your cadence:</strong> How often does each activity need to happen?</li>
            <li><strong>Calendar it:</strong> Block the time. Protect it.</li>
            <li><strong>Create agendas:</strong> Know what happens in each meeting</li>
            <li><strong>Start with one rhythm:</strong> Master weekly before adding quarterly</li>
            <li><strong>Iterate:</strong> Adjust based on what works</li>
          </ol>
        </div>
      )
    },
    {
      question: "What should happen in a weekly rhythm?",
      answer: (
        <div className="space-y-2">
          <p>A strong weekly rhythm typically includes:</p>
          <ul className="list-disc pl-5 space-y-1 text-[#7b6b8d] dark:text-[#e8e4f0]">
            <li><strong>Monday Kickoff:</strong> Set priorities for the week, align the team</li>
            <li><strong>Mid-week Check-in:</strong> Quick sync on progress, unblock issues</li>
            <li><strong>Friday Review:</strong> What got done? What did not? Why?</li>
            <li><strong>Metric Review:</strong> Key numbers—traffic, sales, support tickets</li>
          </ul>
          <p>Keep meetings short and purposeful. The goal is alignment, not marathon sessions.</p>
        </div>
      )
    },
    {
      question: "What about monthly and quarterly rhythms?",
      answer: (
        <div className="space-y-2">
          <p><strong>Monthly Rhythm:</strong></p>
          <ul className="list-disc pl-5 space-y-1 text-[#7b6b8d] dark:text-[#e8e4f0]">
            <li>Review Domain Scores and Overall Health</li>
            <li>Assess progress on monthly goals</li>
            <li>Adjust tactics for the coming month</li>
            <li>Celebrate wins and learn from misses</li>
          </ul>
          <p><strong>Quarterly Rhythm:</strong></p>
          <ul className="list-disc pl-5 space-y-1 text-[#7b6b8d] dark:text-[#e8e4f0]">
            <li>Deep strategic review</li>
            <li>Set or adjust quarterly objectives</li>
            <li>Resource allocation decisions</li>
            <li>Major initiative planning</li>
          </ul>
        </div>
      )
    },
    {
      question: "How do I keep my team aligned with the rhythm?",
      answer: (
        <div className="space-y-2">
          <p>Alignment requires consistency and clarity:</p>
          <ul className="list-disc pl-5 space-y-1 text-[#7b6b8d] dark:text-[#e8e4f0]">
            <li>Share the rhythm document with everyone</li>
            <li>Put all meetings on shared calendars</li>
            <li>Create standard agendas so people know what to expect</li>
            <li>Start and end on time—respect the rhythm</li>
            <li>Follow through on action items between meetings</li>
            <li>Review and adjust the rhythm itself quarterly</li>
          </ul>
        </div>
      )
    },
    {
      question: "What if I am a solopreneur? Do I still need Operating Rhythm?",
      answer: "Absolutely. In fact, solopreneurs often need operating rhythm even more because there is no team to create natural accountability. Your rhythm might include: Daily priority setting, Weekly business review, Monthly goal assessment, Quarterly strategic planning. The rhythm creates accountability to yourself and ensures you are working ON the business, not just IN it."
    },
    {
      question: "How does Operating Rhythm relate to Domain Scores?",
      answer: "Your Operating Rhythm is the engine that improves your Domain Scores. Regular reviews ensure you are: Monitoring each domain consistently, Taking action on low scores, Celebrating and reinforcing high scores, Catching problems early. Without rhythm, domain scores become static snapshots. With rhythm, they become dynamic tools for continuous improvement."
    },
    {
      question: "What are common Operating Rhythm mistakes?",
      answer: (
        <div className="space-y-2">
          <ul className="list-disc pl-5 space-y-1 text-[#7b6b8d] dark:text-[#e8e4f0]">
            <li><strong>Too many meetings:</strong> Rhythm should reduce chaos, not create it</li>
            <li><strong>No clear purpose:</strong> Every meeting needs a specific outcome</li>
            <li><strong>Inconsistent execution:</strong> Canceling rhythm meetings when busy (that is when you need them most)</li>
            <li><strong>No follow-through:</strong> Action items from meetings get lost</li>
            <li><strong>One-size-fits-all:</strong> Copying someone else&apos;s rhythm without adapting to your needs</li>
            <li><strong>Never reviewing the rhythm:</strong> The rhythm itself should evolve as your business grows</li>
          </ul>
        </div>
      )
    }
  ];

  return (
    <div className="py-8 px-4 max-w-4xl mx-auto">
      {/* Back Navigation */}
      <Link href="/help" className="flex items-center gap-2 text-[#7b6b8d] hover:text-[#1a2b4a] mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to Help Center
      </Link>

      {/* Hero Section */}
      <div className="text-center mb-10">
        <div className="w-16 h-16 rounded-full bg-[#c9a227]/20 flex items-center justify-center mx-auto mb-4">
          <Timer className="w-8 h-8 text-[#c9a227]" />
        </div>
        <h1 className="text-3xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0] mb-3">
          Operating Rhythm
        </h1>
        <p className="text-lg text-[#b8a898] max-w-2xl mx-auto">
          The heartbeat that keeps your business aligned and moving forward
        </p>
      </div>

      {/* What is Operating Rhythm */}
      <Card className="mb-8 border-[#c9a227]/30">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#c9a227]" />
            What is Operating Rhythm?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-[#1a2b4a] dark:text-[#F8F5F0] leading-relaxed">
            <strong>Operating Rhythm</strong> is the predictable pattern of meetings, reviews, and rituals 
            that keep your business running smoothly. It is the difference between reactive chaos and 
            proactive momentum.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="p-4 bg-[#1a2b4a]/5 rounded-lg text-center">
              <Repeat className="w-8 h-8 text-[#4a9b9b] mx-auto mb-2" />
              <h3 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Consistent</h3>
              <p className="text-sm text-[#b8a898]">Same meetings, same times, same agendas</p>
            </div>
            <div className="p-4 bg-[#1a2b4a]/5 rounded-lg text-center">
              <Target className="w-8 h-8 text-[#7b6b8d] mx-auto mb-2" />
              <h3 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Purposeful</h3>
              <p className="text-sm text-[#b8a898]">Every meeting has a clear outcome</p>
            </div>
            <div className="p-4 bg-[#1a2b4a]/5 rounded-lg text-center">
              <Zap className="w-8 h-8 text-[#c9a227] mx-auto mb-2" />
              <h3 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Efficient</h3>
              <p className="text-sm text-[#b8a898]">Minimal time, maximum alignment</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* The Rhythm Framework */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#c9a227]" />
            The Rhythm Framework
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-[#1a2b4a]/5 rounded-lg">
              <div className="w-12 h-12 rounded-full bg-[#4a9b9b]/20 flex items-center justify-center flex-shrink-0">
                <span className="text-[#4a9b9b] font-bold text-sm">Daily</span>
              </div>
              <div>
                <h4 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Daily Rhythm</h4>
                <p className="text-sm text-[#b8a898] mb-2">15-30 minutes to set the tone</p>
                <ul className="text-sm text-[#7b6b8d] dark:text-[#e8e4f0] space-y-1">
                  <li>• Morning priority setting</li>
                  <li>• Quick team standup (if applicable)</li>
                  <li>• End-of-day reflection</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-[#1a2b4a]/5 rounded-lg">
              <div className="w-12 h-12 rounded-full bg-[#7b6b8d]/20 flex items-center justify-center flex-shrink-0">
                <span className="text-[#7b6b8d] font-bold text-sm">Weekly</span>
              </div>
              <div>
                <h4 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Weekly Rhythm</h4>
                <p className="text-sm text-[#b8a898] mb-2">1-2 hours for alignment and execution</p>
                <ul className="text-sm text-[#7b6b8d] dark:text-[#e8e4f0] space-y-1">
                  <li>• Monday kickoff meeting</li>
                  <li>• Mid-week progress check</li>
                  <li>• Friday review and celebration</li>
                  <li>• Key metrics review</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-[#1a2b4a]/5 rounded-lg">
              <div className="w-12 h-12 rounded-full bg-[#c9a227]/20 flex items-center justify-center flex-shrink-0">
                <span className="text-[#c9a227] font-bold text-xs">Monthly</span>
              </div>
              <div>
                <h4 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Monthly Rhythm</h4>
                <p className="text-sm text-[#b8a898] mb-2">2-4 hours for review and adjustment</p>
                <ul className="text-sm text-[#7b6b8d] dark:text-[#e8e4f0] space-y-1">
                  <li>• Business health review</li>
                  <li>• Domain score assessment</li>
                  <li>• Goal progress evaluation</li>
                  <li>• Next month planning</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-[#1a2b4a]/5 rounded-lg">
              <div className="w-12 h-12 rounded-full bg-[#4a9b9b]/20 flex items-center justify-center flex-shrink-0">
                <span className="text-[#4a9b9b] font-bold text-xs">Quarterly</span>
              </div>
              <div>
                <h4 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Quarterly Rhythm</h4>
                <p className="text-sm text-[#b8a898] mb-2">Half to full day for strategy</p>
                <ul className="text-sm text-[#7b6b8d] dark:text-[#e8e4f0] space-y-1">
                  <li>• Deep strategic review</li>
                  <li>• Quarterly objectives setting</li>
                  <li>• Resource allocation</li>
                  <li>• Major initiative planning</li>
                </ul>
              </div>
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

      {/* Best Practices */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-[#c9a227]" />
            Operating Rhythm Best Practices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h4 className="font-semibold text-green-800 dark:text-green-200">Do</h4>
              </div>
              <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                <li>• Start simple and add complexity gradually</li>
                <li>• Protect your rhythm time fiercely</li>
                <li>• Create standard agendas</li>
                <li>• End meetings with clear action items</li>
                <li>• Review and adjust the rhythm quarterly</li>
              </ul>
            </div>

            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <h4 className="font-semibold text-red-800 dark:text-red-200">Don&apos;t</h4>
              </div>
              <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                <li>• Schedule meetings just to meet</li>
                <li>• Cancel rhythm when you are busy</li>
                <li>• Let meetings run over consistently</li>
                <li>• Copy someone else&apos;s rhythm exactly</li>
                <li>• Ignore the rhythm&apos;s effectiveness</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CTA */}
      <Card className="bg-gradient-to-br from-[#1a2b4a] to-[#7b6b8d] text-[#F8F5F0]">
        <CardContent className="p-8 text-center">
          <Timer className="w-12 h-12 text-[#c9a227] mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-3">Find Your Rhythm</h2>
          <p className="text-[#e8e4f0] mb-6 max-w-lg mx-auto">
            Use the LifeCharter Command Suite platform to support your operating rhythm. 
            Schedule reviews, track progress, and keep your business aligned.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/dashboard">
              <Button className="bg-[#c9a227] text-[#1a2b4a] hover:bg-[#c9a227]/90">
                <Calendar className="w-4 h-4 mr-2" />
                Start Your Rhythm
              </Button>
            </Link>
            <Link href="/help/overall-health">
              <Button variant="outline" className="border-[#c9a227] text-[#c9a227] hover:bg-[#c9a227]/10">
                Review Business Health
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Quote */}
      <div className="mt-8 text-center">
        <blockquote className="text-lg italic text-[#7b6b8d] dark:text-[#e8e4f0] border-l-4 border-[#c9a227] pl-4 inline-block">
          &ldquo;Rhythm creates momentum. Momentum creates results. Results create confidence.&rdquo;
        </blockquote>
        <p className="text-sm text-[#b8a898] mt-2">— LifeCharter Command Suite Team</p>
      </div>
    </div>
  );
}
