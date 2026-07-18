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
      answer: "The Revenue Snapshot provides a quick, comprehensive view of your business's financial performance. It aggregates key revenue metrics from your connected accounts (Stripe, PayPal, QuickBooks) and manual entries to give you real-time insight into your income, trends, and financial health. Think of it as your business's financial pulse—always available, always current."
    },
    {
      question: "What metrics does the Revenue Snapshot show?",
      answer: (
        <div className="space-y-2">
          <p>The Revenue Snapshot includes:</p>
          <ul className="list-disc pl-5 space-y-1 text-[#5E3B6C] dark:text-[#CDBED6]">
            <li><strong>Total Revenue:</strong> All income across all sources</li>
            <li><strong>Monthly Recurring Revenue (MRR):</strong> Predictable subscription income</li>
            <li><strong>Revenue by Source:</strong> Breakdown by product, service, or channel</li>
            <li><strong>Revenue Trend:</strong> Month-over-month and year-over-year growth</li>
            <li><strong>Average Revenue Per Customer:</strong> Customer value metrics</li>
            <li><strong>Revenue Goals:</strong> Progress toward your targets</li>
          </ul>
        </div>
      )
    },
    {
      question: "How is Revenue Snapshot data updated?",
      answer: (
        <div className="space-y-2">
          <p>Data updates through multiple channels:</p>
          <ul className="list-disc pl-5 space-y-1 text-[#5E3B6C] dark:text-[#CDBED6]">
            <li><strong>Automatic Sync:</strong> Connected payment processors (Stripe, PayPal) update in real-time or daily</li>
            <li><strong>Bank Feeds:</strong> Linked business accounts import transactions</li>
            <li><strong>Manual Entry:</strong> You can add cash transactions, offline sales, or other income</li>
            <li><strong>File Upload:</strong> Import CSV statements from banks or payment platforms</li>
          </ul>
          <p>The more sources you connect, the more complete your snapshot becomes.</p>
        </div>
      )
    },
    {
      question: "How do I connect my revenue sources?",
      answer: (
        <div className="space-y-2">
          <p>To connect revenue sources:</p>
          <ol className="list-decimal pl-5 space-y-1 text-[#5E3B6C] dark:text-[#CDBED6]">
            <li>Go to Settings → Integrations</li>
            <li>Select your payment processor or bank</li>
            <li>Follow the secure authentication process</li>
            <li>Grant read-only access to transaction data</li>
            <li>Data will begin syncing automatically</li>
          </ol>
          <p>Supported integrations include Stripe, PayPal, Square, QuickBooks, and major banks.</p>
        </div>
      )
    },
    {
      question: "What is MRR and why does it matter?",
      answer: "MRR (Monthly Recurring Revenue) is the predictable revenue you can expect every month from subscriptions, retainers, or ongoing contracts. It matters because: Predictability—You can forecast future income. Valuation—Businesses with MRR are valued higher than one-time sales. Stability—Recurring revenue smooths out seasonal fluctuations. Growth Measurement—MRR growth rate shows business momentum. Even if you don't have subscriptions, tracking repeat customer revenue similarly helps predict stability."
    },
    {
      question: "How do I set revenue goals?",
      answer: (
        <div className="space-y-2">
          <p>Set SMART revenue goals:</p>
          <ul className="list-disc pl-5 space-y-1 text-[#5E3B6C] dark:text-[#CDBED6]">
            <li><strong>Specific:</strong> &quot;$10,000 monthly&quot; not &quot;more revenue&quot;</li>
            <li><strong>Measurable:</strong> Trackable in the Revenue Snapshot</li>
            <li><strong>Achievable:</strong> Challenging but realistic based on current trajectory</li>
            <li><strong>Relevant:</strong> Aligned with your business stage and capacity</li>
            <li><strong>Time-bound:</strong> Monthly, quarterly, and annual targets</li>
          </ul>
          <p>Set goals in the Finance section. The Revenue Snapshot will track your progress automatically.</p>
        </div>
      )
    },
    {
      question: "What if my revenue is inconsistent?",
      answer: "Inconsistent revenue is common, especially in early-stage businesses. The Revenue Snapshot helps by: Showing patterns—you might spot seasonal trends. Identifying reliable sources—focus on what consistently brings income. Highlighting one-time spikes—so you don't mistake them for sustainable growth. Tracking toward consistency—set goals around reducing variance. Consider strategies to create more predictable income: subscriptions, retainers, payment plans, or diversifying customer base."
    },
    {
      question: "How does Revenue Snapshot relate to Domain Scores?",
      answer: "Revenue performance directly impacts multiple Domain Scores: Finance & Cash Flow—Obviously tied to revenue metrics. Sales & Conversion—Revenue reflects sales effectiveness. Products & Services—Revenue per product shows what's working. Customer Experience—Repeat revenue indicates satisfaction. Marketing & Visibility—Revenue by source shows channel effectiveness. Strong revenue lifts your Overall Business Health score. Declining revenue triggers alerts in the relevant domains."
    },
    {
      question: "Can I export my Revenue Snapshot data?",
      answer: "Yes, you can export Revenue Snapshot data in multiple formats: CSV for spreadsheet analysis, PDF for reports or investors, and API access for custom integrations. Export options are available in the Finance → Reports section. You can filter by date range, revenue source, or customer segment before exporting."
    },
    {
      question: "Is my financial data secure?",
      answer: (
        <div className="space-y-2">
          <p className="font-medium text-[#2E7C83]">Yes, security is our priority:</p>
          <ul className="list-disc pl-5 space-y-1 text-[#5E3B6C] dark:text-[#CDBED6]">
            <li>Bank-level 256-bit encryption for all data</li>
            <li>Read-only connections—no transactions can be initiated</li>
            <li>SOC 2 Type II certified data centers</li>
            <li>Regular security audits and penetration testing</li>
            <li>You control data retention and can delete anytime</li>
            <li>Never sold to third parties</li>
          </ul>
        </div>
      )
    },
    {
      question: "What should I do if revenue is declining?",
      answer: (
        <div className="space-y-2">
          <p>If you see declining revenue in your snapshot:</p>
          <ol className="list-decimal pl-5 space-y-1 text-[#5E3B6C] dark:text-[#CDBED6]">
            <li><strong>Investigate:</strong> Check which sources or products declined</li>
            <li><strong>Context:</strong> Is this seasonal or industry-wide?</li>
            <li><strong>Customer Feedback:</strong> Talk to customers about changes</li>
            <li><strong>Quick Wins:</strong> Identify fastest ways to generate revenue</li>
            <li><strong>Strategic Adjustments:</strong> Pivot marketing, pricing, or offers</li>
            <li><strong>Get Help:</strong> Use the AI Guide for revenue recovery strategies</li>
          </ol>
          <p>Early detection through the Revenue Snapshot gives you time to respond.</p>
        </div>
      )
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
        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
          <Wallet className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
        <h1 className="text-3xl font-bold text-[#1F315B] dark:text-[#F6F1E8] mb-3">
          Revenue Snapshot
        </h1>
        <p className="text-lg text-[#B9A9A9] max-w-2xl mx-auto">
          Real-time visibility into your business income and financial health
        </p>
      </div>

      {/* What is Revenue Snapshot */}
      <Card className="mb-8 border-[#D4AF63]/30">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#D4AF63]" />
            What is the Revenue Snapshot?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-[#1F315B] dark:text-[#F6F1E8] leading-relaxed">
            The <strong>Revenue Snapshot</strong> is your business&apos;s financial dashboard. It brings together 
            income from all sources—payments, transfers, cash sales—into one clear, real-time view. 
            No more guessing. No more spreadsheets. Just the numbers you need to make smart decisions.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="p-4 bg-[#1F315B]/5 rounded-lg text-center">
              <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold text-[#1F315B] dark:text-[#F6F1E8]">Total Income</h3>
              <p className="text-sm text-[#B9A9A9]">All revenue sources combined</p>
            </div>
            <div className="p-4 bg-[#1F315B]/5 rounded-lg text-center">
              <TrendingUp className="w-8 h-8 text-[#5E3B6C] mx-auto mb-2" />
              <h3 className="font-semibold text-[#1F315B] dark:text-[#F6F1E8]">Trends</h3>
              <p className="text-sm text-[#B9A9A9]">Growth patterns over time</p>
            </div>
            <div className="p-4 bg-[#1F315B]/5 rounded-lg text-center">
              <PieChart className="w-8 h-8 text-[#D4AF63] mx-auto mb-2" />
              <h3 className="font-semibold text-[#1F315B] dark:text-[#F6F1E8]">Breakdown</h3>
              <p className="text-sm text-[#B9A9A9]">Revenue by source and product</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Target className="w-5 h-5 text-[#D4AF63]" />
            Key Metrics Explained
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <h4 className="font-semibold text-green-800 dark:text-green-200">Total Revenue</h4>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300">
                The sum of all income across all sources for the selected time period. 
                This is your top-line business performance number.
              </p>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold text-blue-800 dark:text-blue-200">Monthly Recurring Revenue (MRR)</h4>
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Predictable monthly income from subscriptions, retainers, or ongoing contracts. 
                MRR is the foundation of sustainable business growth.
              </p>
            </div>

            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-2 mb-2">
                <PieChart className="w-5 h-5 text-purple-600" />
                <h4 className="font-semibold text-purple-800 dark:text-purple-200">Revenue by Source</h4>
              </div>
              <p className="text-sm text-purple-700 dark:text-purple-300">
                Breakdown showing which products, services, or channels generate your income. 
                Helps identify your most valuable offerings.
              </p>
            </div>

            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-yellow-600" />
                <h4 className="font-semibold text-yellow-800 dark:text-yellow-200">Goal Progress</h4>
              </div>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                How close you are to hitting your revenue targets. Visual indicators show 
                if you are on track, ahead, or behind.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Sources */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Wallet className="w-5 h-5 text-[#D4AF63]" />
            Data Sources
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-[#1F315B]/5 rounded-lg">
              <h4 className="font-semibold text-[#1F315B] dark:text-[#F6F1E8] mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Automatic Connections
              </h4>
              <ul className="text-sm text-[#5E3B6C] dark:text-[#CDBED6] space-y-1">
                <li>• Stripe payments</li>
                <li>• PayPal transactions</li>
                <li>• Square sales</li>
                <li>• QuickBooks data</li>
                <li>• Bank account feeds</li>
              </ul>
            </div>

            <div className="p-4 bg-[#1F315B]/5 rounded-lg">
              <h4 className="font-semibold text-[#1F315B] dark:text-[#F6F1E8] mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-blue-500" />
                Manual Entry
              </h4>
              <ul className="text-sm text-[#5E3B6C] dark:text-[#CDBED6] space-y-1">
                <li>• Cash transactions</li>
                <li>• Offline sales</li>
                <li>• Check payments</li>
                <li>• Barter arrangements</li>
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
                  Check your snapshot weekly during your operating rhythm. Spot trends early.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <Target className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-800 dark:text-blue-200">Set Goals</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Use the snapshot to set realistic revenue targets. Track progress visually.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <PieChart className="w-5 h-5 text-purple-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-purple-800 dark:text-purple-200">Analyze Sources</h4>
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  See which products or channels drive revenue. Double down on what works.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800 dark:text-yellow-200">Watch for Red Flags</h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Declining trends or missed goals trigger early warnings. Act quickly.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CTA */}
      <Card className="bg-gradient-to-br from-[#1F315B] to-[#5E3B6C] text-[#F6F1E8]">
        <CardContent className="p-8 text-center">
          <Wallet className="w-12 h-12 text-[#D4AF63] mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-3">Know Your Numbers</h2>
          <p className="text-[#CDBED6] mb-6 max-w-lg mx-auto">
            Connect your revenue sources, set your goals, and get real-time visibility 
            into your business financial health.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/finance">
              <Button className="bg-[#D4AF63] text-[#1F315B] hover:bg-[#D4AF63]/90">
                <BarChart3 className="w-4 h-4 mr-2" />
                View Revenue Snapshot
              </Button>
            </Link>
            <Link href="/settings">
              <Button variant="outline" className="border-[#D4AF63] text-[#D4AF63] hover:bg-[#D4AF63]/10">
                Connect Sources
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Quote */}
      <div className="mt-8 text-center">
        <blockquote className="text-lg italic text-[#5E3B6C] dark:text-[#CDBED6] border-l-4 border-[#D4AF63] pl-4 inline-block">
          &ldquo;Revenue is the lifeblood of business. Visibility into revenue is the heartbeat of smart decisions.&rdquo;
        </blockquote>
        <p className="text-sm text-[#B9A9A9] mt-2">— LifeCharter Architecture Team</p>
      </div>
    </div>
  );
}
