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
  // ============================================
  // SECTION 1: BUSINESS IDENTITY (37 questions)
  // ============================================

  // 1.1 Core Business Profile (21 questions)
  {
    id: "bi_1_1",
    text: "What is the legal name of the business?",
    type: "text",
    section: "1. Business Identity",
    placeholder: "The official registered business name...",
  },
  {
    id: "bi_1_2",
    text: "What is the public-facing brand name?",
    type: "text",
    section: "1. Business Identity",
    placeholder: "The name customers know you by...",
  },
  {
    id: "bi_1_3",
    text: "Are there any DBAs, sub-brands, programs, divisions, or product names?",
    type: "text",
    section: "1. Business Identity",
    placeholder: "List any alternate names, sub-brands, or product lines...",
  },
  {
    id: "bi_1_4",
    text: "What is the website URL?",
    type: "text",
    section: "1. Business Identity",
    placeholder: "Primary website address...",
  },
  {
    id: "bi_1_5",
    text: "What are all current public URLs connected to the business?",
    type: "text",
    section: "1. Business Identity",
    placeholder: "Landing pages, funnels, social profiles, etc....",
  },
  {
    id: "bi_1_6",
    text: "What social media channels are currently active?",
    type: "text",
    section: "1. Business Identity",
    placeholder: "List platforms and handles (Instagram, LinkedIn, etc.)...",
  },
  {
    id: "bi_1_7",
    text: "What email domains are used?",
    type: "text",
    section: "1. Business Identity",
    placeholder: "e.g., @company.com, @support.company.com...",
  },
  {
    id: "bi_1_8",
    text: "What physical location, region, or service area matters to the business?",
    type: "text",
    section: "1. Business Identity",
    placeholder: "Headquarters, service areas, or 'fully remote'...",
  },
  {
    id: "bi_1_9",
    text: "Is the business local, national, international, online, in-person, hybrid, or location-specific?",
    type: "radio",
    section: "1. Business Identity",
    options: [
      { value: "local", label: "Local (specific city/region)" },
      { value: "national", label: "National (within one country)" },
      { value: "international", label: "International (global reach)" },
      { value: "online", label: "Online-only (no physical presence)" },
      { value: "in_person", label: "In-person only (physical location)" },
      { value: "hybrid", label: "Hybrid (online + in-person)" },
      { value: "location_specific", label: "Location-specific (multiple defined areas)" },
    ],
  },
  {
    id: "bi_1_10",
    text: "What year was the business founded?",
    type: "number",
    section: "1. Business Identity",
    placeholder: "YYYY",
  },
  {
    id: "bi_1_11",
    text: "Who founded the business?",
    type: "text",
    section: "1. Business Identity",
    placeholder: "Name(s) of founder(s)...",
  },
  {
    id: "bi_1_12",
    text: "Who currently owns the business?",
    type: "text",
    section: "1. Business Identity",
    placeholder: "Current ownership structure...",
  },
  {
    id: "bi_1_13",
    text: "What type of entity is it?",
    type: "radio",
    section: "1. Business Identity",
    options: [
      { value: "llc", label: "LLC (Limited Liability Company)" },
      { value: "s_corp", label: "S-Corp" },
      { value: "c_corp", label: "C-Corp" },
      { value: "nonprofit", label: "Nonprofit" },
      { value: "sole_proprietorship", label: "Sole Proprietorship" },
      { value: "partnership", label: "Partnership" },
      { value: "corporation", label: "Corporation (other)" },
      { value: "other", label: "Other / Not yet formed" },
    ],
  },
  {
    id: "bi_1_14",
    text: "What industry or category does the business operate in?",
    type: "text",
    section: "1. Business Identity",
    placeholder: "e.g., SaaS, coaching, e-commerce, healthcare...",
  },
  {
    id: "bi_1_15",
    text: "What category does the business want to be known for?",
    type: "text",
    section: "1. Business Identity",
    placeholder: "The category you want to own in people's minds...",
  },
  {
    id: "bi_1_16",
    text: "What category does the business not want to be boxed into?",
    type: "text",
    section: "1. Business Identity",
    placeholder: "Categories you want to avoid being labeled as...",
  },
  {
    id: "bi_1_17",
    text: "What is the simplest explanation of what the business does?",
    type: "text",
    section: "1. Business Identity",
    placeholder: "One sentence a child could understand...",
  },
  {
    id: "bi_1_18",
    text: "What is the more nuanced explanation of what the business does?",
    type: "text",
    section: "1. Business Identity",
    placeholder: "The deeper, more detailed explanation...",
  },
  {
    id: "bi_1_19",
    text: "What is the business's current stage?",
    type: "radio",
    section: "1. Business Identity",
    options: [
      { value: "startup", label: "Startup (pre-revenue or early revenue)" },
      { value: "validation", label: "Validation (testing product-market fit)" },
      { value: "growth", label: "Growth (scaling what's working)" },
      { value: "scaling", label: "Scaling (expanding rapidly)" },
      { value: "stabilization", label: "Stabilization (optimizing operations)" },
      { value: "reinvention", label: "Reinvention (pivoting or transforming)" },
      { value: "turnaround", label: "Turnaround (recovering from challenges)" },
      { value: "exit_preparation", label: "Exit Preparation (preparing for sale/transition)" },
    ],
  },
  {
    id: "bi_1_20",
    text: "What does the business need most right now?",
    type: "text",
    section: "1. Business Identity",
    placeholder: "The single most important need at this moment...",
  },

  // 1.2 Business Snapshot (16 questions)
  {
    id: "bi_2_1",
    text: "What is the current annual revenue?",
    type: "text",
    section: "1. Business Identity",
    placeholder: "Approximate annual revenue or 'pre-revenue'...",
  },
  {
    id: "bi_2_2",
    text: "What was last year's annual revenue?",
    type: "text",
    section: "1. Business Identity",
    placeholder: "Previous year's revenue for comparison...",
  },
  {
    id: "bi_2_3",
    text: "What is the current monthly revenue average?",
    type: "text",
    section: "1. Business Identity",
    placeholder: "Average monthly revenue over last 3-6 months...",
  },
  {
    id: "bi_2_4",
    text: "What is the current monthly profit average?",
    type: "text",
    section: "1. Business Identity",
    placeholder: "Average monthly profit (revenue minus expenses)...",
  },
  {
    id: "bi_2_5",
    text: "What are the primary revenue streams?",
    type: "text",
    section: "1. Business Identity",
    placeholder: "List main sources of revenue...",
  },
  {
    id: "bi_2_6",
    text: "What percentage of revenue comes from each stream?",
    type: "text",
    section: "1. Business Identity",
    placeholder: "Approximate breakdown by percentage...",
  },
  {
    id: "bi_2_7",
    text: "What is the current team size?",
    type: "text",
    section: "1. Business Identity",
    placeholder: "Total number of team members (including contractors)...",
  },
  {
    id: "bi_2_8",
    text: "What are the main offers or services currently sold?",
    type: "text",
    section: "1. Business Identity",
    placeholder: "List current products/services with brief descriptions...",
  },
  {
    id: "bi_2_9",
    text: "What is the current flagship offer?",
    type: "text",
    section: "1. Business Identity",
    placeholder: "Your main/most important offer...",
  },
  {
    id: "bi_2_10",
    text: "What is the highest-margin offer?",
    type: "text",
    section: "1. Business Identity",
    placeholder: "The offer with the best profit margin...",
  },
  {
    id: "bi_2_11",
    text: "What is the easiest offer to sell?",
    type: "text",
    section: "1. Business Identity",
    placeholder: "The offer that requires least effort to convert...",
  },
  {
    id: "bi_2_12",
    text: "What is the hardest offer to deliver?",
    type: "text",
    section: "1. Business Identity",
    placeholder: "The offer that takes most time/resources to fulfill...",
  },
  {
    id: "bi_2_13",
    text: "What is currently working well?",
    type: "text",
    section: "1. Business Identity",
    placeholder: "Areas of the business that are performing strongly...",
  },
  {
    id: "bi_2_14",
    text: "What is currently not working?",
    type: "text",
    section: "1. Business Identity",
    placeholder: "Areas that are struggling or broken...",
  },
  {
    id: "bi_2_15",
    text: "What is the largest bottleneck in the business?",
    type: "text",
    section: "1. Business Identity",
    placeholder: "The #1 constraint limiting growth or progress...",
  },
  {
    id: "bi_2_16",
    text: "What is the biggest untapped opportunity?",
    type: "text",
    section: "1. Business Identity",
    placeholder: "The opportunity you're not yet capitalizing on...",
  },
  {
    id: "bi_2_17",
    text: "What is the current growth goal?",
    type: "text",
    section: "1. Business Identity",
    placeholder: "Revenue, customer, or expansion targets...",
  },
  {
    id: "bi_2_18",
    text: "What is the current operational goal?",
    type: "text",
    section: "1. Business Identity",
    placeholder: "Systems, processes, or efficiency targets...",
  },
  {
    id: "bi_2_19",
    text: "What is the current client/customer experience goal?",
    type: "text",
    section: "1. Business Identity",
    placeholder: "Experience, satisfaction, or retention targets...",
  },
  {
    id: "bi_2_20",
    text: "What would make the next 90 days successful?",
    type: "text",
    section: "1. Business Identity",
    placeholder: "Specific outcomes that would define success this quarter...",
  },

  // ============================================
  // SECTION 2: BUSINESS MODEL (28 questions)
  // ============================================

  // 2.1 Business Model Overview (20 questions)
  {
    id: "bm_1_1",
    text: "What type of business model do you currently operate?",
    type: "radio",
    section: "2. Business Model",
    options: [
      { value: "coaching", label: "Coaching" },
      { value: "consulting", label: "Consulting" },
      { value: "agency", label: "Agency" },
      { value: "course", label: "Course / Education" },
      { value: "membership", label: "Membership" },
      { value: "saas", label: "SaaS" },
      { value: "service_provider", label: "Service Provider" },
      { value: "nonprofit", label: "Nonprofit" },
      { value: "community", label: "Community" },
      { value: "media", label: "Media" },
      { value: "events", label: "Events" },
      { value: "ecommerce", label: "E-commerce" },
      { value: "professional_services", label: "Professional Services" },
      { value: "hybrid", label: "Hybrid" },
    ],
  },
  {
    id: "bm_1_2",
    text: "What do you sell?",
    type: "text",
    section: "2. Business Model",
    placeholder: "Describe your core products, services, or offers...",
  },
  {
    id: "bm_1_3",
    text: "Who pays you?",
    type: "text",
    section: "2. Business Model",
    placeholder: "Who is the actual buyer/decision-maker with budget authority...",
  },
  {
    id: "bm_1_4",
    text: "Who receives the value?",
    type: "text",
    section: "2. Business Model",
    placeholder: "Who ultimately benefits from your product/service...",
  },
  {
    id: "bm_1_5",
    text: "Are the buyer and end user the same person?",
    type: "radio",
    section: "2. Business Model",
    options: [
      { value: "yes", label: "Yes - buyer and user are the same" },
      { value: "no", label: "No - buyer and user are different" },
      { value: "sometimes", label: "Sometimes - depends on the situation" },
    ],
  },
  {
    id: "bm_1_6",
    text: "Is the business B2B, B2C, B2B2C, nonprofit, donor-supported, grant-funded, sponsorship-based, or hybrid?",
    type: "radio",
    section: "2. Business Model",
    options: [
      { value: "b2b", label: "B2B (Business to Business)" },
      { value: "b2c", label: "B2C (Business to Consumer)" },
      { value: "b2b2c", label: "B2B2C (Business to Business to Consumer)" },
      { value: "nonprofit", label: "Nonprofit" },
      { value: "donor_supported", label: "Donor-supported" },
      { value: "grant_funded", label: "Grant-funded" },
      { value: "sponsorship_based", label: "Sponsorship-based" },
      { value: "hybrid", label: "Hybrid model" },
    ],
  },
  {
    id: "bm_1_7",
    text: "What is the average transaction value?",
    type: "text",
    section: "2. Business Model",
    placeholder: "Average dollar amount per transaction...",
  },
  {
    id: "bm_1_8",
    text: "What is the average lifetime customer value?",
    type: "text",
    section: "2. Business Model",
    placeholder: "Total revenue expected from a customer over their entire relationship...",
  },
  {
    id: "bm_1_9",
    text: "What is the average sales cycle length?",
    type: "text",
    section: "2. Business Model",
    placeholder: "Time from first contact to purchase (days/weeks/months)...",
  },
  {
    id: "bm_1_10",
    text: "What is the average delivery cycle length?",
    type: "text",
    section: "2. Business Model",
    placeholder: "Time from purchase to delivery/fulfillment completion...",
  },
  {
    id: "bm_1_11",
    text: "What is the average client retention period?",
    type: "text",
    section: "2. Business Model",
    placeholder: "How long customers typically stay with you...",
  },
  {
    id: "bm_1_12",
    text: "What is the current customer acquisition model?",
    type: "text",
    section: "2. Business Model",
    placeholder: "How you currently attract and convert new customers...",
  },
  {
    id: "bm_1_13",
    text: "What is the current fulfillment model?",
    type: "text",
    section: "2. Business Model",
    placeholder: "How you deliver your product/service to customers...",
  },
  {
    id: "bm_1_14",
    text: "What is the current renewal or repeat-purchase model?",
    type: "text",
    section: "2. Business Model",
    placeholder: "How you encourage ongoing purchases or renewals...",
  },
  {
    id: "bm_1_15",
    text: "What part of the business model is strongest?",
    type: "text",
    section: "2. Business Model",
    placeholder: "The most robust, reliable part of your model...",
  },
  {
    id: "bm_1_16",
    text: "What part of the business model is fragile?",
    type: "text",
    section: "2. Business Model",
    placeholder: "The weakest or most vulnerable part of your model...",
  },
  {
    id: "bm_1_17",
    text: "What part of the model is too dependent on the founder?",
    type: "text",
    section: "2. Business Model",
    placeholder: "Areas that require founder involvement to function...",
  },
  {
    id: "bm_1_18",
    text: "What part of the model needs simplification?",
    type: "text",
    section: "2. Business Model",
    placeholder: "Overly complex areas that could be streamlined...",
  },
  {
    id: "bm_1_19",
    text: "What part of the model needs better systems?",
    type: "text",
    section: "2. Business Model",
    placeholder: "Areas lacking clear processes or automation...",
  },
  {
    id: "bm_1_20",
    text: "What part of the model is ready to scale?",
    type: "text",
    section: "2. Business Model",
    placeholder: "Areas that could handle increased volume...",
  },

  // 2.2 Revenue Streams (8 questions - first stream example)
  {
    id: "bm_2_1",
    text: "What is the name of the revenue stream?",
    type: "text",
    section: "2. Business Model",
    placeholder: "e.g., Coaching Services, Digital Products, Membership Fees...",
  },
  {
    id: "bm_2_2",
    text: "What offer, product, service, or program generates this revenue?",
    type: "text",
    section: "2. Business Model",
    placeholder: "The specific offer tied to this revenue stream...",
  },
  {
    id: "bm_2_3",
    text: "Who buys it?",
    type: "text",
    section: "2. Business Model",
    placeholder: "The target customer for this specific offer...",
  },
  {
    id: "bm_2_4",
    text: "What problem does it solve?",
    type: "text",
    section: "2. Business Model",
    placeholder: "The specific pain point this offer addresses...",
  },
  {
    id: "bm_2_5",
    text: "What transformation or outcome does it create?",
    type: "text",
    section: "2. Business Model",
    placeholder: "The result customers achieve from this offer...",
  },
  {
    id: "bm_2_6",
    text: "What is the price?",
    type: "text",
    section: "2. Business Model",
    placeholder: "The price point for this offer...",
  },
  {
    id: "bm_2_7",
    text: "Is the price fixed, custom, tiered, recurring, usage-based, donation-based, or project-based?",
    type: "radio",
    section: "2. Business Model",
    options: [
      { value: "fixed", label: "Fixed (one set price)" },
      { value: "custom", label: "Custom (negotiated per client)" },
      { value: "tiered", label: "Tiered (multiple pricing levels)" },
      { value: "recurring", label: "Recurring (subscription/membership)" },
      { value: "usage_based", label: "Usage-based (pay for what you use)" },
      { value: "donation_based", label: "Donation-based (pay what you want)" },
      { value: "project_based", label: "Project-based (scoped to deliverables)" },
    ],
  },
  {
    id: "bm_2_8",
    text: "What is the gross margin?",
    type: "text",
    section: "2. Business Model",
    placeholder: "Approximate profit margin percentage for this stream...",
  },
];

const sections = [
  "1. Business Identity",
  "2. Business Model",
  "3. Vision, Strategy, and Priorities",
  "4. Ideal Clients and Market",
  "5. Offers, Products, and Services",
  "6. Messaging, Positioning, and Brand Intelligence",
  "7. Sales System",
  "8. Marketing System",
  "9. Customer Journey and Client Experience",
  "10. Operations and Internal Systems",
  "11. Team and Roles",
  "12. Tech Stack and Access Map",
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
