// Plan blueprints — the structured sections behind each plan-builder. Baseline
// sections are the practical minimum for a meaningful plan (strongly guided, not
// hard-blocked). Each section carries guiding questions and an "assess" hint that
// tells the AI which assessment evidence to lean on when drafting.
export type PlanKind = "business" | "marketing" | "sales" | "forecasting";

export interface BlueprintSection {
  key: string;
  title: string;
  description: string; // what this section should capture
  baseline: boolean; // part of the required foundational baseline
  guiding: string[]; // questions to prompt the owner / steer the AI
  assess: string; // which assessment evidence informs it (for the AI prompt)
}

export interface Blueprint {
  kind: PlanKind;
  label: string;
  tagline: string;
  sections: BlueprintSection[];
}

const BUSINESS: Blueprint = {
  kind: "business",
  label: "Business Plan",
  tagline: "Vision, model, and the objectives that anchor everything else",
  sections: [
    {
      key: "vision_mission",
      title: "Vision, Mission & Values",
      description: "The legacy you're building, why it matters, and the values that govern how you operate.",
      baseline: true,
      guiding: [
        "What does this business look like in 5–10 years if it fully succeeds?",
        "Who does it serve, and what change does it create for them?",
        "What 3–5 values are non-negotiable in how you work?",
      ],
      assess: "Soul assessment (core identity, calling, values) and overall alignment.",
    },
    {
      key: "offering",
      title: "What You Offer",
      description: "The products and services you sell and the core problem each one solves.",
      baseline: true,
      guiding: [
        "What are your primary offers, and what problem does each solve?",
        "What makes your delivery distinctive?",
      ],
      assess: "Brain assessment (product/service system) and the Product profit domain.",
    },
    {
      key: "target_market",
      title: "Target Market & Ideal Client",
      description: "Who you serve, their defining traits, and where they are.",
      baseline: true,
      guiding: [
        "Who is your ideal client (demographics, situation, pain)?",
        "How big is this market and where do they gather?",
      ],
      assess: "Brain (marketing system) and Soul (who you're called to serve).",
    },
    {
      key: "revenue_model",
      title: "Revenue Model & Pricing",
      description: "How the business makes money — offers, pricing, and margins.",
      baseline: true,
      guiding: [
        "What are your revenue streams and price points?",
        "What are your target margins, and what's the path to profitability?",
      ],
      assess: "Finance profit domain, Brain (finance system), and current ledger reality.",
    },
    {
      key: "goals_milestones",
      title: "12-Month Goals & Milestones",
      description: "The concrete outcomes and milestones for the next year.",
      baseline: true,
      guiding: [
        "What are your top 3–5 goals for the next 12 months?",
        "What milestones mark real progress toward each?",
      ],
      assess: "Overall alignment score, priority gaps, and weakest dimensions.",
    },
    {
      key: "competitive_edge",
      title: "Positioning & Competitive Edge",
      description: "Why clients choose you over alternatives.",
      baseline: false,
      guiding: ["Who are your alternatives and how are you meaningfully different?", "What's your unfair advantage?"],
      assess: "Brain (marketing) and Soul (unique gifts).",
    },
    {
      key: "operations_overview",
      title: "Operations Overview",
      description: "How the business runs day to day — key processes and delivery.",
      baseline: false,
      guiding: ["What are your core operational processes?", "Where are the bottlenecks?"],
      assess: "Brain (operations/systems) and the Operations profit domain.",
    },
    {
      key: "team_roles",
      title: "Team & Roles",
      description: "Who does what now, and the roles you'll need to grow.",
      baseline: false,
      guiding: ["Who's on the team and what do they own?", "What roles must you add to scale?"],
      assess: "Brain (team) and the Team profit domain.",
    },
    {
      key: "risks",
      title: "Key Risks & Mitigations",
      description: "The biggest threats to the plan and how you'll manage them.",
      baseline: false,
      guiding: ["What are the top risks to this business?", "How will you mitigate each?"],
      assess: "Weakest dimensions and priority gaps.",
    },
  ],
};

const MARKETING: Blueprint = {
  kind: "marketing",
  label: "Marketing Plan",
  tagline: "How the right people find, trust, and choose you",
  sections: [
    {
      key: "ideal_client",
      title: "Ideal Client Profile",
      description: "A vivid picture of the person you most want to serve.",
      baseline: true,
      guiding: [
        "Describe your ideal client — their world, goals, and pain.",
        "What triggers them to look for a solution like yours?",
      ],
      assess: "Brain (marketing), Soul (who you serve), and the Client profit domain.",
    },
    {
      key: "positioning",
      title: "Positioning & Core Message",
      description: "The one clear idea you want to own in their mind.",
      baseline: true,
      guiding: ["In one sentence, what do you help people do?", "Why you, and why now?"],
      assess: "Brain (marketing) and Soul (unique gifts and story).",
    },
    {
      key: "offers_promise",
      title: "Core Offer & Promise",
      description: "The primary offer you lead with and the transformation it promises.",
      baseline: true,
      guiding: ["What's the offer you lead with?", "What transformation do you promise?"],
      assess: "Product and Client profit domains.",
    },
    {
      key: "channels",
      title: "Channels & Cadence",
      description: "Where you'll show up and how consistently.",
      baseline: true,
      guiding: ["Which 2–3 channels fit your clients and your strengths?", "What posting/outreach cadence can you sustain?"],
      assess: "Brain (marketing system) and current capacity.",
    },
    {
      key: "content_strategy",
      title: "Content Strategy",
      description: "The themes and formats that build trust and demand.",
      baseline: false,
      guiding: ["What 3–5 content themes speak to your ideal client?", "What formats will you use?"],
      assess: "Brain (marketing) and Soul (voice).",
    },
    {
      key: "brand_voice",
      title: "Brand Voice & Story",
      description: "How you sound and the story that makes you memorable.",
      baseline: false,
      guiding: ["How would you describe your brand voice?", "What's the origin story worth telling?"],
      assess: "Soul (story, values, voice).",
    },
    {
      key: "metrics",
      title: "Marketing Metrics & Targets",
      description: "The few numbers that tell you it's working.",
      baseline: false,
      guiding: ["What leads/traffic/engagement targets matter?", "What's your target conversion from audience to lead?"],
      assess: "Marketing profit domain and current baselines.",
    },
  ],
};

const SALES: Blueprint = {
  kind: "sales",
  label: "Sales Plan",
  tagline: "Turning interest into committed, well-served clients",
  sections: [
    {
      key: "offers_ladder",
      title: "Offers & Pricing Ladder",
      description: "Your offers from entry to premium, and how they build on each other.",
      baseline: true,
      guiding: ["What are your offers from lowest to highest commitment?", "How does someone move up the ladder?"],
      assess: "Product and Finance profit domains.",
    },
    {
      key: "ideal_prospect",
      title: "Who You Sell To",
      description: "The qualified prospect and how you know they're a fit.",
      baseline: true,
      guiding: ["Who's the right-fit buyer?", "What qualifies (or disqualifies) a prospect?"],
      assess: "Brain (sales) and the Client profit domain.",
    },
    {
      key: "pipeline_stages",
      title: "Pipeline & Sales Process",
      description: "The stages a prospect moves through and what happens at each.",
      baseline: true,
      guiding: ["What are your pipeline stages, first contact to close?", "What moves someone to the next stage?"],
      assess: "Brain (sales system) and the Sales profit domain.",
    },
    {
      key: "targets",
      title: "Revenue Targets & Quotas",
      description: "What you need to sell, and the activity that gets you there.",
      baseline: true,
      guiding: ["What's your revenue target and over what period?", "How many conversations/proposals does that require?"],
      assess: "Finance profit domain, current pipeline, and ledger reality.",
    },
    {
      key: "conversion_strategy",
      title: "Conversion & Objections",
      description: "How you help the right people say yes.",
      baseline: false,
      guiding: ["What's your approach to a sales conversation?", "What are the top objections and your responses?"],
      assess: "Brain (sales) and Soul (integrity in selling).",
    },
    {
      key: "follow_up",
      title: "Follow-up Cadence",
      description: "How you stay in touch until it's a yes or a clear no.",
      baseline: false,
      guiding: ["What's your follow-up rhythm after a first touch?", "When do you stop?"],
      assess: "Brain (sales) and current follow-up habits.",
    },
    {
      key: "referral",
      title: "Referral Strategy",
      description: "Turning happy clients into your best sales channel.",
      baseline: false,
      guiding: ["How and when do you ask for referrals?", "What makes referring you easy?"],
      assess: "Client profit domain and the Referral operational pillar.",
    },
  ],
};

const FORECASTING: Blueprint = {
  kind: "forecasting",
  label: "Forecast Plan",
  tagline: "The assumptions and drivers behind your projections",
  sections: [
    {
      key: "revenue_streams",
      title: "Revenue Streams & Drivers",
      description: "Where revenue comes from and what drives each stream up or down.",
      baseline: true,
      guiding: ["What are your revenue streams?", "What's the main lever that grows each?"],
      assess: "Finance profit domain, ledger income mix, and the revenue model from the Business Plan.",
    },
    {
      key: "assumptions",
      title: "Key Growth Assumptions",
      description: "The reasoning behind your growth rate, pipeline close rate, and expense ratio.",
      baseline: true,
      guiding: ["Why is your monthly growth assumption realistic?", "What % of pipeline do you truly close, and why?"],
      assess: "Sales pipeline history and finance trend.",
    },
    {
      key: "targets",
      title: "Financial Targets",
      description: "The revenue and net targets you're steering toward over the horizon.",
      baseline: true,
      guiding: ["What revenue and net do you want by the end of the horizon?", "What would make this a great year?"],
      assess: "Business Plan goals and the Finance profit domain.",
    },
    {
      key: "risks_levers",
      title: "Risks & Levers",
      description: "What could knock the forecast off course, and the levers you can pull.",
      baseline: false,
      guiding: ["What are the biggest risks to hitting the forecast?", "What levers can you pull if you're behind?"],
      assess: "Weakest dimensions and finance health.",
    },
  ],
};

export const BLUEPRINTS: Record<PlanKind, Blueprint> = {
  business: BUSINESS,
  marketing: MARKETING,
  sales: SALES,
  forecasting: FORECASTING,
};

export function getBlueprint(kind: string): Blueprint | null {
  return (BLUEPRINTS as Record<string, Blueprint>)[kind] || null;
}

export const PLAN_KINDS: PlanKind[] = ["business", "marketing", "sales", "forecasting"];

// Baseline completeness (0-100) given the set of filled section keys.
export function baselineCompleteness(kind: string, filledKeys: Set<string>): number {
  const bp = getBlueprint(kind);
  if (!bp) return 0;
  const baseline = bp.sections.filter((s) => s.baseline);
  if (baseline.length === 0) return 100;
  const done = baseline.filter((s) => filledKeys.has(s.key)).length;
  return Math.round((done / baseline.length) * 100);
}
