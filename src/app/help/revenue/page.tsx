"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  ArrowLeft,
  Wallet,
  TrendingUp,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  DollarSign,
  BarChart3,
  PieChart,
  Target,
  AlertCircle,
  CheckCircle,
  Lightbulb
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface FAQItem {
  question: string;
  answer: string | React.ReactNode;
}

export default function RevenueSnapshotHelpPage() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  const faqs: FAQItem[] = [
    {
      question: "What is the Revenue Snapshot?",
      answer: "The Revenue Snapshot is a card on your Business Alignment page (Alignment in the left menu) that gives you a quick view of your business's financial performance. It is built from your own Finance Center ledger and your Sales Activities, so it shows only what you have recorded. Where nothing is recorded yet, it shows a dash instead of a made-up number."
    },
    {
      question: "What does the Revenue Snapshot show?",
      answer: (
        <div className="space-y-2">
          <p>The Revenue Snapshot includes four numbers and a chart:</p>
          <ul className="list-disc pl-5 space-y-1 text-[#7b6b8d] dark:text-[#e8e4f0]">
            <li><strong>Revenue this month:</strong> Your income so far this month, compared with the same days of last month</li>
            <li><strong>Net this month:</strong> Income minus expenses, with your margin percentage</li>
            <li><strong>Avg deal size:</strong> The average value of the deals you have marked won in Sales Activities</li>
            <li><strong>Win rate:</strong> Deals won out of the people you have contacted, from Sales Activities</li>
            <li><strong>Six-month chart:</strong> Your income and expenses for each of the last six months</li>
          </ul>
        </div>
      )
    },
    {
      question: "Where does the Revenue Snapshot get its data?",
      answer: (
        <div className="space-y-2">
          <p>Everything comes from what is in your account:</p>
          <ul className="list-disc pl-5 space-y-1 text-[#7b6b8d] dark:text-[#e8e4f0]">
            <li><strong>Income Tracker and Expense Manager:</strong> Add income and expenses by hand in the Finance Center, or from Quick Capture on your phone</li>
            <li><strong>Statement import:</strong> On the Financial Pulse page in Finance, press Import, upload a CSV or paste your statement, check the transactions it finds, and commit them to your ledger. This uses your own AI key</li>
            <li><strong>Stripe:</strong> Connect your Stripe account and your payments, fees and refunds flow into your ledger automatically</li>
            <li><strong>Sales Activities:</strong> Log your calls, follow-ups and outcomes in the Daily Compass, and mark deals won</li>
          </ul>
          <p>The more you record, the more complete your snapshot becomes.</p>
        </div>
      )
    },
    {
      question: "How do I connect Stripe?",
      answer: (
        <div className="space-y-2">
          <p>To connect Stripe:</p>
          <ol className="list-decimal pl-5 space-y-1 text-[#7b6b8d] dark:text-[#e8e4f0]">
            <li>In Stripe, create a read-only restricted key</li>
            <li>Go to Settings → Integrations and find the Stripe card</li>
            <li>Paste your restricted key and connect</li>
            <li>The Suite brings in your last 90 days of payments right away, then syncs every morning</li>
          </ol>
          <p>You can also sync on demand from the same card, and disconnect any time. Payments already in your ledger stay there.</p>
        </div>
      )
    },
    {
      question: "How do I set revenue goals?",
      answer: (
        <div className="space-y-2">
          <p>Your monthly income goal is the income target in Finance → Budget Planner. You can also set it right on the Financial Pulse card on Executive Home, where you can switch between Week, Month and Year to see the percentage of your goal reached.</p>
          <ul className="list-disc pl-5 space-y-1 text-[#7b6b8d] dark:text-[#e8e4f0]">
            <li><strong>Specific:</strong> &quot;$10,000 monthly&quot; not &quot;more revenue&quot;</li>
            <li><strong>Achievable:</strong> Challenging but realistic based on your current trajectory</li>
            <li><strong>Time-bound:</strong> The yearly goal defaults to 12 times your monthly goal, and you can edit the week or year number yourself</li>
          </ul>
          <p>The Revenue Snapshot shows your income and trend; the Financial Pulse card shows your progress against your goal.</p>
        </div>
      )
    },
    {
      question: "What if my revenue is inconsistent?",
      answer: "Inconsistent revenue is common, especially in early-stage businesses. The six-month chart helps you spot patterns, like seasonal dips and spikes, and see which months carried you. Consider strategies to create more predictable income: subscriptions, retainers, payment plans, or diversifying your client base. The Forecasting page in the Planning section can project your income forward from your recent run-rate and your open pipeline."
    },
    {
      question: "How does Revenue Snapshot relate to Domain Scores?",
      answer: "Your Finance domain score is built partly from your live ledger: your income against your goal, your expenses and your cash. Your Sales domain score draws on your sales activity, including your conversion rate. Keeping your income, expenses and sales activity up to date makes both scores, and your Overall Business Health, more accurate."
    },
    {
      question: "Can I export my financial data?",
      answer: "Yes. Open Finance → Financial Reports (P&L), choose the period you want, month, quarter, year or a custom date range, and download it as a CSV for spreadsheet analysis or a PDF for reports."
    },
    {
      question: "Is my financial data secure?",
      answer: (
        <div className="space-y-2">
          <p className="font-medium text-[#4a9b9b]">Yes, we treat it with care:</p>
          <ul className="list-disc pl-5 space-y-1 text-[#7b6b8d] dark:text-[#e8e4f0]">
            <li>Your finances are private to your own account</li>
            <li>The Stripe connection uses a read-only key, so nothing can be charged or changed in your Stripe account</li>
            <li>Your key is stored on the server only and is never shown back in the browser</li>
            <li>You can disconnect Stripe at any time</li>
          </ul>
        </div>
      )
    },
    {
      question: "What should I do if revenue is declining?",
      answer: (
        <div className="space-y-2">
          <p>If you see declining revenue in your snapshot:</p>
          <ol className="list-decimal pl-5 space-y-1 text-[#7b6b8d] dark:text-[#e8e4f0]">
            <li><strong>Investigate:</strong> Look at your Income Tracker to see which sources or offers declined</li>
            <li><strong>Context:</strong> Is this seasonal or industry-wide?</li>
            <li><strong>Client Feedback:</strong> Talk to clients about changes</li>
            <li><strong>Quick Wins:</strong> Identify the fastest ways to generate revenue, like following up with warm contacts in your Pipeline</li>
            <li><strong>Strategic Adjustments:</strong> Revisit your marketing, pricing, or offers</li>
            <li><strong>Get Help:</strong> Ask your AI assistant for ideas based on your numbers</li>
          </ol>
          <p>Early detection through the Revenue Snapshot gives you time to respond.</p>
        </div>
      )
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
        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
          <Wallet className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
        <h1 className="text-3xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0] mb-3">
          Revenue Snapshot
        </h1>
        <p className="text-lg text-[#b8a898] max-w-2xl mx-auto">
          A clear view of your income, expenses and sales results
        </p>
      </div>

      {/* What is Revenue Snapshot */}
      <Card className="mb-8 border-[#c9a227]/30">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#c9a227]" />
            What is the Revenue Snapshot?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-[#1a2b4a] dark:text-[#F8F5F0] leading-relaxed">
            The <strong>Revenue Snapshot</strong> is your business&apos;s financial dashboard on the Business Alignment page. It brings together 
            what you have recorded in your Finance Center and your Sales Activities into one clear view. 
            No more guessing. Just the numbers you need to make smart decisions.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="p-4 bg-[#1a2b4a]/5 rounded-lg text-center">
              <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Income</h3>
              <p className="text-sm text-[#b8a898]">This month, and how it compares to last month</p>
            </div>
            <div className="p-4 bg-[#1a2b4a]/5 rounded-lg text-center">
              <TrendingUp className="w-8 h-8 text-[#7b6b8d] mx-auto mb-2" />
              <h3 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Trends</h3>
              <p className="text-sm text-[#b8a898]">Your last six months, income and expenses</p>
            </div>
            <div className="p-4 bg-[#1a2b4a]/5 rounded-lg text-center">
              <PieChart className="w-8 h-8 text-[#c9a227] mx-auto mb-2" />
              <h3 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Sales Results</h3>
              <p className="text-sm text-[#b8a898]">Average deal size and win rate</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Target className="w-5 h-5 text-[#c9a227]" />
            Key Metrics Explained
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <h4 className="font-semibold text-green-800 dark:text-green-200">Revenue this month</h4>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300">
                The income you have recorded so far this month, with the percentage change compared 
                with the same days of last month. It shows &quot;nothing to compare yet&quot; until last month has income.
              </p>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold text-blue-800 dark:text-blue-200">Net this month</h4>
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Income minus expenses for the month, with your margin percentage underneath. 
                Keep your expenses categorized and up to date so this stays accurate.
              </p>
            </div>

            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-2 mb-2">
                <PieChart className="w-5 h-5 text-purple-600" />
                <h4 className="font-semibold text-purple-800 dark:text-purple-200">Avg deal size and Win rate</h4>
              </div>
              <p className="text-sm text-purple-700 dark:text-purple-300">
                Average deal size is the average value of the deals you have marked won in Sales Activities. 
                Win rate is deals won out of the people you have contacted there. Both stay as dashes until you log some activity.
              </p>
            </div>

            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-yellow-600" />
                <h4 className="font-semibold text-yellow-800 dark:text-yellow-200">Six-month chart</h4>
              </div>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Income and expenses side by side for each of your last six months. Hover over a bar to see the amounts. 
                Your progress against your income goal lives on the Financial Pulse card.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Sources */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Wallet className="w-5 h-5 text-[#c9a227]" />
            Data Sources
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-[#1a2b4a]/5 rounded-lg">
              <h4 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0] mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Automatic and Imported
              </h4>
              <ul className="text-sm text-[#7b6b8d] dark:text-[#e8e4f0] space-y-1">
                <li>• Stripe payments, fees and refunds (Settings → Integrations)</li>
                <li>• Bank or card statements you import (CSV or pasted text)</li>
                <li>• Sales you log in Sales Activities</li>
              </ul>
            </div>

            <div className="p-4 bg-[#1a2b4a]/5 rounded-lg">
              <h4 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0] mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-blue-500" />
                Manual Entry
              </h4>
              <ul className="text-sm text-[#7b6b8d] dark:text-[#e8e4f0] space-y-1">
                <li>• The Income Tracker and Expense Manager in Finance</li>
                <li>• Quick Capture on your phone</li>
                <li>• Cash transactions and offline sales</li>
                <li>• Check payments</li>
                <li>• Other income sources</li>
              </ul>
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
            Using Your Revenue Snapshot Effectively
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <TrendingUp className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-800 dark:text-green-200">Review Weekly</h4>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Check your snapshot weekly, alongside your Weekly Review. Spot trends early.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <Target className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-800 dark:text-blue-200">Set Goals</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Use the snapshot to set realistic revenue targets in your Budget Planner, then watch your progress on the Financial Pulse card.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <PieChart className="w-5 h-5 text-purple-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-purple-800 dark:text-purple-200">Log Your Sales</h4>
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  Mark deals won in Sales Activities so your average deal size and win rate stay true.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800 dark:text-yellow-200">Watch for Red Flags</h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  A dip on the six-month chart or in this month&apos;s comparison is an early warning. Act quickly.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CTA */}
      <Card className="bg-gradient-to-br from-[#1a2b4a] to-[#7b6b8d] text-[#F8F5F0]">
        <CardContent className="p-8 text-center">
          <Wallet className="w-12 h-12 text-[#c9a227] mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-3">Know Your Numbers</h2>
          <p className="text-[#e8e4f0] mb-6 max-w-lg mx-auto">
            Record your income and expenses, connect Stripe if you use it, set your goals, and see 
            your business&apos;s financial health at a glance.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/business-alignment">
              <Button className="bg-[#c9a227] text-[#1a2b4a] hover:bg-[#c9a227]/90">
                <BarChart3 className="w-4 h-4 mr-2" />
                View Revenue Snapshot
              </Button>
            </Link>
            <Link href="/settings?tab=integrations">
              <Button variant="outline" className="border-[#c9a227] text-[#c9a227] hover:bg-[#c9a227]/10">
                Connect Sources
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Quote */}
      <div className="mt-8 text-center">
        <blockquote className="text-lg italic text-[#7b6b8d] dark:text-[#e8e4f0] border-l-4 border-[#c9a227] pl-4 inline-block">
          &ldquo;Revenue is the lifeblood of business. Visibility into revenue is the heartbeat of smart decisions.&rdquo;
        </blockquote>
        <p className="text-sm text-[#b8a898] mt-2">— LifeCharter Command Suite Team</p>
      </div>
    </div>
  );
}
