"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import { Brain, ArrowLeft, ArrowRight, Save, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useAssessmentSync } from "@/lib/hooks/useAssessmentSync";

interface Question {
  id: string;
  text: string;
  type: "radio" | "text" | "number" | "multiselect";
  options?: { value: string; label: string }[];
  section: string;
  placeholder?: string;
  tip?: string;
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
    tip: "Use the exact name on your state filing or tax documents, including LLC or Inc. If you haven't registered yet, write your own name and note 'not registered yet'.",
  },
  {
    id: "bi_1_2",
    text: "What is the public-facing brand name?",
    type: "text",
    section: "1. Business Identity",
    placeholder: "The name customers know you by...",
    tip: "This is the name people actually say when they refer you. If you go by your personal name, write that.",
  },
  {
    id: "bi_1_3",
    text: "Are there any DBAs, sub-brands, programs, divisions, or product names?",
    type: "text",
    section: "1. Business Identity",
    placeholder: "List any alternate names, sub-brands, or product lines...",
    tip: "Include named programs, courses, podcasts, or workshops, plus any sister brands under the same entity. If there are none, simply write 'none'.",
  },
  {
    id: "bi_1_4",
    text: "What is the website URL?",
    type: "text",
    section: "1. Business Identity",
    placeholder: "Primary website address...",
    tip: "Paste the full address, like https://yoursite.com. No site yet? Write 'not yet' and list where people currently find you instead.",
  },
  {
    id: "bi_1_5",
    text: "What are all current public URLs connected to the business?",
    type: "text",
    section: "1. Business Identity",
    placeholder: "Landing pages, funnels, social profiles, etc....",
    tip: "Think booking pages, link-in-bio pages, sales pages, course platforms, and podcast feeds. A quick scan of your bookmarks or bio links usually catches them all.",
  },
  {
    id: "bi_1_6",
    text: "What social media channels are currently active?",
    type: "text",
    section: "1. Business Identity",
    placeholder: "List platforms and handles (Instagram, LinkedIn, etc.)...",
    tip: "Only list channels you post on or answer messages from at least monthly. Add the handle or link for each so it's easy to reference later.",
  },
  {
    id: "bi_1_7",
    text: "What email domains are used?",
    type: "text",
    section: "1. Business Identity",
    placeholder: "e.g., @company.com, @support.company.com...",
    tip: "List every domain your business sends email from. If you use a free address like Gmail for business, write that so we know.",
  },
  {
    id: "bi_1_8",
    text: "What physical location, region, or service area matters to the business?",
    type: "text",
    section: "1. Business Identity",
    placeholder: "Headquarters, service areas, or 'fully remote'...",
    tip: "Name your home base plus where your clients are located. Remote businesses can write 'fully remote' and any time zones or regions you favor.",
  },
  {
    id: "bi_1_9",
    text: "Is the business local, national, international, online, in-person, hybrid, or location-specific?",
    type: "multiselect",
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
    tip: "Check every option that describes how you serve clients today. Many coaches select both online and hybrid; choose what's true now, not where you're headed.",
  },
  {
    id: "bi_1_10",
    text: "What year was the business founded?",
    type: "number",
    section: "1. Business Identity",
    placeholder: "YYYY",
    tip: "Use the year you started taking paying clients or officially launched, whichever came first. A best guess is fine.",
  },
  {
    id: "bi_1_11",
    text: "Who founded the business?",
    type: "text",
    section: "1. Business Identity",
    placeholder: "Name(s) of founder(s)...",
    tip: "List each founder's name and, if helpful, their role at the start. Solo founders just write their own name.",
  },
  {
    id: "bi_1_12",
    text: "Who currently owns the business?",
    type: "text",
    section: "1. Business Identity",
    placeholder: "Current ownership structure...",
    tip: "Note who owns it and roughly what share, such as '100% me' or '60/40 with my partner'. Mention any investors or silent partners.",
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
    tip: "Choose the structure on file with your state today. If you've never registered anything, sole proprietorship is usually the right pick.",
  },
  {
    id: "bi_1_14",
    text: "What industry or category does the business operate in?",
    type: "text",
    section: "1. Business Identity",
    placeholder: "e.g., SaaS, coaching, e-commerce, healthcare...",
    tip: "Keep it to the broad bucket a stranger would recognize, like coaching, consulting, or professional services. You'll get room to get specific in the next question.",
  },
  {
    id: "bi_1_15",
    text: "What category does the business want to be known for?",
    type: "text",
    section: "1. Business Identity",
    placeholder: "The category you want to own in people's minds...",
    tip: "Describe the niche you'd love people to name when they introduce you, for example 'leadership coach for new nonprofit directors'. Aspirational answers are welcome here.",
  },
  {
    id: "bi_1_16",
    text: "What category does the business not want to be boxed into?",
    type: "text",
    section: "1. Business Identity",
    placeholder: "Categories you want to avoid being labeled as...",
    tip: "Think about the labels that make you cringe or attract the wrong clients. Writing 'not a life coach' or 'not a cheap freelancer' is a perfectly good answer.",
  },
  {
    id: "bi_1_17",
    text: "What is the simplest explanation of what the business does?",
    type: "text",
    section: "1. Business Identity",
    placeholder: "One sentence a child could understand...",
    tip: "Aim for one plain sentence with no buzzwords: who you help and what changes for them. Try saying it out loud before you type it.",
  },
  {
    id: "bi_1_18",
    text: "What is the more nuanced explanation of what the business does?",
    type: "text",
    section: "1. Business Identity",
    placeholder: "The deeper, more detailed explanation...",
    tip: "Here you can add your method, who it's really for, and what makes your approach different. Three to five sentences is plenty.",
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
    tip: "Pick the stage that matches your revenue and systems today. If you're between two, choose the earlier one; it leads to more useful recommendations.",
  },
  {
    id: "bi_1_20",
    text: "What does the business need most right now?",
    type: "text",
    section: "1. Business Identity",
    placeholder: "The single most important need at this moment...",
    tip: "Name one thing, such as more leads, a clearer offer, or time back. If several things compete, pick the one that would unlock the others.",
  },

  // 1.2 Business Snapshot (16 questions)
  {
    id: "bi_2_1",
    text: "What is the current annual revenue?",
    type: "text",
    section: "1. Business Identity",
    placeholder: "Approximate annual revenue or 'pre-revenue'...",
    tip: "A rough figure for the last 12 months works fine. Pre-revenue? Write 'pre-revenue' and any income you expect this year.",
  },
  {
    id: "bi_2_2",
    text: "What was last year's annual revenue?",
    type: "text",
    section: "1. Business Identity",
    placeholder: "Previous year's revenue for comparison...",
    tip: "Your tax return or accounting software will have this. If you weren't operating last year, write 'N/A, started in' and the year.",
  },
  {
    id: "bi_2_3",
    text: "What is the current monthly revenue average?",
    type: "text",
    section: "1. Business Identity",
    placeholder: "Average monthly revenue over last 3-6 months...",
    tip: "Add up the last three to six months and divide. If income is lumpy, mention your typical range, like '$2k to $8k'.",
  },
  {
    id: "bi_2_4",
    text: "What is the current monthly profit average?",
    type: "text",
    section: "1. Business Identity",
    placeholder: "Average monthly profit (revenue minus expenses)...",
    tip: "Subtract business expenses, including software and contractors, from your monthly revenue. Not tracked yet? Write 'not tracked yet' and your best estimate.",
  },
  {
    id: "bi_2_5",
    text: "What are the primary revenue streams?",
    type: "text",
    section: "1. Business Identity",
    placeholder: "List main sources of revenue...",
    tip: "List each way money comes in, such as 1:1 coaching, group programs, speaking, or digital products. Include small streams too; they can matter later.",
  },
  {
    id: "bi_2_6",
    text: "What percentage of revenue comes from each stream?",
    type: "text",
    section: "1. Business Identity",
    placeholder: "Approximate breakdown by percentage...",
    tip: "Rough percentages are fine as long as they add up to about 100. Use the same streams you listed in the previous question.",
  },
  {
    id: "bi_2_7",
    text: "What is the current team size?",
    type: "text",
    section: "1. Business Identity",
    placeholder: "Total number of team members (including contractors)...",
    tip: "Count everyone who works on the business regularly, including you, part-time help, and contractors. Something like '1 founder plus 2 contractors' is ideal.",
  },
  {
    id: "bi_2_8",
    text: "What are the main offers or services currently sold?",
    type: "text",
    section: "1. Business Identity",
    placeholder: "List current products/services with brief descriptions...",
    tip: "Give each offer a name, a one-line description, and its price if you know it. Include anything you've sold in the last six months.",
  },
  {
    id: "bi_2_9",
    text: "What is the current flagship offer?",
    type: "text",
    section: "1. Business Identity",
    placeholder: "Your main/most important offer...",
    tip: "This is usually the offer you talk about most or the one that brings in the most revenue. Pick one, even if it's still evolving.",
  },
  {
    id: "bi_2_10",
    text: "What is the highest-margin offer?",
    type: "text",
    section: "1. Business Identity",
    placeholder: "The offer with the best profit margin...",
    tip: "Look for the offer where you keep the most after costs and your time. If you're unsure, name the one with the highest price per hour of your effort.",
  },
  {
    id: "bi_2_11",
    text: "What is the easiest offer to sell?",
    type: "text",
    section: "1. Business Identity",
    placeholder: "The offer that requires least effort to convert...",
    tip: "Think about which offer people say yes to with the fewest calls or follow-ups. It's often a lower-priced entry offer or a referral favorite.",
  },
  {
    id: "bi_2_12",
    text: "What is the hardest offer to deliver?",
    type: "text",
    section: "1. Business Identity",
    placeholder: "The offer that takes most time/resources to fulfill...",
    tip: "Name the offer that drains the most time, energy, or custom work. Being honest here helps spot what to simplify or reprice.",
  },
  {
    id: "bi_2_13",
    text: "What is currently working well?",
    type: "text",
    section: "1. Business Identity",
    placeholder: "Areas of the business that are performing strongly...",
    tip: "Include wins in any area: referrals, client results, a channel that brings leads, or a process that runs smoothly. Bullet points are fine.",
  },
  {
    id: "bi_2_14",
    text: "What is currently not working?",
    type: "text",
    section: "1. Business Identity",
    placeholder: "Areas that are struggling or broken...",
    tip: "List what feels stuck, inconsistent, or frustrating, even if you don't know why yet. Short, candid notes are more useful than polished ones.",
  },
  {
    id: "bi_2_15",
    text: "What is the largest bottleneck in the business?",
    type: "text",
    section: "1. Business Identity",
    placeholder: "The #1 constraint limiting growth or progress...",
    tip: "Ask yourself what, if fixed tomorrow, would make everything else easier. Often it's lead flow, your own time, or an unclear offer.",
  },
  {
    id: "bi_2_16",
    text: "What is the biggest untapped opportunity?",
    type: "text",
    section: "1. Business Identity",
    placeholder: "The opportunity you're not yet capitalizing on...",
    tip: "Consider past clients you haven't followed up with, an audience you're not reaching, or an offer people keep asking for. A hunch is a fine starting point.",
  },
  {
    id: "bi_2_17",
    text: "What is the current growth goal?",
    type: "text",
    section: "1. Business Identity",
    placeholder: "Revenue, customer, or expansion targets...",
    tip: "Make it specific and time-bound, like '$10k months by June' or '5 new clients this quarter'. Early-stage? 'First 3 paying clients' is a great goal.",
  },
  {
    id: "bi_2_18",
    text: "What is the current operational goal?",
    type: "text",
    section: "1. Business Identity",
    placeholder: "Systems, processes, or efficiency targets...",
    tip: "Pick one system you want working better, such as onboarding, invoicing, or scheduling. Example: 'automate client onboarding by end of quarter'.",
  },
  {
    id: "bi_2_19",
    text: "What is the current client/customer experience goal?",
    type: "text",
    section: "1. Business Identity",
    placeholder: "Experience, satisfaction, or retention targets...",
    tip: "Describe how you want clients to feel or what you want them to do more of, like renew, refer, or finish the program. One clear target is enough.",
  },
  {
    id: "bi_2_20",
    text: "What would make the next 90 days successful?",
    type: "text",
    section: "1. Business Identity",
    placeholder: "Specific outcomes that would define success this quarter...",
    tip: "Picture yourself 90 days from now feeling relieved. List the two or three concrete outcomes that would make that true.",
  },

  // ============================================
  // SECTION 2: BUSINESS MODEL (28 questions)
  // ============================================

  // 2.1 Business Model Overview (20 questions)
  {
    id: "bm_1_1",
    text: "What type of business model do you currently operate?",
    type: "multiselect",
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
    tip: "Select every model that brings in money today. If you run 1:1 coaching plus a small course, check both.",
  },
  {
    id: "bm_1_2",
    text: "What do you sell?",
    type: "text",
    section: "2. Business Model",
    placeholder: "Describe your core products, services, or offers...",
    tip: "Describe what clients actually purchase, in their words if possible. A short list of offers with one line each works well.",
  },
  {
    id: "bm_1_3",
    text: "Who pays you?",
    type: "text",
    section: "2. Business Model",
    placeholder: "Who is the actual buyer/decision-maker with budget authority...",
    tip: "Name the person who signs off on the payment, such as the client, their employer, or an HR leader. This can differ from who you coach.",
  },
  {
    id: "bm_1_4",
    text: "Who receives the value?",
    type: "text",
    section: "2. Business Model",
    placeholder: "Who ultimately benefits from your product/service...",
    tip: "Describe who experiences the change, for example the employee being coached or the founder's team. If it's the same person who pays, say so.",
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
    tip: "Pick 'yes' if your clients pay for themselves. Choose the other option if a company, family member, or sponsor usually covers the cost.",
  },
  {
    id: "bm_1_6",
    text: "Is the business B2B, B2C, B2B2C, nonprofit, donor-supported, grant-funded, sponsorship-based, or hybrid?",
    type: "multiselect",
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
    tip: "Choose all that apply to how you're funded right now. Most solo coaches selling to individuals pick B2C; selling to companies is B2B.",
  },
  {
    id: "bm_1_7",
    text: "What is the average transaction value?",
    type: "text",
    section: "2. Business Model",
    placeholder: "Average dollar amount per transaction...",
    tip: "Divide total revenue by number of sales over a recent period. If you sell packages, the typical package price is a good stand-in.",
  },
  {
    id: "bm_1_8",
    text: "What is the average lifetime customer value?",
    type: "text",
    section: "2. Business Model",
    placeholder: "Total revenue expected from a customer over their entire relationship...",
    tip: "Multiply what a client spends per purchase by how many times they typically buy. Pre-revenue or too new to know? Write 'not tracked yet' and a best guess.",
  },
  {
    id: "bm_1_9",
    text: "What is the average sales cycle length?",
    type: "text",
    section: "2. Business Model",
    placeholder: "Time from first contact to purchase (days/weeks/months)...",
    tip: "Estimate the time from someone's first conversation with you to payment. Ranges are fine, like '1 to 3 weeks for referrals, longer from social'.",
  },
  {
    id: "bm_1_10",
    text: "What is the average delivery cycle length?",
    type: "text",
    section: "2. Business Model",
    placeholder: "Time from purchase to delivery/fulfillment completion...",
    tip: "Note how long it takes from payment to finishing the work, like '12 weeks' for a program. For ongoing services, write 'ongoing'.",
  },
  {
    id: "bm_1_11",
    text: "What is the average client retention period?",
    type: "text",
    section: "2. Business Model",
    placeholder: "How long customers typically stay with you...",
    tip: "Think about how many months a typical client stays or keeps buying. Mostly one-time clients? Write 'one engagement' and roughly what share return.",
  },
  {
    id: "bm_1_12",
    text: "What is the current customer acquisition model?",
    type: "text",
    section: "2. Business Model",
    placeholder: "How you currently attract and convert new customers...",
    tip: "Walk through how a stranger becomes a client today: where they find you, the next step, and how the sale happens. Referrals and word of mouth count.",
  },
  {
    id: "bm_1_13",
    text: "What is the current fulfillment model?",
    type: "text",
    section: "2. Business Model",
    placeholder: "How you deliver your product/service to customers...",
    tip: "Describe how the work gets delivered, such as weekly Zoom calls, a self-paced course, or done-for-you projects. Mention who does the delivery.",
  },
  {
    id: "bm_1_14",
    text: "What is the current renewal or repeat-purchase model?",
    type: "text",
    section: "2. Business Model",
    placeholder: "How you encourage ongoing purchases or renewals...",
    tip: "Explain what happens when an engagement ends: renewal offer, next-level program, or nothing yet. 'No renewal process yet' is an honest and useful answer.",
  },
  {
    id: "bm_1_15",
    text: "What part of the business model is strongest?",
    type: "text",
    section: "2. Business Model",
    placeholder: "The most robust, reliable part of your model...",
    tip: "Point to the piece that holds up even on a bad month, like strong referrals or great client results. One or two items is enough.",
  },
  {
    id: "bm_1_16",
    text: "What part of the business model is fragile?",
    type: "text",
    section: "2. Business Model",
    placeholder: "The weakest or most vulnerable part of your model...",
    tip: "Consider what would break if one client left, one platform changed, or you got sick for a month. That's usually the fragile spot.",
  },
  {
    id: "bm_1_17",
    text: "What part of the model is too dependent on the founder?",
    type: "text",
    section: "2. Business Model",
    placeholder: "Areas that require founder involvement to function...",
    tip: "List tasks that stop when you step away, such as sales calls, content, or client delivery. Most solopreneurs will name several, and that's normal.",
  },
  {
    id: "bm_1_18",
    text: "What part of the model needs simplification?",
    type: "text",
    section: "2. Business Model",
    placeholder: "Overly complex areas that could be streamlined...",
    tip: "Look for too many offers, confusing pricing, or steps clients trip over. If explaining it takes more than a minute, it likely belongs here.",
  },
  {
    id: "bm_1_19",
    text: "What part of the model needs better systems?",
    type: "text",
    section: "2. Business Model",
    placeholder: "Areas lacking clear processes or automation...",
    tip: "Name the tasks you redo by hand or keep forgetting, like follow-ups, scheduling, or invoicing. Those are prime candidates for systems.",
  },
  {
    id: "bm_1_20",
    text: "What part of the model is ready to scale?",
    type: "text",
    section: "2. Business Model",
    placeholder: "Areas that could handle increased volume...",
    tip: "Identify what could handle twice the clients without twice your hours, such as a group program or a digital product. 'Nothing yet' is a fine answer.",
  },

  // 2.2 Revenue Streams (8 questions - first stream example)
  {
    id: "bm_2_1",
    text: "What is the name of the revenue stream?",
    type: "text",
    section: "2. Business Model",
    placeholder: "e.g., Coaching Services, Digital Products, Membership Fees...",
    tip: "Use a short label you'd recognize on a spreadsheet, like 'Group Coaching' or 'Speaking'. You can pull it straight from your revenue streams list earlier.",
  },
  {
    id: "bm_2_2",
    text: "What offer, product, service, or program generates this revenue?",
    type: "text",
    section: "2. Business Model",
    placeholder: "The specific offer tied to this revenue stream...",
    tip: "Name the specific program or package tied to this stream. If several offers feed it, list the main one first.",
  },
  {
    id: "bm_2_3",
    text: "Who buys it?",
    type: "text",
    section: "2. Business Model",
    placeholder: "The target customer for this specific offer...",
    tip: "Describe the buyer for this offer in a phrase, such as 'mid-career women leaving corporate'. Be more specific than your overall audience if you can.",
  },
  {
    id: "bm_2_4",
    text: "What problem does it solve?",
    type: "text",
    section: "2. Business Model",
    placeholder: "The specific pain point this offer addresses...",
    tip: "State the struggle in the buyer's own words, the way they'd describe it on a discovery call. One clear problem beats a long list.",
  },
  {
    id: "bm_2_5",
    text: "What transformation or outcome does it create?",
    type: "text",
    section: "2. Business Model",
    placeholder: "The result customers achieve from this offer...",
    tip: "Describe the before and after: where clients start and where they land. Concrete results, like 'booked first paid client', are most useful.",
  },
  {
    id: "bm_2_6",
    text: "What is the price?",
    type: "text",
    section: "2. Business Model",
    placeholder: "The price point for this offer...",
    tip: "Include the full price and payment plan options, like '$3,000 or 3 payments of $1,100'. If pricing varies, give your typical range.",
  },
  {
    id: "bm_2_7",
    text: "Is the price fixed, custom, tiered, recurring, usage-based, donation-based, or project-based?",
    type: "multiselect",
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
    tip: "Select every model this offer uses. A program with a monthly payment plan might be both fixed and recurring.",
  },
  {
    id: "bm_2_8",
    text: "What is the gross margin?",
    type: "text",
    section: "2. Business Model",
    placeholder: "Approximate profit margin percentage for this stream...",
    tip: "Subtract direct costs like contractor pay, platform fees, and materials from the price, then divide by the price. Not sure? Write your best estimate and 'not tracked yet'.",
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
    tip: "Paint a concrete picture: revenue range, what you offer, who you serve, and how your week looks. Rough numbers are fine; you can refine them later.",
  },
  {
    id: "vs_1_2",
    text: "What is the 1-year vision?",
    type: "text",
    section: "3. Vision, Strategy, and Priorities",
    placeholder: "What does success look like one year from now...",
    tip: "Pick two or three things you could point to next year and say \"we did it,\" like a client count, a launched offer, or a revenue number.",
  },
  {
    id: "vs_1_3",
    text: "What is the 90-day vision?",
    type: "text",
    section: "3. Vision, Strategy, and Priorities",
    placeholder: "What are the key outcomes for the next quarter...",
    tip: "Keep this small and specific. Think finish lines you can actually reach this quarter, such as \"enroll 5 clients\" or \"launch the new website.\"",
  },
  {
    id: "vs_1_4",
    text: "What is the long-term purpose of the business?",
    type: "text",
    section: "3. Vision, Strategy, and Priorities",
    placeholder: "The deeper why that drives everything you do...",
    tip: "Write the reason you'd keep going even on a slow month. One or two honest sentences beat a polished mission statement.",
  },
  {
    id: "vs_1_5",
    text: "What does the business ultimately want to become?",
    type: "text",
    section: "3. Vision, Strategy, and Priorities",
    placeholder: "The ultimate expression or evolution of the business...",
    tip: "Dream a little here. A signature program, a small agency, a certification, a movement? Name the biggest version you can picture.",
  },
  {
    id: "vs_1_6",
    text: "What does the business not want to become?",
    type: "text",
    section: "3. Vision, Strategy, and Priorities",
    placeholder: "What you want to avoid or resist becoming...",
    tip: "Think about businesses you've seen and thought \"not that.\" Overworked, salesy, too big, too impersonal? Listing a few of these is enough.",
  },
  {
    id: "vs_1_7",
    text: "What level of revenue is desired?",
    type: "text",
    section: "3. Vision, Strategy, and Priorities",
    placeholder: "Target revenue goals (3-year, 1-year, 90-day)...",
    tip: "Give a number for each timeframe if you can, even a range. Pre-revenue? Write your first realistic target, like your first $1,000 month.",
  },
  {
    id: "vs_1_8",
    text: "What level of profit is desired?",
    type: "text",
    section: "3. Vision, Strategy, and Priorities",
    placeholder: "Target profit margins and amounts...",
    tip: "A simple answer works: a monthly take-home amount or a percentage you'd like to keep. If you're unsure, write what you need to pay yourself comfortably.",
  },
  {
    id: "vs_1_9",
    text: "What level of team size is desired?",
    type: "text",
    section: "3. Vision, Strategy, and Priorities",
    placeholder: "Ideal team size at each stage...",
    tip: "Include contractors and part-time help, not just employees. \"Just me plus a VA\" or \"no team, ever\" are both valid answers.",
  },
  {
    id: "vs_1_10",
    text: "What level of founder involvement is desired?",
    type: "text",
    section: "3. Vision, Strategy, and Priorities",
    placeholder: "How involved should the founder be in day-to-day operations...",
    tip: "Estimate hours per week and which tasks you still want to do yourself. Example: \"20 hours, mostly client sessions and content.\"",
  },
  {
    id: "vs_1_11",
    text: "What role should the founder eventually play?",
    type: "text",
    section: "3. Vision, Strategy, and Priorities",
    placeholder: "The founder's ideal role as the business matures...",
    tip: "Choose the hat you most want to keep: coach, visionary, CEO, or creator. Note what you'd gladly hand off to make room for it.",
  },
  {
    id: "vs_1_12",
    text: "What role should the team eventually play?",
    type: "text",
    section: "3. Vision, Strategy, and Priorities",
    placeholder: "How the team should function and contribute...",
    tip: "Describe what you'd trust others to run without you. Solo for now? Write how you'd want future help to support you.",
  },
  {
    id: "vs_1_13",
    text: "What does scale mean for this business?",
    type: "text",
    section: "3. Vision, Strategy, and Priorities",
    placeholder: "Your definition of scaling successfully...",
    tip: "Scale can mean more clients, higher prices, group programs, or fewer hours for the same income. Say which version fits you.",
  },
  {
    id: "vs_1_14",
    text: "What does sustainability mean for this business?",
    type: "text",
    section: "3. Vision, Strategy, and Priorities",
    placeholder: "How you define and achieve long-term sustainability...",
    tip: "Think about pace, energy, and cash flow you could keep up for years. What would need to be true for this not to burn you out?",
  },
  {
    id: "vs_1_15",
    text: "What does success look like beyond revenue?",
    type: "text",
    section: "3. Vision, Strategy, and Priorities",
    placeholder: "Non-financial measures of success and impact...",
    tip: "Consider freedom, health, family time, client results, or community impact. Pick the two or three that matter most to you.",
  },
  {
    id: "vs_1_16",
    text: "What does the business want to be known for?",
    type: "text",
    section: "3. Vision, Strategy, and Priorities",
    placeholder: "The reputation and legacy you want to build...",
    tip: "Imagine a past client describing you to a friend. The words you'd hope they use are a great answer here.",
  },
  {
    id: "vs_1_17",
    text: "What should the business be the obvious choice for?",
    type: "text",
    section: "3. Vision, Strategy, and Priorities",
    placeholder: "The specific problem or need you're the clear solution for...",
    tip: "Get narrow: a specific person with a specific problem. \"New managers who freeze in hard conversations\" works better than \"leaders.\"",
  },
  {
    id: "vs_1_18",
    text: "What should the business stop doing as it grows?",
    type: "text",
    section: "3. Vision, Strategy, and Priorities",
    placeholder: "Activities, offers, or approaches to phase out...",
    tip: "Look for tasks, offers, or client types that drain you or barely pay. If nothing comes to mind, start with what you dread most each week.",
  },
  {
    id: "vs_1_19",
    text: "What should the business protect as it grows?",
    type: "text",
    section: "3. Vision, Strategy, and Priorities",
    placeholder: "Values, qualities, or practices to preserve at all costs...",
    tip: "Name the things that make clients choose you, like personal attention, a certain tone, or a core value. These are your non-negotiables.",
  },
  {
    id: "vs_1_20",
    text: "What future is the business building toward?",
    type: "text",
    section: "3. Vision, Strategy, and Priorities",
    placeholder: "The ultimate future state you're working to create...",
    tip: "Zoom out past your own business to the change you want to see for your clients or industry. A sentence or two is plenty.",
  },

  // 3.2 Current Strategic Priorities (16 questions)
  {
    id: "vs_2_1",
    text: "What are the top 3 business priorities right now?",
    type: "text",
    section: "3. Vision, Strategy, and Priorities",
    placeholder: "List the three most important priorities in order...",
    tip: "List them in order of importance, one line each. If you have more than three, pick the ones that would make the biggest difference this quarter.",
  },
  {
    id: "vs_2_2",
    text: "Why are these the priorities?",
    type: "text",
    section: "3. Vision, Strategy, and Priorities",
    placeholder: "The reasoning and context behind these priorities...",
    tip: "Briefly connect each priority to a goal or a pain point. A quick \"because\" for each one is enough.",
  },
  {
    id: "vs_2_3",
    text: "Who owns each priority?",
    type: "text",
    section: "3. Vision, Strategy, and Priorities",
    placeholder: "The person or role responsible for each priority...",
    tip: "Solo? Writing \"me\" is fine. If others help, name the person or role next to each priority so ownership is clear.",
  },
  {
    id: "vs_2_4",
    text: "What deadlines or target dates exist?",
    type: "text",
    section: "3. Vision, Strategy, and Priorities",
    placeholder: "Key dates and milestones for each priority...",
    tip: "Add a target date to each priority, even a rough one like \"end of March.\" If there's no deadline yet, note that and suggest one.",
  },
  {
    id: "vs_2_5",
    text: "What projects support these priorities?",
    type: "text",
    section: "3. Vision, Strategy, and Priorities",
    placeholder: "Specific projects aligned with each priority...",
    tip: "Match projects to priorities, such as \"Priority 1: website refresh, email sequence.\" Small projects count too.",
  },
  {
    id: "vs_2_6",
    text: "What metrics prove progress?",
    type: "text",
    section: "3. Vision, Strategy, and Priorities",
    placeholder: "How you'll measure success for each priority...",
    tip: "Choose one number per priority that you can actually check, like leads per week or calls booked. Not tracking yet? Say so and pick one to start.",
  },
  {
    id: "vs_2_7",
    text: "What decisions are needed?",
    type: "text",
    section: "3. Vision, Strategy, and Priorities",
    placeholder: "Key decisions required to move forward...",
    tip: "List decisions you've been putting off, like pricing, hiring, or which offer to lead with. Note any deadline for each.",
  },
  {
    id: "vs_2_8",
    text: "What resources are needed?",
    type: "text",
    section: "3. Vision, Strategy, and Priorities",
    placeholder: "People, budget, tools, or time required...",
    tip: "Think in four buckets: people, money, tools, and time. Be honest about gaps, even if you're not sure how to fill them yet.",
  },
  {
    id: "vs_2_9",
    text: "What dependencies exist?",
    type: "text",
    section: "3. Vision, Strategy, and Priorities",
    placeholder: "What needs to happen before other things can proceed...",
    tip: "Look for \"can't do X until Y\" situations, such as needing a sales page before running ads. A short list is perfect.",
  },
  {
    id: "vs_2_10",
    text: "What risks could slow progress?",
    type: "text",
    section: "3. Vision, Strategy, and Priorities",
    placeholder: "Potential obstacles or challenges to watch for...",
    tip: "Include outside risks and personal ones, like limited time, cash flow, or a busy season. Naming them now makes them easier to plan around.",
  },
  {
    id: "vs_2_11",
    text: "What opportunities could accelerate progress?",
    type: "text",
    section: "3. Vision, Strategy, and Priorities",
    placeholder: "Potential catalysts or accelerators to leverage...",
    tip: "Think about warm referrals, partnerships, speaking invites, or an existing audience you haven't tapped. Small boosts count.",
  },
  {
    id: "vs_2_12",
    text: "What work should be paused to protect focus?",
    type: "text",
    section: "3. Vision, Strategy, and Priorities",
    placeholder: "Lower-priority work to temporarily set aside...",
    tip: "Pick projects that are nice to have but not moving your top priorities forward. Pausing is not quitting; you can revisit them later.",
  },
  {
    id: "vs_2_13",
    text: "What work is urgent but not important?",
    type: "text",
    section: "3. Vision, Strategy, and Priorities",
    placeholder: "Tasks that feel pressing but don't drive real value...",
    tip: "Think inbox, notifications, last-minute requests, or tweaks nobody would notice. These are good candidates to batch, delegate, or drop.",
  },
  {
    id: "vs_2_14",
    text: "What work is important but neglected?",
    type: "text",
    section: "3. Vision, Strategy, and Priorities",
    placeholder: "High-value work that's being pushed aside...",
    tip: "Usually this is the work that grows the business long term: follow-ups, systems, content, or rest. What keeps sliding to next week?",
  },
  {
    id: "vs_2_15",
    text: "What does the team need to understand about the current strategy?",
    type: "text",
    section: "3. Vision, Strategy, and Priorities",
    placeholder: "Key strategic context the team should know...",
    tip: "Write it like a quick briefing for a new helper. No team yet? Describe what any future contractor or assistant should know first.",
  },
  {
    id: "vs_2_16",
    text: "What should AI prioritize when helping with strategy?",
    type: "text",
    section: "3. Vision, Strategy, and Priorities",
    placeholder: "How AI should focus its strategic support...",
    tip: "Tell AI what to focus on and what to steer away from. Example: \"Favor ideas that save my time over ones that add new offers.\"",
  },

  // 3.3 Strategic Decision Rules (11 questions)
  {
    id: "vs_3_1",
    text: "How does the business decide what to say yes to?",
    type: "text",
    section: "3. Vision, Strategy, and Priorities",
    placeholder: "Your criteria for accepting opportunities...",
    tip: "List the questions you ask yourself before committing, like \"Does it pay well?\" or \"Does it fit my top priority?\" A simple checklist works.",
  },
  {
    id: "vs_3_2",
    text: "How does the business decide what to say no to?",
    type: "text",
    section: "3. Vision, Strategy, and Priorities",
    placeholder: "Your criteria for declining opportunities...",
    tip: "Think about past yeses you regretted. What did they have in common? Those patterns make strong criteria.",
  },
  {
    id: "vs_3_3",
    text: "What makes an opportunity aligned?",
    type: "text",
    section: "3. Vision, Strategy, and Priorities",
    placeholder: "Characteristics of opportunities that fit the business...",
    tip: "An aligned opportunity usually fits your ideal client, your values, and your current priorities. Name what that looks like for you.",
  },
  {
    id: "vs_3_4",
    text: "What makes an opportunity distracting?",
    type: "text",
    section: "3. Vision, Strategy, and Priorities",
    placeholder: "Red flags that indicate an opportunity is a distraction...",
    tip: "Think shiny and exciting but off-mission, low pay, or poor timing. Recalling one recent example can help you spot the signs.",
  },
  {
    id: "vs_3_5",
    text: "What types of clients, partnerships, or projects are automatic yeses?",
    type: "text",
    section: "3. Vision, Strategy, and Priorities",
    placeholder: "Characteristics that make something an immediate yes...",
    tip: "Be specific about what makes it instant, such as a referral from a trusted client or a project in your sweet spot. A few bullets is plenty.",
  },
  {
    id: "vs_3_6",
    text: "What types are automatic noes?",
    type: "text",
    section: "3. Vision, Strategy, and Priorities",
    placeholder: "Deal-breakers that make something an immediate no...",
    tip: "Write your deal-breakers plainly. Think of the projects, clients, or partners you'd turn down no matter the money.",
  },
  {
    id: "vs_3_7",
    text: "What criteria should be used before launching something new?",
    type: "text",
    section: "3. Vision, Strategy, and Priorities",
    placeholder: "Checklist for evaluating new initiatives...",
    tip: "A short checklist works: demand you've confirmed, time to build it, a clear buyer, and how it fits current offers. Add your own must-haves.",
  },
  {
    id: "vs_3_8",
    text: "What criteria should be used before retiring an offer?",
    type: "text",
    section: "3. Vision, Strategy, and Priorities",
    placeholder: "When and how to sunset products or services...",
    tip: "Consider low sales, high effort, poor results, or simply losing interest. Note how you'd care for current clients if you retire it.",
  },
  {
    id: "vs_3_9",
    text: "What criteria should be used before hiring?",
    type: "text",
    section: "3. Vision, Strategy, and Priorities",
    placeholder: "When to add team members and what to look for...",
    tip: "Think about the trigger, like steady revenue or a task eating 10+ hours a week. Then list the top qualities you'd look for.",
  },
  {
    id: "vs_3_10",
    text: "What criteria should be used before investing money?",
    type: "text",
    section: "3. Vision, Strategy, and Priorities",
    placeholder: "Framework for evaluating financial investments...",
    tip: "A simple rule helps, like \"must pay for itself within 6 months\" or \"under $500 without sleeping on it.\" Write the rules you already follow.",
  },
  {
    id: "vs_3_11",
    text: "What criteria should be used before entering a partnership?",
    type: "text",
    section: "3. Vision, Strategy, and Priorities",
    placeholder: "How to evaluate potential partnerships...",
    tip: "Think shared values, a similar audience, clear roles, and fair money terms. Note any lessons from partnerships that didn't work.",
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
    tip: "Describe one real person you loved working with: who they are, what they're dealing with, and why they hired you. Early-stage? Describe who you most want to serve.",
  },
  {
    id: "ic_1_2",
    text: "What industry are they in?",
    type: "text",
    section: "4. Ideal Clients and Market",
    placeholder: "The industry or industries your ideal clients work in...",
    tip: "List one main industry or a few related ones. If you serve individuals rather than businesses, describe their field of work or write \"varies.\"",
  },
  {
    id: "ic_1_3",
    text: "What role or title do they usually hold?",
    type: "text",
    section: "4. Ideal Clients and Market",
    placeholder: "Job titles, roles, or positions they typically have...",
    tip: "Include common titles or roles, like \"first-time manager\" or \"solo practice owner.\" For personal clients, describe their role in life instead.",
  },
  {
    id: "ic_1_4",
    text: "What size company, household, organization, or community do they represent?",
    type: "text",
    section: "4. Ideal Clients and Market",
    placeholder: "Size of their organization or sphere of influence...",
    tip: "A range is fine, like \"solo to 10 employees\" or \"families of 3 to 5.\" Pick what fits the people you serve best.",
  },
  {
    id: "ic_1_5",
    text: "What stage of life or business are they in?",
    type: "text",
    section: "4. Ideal Clients and Market",
    placeholder: "Life stage, career stage, or business maturity level...",
    tip: "Name the transition they're in, such as just launched, scaling past $100K, newly retired, or returning to work. Transitions often drive buying.",
  },
  {
    id: "ic_1_6",
    text: "What problem are they actively trying to solve?",
    type: "text",
    section: "4. Ideal Clients and Market",
    placeholder: "The pain point they are consciously aware of and seeking help for...",
    tip: "Use the version they'd type into a search bar or say on a discovery call. Keep it in their words, not yours.",
  },
  {
    id: "ic_1_7",
    text: "What problem do they not yet realize they have?",
    type: "text",
    section: "4. Ideal Clients and Market",
    placeholder: "The deeper issue they haven't recognized yet...",
    tip: "This is often the root under the surface problem, like a mindset, habit, or missing system. Think about what you usually uncover in session two or three.",
  },
  {
    id: "ic_1_8",
    text: "What do they want most?",
    type: "text",
    section: "4. Ideal Clients and Market",
    placeholder: "Their deepest desires and aspirations...",
    tip: "Go beyond the result to the feeling, like confidence, freedom, or relief. Pull phrases from past client conversations if you can.",
  },
  {
    id: "ic_1_9",
    text: "What are they afraid of?",
    type: "text",
    section: "4. Ideal Clients and Market",
    placeholder: "Their fears, anxieties, and worries...",
    tip: "Include practical and personal fears, such as wasting money, failing publicly, or letting family down. Honest answers make better messaging.",
  },
  {
    id: "ic_1_10",
    text: "What are they frustrated by?",
    type: "text",
    section: "4. Ideal Clients and Market",
    placeholder: "What frustrates or annoys them in their current situation...",
    tip: "Think about daily annoyances as well as big pain points. Quotes from discovery calls or emails are gold here.",
  },
  {
    id: "ic_1_11",
    text: "What have they already tried?",
    type: "text",
    section: "4. Ideal Clients and Market",
    placeholder: "Previous solutions, approaches, or attempts they've made...",
    tip: "List common attempts, like free content, courses, other coaches, apps, or going it alone. A quick bullet list is plenty.",
  },
  {
    id: "ic_1_12",
    text: "Why has it not worked?",
    type: "text",
    section: "4. Ideal Clients and Market",
    placeholder: "Why previous attempts failed to solve their problem...",
    tip: "Match each attempt to why it fell short, such as too generic, no accountability, or wrong timing. This shows why your approach is different.",
  },
  {
    id: "ic_1_13",
    text: "What are they ready for?",
    type: "text",
    section: "4. Ideal Clients and Market",
    placeholder: "What they are prepared to do, invest, or change...",
    tip: "Think about what a good-fit client will commit to: time, money, honest feedback, or real change. Be specific about the level of readiness.",
  },
  {
    id: "ic_1_14",
    text: "What are they not ready for?",
    type: "text",
    section: "4. Ideal Clients and Market",
    placeholder: "What they are not yet prepared to commit to or accept...",
    tip: "Note what would overwhelm them right now, like a big price tag or a long commitment. This helps shape entry offers and messaging.",
  },
  {
    id: "ic_1_15",
    text: "What do they need to believe before buying?",
    type: "text",
    section: "4. Ideal Clients and Market",
    placeholder: "Key beliefs or assumptions they must hold to make a purchase...",
    tip: "Write the beliefs that tip them into yes, such as \"this problem is solvable\" or \"I can't do it alone.\" Think about what your best clients believed.",
  },
  {
    id: "ic_1_16",
    text: "What do they need to trust before buying?",
    type: "text",
    section: "4. Ideal Clients and Market",
    placeholder: "Trust factors, credibility markers, or proof they need...",
    tip: "List proof that builds trust for your audience, like testimonials, credentials, a free call, or your own story. What did past clients mention?",
  },
  {
    id: "ic_1_17",
    text: "What objections do they typically have?",
    type: "text",
    section: "4. Ideal Clients and Market",
    placeholder: "Common concerns, hesitations, or objections they raise...",
    tip: "Write the top three you hear most, in their words, like \"I don't have time\" or \"I need to ask my spouse.\" No sales calls yet? Guess the likeliest.",
  },
  {
    id: "ic_1_18",
    text: "What language do they use to describe their problem?",
    type: "text",
    section: "4. Ideal Clients and Market",
    placeholder: "The exact words and phrases they use to talk about their challenges...",
    tip: "Use their exact phrases, slang and all. Check past emails, intake forms, reviews, or DMs for real wording.",
  },
  {
    id: "ic_1_19",
    text: "What language does the business use to describe the deeper problem?",
    type: "text",
    section: "4. Ideal Clients and Market",
    placeholder: "How you frame or articulate the problem at a deeper level...",
    tip: "This is your framing of the root cause. Compare it to the previous answer: how would you name what's really going on?",
  },
  {
    id: "ic_1_20",
    text: "What makes someone an excellent fit?",
    type: "text",
    section: "4. Ideal Clients and Market",
    placeholder: "Characteristics, qualities, or circumstances that indicate a perfect match...",
    tip: "Think about your favorite past clients and what they shared: traits, circumstances, habits, or values. Bullets work well.",
  },
  {
    id: "ic_1_21",
    text: "What makes someone an excellent fit? (continued)",
    type: "text",
    section: "4. Ideal Clients and Market",
    placeholder: "Additional factors that make someone an ideal client...",
    tip: "Add anything you left out above, like budget readiness, communication style, or how they found you. If you covered it all, write \"see above.\"",
  },

  // 4.2 Poor-Fit Clients (16 questions)
  {
    id: "ic_2_1",
    text: "Who is not a good fit?",
    type: "text",
    section: "4. Ideal Clients and Market",
    placeholder: "Types of people or organizations that are not suited for your offer...",
    tip: "Name the types of people or organizations you're not built to help. Clarity here saves time for both of you.",
  },
  {
    id: "ic_2_2",
    text: "What behaviors indicate poor fit?",
    type: "text",
    section: "4. Ideal Clients and Market",
    placeholder: "Actions or patterns that signal someone is not a good match...",
    tip: "Think about patterns like missed sessions, late payments, or skipping the work between calls. Recall a past client who struggled.",
  },
  {
    id: "ic_2_3",
    text: "What expectations indicate poor fit?",
    type: "text",
    section: "4. Ideal Clients and Market",
    placeholder: "Unrealistic or misaligned expectations that suggest poor fit...",
    tip: "List expectations you can't or won't meet, like overnight results or 24/7 access. These are good to address on the sales call.",
  },
  {
    id: "ic_2_4",
    text: "What budget issues indicate poor fit?",
    type: "text",
    section: "4. Ideal Clients and Market",
    placeholder: "Financial constraints or mismatches that make someone a poor fit...",
    tip: "Be direct: what budget range signals a mismatch, or what payment behavior worries you? A simple statement is enough.",
  },
  {
    id: "ic_2_5",
    text: "What mindset issues indicate poor fit?",
    type: "text",
    section: "4. Ideal Clients and Market",
    placeholder: "Attitudes, beliefs, or mental frameworks that don't align...",
    tip: "Think about blaming others, unwillingness to change, or wanting you to do the work for them. Name the mindsets that block results.",
  },
  {
    id: "ic_2_6",
    text: "What communication patterns indicate poor fit?",
    type: "text",
    section: "4. Ideal Clients and Market",
    placeholder: "Communication styles or habits that create friction...",
    tip: "Consider slow responses, constant boundary pushing, or disrespectful tone. Note anything that has caused friction before.",
  },
  {
    id: "ic_2_7",
    text: "What values mismatch indicates poor fit?",
    type: "text",
    section: "4. Ideal Clients and Market",
    placeholder: "Core values that don't align with your business...",
    tip: "Go back to your core values and name their opposites. Example: if you value honesty, someone who wants to cut corners is a mismatch.",
  },
  {
    id: "ic_2_8",
    text: "What urgency patterns indicate poor fit?",
    type: "text",
    section: "4. Ideal Clients and Market",
    placeholder: "Timing or urgency issues that suggest misalignment...",
    tip: "Think about both extremes: crisis mode that needs results tomorrow, or \"someday\" interest with no real intent. Which ones don't work for you?",
  },
  {
    id: "ic_2_9",
    text: "What past client problems should be avoided?",
    type: "text",
    section: "4. Ideal Clients and Market",
    placeholder: "Problems experienced with previous clients to watch for...",
    tip: "Share lessons learned without names, like scope creep, payment disputes, or ghosting. Each one points to a boundary or policy.",
  },
  {
    id: "ic_2_10",
    text: "What red flags should sales, onboarding, and AI recognize?",
    type: "text",
    section: "4. Ideal Clients and Market",
    placeholder: "Warning signs that should trigger caution or decline...",
    tip: "Combine your top warning signs from this section into a short list. You can reuse what you wrote in the poor-fit answers above.",
  },
  {
    id: "ic_2_11",
    text: "What should be said when someone is not a fit?",
    type: "text",
    section: "4. Ideal Clients and Market",
    placeholder: "How to gracefully decline or refer away poor-fit prospects...",
    tip: "Draft a kind, short script you'd actually say. Thank them, explain gently, and point them toward a better option if you have one.",
  },
  {
    id: "ic_2_12",
    text: "Are there referral options for poor-fit leads?",
    type: "text",
    section: "4. Ideal Clients and Market",
    placeholder: "Alternative resources or providers you can refer them to...",
    tip: "List people, programs, or free resources you trust to send them to. None yet? Write \"not yet\" and note who you'd like to find.",
  },
  {
    id: "ic_2_13",
    text: "Are there lower-tier offers for not-yet-ready leads?",
    type: "text",
    section: "4. Ideal Clients and Market",
    placeholder: "Entry-level offers or resources for leads who aren't ready for main offer...",
    tip: "Think free resources, a low-cost course, a workshop, or a waitlist. If you don't have one, say so and note any ideas.",
  },
  {
    id: "ic_2_14",
    text: "Are there situations where the business should decline payment?",
    type: "text",
    section: "4. Ideal Clients and Market",
    placeholder: "Circumstances where you should refuse to take someone's money...",
    tip: "Consider times you'd say no even if they're eager, such as when they need a different professional or can't truly afford it.",
  },
  {
    id: "ic_2_15",
    text: "What boundaries protect the business from poor-fit clients?",
    type: "text",
    section: "4. Ideal Clients and Market",
    placeholder: "Policies, practices, or boundaries that safeguard the business...",
    tip: "List what protects you now, like contracts, payment terms, intake forms, or office hours. Note any boundary you know you need to add.",
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
    tip: "Use the name clients actually see on your sales page or invoice. If it doesn't have one yet, give it a clear working name and mark it 'draft'.",
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
    tip: "Pick the status that's true today, not where you're headed. If you're still testing it with a few people, choose beta.",
  },
  {
    id: "op_1_3",
    text: "Who is the offer for?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "The specific ideal client this offer is designed for...",
    tip: "Describe one specific person and their situation, like 'new coaches in their first year who have clients but no system.' Specific beats broad here.",
  },
  {
    id: "op_1_4",
    text: "Who is the offer not for?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "Types of people or situations this offer is not suited for...",
    tip: "Think about past clients who weren't a good fit and why. Naming them here helps you and your team say no with confidence.",
  },
  {
    id: "op_1_5",
    text: "What problem does it solve?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "The specific pain point or challenge this offer addresses...",
    tip: "Write it the way a client would say it on a discovery call. Their words usually land better than polished marketing language.",
  },
  {
    id: "op_1_6",
    text: "What outcome does it promise?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "The specific result or deliverable clients can expect...",
    tip: "Focus on a concrete, observable result, such as 'a booked calendar' or 'a finished business plan.' Keep it to what you can honestly deliver.",
  },
  {
    id: "op_1_7",
    text: "What transformation does it create?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "The deeper change in identity, capability, or circumstance...",
    tip: "Go one layer deeper than the outcome: how do clients think, feel, or operate differently afterward? A short before-and-after sentence works well.",
  },
  {
    id: "op_1_8",
    text: "What is included?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "All components, deliverables, and inclusions in this offer...",
    tip: "A quick bulleted list is perfect. Include sessions, materials, and access so nothing gets left out of your sales or onboarding copy.",
  },
  {
    id: "op_1_9",
    text: "What is not included?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "What clients should not expect to receive (sets boundaries)...",
    tip: "Name the things people commonly assume they'll get, like unlimited messaging or done-for-you work. Clear limits prevent scope creep later.",
  },
  {
    id: "op_1_10",
    text: "What is the price?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "The current price point for this offer...",
    tip: "Enter the full price in your currency, plus any tier or early-bird prices. If you haven't set it yet, write 'not priced yet' and a working range.",
  },
  {
    id: "op_1_11",
    text: "Are there payment plans?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "Available payment plan options (e.g., 3 payments of $X)...",
    tip: "List each plan with the number of payments and amount, such as '3 x $400.' If you don't offer one, simply write 'pay in full only.'",
  },
  {
    id: "op_1_12",
    text: "Is there a guarantee, pledge, or refund policy?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "Details of any satisfaction guarantees or refund terms...",
    tip: "Paste your exact terms if you have them, including time limits and conditions. If there's no policy yet, say so; that's useful information too.",
  },
  {
    id: "op_1_13",
    text: "What is the delivery format?",
    type: "multiselect",
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
    tip: "Select every format clients actually receive in this offer today. If it mixes live calls with self-paced material, choose both.",
  },
  {
    id: "op_1_14",
    text: "What is the duration?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "How long the offer lasts (e.g., 6 weeks, 3 months, ongoing)...",
    tip: "Give a clear timeframe, or write 'ongoing' for memberships and retainers. If it varies by client, share the typical range.",
  },
  {
    id: "op_1_15",
    text: "What is the cadence?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "Frequency of delivery (e.g., weekly calls, daily access, self-paced)...",
    tip: "Describe the rhythm a client experiences, such as 'two calls a month plus weekday messaging.' Self-paced counts as a cadence too.",
  },
  {
    id: "op_1_16",
    text: "What access does the client receive?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "Type of access (Voxer, portal, calls, community, lifetime, limited time)...",
    tip: "Note both the channel and the time limit, like 'portal access for 12 months.' Lifetime access is worth stating clearly if you offer it.",
  },
  {
    id: "op_1_17",
    text: "What assets, templates, tools, calls, sessions, deliverables, or support are included?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "Comprehensive list of everything the client receives...",
    tip: "Go for the complete inventory here, including small extras like worksheets or recordings. You can build on your 'What is included' answer above.",
  },
  {
    id: "op_1_18",
    text: "What prerequisites exist?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "Requirements or preconditions for joining this offer...",
    tip: "Include anything a client needs first: a prior program, an existing business, a minimum revenue, or certain tools. 'None' is a fine answer.",
  },
  {
    id: "op_1_19",
    text: "What onboarding is required?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "Steps or process for getting new clients started...",
    tip: "List the first steps in order, such as contract, payment, intake form, then kickoff call. If it's informal right now, describe what usually happens.",
  },
  {
    id: "op_1_20",
    text: "What offboarding or completion process exists?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "How the offer concludes and what happens at completion...",
    tip: "Think about the final session, any wrap-up materials, testimonial requests, and next-offer invitations. If nothing formal exists yet, note that.",
  },
  {
    id: "op_1_21",
    text: "What internal resources are needed to deliver it?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "Time, materials, tools, or infrastructure required internally...",
    tip: "Estimate your weekly hours per client plus any tools, space, or materials. Rough numbers are fine and help with pricing decisions later.",
  },
  {
    id: "op_1_22",
    text: "What team members are involved?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "Roles or specific people needed to deliver this offer...",
    tip: "List roles, even if one person fills several. Solopreneurs can simply write 'just me' and note any contractors you call on.",
  },
  {
    id: "op_1_23",
    text: "What systems are used?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "Software, platforms, or tools used to deliver this offer...",
    tip: "Name the actual tools, like your scheduler, video platform, payment processor, and client portal. This helps spot overlap and gaps.",
  },
  {
    id: "op_1_24",
    text: "What client responsibilities are required?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "What clients must do or commit to for success...",
    tip: "Spell out what clients must show up for or complete, such as homework, attendance, or timely feedback. These protect your results.",
  },
  {
    id: "op_1_25",
    text: "What are the most common client wins?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "Typical results, breakthroughs, or successes clients experience...",
    tip: "Share the wins you hear most often, with a number or short quote if you have one. Early-stage? Describe the results from your first few clients.",
  },

  // 5.2 Offer Ladder (12 questions)
  {
    id: "op_2_1",
    text: "What is the free entry point into the business?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "Lead magnets, free workshops, content, or resources that attract prospects...",
    tip: "Include anything free that brings people in: a guide, a quiz, a webinar, or even a free consult. If you don't have one yet, write 'none yet.'",
  },
  {
    id: "op_2_2",
    text: "What low-ticket offer exists?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "Entry-level paid offer (typically under $100)...",
    tip: "Think books, mini-courses, templates, or short workshops. If nothing exists at this level, write 'none' and any idea you're considering.",
  },
  {
    id: "op_2_3",
    text: "What mid-ticket offer exists?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "Core offer at moderate price point (typically $100-$1000)...",
    tip: "For many service businesses this is a group program or short package. Add the name and price, or note that this tier is empty for now.",
  },
  {
    id: "op_2_4",
    text: "What high-ticket offer exists?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "Premium offer at higher price point (typically $1000+)...",
    tip: "List your signature program, intensive, or one-on-one package with its price. This is often the offer your business revolves around.",
  },
  {
    id: "op_2_5",
    text: "What premium or private offer exists?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "Highest-tier, exclusive, or private access offer...",
    tip: "This could be VIP days, private advising, or an invite-only tier. Leave a short 'not offered' if it doesn't exist; that's a common gap.",
  },
  {
    id: "op_2_6",
    text: "What recurring revenue offer exists?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "Memberships, subscriptions, or retainer-based offers...",
    tip: "Include anything billed monthly or yearly, like memberships or retainers. Note the price and how many members or clients you have if you know.",
  },
  {
    id: "op_2_7",
    text: "What event or live experience exists?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "Workshops, retreats, conferences, or live events...",
    tip: "Mention in-person or virtual events, retreats, or live workshops, with how often they run. Past or planned events count; just label which.",
  },
  {
    id: "op_2_8",
    text: "What backend offer exists?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "Offers for existing clients after completing main offer...",
    tip: "What do you offer clients after they finish your main program? Alumni groups, advanced coaching, or renewals all belong here.",
  },
  {
    id: "op_2_9",
    text: "What upgrade path exists?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "How clients move from lower-tier to higher-tier offers...",
    tip: "Describe how a client typically moves from one offer to the next, step by step. If it happens informally on calls, say that.",
  },
  {
    id: "op_2_10",
    text: "What downsell path exists?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "Alternative offers when main offer is not a fit or too expensive...",
    tip: "Note what you suggest when someone says the main offer is too much right now, such as a smaller package or a course. 'None yet' is okay.",
  },
  {
    id: "op_2_11",
    text: "What referral path exists?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "How clients are incentivized or enabled to refer others...",
    tip: "Include any referral fees, thank-you gifts, or simply 'I ask happy clients for introductions.' If you don't ask yet, note that honestly.",
  },
  {
    id: "op_2_12",
    text: "What continuation path exists?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "How clients continue their journey after completing an offer...",
    tip: "Think about what keeps a client engaged after completion, like renewals, maintenance calls, or community. This often overlaps with your backend offer.",
  },

  // 5.3 Pricing Logic (13 questions)
  {
    id: "op_3_1",
    text: "What is the current pricing for every offer?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "Complete list of all offers with their current prices...",
    tip: "A simple list of 'offer name: price' is all you need. You can pull these straight from your earlier offer answers.",
  },
  {
    id: "op_3_2",
    text: "Why is each offer priced that way?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "The reasoning and strategy behind each price point...",
    tip: "Share the real reasoning, whether it's time and value, market rates, or a gut call. 'I picked it to get started' is an honest, useful answer.",
  },
  {
    id: "op_3_3",
    text: "When was pricing last changed?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "Date of most recent pricing adjustments...",
    tip: "A month and year is plenty. If prices haven't changed since launch, write that and when you launched.",
  },
  {
    id: "op_3_4",
    text: "What pricing has been tested?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "Previous price points that were experimented with...",
    tip: "List any past prices and roughly how they performed. If you've only ever had one price, say so.",
  },
  {
    id: "op_3_5",
    text: "What pricing has worked best?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "Price points that generated best results (revenue, volume, satisfaction)...",
    tip: "Note which price brought in the most sales, best clients, or least hesitation. Not enough data yet? Share your best guess and mark it as one.",
  },
  {
    id: "op_3_6",
    text: "What pricing has caused friction?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "Price points that created resistance, objections, or low conversion...",
    tip: "Think about where you heard 'that's too much' or saw people stall at checkout. Pricing that felt too low to you counts as friction too.",
  },
  {
    id: "op_3_7",
    text: "What discounts are allowed?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "Types of discounts that are permitted and under what circumstances...",
    tip: "Include things like early-bird, pay-in-full, alumni, or referral discounts and when they apply. If you never discount, write that.",
  },
  {
    id: "op_3_8",
    text: "What discounts are not allowed?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "Discounts or pricing practices that are prohibited...",
    tip: "Write down the lines you won't cross, such as no custom deals or no discounts during enrollment. These rules help you and your team stay consistent.",
  },
  {
    id: "op_3_9",
    text: "Who can approve discounts?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "Roles or people with authority to offer discounts...",
    tip: "Name the role responsible, even if it's only you. If a team member can approve within limits, include those limits.",
  },
  {
    id: "op_3_10",
    text: "What payment plans are allowed?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "Approved payment plan structures and terms...",
    tip: "List the approved structures and any rules, like maximum number of payments or an added fee. You can reuse details from your offer answers above.",
  },
  {
    id: "op_3_11",
    text: "What refund policies exist?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "Terms and conditions for refunds by offer...",
    tip: "Summarize the refund terms for each offer in a line or two. If you haven't written a policy yet, note that so it becomes a task.",
  },
  {
    id: "op_3_12",
    text: "What guarantee language is approved?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "Specific wording and promises that can be made about results...",
    tip: "Paste the exact wording you're comfortable using publicly. If you don't offer guarantees, write what you can say instead, such as your commitment to clients.",
  },
  {
    id: "op_3_13",
    text: "What financial boundaries protect the business?",
    type: "text",
    section: "5. Offers, Products, and Services",
    placeholder: "Policies that protect revenue, margins, and financial health...",
    tip: "Think about deposits, late payment rules, cancellation fees, or a minimum project size. Even one rule you follow informally is worth writing down.",
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
    tip: "Try this shape: 'I help [who] achieve [result] through [how].' A rough draft is better than a blank; you can refine it later.",
  },
  {
    id: "mp_1_2",
    text: "What is the business the best at?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "The specific thing you do better than anyone else...",
    tip: "Think about what clients thank you for most often. Pick one thing, even if you're good at several.",
  },
  {
    id: "mp_1_3",
    text: "What is the business known for today?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "How the market currently perceives you...",
    tip: "Answer based on what people say when they refer you, not what you hope they say. If you're new, describe how friends or early clients describe you.",
  },
  {
    id: "mp_1_4",
    text: "What should it become known for?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "The reputation you want to build over time...",
    tip: "Picture what you'd want someone to say about you in three years. This gap between today and the goal shapes your messaging.",
  },
  {
    id: "mp_1_5",
    text: "What category does it own or want to own?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "The category you want to dominate or define...",
    tip: "Name the category in plain words, like 'faith-based leadership coaching' or 'operations support for solo founders.' Narrow is fine.",
  },
  {
    id: "mp_1_6",
    text: "What problem does the business solve better than others?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "The specific problem where you have unique expertise or approach...",
    tip: "Focus on where your approach or experience gives you an edge. A short example of a client you helped where others couldn't is very useful.",
  },
  {
    id: "mp_1_7",
    text: "What transformation does the business make possible?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "The before-and-after change clients experience...",
    tip: "A simple 'from ___ to ___' sentence works well here. If you answered a similar question for a specific offer, you can widen that answer.",
  },
  {
    id: "mp_1_8",
    text: "What is the unique mechanism behind the transformation?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "Your proprietary method, framework, or approach that creates results...",
    tip: "Name your method or framework and its main steps. If it isn't named yet, describe how you work differently and leave the name blank for now.",
  },
  {
    id: "mp_1_9",
    text: "What language is currently used to describe the business?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "Current messaging, taglines, and descriptive language...",
    tip: "Paste your current bio, tagline, or website headline. Copying it directly is faster and more accurate than paraphrasing.",
  },
  {
    id: "mp_1_10",
    text: "What language should be updated?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "Messaging that no longer fits or needs refreshing...",
    tip: "Note any phrases that feel outdated or no longer match who you serve. Quoting them exactly makes updates easy.",
  },
  {
    id: "mp_1_11",
    text: "What language should be protected?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "Messaging that works well and should be preserved...",
    tip: "List the phrases clients repeat back to you or that consistently get responses. These are worth keeping word for word.",
  },
  {
    id: "mp_1_12",
    text: "What language should be retired?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "Messaging that should be phased out completely...",
    tip: "Include words tied to old offers, old audiences, or a voice that no longer fits. If nothing needs retiring, simply write 'none.'",
  },
  {
    id: "mp_1_13",
    text: "What makes the business credible?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "Credentials, experience, results, or proof that builds trust...",
    tip: "List credentials, years of experience, client numbers, media features, and standout results. Rough counts are fine if you don't track exact figures.",
  },
  {
    id: "mp_1_14",
    text: "What makes the business distinctive?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "What sets you apart from competitors in a noticeable way...",
    tip: "Think about what people notice first or remember after meeting you. Your story, method, or audience can all set you apart.",
  },
  {
    id: "mp_1_15",
    text: "What makes the business trustworthy?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "Elements that create confidence and reduce perceived risk...",
    tip: "Include testimonials, clear policies, transparency in pricing, and your track record. Small things like quick replies count too.",
  },
  {
    id: "mp_1_16",
    text: "What makes the business urgent?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "Why prospects should act now rather than later...",
    tip: "Describe the cost of waiting for your client, such as lost income or stalled growth. Keep it honest rather than pressured.",
  },
  {
    id: "mp_1_17",
    text: "What makes the business relevant now?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "Current trends, timing, or market conditions that make you relevant...",
    tip: "Connect your work to something happening now in your industry or your clients' lives. A single clear reason is enough.",
  },
  {
    id: "mp_1_18",
    text: "What should prospects understand immediately?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "The key message that must land in the first few seconds...",
    tip: "Picture someone landing on your homepage for five seconds. What one idea must they walk away with? Keep it to a sentence.",
  },
  {
    id: "mp_1_19",
    text: "What should prospects feel immediately?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "The emotional response you want to create right away...",
    tip: "Choose two or three feelings, such as relief, hope, or being understood. Short words work best here.",
  },
  {
    id: "mp_1_20",
    text: "What is the simplest market-facing promise?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "The one-sentence promise you make to the market...",
    tip: "Aim for something you could say in one breath. It's fine if it closely mirrors your positioning statement.",
  },

  // 6.2 Messaging Pillars (16 questions)
  {
    id: "mp_2_1",
    text: "What are the 3 to 7 core messaging pillars of the business?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "List the key themes or pillars that support your positioning...",
    tip: "List short names for the themes you talk about again and again. If you're unsure, look at your last ten posts or talks for repeat topics.",
  },
  {
    id: "mp_2_2",
    text: "What does each pillar mean?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "Brief explanation of each messaging pillar...",
    tip: "Give each pillar one or two sentences in plain language. Keep the same order you used in the previous answer.",
  },
  {
    id: "mp_2_3",
    text: "What client problem does each pillar address?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "The specific problem each pillar speaks to...",
    tip: "Match each pillar to the client pain it speaks to. A simple 'Pillar: problem' list keeps it fast.",
  },
  {
    id: "mp_2_4",
    text: "What belief does each pillar challenge?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "The limiting belief each pillar helps overcome...",
    tip: "Think about the myth or 'should' each pillar pushes back on. One short line per pillar is plenty.",
  },
  {
    id: "mp_2_5",
    text: "What belief does each pillar install?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "The empowering belief each pillar creates...",
    tip: "Write the new belief you want clients to adopt, often the opposite of the one being challenged. Pair them up pillar by pillar.",
  },
  {
    id: "mp_2_6",
    text: "What story supports each pillar?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "The narrative or case study that illustrates each pillar...",
    tip: "Pick a personal or client story for each pillar, even in a few words. These become ready-made content and talking points.",
  },
  {
    id: "mp_2_7",
    text: "What proof supports each pillar?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "Data, testimonials, or evidence that validates each pillar...",
    tip: "Note testimonials, numbers, or results that back up each pillar. If proof is thin for one, write 'needs proof' so you know where to focus.",
  },
  {
    id: "mp_2_8",
    text: "What offer connects to each pillar?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "The specific offer or service tied to each pillar...",
    tip: "Link each pillar to the offer it naturally leads into. One offer can serve several pillars.",
  },
  {
    id: "mp_2_9",
    text: "What call to action connects to each pillar?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "The specific CTA associated with each pillar...",
    tip: "Name the next step for each, such as 'book a call' or 'download the guide.' Reusing the same CTA across pillars is perfectly fine.",
  },
  {
    id: "mp_2_10",
    text: "What content topics belong under each pillar?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "Content themes and topics for each pillar...",
    tip: "Brainstorm three to five topics per pillar. Questions clients ask you often make great starting points.",
  },
  {
    id: "mp_2_11",
    text: "What phrases belong under each pillar?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "Key phrases, taglines, or language for each pillar...",
    tip: "Collect signature phrases and sayings you naturally use under each pillar. Quoting yourself from calls or posts is ideal.",
  },
  {
    id: "mp_2_12",
    text: "What visuals belong under each pillar?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "Imagery, colors, or visual elements for each pillar...",
    tip: "Describe images, colors, or styles that fit each pillar, like 'bright workspace shots' or 'calm nature scenes.' Keep it simple if visuals aren't defined yet.",
  },
  {
    id: "mp_2_13",
    text: "What objections does each pillar answer?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "The objections or concerns each pillar addresses...",
    tip: "Think about the hesitations you hear on sales calls and which pillar answers each one. A short 'objection: pillar' list works well.",
  },
  {
    id: "mp_2_14",
    text: "What client outcome does each pillar point toward?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "The result or transformation each pillar leads to...",
    tip: "State the end result each pillar moves clients toward. These often echo the outcomes you listed for your offers.",
  },
  {
    id: "mp_2_15",
    text: "Which pillar is most important right now?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "The pillar that should be emphasized in current messaging...",
    tip: "Choose the one that best supports your current goal or launch. Pick a single pillar, even if others feel close.",
  },
  {
    id: "mp_2_16",
    text: "Which pillar should AI emphasize most?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "The pillar AI should prioritize in generated content...",
    tip: "This may match your answer above, or it may be the pillar that's hardest for you to write about. Name one and add a sentence on why.",
  },

  // 6.3 Brand Voice for Business Content (17 questions)
  {
    id: "mp_3_1",
    text: "How should the business sound publicly?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "The overall tone and voice for public-facing content...",
    tip: "Choose three to five descriptive words, such as 'warm, direct, grounded.' Adding a short example sentence helps a lot.",
  },
  {
    id: "mp_3_2",
    text: "How should the business sound in sales conversations?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "Tone and approach for sales calls and pitches...",
    tip: "Describe how you want prospects to feel on a call and how you handle hesitation. Clear and caring usually beats persuasive.",
  },
  {
    id: "mp_3_3",
    text: "How should the business sound in onboarding?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "Tone for welcoming and orienting new clients...",
    tip: "Think about what new clients need most right after buying: reassurance, clarity, or excitement. Describe that tone in a few words.",
  },
  {
    id: "mp_3_4",
    text: "How should the business sound in client delivery?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "Tone during service delivery and client interactions...",
    tip: "Describe how you show up during sessions and check-ins. If it matches your public voice, you can say so and note any differences.",
  },
  {
    id: "mp_3_5",
    text: "How should the business sound in support?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "Tone for customer support and problem resolution...",
    tip: "Consider how replies should feel when something goes wrong: calm, quick, and solution-focused, for example. A sample reply line is helpful.",
  },
  {
    id: "mp_3_6",
    text: "How should the business sound during conflict or repair?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "Tone for handling complaints, issues, or difficult situations...",
    tip: "Describe how you acknowledge a problem and make it right. Include anything you always or never say in these moments.",
  },
  {
    id: "mp_3_7",
    text: "How should the business sound in internal team communication?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "Tone for team meetings, Slack, and internal messages...",
    tip: "Solopreneurs can describe how they write to contractors or assistants. A few words like 'clear, kind, brief' are enough.",
  },
  {
    id: "mp_3_8",
    text: "What tone should be used for authority?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "How to sound authoritative and credible...",
    tip: "Think about how you sound when you know you're right: confident, specific, calm. Note any phrases that help you land it.",
  },
  {
    id: "mp_3_9",
    text: "What tone should be used for warmth?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "How to sound approachable and human...",
    tip: "Describe how you make people feel welcome, such as using names, sharing stories, or light humor. Examples help more than adjectives.",
  },
  {
    id: "mp_3_10",
    text: "What tone should be used for urgency?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "How to create urgency without being pushy...",
    tip: "Write how you'd announce a deadline or closing cart in your own words. Facts and clear dates usually feel better than pressure.",
  },
  {
    id: "mp_3_11",
    text: "What tone should be used for boundaries?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "How to set and enforce boundaries gracefully...",
    tip: "Describe how you say no or restate a policy while staying kind. A sample sentence you'd actually use is ideal.",
  },
  {
    id: "mp_3_12",
    text: "What tone should be avoided?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "Tones or approaches that don't fit the brand...",
    tip: "List the tones that make you cringe, like preachy, hyped, or overly formal. These help guide anyone writing for you, including AI.",
  },
  {
    id: "mp_3_13",
    text: "What language feels too corporate?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "Words, phrases, or styles that feel overly formal or stiff...",
    tip: "Jot down specific words that feel stiff to you, like 'leverage' or 'synergy.' A quick list is all this needs.",
  },
  {
    id: "mp_3_14",
    text: "What language feels too casual?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "Words, phrases, or styles that feel too informal or unprofessional...",
    tip: "Note slang, emojis, or shortcuts that don't fit your brand. If casual is fine in some places, say where.",
  },
  {
    id: "mp_3_15",
    text: "What language feels too salesy?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "Words, phrases, or tactics that feel pushy or manipulative...",
    tip: "List phrases or tactics that feel pushy to you, such as fake countdowns or 'last chance' language. Be as specific as you can.",
  },
  {
    id: "mp_3_16",
    text: "What language feels too vague?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "Words or phrases that are unclear, generic, or meaningless...",
    tip: "Name buzzwords that sound nice but say nothing, like 'unlock your potential.' Swapping them out makes your messaging sharper.",
  },
  {
    id: "mp_3_17",
    text: "What sample content best represents the business voice?",
    type: "text",
    section: "6. Messaging, Positioning, and Brand Intelligence",
    placeholder: "Examples of content that perfectly capture the brand voice...",
    tip: "Paste or link two or three pieces you're proud of, like an email, post, or page. Real samples teach your voice faster than descriptions.",
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
    tip: "Think about the very first moment someone raises a hand, like booking a discovery call, replying to an email, or sending a DM. List each path, even the informal ones.",
  },
  {
    id: "ss_1_2",
    text: "What are the lead sources?",
    type: "text",
    section: "7. Sales System",
    placeholder: "All channels and methods that generate leads (referrals, ads, content, etc.)...",
    tip: "Rank your sources from most to fewest leads, for example referrals, podcast guesting, Instagram. If you're early-stage, list where your first few clients actually came from.",
  },
  {
    id: "ss_1_3",
    text: "What qualifies someone as a lead?",
    type: "text",
    section: "7. Sales System",
    placeholder: "The minimum criteria that define someone as a potential prospect...",
    tip: "Keep it simple: who counts as a lead for you? An email signup, a booked call, or someone who fits your ideal client and has shared contact info.",
  },
  {
    id: "ss_1_4",
    text: "What qualifies someone as a warm lead?",
    type: "text",
    section: "7. Sales System",
    placeholder: "Behaviors or characteristics that indicate genuine interest...",
    tip: "Name the behaviors that show real interest, such as replying to emails, attending a workshop, or asking about pricing. Two or three clear signals are enough.",
  },
  {
    id: "ss_1_5",
    text: "What qualifies someone as sales-ready?",
    type: "text",
    section: "7. Sales System",
    placeholder: "The signals that indicate a lead is ready for direct sales engagement...",
    tip: "Describe the point where an invitation to buy feels natural, like a stated problem, a timeline, and budget awareness. If you go by gut feel, describe what that feel is based on.",
  },
  {
    id: "ss_1_6",
    text: "What is the first sales touchpoint?",
    type: "text",
    section: "7. Sales System",
    placeholder: "The initial contact method or moment in the sales process...",
    tip: "Write down what usually happens first, whether that's a free consult, a DM conversation, or a reply to an inquiry form. Include how they book it if there's a link.",
  },
  {
    id: "ss_1_7",
    text: "What happens before a sales call?",
    type: "text",
    section: "7. Sales System",
    placeholder: "Preparation, research, or materials shared before the call...",
    tip: "Include anything you send or review ahead of time: an intake form, a reminder email, a quick look at their website. Writing \"nothing yet\" is fine if that's true.",
  },
  {
    id: "ss_1_8",
    text: "What happens during a sales call?",
    type: "text",
    section: "7. Sales System",
    placeholder: "The structure, agenda, and flow of a typical sales conversation...",
    tip: "Outline your call in rough steps, for example: connect, explore their situation, share how you help, invite them in. Approximate timing for each part is helpful.",
  },
  {
    id: "ss_1_9",
    text: "What happens after a sales call?",
    type: "text",
    section: "7. Sales System",
    placeholder: "Follow-up actions, materials sent, and next steps after the call...",
    tip: "List what you do within a day or two of the call, like sending a recap, a payment link, or a proposal. Note anything that tends to slip.",
  },
  {
    id: "ss_1_10",
    text: "What follow-up sequence exists?",
    type: "text",
    section: "7. Sales System",
    placeholder: "The cadence and content of post-call follow-up communications...",
    tip: "Describe the timing and touchpoints, such as a recap email the same day, a check-in at three days, and a final note at a week. If you follow up case by case, say so.",
  },
  {
    id: "ss_1_11",
    text: "What CRM is used?",
    type: "text",
    section: "7. Sales System",
    placeholder: "The customer relationship management system and how it's used...",
    tip: "Name the tool and how you really use it. A spreadsheet, notes app, or your inbox counts. If you don't use one yet, write \"none yet.\"",
  },
  {
    id: "ss_1_12",
    text: "What pipeline stages exist?",
    type: "text",
    section: "7. Sales System",
    placeholder: "The stages leads move through from initial contact to close...",
    tip: "A basic example: New Inquiry, Call Booked, Proposal Sent, Won, Lost. List the stages you actually use, even if they only live in your head.",
  },
  {
    id: "ss_1_13",
    text: "What are the definitions of each pipeline stage?",
    type: "text",
    section: "7. Sales System",
    placeholder: "Clear criteria for what defines each stage of the pipeline...",
    tip: "For each stage you listed above, write one line on what has to happen for someone to move into it. Short and specific beats complete.",
  },
  {
    id: "ss_1_14",
    text: "Who owns each stage?",
    type: "text",
    section: "7. Sales System",
    placeholder: "The person or role responsible for moving leads through each stage...",
    tip: "If it's all you, write \"me, for every stage.\" If others help, name the role for each step, such as an assistant who books calls.",
  },
  {
    id: "ss_1_15",
    text: "What scripts are used?",
    type: "text",
    section: "7. Sales System",
    placeholder: "Approved scripts, talking points, or conversation frameworks...",
    tip: "Paste or summarize any opening lines, key questions, or closing language you lean on. A loose framework you repeat counts, even if it isn't written down.",
  },
  {
    id: "ss_1_16",
    text: "What sales assets are used?",
    type: "text",
    section: "7. Sales System",
    placeholder: "Presentations, one-pagers, case studies, demos, or other sales materials...",
    tip: "List the materials you share with prospects, like a services PDF, testimonials page, or slide deck. Note which ones you'd like to create but don't have yet.",
  },
  {
    id: "ss_1_17",
    text: "What proposal process exists?",
    type: "text",
    section: "7. Sales System",
    placeholder: "How proposals are created, customized, and delivered...",
    tip: "Explain how a proposal gets made and sent, for example a template you customize in a doc tool. If you skip proposals and go straight to a payment link, say that.",
  },
  {
    id: "ss_1_18",
    text: "What contract process exists?",
    type: "text",
    section: "7. Sales System",
    placeholder: "How contracts are generated, reviewed, signed, and stored...",
    tip: "Cover how agreements are created, signed, and saved, such as an e-signature tool and a cloud folder. If you work without contracts today, note that honestly.",
  },
  {
    id: "ss_1_19",
    text: "What payment process exists?",
    type: "text",
    section: "7. Sales System",
    placeholder: "How payments are collected, processed, and confirmed...",
    tip: "Name your payment tool, whether you offer payment plans, and how you confirm payment came through. Include who handles failed payments.",
  },
  {
    id: "ss_1_20",
    text: "What handoff happens after the sale?",
    type: "text",
    section: "7. Sales System",
    placeholder: "How closed deals are transitioned to delivery or onboarding teams...",
    tip: "Describe what kicks off once someone says yes: a welcome email, onboarding form, or first session booking. Note who triggers it and how quickly.",
  },

  // 7.2 Sales Philosophy (15 questions)
  {
    id: "ss_2_1",
    text: "What does ethical sales mean to the business?",
    type: "text",
    section: "7. Sales System",
    placeholder: "The principles and values that guide sales behavior...",
    tip: "Put it in your own words, like \"no pressure, full transparency, and only selling when I can actually help.\" A few guiding principles work well here.",
  },
  {
    id: "ss_2_2",
    text: "What sales tactics are allowed?",
    type: "text",
    section: "7. Sales System",
    placeholder: "Approaches, techniques, and methods that are approved for use...",
    tip: "List the approaches you're comfortable using, such as honest follow-up, real deadlines, or sharing client stories with permission.",
  },
  {
    id: "ss_2_3",
    text: "What sales tactics are not allowed?",
    type: "text",
    section: "7. Sales System",
    placeholder: "Approaches, techniques, and methods that are prohibited...",
    tip: "Name your hard lines, for example fake countdown timers, guilt-based closing, or pressuring someone to decide on the call.",
  },
  {
    id: "ss_2_4",
    text: "How should urgency be communicated?",
    type: "text",
    section: "7. Sales System",
    placeholder: "The appropriate way to convey time-sensitive opportunities...",
    tip: "Describe when urgency is real for you, like an actual enrollment date or price increase, and how you'd phrase it without pressure.",
  },
  {
    id: "ss_2_5",
    text: "How should scarcity be communicated?",
    type: "text",
    section: "7. Sales System",
    placeholder: "The appropriate way to convey limited availability...",
    tip: "If you have genuine limits, such as only four client spots a month, explain how you'd mention them. If scarcity doesn't apply, say you don't use it.",
  },
  {
    id: "ss_2_6",
    text: "How should pricing be communicated?",
    type: "text",
    section: "7. Sales System",
    placeholder: "The approach to discussing price, value, and investment...",
    tip: "Share when and how price comes up, for example stated upfront on your site or shared after the call. Include how you connect price to results.",
  },
  {
    id: "ss_2_7",
    text: "How should objections be handled?",
    type: "text",
    section: "7. Sales System",
    placeholder: "The general approach to addressing prospect concerns...",
    tip: "Describe your general stance, like getting curious and asking questions before answering. Specific objections come up in the next set, so keep this broad.",
  },
  {
    id: "ss_2_8",
    text: "How should hesitation be handled?",
    type: "text",
    section: "7. Sales System",
    placeholder: "The approach when prospects are unsure or need more time...",
    tip: "Explain what you offer someone who isn't ready, such as more time, a resource, or a follow-up date they choose.",
  },
  {
    id: "ss_2_9",
    text: "How should a poor-fit prospect be handled?",
    type: "text",
    section: "7. Sales System",
    placeholder: "The approach when someone is not a good match for the offer...",
    tip: "Write how you'd tell someone you're not the right fit, and whether you refer them elsewhere. A sample sentence you'd actually say is useful.",
  },
  {
    id: "ss_2_10",
    text: "How should a no be handled?",
    type: "text",
    section: "7. Sales System",
    placeholder: "The approach when a prospect declines the offer...",
    tip: "Share how you respond to a clear no, for instance thanking them, offering to stay in touch, and not pushing further.",
  },
  {
    id: "ss_2_11",
    text: "What sales tone feels aligned?",
    type: "text",
    section: "7. Sales System",
    placeholder: "The voice, energy, and approach that fits the brand...",
    tip: "Choose three to five words that describe how you want sales to feel, like calm, direct, and caring. A short example phrase helps too.",
  },
  {
    id: "ss_2_12",
    text: "What sales tone feels manipulative?",
    type: "text",
    section: "7. Sales System",
    placeholder: "The voice, energy, and approach that should be avoided...",
    tip: "Name the tones that make you cringe, such as hype-heavy, salesy, or overly familiar. Think about pitches you've received and disliked.",
  },
  {
    id: "ss_2_13",
    text: "What should never be promised?",
    type: "text",
    section: "7. Sales System",
    placeholder: "Outcomes, guarantees, or results that should not be committed to...",
    tip: "List outcomes you can't guarantee, like specific income numbers, weight loss, or a job offer. Include anything that depends mostly on the client's effort.",
  },
  {
    id: "ss_2_14",
    text: "What should never be exaggerated?",
    type: "text",
    section: "7. Sales System",
    placeholder: "Claims, statistics, or capabilities that must be stated accurately...",
    tip: "Think results, client counts, credentials, and timelines. Note anything that must be stated exactly as it is, such as \"over 50 clients\" rather than a rounded-up number.",
  },
  {
    id: "ss_2_15",
    text: "What should AI be allowed to draft for sales?",
    type: "text",
    section: "7. Sales System",
    placeholder: "The boundaries for AI-generated sales content and communications...",
    tip: "Be specific about what AI can draft, such as follow-up emails or call recaps, and what needs your personal review or should never be automated.",
  },

  // 7.3 Objection Handling (10+ categories)
  {
    id: "ss_3_1",
    text: "How should price objections be handled?",
    type: "text",
    section: "7. Sales System",
    placeholder: "Responses and approaches for 'It's too expensive' or budget concerns...",
    tip: "Share how you talk about value versus cost, and any options you offer, like payment plans or a smaller starter package. Include a phrase you'd actually say.",
  },
  {
    id: "ss_3_2",
    text: "How should time objections be handled?",
    type: "text",
    section: "7. Sales System",
    placeholder: "Responses for 'I don't have time' or scheduling concerns...",
    tip: "Explain how much time your work truly requires each week and how you help busy clients fit it in. Honesty here builds trust.",
  },
  {
    id: "ss_3_3",
    text: "How should trust objections be handled?",
    type: "text",
    section: "7. Sales System",
    placeholder: "Responses for 'How do I know this will work?' or credibility concerns...",
    tip: "Point to what builds credibility for you: testimonials, case stories, your process, or a guarantee if you offer one. Pre-revenue? Mention your background and approach.",
  },
  {
    id: "ss_3_4",
    text: "How should readiness objections be handled?",
    type: "text",
    section: "7. Sales System",
    placeholder: "Responses for 'I'm not ready' or timing concerns...",
    tip: "Describe how you help someone tell the difference between real readiness concerns and fear, and when you'd agree it's better to wait.",
  },
  {
    id: "ss_3_5",
    text: "How should spouse or partner approval objections be handled?",
    type: "text",
    section: "7. Sales System",
    placeholder: "Responses for 'I need to check with my partner/spouse'...",
    tip: "Many coaches invite the partner to a quick call or send a summary to share at home. Write what you offer and how you keep it respectful.",
  },
  {
    id: "ss_3_6",
    text: "How should team approval objections be handled?",
    type: "text",
    section: "7. Sales System",
    placeholder: "Responses for 'I need to get my team's buy-in' or stakeholder approval...",
    tip: "Note what you provide to help them get buy-in, like a one-page overview or ROI summary. Skip this if you only sell to individuals.",
  },
  {
    id: "ss_3_7",
    text: "How should past disappointment objections be handled?",
    type: "text",
    section: "7. Sales System",
    placeholder: "Responses for 'I've tried something like this before and it didn't work'...",
    tip: "Explain how you acknowledge what didn't work before and what's genuinely different about your approach. Avoid criticizing other providers.",
  },
  {
    id: "ss_3_8",
    text: "How should fear of failure objections be handled?",
    type: "text",
    section: "7. Sales System",
    placeholder: "Responses for 'What if I fail?' or fear-based concerns...",
    tip: "Write how you normalize the fear and explain the support built into your work, such as check-ins, accountability, or a clear plan.",
  },
  {
    id: "ss_3_9",
    text: "How should fear of success objections be handled?",
    type: "text",
    section: "7. Sales System",
    placeholder: "Responses for concerns about handling success or its consequences...",
    tip: "This one is often unspoken, like worrying about visibility or change at home. Describe how you'd name it gently and explore it with them.",
  },
  {
    id: "ss_3_10",
    text: "How should 'too busy' objections be handled?",
    type: "text",
    section: "7. Sales System",
    placeholder: "Responses for 'I'm too busy right now' or capacity concerns...",
    tip: "Different from a time objection, this is about overload. Share how you'd ask whether being too busy is the very problem they need help with.",
  },
  {
    id: "ss_3_11",
    text: "How should 'not sure it will work' objections be handled?",
    type: "text",
    section: "7. Sales System",
    placeholder: "Responses for skepticism about effectiveness or outcomes...",
    tip: "Describe the proof or process you'd share, plus any guarantee, trial, or smaller first step. If you're new, explain how you'd answer honestly.",
  },
  {
    id: "ss_3_12",
    text: "How should 'need to think about it' objections be handled?",
    type: "text",
    section: "7. Sales System",
    placeholder: "Responses for prospects who want time to consider...",
    tip: "A common approach is asking what specifically they want to think through, then setting a clear follow-up time. Write your version.",
  },
  {
    id: "ss_3_13",
    text: "How should 'need more information' objections be handled?",
    type: "text",
    section: "7. Sales System",
    placeholder: "Responses for requests for additional details or clarification...",
    tip: "List the details people usually ask for and where you send them, such as an FAQ page or program overview. Note if you'd follow up with a call.",
  },
  {
    id: "ss_3_14",
    text: "How should 'prefer to do it alone' objections be handled?",
    type: "text",
    section: "7. Sales System",
    placeholder: "Responses for prospects who want to solve the problem independently...",
    tip: "Explain how you respect their independence while showing what support adds, like speed, accountability, or an outside view.",
  },
  {
    id: "ss_3_15",
    text: "How should 'waiting for the right time' objections be handled?",
    type: "text",
    section: "7. Sales System",
    placeholder: "Responses for 'The timing isn't right' or future-planning delays...",
    tip: "Share how you'd explore what \"the right time\" would look like and what waiting may cost them. Keep it supportive, not pushy.",
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
    tip: "Add your website URL and note the main pages people visit, such as home, about, services, and booking. If it's still in progress, say so.",
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
    tip: "Pick the status that's true today. If your site is live but you rarely update it, \"active\" still fits; use \"planned\" if it isn't built yet.",
  },
  {
    id: "ms_1_3",
    text: "What is the purpose of the Website channel?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Primary purpose and goals for this channel...",
    tip: "Say what your site is mainly for, like booking calls, building credibility, or growing your email list. One main job plus one or two secondary goals is plenty.",
  },
  {
    id: "ms_1_4",
    text: "Who is the audience on the Website channel?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "The specific audience this channel reaches...",
    tip: "Describe who usually lands on your site and why, for example referrals checking you out before a consult or people searching for a specific problem.",
  },
  {
    id: "ms_1_5",
    text: "What content performs best on the Website channel?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Types of content that get the best engagement...",
    tip: "Think about pages or posts that get the most visits, time on page, or inquiries, such as your about page or a popular blog post. Best guess is fine.",
  },
  {
    id: "ms_1_6",
    text: "What content performs poorly on the Website channel?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Types of content that underperform...",
    tip: "Note pages that rarely get clicks or never lead to inquiries. If you don't track website analytics yet, write \"not tracked yet.\"",
  },
  {
    id: "ms_1_7",
    text: "How often is content published on the Website channel?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Publishing frequency and schedule...",
    tip: "Include blog posts, new pages, or updates. If the site is mostly static, write something like \"updated a few times a year.\"",
  },
  {
    id: "ms_1_8",
    text: "Who creates the content for the Website channel?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Person or role responsible for content creation...",
    tip: "Name who writes and designs site content: you, a web designer, a copywriter, or AI tools you edit. List each role if it's split.",
  },
  {
    id: "ms_1_9",
    text: "Who approves the content for the Website channel?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Person or role responsible for content approval...",
    tip: "Who gives the final okay before something goes live on your site? If it's just you, write \"me.\"",
  },
  {
    id: "ms_1_10",
    text: "What tools are used for the Website channel?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Software, platforms, and tools used...",
    tip: "List your website platform, plus any add-ons like booking, forms, analytics, or SEO tools. Include the tools even if you barely use them.",
  },
  {
    id: "ms_1_11",
    text: "What metrics are tracked for the Website channel?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Key performance indicators and metrics...",
    tip: "Common website metrics are visitors, top pages, and form or booking submissions. If you don't check any yet, say so and note what you'd like to track.",
  },
  {
    id: "ms_1_12",
    text: "What call to action is used on the Website channel?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Primary CTA and any secondary CTAs...",
    tip: "Write your main button text, such as \"Book a free call,\" and any secondary ones like \"Download the guide.\"",
  },
  {
    id: "ms_1_13",
    text: "What lead magnet or offer is promoted on the Website channel?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Lead magnets, offers, or incentives promoted...",
    tip: "Name any free resource or offer featured on your site, like a quiz, checklist, or discovery call. If there isn't one yet, write \"none yet.\"",
  },
  {
    id: "ms_1_14",
    text: "What is the current conversion rate for the Website channel?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Current conversion rates and benchmarks...",
    tip: "Visitors who book or sign up divided by total visitors gives you this. If you don't have the numbers, write \"not tracked yet\" and a rough guess.",
  },
  {
    id: "ms_1_15",
    text: "What improvements are needed for the Website channel?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Areas for improvement and optimization...",
    tip: "List what you'd fix first, such as unclear messaging, slow pages, missing testimonials, or a hard-to-find booking link.",
  },

  // 8.1 Marketing Channels - Email (15 questions)
  {
    id: "ms_2_1",
    text: "What is the channel? (Email)",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Email",
    tip: "Name your email platform and list type, for example a weekly newsletter or occasional updates. If you're not emailing yet, note that.",
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
    tip: "Choose based on what you're doing right now. If you have a list but haven't sent anything in months, \"inactive\" is the honest pick.",
  },
  {
    id: "ms_2_3",
    text: "What is the purpose of the Email channel?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Primary purpose and goals for this channel...",
    tip: "State what email is for in your business, like nurturing leads, sharing insights, or announcing offers. Most solopreneurs have one primary goal here.",
  },
  {
    id: "ms_2_4",
    text: "Who is the audience on the Email channel?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "The specific audience this channel reaches...",
    tip: "Describe who's on your list, such as past clients, lead magnet downloaders, or workshop attendees. A rough mix is helpful.",
  },
  {
    id: "ms_2_5",
    text: "What content performs best on the Email channel?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Types of content that get the best engagement...",
    tip: "Look for emails with higher opens, replies, or clicks. Personal stories, quick tips, and behind-the-scenes notes often stand out.",
  },
  {
    id: "ms_2_6",
    text: "What content performs poorly on the Email channel?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Types of content that underperform...",
    tip: "Note email types that get low opens or unsubscribes, like long promotional emails. If you haven't spotted a pattern, write \"not sure yet.\"",
  },
  {
    id: "ms_2_7",
    text: "How often is content published on the Email channel?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Publishing frequency and schedule...",
    tip: "Give your real sending rhythm, like weekly on Tuesdays or a couple of times a month. Irregular is a valid answer.",
  },
  {
    id: "ms_2_8",
    text: "Who creates the content for the Email channel?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Person or role responsible for content creation...",
    tip: "Who writes your emails? You, an assistant, a copywriter, or AI drafts you edit. Mention who formats and schedules them if that's different.",
  },
  {
    id: "ms_2_9",
    text: "Who approves the content for the Email channel?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Person or role responsible for content approval...",
    tip: "Name who reviews emails before they're sent. Solo business owners can simply write \"me.\"",
  },
  {
    id: "ms_2_10",
    text: "What tools are used for the Email channel?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Software, platforms, and tools used...",
    tip: "List your email platform plus anything connected to it, such as forms, landing pages, or scheduling tools.",
  },
  {
    id: "ms_2_11",
    text: "What metrics are tracked for the Email channel?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Key performance indicators and metrics...",
    tip: "Open rate, click rate, replies, and unsubscribes are the usual ones. Include rough numbers if you know them.",
  },
  {
    id: "ms_2_12",
    text: "What call to action is used on the Email channel?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Primary CTA and any secondary CTAs...",
    tip: "Write the action you most often ask readers to take, like replying, booking a call, or reading a new post.",
  },
  {
    id: "ms_2_13",
    text: "What lead magnet or offer is promoted on the Email channel?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Lead magnets, offers, or incentives promoted...",
    tip: "Name anything you promote by email, such as a free training, a program launch, or a limited offer. Write \"none currently\" if that's the case.",
  },
  {
    id: "ms_2_14",
    text: "What is the current conversion rate for the Email channel?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Current conversion rates and benchmarks...",
    tip: "This is usually the share of readers who click or buy from an email. Not tracked? Say so and estimate how many sales came from email recently.",
  },
  {
    id: "ms_2_15",
    text: "What improvements are needed for the Email channel?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Areas for improvement and optimization...",
    tip: "Note what would make email work harder for you, such as a welcome sequence, more consistency, or better subject lines.",
  },

  // 8.1 Marketing Channels - Social Media (15 questions)
  {
    id: "ms_3_1",
    text: "What is the channel? (Social Media)",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Social Media",
    tip: "List the platforms you use, like Instagram, LinkedIn, or Facebook, and mark which one is your main focus.",
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
    tip: "Answer for your social presence overall. If you're testing a new platform, \"experimental\" fits; if you've paused posting, choose \"inactive.\"",
  },
  {
    id: "ms_3_3",
    text: "What is the purpose of the Social Media channel?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Primary purpose and goals for this channel...",
    tip: "Say what social media does for you, such as building awareness, starting conversations, or driving people to a call. Pick the main one.",
  },
  {
    id: "ms_3_4",
    text: "Who is the audience on the Social Media channel?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "The specific audience this channel reaches...",
    tip: "Describe who follows and engages with you, which may differ by platform. Note if your followers match your ideal clients or not.",
  },
  {
    id: "ms_3_5",
    text: "What content performs best on the Social Media channel?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Types of content that get the best engagement...",
    tip: "Think about posts with the most saves, comments, shares, or DMs. Carousels, personal stories, and short videos are common examples.",
  },
  {
    id: "ms_3_6",
    text: "What content performs poorly on the Social Media channel?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Types of content that underperform...",
    tip: "Name post types that get little response, like promotional graphics or quotes. A best guess based on what you've noticed is fine.",
  },
  {
    id: "ms_3_7",
    text: "How often is content published on the Social Media channel?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Publishing frequency and schedule...",
    tip: "Share your posting frequency per platform, such as three times a week on Instagram and once a week on LinkedIn.",
  },
  {
    id: "ms_3_8",
    text: "Who creates the content for the Social Media channel?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Person or role responsible for content creation...",
    tip: "Who makes your posts, including graphics, captions, and video? List each person or tool involved, even if it's mostly you.",
  },
  {
    id: "ms_3_9",
    text: "Who approves the content for the Social Media channel?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Person or role responsible for content approval...",
    tip: "If someone else posts for you, note who signs off first. Solo? Writing \"me\" is perfect.",
  },
  {
    id: "ms_3_10",
    text: "What tools are used for the Social Media channel?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Software, platforms, and tools used...",
    tip: "Include design, scheduling, and editing tools along with the platforms themselves. List anything you pay for.",
  },
  {
    id: "ms_3_11",
    text: "What metrics are tracked for the Social Media channel?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Key performance indicators and metrics...",
    tip: "Followers, reach, engagement, profile visits, and DMs are common. Write which ones you check and how often.",
  },
  {
    id: "ms_3_12",
    text: "What call to action is used on the Social Media channel?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Primary CTA and any secondary CTAs...",
    tip: "Write what your posts usually invite people to do, like \"DM me the word READY\" or \"link in bio to book.\"",
  },
  {
    id: "ms_3_13",
    text: "What lead magnet or offer is promoted on the Social Media channel?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Lead magnets, offers, or incentives promoted...",
    tip: "Name the free resource, event, or offer you point people to from social. If posts don't promote anything yet, say so.",
  },
  {
    id: "ms_3_14",
    text: "What is the current conversion rate for the Social Media channel?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Current conversion rates and benchmarks...",
    tip: "Estimate how many followers or DMs become leads or clients. If you can't measure it, write \"not tracked yet\" and describe what you've seen.",
  },
  {
    id: "ms_3_15",
    text: "What improvements are needed for the Social Media channel?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Areas for improvement and optimization...",
    tip: "Note the biggest gaps, such as inconsistent posting, unclear CTAs, or no way to capture leads from conversations.",
  },

  // 8.2 Content Engine (12 questions)
  {
    id: "ms_4_1",
    text: "What is the current content strategy?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Overall approach and philosophy for content...",
    tip: "Summarize your approach in a sentence or two, like \"teach first, share stories, invite to a call monthly.\" No formal strategy yet? Describe what you currently do.",
  },
  {
    id: "ms_4_2",
    text: "What are the main content themes?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Core topics and themes that content focuses on...",
    tip: "List three to five topics you come back to often. These usually connect to your clients' biggest problems and your expertise.",
  },
  {
    id: "ms_4_3",
    text: "What are the monthly or quarterly themes?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Rotating themes or focus areas by time period...",
    tip: "If you plan themes by month or season, list them. If not, write \"none yet\" or share themes you'd like to try.",
  },
  {
    id: "ms_4_4",
    text: "What are the recurring content formats?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Regular content types and formats used...",
    tip: "Name your regular formats, such as weekly tips, monthly live sessions, client spotlights, or podcast episodes.",
  },
  {
    id: "ms_4_5",
    text: "What is the content creation workflow?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Step-by-step process for creating content...",
    tip: "Walk through your steps from idea to finished piece, for example brainstorm, draft, design, edit. Rough is fine.",
  },
  {
    id: "ms_4_6",
    text: "What is the approval workflow?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Process for reviewing and approving content...",
    tip: "Explain who reviews content and at what point. If nothing gets reviewed before posting, say that.",
  },
  {
    id: "ms_4_7",
    text: "What is the publishing workflow?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Process for scheduling and publishing content...",
    tip: "Describe how content goes live: scheduled in batches, posted manually, or handled by a team member. Include the tools involved.",
  },
  {
    id: "ms_4_8",
    text: "What is the repurposing workflow?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Process for adapting content across channels...",
    tip: "Share how one piece becomes several, like turning a podcast into posts and an email. If you don't repurpose yet, write \"not yet.\"",
  },
  {
    id: "ms_4_9",
    text: "What content has performed best?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Top-performing content pieces and why they worked...",
    tip: "Name two or three standout pieces across any channel and why you think they worked, such as a personal story or a clear how-to.",
  },
  {
    id: "ms_4_10",
    text: "What content has generated leads?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Content that has directly generated leads...",
    tip: "Point to specific posts, emails, or talks that brought in inquiries or signups. A general memory of what worked is helpful too.",
  },
  {
    id: "ms_4_11",
    text: "What content has generated sales?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Content that has directly generated sales...",
    tip: "Think about where your paying clients first found you or what tipped them to buy. If you can't trace it, write \"unknown\" and your best guess.",
  },
  {
    id: "ms_4_12",
    text: "What should AI prioritize for content?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "How AI should focus its content support...",
    tip: "Tell AI where to spend its effort, such as drafting captions, repurposing long content, or brainstorming ideas, and what to leave to you.",
  },

  // 8.3 Lead Magnets and Free Resources (12 questions)
  {
    id: "ms_5_1",
    text: "What is the name of the lead magnet?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Name of the primary lead magnet or free resource...",
    tip: "Use the exact title people see, like a guide, quiz, or mini course name. If you're still creating one, share the working title or write \"none yet.\"",
  },
  {
    id: "ms_5_2",
    text: "What problem does the lead magnet solve?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "The specific problem this resource addresses...",
    tip: "Describe the one problem it helps with in your client's words, such as \"not knowing where to start with pricing.\"",
  },
  {
    id: "ms_5_3",
    text: "Who is the lead magnet for?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Target audience for this lead magnet...",
    tip: "Be specific about who it's meant for. This may match your ideal client or a slightly earlier stage of their journey.",
  },
  {
    id: "ms_5_4",
    text: "What format is the lead magnet?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Format (PDF, video, checklist, template, etc.)...",
    tip: "Just name the type, for example a PDF guide, video series, checklist, or assessment.",
  },
  {
    id: "ms_5_5",
    text: "Where is the lead magnet hosted?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Platform or location where it's stored...",
    tip: "Name where the file or content lives, such as your email platform, a cloud drive, or a course platform.",
  },
  {
    id: "ms_5_6",
    text: "How is the lead magnet delivered?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Delivery method and automation...",
    tip: "Explain what happens after signup, like an automatic email with a download link, or a manual send.",
  },
  {
    id: "ms_5_7",
    text: "What email sequence follows the lead magnet?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Nurture sequence that follows delivery...",
    tip: "List the emails that follow and their purpose, for example welcome, a story, a tip, then an invitation. If none exists yet, note it.",
  },
  {
    id: "ms_5_8",
    text: "What offer does the lead magnet lead to?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Primary offer promoted after lead magnet...",
    tip: "Name the paid offer or call you hope people take next. It should connect naturally to the problem the freebie solves.",
  },
  {
    id: "ms_5_9",
    text: "What is the opt-in rate?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Current opt-in conversion rate...",
    tip: "This is signups divided by visitors to the signup page. If you don't know it, write \"not tracked yet\" and the number of signups you have.",
  },
  {
    id: "ms_5_10",
    text: "What is the conversion rate to paid?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Rate at which lead magnet subscribers become customers...",
    tip: "Estimate how many subscribers from this freebie have become clients. Even \"two clients out of about 100 signups\" is useful.",
  },
  {
    id: "ms_5_11",
    text: "What needs to be updated on the lead magnet?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Areas for improvement or updates needed...",
    tip: "Note anything outdated, like old branding, a weak title, or a missing follow-up sequence. Mention what feedback you've received.",
  },
  {
    id: "ms_5_12",
    text: "What messaging should AI use for the lead magnet?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Approved messaging and positioning...",
    tip: "Share the key phrases, promise, and tone you want used when promoting it, plus anything AI should avoid saying.",
  },

  // 8.4 Email Marketing (12 questions)
  {
    id: "ms_6_1",
    text: "What email platform is used?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Primary email service provider...",
    tip: "Name your provider. If you answered this earlier in the Email channel tools question, you can copy it here.",
  },
  {
    id: "ms_6_2",
    text: "How large is the email list?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Total subscribers and growth rate...",
    tip: "Give your subscriber count and whether it's growing, flat, or shrinking. A small list is worth noting accurately.",
  },
  {
    id: "ms_6_3",
    text: "How is the list segmented?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Segmentation criteria and groups...",
    tip: "Describe the groups you separate people into, like clients, leads, and event attendees. Write \"not segmented\" if everyone gets the same emails.",
  },
  {
    id: "ms_6_4",
    text: "What tags are used?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Tagging system and categories...",
    tip: "List the main tags you apply, such as lead source or interests. If you don't use tags, say so.",
  },
  {
    id: "ms_6_5",
    text: "What automations exist?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Automated sequences and workflows...",
    tip: "Name each automation and what triggers it, like a welcome series when someone joins. Include any you've set up but don't use.",
  },
  {
    id: "ms_6_6",
    text: "What nurture sequences exist?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Welcome series and nurture flows...",
    tip: "Describe your welcome or nurture emails, including how many and how often they send. You may be able to reuse your lead magnet sequence answer.",
  },
  {
    id: "ms_6_7",
    text: "What sales sequences exist?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Promotional and sales email sequences...",
    tip: "List any launch, promo, or sales email sequences you've used, even one-time ones. Write \"none yet\" if you sell mainly in conversation.",
  },
  {
    id: "ms_6_8",
    text: "What newsletter cadence exists?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Regular newsletter schedule and format...",
    tip: "Share how often your newsletter goes out and its usual format. Answered this under the Email channel? Feel free to reuse it.",
  },
  {
    id: "ms_6_9",
    text: "What subject lines perform best?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "High-performing subject line patterns...",
    tip: "Paste a few of your best subject lines or describe the style, such as questions, short personal phrases, or curiosity hooks.",
  },
  {
    id: "ms_6_10",
    text: "What CTAs perform best?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Effective call-to-action approaches...",
    tip: "Note which asks get clicks or replies, like \"hit reply and tell me\" or a direct booking link.",
  },
  {
    id: "ms_6_11",
    text: "What is the average open rate?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Current open rate benchmarks...",
    tip: "Look in your email platform's reports for this. If you're not sure, write \"not tracked yet\" and leave room to add it later.",
  },
  {
    id: "ms_6_12",
    text: "What should AI draft for email marketing?",
    type: "text",
    section: "8. Marketing System",
    placeholder: "Guidelines for AI-generated email content...",
    tip: "Spell out what AI can draft, such as newsletters, sequences, or subject line ideas, and what needs your personal voice or review.",
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
    tip: "List the steps your clients actually move through, in order. Use the standard stages as a starting point and rename, merge, or skip any that don't fit how you work.",
  },
  {
    id: "cj_1_2",
    text: "What happens at the Awareness stage?",
    type: "text",
    section: "9. Customer Journey and Client Experience",
    placeholder: "How prospects first discover the business...",
    tip: "Name the two or three places people most often first hear about you, like referrals, podcasts, or social posts. If you're not sure, ask your last few clients how they found you.",
  },
  {
    id: "cj_1_3",
    text: "What happens at the Interest stage?",
    type: "text",
    section: "9. Customer Journey and Client Experience",
    placeholder: "How prospects engage and learn more...",
    tip: "Describe what someone does after they notice you: follow you, join your list, download a freebie, or book a call. Early on, this might simply be a DM or email conversation.",
  },
  {
    id: "cj_1_4",
    text: "What happens at the Consideration stage?",
    type: "text",
    section: "9. Customer Journey and Client Experience",
    placeholder: "How prospects evaluate options and make decisions...",
    tip: "Think about what people need to see or hear before saying yes, such as a discovery call, testimonials, or a proposal. Note the common questions or hesitations that come up here.",
  },
  {
    id: "cj_1_5",
    text: "What happens at the Purchase stage?",
    type: "text",
    section: "9. Customer Journey and Client Experience",
    placeholder: "The buying process and payment experience...",
    tip: "Walk through how someone actually pays you: invoice, checkout page, contract signing, or payment plan. Mention the tools you use and any steps that feel clunky.",
  },
  {
    id: "cj_1_6",
    text: "What happens at the Onboarding stage?",
    type: "text",
    section: "9. Customer Journey and Client Experience",
    placeholder: "How new clients are welcomed and oriented...",
    tip: "Summarize what happens in the first days after someone pays. A short version is fine here; you'll get to describe onboarding in more detail later in this section.",
  },
  {
    id: "cj_1_7",
    text: "What happens at the Delivery stage?",
    type: "text",
    section: "9. Customer Journey and Client Experience",
    placeholder: "How the product/service is delivered and experienced...",
    tip: "Explain how the work happens: sessions, deliverables, group calls, or done-for-you projects. Include the format and typical length. More detail comes later in the delivery questions.",
  },
  {
    id: "cj_1_8",
    text: "What happens at the Retention stage?",
    type: "text",
    section: "9. Customer Journey and Client Experience",
    placeholder: "How ongoing relationships are maintained...",
    tip: "Note how you stay connected once the main work wraps up, like check-ins, renewals, alumni groups, or newsletters. If you don't have anything here yet, say so honestly.",
  },
  {
    id: "cj_1_9",
    text: "What happens at the Advocacy stage?",
    type: "text",
    section: "9. Customer Journey and Client Experience",
    placeholder: "How satisfied clients become promoters...",
    tip: "Describe how happy clients spread the word today: referrals, testimonials, reviews, or affiliate programs. If it happens informally or not at all, that's useful to know too.",
  },
  {
    id: "cj_1_10",
    text: "What are the key touchpoints at each stage?",
    type: "text",
    section: "9. Customer Journey and Client Experience",
    placeholder: "Specific interactions and moments that matter...",
    tip: "Go stage by stage and list the specific moments clients interact with you, such as the welcome email, kickoff call, or final review. A simple bulleted list per stage works well.",
  },
  {
    id: "cj_1_11",
    text: "What emotions should clients feel at each stage?",
    type: "text",
    section: "9. Customer Journey and Client Experience",
    placeholder: "Desired emotional experience throughout the journey...",
    tip: "Pick one or two feelings per stage, for example curious at Awareness, confident at Purchase, supported at Delivery. Think about how you'd want a friend to feel working with you.",
  },
  {
    id: "cj_1_12",
    text: "What are the biggest friction points in the journey?",
    type: "text",
    section: "9. Customer Journey and Client Experience",
    placeholder: "Areas where clients get stuck or frustrated...",
    tip: "Recall where clients go quiet, ask the same questions, or seem confused. Common spots include scheduling, payment, and the gap between signing and starting.",
  },

  // 9.2 Onboarding Process (10 questions)
  {
    id: "cj_2_1",
    text: "What is the onboarding process for new clients?",
    type: "text",
    section: "9. Customer Journey and Client Experience",
    placeholder: "Step-by-step flow from purchase to first value...",
    tip: "Write the steps from payment to the client's first real win, in order. Numbered steps are easiest. If it varies, describe what usually happens and where it changes.",
  },
  {
    id: "cj_2_2",
    text: "What welcome materials are sent?",
    type: "text",
    section: "9. Customer Journey and Client Experience",
    placeholder: "Emails, videos, documents, or resources sent upon purchase...",
    tip: "List each item and when it goes out, like a welcome email right away and a guide before the first session. If you send nothing yet, note that and what you'd like to send.",
  },
  {
    id: "cj_2_3",
    text: "What is the first deliverable or milestone?",
    type: "text",
    section: "9. Customer Journey and Client Experience",
    placeholder: "The first thing clients receive or achieve...",
    tip: "Name the first concrete thing a client gets or accomplishes, such as a completed assessment, a roadmap, or a first session recap. Include roughly when it happens.",
  },
  {
    id: "cj_2_4",
    text: "What expectations are set during onboarding?",
    type: "text",
    section: "9. Customer Journey and Client Experience",
    placeholder: "What clients should expect in terms of timeline, communication, and outcomes...",
    tip: "Cover the basics clients need to know: how long it takes, how often you'll talk, and what results to realistically expect. Phrases you already say on kickoff calls work great here.",
  },
  {
    id: "cj_2_5",
    text: "What boundaries are set during onboarding?",
    type: "text",
    section: "9. Customer Journey and Client Experience",
    placeholder: "What is and isn't included, response times, communication channels...",
    tip: "Note what's in and out of scope, when you reply to messages, and which channels to use. If you haven't set boundaries formally, describe what you do in practice today.",
  },
  {
    id: "cj_2_6",
    text: "What information is collected from clients?",
    type: "text",
    section: "9. Customer Journey and Client Experience",
    placeholder: "Intake forms, questionnaires, or data gathered...",
    tip: "List the forms or questions you use and what they capture, like goals, background, or access details. Mention where the answers end up so the information is easy to find later.",
  },
  {
    id: "cj_2_7",
    text: "How is the client introduced to the team?",
    type: "text",
    section: "9. Customer Journey and Client Experience",
    placeholder: "How team members are presented and relationships are established...",
    tip: "Describe who clients meet and how, such as an intro email or a team welcome video. If it's just you, say so and mention any assistant or contractor they might hear from.",
  },
  {
    id: "cj_2_8",
    text: "What access or credentials are provided?",
    type: "text",
    section: "9. Customer Journey and Client Experience",
    placeholder: "Portal access, login credentials, or platform invitations...",
    tip: "List the logins or invites clients receive, like a client portal, shared folder, or community space. If they don't need any access, a quick \"none\" is a fine answer.",
  },
  {
    id: "cj_2_9",
    text: "How long does onboarding typically take?",
    type: "text",
    section: "9. Customer Journey and Client Experience",
    placeholder: "Duration from purchase to fully onboarded...",
    tip: "Give a rough range, like two days or one week, from payment to fully set up. A best guess based on your last few clients is perfectly fine.",
  },
  {
    id: "cj_2_10",
    text: "How is onboarding success measured?",
    type: "text",
    section: "9. Customer Journey and Client Experience",
    placeholder: "Metrics or indicators that onboarding is working well...",
    tip: "Think about signs onboarding went well: forms completed on time, the first session booked quickly, or fewer early questions. If you don't track this yet, name what you'd want to watch.",
  },

  // 9.3 Delivery Process (10 questions)
  {
    id: "cj_3_1",
    text: "What is the core delivery process?",
    type: "text",
    section: "9. Customer Journey and Client Experience",
    placeholder: "How the main product/service is delivered from start to finish...",
    tip: "Describe how the main work runs from kickoff to finish, in plain steps. If you have more than one offer, start with your most popular one.",
  },
  {
    id: "cj_3_2",
    text: "What are the key milestones or phases?",
    type: "text",
    section: "9. Customer Journey and Client Experience",
    placeholder: "Major checkpoints or stages in the delivery process...",
    tip: "List the major checkpoints, like discovery, strategy, implementation, and review. Adding rough timing to each (for example, weeks 1 to 2) makes this even more useful.",
  },
  {
    id: "cj_3_3",
    text: "What are the client responsibilities during delivery?",
    type: "text",
    section: "9. Customer Journey and Client Experience",
    placeholder: "What clients must do, provide, or complete...",
    tip: "Note what clients need to do for things to stay on track: show up prepared, complete homework, send materials, or give feedback within a set time.",
  },
  {
    id: "cj_3_4",
    text: "What are the business responsibilities during delivery?",
    type: "text",
    section: "9. Customer Journey and Client Experience",
    placeholder: "What the business must deliver, provide, or ensure...",
    tip: "Spell out what you promise to deliver and when, such as session notes within 24 hours or drafts by a set date. This pairs nicely with the client responsibilities above.",
  },
  {
    id: "cj_3_5",
    text: "How is progress communicated to clients?",
    type: "text",
    section: "9. Customer Journey and Client Experience",
    placeholder: "Updates, reports, or check-ins during delivery...",
    tip: "Describe how clients know where things stand: weekly emails, session recaps, a shared tracker, or regular check-ins. Include how often updates go out.",
  },
  {
    id: "cj_3_6",
    text: "How are delays or issues communicated?",
    type: "text",
    section: "9. Customer Journey and Client Experience",
    placeholder: "Process for communicating problems or timeline changes...",
    tip: "Explain how and how quickly you let clients know when something slips. Even a simple rule like \"I email within one business day with a new date\" counts.",
  },
  {
    id: "cj_3_7",
    text: "What happens if a client is unresponsive?",
    type: "text",
    section: "9. Customer Journey and Client Experience",
    placeholder: "Process for handling ghosting or delays on the client side...",
    tip: "Describe your follow-up steps when a client goes quiet, like a reminder after a few days, then a pause notice. If you don't have a process yet, describe how you handle it now.",
  },
  {
    id: "cj_3_8",
    text: "What happens if deliverables are delayed?",
    type: "text",
    section: "9. Customer Journey and Client Experience",
    placeholder: "Process for handling delays on the business side...",
    tip: "Share what you do when you're the one running behind, such as notifying the client, offering a new timeline, or adding a bonus. Your current habit is a fine answer.",
  },
  {
    id: "cj_3_9",
    text: "How is completion or offboarding handled?",
    type: "text",
    section: "9. Customer Journey and Client Experience",
    placeholder: "Process for wrapping up and transitioning out...",
    tip: "Walk through how you wrap things up: a final session, a summary document, a feedback request, or handing over files. Note anything you wish you did more consistently.",
  },
  {
    id: "cj_3_10",
    text: "What happens after delivery is complete?",
    type: "text",
    section: "9. Customer Journey and Client Experience",
    placeholder: "Follow-up, next steps, or continuation options...",
    tip: "Describe any next steps you offer, like a renewal, a maintenance plan, or a check-in call a few months later. If nothing happens yet, that's an honest and helpful answer.",
  },

  // 9.4 Client Support (8 questions)
  {
    id: "cj_4_1",
    text: "What support channels are available to clients?",
    type: "text",
    section: "9. Customer Journey and Client Experience",
    placeholder: "Email, chat, phone, portal, community, etc....",
    tip: "List every way clients can reach you and what each one is for. If you'd prefer they use fewer channels, mention that too.",
  },
  {
    id: "cj_4_2",
    text: "What are the support response time commitments?",
    type: "text",
    section: "9. Customer Journey and Client Experience",
    placeholder: "Expected response times for different channels or urgency levels...",
    tip: "Share realistic reply times, like within one business day for email. If they vary by channel or urgency, note the difference. Describe what you actually do, not an ideal.",
  },
  {
    id: "cj_4_3",
    text: "Who handles support requests?",
    type: "text",
    section: "9. Customer Journey and Client Experience",
    placeholder: "Roles or team members responsible for support...",
    tip: "Name the role or person who answers client questions first. If it's just you, say so and describe how you handle it today.",
  },
  {
    id: "cj_4_4",
    text: "What is the escalation process?",
    type: "text",
    section: "9. Customer Journey and Client Experience",
    placeholder: "How issues are escalated when they can't be resolved at first level...",
    tip: "Explain where a tricky issue goes next and who makes the final call. Solo? Describe what you do when something is beyond your usual answers, like pausing to research or calling the client.",
  },
  {
    id: "cj_4_5",
    text: "What types of requests are considered support vs. scope?",
    type: "text",
    section: "9. Customer Journey and Client Experience",
    placeholder: "Boundary between included support and additional paid work...",
    tip: "Give a few examples on each side, such as quick questions being included and new projects needing a separate quote. Your contract or offer description may already cover this.",
  },
  {
    id: "cj_4_6",
    text: "How are complaints or issues documented?",
    type: "text",
    section: "9. Customer Journey and Client Experience",
    placeholder: "Process for tracking and resolving client complaints...",
    tip: "Describe where complaints get written down and how you follow up, even if it's a note in your inbox or CRM. If nothing is tracked yet, say so.",
  },
  {
    id: "cj_4_7",
    text: "How is client feedback collected?",
    type: "text",
    section: "9. Customer Journey and Client Experience",
    placeholder: "Surveys, interviews, or other feedback mechanisms...",
    tip: "List how you ask clients for input: end-of-program surveys, check-in questions, or testimonial requests. Informal conversations count, so mention those too.",
  },
  {
    id: "cj_4_8",
    text: "How is client feedback acted upon?",
    type: "text",
    section: "9. Customer Journey and Client Experience",
    placeholder: "Process for reviewing and implementing client feedback...",
    tip: "Explain what happens after feedback comes in, like a monthly review or tweaking your process right away. A real example of a change you made is a great addition.",
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
    tip: "Describe when you set yearly goals and how, such as a December planning retreat or a January review. If you don't plan annually yet, note that and when you'd like to.",
  },
  {
    id: "os_1_2",
    text: "What is the quarterly planning cycle?",
    type: "text",
    section: "10. Operations and Internal Systems",
    placeholder: "When and how quarterly OKRs or priorities are set...",
    tip: "Share when and how you set priorities each quarter. Solo founders often do this on their own over a few hours; if you skip it, say so honestly.",
  },
  {
    id: "os_1_3",
    text: "What is the monthly review process?",
    type: "text",
    section: "10. Operations and Internal Systems",
    placeholder: "Monthly check-ins, reviews, or reporting rituals...",
    tip: "Note any monthly habits, like reviewing finances, checking goals, or a team meeting. Even a quick look at revenue and calendar each month counts.",
  },
  {
    id: "os_1_4",
    text: "What is the weekly meeting cadence?",
    type: "text",
    section: "10. Operations and Internal Systems",
    placeholder: "Regular weekly meetings and their purposes...",
    tip: "List your regular weekly meetings and their purpose. If it's just you, describe any weekly planning or review time you block for yourself.",
  },
  {
    id: "os_1_5",
    text: "What is the daily standup or check-in process?",
    type: "text",
    section: "10. Operations and Internal Systems",
    placeholder: "Daily rituals for alignment and communication...",
    tip: "Describe any daily check-in, like a quick team message or a personal planning routine. \"None\" is a perfectly fine answer if you don't have one.",
  },
  {
    id: "os_1_6",
    text: "What decisions require meetings vs. async?",
    type: "text",
    section: "10. Operations and Internal Systems",
    placeholder: "Criteria for when to meet vs. handle asynchronously...",
    tip: "Share your rule of thumb, for example meeting for anything sensitive or complex and using messages for updates. If you haven't defined this, describe what tends to happen now.",
  },
  {
    id: "os_1_7",
    text: "What is the decision-making framework?",
    type: "text",
    section: "10. Operations and Internal Systems",
    placeholder: "How decisions are made and who has authority...",
    tip: "Explain who decides what, such as you approving spending and your assistant handling scheduling. Solo founders can describe how they weigh big decisions or who they consult.",
  },
  {
    id: "os_1_8",
    text: "What is the communication protocol?",
    type: "text",
    section: "10. Operations and Internal Systems",
    placeholder: "Which channels to use for what types of communication...",
    tip: "Match each channel to its use, like email for clients, chat for the team, and texts only for emergencies. A short list is easiest to read.",
  },
  {
    id: "os_1_9",
    text: "What is the reporting structure?",
    type: "text",
    section: "10. Operations and Internal Systems",
    placeholder: "Who reports to whom and what information flows where...",
    tip: "Name who reports to whom and what updates they share. If it's just you, list any contractors or helpers and how they keep you informed.",
  },
  {
    id: "os_1_10",
    text: "What are the core operating hours?",
    type: "text",
    section: "10. Operations and Internal Systems",
    placeholder: "Standard working hours and availability expectations...",
    tip: "State the hours you and any team are available, including time zone. Mention any days or times you protect for focus work or personal commitments.",
  },
  {
    id: "os_1_11",
    text: "What is the time-off and vacation policy?",
    type: "text",
    section: "10. Operations and Internal Systems",
    placeholder: "How time off is requested, tracked, and covered...",
    tip: "Describe how time off is requested and covered, including your own. Solo? Note how you prepare clients and what pauses while you're away.",
  },
  {
    id: "os_1_12",
    text: "What is the emergency or urgent response protocol?",
    type: "text",
    section: "10. Operations and Internal Systems",
    placeholder: "How urgent issues are handled outside normal hours...",
    tip: "Explain what counts as urgent and how someone reaches you outside normal hours. If true emergencies are rare in your work, say that and describe your backup plan.",
  },

  // 10.2 SOP Inventory (12 questions)
  {
    id: "os_2_1",
    text: "What SOPs currently exist?",
    type: "text",
    section: "10. Operations and Internal Systems",
    placeholder: "List of documented standard operating procedures...",
    tip: "List any written steps, checklists, or recorded walkthroughs you already have, even rough ones. If you have none yet, that's a common starting point for many businesses.",
  },
  {
    id: "os_2_2",
    text: "What processes need SOPs but don't have them?",
    type: "text",
    section: "10. Operations and Internal Systems",
    placeholder: "Critical processes that are undocumented...",
    tip: "Name the tasks you repeat often or that would cause trouble if done wrong, like onboarding, invoicing, or content publishing. Start with your top three.",
  },
  {
    id: "os_2_3",
    text: "Where are SOPs stored?",
    type: "text",
    section: "10. Operations and Internal Systems",
    placeholder: "Location or system where SOPs are housed...",
    tip: "Name the tool or location, such as a shared drive folder, a project tool, or a notes app. If they live in several places, list them all.",
  },
  {
    id: "os_2_4",
    text: "What format are SOPs in?",
    type: "text",
    section: "10. Operations and Internal Systems",
    placeholder: "Document format, video, checklist, etc....",
    tip: "Describe the formats you use or prefer, like written docs, screen recordings, or checklists. Mixed formats are common and fine to mention.",
  },
  {
    id: "os_2_5",
    text: "Who is responsible for creating SOPs?",
    type: "text",
    section: "10. Operations and Internal Systems",
    placeholder: "Role or person responsible for documentation...",
    tip: "Name the role or person who writes new procedures. If it's you by default, say so and note whether you'd like to hand this off.",
  },
  {
    id: "os_2_6",
    text: "Who is responsible for updating SOPs?",
    type: "text",
    section: "10. Operations and Internal Systems",
    placeholder: "Role or person responsible for maintaining documentation...",
    tip: "Name who keeps procedures up to date when things change. If no one does this yet, that's an honest answer and worth noting.",
  },
  {
    id: "os_2_7",
    text: "How often are SOPs reviewed?",
    type: "text",
    section: "10. Operations and Internal Systems",
    placeholder: "Review cadence for ensuring SOPs stay current...",
    tip: "Share how often you revisit your procedures, like quarterly or only when something breaks. Pick what actually happens today.",
  },
  {
    id: "os_2_8",
    text: "What processes are currently undocumented?",
    type: "text",
    section: "10. Operations and Internal Systems",
    placeholder: "Key processes that exist only in people's heads...",
    tip: "Think about tasks only you or one person knows how to do. You can reuse your answer to the earlier question about missing SOPs and add anything else that comes to mind.",
  },
  {
    id: "os_2_9",
    text: "What processes are too dependent on specific people?",
    type: "text",
    section: "10. Operations and Internal Systems",
    placeholder: "Bottlenecks where only one person knows how to do something...",
    tip: "Name the tasks that stall when a specific person is out, including you. Common examples are billing, tech fixes, and client communication.",
  },
  {
    id: "os_2_10",
    text: "What processes need automation?",
    type: "text",
    section: "10. Operations and Internal Systems",
    placeholder: "Manual processes that could be automated...",
    tip: "List repetitive manual tasks that eat time, like sending reminders, moving data between tools, or scheduling. Start with whatever you dread doing each week.",
  },
  {
    id: "os_2_11",
    text: "What processes need delegation?",
    type: "text",
    section: "10. Operations and Internal Systems",
    placeholder: "Tasks that should be handed off to others...",
    tip: "Name tasks you're doing that someone else could handle, such as inbox sorting, bookkeeping, or social posting. Include them even if you don't have help yet.",
  },
  {
    id: "os_2_12",
    text: "What should AI be allowed to document or improve?",
    type: "text",
    section: "10. Operations and Internal Systems",
    placeholder: "Guidelines for AI assistance with SOPs and processes...",
    tip: "Describe what you're comfortable with, like AI drafting SOPs from recordings or suggesting process improvements. Also note anything AI should not touch or change without your review.",
  },

  // 10.3 Project Management (12 questions)
  {
    id: "os_3_1",
    text: "What project management tool is used?",
    type: "text",
    section: "10. Operations and Internal Systems",
    placeholder: "Primary PM platform and how it's used...",
    tip: "Name the tool and how you use it, for example a project board for client work. If you use a paper planner or spreadsheet, that counts too.",
  },
  {
    id: "os_3_2",
    text: "How are projects organized?",
    type: "text",
    section: "10. Operations and Internal Systems",
    placeholder: "Folder structure, naming conventions, or organization system...",
    tip: "Describe how projects are grouped, such as by client, offer, or department, and any naming patterns. A quick example of a project name helps.",
  },
  {
    id: "os_3_3",
    text: "How are tasks assigned?",
    type: "text",
    section: "10. Operations and Internal Systems",
    placeholder: "Process for assigning work and setting deadlines...",
    tip: "Explain how work gets handed out and how deadlines are set. If it's just you, describe how you decide what lands on your plate each week.",
  },
  {
    id: "os_3_4",
    text: "How is task priority determined?",
    type: "text",
    section: "10. Operations and Internal Systems",
    placeholder: "Framework for deciding what gets done first...",
    tip: "Share how you decide what comes first, like client deadlines, revenue impact, or urgency. A simple rule you actually follow is better than a formal framework you don't.",
  },
  {
    id: "os_3_5",
    text: "What is the task workflow?",
    type: "text",
    section: "10. Operations and Internal Systems",
    placeholder: "Stages tasks move through from creation to completion...",
    tip: "List the stages a task moves through, such as to do, in progress, review, and done. If tasks just go from a list to finished, say so.",
  },
  {
    id: "os_3_6",
    text: "How are deadlines set and tracked?",
    type: "text",
    section: "10. Operations and Internal Systems",
    placeholder: "Process for setting and monitoring deadlines...",
    tip: "Describe how deadlines are chosen and where you track them, like a calendar or project tool. Mention any reminders you rely on.",
  },
  {
    id: "os_3_7",
    text: "How is work-in-progress limited?",
    type: "text",
    section: "10. Operations and Internal Systems",
    placeholder: "Approach to preventing overload and multitasking...",
    tip: "Share how you avoid taking on too much at once, such as a cap on active clients or a max of three priorities per week. If you don't limit this yet, say so.",
  },
  {
    id: "os_3_8",
    text: "How are blockers identified and resolved?",
    type: "text",
    section: "10. Operations and Internal Systems",
    placeholder: "Process for surfacing and removing obstacles...",
    tip: "Explain how stuck work gets noticed and unstuck, like a check-in question or a flag in your project tool. Solo? Describe what you do when you're the one stuck.",
  },
  {
    id: "os_3_9",
    text: "How is project status communicated?",
    type: "text",
    section: "10. Operations and Internal Systems",
    placeholder: "Reporting and visibility into project progress...",
    tip: "Describe how you and others see where projects stand, like status updates, a shared board, or meeting reviews. Include how often this happens.",
  },
  {
    id: "os_3_10",
    text: "How are project retrospectives conducted?",
    type: "text",
    section: "10. Operations and Internal Systems",
    placeholder: "Process for reviewing completed projects and learning...",
    tip: "Share how you look back after finishing a project, even a quick note on what worked and what to change. If you skip this step, that's helpful to know.",
  },
  {
    id: "os_3_11",
    text: "What templates exist for common project types?",
    type: "text",
    section: "10. Operations and Internal Systems",
    placeholder: "Reusable templates for recurring project types...",
    tip: "List any reusable templates you have, such as client onboarding, launches, or content plans. Note the project types you repeat that could use one.",
  },
  {
    id: "os_3_12",
    text: "What should AI be allowed to manage or track?",
    type: "text",
    section: "10. Operations and Internal Systems",
    placeholder: "Guidelines for AI assistance with project management...",
    tip: "Describe the tracking you'd welcome help with, like deadline reminders or status summaries. Also note what AI should never change or assign without your approval.",
  },

  // 10.4 File and Knowledge Management (9 questions)
  {
    id: "os_4_1",
    text: "Where are files stored?",
    type: "text",
    section: "10. Operations and Internal Systems",
    placeholder: "Primary file storage system and structure...",
    tip: "Name your main storage tool and any others in use. If files are spread across several places, list them all; that helps spot cleanup opportunities.",
  },
  {
    id: "os_4_2",
    text: "What is the folder structure?",
    type: "text",
    section: "10. Operations and Internal Systems",
    placeholder: "Organization system for files and folders...",
    tip: "Describe your top-level folders, like Clients, Marketing, Finance, and Admin. A few main categories is enough; no need to map every subfolder.",
  },
  {
    id: "os_4_3",
    text: "What are the naming conventions?",
    type: "text",
    section: "10. Operations and Internal Systems",
    placeholder: "Standard naming patterns for files and documents...",
    tip: "Share any naming patterns you use, like client name plus date. If there's no system yet, say so, or describe the one you'd like to start using.",
  },
  {
    id: "os_4_4",
    text: "Who has access to what files?",
    type: "text",
    section: "10. Operations and Internal Systems",
    placeholder: "Permission structure and access controls...",
    tip: "Explain who can see or edit which folders, such as your assistant having access to client files but not finances. If it's just you, a short note is enough.",
  },
  {
    id: "os_4_5",
    text: "Where is institutional knowledge documented?",
    type: "text",
    section: "10. Operations and Internal Systems",
    placeholder: "Wiki, knowledge base, or documentation system...",
    tip: "Name where how-to knowledge and key information live, like a shared doc, wiki, or notes app. If most of it is in your head, say that honestly.",
  },
  {
    id: "os_4_6",
    text: "How is knowledge kept current?",
    type: "text",
    section: "10. Operations and Internal Systems",
    placeholder: "Process for updating documentation as things change...",
    tip: "Describe when and how documentation gets refreshed, such as after a process changes or during a quarterly review. If it rarely happens, that's useful to note.",
  },
  {
    id: "os_4_7",
    text: "What information is currently scattered or hard to find?",
    type: "text",
    section: "10. Operations and Internal Systems",
    placeholder: "Knowledge gaps or disorganized information...",
    tip: "List the things you or your team search for most often, like passwords, client details, or past proposals. Anything that takes more than a minute to find belongs here.",
  },
  {
    id: "os_4_8",
    text: "What should be archived or deleted?",
    type: "text",
    section: "10. Operations and Internal Systems",
    placeholder: "Old files or information that should be cleaned up...",
    tip: "Think about old drafts, outdated offers, duplicate files, or past client folders. A general category is fine; you don't need to list individual files.",
  },
  {
    id: "os_4_9",
    text: "What should AI be allowed to access or organize?",
    type: "text",
    section: "10. Operations and Internal Systems",
    placeholder: "Guidelines for AI assistance with file and knowledge management...",
    tip: "Describe what AI may view or reorganize, like marketing files, and what stays off limits, such as financial or sensitive client records. Note anything that needs your review first.",
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
    tip: "A simple sketch in words works: who leads, who supports whom. If it's just you, say so and list the hats you wear, like sales, delivery and admin.",
  },
  {
    id: "tr_1_2",
    text: "Who are the current team members?",
    type: "text",
    section: "11. Team and Roles",
    placeholder: "List of current team members with roles...",
    tip: "Include everyone who regularly helps, even part-time helpers, virtual assistants or family. Name plus one-line role is plenty, for example \"Jo, VA, 10 hrs/week.\"",
  },
  {
    id: "tr_1_3",
    text: "What are their roles and responsibilities?",
    type: "text",
    section: "11. Team and Roles",
    placeholder: "Key responsibilities for each role...",
    tip: "For each person, list the three or four things they truly own. Solo? Write the roles you cover yourself and roughly how much time each one takes.",
  },
  {
    id: "tr_1_4",
    text: "Who reports to whom?",
    type: "text",
    section: "11. Team and Roles",
    placeholder: "Reporting lines and management structure...",
    tip: "Keep it short, like \"VA and editor both report to me.\" If everyone reports to you, that's useful to know and worth saying plainly.",
  },
  {
    id: "tr_1_5",
    text: "What roles are filled by employees?",
    type: "text",
    section: "11. Team and Roles",
    placeholder: "Roles that are employee positions...",
    tip: "Only count people on payroll here. If you have no employees yet, write \"none\" so the plan reflects where you really are.",
  },
  {
    id: "tr_1_6",
    text: "What roles are filled by contractors?",
    type: "text",
    section: "11. Team and Roles",
    placeholder: "Roles that are contractor positions...",
    tip: "List freelancers, agencies and VAs with what they do and roughly how often. A quick example: \"Bookkeeper, monthly; designer, per project.\"",
  },
  {
    id: "tr_1_7",
    text: "What roles are currently open or needed?",
    type: "text",
    section: "11. Team and Roles",
    placeholder: "Open positions or roles that need to be filled...",
    tip: "Think about where you feel stretched or where work keeps slipping. Those gaps usually point to the role you need next, even if you can't hire yet.",
  },
  {
    id: "tr_1_8",
    text: "What is the ideal team size?",
    type: "text",
    section: "11. Team and Roles",
    placeholder: "Target number of team members...",
    tip: "Picture the business running well a year or two out and estimate the headcount, including contractors. A rough range like \"3 to 5 people\" is fine.",
  },
  {
    id: "tr_1_9",
    text: "What is the hiring plan for the next 12 months?",
    type: "text",
    section: "11. Team and Roles",
    placeholder: "Planned hiring timeline and priorities...",
    tip: "Name the roles and the rough timing, like \"part-time VA by spring.\" No hiring planned? Say that, and note what would need to happen first.",
  },
  {
    id: "tr_1_10",
    text: "What is the budget for new hires?",
    type: "text",
    section: "11. Team and Roles",
    placeholder: "Available budget for expanding the team...",
    tip: "A monthly or annual figure helps most. If you're pre-revenue or unsure, write a revenue trigger instead, such as \"hire once we hit a set monthly amount.\"",
  },
  {
    id: "tr_1_11",
    text: "What roles should be prioritized for hiring?",
    type: "text",
    section: "11. Team and Roles",
    placeholder: "Most critical roles to fill first...",
    tip: "Choose the one or two roles that would free up the most of your time or bring in revenue. Ranking them in order is enough.",
  },
  {
    id: "tr_1_12",
    text: "What roles could be consolidated or eliminated?",
    type: "text",
    section: "11. Team and Roles",
    placeholder: "Potential efficiency opportunities in the org structure...",
    tip: "Look for overlapping tasks, tools doing the same job, or contractors you rarely use. \"Nothing yet\" is a perfectly fine answer for a small team.",
  },

  // 11.2 Role Clarity (12 questions)
  {
    id: "tr_2_1",
    text: "What is the founder's role?",
    type: "text",
    section: "11. Team and Roles",
    placeholder: "Core responsibilities and focus areas for the founder...",
    tip: "Describe what you spend your time on now and what only you can do well, such as client work, sales or vision. Both views help.",
  },
  {
    id: "tr_2_2",
    text: "What should the founder stop doing?",
    type: "text",
    section: "11. Team and Roles",
    placeholder: "Tasks or responsibilities the founder should delegate...",
    tip: "Think of tasks that drain you, that someone else could do 80% as well, or that you keep putting off. Inbox sorting and scheduling are common ones.",
  },
  {
    id: "tr_2_3",
    text: "What should the founder start doing?",
    type: "text",
    section: "11. Team and Roles",
    placeholder: "High-value activities the founder should focus on...",
    tip: "Name the activities that would move the business most if you had more time: selling, creating offers, building partnerships, or resting enough to lead well.",
  },
  {
    id: "tr_2_4",
    text: "What decisions should only the founder make?",
    type: "text",
    section: "11. Team and Roles",
    placeholder: "Decision rights reserved for the founder...",
    tip: "Typical examples are pricing, hiring, brand voice and big spending decisions. Listing these makes it much easier to hand off everything else.",
  },
  {
    id: "tr_2_5",
    text: "What decisions can others make?",
    type: "text",
    section: "11. Team and Roles",
    placeholder: "Decision authority that can be delegated...",
    tip: "Note everyday calls others can make without checking in, like scheduling or small refunds. Adding a dollar limit or rule of thumb makes this clearer.",
  },
  {
    id: "tr_2_6",
    text: "What are the boundaries of each role?",
    type: "text",
    section: "11. Team and Roles",
    placeholder: "What each role owns and what they don't...",
    tip: "For each role, jot what it owns and what it doesn't touch. Example: \"VA handles the calendar but doesn't reply to client questions.\"",
  },
  {
    id: "tr_2_7",
    text: "What are the key performance indicators for each role?",
    type: "text",
    section: "11. Team and Roles",
    placeholder: "How success is measured for each position...",
    tip: "Pick one to three measures per role, like response time, content published or sales calls booked. If you're solo, list the numbers you watch for yourself.",
  },
  {
    id: "tr_2_8",
    text: "What are the development areas for each role?",
    type: "text",
    section: "11. Team and Roles",
    placeholder: "Skills or capabilities each role should develop...",
    tip: "Note the skill that would make each person, or you, noticeably more effective next year. One area per role is enough to start.",
  },
  {
    id: "tr_2_9",
    text: "What is the career path for key roles?",
    type: "text",
    section: "11. Team and Roles",
    placeholder: "Growth and advancement opportunities...",
    tip: "Even a small team benefits from naming growth steps, such as VA to operations manager. Not there yet? Write \"not defined\" and move on.",
  },
  {
    id: "tr_2_10",
    text: "What cross-functional responsibilities exist?",
    type: "text",
    section: "11. Team and Roles",
    placeholder: "Responsibilities that span multiple roles or departments...",
    tip: "Think about work that needs more than one person, like launches, client onboarding or events. Name the task and who's involved.",
  },
  {
    id: "tr_2_11",
    text: "What handoffs exist between roles?",
    type: "text",
    section: "11. Team and Roles",
    placeholder: "How work is passed between team members...",
    tip: "Trace how work moves, for example \"sales call to onboarding to delivery,\" and note who passes it to whom. Flag any spots where things get dropped.",
  },
  {
    id: "tr_2_12",
    text: "What should AI know about each role?",
    type: "text",
    section: "11. Team and Roles",
    placeholder: "Key context about roles for AI assistance...",
    tip: "Share anything that helps AI support each role, like preferred tone, tools they use or tasks they never want automated.",
  },

  // 11.3 Internal Communication (11 questions)
  {
    id: "tr_3_1",
    text: "What communication channels are used internally?",
    type: "text",
    section: "11. Team and Roles",
    placeholder: "Slack, email, meetings, project tools, etc....",
    tip: "List every place work talk happens, including text threads and voice memos. Being honest about the messy ones helps clean things up later.",
  },
  {
    id: "tr_3_2",
    text: "What channel should be used for what type of communication?",
    type: "text",
    section: "11. Team and Roles",
    placeholder: "Guidelines for which channel to use when...",
    tip: "A simple rule set works, such as \"urgent by text, tasks in the project tool, everything else by email.\" Write your current habit if there's no rule yet.",
  },
  {
    id: "tr_3_3",
    text: "What are the expected response times?",
    type: "text",
    section: "11. Team and Roles",
    placeholder: "How quickly team members should respond on each channel...",
    tip: "Give a time for each channel, like \"texts within an hour, email within a business day.\" Working solo? Note what you expect from contractors.",
  },
  {
    id: "tr_3_4",
    text: "When should meetings be used vs. async?",
    type: "text",
    section: "11. Team and Roles",
    placeholder: "Criteria for synchronous vs. asynchronous communication...",
    tip: "Note what truly needs live conversation, like brainstorming or tough feedback, and what works fine in writing, such as status updates.",
  },
  {
    id: "tr_3_5",
    text: "What information should be shared transparently?",
    type: "text",
    section: "11. Team and Roles",
    placeholder: "What the whole team should know vs. what stays private...",
    tip: "Consider goals, client wins, schedules and financial details. Say what everyone sees and what stays with you or a small group.",
  },
  {
    id: "tr_3_6",
    text: "What is the meeting culture?",
    type: "text",
    section: "11. Team and Roles",
    placeholder: "Norms and expectations for meetings...",
    tip: "Describe how often you meet, how long, and whether there's always an agenda. If you rarely meet, say so; that's a culture too.",
  },
  {
    id: "tr_3_7",
    text: "What is the feedback culture?",
    type: "text",
    section: "11. Team and Roles",
    placeholder: "How feedback is given and received...",
    tip: "Share how and when feedback happens, for example weekly check-ins or quick notes after projects. Mention how you like to receive it, too.",
  },
  {
    id: "tr_3_8",
    text: "How are conflicts resolved?",
    type: "text",
    section: "11. Team and Roles",
    placeholder: "Process for addressing disagreements or issues...",
    tip: "Describe what actually happens today, even if it's informal, such as \"we talk it through on a call.\" Then add what you'd like it to be.",
  },
  {
    id: "tr_3_9",
    text: "How is recognition and celebration handled?",
    type: "text",
    section: "11. Team and Roles",
    placeholder: "How wins and achievements are acknowledged...",
    tip: "List small rituals like shout-outs, bonuses or a team lunch. Solo? Note how you mark your own wins so they don't slip by.",
  },
  {
    id: "tr_3_10",
    text: "What are the working hours expectations?",
    type: "text",
    section: "11. Team and Roles",
    placeholder: "Core hours, flexibility, and availability norms...",
    tip: "Include your time zone, core hours and any off-limits times. Example: \"Available 9 to 3 Mountain, no weekends unless it's a launch.\"",
  },
  {
    id: "tr_3_11",
    text: "What should AI know about internal communication?",
    type: "text",
    section: "11. Team and Roles",
    placeholder: "Guidelines for AI involvement in team communication...",
    tip: "Say what AI may draft, summarize or send, and what must come from a person. Mention tone or channels it should avoid.",
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
    tip: "Name the platform and who manages it, such as WordPress run by a freelancer. No website yet? Write \"none\" or note what you plan to use.",
  },
  {
    id: "ts_1_2",
    text: "What email marketing platform is used?",
    type: "text",
    section: "12. Tech Stack and Access Map",
    placeholder: "Email service provider...",
    tip: "Name the tool and roughly how many subscribers you have. If you don't send emails yet, just say so.",
  },
  {
    id: "ts_1_3",
    text: "What CRM is used?",
    type: "text",
    section: "12. Tech Stack and Access Map",
    placeholder: "Customer relationship management system...",
    tip: "A spreadsheet or your inbox counts if that's where you track clients. Name it honestly so recommendations fit how you work now.",
  },
  {
    id: "ts_1_4",
    text: "What payment processor is used?",
    type: "text",
    section: "12. Tech Stack and Access Map",
    placeholder: "Payment gateway or processor...",
    tip: "Just name the processor, never account numbers or logins. If you use more than one, note which handles what, like invoices versus checkout.",
  },
  {
    id: "ts_1_5",
    text: "What project management tool is used?",
    type: "text",
    section: "12. Tech Stack and Access Map",
    placeholder: "PM platform for task and project tracking...",
    tip: "Include any tool where tasks live, even a paper planner or notes app. If several are in use, mention which one you rely on most.",
  },
  {
    id: "ts_1_6",
    text: "What communication tools are used?",
    type: "text",
    section: "12. Tech Stack and Access Map",
    placeholder: "Slack, Teams, email, video conferencing, etc....",
    tip: "Cover chat, email and text, and note which one the team actually uses most. Just the tool names are needed here.",
  },
  {
    id: "ts_1_7",
    text: "What file storage system is used?",
    type: "text",
    section: "12. Tech Stack and Access Map",
    placeholder: "Google Drive, Dropbox, SharePoint, etc....",
    tip: "Name where your files mainly live and whether it's organized. Mention if things are scattered across a few places; that's common and useful to know.",
  },
  {
    id: "ts_1_8",
    text: "What accounting software is used?",
    type: "text",
    section: "12. Tech Stack and Access Map",
    placeholder: "QuickBooks, Xero, FreshBooks, etc....",
    tip: "Name the software and who updates it, you or a bookkeeper. Using a spreadsheet or nothing yet? Say so, and leave out any account details.",
  },
  {
    id: "ts_1_9",
    text: "What scheduling tool is used?",
    type: "text",
    section: "12. Tech Stack and Access Map",
    placeholder: "Calendly, Acuity, SavvyCal, etc....",
    tip: "Name the tool and what it books, such as discovery calls or sessions. If clients schedule by email, that's a fine answer.",
  },
  {
    id: "ts_1_10",
    text: "What video conferencing tool is used?",
    type: "text",
    section: "12. Tech Stack and Access Map",
    placeholder: "Zoom, Google Meet, Microsoft Teams, etc....",
    tip: "Name your main tool and anything clients sometimes ask you to use instead. No need to include meeting links or logins.",
  },
  {
    id: "ts_1_11",
    text: "What course or membership platform is used?",
    type: "text",
    section: "12. Tech Stack and Access Map",
    placeholder: "Kajabi, Teachable, Circle, Mighty Networks, etc....",
    tip: "Name the platform hosting your courses, programs or community. Not offering these yet? Write \"none\" or note what you're considering.",
  },
  {
    id: "ts_1_12",
    text: "What form builder is used?",
    type: "text",
    section: "12. Tech Stack and Access Map",
    placeholder: "Typeform, JotForm, Google Forms, etc....",
    tip: "List the tool for intake forms, applications or surveys. If forms live inside another tool, like your scheduler or CRM, mention that.",
  },
  {
    id: "ts_1_13",
    text: "What analytics tools are used?",
    type: "text",
    section: "12. Tech Stack and Access Map",
    placeholder: "Google Analytics, Mixpanel, Amplitude, etc....",
    tip: "Include built-in dashboards from your website or social platforms too. If you don't track anything yet, just say so.",
  },
  {
    id: "ts_1_14",
    text: "What social media management tools are used?",
    type: "text",
    section: "12. Tech Stack and Access Map",
    placeholder: "Buffer, Hootsuite, Later, etc....",
    tip: "Name any scheduler you use, or write \"post manually\" if you publish directly. Mention which platforms it covers.",
  },
  {
    id: "ts_1_15",
    text: "What design tools are used?",
    type: "text",
    section: "12. Tech Stack and Access Map",
    placeholder: "Canva, Figma, Adobe Creative Suite, etc....",
    tip: "List what you or your designer use for graphics, slides or video. One or two tools is a typical answer for a small business.",
  },
  {
    id: "ts_1_16",
    text: "What contract or document signing tool is used?",
    type: "text",
    section: "12. Tech Stack and Access Map",
    placeholder: "DocuSign, HelloSign, PandaDoc, etc....",
    tip: "Name the tool you use for client agreements. If you send PDFs by email or use a built-in feature in another app, write that.",
  },
  {
    id: "ts_1_17",
    text: "What password manager is used?",
    type: "text",
    section: "12. Tech Stack and Access Map",
    placeholder: "1Password, LastPass, Bitwarden, etc....",
    tip: "Name the tool only. Please never type actual passwords, keys or codes anywhere in this assessment. If you don't use one, say so.",
  },
  {
    id: "ts_1_18",
    text: "What other critical tools are in the stack?",
    type: "text",
    section: "12. Tech Stack and Access Map",
    placeholder: "Any other essential software or platforms...",
    tip: "Think of anything you'd panic without for a day, like a podcast host, AI assistant or invoicing app. Tool names and their purpose are enough.",
  },

  // 12.2 Automations and Integrations (12 questions)
  {
    id: "ts_2_1",
    text: "What automations currently exist?",
    type: "text",
    section: "12. Tech Stack and Access Map",
    placeholder: "Automated workflows and processes...",
    tip: "Describe each in plain terms, such as \"new booking sends a welcome email.\" No automations yet? That's normal; write \"none.\"",
  },
  {
    id: "ts_2_2",
    text: "What tools are integrated?",
    type: "text",
    section: "12. Tech Stack and Access Map",
    placeholder: "Connected apps and platforms...",
    tip: "List pairs of connected tools, like \"scheduler connects to calendar and CRM.\" Skip anything you aren't sure is actually connected.",
  },
  {
    id: "ts_2_3",
    text: "What Zapier or Make workflows exist?",
    type: "text",
    section: "12. Tech Stack and Access Map",
    placeholder: "Automation platform workflows...",
    tip: "Describe what each workflow does in a sentence; there's no need to paste settings or keys. Not using these tools? Simply write \"none.\"",
  },
  {
    id: "ts_2_4",
    text: "What native integrations are used?",
    type: "text",
    section: "12. Tech Stack and Access Map",
    placeholder: "Direct integrations between tools...",
    tip: "These are built-in connections, like your payment tool syncing with accounting. A short list of tool pairs works well.",
  },
  {
    id: "ts_2_5",
    text: "What manual processes should be automated?",
    type: "text",
    section: "12. Tech Stack and Access Map",
    placeholder: "Opportunities for automation...",
    tip: "Think of tasks you repeat weekly or copy and paste between tools. Follow-up emails, invoicing and onboarding are common starting points.",
  },
  {
    id: "ts_2_6",
    text: "What data flows between systems?",
    type: "text",
    section: "12. Tech Stack and Access Map",
    placeholder: "How information moves between tools...",
    tip: "Trace one client's journey, for example \"form to CRM to email list to invoice.\" Note any spots where you re-enter info by hand.",
  },
  {
    id: "ts_2_7",
    text: "What is the single source of truth for key data?",
    type: "text",
    section: "12. Tech Stack and Access Map",
    placeholder: "Primary system for contacts, revenue, etc....",
    tip: "Name the one place you trust most for contacts, revenue and client status. If there isn't one yet, say which tool comes closest.",
  },
  {
    id: "ts_2_8",
    text: "What access levels exist for each tool?",
    type: "text",
    section: "12. Tech Stack and Access Map",
    placeholder: "Who has access to what and at what permission level...",
    tip: "List each tool with who has access and whether they're an admin or a limited user. Just names and roles; never include passwords.",
  },
  {
    id: "ts_2_9",
    text: "What backup and security measures exist?",
    type: "text",
    section: "12. Tech Stack and Access Map",
    placeholder: "Data backup, security protocols, etc....",
    tip: "Mention things like two-factor login, automatic backups and a password manager. Unsure? Write what you know and flag it as something to check.",
  },
  {
    id: "ts_2_10",
    text: "What happens when a team member leaves?",
    type: "text",
    section: "12. Tech Stack and Access Map",
    placeholder: "Offboarding process for access removal...",
    tip: "Describe how you remove access and recover files or logins. If you've never had to do this, write the steps you'd want to follow.",
  },
  {
    id: "ts_2_11",
    text: "What tools are redundant or underutilized?",
    type: "text",
    section: "12. Tech Stack and Access Map",
    placeholder: "Tools that could be consolidated or eliminated...",
    tip: "Look at subscriptions you pay for but rarely open, or two tools doing the same job. Your bank or card statement is a quick way to spot them.",
  },
  {
    id: "ts_2_12",
    text: "What should AI be allowed to access or configure?",
    type: "text",
    section: "12. Tech Stack and Access Map",
    placeholder: "Guidelines for AI access to tools and systems...",
    tip: "Name tools AI may read, draft in, or change, and anything that's off-limits like payments. Never share passwords or keys here; just describe the boundaries.",
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

  // Send each answer to the server as it's given, so the AI assistant learns from
  // it right away — not only once the whole assessment is finished.
  useAssessmentSync("brain", answers, (id, value) => {
    const q = questions.find((x) => x.id === id);
    return q ? { questionId: id, questionText: q.text, section: q.section, answerText: value, value } : null;
  });

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

  // Multi-select answers are stored as a comma-separated list of option values
  // (e.g. "local,online,hybrid") so every answer stays a plain string.
  const selectedValues = (id: string) =>
    (answers[id] ?? "").split(",").map((v) => v.trim()).filter(Boolean);

  const toggleMulti = (value: string) => {
    const q = questions[currentQuestion];
    const current = selectedValues(q.id);
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    // Keep the options' own order so saved answers read consistently.
    const ordered = (q.options ?? []).map((o) => o.value).filter((v) => next.includes(v));
    handleAnswer(ordered.join(","));
  };

  // Human-readable answer for saving: option labels instead of raw values.
  const answerTextFor = (q: Question) => {
    const raw = answers[q.id] ?? "";
    if ((q.type === "radio" || q.type === "multiselect") && q.options) {
      const vals = q.type === "multiselect" ? selectedValues(q.id) : [raw];
      return vals.map((v) => q.options!.find((o) => o.value === v)?.label ?? v).join("; ");
    }
    return raw;
  };

  const persistResponses = async () => {
    const payload = questions
      .filter((q) => (answers[q.id] ?? "").toString().trim() !== "")
      .map((q) => ({
        questionId: q.id,
        questionText: q.text,
        section: q.section,
        answerText: answerTextFor(q),
        value: answers[q.id] ?? "",
      }));
    try {
      await fetch("/api/assessments/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "brain", responses: payload }),
      });
      // Kick off scoring so the dashboard updates without a manual trigger.
      await fetch("/api/scoring/recompute", { method: "POST" }).catch(() => {});
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

            {currentQ.tip && (
              <div className="flex gap-2 rounded-xl border border-[#c9a227]/30 bg-[#c9a227]/5 px-4 py-3 text-sm leading-relaxed text-[#6b5d52]">
                <span aria-hidden="true">💡</span>
                <p>
                  <span className="font-semibold text-[#8a6d1f]">Tip: </span>
                  {currentQ.tip}
                </p>
              </div>
            )}

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

            {currentQ.type === "multiselect" && currentQ.options && (
              <div className="space-y-3">
                <p className="text-sm text-[#b8a898]">Select all that apply.</p>
                {currentQ.options.map((option) => {
                  const checked = selectedValues(currentQ.id).includes(option.value);
                  return (
                    <label
                      key={option.value}
                      className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        checked
                          ? "border-[#4a9b9b] bg-[#4a9b9b]/5"
                          : "border-[#c9a227]/20 hover:border-[#c9a227]/40"
                      }`}
                    >
                      <input
                        type="checkbox"
                        name={currentQ.id}
                        value={option.value}
                        checked={checked}
                        onChange={() => toggleMulti(option.value)}
                        className="mt-1 w-4 h-4 rounded text-[#4a9b9b] focus:ring-[#4a9b9b]"
                      />
                      <span className="text-[#1a2b4a] dark:text-[#F8F5F0]">
                        {option.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}

            {currentQ.type === "number" && (
              <input
                type="text"
                inputMode="numeric"
                value={answers[currentQ.id] || ""}
                onChange={(e) => {
                  const digits = e.target.value.replace(/[^0-9]/g, "");
                  handleAnswer(currentQ.placeholder === "YYYY" ? digits.slice(0, 4) : digits);
                }}
                placeholder={currentQ.placeholder || "Enter a number"}
                className="w-full max-w-xs p-4 rounded-xl border-2 border-[#c9a227]/20 focus:border-[#4a9b9b] focus:ring-2 focus:ring-[#4a9b9b]/20 outline-none bg-white dark:bg-[#1a1a2e] text-[#1a2b4a] dark:text-[#F8F5F0] text-lg tabular-nums"
              />
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
