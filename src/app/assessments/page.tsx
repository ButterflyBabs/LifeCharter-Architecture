import { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Brain, Heart, TrendingUp, ArrowRight, Sparkles, Zap, CheckCircle2, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "Assessments | LifeCharter Architecture",
  description: "Assess your business across Brain (Systems), Soul (Purpose), and Profit (Financial Health) dimensions.",
};

const assessments = [
  {
    id: "brain",
    title: "Brain Assessment",
    subtitle: "Systems & Operations",
    description: "Evaluate how well your business runs without you. Assess documentation, automation, team capacity, and operational efficiency.",
    icon: Brain,
    color: "#2E7C83",
    bgColor: "bg-[#2E7C83]/10",
    questions: 325,
    timeEstimate: "60-75 min",
    sections: ["Business Identity", "Business Model", "Vision & Strategy", "Ideal Clients", "Offers & Products", "Messaging & Brand", "Sales Process", "Operations", "Team & Culture", "Financials", "Legal & Risk", "Growth & Scale"],
    benefits: [
      "Identify system gaps",
      "Reduce owner dependency",
      "Streamline operations",
    ],
  },
  {
    id: "soul",
    title: "Soul Assessment",
    subtitle: "Purpose & Alignment",
    description: "Measure alignment between your business and your deeper mission. Evaluate values, vision clarity, and meaningful work.",
    icon: Heart,
    color: "#5E3B6C",
    bgColor: "bg-[#5E3B6C]/10",
    questions: 264,
    timeEstimate: "50-60 min",
    sections: ["Core Identity", "Origin Story", "Calling & Purpose", "Values & Standards", "Beliefs & Worldview", "Shadow & Resistance", "Sacred Practices", "Body & Energy", "Integration"],
    benefits: [
      "Reconnect with mission",
      "Align offers with values",
      "Find deeper fulfillment",
    ],
  },
  {
    id: "profit",
    title: "Profit Assessment",
    subtitle: "Financial Health",
    description: "Analyze your financial sustainability. Review cash flow, pricing, revenue streams, and profitability across 12 business domains.",
    icon: TrendingUp,
    color: "#D4AF63",
    bgColor: "bg-[#D4AF63]/10",
    questions: 60,
    timeEstimate: "25-30 min",
    sections: ["12 Business Domains"],
    benefits: [
      "Improve cash flow",
      "Optimize pricing",
      "Build financial resilience",
    ],
  },
];

export default function AssessmentsPage() {
  return (
    <div className="min-h-screen bg-[#F6F1E8] dark:bg-[#1a1a2e]">
      {/* Header */}
      <div className="bg-[#1F315B] text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-[#D4AF63]" />
            <span className="text-sm font-medium text-[#CDBED6]">LifeCharter Architecture</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Business Assessments
          </h1>
          <p className="text-lg text-[#CDBED6] max-w-2xl">
            Discover where your business stands across the three dimensions that matter: 
            Brain (Systems), Soul (Purpose), and Profit (Financial Health).
          </p>
        </div>
      </div>

      {/* Assessment Cards */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-6">
          {assessments.map((assessment) => (
            <Card
              key={assessment.id}
              className="border-[#D4AF63]/20 hover:border-[#D4AF63]/50 transition-all duration-300 hover:shadow-lg flex flex-col"
            >
              <CardHeader>
                <div
                  className={`w-12 h-12 rounded-lg ${assessment.bgColor} flex items-center justify-center mb-4`}
                >
                  <assessment.icon
                    className="w-6 h-6"
                    style={{ color: assessment.color }}
                  />
                </div>
                <CardTitle className="text-xl">{assessment.title}</CardTitle>
                <p className="text-sm" style={{ color: assessment.color }}>
                  {assessment.subtitle}
                </p>
              </CardHeader>
              <CardContent className="space-y-4 flex-1 flex flex-col">
                <p className="text-[#1F315B]/70 dark:text-[#F6F1E8]/70 text-sm">
                  {assessment.description}
                </p>

                {/* Sections */}
                <div className="flex flex-wrap gap-2">
                  {assessment.sections.map((section) => (
                    <span
                      key={section}
                      className="text-xs px-2 py-1 rounded-full bg-[#1F315B]/10 text-[#1F315B] dark:text-[#CDBED6]"
                    >
                      {section}
                    </span>
                  ))}
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-xs text-[#B9A9A9]">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    {assessment.questions} questions
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {assessment.timeEstimate}
                  </span>
                </div>

                {/* Benefits */}
                <ul className="space-y-2 flex-1">
                  {assessment.benefits.map((benefit, idx) => (
                    <li
                      key={idx}
                      className="flex items-center gap-2 text-sm text-[#1F315B]/80 dark:text-[#F6F1E8]/80"
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: assessment.color }}
                      />
                      {benefit}
                    </li>
                  ))}
                </ul>

                <Link href={`/assessments/${assessment.id}`} className="mt-auto pt-4">
                  <Button variant="primary" className="w-full">
                    Start Assessment
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Start Pulse Option */}
        <div className="mt-12">
          <Card className="border-[#D4AF63]/30 bg-gradient-to-br from-[#D4AF63]/5 to-transparent">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="w-16 h-16 rounded-full bg-[#D4AF63]/20 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-8 h-8 text-[#D4AF63]" />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-2xl font-bold text-[#1F315B] dark:text-[#F6F1E8] mb-2">
                    Quick Start Pulse
                  </h2>
                  <p className="text-[#1F315B]/70 dark:text-[#F6F1E8]/70 mb-4">
                    Short on time? Take our condensed 15-20 question assessment that
                    samples key areas from all three dimensions. Get a snapshot of your
                    business health in just 5 minutes.
                  </p>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-[#B9A9A9]">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      15-20 questions
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      ~5 minutes
                    </span>
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-4 h-4" />
                      Instant insights
                    </span>
                  </div>
                </div>
                <Link href="/assessments/pulse">
                  <Button variant="primary" size="lg">
                    Start Quick Pulse
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Complete Assessment CTA */}
        <div className="mt-8">
          <Card className="border-[#2E7C83]/30">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="w-16 h-16 rounded-full bg-[#2E7C83]/20 flex items-center justify-center flex-shrink-0">
                  <Brain className="w-8 h-8 text-[#2E7C83]" />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-2xl font-bold text-[#1F315B] dark:text-[#F6F1E8] mb-2">
                    Complete the Full Assessment
                  </h2>
                  <p className="text-[#1F315B]/70 dark:text-[#F6F1E8]/70">
                    Take all three assessments to get your complete Business Health Score 
                    and receive a personalized growth roadmap with detailed recommendations.
                  </p>
                </div>
                <div className="flex flex-col gap-3">
                  <Link href="/assessments/brain">
                    <Button variant="primary" size="lg">
                      Start with Brain
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                  <Link href="/dashboard">
                    <Button variant="secondary" size="lg">
                      Back to Dashboard
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info Section */}
        <div className="mt-12 grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-[#1F315B] dark:text-[#F6F1E8] mb-3">
              How It Works
            </h3>
            <ul className="space-y-3 text-sm text-[#1F315B]/70 dark:text-[#F6F1E8]/70">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-[#2E7C83] text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                  1
                </span>
                Answer questions honestly about your current business state
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-[#2E7C83] text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                  2
                </span>
                Receive your scores and detailed analysis
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-[#2E7C83] text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                  3
                </span>
                Get personalized recommendations for improvement
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-[#2E7C83] text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                  4
                </span>
                Track progress over time with re-assessments
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[#1F315B] dark:text-[#F6F1E8] mb-3">
              Score Ranges
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="font-medium text-[#1F315B] dark:text-[#F6F1E8]">0-30: Survival Mode</span>
                <span className="text-[#B9A9A9]">— Urgent attention needed</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="font-medium text-[#1F315B] dark:text-[#F6F1E8]">31-60: Building</span>
                <span className="text-[#B9A9A9]">— Foundation in progress</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="font-medium text-[#1F315B] dark:text-[#F6F1E8]">61-80: Growth</span>
                <span className="text-[#B9A9A9]">— Scaling and optimizing</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="font-medium text-[#1F315B] dark:text-[#F6F1E8]">81-100: Thriving</span>
                <span className="text-[#B9A9A9]">— Industry leader potential</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
