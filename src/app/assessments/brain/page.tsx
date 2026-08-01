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

  // ============================================
  // SECTION 3: VISION, STRATEGY, AND PRIORITIES (47 questions)
  // ============================================

  // 3.1 Business Vision (20 questions)
  {
    id: "vs_1_1",
    text: "What is the 3-year vision for the business?",
    type: "text",
    section: "3. Vision, Strategy, and Priorities",
    placeholder: "Where do you want the business to be in 3 years...",
  },
  {
    id: "vs_1_2",
    text: "What is the 1-year vision?",
    type: "text",
    section: "3. Vision, Strategy, and Priorities",
    placeholder: "What does success look like one year from now...",
  },
  {
    id: "vs_1_3",
    text: "What is the 90-day vision?",
    type: "text",
    section: "3. Vision, Strategy, and Priorities",
    placeholder: "What are the key outcomes for the next quarter...",
  },
  {
    id: "vs_1_4",
    text: "What is the long-term purpose of the business?",
    type: "text",
    section: "3. Vision, Strategy, and Priorities",
    placeholder: "The deeper why that drives everything you do...",
  },
  {
    id: "vs_1_5",
    text: "What does the business ultimately want to become?",
    type: "text",
    section: "3. Vision, Strategy, and Priorities",
    placeholder: "The ultimate expression or evolution of the business...",
  },
  {
    id: "vs_1_6",
    text: "What does the business not want to become?",
    type: "text",
    section: "3. Vision, Strategy, and Priorities",
    placeholder: "What you want to avoid or resist becoming...",
  },
  {
    id: "vs_1_7",
    text: "What level of revenue is desired?",
    type: "text",
    section: "3. Vision, Strategy, and Priorities",
    placeholder: "Target revenue goals (3-year, 1-year, 90-day)...",
  },
  {
    id: "vs_1_8",
    text: "What level of profit is desired?",
    type: "text",
    section: "3. Vision, Strategy, and Priorities",
    placeholder: "Target profit margins and amounts...",
  },
  {
    id: "vs_1_9",
    text: "What level of team size is desired?",
    type: "text",
    section: "3. Vision, Strategy, and Priorities",
    placeholder: "Ideal team size at each stage...",
  },
  {
    id: "vs_1_10",
    text: "What level of founder involvement is desired?",
    type: "text",
    section: "3. Vision, Strategy, and Priorities",
    placeholder: "How involved should the founder be in day-to-day operations...",
  },
  {
    id: "vs_1_11",
    text: "What role should the founder eventually play?",
    type: "text",
    section: "3. Vision, Strategy, and Priorities",
    placeholder: "The founder's ideal role as the business matures...",
  },
  {
    id: "vs_1_12",
    text: "What role should the team eventually play?",
    type: "text",
    section: "3. Vision, Strategy, and Priorities",
    placeholder: "How the team should function and contribute...",
  },
  {
    id: "vs_1_13",
    text: "What does scale mean for this business?",
    type: "text",
    section: "3. Vision, Strategy, and Priorities",
    placeholder: "Your definition of scaling successfully...",
  },
  {
    id: "vs_1_14",
    text: "What does sustainability mean for this business?",
    type: "text",
    section: "3. Vision, Strategy, and Priorities",
    placeholder: "How you define and achieve long-term sustainability...",
  },
  {
    id: "vs_1_15",
    text: "What does success look like beyond revenue?",
    type: "text",
    section: "3. Vision, Strategy, and Priorities",
    placeholder: "Non-financial measures of success and impact...",
  },
  {
    id: "vs_1_16",
    text: "What does the business want to be known for?",
    type: "text",
    section: "3. Vision, Strategy, and Priorities",
    placeholder: "The reputation and legacy you want to build...",
  },
  {
    id: "vs_1_17",
    text: "What should the business be the obvious choice for?",
    type: "text",
    section: "3. Vision, Strategy, and Priorities",
    placeholder: "The specific problem or need you're the clear solution for...",
  },
  {
    id: "vs_1_18",
    text: "What should the business stop doing as it grows?",
    type: "text",
    section: "3. Vision, Strategy, and Priorities",
    placeholder: "Activities, offers, or approaches to phase out...",
  },
  {
    id: "vs_1_19",
    text: "What should the business protect as it grows?",
    type: "text",
    section: "3. Vision, Strategy, and Priorities",
    placeholder: "Values, qualities, or practices to preserve at all costs...",
  },
  {
    id: "vs_1_20",
    text: "What future is the business building toward?",
    type: "text",
    section: "3. Vision, Strategy, and Priorities",
    placeholder: "The ultimate future state you're working to create...",
  },

  // 3.2 Current Strategic Priorities (16 questions)
  {
    id: "vs_2_1",
    text: "What are the top 3 business priorities right now?",
    type: "text",
    section: "3. Vision, Strategy, and Priorities",
    placeholder: "List the three most important priorities in order...",
  },
  {
    id: "vs_2_2",
    text: "Why are these the priorities?",
    type: "text",
    section: "3. Vision, Strategy, and Priorities",
    placeholder: "The reasoning and context behind these priorities...",
  },
  {
    id: "vs_2_3",
    text: "Who owns each priority?",
    type: "text",
    section: "3. Vision, Strategy, and Priorities",
    placeholder: "The person or role responsible for each priority...",
  },
  {
    id: "vs_2_4",
    text: "What deadlines or target dates exist?",
    type: "text",
    section: "3. Vision, Strategy, and Priorities",
    placeholder: "Key dates and milestones for each priority...",
  },
  {
    id: "vs_2_5",
    text: "What projects support these priorities?",
    type: "text",
    section: "3. Vision, Strategy, and Priorities",
    placeholder: "Specific projects aligned with each priority...",
  },
  {
    id: "vs_2_6",
    text: "What metrics prove progress?",
    type: "text",
    section: "3. Vision, Strategy, and Priorities",
    placeholder: "How you'll measure success for each priority...",
  },
  {
    id: "vs_2_7",
    text: "What decisions are needed?",
    type: "text",
    section: "3. Vision, Strategy, and Priorities",
    placeholder: "Key decisions required to move forward...",
  },
  {
    id: "vs_2_8",
    text: "What resources are needed?",
    type: "text",
    section: "3. Vision, Strategy, and Priorities",
    placeholder: "People, budget, tools, or time required...",
  },
  {
    id: "vs_2_9",
    text: "What dependencies exist?",
    type: "text",
    section: "3. Vision, Strategy, and Priorities",
    placeholder: "What needs to happen before other things can proceed...",
  },
  {
    id: "vs_2_10",
    text: "What risks could slow progress?",
    type: "text",
    section: "3. Vision, Strategy, and Priorities",
    placeholder: "Potential obstacles or challenges to watch for...",
  },
  {
    id: "vs_2_11",
    text: "What opportunities could accelerate progress?",
    type: "text",
    section: "3. Vision, Strategy, and Priorities",
    placeholder: "Potential catalysts or accelerators to leverage...",
  },
  {
    id: "vs_2_12",
    text: "What work should be paused to protect focus?",
    type: "text",
    section: "3. Vision, Strategy, and Priorities",
    placeholder: "Lower-priority work to temporarily set aside...",
  },
  {
    id: "vs_2_13",
    text: "What work is urgent but not important?",
    type: "text",
    section: "3. Vision, Strategy, and Priorities",
    placeholder: "Tasks that feel pressing but don't drive real value...",
  },
  {
    id: "vs_2_14",
    text: "What work is important but neglected?",
    type: "text",
    section: "3. Vision, Strategy, and Priorities",
    placeholder: "High-value work that's being pushed aside...",
  },
  {
    id: "vs_2_15",
    text: "What does the team need to understand about the current strategy?",
    type: "text",
    section: "3. Vision, Strategy, and Priorities",
    placeholder: "Key strategic context the team should know...",
  },
  {
    id: "vs_2_16",
    text: "What should AI prioritize when helping with strategy?",
    type: "text",
    section: "3. Vision, Strategy, and Priorities",
    placeholder: "How AI should focus its strategic support...",
  },

  // 3.3 Strategic Decision Rules (11 questions)
  {
    id: "vs_3_1",
    text: "How does the business decide what to say yes to?",
    type: "text",
    section: "3. Vision, Strategy, and Priorities",
    placeholder: "Your criteria for accepting opportunities...",
  },
  {
    id: "vs_3_2",
    text: "How does the business decide what to say no to?",
    type: "text",
    section: "3. Vision, Strategy, and Priorities",
    placeholder: "Your criteria for declining opportunities...",
  },
  {
    id: "vs_3_3",
    text: "What makes an opportunity aligned?",
    type: "text",
    section: "3. Vision, Strategy, and Priorities",
    placeholder: "Characteristics of opportunities that fit the business...",
  },
  {
    id: "vs_3_4",
    text: "What makes an opportunity distracting?",
    type: "text",
    section: "3. Vision, Strategy, and Priorities",
    placeholder: "Red flags that indicate an opportunity is a distraction...",
  },
  {
    id: "vs_3_5",
    text: "What types of clients, partnerships, or projects are automatic yeses?",
    type: "text",
    section: "3. Vision, Strategy, and Priorities",
    placeholder: "Characteristics that make something an immediate yes...",
  },
  {
    id: "vs_3_6",
    text: "What types are automatic noes?",
    type: "text",
    section: "3. Vision, Strategy, and Priorities",
    placeholder: "Deal-breakers that make something an immediate no...",
  },
  {
    id: "vs_3_7",
    text: "What criteria should be used before launching something new?",
    type: "text",
    section: "3. Vision, Strategy, and Priorities",
    placeholder: "Checklist for evaluating new initiatives...",
  },
  {
    id: "vs_3_8",
    text: "What criteria should be used before retiring an offer?",
    type: "text",
    section: "3. Vision, Strategy, and Priorities",
    placeholder: "When and how to sunset products or services...",
  },
  {
    id: "vs_3_9",
    text: "What criteria should be used before hiring?",
    type: "text",
    section: "3. Vision, Strategy, and Priorities",
    placeholder: "When to add team members and what to look for...",
  },
  {
    id: "vs_3_10",
    text: "What criteria should be used before investing money?",
    type: "text",
    section: "3. Vision, Strategy, and Priorities",
    placeholder: "Framework for evaluating financial investments...",
  },
  {
    id: "vs_3_11",
    text: "What criteria should be used before entering a partnership?",
    type: "text",
    section: "3. Vision, Strategy, and Priorities",
    placeholder: "How to evaluate potential partnerships...",
  },

  // ============================================
  // SECTION 4: IDEAL CLIENTS AND MARKET (37 questions)
  // ============================================

  // 4.1 Ideal Client Profile (21 questions)
  {
    id: "ic_1_1",
    text: "Who is the ideal client or customer?",
    type: "text",
    section: "4. Ideal Clients and Market",
    placeholder: "Describe your perfect client in detail...",
  },
  {
    id: "ic_1_2",
    text: "What industry are they in?",
    type: "text",
    section: "4. Ideal Clients and Market",
    placeholder: "The industry or industries your ideal clients work in...",
  },
  {
    id: "ic_1_3",
    text: "What role or title do they usually hold?",
    type: "text",
    section: "4. Ideal Clients and Market",
    placeholder: "Job titles, roles, or positions they typically have...",
  },
  {
    id: "ic_1_4",
    text: "What size company, household, organization, or community do they represent?",
    type: "text",
    section: "4. Ideal Clients and Market",
    placeholder: "Size of their organization or sphere of influence...",
  },
  {
    id: "ic_1_5",
    text: "What stage of life or business are they in?",
    type: "text",
    section: "4. Ideal Clients and Market",
    placeholder: "Life stage, career stage, or business maturity level...",
  },
  {
    id: "ic_1_6",
    text: "What problem are they actively trying to solve?",
    type: "text",
    section: "4. Ideal Clients and Market",
    placeholder: "The pain point they are consciously aware of and seeking help for...",
  },
  {
    id: "ic_1_7",
    text: "What problem do they not yet realize they have?",
    type: "text",
    section: "4. Ideal Clients and Market",
    placeholder: "The deeper issue they haven't recognized yet...",
  },
  {
    id: "ic_1_8",
    text: "What do they want most?",
    type: "text",
    section: "4. Ideal Clients and Market",
    placeholder: "Their deepest desires and aspirations...",
  },
  {
    id: "ic_1_9",
    text: "What are they afraid of?",
    type: "text",
    section: "4. Ideal Clients and Market",
    placeholder: "Their fears, anxieties, and worries...",
  },
  {
    id: "ic_1_10",
    text: "What are they frustrated by?",
    type: "text",
    section: "4. Ideal Clients and Market",
    placeholder: "What frustrates or annoys them in their current situation...",
  },
  {
    id: "ic_1_11",
    text: "What have they already tried?",
    type: "text",
    section: "4. Ideal Clients and Market",
    placeholder: "Previous solutions, approaches, or attempts they've made...",
  },
  {
    id: "ic_1_12",
    text: "Why has it not worked?",
    type: "text",
    section: "4. Ideal Clients and Market",
    placeholder: "Why previous attempts failed to solve their problem...",
  },
  {
    id: "ic_1_13",
    text: "What are they ready for?",
    type: "text",
    section: "4. Ideal Clients and Market",
    placeholder: "What they are prepared to do, invest, or change...",
  },
  {
    id: "ic_1_14",
    text: "What are they not ready for?",
    type: "text",
    section: "4. Ideal Clients and Market",
    placeholder: "What they are not yet prepared to commit to or accept...",
  },
  {
    id: "ic_1_15",
    text: "What do they need to believe before buying?",
    type: "text",
    section: "4. Ideal Clients and Market",
    placeholder: "Key beliefs or assumptions they must hold to make a purchase...",
  },
  {
    id: "ic_1_16",
    text: "What do they need to trust before buying?",
    type: "text",
    section: "4. Ideal Clients and Market",
    placeholder: "Trust factors, credibility markers, or proof they need...",
  },
  {
    id: "ic_1_17",
    text: "What objections do they typically have?",
    type: "text",
    section: "4. Ideal Clients and Market",
    placeholder: "Common concerns, hesitations, or objections they raise...",
  },
  {
    id: "ic_1_18",
    text: "What language do they use to describe their problem?",
    type: "text",
    section: "4. Ideal Clients and Market",
    placeholder: "The exact words and phrases they use to talk about their challenges...",
  },
  {
    id: "ic_1_19",
    text: "What language does the business use to describe the deeper problem?",
    type: "text",
    section: "4. Ideal Clients and Market",
    placeholder: "How you frame or articulate the problem at a deeper level...",
  },
  {
    id: "ic_1_20",
    text: "What makes someone an excellent fit?",
    type: "text",
    section: "4. Ideal Clients and Market",
    placeholder: "Characteristics, qualities, or circumstances that indicate a perfect match...",
  },
  {
    id: "ic_1_21",
    text: "What makes someone an excellent fit? (continued)",
    type: "text",
    section: "4. Ideal Clients and Market",
    placeholder: "Additional factors that make someone an ideal client...",
  },

  // 4.2 Poor-Fit Clients (16 questions)
  {
    id: "ic_2_1",
    text: "Who is not a good fit?",
    type: "text",
    section: "4. Ideal Clients and Market",
    placeholder: "Types of people or organizations that are not suited for your offer...",
  },
  {
    id: "ic_2_2",
    text: "What behaviors indicate poor fit?",
    type: "text",
    section: "4. Ideal Clients and Market",
    placeholder: "Actions or patterns that signal someone is not a good match...",
  },
  {
    id: "ic_2_3",
    text: "What expectations indicate poor fit?",
    type: "text",
    section: "4. Ideal Clients and Market",
    placeholder: "Unrealistic or misaligned expectations that suggest poor fit...",
  },
  {
    id: "ic_2_4",
    text: "What budget issues indicate poor fit?",
    type: "text",
    section: "4. Ideal Clients and Market",
    placeholder: "Financial constraints or mismatches that make someone a poor fit...",
  },
  {
    id: "ic_2_5",
    text: "What mindset issues indicate poor fit?",
    type: "text",
    section: "4. Ideal Clients and Market",
    placeholder: "Attitudes, beliefs, or mental frameworks that don't align...",
  },
  {
    id: "ic_2_6",
    text: "What communication patterns indicate poor fit?",
    type: "text",
    section: "4. Ideal Clients and Market",
    placeholder: "Communication styles or habits that create friction...",
  },
  {
    id: "ic_2_7",
    text: "What values mismatch indicates poor fit?",
    type: "text",
    section: "4. Ideal Clients and Market",
    placeholder: "Core values that don't align with your business...",
  },
  {
    id: "ic_2_8",
    text: "What urgency patterns indicate poor fit?",
    type: "text",
    section: "4. Ideal Clients and Market",
    placeholder: "Timing or urgency issues that suggest misalignment...",
  },
  {
    id: "ic_2_9",
    text: "What past client problems should be avoided?",
    type: "text",
    section: "4. Ideal Clients and Market",
    placeholder: "Problems experienced with previous clients to watch for...",
  },
  {
    id: "ic_2_10",
    text: "What red flags should sales, onboarding, and AI recognize?",
    type: "text",
    section: "4. Ideal Clients and Market",
    placeholder: "Warning signs that should trigger caution or decline...",
  },
  {
    id: "ic_2_11",
    text: "What should be said when someone is not a fit?",
    type: "text",
    section: "4. Ideal Clients and Market",
    placeholder: "How to gracefully decline or refer away poor-fit prospects...",
  },
  {
    id: "ic_2_12",
    text: "Are there referral options for poor-fit leads?",
    type: "text",
    section: "4. Ideal Clients and Market",
    placeholder: "Alternative resources or providers you can refer them to...",
  },
  {
    id: "ic_2_13",
    text: "Are there lower-tier offers for not-yet-ready leads?",
    type: "text",
    section: "4. Ideal Clients and Market",
    placeholder: "Entry-level offers or resources for leads who aren't ready for main offer...",
  },
  {
    id: "ic_2_14",
    text: "Are there situations where the business should decline payment?",
    type: "text",
    section: "4. Ideal Clients and Market",
    placeholder: "Circumstances where you should refuse to take someone's money...",
  },
  {
    id: "ic_2_15",
    text: "What boundaries protect the business from poor-fit clients?",
    type: "text",
    section: "4. Ideal Clients and Market",
    placeholder: "Policies, practices, or boundaries that safeguard the business...",
  },

  // ============================================
  // SECTION 5: OFFERS, PRODUCTS, AND SERVICES (50 questions)
  // ============================================

  // 5.1 Offer Inventory (25 questions - first offer as template)
  {
    id: "op_1_1",
    text: "What is the offer name?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "The specific name of this offer, product, or service...",
  },
  {
    id: "op_1_2",
    text: "Is this offer active, paused, retired, beta, evergreen, seasonal, or upcoming?",
    type: "radio",
    section: "5. Offers, Products, and Services",
    options: [
      { value: "active", label: "Active (currently selling and delivering)" },
      { value: "paused", label: "Paused (temporarily not available)" },
      { value: "retired", label: "Retired (no longer offered)" },
      { value: "beta", label: "Beta (testing with limited users)" },
      { value: "evergreen", label: "Evergreen (always available)" },
      { value: "seasonal", label: "Seasonal (available at specific times)" },
      { value: "upcoming", label: "Upcoming (in development, not yet launched)" },
    ],
  },
  {
    id: "op_1_3",
    text: "Who is the offer for?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "The specific ideal client this offer is designed for...",
  },
  {
    id: "op_1_4",
    text: "Who is the offer not for?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "Types of people or situations this offer is not suited for...",
  },
  {
    id: "op_1_5",
    text: "What problem does it solve?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "The specific pain point or challenge this offer addresses...",
  },
  {
    id: "op_1_6",
    text: "What outcome does it promise?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "The specific result or deliverable clients can expect...",
  },
  {
    id: "op_1_7",
    text: "What transformation does it create?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "The deeper change in identity, capability, or circumstance...",
  },
  {
    id: "op_1_8",
    text: "What is included?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "All components, deliverables, and inclusions in this offer...",
  },
  {
    id: "op_1_9",
    text: "What is not included?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "What clients should not expect to receive (sets boundaries)...",
  },
  {
    id: "op_1_10",
    text: "What is the price?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "The current price point for this offer...",
  },
  {
    id: "op_1_11",
    text: "Are there payment plans?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "Available payment plan options (e.g., 3 payments of $X)...",
  },
  {
    id: "op_1_12",
    text: "Is there a guarantee, pledge, or refund policy?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "Details of any satisfaction guarantees or refund terms...",
  },
  {
    id: "op_1_13",
    text: "What is the delivery format?",
    type: "radio",
    section: "5. Offers, Products, and Services",
    options: [
      { value: "one_on_one", label: "1:1 (individual coaching, consulting, or service)" },
      { value: "group", label: "Group (multiple participants together)" },
      { value: "course", label: "Course (self-paced or structured learning)" },
      { value: "cohort", label: "Cohort (time-bound group experience)" },
      { value: "done_for_you", label: "Done-for-you (service delivered for client)" },
      { value: "done_with_you", label: "Done-with-you (collaborative service)" },
      { value: "membership", label: "Membership (ongoing access community)" },
      { value: "retreat", label: "Retreat (immersive in-person experience)" },
      { value: "event", label: "Event (one-time or recurring gathering)" },
      { value: "digital_product", label: "Digital product (downloadable/template/tool)" },
    ],
  },
  {
    id: "op_1_14",
    text: "What is the duration?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "How long the offer lasts (e.g., 6 weeks, 3 months, ongoing)...",
  },
  {
    id: "op_1_15",
    text: "What is the cadence?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "Frequency of delivery (e.g., weekly calls, daily access, self-paced)...",
  },
  {
    id: "op_1_16",
    text: "What access does the client receive?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "Type of access (Voxer, portal, calls, community, lifetime, limited time)...",
  },
  {
    id: "op_1_17",
    text: "What assets, templates, tools, calls, sessions, deliverables, or support are included?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "Comprehensive list of everything the client receives...",
  },
  {
    id: "op_1_18",
    text: "What prerequisites exist?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "Requirements or preconditions for joining this offer...",
  },
  {
    id: "op_1_19",
    text: "What onboarding is required?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "Steps or process for getting new clients started...",
  },
  {
    id: "op_1_20",
    text: "What offboarding or completion process exists?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "How the offer concludes and what happens at completion...",
  },
  {
    id: "op_1_21",
    text: "What internal resources are needed to deliver it?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "Time, materials, tools, or infrastructure required internally...",
  },
  {
    id: "op_1_22",
    text: "What team members are involved?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "Roles or specific people needed to deliver this offer...",
  },
  {
    id: "op_1_23",
    text: "What systems are used?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "Software, platforms, or tools used to deliver this offer...",
  },
  {
    id: "op_1_24",
    text: "What client responsibilities are required?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "What clients must do or commit to for success...",
  },
  {
    id: "op_1_25",
    text: "What are the most common client wins?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "Typical results, breakthroughs, or successes clients experience...",
  },

  // 5.2 Offer Ladder (12 questions)
  {
    id: "op_2_1",
    text: "What is the free entry point into the business?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "Lead magnets, free workshops, content, or resources that attract prospects...",
  },
  {
    id: "op_2_2",
    text: "What low-ticket offer exists?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "Entry-level paid offer (typically under $100)...",
  },
  {
    id: "op_2_3",
    text: "What mid-ticket offer exists?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "Core offer at moderate price point (typically $100-$1000)...",
  },
  {
    id: "op_2_4",
    text: "What high-ticket offer exists?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "Premium offer at higher price point (typically $1000+)...",
  },
  {
    id: "op_2_5",
    text: "What premium or private offer exists?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "Highest-tier, exclusive, or private access offer...",
  },
  {
    id: "op_2_6",
    text: "What recurring revenue offer exists?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "Memberships, subscriptions, or retainer-based offers...",
  },
  {
    id: "op_2_7",
    text: "What event or live experience exists?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "Workshops, retreats, conferences, or live events...",
  },
  {
    id: "op_2_8",
    text: "What backend offer exists?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "Offers for existing clients after completing main offer...",
  },
  {
    id: "op_2_9",
    text: "What upgrade path exists?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "How clients move from lower-tier to higher-tier offers...",
  },
  {
    id: "op_2_10",
    text: "What downsell path exists?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "Alternative offers when main offer is not a fit or too expensive...",
  },
  {
    id: "op_2_11",
    text: "What referral path exists?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "How clients are incentivized or enabled to refer others...",
  },
  {
    id: "op_2_12",
    text: "What continuation path exists?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "How clients continue their journey after completing an offer...",
  },

  // 5.3 Pricing Logic (13 questions)
  {
    id: "op_3_1",
    text: "What is the current pricing for every offer?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "Complete list of all offers with their current prices...",
  },
  {
    id: "op_3_2",
    text: "Why is each offer priced that way?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "The reasoning and strategy behind each price point...",
  },
  {
    id: "op_3_3",
    text: "When was pricing last changed?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "Date of most recent pricing adjustments...",
  },
  {
    id: "op_3_4",
    text: "What pricing has been tested?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "Previous price points that were experimented with...",
  },
  {
    id: "op_3_5",
    text: "What pricing has worked best?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "Price points that generated best results (revenue, volume, satisfaction)...",
  },
  {
    id: "op_3_6",
    text: "What pricing has caused friction?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "Price points that created resistance, objections, or low conversion...",
  },
  {
    id: "op_3_7",
    text: "What discounts are allowed?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "Types of discounts that are permitted and under what circumstances...",
  },
  {
    id: "op_3_8",
    text: "What discounts are not allowed?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "Discounts or pricing practices that are prohibited...",
  },
  {
    id: "op_3_9",
    text: "Who can approve discounts?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "Roles or people with authority to offer discounts...",
  },
  {
    id: "op_3_10",
    text: "What payment plans are allowed?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "Approved payment plan structures and terms...",
  },
  {
    id: "op_3_11",
    text: "What refund policies exist?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "Terms and conditions for refunds by offer...",
  },
  {
    id: "op_3_12",
    text: "What guarantee language is approved?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "Specific wording and promises that can be made about results...",
  },
  {
    id: "op_3_13",
    text: "What financial boundaries protect the business?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "Policies that protect revenue, margins, and financial health...",
  },

  // ============================================
  // SECTION 6: MESSAGING, POSITIONING, AND BRAND INTELLIGENCE (53 questions)
  // ============================================

  // 6.1 Positioning (20 questions)
  {
    id: "mp_1_1",
    text: "What is the business's core positioning statement?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "The single sentence that defines how you want to be perceived in the market...",
  },
  {
    id: "mp_1_2",
    text: "What is the business the best at?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "The specific thing you do better than anyone else...",
  },
  {
    id: "mp_1_3",
    text: "What is the business known for today?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "How the market currently perceives you...",
  },
  {
    id: "mp_1_4",
    text: "What should it become known for?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "The reputation you want to build over time...",
  },
  {
    id: "mp_1_5",
    text: "What category does it own or want to own?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "The category you want to dominate or define...",
  },
  {
    id: "mp_1_6",
    text: "What problem does the business solve better than others?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "The specific problem where you have unique expertise or approach...",
  },
  {
    id: "mp_1_7",
    text: "What transformation does the business make possible?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "The before-and-after change clients experience...",
  },
  {
    id: "mp_1_8",
    text: "What is the unique mechanism behind the transformation?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "Your proprietary method, framework, or approach that creates results...",
  },
  {
    id: "mp_1_9",
    text: "What language is currently used to describe the business?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "Current messaging, taglines, and descriptive language...",
  },
  {
    id: "mp_1_10",
    text: "What language should be updated?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "Messaging that no longer fits or needs refreshing...",
  },
  {
    id: "mp_1_11",
    text: "What language should be protected?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "Messaging that works well and should be preserved...",
  },
  {
    id: "mp_1_12",
    text: "What language should be retired?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "Messaging that should be phased out completely...",
  },
  {
    id: "mp_1_13",
    text: "What makes the business credible?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "Credentials, experience, results, or proof that builds trust...",
  },
  {
    id: "mp_1_14",
    text: "What makes the business distinctive?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "What sets you apart from competitors in a noticeable way...",
  },
  {
    id: "mp_1_15",
    text: "What makes the business trustworthy?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "Elements that create confidence and reduce perceived risk...",
  },
  {
    id: "mp_1_16",
    text: "What makes the business urgent?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "Why prospects should act now rather than later...",
  },
  {
    id: "mp_1_17",
    text: "What makes the business relevant now?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "Current trends, timing, or market conditions that make you relevant...",
  },
  {
    id: "mp_1_18",
    text: "What should prospects understand immediately?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "The key message that must land in the first few seconds...",
  },
  {
    id: "mp_1_19",
    text: "What should prospects feel immediately?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "The emotional response you want to create right away...",
  },
  {
    id: "mp_1_20",
    text: "What is the simplest market-facing promise?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "The one-sentence promise you make to the market...",
  },

  // 6.2 Messaging Pillars (16 questions)
  {
    id: "mp_2_1",
    text: "What are the 3 to 7 core messaging pillars of the business?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "List the key themes or pillars that support your positioning...",
  },
  {
    id: "mp_2_2",
    text: "What does each pillar mean?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "Brief explanation of each messaging pillar...",
  },
  {
    id: "mp_2_3",
    text: "What client problem does each pillar address?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "The specific problem each pillar speaks to...",
  },
  {
    id: "mp_2_4",
    text: "What belief does each pillar challenge?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "The limiting belief each pillar helps overcome...",
  },
  {
    id: "mp_2_5",
    text: "What belief does each pillar install?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "The empowering belief each pillar creates...",
  },
  {
    id: "mp_2_6",
    text: "What story supports each pillar?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "The narrative or case study that illustrates each pillar...",
  },
  {
    id: "mp_2_7",
    text: "What proof supports each pillar?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "Data, testimonials, or evidence that validates each pillar...",
  },
  {
    id: "mp_2_8",
    text: "What offer connects to each pillar?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "The specific offer or service tied to each pillar...",
  },
  {
    id: "mp_2_9",
    text: "What call to action connects to each pillar?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "The specific CTA associated with each pillar...",
  },
  {
    id: "mp_2_10",
    text: "What content topics belong under each pillar?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "Content themes and topics for each pillar...",
  },
  {
    id: "mp_2_11",
    text: "What phrases belong under each pillar?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "Key phrases, taglines, or language for each pillar...",
  },
  {
    id: "mp_2_12",
    text: "What visuals belong under each pillar?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "Imagery, colors, or visual elements for each pillar...",
  },
  {
    id: "mp_2_13",
    text: "What objections does each pillar answer?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "The objections or concerns each pillar addresses...",
  },
  {
    id: "mp_2_14",
    text: "What client outcome does each pillar point toward?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "The result or transformation each pillar leads to...",
  },
  {
    id: "mp_2_15",
    text: "Which pillar is most important right now?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "The pillar that should be emphasized in current messaging...",
  },
  {
    id: "mp_2_16",
    text: "Which pillar should AI emphasize most?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "The pillar AI should prioritize in generated content...",
  },

  // 6.3 Brand Voice for Business Content (17 questions)
  {
    id: "mp_3_1",
    text: "How should the business sound publicly?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "The overall tone and voice for public-facing content...",
  },
  {
    id: "mp_3_2",
    text: "How should the business sound in sales conversations?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "Tone and approach for sales calls and pitches...",
  },
  {
    id: "mp_3_3",
    text: "How should the business sound in onboarding?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "Tone for welcoming and orienting new clients...",
  },
  {
    id: "mp_3_4",
    text: "How should the business sound in client delivery?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "Tone during service delivery and client interactions...",
  },
  {
    id: "mp_3_5",
    text: "How should the business sound in support?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "Tone for customer support and problem resolution...",
  },
  {
    id: "mp_3_6",
    text: "How should the business sound during conflict or repair?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "Tone for handling complaints, issues, or difficult situations...",
  },
  {
    id: "mp_3_7",
    text: "How should the business sound in internal team communication?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "Tone for team meetings, Slack, and internal messages...",
  },
  {
    id: "mp_3_8",
    text: "What tone should be used for authority?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "How to sound authoritative and credible...",
  },
  {
    id: "mp_3_9",
    text: "What tone should be used for warmth?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "How to sound approachable and human...",
  },
  {
    id: "mp_3_10",
    text: "What tone should be used for urgency?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "How to create urgency without being pushy...",
  },
  {
    id: "mp_3_11",
    text: "What tone should be used for boundaries?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "How to set and enforce boundaries gracefully...",
  },
  {
    id: "mp_3_12",
    text: "What tone should be avoided?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "Tones or approaches that don't fit the brand...",
  },
  {
    id: "mp_3_13",
    text: "What language feels too corporate?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "Words, phrases, or styles that feel overly formal or stiff...",
  },
  {
    id: "mp_3_14",
    text: "What language feels too casual?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "Words, phrases, or styles that feel too informal or unprofessional...",
  },
  {
    id: "mp_3_15",
    text: "What language feels too salesy?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "Words, phrases, or tactics that feel pushy or manipulative...",
  },
  {
    id: "mp_3_16",
    text: "What language feels too vague?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "Words or phrases that are unclear, generic, or meaningless...",
  },
  {
    id: "mp_3_17",
    text: "What sample content best represents the business voice?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "Examples of content that perfectly capture the brand voice...",
  },

  // ============================================
  // SECTION 7: SALES SYSTEM (45+ questions)
  // ============================================

  // 7.1 Sales Process (20 questions)
  {
    id: "ss_1_1",
    text: "How do leads enter the sales process?",
    type: "text",
    section: "7. Sales System",
    placeholder: "The entry points and methods by which leads begin the sales journey...",
  },
  {
    id: "ss_1_2",
    text: "What are the lead sources?",
    type: "text",
    section: "7. Sales System",
    placeholder: "All channels and methods that generate leads (referrals, ads, content, etc.)...",
  },
  {
    id: "ss_1_3",
    text: "What qualifies someone as a lead?",
    type: "text",
    section: "7. Sales System",
    placeholder: "The minimum criteria that define someone as a potential prospect...",
  },
  {
    id: "ss_1_4",
    text: "What qualifies someone as a warm lead?",
    type: "text",
    section: "7. Sales System",
    placeholder: "Behaviors or characteristics that indicate genuine interest...",
  },
  {
    id: "ss_1_5",
    text: "What qualifies someone as sales-ready?",
    type: "text",
    section: "7. Sales System",
    placeholder: "The signals that indicate a lead is ready for direct sales engagement...",
  },
  {
    id: "ss_1_6",
    text: "What is the first sales touchpoint?",
    type: "text",
    section: "7. Sales System",
    placeholder: "The initial contact method or moment in the sales process...",
  },
  {
    id: "ss_1_7",
    text: "What happens before a sales call?",
    type: "text",
    section: "7. Sales System",
    placeholder: "Preparation, research, or materials shared before the call...",
  },
  {
    id: "ss_1_8",
    text: "What happens during a sales call?",
    type: "text",
    section: "7. Sales System",
    placeholder: "The structure, agenda, and flow of a typical sales conversation...",
  },
  {
    id: "ss_1_9",
    text: "What happens after a sales call?",
    type: "text",
    section: "7. Sales System",
    placeholder: "Follow-up actions, materials sent, and next steps after the call...",
  },
  {
    id: "ss_1_10",
    text: "What follow-up sequence exists?",
    type: "text",
    section: "7. Sales System",
    placeholder: "The cadence and content of post-call follow-up communications...",
  },
  {
    id: "ss_1_11",
    text: "What CRM is used?",
    type: "text",
    section: "7. Sales System",
    placeholder: "The customer relationship management system and how it's used...",
  },
  {
    id: "ss_1_12",
    text: "What pipeline stages exist?",
    type: "text",
    section: "7. Sales System",
    placeholder: "The stages leads move through from initial contact to close...",
  },
  {
    id: "ss_1_13",
    text: "What are the definitions of each pipeline stage?",
    type: "text",
    section: "7. Sales System",
    placeholder: "Clear criteria for what defines each stage of the pipeline...",
  },
  {
    id: "ss_1_14",
    text: "Who owns each stage?",
    type: "text",
    section: "7. Sales System",
    placeholder: "The person or role responsible for moving leads through each stage...",
  },
  {
    id: "ss_1_15",
    text: "What scripts are used?",
    type: "text",
    section: "7. Sales System",
    placeholder: "Approved scripts, talking points, or conversation frameworks...",
  },
  {
    id: "ss_1_16",
    text: "What sales assets are used?",
    type: "text",
    section: "7. Sales System",
    placeholder: "Presentations, one-pagers, case studies, demos, or other sales materials...",
  },
  {
    id: "ss_1_17",
    text: "What proposal process exists?",
    type: "text",
    section: "7. Sales System",
    placeholder: "How proposals are created, customized, and delivered...",
  },
  {
    id: "ss_1_18",
    text: "What contract process exists?",
    type: "text",
    section: "7. Sales System",
    placeholder: "How contracts are generated, reviewed, signed, and stored...",
  },
  {
    id: "ss_1_19",
    text: "What payment process exists?",
    type: "text",
    section: "7. Sales System",
    placeholder: "How payments are collected, processed, and confirmed...",
  },
  {
    id: "ss_1_20",
    text: "What handoff happens after the sale?",
    type: "text",
    section: "7. Sales System",
    placeholder: "How closed deals are transitioned to delivery or onboarding teams...",
  },

  // 7.2 Sales Philosophy (15 questions)
  {
    id: "ss_2_1",
    text: "What does ethical sales mean to the business?",
    type: "text",
    section: "7. Sales System",
    placeholder: "The principles and values that guide sales behavior...",
  },
  {
    id: "ss_2_2",
    text: "What sales tactics are allowed?",
    type: "text",
    section: "7. Sales System",
    placeholder: "Approaches, techniques, and methods that are approved for use...",
  },
  {
    id: "ss_2_3",
    text: "What sales tactics are not allowed?",
    type: "text",
    section: "7. Sales System",
    placeholder: "Approaches, techniques, and methods that are prohibited...",
  },
  {
    id: "ss_2_4",
    text: "How should urgency be communicated?",
    type: "text",
    section: "7. Sales System",
    placeholder: "The appropriate way to convey time-sensitive opportunities...",
  },
  {
    id: "ss_2_5",
    text: "How should scarcity be communicated?",
    type: "text",
    section: "7. Sales System",
    placeholder: "The appropriate way to convey limited availability...",
  },
  {
    id: "ss_2_6",
    text: "How should pricing be communicated?",
    type: "text",
    section: "7. Sales System",
    placeholder: "The approach to discussing price, value, and investment...",
  },
  {
    id: "ss_2_7",
    text: "How should objections be handled?",
    type: "text",
    section: "7. Sales System",
    placeholder: "The general approach to addressing prospect concerns...",
  },
  {
    id: "ss_2_8",
    text: "How should hesitation be handled?",
    type: "text",
    section: "7. Sales System",
    placeholder: "The approach when prospects are unsure or need more time...",
  },
  {
    id: "ss_2_9",
    text: "How should a poor-fit prospect be handled?",
    type: "text",
    section: "7. Sales System",
    placeholder: "The approach when someone is not a good match for the offer...",
  },
  {
    id: "ss_2_10",
    text: "How should a no be handled?",
    type: "text",
    section: "7. Sales System",
    placeholder: "The approach when a prospect declines the offer...",
  },
  {
    id: "ss_2_11",
    text: "What sales tone feels aligned?",
    type: "text",
    section: "7. Sales System",
    placeholder: "The voice, energy, and approach that fits the brand...",
  },
  {
    id: "ss_2_12",
    text: "What sales tone feels manipulative?",
    type: "text",
    section: "7. Sales System",
    placeholder: "The voice, energy, and approach that should be avoided...",
  },
  {
    id: "ss_2_13",
    text: "What should never be promised?",
    type: "text",
    section: "7. Sales System",
    placeholder: "Outcomes, guarantees, or results that should not be committed to...",
  },
  {
    id: "ss_2_14",
    text: "What should never be exaggerated?",
    type: "text",
    section: "7. Sales System",
    placeholder: "Claims, statistics, or capabilities that must be stated accurately...",
  },
  {
    id: "ss_2_15",
    text: "What should AI be allowed to draft for sales?",
    type: "text",
    section: "7. Sales System",
    placeholder: "The boundaries for AI-generated sales content and communications...",
  },

  // 7.3 Objection Handling (10+ categories)
  {
    id: "ss_3_1",
    text: "How should price objections be handled?",
    type: "text",
    section: "7. Sales System",
    placeholder: "Responses and approaches for 'It's too expensive' or budget concerns...",
  },
  {
    id: "ss_3_2",
    text: "How should time objections be handled?",
    type: "text",
    section: "7. Sales System",
    placeholder: "Responses for 'I don't have time' or scheduling concerns...",
  },
  {
    id: "ss_3_3",
    text: "How should trust objections be handled?",
    type: "text",
    section: "7. Sales System",
    placeholder: "Responses for 'How do I know this will work?' or credibility concerns...",
  },
  {
    id: "ss_3_4",
    text: "How should readiness objections be handled?",
    type: "text",
    section: "7. Sales System",
    placeholder: "Responses for 'I'm not ready' or timing concerns...",
  },
  {
    id: "ss_3_5",
    text: "How should spouse or partner approval objections be handled?",
    type: "text",
    section: "7. Sales System",
    placeholder: "Responses for 'I need to check with my partner/spouse'...",
  },
  {
    id: "ss_3_6",
    text: "How should team approval objections be handled?",
    type: "text",
    section: "7. Sales System",
    placeholder: "Responses for 'I need to get my team's buy-in' or stakeholder approval...",
  },
  {
    id: "ss_3_7",
    text: "How should past disappointment objections be handled?",
    type: "text",
    section: "7. Sales System",
    placeholder: "Responses for 'I've tried something like this before and it didn't work'...",
  },
  {
    id: "ss_3_8",
    text: "How should fear of failure objections be handled?",
    type: "text",
    section: "7. Sales System",
    placeholder: "Responses for 'What if I fail?' or fear-based concerns...",
  },
  {
    id: "ss_3_9",
    text: "How should fear of success objections be handled?",
    type: "text",
    section: "7. Sales System",
    placeholder: "Responses for concerns about handling success or its consequences...",
  },
  {
    id: "ss_3_10",
    text: "How should 'too busy' objections be handled?",
    type: "text",
    section: "7. Sales System",
    placeholder: "Responses for 'I'm too busy right now' or capacity concerns...",
  },
  {
    id: "ss_3_11",
    text: "How should 'not sure it will work' objections be handled?",
    type: "text",
    section: "7. Sales System",
    placeholder: "Responses for skepticism about effectiveness or outcomes...",
  },
  {
    id: "ss_3_12",
    text: "How should 'need to think about it' objections be handled?",
    type: "text",
    section: "7. Sales System",
    placeholder: "Responses for prospects who want time to consider...",
  },
  {
    id: "ss_3_13",
    text: "How should 'need more information' objections be handled?",
    type: "text",
    section: "7. Sales System",
    placeholder: "Responses for requests for additional details or clarification...",
  },
  {
    id: "ss_3_14",
    text: "How should 'prefer to do it alone' objections be handled?",
    type: "text",
    section: "7. Sales System",
    placeholder: "Responses for prospects who want to solve the problem independently...",
  },
  {
    id: "ss_3_15",
    text: "How should 'waiting for the right time' objections be handled?",
    type: "text",
    section: "7. Sales System",
    placeholder: "Responses for 'The timing isn't right' or future-planning delays...",
  },

  // ============================================
  // SECTION 8: MARKETING SYSTEM (45+ questions)
  // ============================================

  // 8.1 Marketing Channels - Website (15 questions)
  {
    id: "ms_1_1",
    text: "What is the channel? (Website)",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Website",
  },
  {
    id: "ms_1_2",
    text: "Is the Website channel active, inactive, experimental, or planned?",
    type: "radio",
    section: "8. Marketing System",
    options: [
      { value: "active", label: "Active" },
      { value: "inactive", label: "Inactive" },
      { value: "experimental", label: "Experimental" },
      { value: "planned", label: "Planned" },
    ],
  },
  {
    id: "ms_1_3",
    text: "What is the purpose of the Website channel?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Primary purpose and goals for this channel...",
  },
  {
    id: "ms_1_4",
    text: "Who is the audience on the Website channel?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "The specific audience this channel reaches...",
  },
  {
    id: "ms_1_5",
    text: "What content performs best on the Website channel?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Types of content that get the best engagement...",
  },
  {
    id: "ms_1_6",
    text: "What content performs poorly on the Website channel?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Types of content that underperform...",
  },
  {
    id: "ms_1_7",
    text: "How often is content published on the Website channel?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Publishing frequency and schedule...",
  },
  {
    id: "ms_1_8",
    text: "Who creates the content for the Website channel?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Person or role responsible for content creation...",
  },
  {
    id: "ms_1_9",
    text: "Who approves the content for the Website channel?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Person or role responsible for content approval...",
  },
  {
    id: "ms_1_10",
    text: "What tools are used for the Website channel?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Software, platforms, and tools used...",
  },
  {
    id: "ms_1_11",
    text: "What metrics are tracked for the Website channel?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Key performance indicators and metrics...",
  },
  {
    id: "ms_1_12",
    text: "What call to action is used on the Website channel?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Primary CTA and any secondary CTAs...",
  },
  {
    id: "ms_1_13",
    text: "What lead magnet or offer is promoted on the Website channel?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Lead magnets, offers, or incentives promoted...",
  },
  {
    id: "ms_1_14",
    text: "What is the current conversion rate for the Website channel?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Current conversion rates and benchmarks...",
  },
  {
    id: "ms_1_15",
    text: "What improvements are needed for the Website channel?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Areas for improvement and optimization...",
  },

  // 8.1 Marketing Channels - Email (15 questions)
  {
    id: "ms_2_1",
    text: "What is the channel? (Email)",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Email",
  },
  {
    id: "ms_2_2",
    text: "Is the Email channel active, inactive, experimental, or planned?",
    type: "radio",
    section: "8. Marketing System",
    options: [
      { value: "active", label: "Active" },
      { value: "inactive", label: "Inactive" },
      { value: "experimental", label: "Experimental" },
      { value: "planned", label: "Planned" },
    ],
  },
  {
    id: "ms_2_3",
    text: "What is the purpose of the Email channel?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Primary purpose and goals for this channel...",
  },
  {
    id: "ms_2_4",
    text: "Who is the audience on the Email channel?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "The specific audience this channel reaches...",
  },
  {
    id: "ms_2_5",
    text: "What content performs best on the Email channel?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Types of content that get the best engagement...",
  },
  {
    id: "ms_2_6",
    text: "What content performs poorly on the Email channel?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Types of content that underperform...",
  },
  {
    id: "ms_2_7",
    text: "How often is content published on the Email channel?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Publishing frequency and schedule...",
  },
  {
    id: "ms_2_8",
    text: "Who creates the content for the Email channel?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Person or role responsible for content creation...",
  },
  {
    id: "ms_2_9",
    text: "Who approves the content for the Email channel?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Person or role responsible for content approval...",
  },
  {
    id: "ms_2_10",
    text: "What tools are used for the Email channel?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Software, platforms, and tools used...",
  },
  {
    id: "ms_2_11",
    text: "What metrics are tracked for the Email channel?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Key performance indicators and metrics...",
  },
  {
    id: "ms_2_12",
    text: "What call to action is used on the Email channel?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Primary CTA and any secondary CTAs...",
  },
  {
    id: "ms_2_13",
    text: "What lead magnet or offer is promoted on the Email channel?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Lead magnets, offers, or incentives promoted...",
  },
  {
    id: "ms_2_14",
    text: "What is the current conversion rate for the Email channel?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Current conversion rates and benchmarks...",
  },
  {
    id: "ms_2_15",
    text: "What improvements are needed for the Email channel?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Areas for improvement and optimization...",
  },

  // 8.1 Marketing Channels - Social Media (15 questions)
  {
    id: "ms_3_1",
    text: "What is the channel? (Social Media)",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Social Media",
  },
  {
    id: "ms_3_2",
    text: "Is the Social Media channel active, inactive, experimental, or planned?",
    type: "radio",
    section: "8. Marketing System",
    options: [
      { value: "active", label: "Active" },
      { value: "inactive", label: "Inactive" },
      { value: "experimental", label: "Experimental" },
      { value: "planned", label: "Planned" },
    ],
  },
  {
    id: "ms_3_3",
    text: "What is the purpose of the Social Media channel?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Primary purpose and goals for this channel...",
  },
  {
    id: "ms_3_4",
    text: "Who is the audience on the Social Media channel?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "The specific audience this channel reaches...",
  },
  {
    id: "ms_3_5",
    text: "What content performs best on the Social Media channel?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Types of content that get the best engagement...",
  },
  {
    id: "ms_3_6",
    text: "What content performs poorly on the Social Media channel?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Types of content that underperform...",
  },
  {
    id: "ms_3_7",
    text: "How often is content published on the Social Media channel?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Publishing frequency and schedule...",
  },
  {
    id: "ms_3_8",
    text: "Who creates the content for the Social Media channel?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Person or role responsible for content creation...",
  },
  {
    id: "ms_3_9",
    text: "Who approves the content for the Social Media channel?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Person or role responsible for content approval...",
  },
  {
    id: "ms_3_10",
    text: "What tools are used for the Social Media channel?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Software, platforms, and tools used...",
  },
  {
    id: "ms_3_11",
    text: "What metrics are tracked for the Social Media channel?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Key performance indicators and metrics...",
  },
  {
    id: "ms_3_12",
    text: "What call to action is used on the Social Media channel?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Primary CTA and any secondary CTAs...",
  },
  {
    id: "ms_3_13",
    text: "What lead magnet or offer is promoted on the Social Media channel?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Lead magnets, offers, or incentives promoted...",
  },
  {
    id: "ms_3_14",
    text: "What is the current conversion rate for the Social Media channel?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Current conversion rates and benchmarks...",
  },
  {
    id: "ms_3_15",
    text: "What improvements are needed for the Social Media channel?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Areas for improvement and optimization...",
  },

  // 8.2 Content Engine (12 questions)
  {
    id: "ms_4_1",
    text: "What is the current content strategy?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Overall approach and philosophy for content...",
  },
  {
    id: "ms_4_2",
    text: "What are the main content themes?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Core topics and themes that content focuses on...",
  },
  {
    id: "ms_4_3",
    text: "What are the monthly or quarterly themes?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Rotating themes or focus areas by time period...",
  },
  {
    id: "ms_4_4",
    text: "What are the recurring content formats?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Regular content types and formats used...",
  },
  {
    id: "ms_4_5",
    text: "What is the content creation workflow?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Step-by-step process for creating content...",
  },
  {
    id: "ms_4_6",
    text: "What is the approval workflow?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Process for reviewing and approving content...",
  },
  {
    id: "ms_4_7",
    text: "What is the publishing workflow?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Process for scheduling and publishing content...",
  },
  {
    id: "ms_4_8",
    text: "What is the repurposing workflow?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Process for adapting content across channels...",
  },
  {
    id: "ms_4_9",
    text: "What content has performed best?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Top-performing content pieces and why they worked...",
  },
  {
    id: "ms_4_10",
    text: "What content has generated leads?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Content that has directly generated leads...",
  },
  {
    id: "ms_4_11",
    text: "What content has generated sales?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Content that has directly generated sales...",
  },
  {
    id: "ms_4_12",
    text: "What should AI prioritize for content?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "How AI should focus its content support...",
  },

  // 8.3 Lead Magnets and Free Resources (12 questions)
  {
    id: "ms_5_1",
    text: "What is the name of the lead magnet?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Name of the primary lead magnet or free resource...",
  },
  {
    id: "ms_5_2",
    text: "What problem does the lead magnet solve?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "The specific problem this resource addresses...",
  },
  {
    id: "ms_5_3",
    text: "Who is the lead magnet for?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Target audience for this lead magnet...",
  },
  {
    id: "ms_5_4",
    text: "What format is the lead magnet?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Format (PDF, video, checklist, template, etc.)...",
  },
  {
    id: "ms_5_5",
    text: "Where is the lead magnet hosted?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Platform or location where it's stored...",
  },
  {
    id: "ms_5_6",
    text: "How is the lead magnet delivered?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Delivery method and automation...",
  },
  {
    id: "ms_5_7",
    text: "What email sequence follows the lead magnet?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Nurture sequence that follows delivery...",
  },
  {
    id: "ms_5_8",
    text: "What offer does the lead magnet lead to?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Primary offer promoted after lead magnet...",
  },
  {
    id: "ms_5_9",
    text: "What is the opt-in rate?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Current opt-in conversion rate...",
  },
  {
    id: "ms_5_10",
    text: "What is the conversion rate to paid?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Rate at which lead magnet subscribers become customers...",
  },
  {
    id: "ms_5_11",
    text: "What needs to be updated on the lead magnet?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Areas for improvement or updates needed...",
  },
  {
    id: "ms_5_12",
    text: "What messaging should AI use for the lead magnet?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Approved messaging and positioning...",
  },

  // 8.4 Email Marketing (12 questions)
  {
    id: "ms_6_1",
    text: "What email platform is used?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Primary email service provider...",
  },
  {
    id: "ms_6_2",
    text: "How large is the email list?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Total subscribers and growth rate...",
  },
  {
    id: "ms_6_3",
    text: "How is the list segmented?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Segmentation criteria and groups...",
  },
  {
    id: "ms_6_4",
    text: "What tags are used?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Tagging system and categories...",
  },
  {
    id: "ms_6_5",
    text: "What automations exist?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Automated sequences and workflows...",
  },
  {
    id: "ms_6_6",
    text: "What nurture sequences exist?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Welcome series and nurture flows...",
  },
  {
    id: "ms_6_7",
    text: "What sales sequences exist?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Promotional and sales email sequences...",
  },
  {
    id: "ms_6_8",
    text: "What newsletter cadence exists?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Regular newsletter schedule and format...",
  },
  {
    id: "ms_6_9",
    text: "What subject lines perform best?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "High-performing subject line patterns...",
  },
  {
    id: "ms_6_10",
    text: "What CTAs perform best?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Effective call-to-action approaches...",
  },
  {
    id: "ms_6_11",
    text: "What is the average open rate?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Current open rate benchmarks...",
  },
  {
    id: "ms_6_12",
    text: "What should AI draft for email marketing?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Guidelines for AI-generated email content...",
  },

  // ============================================
  // SECTION 9: CUSTOMER JOURNEY AND CLIENT EXPERIENCE (40 questions)
  // ============================================

  // 9.1 Customer Journey Map (12 questions)
  {
    id: "cj_1_1",
    text: "What are the stages of the customer journey?",
    type: "text",
    section: "9. Customer Journey and Client Experience",
    placeholder: "Awareness, Interest, Consideration, Purchase, Onboarding, Delivery, Retention, Advocacy...",
  },
  {
    id: "cj_1_2",
    text: "What happens at the Awareness stage?",
    type: "text",
    section: "9. Customer Journey and Client Experience",
    placeholder: "How prospects first discover the business...",
  },
  {
    id: "cj_1_3",
    text: "What happens at the Interest stage?",
    type: "text",
    section: "9. Customer Journey and Client Experience",
    placeholder: "How prospects engage and learn more...",
  },
  {
    id: "cj_1_4",
    text: "What happens at the Consideration stage?",
    type: "text",
    section: "9. Customer Journey and Client Experience",
    placeholder: "How prospects evaluate options and make decisions...",
  },
  {
    id: "cj_1_5",
    text: "What happens at the Purchase stage?",
    type: "text",
    section: "9. Customer Journey and Client Experience",
    placeholder: "The buying process and payment experience...",
  },
  {
    id: "cj_1_6",
    text: "What happens at the Onboarding stage?",
    type: "text",
    section: "9. Customer Journey and Client Experience",
    placeholder: "How new clients are welcomed and oriented...",
  },
  {
    id: "cj_1_7",
    text: "What happens at the Delivery stage?",
    type: "text",
    section: "9. Customer Journey and Client Experience",
    placeholder: "How the product/service is delivered and experienced...",
  },
  {
    id: "cj_1_8",
    text: "What happens at the Retention stage?",
    type: "text",
    section: "9. Customer Journey and Client Experience",
    placeholder: "How ongoing relationships are maintained...",
  },
  {
    id: "cj_1_9",
    text: "What happens at the Advocacy stage?",
    type: "text",
    section: "9. Customer Journey and Client Experience",
    placeholder: "How satisfied clients become promoters...",
  },
  {
    id: "cj_1_10",
    text: "What are the key touchpoints at each stage?",
    type: "text",
    section: "9. Customer Journey and Client Experience",
    placeholder: "Specific interactions and moments that matter...",
  },
  {
    id: "cj_1_11",
    text: "What emotions should clients feel at each stage?",
    type: "text",
    section: "9. Customer Journey and Client Experience",
    placeholder: "Desired emotional experience throughout the journey...",
  },
  {
    id: "cj_1_12",
    text: "What are the biggest friction points in the journey?",
    type: "text",
    section: "9. Customer Journey and Client Experience",
    placeholder: "Areas where clients get stuck or frustrated...",
  },

  // 9.2 Onboarding Process (10 questions)
  {
    id: "cj_2_1",
    text: "What is the onboarding process for new clients?",
    type: "text",
    section: "9. Customer Journey and Client Experience",
    placeholder: "Step-by-step flow from purchase to first value...",
  },
  {
    id: "cj_2_2",
    text: "What welcome materials are sent?",
    type: "text",
    section: "9. Customer Journey and Client Experience",
    placeholder: "Emails, videos, documents, or resources sent upon purchase...",
  },
  {
    id: "cj_2_3",
    text: "What is the first deliverable or milestone?",
    type: "text",
    section: "9. Customer Journey and Client Experience",
    placeholder: "The first thing clients receive or achieve...",
  },
  {
    id: "cj_2_4",
    text: "What expectations are set during onboarding?",
    type: "text",
    section: "9. Customer Journey and Client Experience",
    placeholder: "What clients should expect in terms of timeline, communication, and outcomes...",
  },
  {
    id: "cj_2_5",
    text: "What boundaries are set during onboarding?",
    type: "text",
    section: "9. Customer Journey and Client Experience",
    placeholder: "What is and isn't included, response times, communication channels...",
  },
  {
    id: "cj_2_6",
    text: "What information is collected from clients?",
    type: "text",
    section: "9. Customer Journey and Client Experience",
    placeholder: "Intake forms, questionnaires, or data gathered...",
  },
  {
    id: "cj_2_7",
    text: "How is the client introduced to the team?",
    type: "text",
    section: "9. Customer Journey and Client Experience",
    placeholder: "How team members are presented and relationships are established...",
  },
  {
    id: "cj_2_8",
    text: "What access or credentials are provided?",
    type: "text",
    section: "9. Customer Journey and Client Experience",
    placeholder: "Portal access, login credentials, or platform invitations...",
  },
  {
    id: "cj_2_9",
    text: "How long does onboarding typically take?",
    type: "text",
    section: "9. Customer Journey and Client Experience",
    placeholder: "Duration from purchase to fully onboarded...",
  },
  {
    id: "cj_2_10",
    text: "How is onboarding success measured?",
    type: "text",
    section: "9. Customer Journey and Client Experience",
    placeholder: "Metrics or indicators that onboarding is working well...",
  },

  // 9.3 Delivery Process (10 questions)
  {
    id: "cj_3_1",
    text: "What is the core delivery process?",
    type: "text",
    section: "9. Customer Journey and Client Experience",
    placeholder: "How the main product/service is delivered from start to finish...",
  },
  {
    id: "cj_3_2",
    text: "What are the key milestones or phases?",
    type: "text",
    section: "9. Customer Journey and Client Experience",
    placeholder: "Major checkpoints or stages in the delivery process...",
  },
  {
    id: "cj_3_3",
    text: "What are the client responsibilities during delivery?",
    type: "text",
    section: "9. Customer Journey and Client Experience",
    placeholder: "What clients must do, provide, or complete...",
  },
  {
    id: "cj_3_4",
    text: "What are the business responsibilities during delivery?",
    type: "text",
    section: "9. Customer Journey and Client Experience",
    placeholder: "What the business must deliver, provide, or ensure...",
  },
  {
    id: "cj_3_5",
    text: "How is progress communicated to clients?",
    type: "text",
    section: "9. Customer Journey and Client Experience",
    placeholder: "Updates, reports, or check-ins during delivery...",
  },
  {
    id: "cj_3_6",
    text: "How are delays or issues communicated?",
    type: "text",
    section: "9. Customer Journey and Client Experience",
    placeholder: "Process for communicating problems or timeline changes...",
  },
  {
    id: "cj_3_7",
    text: "What happens if a client is unresponsive?",
    type: "text",
    section: "9. Customer Journey and Client Experience",
    placeholder: "Process for handling ghosting or delays on the client side...",
  },
  {
    id: "cj_3_8",
    text: "What happens if deliverables are delayed?",
    type: "text",
    section: "9. Customer Journey and Client Experience",
    placeholder: "Process for handling delays on the business side...",
  },
  {
    id: "cj_3_9",
    text: "How is completion or offboarding handled?",
    type: "text",
    section: "9. Customer Journey and Client Experience",
    placeholder: "Process for wrapping up and transitioning out...",
  },
  {
    id: "cj_3_10",
    text: "What happens after delivery is complete?",
    type: "text",
    section: "9. Customer Journey and Client Experience",
    placeholder: "Follow-up, next steps, or continuation options...",
  },

  // 9.4 Client Support (8 questions)
  {
    id: "cj_4_1",
    text: "What support channels are available to clients?",
    type: "text",
    section: "9. Customer Journey and Client Experience",
    placeholder: "Email, chat, phone, portal, community, etc....",
  },
  {
    id: "cj_4_2",
    text: "What are the support response time commitments?",
    type: "text",
    section: "9. Customer Journey and Client Experience",
    placeholder: "Expected response times for different channels or urgency levels...",
  },
  {
    id: "cj_4_3",
    text: "Who handles support requests?",
    type: "text",
    section: "9. Customer Journey and Client Experience",
    placeholder: "Roles or team members responsible for support...",
  },
  {
    id: "cj_4_4",
    text: "What is the escalation process?",
    type: "text",
    section: "9. Customer Journey and Client Experience",
    placeholder: "How issues are escalated when they can't be resolved at first level...",
  },
  {
    id: "cj_4_5",
    text: "What types of requests are considered support vs. scope?",
    type: "text",
    section: "9. Customer Journey and Client Experience",
    placeholder: "Boundary between included support and additional paid work...",
  },
  {
    id: "cj_4_6",
    text: "How are complaints or issues documented?",
    type: "text",
    section: "9. Customer Journey and Client Experience",
    placeholder: "Process for tracking and resolving client complaints...",
  },
  {
    id: "cj_4_7",
    text: "How is client feedback collected?",
    type: "text",
    section: "9. Customer Journey and Client Experience",
    placeholder: "Surveys, interviews, or other feedback mechanisms...",
  },
  {
    id: "cj_4_8",
    text: "How is client feedback acted upon?",
    type: "text",
    section: "9. Customer Journey and Client Experience",
    placeholder: "Process for reviewing and implementing client feedback...",
  },

  // ============================================
  // SECTION 10: OPERATIONS AND INTERNAL SYSTEMS (45 questions)
  // ============================================

  // 10.1 Operating Cadence (12 questions)
  {
    id: "os_1_1",
    text: "What is the annual planning cycle?",
    type: "text",
    section: "10. Operations and Internal Systems",
    placeholder: "When and how annual goals and plans are set...",
  },
  {
    id: "os_1_2",
    text: "What is the quarterly planning cycle?",
    type: "text",
    section: "10. Operations and Internal Systems",
    placeholder: "When and how quarterly OKRs or priorities are set...",
  },
  {
    id: "os_1_3",
    text: "What is the monthly review process?",
    type: "text",
    section: "10. Operations and Internal Systems",
    placeholder: "Monthly check-ins, reviews, or reporting rituals...",
  },
  {
    id: "os_1_4",
    text: "What is the weekly meeting cadence?",
    type: "text",
    section: "10. Operations and Internal Systems",
    placeholder: "Regular weekly meetings and their purposes...",
  },
  {
    id: "os_1_5",
    text: "What is the daily standup or check-in process?",
    type: "text",
    section: "10. Operations and Internal Systems",
    placeholder: "Daily rituals for alignment and communication...",
  },
  {
    id: "os_1_6",
    text: "What decisions require meetings vs. async?",
    type: "text",
    section: "10. Operations and Internal Systems",
    placeholder: "Criteria for when to meet vs. handle asynchronously...",
  },
  {
    id: "os_1_7",
    text: "What is the decision-making framework?",
    type: "text",
    section: "10. Operations and Internal Systems",
    placeholder: "How decisions are made and who has authority...",
  },
  {
    id: "os_1_8",
    text: "What is the communication protocol?",
    type: "text",
    section: "10. Operations and Internal Systems",
    placeholder: "Which channels to use for what types of communication...",
  },
  {
    id: "os_1_9",
    text: "What is the reporting structure?",
    type: "text",
    section: "10. Operations and Internal Systems",
    placeholder: "Who reports to whom and what information flows where...",
  },
  {
    id: "os_1_10",
    text: "What are the core operating hours?",
    type: "text",
    section: "10. Operations and Internal Systems",
    placeholder: "Standard working hours and availability expectations...",
  },
  {
    id: "os_1_11",
    text: "What is the time-off and vacation policy?",
    type: "text",
    section: "10. Operations and Internal Systems",
    placeholder: "How time off is requested, tracked, and covered...",
  },
  {
    id: "os_1_12",
    text: "What is the emergency or urgent response protocol?",
    type: "text",
    section: "10. Operations and Internal Systems",
    placeholder: "How urgent issues are handled outside normal hours...",
  },

  // 10.2 SOP Inventory (12 questions)
  {
    id: "os_2_1",
    text: "What SOPs currently exist?",
    type: "text",
    section: "10. Operations and Internal Systems",
    placeholder: "List of documented standard operating procedures...",
  },
  {
    id: "os_2_2",
    text: "What processes need SOPs but don't have them?",
    type: "text",
    section: "10. Operations and Internal Systems",
    placeholder: "Critical processes that are undocumented...",
  },
  {
    id: "os_2_3",
    text: "Where are SOPs stored?",
    type: "text",
    section: "10. Operations and Internal Systems",
    placeholder: "Location or system where SOPs are housed...",
  },
  {
    id: "os_2_4",
    text: "What format are SOPs in?",
    type: "text",
    section: "10. Operations and Internal Systems",
    placeholder: "Document format, video, checklist, etc....",
  },
  {
    id: "os_2_5",
    text: "Who is responsible for creating SOPs?",
    type: "text",
    section: "10. Operations and Internal Systems",
    placeholder: "Role or person responsible for documentation...",
  },
  {
    id: "os_2_6",
    text: "Who is responsible for updating SOPs?",
    type: "text",
    section: "10. Operations and Internal Systems",
    placeholder: "Role or person responsible for maintaining documentation...",
  },
  {
    id: "os_2_7",
    text: "How often are SOPs reviewed?",
    type: "text",
    section: "10. Operations and Internal Systems",
    placeholder: "Review cadence for ensuring SOPs stay current...",
  },
  {
    id: "os_2_8",
    text: "What processes are currently undocumented?",
    type: "text",
    section: "10. Operations and Internal Systems",
    placeholder: "Key processes that exist only in people's heads...",
  },
  {
    id: "os_2_9",
    text: "What processes are too dependent on specific people?",
    type: "text",
    section: "10. Operations and Internal Systems",
    placeholder: "Bottlenecks where only one person knows how to do something...",
  },
  {
    id: "os_2_10",
    text: "What processes need automation?",
    type: "text",
    section: "10. Operations and Internal Systems",
    placeholder: "Manual processes that could be automated...",
  },
  {
    id: "os_2_11",
    text: "What processes need delegation?",
    type: "text",
    section: "10. Operations and Internal Systems",
    placeholder: "Tasks that should be handed off to others...",
  },
  {
    id: "os_2_12",
    text: "What should AI be allowed to document or improve?",
    type: "text",
    section: "10. Operations and Internal Systems",
    placeholder: "Guidelines for AI assistance with SOPs and processes...",
  },

  // 10.3 Project Management (12 questions)
  {
    id: "os_3_1",
    text: "What project management tool is used?",
    type: "text",
    section: "10. Operations and Internal Systems",
    placeholder: "Primary PM platform and how it's used...",
  },
  {
    id: "os_3_2",
    text: "How are projects organized?",
    type: "text",
    section: "10. Operations and Internal Systems",
    placeholder: "Folder structure, naming conventions, or organization system...",
  },
  {
    id: "os_3_3",
    text: "How are tasks assigned?",
    type: "text",
    section: "10. Operations and Internal Systems",
    placeholder: "Process for assigning work and setting deadlines...",
  },
  {
    id: "os_3_4",
    text: "How is task priority determined?",
    type: "text",
    section: "10. Operations and Internal Systems",
    placeholder: "Framework for deciding what gets done first...",
  },
  {
    id: "os_3_5",
    text: "What is the task workflow?",
    type: "text",
    section: "10. Operations and Internal Systems",
    placeholder: "Stages tasks move through from creation to completion...",
  },
  {
    id: "os_3_6",
    text: "How are deadlines set and tracked?",
    type: "text",
    section: "10. Operations and Internal Systems",
    placeholder: "Process for setting and monitoring deadlines...",
  },
  {
    id: "os_3_7",
    text: "How is work-in-progress limited?",
    type: "text",
    section: "10. Operations and Internal Systems",
    placeholder: "Approach to preventing overload and multitasking...",
  },
  {
    id: "os_3_8",
    text: "How are blockers identified and resolved?",
    type: "text",
    section: "10. Operations and Internal Systems",
    placeholder: "Process for surfacing and removing obstacles...",
  },
  {
    id: "os_3_9",
    text: "How is project status communicated?",
    type: "text",
    section: "10. Operations and Internal Systems",
    placeholder: "Reporting and visibility into project progress...",
  },
  {
    id: "os_3_10",
    text: "How are project retrospectives conducted?",
    type: "text",
    section: "10. Operations and Internal Systems",
    placeholder: "Process for reviewing completed projects and learning...",
  },
  {
    id: "os_3_11",
    text: "What templates exist for common project types?",
    type: "text",
    section: "10. Operations and Internal Systems",
    placeholder: "Reusable templates for recurring project types...",
  },
  {
    id: "os_3_12",
    text: "What should AI be allowed to manage or track?",
    type: "text",
    section: "10. Operations and Internal Systems",
    placeholder: "Guidelines for AI assistance with project management...",
  },

  // 10.4 File and Knowledge Management (9 questions)
  {
    id: "os_4_1",
    text: "Where are files stored?",
    type: "text",
    section: "10. Operations and Internal Systems",
    placeholder: "Primary file storage system and structure...",
  },
  {
    id: "os_4_2",
    text: "What is the folder structure?",
    type: "text",
    section: "10. Operations and Internal Systems",
    placeholder: "Organization system for files and folders...",
  },
  {
    id: "os_4_3",
    text: "What are the naming conventions?",
    type: "text",
    section: "10. Operations and Internal Systems",
    placeholder: "Standard naming patterns for files and documents...",
  },
  {
    id: "os_4_4",
    text: "Who has access to what files?",
    type: "text",
    section: "10. Operations and Internal Systems",
    placeholder: "Permission structure and access controls...",
  },
  {
    id: "os_4_5",
    text: "Where is institutional knowledge documented?",
    type: "text",
    section: "10. Operations and Internal Systems",
    placeholder: "Wiki, knowledge base, or documentation system...",
  },
  {
    id: "os_4_6",
    text: "How is knowledge kept current?",
    type: "text",
    section: "10. Operations and Internal Systems",
    placeholder: "Process for updating documentation as things change...",
  },
  {
    id: "os_4_7",
    text: "What information is currently scattered or hard to find?",
    type: "text",
    section: "10. Operations and Internal Systems",
    placeholder: "Knowledge gaps or disorganized information...",
  },
  {
    id: "os_4_8",
    text: "What should be archived or deleted?",
    type: "text",
    section: "10. Operations and Internal Systems",
    placeholder: "Old files or information that should be cleaned up...",
  },
  {
    id: "os_4_9",
    text: "What should AI be allowed to access or organize?",
    type: "text",
    section: "10. Operations and Internal Systems",
    placeholder: "Guidelines for AI assistance with file and knowledge management...",
  },

  // ============================================
  // SECTION 11: TEAM AND ROLES (35 questions)
  // ============================================

  // 11.1 Team Structure (12 questions)
  {
    id: "tr_1_1",
    text: "What is the current org chart?",
    type: "text",
    section: "11. Team and Roles",
    placeholder: "Structure of the team and reporting relationships...",
  },
  {
    id: "tr_1_2",
    text: "Who are the current team members?",
    type: "text",
    section: "11. Team and Roles",
    placeholder: "List of current team members with roles...",
  },
  {
    id: "tr_1_3",
    text: "What are their roles and responsibilities?",
    type: "text",
    section: "11. Team and Roles",
    placeholder: "Key responsibilities for each role...",
  },
  {
    id: "tr_1_4",
    text: "Who reports to whom?",
    type: "text",
    section: "11. Team and Roles",
    placeholder: "Reporting lines and management structure...",
  },
  {
    id: "tr_1_5",
    text: "What roles are filled by employees?",
    type: "text",
    section: "11. Team and Roles",
    placeholder: "Roles that are employee positions...",
  },
  {
    id: "tr_1_6",
    text: "What roles are filled by contractors?",
    type: "text",
    section: "11. Team and Roles",
    placeholder: "Roles that are contractor positions...",
  },
  {
    id: "tr_1_7",
    text: "What roles are currently open or needed?",
    type: "text",
    section: "11. Team and Roles",
    placeholder: "Open positions or roles that need to be filled...",
  },
  {
    id: "tr_1_8",
    text: "What is the ideal team size?",
    type: "text",
    section: "11. Team and Roles",
    placeholder: "Target number of team members...",
  },
  {
    id: "tr_1_9",
    text: "What is the hiring plan for the next 12 months?",
    type: "text",
    section: "11. Team and Roles",
    placeholder: "Planned hiring timeline and priorities...",
  },
  {
    id: "tr_1_10",
    text: "What is the budget for new hires?",
    type: "text",
    section: "11. Team and Roles",
    placeholder: "Available budget for expanding the team...",
  },
  {
    id: "tr_1_11",
    text: "What roles should be prioritized for hiring?",
    type: "text",
    section: "11. Team and Roles",
    placeholder: "Most critical roles to fill first...",
  },
  {
    id: "tr_1_12",
    text: "What roles could be consolidated or eliminated?",
    type: "text",
    section: "11. Team and Roles",
    placeholder: "Potential efficiency opportunities in the org structure...",
  },

  // 11.2 Role Clarity (12 questions)
  {
    id: "tr_2_1",
    text: "What is the founder's role?",
    type: "text",
    section: "11. Team and Roles",
    placeholder: "Core responsibilities and focus areas for the founder...",
  },
  {
    id: "tr_2_2",
    text: "What should the founder stop doing?",
    type: "text",
    section: "11. Team and Roles",
    placeholder: "Tasks or responsibilities the founder should delegate...",
  },
  {
    id: "tr_2_3",
    text: "What should the founder start doing?",
    type: "text",
    section: "11. Team and Roles",
    placeholder: "High-value activities the founder should focus on...",
  },
  {
    id: "tr_2_4",
    text: "What decisions should only the founder make?",
    type: "text",
    section: "11. Team and Roles",
    placeholder: "Decision rights reserved for the founder...",
  },
  {
    id: "tr_2_5",
    text: "What decisions can others make?",
    type: "text",
    section: "11. Team and Roles",
    placeholder: "Decision authority that can be delegated...",
  },
  {
    id: "tr_2_6",
    text: "What are the boundaries of each role?",
    type: "text",
    section: "11. Team and Roles",
    placeholder: "What each role owns and what they don't...",
  },
  {
    id: "tr_2_7",
    text: "What are the key performance indicators for each role?",
    type: "text",
    section: "11. Team and Roles",
    placeholder: "How success is measured for each position...",
  },
  {
    id: "tr_2_8",
    text: "What are the development areas for each role?",
    type: "text",
    section: "11. Team and Roles",
    placeholder: "Skills or capabilities each role should develop...",
  },
  {
    id: "tr_2_9",
    text: "What is the career path for key roles?",
    type: "text",
    section: "11. Team and Roles",
    placeholder: "Growth and advancement opportunities...",
  },
  {
    id: "tr_2_10",
    text: "What cross-functional responsibilities exist?",
    type: "text",
    section: "11. Team and Roles",
    placeholder: "Responsibilities that span multiple roles or departments...",
  },
  {
    id: "tr_2_11",
    text: "What handoffs exist between roles?",
    type: "text",
    section: "11. Team and Roles",
    placeholder: "How work is passed between team members...",
  },
  {
    id: "tr_2_12",
    text: "What should AI know about each role?",
    type: "text",
    section: "11. Team and Roles",
    placeholder: "Key context about roles for AI assistance...",
  },

  // 11.3 Internal Communication (11 questions)
  {
    id: "tr_3_1",
    text: "What communication channels are used internally?",
    type: "text",
    section: "11. Team and Roles",
    placeholder: "Slack, email, meetings, project tools, etc....",
  },
  {
    id: "tr_3_2",
    text: "What channel should be used for what type of communication?",
    type: "text",
    section: "11. Team and Roles",
    placeholder: "Guidelines for which channel to use when...",
  },
  {
    id: "tr_3_3",
    text: "What are the expected response times?",
    type: "text",
    section: "11. Team and Roles",
    placeholder: "How quickly team members should respond on each channel...",
  },
  {
    id: "tr_3_4",
    text: "When should meetings be used vs. async?",
    type: "text",
    section: "11. Team and Roles",
    placeholder: "Criteria for synchronous vs. asynchronous communication...",
  },
  {
    id: "tr_3_5",
    text: "What information should be shared transparently?",
    type: "text",
    section: "11. Team and Roles",
    placeholder: "What the whole team should know vs. what stays private...",
  },
  {
    id: "tr_3_6",
    text: "What is the meeting culture?",
    type: "text",
    section: "11. Team and Roles",
    placeholder: "Norms and expectations for meetings...",
  },
  {
    id: "tr_3_7",
    text: "What is the feedback culture?",
    type: "text",
    section: "11. Team and Roles",
    placeholder: "How feedback is given and received...",
  },
  {
    id: "tr_3_8",
    text: "How are conflicts resolved?",
    type: "text",
    section: "11. Team and Roles",
    placeholder: "Process for addressing disagreements or issues...",
  },
  {
    id: "tr_3_9",
    text: "How is recognition and celebration handled?",
    type: "text",
    section: "11. Team and Roles",
    placeholder: "How wins and achievements are acknowledged...",
  },
  {
    id: "tr_3_10",
    text: "What are the working hours expectations?",
    type: "text",
    section: "11. Team and Roles",
    placeholder: "Core hours, flexibility, and availability norms...",
  },
  {
    id: "tr_3_11",
    text: "What should AI know about internal communication?",
    type: "text",
    section: "11. Team and Roles",
    placeholder: "Guidelines for AI involvement in team communication...",
  },

  // ============================================
  // SECTION 12: TECH STACK AND ACCESS MAP (30 questions)
  // ============================================

  // 12.1 Technology Inventory (18 questions)
  {
    id: "ts_1_1",
    text: "What is the primary website platform?",
    type: "text",
    section: "12. Tech Stack and Access Map",
    placeholder: "Main website builder or CMS...",
  },
  {
    id: "ts_1_2",
    text: "What email marketing platform is used?",
    type: "text",
    section: "12. Tech Stack and Access Map",
    placeholder: "Email service provider...",
  },
  {
    id: "ts_1_3",
    text: "What CRM is used?",
    type: "text",
    section: "12. Tech Stack and Access Map",
    placeholder: "Customer relationship management system...",
  },
  {
    id: "ts_1_4",
    text: "What payment processor is used?",
    type: "text",
    section: "12. Tech Stack and Access Map",
    placeholder: "Payment gateway or processor...",
  },
  {
    id: "ts_1_5",
    text: "What project management tool is used?",
    type: "text",
    section: "12. Tech Stack and Access Map",
    placeholder: "PM platform for task and project tracking...",
  },
  {
    id: "ts_1_6",
    text: "What communication tools are used?",
    type: "text",
    section: "12. Tech Stack and Access Map",
    placeholder: "Slack, Teams, email, video conferencing, etc....",
  },
  {
    id: "ts_1_7",
    text: "What file storage system is used?",
    type: "text",
    section: "12. Tech Stack and Access Map",
    placeholder: "Google Drive, Dropbox, SharePoint, etc....",
  },
  {
    id: "ts_1_8",
    text: "What accounting software is used?",
    type: "text",
    section: "12. Tech Stack and Access Map",
    placeholder: "QuickBooks, Xero, FreshBooks, etc....",
  },
  {
    id: "ts_1_9",
    text: "What scheduling tool is used?",
    type: "text",
    section: "12. Tech Stack and Access Map",
    placeholder: "Calendly, Acuity, SavvyCal, etc....",
  },
  {
    id: "ts_1_10",
    text: "What video conferencing tool is used?",
    type: "text",
    section: "12. Tech Stack and Access Map",
    placeholder: "Zoom, Google Meet, Microsoft Teams, etc....",
  },
  {
    id: "ts_1_11",
    text: "What course or membership platform is used?",
    type: "text",
    section: "12. Tech Stack and Access Map",
    placeholder: "Kajabi, Teachable, Circle, Mighty Networks, etc....",
  },
  {
    id: "ts_1_12",
    text: "What form builder is used?",
    type: "text",
    section: "12. Tech Stack and Access Map",
    placeholder: "Typeform, JotForm, Google Forms, etc....",
  },
  {
    id: "ts_1_13",
    text: "What analytics tools are used?",
    type: "text",
    section: "12. Tech Stack and Access Map",
    placeholder: "Google Analytics, Mixpanel, Amplitude, etc....",
  },
  {
    id: "ts_1_14",
    text: "What social media management tools are used?",
    type: "text",
    section: "12. Tech Stack and Access Map",
    placeholder: "Buffer, Hootsuite, Later, etc....",
  },
  {
    id: "ts_1_15",
    text: "What design tools are used?",
    type: "text",
    section: "12. Tech Stack and Access Map",
    placeholder: "Canva, Figma, Adobe Creative Suite, etc....",
  },
  {
    id: "ts_1_16",
    text: "What contract or document signing tool is used?",
    type: "text",
    section: "12. Tech Stack and Access Map",
    placeholder: "DocuSign, HelloSign, PandaDoc, etc....",
  },
  {
    id: "ts_1_17",
    text: "What password manager is used?",
    type: "text",
    section: "12. Tech Stack and Access Map",
    placeholder: "1Password, LastPass, Bitwarden, etc....",
  },
  {
    id: "ts_1_18",
    text: "What other critical tools are in the stack?",
    type: "text",
    section: "12. Tech Stack and Access Map",
    placeholder: "Any other essential software or platforms...",
  },

  // 12.2 Automations and Integrations (12 questions)
  {
    id: "ts_2_1",
    text: "What automations currently exist?",
    type: "text",
    section: "12. Tech Stack and Access Map",
    placeholder: "Automated workflows and processes...",
  },
  {
    id: "ts_2_2",
    text: "What tools are integrated?",
    type: "text",
    section: "12. Tech Stack and Access Map",
    placeholder: "Connected apps and platforms...",
  },
  {
    id: "ts_2_3",
    text: "What Zapier or Make workflows exist?",
    type: "text",
    section: "12. Tech Stack and Access Map",
    placeholder: "Automation platform workflows...",
  },
  {
    id: "ts_2_4",
    text: "What native integrations are used?",
    type: "text",
    section: "12. Tech Stack and Access Map",
    placeholder: "Direct integrations between tools...",
  },
  {
    id: "ts_2_5",
    text: "What manual processes should be automated?",
    type: "text",
    section: "12. Tech Stack and Access Map",
    placeholder: "Opportunities for automation...",
  },
  {
    id: "ts_2_6",
    text: "What data flows between systems?",
    type: "text",
    section: "12. Tech Stack and Access Map",
    placeholder: "How information moves between tools...",
  },
  {
    id: "ts_2_7",
    text: "What is the single source of truth for key data?",
    type: "text",
    section: "12. Tech Stack and Access Map",
    placeholder: "Primary system for contacts, revenue, etc....",
  },
  {
    id: "ts_2_8",
    text: "What access levels exist for each tool?",
    type: "text",
    section: "12. Tech Stack and Access Map",
    placeholder: "Who has access to what and at what permission level...",
  },
  {
    id: "ts_2_9",
    text: "What backup and security measures exist?",
    type: "text",
    section: "12. Tech Stack and Access Map",
    placeholder: "Data backup, security protocols, etc....",
  },
  {
    id: "ts_2_10",
    text: "What happens when a team member leaves?",
    type: "text",
    section: "12. Tech Stack and Access Map",
    placeholder: "Offboarding process for access removal...",
  },
  {
    id: "ts_2_11",
    text: "What tools are redundant or underutilized?",
    type: "text",
    section: "12. Tech Stack and Access Map",
    placeholder: "Tools that could be consolidated or eliminated...",
  },
  {
    id: "ts_2_12",
    text: "What should AI be allowed to access or configure?",
    type: "text",
    section: "12. Tech Stack and Access Map",
    placeholder: "Guidelines for AI access to tools and systems...",
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

  const persistResponses = async () => {
    const payload = questions
      .filter((q) => (answers[q.id] ?? "").toString().trim() !== "")
      .map((q) => ({
        questionId: q.id,
        questionText: q.text,
        section: q.section,
        answerText: answers[q.id] ?? "",
        value: answers[q.id] ?? "",
      }));
    try {
      await fetch("/api/assessments/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "brain", responses: payload }),
      });
    } catch (err) {
      console.error("brain save failed:", err);
    }
  };

  const handleNext = async () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setIsSaving(true);
      await persistResponses();
      setIsSaving(false);
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
      <div className="py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="border-[#4a9b9b]/30">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-[#4a9b9b]/10 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-[#4a9b9b]" />
              </div>
              <h1 className="text-2xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0] mb-4">
                Brain Assessment Complete!
              </h1>
              <p className="text-[#1a2b4a]/70 dark:text-[#F8F5F0]/70 mb-6">
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
    <div>
      {/* Header */}
      <div className="bg-[#1a2b4a] text-white py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-[#4a9b9b]/20 flex items-center justify-center">
              <Brain className="w-5 h-5 text-[#4a9b9b]" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Brain Assessment</h1>
              <p className="text-sm text-[#e8e4f0]">Systems & Operations</p>
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
        <Card className="border-[#4a9b9b]/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[#4a9b9b]">
                {currentQ.section}
              </span>
              <div className="flex items-center gap-2 text-sm text-[#b8a898]">
                <Save className="w-4 h-4" />
                {isSaving ? "Saving..." : lastSaved ? "Saved" : "Not saved"}
              </div>
            </div>
            <div className="mt-2">
              <Progress value={sectionProgress} variant="teal" className="h-1" />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <h2 className="text-xl font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">
              {currentQ.text}
            </h2>

            {currentQ.type === "radio" && currentQ.options && (
              <div className="space-y-3">
                {currentQ.options.map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      answers[currentQ.id] === option.value
                        ? "border-[#4a9b9b] bg-[#4a9b9b]/5"
                        : "border-[#c9a227]/20 hover:border-[#c9a227]/40"
                    }`}
                  >
                    <input
                      type="radio"
                      name={currentQ.id}
                      value={option.value}
                      checked={answers[currentQ.id] === option.value}
                      onChange={(e) => handleAnswer(e.target.value)}
                      className="mt-1 w-4 h-4 text-[#4a9b9b] focus:ring-[#4a9b9b]"
                    />
                    <span className="text-[#1a2b4a] dark:text-[#F8F5F0]">
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
                className="w-full p-4 rounded-xl border-2 border-[#c9a227]/20 focus:border-[#4a9b9b] focus:ring-2 focus:ring-[#4a9b9b]/20 outline-none resize-none bg-white dark:bg-[#1a1a2e] text-[#1a2b4a] dark:text-[#F8F5F0]"
              />
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between pt-6 border-t border-[#c9a227]/20">
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
                    ? "border-[#4a9b9b] bg-[#4a9b9b]/5"
                    : "border-[#c9a227]/20"
                }`}
              >
                <p className="text-sm font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">
                  {section}
                </p>
                <p className="text-xs text-[#b8a898] mt-1">
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
