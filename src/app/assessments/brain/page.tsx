"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import { Brain, ArrowLeft, ArrowRight, Save, CheckCircle } from "lucide-react";
import Link from "next/link";

interface Question {
  id: string;
  text: string;
  type: "radio" | "text" | "number" | "multiselect";
  options?: { value: string; label: string }[];
  section: string;
  placeholder?: string;
}

const questions: Question[] = [
  // Section 1: Business Model (10 questions)
  {
    id: "bm1",
    text: "What is your primary business model?",
    type: "radio",
    section: "Business Model",
    options: [
      { value: "product", label: "Product-based (selling physical/digital products)" },
      { value: "service", label: "Service-based (consulting, coaching, agency)" },
      { value: "subscription", label: "Subscription/Membership" },
      { value: "marketplace", label: "Marketplace/Platform" },
      { value: "hybrid", label: "Hybrid (combination of above)" },
    ],
  },
  {
    id: "bm2",
    text: "What are your current revenue streams? List them in order of importance.",
    type: "text",
    section: "Business Model",
    placeholder: "e.g., 1-on-1 coaching, group programs, digital products, affiliate...",
  },
  {
    id: "bm3",
    text: "What is your pricing strategy?",
    type: "radio",
    section: "Business Model",
    options: [
      { value: "premium", label: "Premium pricing (high value, fewer clients)" },
      { value: "mid_market", label: "Mid-market (balanced value and volume)" },
      { value: "volume", label: "Volume-based (lower price, higher volume)" },
      { value: "tiered", label: "Tiered (multiple price points)" },
      { value: "unclear", label: "Still figuring it out" },
    ],
  },
  {
    id: "bm4",
    text: "Who is your ideal client? Describe them in detail.",
    type: "text",
    section: "Business Model",
    placeholder: "Demographics, psychographics, pain points, desires...",
  },
  {
    id: "bm5",
    text: "What specific problem do you solve for your clients?",
    type: "text",
    section: "Business Model",
    placeholder: "The #1 transformation or outcome you deliver...",
  },
  {
    id: "bm6",
    text: "What is your unique value proposition? What makes you different?",
    type: "text",
    section: "Business Model",
    placeholder: "Why should someone choose you over alternatives?",
  },
  {
    id: "bm7",
    text: "How clear is your business model to you right now?",
    type: "radio",
    section: "Business Model",
    options: [
      { value: "crystal", label: "Crystal clear - I can explain it in one sentence" },
      { value: "mostly", label: "Mostly clear - some refinement needed" },
      { value: "somewhat", label: "Somewhat clear - working through it" },
      { value: "unclear", label: "Unclear - still exploring" },
      { value: "pivoting", label: "In transition/pivoting" },
    ],
  },
  {
    id: "bm8",
    text: "What is your approximate monthly revenue range?",
    type: "radio",
    section: "Business Model",
    options: [
      { value: "0", label: "Pre-revenue / Just starting" },
      { value: "1_5k", label: "$1K - $5K/month" },
      { value: "5_10k", label: "$5K - $10K/month" },
      { value: "10_25k", label: "$10K - $25K/month" },
      { value: "25_50k", label: "$25K - $50K/month" },
      { value: "50k_plus", label: "$50K+/month" },
    ],
  },
  {
    id: "bm9",
    text: "What percentage of your revenue is recurring vs. one-time?",
    type: "radio",
    section: "Business Model",
    options: [
      { value: "mostly_recurring", label: "Mostly recurring (70%+)" },
      { value: "balanced", label: "Fairly balanced (40-60%)" },
      { value: "mostly_onetime", label: "Mostly one-time (70%+)" },
      { value: "no_recurring", label: "No recurring revenue yet" },
      { value: "unsure", label: "Not sure / Haven't tracked" },
    ],
  },
  {
    id: "bm10",
    text: "What is your customer acquisition cost (CAC) relative to customer lifetime value (LTV)?",
    type: "radio",
    section: "Business Model",
    options: [
      { value: "healthy", label: "Healthy ratio (LTV is 3x+ CAC)" },
      { value: "break_even", label: "Breaking even (LTV ~ 1-2x CAC)" },
      { value: "losing", label: "Losing money (CAC higher than LTV)" },
      { value: "unsure", label: "Not tracking these metrics" },
      { value: "organic", label: "Mostly organic - low CAC" },
    ],
  },
  // Section 2: Offers (10 questions)
  {
    id: "of1",
    text: "What are your current offers? List them with prices.",
    type: "text",
    section: "Offers",
    placeholder: "Offer name - Price - Format (1-on-1, group, self-paced, etc.)",
  },
  {
    id: "of2",
    text: "What is your offer ladder? How do clients typically progress through your offers?",
    type: "text",
    section: "Offers",
    placeholder: "Entry offer → Core offer → Premium offer...",
  },
  {
    id: "of3",
    text: "What is your signature/core offer - the one you want to be known for?",
    type: "text",
    section: "Offers",
    placeholder: "Describe your main offer and why it's central to your business...",
  },
  {
    id: "of4",
    text: "What offers are in development or planning stages?",
    type: "text",
    section: "Offers",
    placeholder: "New offers you're creating or considering...",
  },
  {
    id: "of5",
    text: "How do you currently deliver your offers?",
    type: "radio",
    section: "Offers",
    options: [
      { value: "live", label: "Live delivery (calls, in-person)" },
      { value: "async", label: "Asynchronous (recorded, self-paced)" },
      { value: "hybrid", label: "Hybrid (combination of live and async)" },
      { value: "done_for_you", label: "Done-for-you services" },
      { value: "mixed", label: "Mixed across different offers" },
    ],
  },
  {
    id: "of6",
    text: "What is your average client value (how much does a typical client spend with you)?",
    type: "radio",
    section: "Offers",
    options: [
      { value: "under_500", label: "Under $500" },
      { value: "500_2k", label: "$500 - $2,000" },
      { value: "2k_5k", label: "$2,000 - $5,000" },
      { value: "5k_10k", label: "$5,000 - $10,000" },
      { value: "10k_plus", label: "$10,000+" },
      { value: "variable", label: "Highly variable" },
    ],
  },
  {
    id: "of7",
    text: "How satisfied are you with your current offer suite?",
    type: "radio",
    section: "Offers",
    options: [
      { value: "very", label: "Very satisfied - it's working well" },
      { value: "mostly", label: "Mostly satisfied - minor tweaks needed" },
      { value: "mixed", label: "Mixed - some work, some don't" },
      { value: "unsatisfied", label: "Unsatisfied - needs significant changes" },
      { value: "confused", label: "Confused - not sure what to offer" },
    ],
  },
  {
    id: "of8",
    text: "What is your refund/return policy?",
    type: "radio",
    section: "Offers",
    options: [
      { value: "guarantee", label: "Money-back guarantee" },
      { value: "conditional", label: "Conditional refund policy" },
      { value: "no_refund", label: "No refunds" },
      { value: "case_by_case", label: "Case by case" },
      { value: "none", label: "No formal policy yet" },
    ],
  },
  {
    id: "of9",
    text: "How do you handle payment plans and financing?",
    type: "radio",
    section: "Offers",
    options: [
      { value: "all", label: "Offer payment plans on everything" },
      { value: "high_ticket", label: "Payment plans for high-ticket only" },
      { value: "case_by_case", label: "Case by case basis" },
      { value: "none", label: "No payment plans offered" },
      { value: "third_party", label: "Use third-party financing" },
    ],
  },
  {
    id: "of10",
    text: "What offer gaps do you see in your business? What's missing?",
    type: "text",
    section: "Offers",
    placeholder: "Price gaps, format gaps, client journey gaps...",
  },
  // Section 3: Marketing & Sales (10 questions)
  {
    id: "ms1",
    text: "What are your primary marketing channels?",
    type: "text",
    section: "Marketing & Sales",
    placeholder: "Social media, email, podcast, referrals, ads, SEO, etc.",
  },
  {
    id: "ms2",
    text: "What is your sales process? Walk me through how someone becomes a client.",
    type: "text",
    section: "Marketing & Sales",
    placeholder: "Discovery call → Proposal → Close, or other flow...",
  },
  {
    id: "ms3",
    text: "What is your client journey from first touch to purchase?",
    type: "text",
    section: "Marketing & Sales",
    placeholder: "Awareness → Interest → Consideration → Decision...",
  },
  {
    id: "ms4",
    text: "What are your current conversion rates?",
    type: "radio",
    section: "Marketing & Sales",
    options: [
      { value: "high", label: "High (20%+ from qualified leads)" },
      { value: "good", label: "Good (10-20% from qualified leads)" },
      { value: "average", label: "Average (5-10% from qualified leads)" },
      { value: "low", label: "Low (under 5%)" },
      { value: "unknown", label: "Not tracking conversion rates" },
    ],
  },
  {
    id: "ms5",
    text: "How do you currently generate leads?",
    type: "text",
    section: "Marketing & Sales",
    placeholder: "Content marketing, paid ads, partnerships, events, etc.",
  },
  {
    id: "ms6",
    text: "What is your email list size and engagement rate?",
    type: "text",
    section: "Marketing & Sales",
    placeholder: "Approximate list size and open/click rates...",
  },
  {
    id: "ms7",
    text: "How do you nurture leads who aren't ready to buy yet?",
    type: "text",
    section: "Marketing & Sales",
    placeholder: "Email sequences, content, community, retargeting...",
  },
  {
    id: "ms8",
    text: "What is your current marketing budget as a percentage of revenue?",
    type: "radio",
    section: "Marketing & Sales",
    options: [
      { value: "0", label: "$0 (organic only)" },
      { value: "under_5", label: "Under 5%" },
      { value: "5_10", label: "5-10%" },
      { value: "10_20", label: "10-20%" },
      { value: "20_plus", label: "20%+" },
      { value: "unsure", label: "Not sure" },
    ],
  },
  {
    id: "ms9",
    text: "What sales objections do you hear most often?",
    type: "text",
    section: "Marketing & Sales",
    placeholder: "Price, timing, need to think about it, not the right fit...",
  },
  {
    id: "ms10",
    text: "What marketing activities feel most aligned and effective for you?",
    type: "text",
    section: "Marketing & Sales",
    placeholder: "What do you enjoy doing that also brings results?",
  },
  // Section 4: Operations (10 questions)
  {
    id: "op1",
    text: "What is your current team structure?",
    type: "text",
    section: "Operations",
    placeholder: "Full-time, part-time, contractors, VA, etc. - list roles",
  },
  {
    id: "op2",
    text: "What are your key workflows? Describe your main repeatable processes.",
    type: "text",
    section: "Operations",
    placeholder: "Onboarding, content creation, client delivery, etc.",
  },
  {
    id: "op3",
    text: "What is your tech stack? List your main tools.",
    type: "text",
    section: "Operations",
    placeholder: "CRM, email, scheduling, project management, etc.",
  },
  {
    id: "op4",
    text: "What SOPs (Standard Operating Procedures) do you have documented?",
    type: "text",
    section: "Operations",
    placeholder: "Which processes are documented and which aren't?",
  },
  {
    id: "op5",
    text: "What systems need the most improvement right now?",
    type: "text",
    section: "Operations",
    placeholder: "Biggest operational pain points...",
  },
  {
    id: "op6",
    text: "How do you manage your time and priorities?",
    type: "radio",
    section: "Operations",
    options: [
      { value: "systematic", label: "Systematic (time blocking, calendar management)" },
      { value: "list", label: "To-do lists and prioritization" },
      { value: "reactive", label: "Reactive (handle what comes up)" },
      { value: "intuitive", label: "Intuitive (go with the flow)" },
      { value: "chaotic", label: "Chaotic (often overwhelmed)" },
    ],
  },
  {
    id: "op7",
    text: "How do you handle client communication and support?",
    type: "text",
    section: "Operations",
    placeholder: "Email, Slack, Voxer, community platform, etc.",
  },
  {
    id: "op8",
    text: "What is your content creation workflow?",
    type: "text",
    section: "Operations",
    placeholder: "How do you create and distribute content?",
  },
  {
    id: "op9",
    text: "How do you track and manage business metrics?",
    type: "radio",
    section: "Operations",
    options: [
      { value: "dashboard", label: "Formal dashboard reviewed regularly" },
      { value: "spreadsheets", label: "Spreadsheets I update manually" },
      { value: "casual", label: "Casual tracking - I check when needed" },
      { value: "accountant", label: "My accountant/bookkeeper handles it" },
      { value: "none", label: "Not really tracking metrics" },
    ],
  },
  {
    id: "op10",
    text: "What would you delegate first if you had unlimited support?",
    type: "text",
    section: "Operations",
    placeholder: "The tasks you'd love to hand off...",
  },
  // Section 5: Financials (10 questions)
  {
    id: "fi1",
    text: "What is your approximate monthly revenue?",
    type: "radio",
    section: "Financials",
    options: [
      { value: "0", label: "Pre-revenue" },
      { value: "under_5k", label: "Under $5K" },
      { value: "5k_10k", label: "$5K - $10K" },
      { value: "10k_25k", label: "$10K - $25K" },
      { value: "25k_50k", label: "$25K - $50K" },
      { value: "50k_plus", label: "$50K+" },
    ],
  },
  {
    id: "fi2",
    text: "What are your primary monthly expenses?",
    type: "text",
    section: "Financials",
    placeholder: "Software, team, ads, contractors, etc. - rough breakdown",
  },
  {
    id: "fi3",
    text: "What is your approximate profit margin?",
    type: "radio",
    section: "Financials",
    options: [
      { value: "under_20", label: "Under 20%" },
      { value: "20_40", label: "20-40%" },
      { value: "40_60", label: "40-60%" },
      { value: "60_plus", label: "60%+" },
      { value: "unsure", label: "Not sure / Haven't calculated" },
    ],
  },
  {
    id: "fi4",
    text: "What are your financial goals for the next 12 months?",
    type: "text",
    section: "Financials",
    placeholder: "Revenue targets, profit goals, savings, investments...",
  },
  {
    id: "fi5",
    text: "How is your cash flow situation?",
    type: "radio",
    section: "Financials",
    options: [
      { value: "strong", label: "Strong - consistent and predictable" },
      { value: "good", label: "Good - mostly steady with some fluctuations" },
      { value: "variable", label: "Variable - feast or famine cycles" },
      { value: "tight", label: "Tight - often stressful" },
      { value: "crisis", label: "In crisis - need immediate help" },
    ],
  },
  {
    id: "fi6",
    text: "Do you have an emergency fund? If so, how many months of expenses does it cover?",
    type: "radio",
    section: "Financials",
    options: [
      { value: "6_plus", label: "6+ months" },
      { value: "3_6", label: "3-6 months" },
      { value: "1_3", label: "1-3 months" },
      { value: "under_1", label: "Under 1 month" },
      { value: "none", label: "No emergency fund" },
    ],
  },
  {
    id: "fi7",
    text: "How do you handle taxes and bookkeeping?",
    type: "radio",
    section: "Financials",
    options: [
      { value: "professional", label: "Professional accountant/bookkeeper" },
      { value: "software", label: "Accounting software (I do it myself)" },
      { value: "spreadsheets", label: "Spreadsheets and manual tracking" },
      { value: "shoebox", label: "Shoebox method (need to get organized)" },
      { value: "behind", label: "Behind and need to catch up" },
    ],
  },
  {
    id: "fi8",
    text: "What is your personal salary/draw from the business?",
    type: "radio",
    section: "Financials",
    options: [
      { value: "consistent", label: "Consistent monthly amount" },
      { value: "variable", label: "Variable based on revenue" },
      { value: "as_needed", label: "Take money as needed" },
      { value: "reinvesting", label: "Reinvesting everything" },
      { value: "unsure", label: "Not sure / Haven't separated personal/business" },
    ],
  },
  {
    id: "fi9",
    text: "What financial habits or patterns do you want to change?",
    type: "text",
    section: "Financials",
    placeholder: "Overspending, undercharging, not saving, avoiding numbers...",
  },
  {
    id: "fi10",
    text: "What would financial freedom look like for you?",
    type: "text",
    section: "Financials",
    placeholder: "Your definition of enough and financial peace...",
  },
];

const sections = [
  "Business Model",
  "Offers",
  "Marketing & Sales",
  "Operations",
  "Financials",
];

export default function BrainAssessmentPage() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  // Load saved progress
  useEffect(() => {
    const saved = localStorage.getItem("brain-assessment");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setAnswers(parsed.answers || {});
        setCurrentQuestion(parsed.currentQuestion || 0);
        setLastSaved(new Date(parsed.savedAt));
      } catch {
        // Invalid saved data, start fresh
      }
    }
  }, []);

  // Autosave
  const saveProgress = useCallback(() => {
    setIsSaving(true);
    const data = {
      answers,
      currentQuestion,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem("brain-assessment", JSON.stringify(data));
    setTimeout(() => {
      setLastSaved(new Date());
      setIsSaving(false);
    }, 500);
  }, [answers, currentQuestion]);

  useEffect(() => {
    const timer = setTimeout(saveProgress, 1000);
    return () => clearTimeout(timer);
  }, [answers, currentQuestion, saveProgress]);

  const handleAnswer = (value: string) => {
    setAnswers((prev) => ({ ...prev, [questions[currentQuestion].id]: value }));
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setIsComplete(true);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const currentQ = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const currentSection = currentQ.section;
  const sectionQuestions = questions.filter((q) => q.section === currentSection);
  const sectionProgress =
    ((sectionQuestions.findIndex((q) => q.id === currentQ.id) + 1) /
      sectionQuestions.length) *
    100;

  if (isComplete) {
    return (
      <div className="min-h-screen bg-[#F6F1E8] dark:bg-[#1a1a2e] py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="border-[#2E7C83]/30">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-[#2E7C83]/10 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-[#2E7C83]" />
              </div>
              <h1 className="text-2xl font-bold text-[#1F315B] dark:text-[#F6F1E8] mb-4">
                Brain Assessment Complete!
              </h1>
              <p className="text-[#1F315B]/70 dark:text-[#F6F1E8]/70 mb-6">
                Thank you for completing the Brain Assessment. Your responses have been
                saved and will contribute to your overall Business Health Score.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/assessments/soul">
                  <Button variant="primary">
                    Continue to Soul Assessment
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="secondary">Go to Dashboard</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F1E8] dark:bg-[#1a1a2e]">
      {/* Header */}
      <div className="bg-[#1F315B] text-white py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-[#2E7C83]/20 flex items-center justify-center">
              <Brain className="w-5 h-5 text-[#2E7C83]" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Brain Assessment</h1>
              <p className="text-sm text-[#CDBED6]">Systems & Operations</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Overall Progress</span>
              <span>
                {currentQuestion + 1} of {questions.length}
              </span>
            </div>
            <Progress value={progress} variant="teal" />
          </div>
        </div>
      </div>

      {/* Question Card */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Card className="border-[#2E7C83]/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[#2E7C83]">
                {currentQ.section}
              </span>
              <div className="flex items-center gap-2 text-sm text-[#B9A9A9]">
                <Save className="w-4 h-4" />
                {isSaving ? "Saving..." : lastSaved ? "Saved" : "Not saved"}
              </div>
            </div>
            <div className="mt-2">
              <Progress value={sectionProgress} variant="teal" className="h-1" />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <h2 className="text-xl font-semibold text-[#1F315B] dark:text-[#F6F1E8]">
              {currentQ.text}
            </h2>

            {currentQ.type === "radio" && currentQ.options && (
              <div className="space-y-3">
                {currentQ.options.map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      answers[currentQ.id] === option.value
                        ? "border-[#2E7C83] bg-[#2E7C83]/5"
                        : "border-[#D4AF63]/20 hover:border-[#D4AF63]/40"
                    }`}
                  >
                    <input
                      type="radio"
                      name={currentQ.id}
                      value={option.value}
                      checked={answers[currentQ.id] === option.value}
                      onChange={(e) => handleAnswer(e.target.value)}
                      className="mt-1 w-4 h-4 text-[#2E7C83] focus:ring-[#2E7C83]"
                    />
                    <span className="text-[#1F315B] dark:text-[#F6F1E8]">
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            )}

            {currentQ.type === "text" && (
              <textarea
                value={answers[currentQ.id] || ""}
                onChange={(e) => handleAnswer(e.target.value)}
                placeholder={currentQ.placeholder || "Type your answer here..."}
                rows={5}
                className="w-full p-4 rounded-xl border-2 border-[#D4AF63]/20 focus:border-[#2E7C83] focus:ring-2 focus:ring-[#2E7C83]/20 outline-none resize-none bg-white dark:bg-[#1a1a2e] text-[#1F315B] dark:text-[#F6F1E8]"
              />
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between pt-6 border-t border-[#D4AF63]/20">
              <Button
                variant="ghost"
                onClick={handlePrevious}
                disabled={currentQuestion === 0}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              <Button
                variant="primary"
                onClick={handleNext}
                disabled={!answers[currentQ.id]}
              >
                {currentQuestion === questions.length - 1 ? "Complete" : "Next"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Section Summary */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
          {sections.map((section) => {
            const sectionQs = questions.filter((q) => q.section === section);
            const answeredQs = sectionQs.filter((q) => answers[q.id]).length;
            const isCurrent = section === currentSection;
            return (
              <div
                key={section}
                className={`p-4 rounded-xl border-2 transition-all ${
                  isCurrent
                    ? "border-[#2E7C83] bg-[#2E7C83]/5"
                    : "border-[#D4AF63]/20"
                }`}
              >
                <p className="text-sm font-medium text-[#1F315B] dark:text-[#F6F1E8]">
                  {section}
                </p>
                <p className="text-xs text-[#B9A9A9] mt-1">
                  {answeredQs} of {sectionQs.length} answered
                </p>
                <div className="mt-2">
                  <Progress
                    value={(answeredQs / sectionQs.length) * 100}
                    variant="teal"
                    className="h-1"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
