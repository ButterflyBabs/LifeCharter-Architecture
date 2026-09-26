// The Marketing Plan guided questionnaires (Ideal Client, Positioning, Core
// Messaging, Channels, Content). Shared by the pages, the save route
// (/api/marketing-plan/answers) and anything that reads a client's answers
// as context (e.g. the Phase 3 social week writer). Client-safe.

export interface GuideQuestion {
  id: string;
  question: string;
  type: "text" | "textarea" | "choice" | "list";
  placeholder?: string;
  hint?: string;
  options?: string[];
}

export type GuideAnswer = string | string[];
export type GuideAnswers = Record<string, GuideAnswer>;

export const IDEAL_CLIENT_QUESTIONS: GuideQuestion[] = [
  {
    id: "demographics",
    question: "Describe your ideal client's demographics",
    type: "text",
    placeholder: "e.g., Women, 35-50, household income $75k+, suburban, college-educated",
    hint: "Age, gender, location, income, education, occupation"
  },
  {
    id: "psychographics",
    question: "What do they value? What matters most to them?",
    type: "textarea",
    placeholder: "Family, career success, health, freedom, recognition, security...",
    hint: "Think about their priorities, beliefs, and what drives their decisions."
  },
  {
    id: "current-state",
    question: "Where are they RIGHT NOW (before working with you)?",
    type: "textarea",
    placeholder: "Describe their current situation, frustrations, and daily reality...",
    hint: "Paint a vivid picture of their 'before' state."
  },
  {
    id: "desired-state",
    question: "Where do they want to be (after working with you)?",
    type: "textarea",
    placeholder: "Describe their ideal outcome and how life looks different...",
    hint: "This is the transformation you sell. Make it compelling."
  },
  {
    id: "pain-points",
    question: "What are their top 3 pain points or frustrations?",
    type: "list",
    placeholder: "Add a pain point...",
    hint: "These are the problems they're actively trying to solve."
  },
  {
    id: "objections",
    question: "What objections might they have to working with you?",
    type: "list",
    placeholder: "Add an objection...",
    hint: "Price, time, skepticism, past failures—these help you address concerns upfront."
  },
  {
    id: "where-hangout",
    question: "Where do they spend time online and offline?",
    type: "textarea",
    placeholder: "Social platforms, websites, groups, events, podcasts, publications...",
    hint: "This tells you where to show up to reach them."
  },
  {
    id: "decision-maker",
    question: "Are they the decision-maker, or is someone else involved?",
    type: "choice",
    options: [
      "They make the decision alone",
      "They consult with spouse/partner",
      "They need approval from boss/organization",
      "Multiple stakeholders involved",
      "It varies"
    ]
  },
  {
    id: "buying-triggers",
    question: "What triggers them to buy? What makes them ready?",
    type: "textarea",
    placeholder: "A specific event, reaching a breaking point, seasonal timing...",
    hint: "Understanding triggers helps you time your marketing."
  }
];

export const POSITIONING_QUESTIONS: GuideQuestion[] = [
  {
    id: "what-you-do",
    question: "What do you do, in the simplest terms?",
    type: "text",
    placeholder: "e.g., I help working moms lose weight without giving up family dinners",
    hint: "Avoid jargon. Imagine explaining to a 10-year-old."
  },
  {
    id: "who-you-help",
    question: "Who specifically do you help?",
    type: "text",
    placeholder: "e.g., Working moms with kids under 10 who struggle with meal prep",
    hint: "The more specific, the better. 'Everyone' is not a target."
  },
  {
    id: "transformation",
    question: "What transformation do you create for them?",
    type: "textarea",
    placeholder: "Describe the before and after. What changes in their life after working with you?",
    hint: "Focus on outcomes, not processes."
  },
  {
    id: "differentiation",
    question: "What makes your approach different from others?",
    type: "textarea",
    placeholder: "Your unique methodology, perspective, or experience...",
    hint: "This is your competitive advantage. What do you believe that others don't?"
  },
  {
    id: "why-you",
    question: "Why do clients choose YOU specifically?",
    type: "choice",
    options: [
      "My specific expertise/credentials",
      "My unique methodology",
      "My personal story/experience",
      "My personality/approach",
      "Results I've gotten for others",
      "Something else"
    ]
  },
  {
    id: "promise",
    question: "What's the main promise you make to clients?",
    type: "text",
    placeholder: "e.g., Lose 20 pounds in 90 days without giving up family dinners",
    hint: "Make it specific and measurable if possible."
  },
  {
    id: "tagline-ideas",
    question: "Based on your answers, here are some tagline ideas. Which resonates most?",
    type: "choice",
    options: [
      "[AI will generate options based on previous answers]",
      "I want to create my own",
      "None of these feel right yet"
    ]
  }
];

export const MESSAGING_QUESTIONS: GuideQuestion[] = [
  {
    id: "core-message",
    question: "What is the ONE thing you want people to remember about your business?",
    type: "textarea",
    placeholder: "The single most important message that should stick with your audience...",
    hint: "If they forget everything else, what should they remember?"
  },
  {
    id: "tagline",
    question: "What is your tagline or headline?",
    type: "text",
    placeholder: "e.g., Lose 20 pounds without giving up family dinners",
    hint: "Short, memorable, benefit-focused. Think billboard test."
  },
  {
    id: "brand-voice",
    question: "How would you describe your brand voice?",
    type: "choice",
    options: [
      "Warm and compassionate",
      "Direct and no-nonsense",
      "Professional and authoritative",
      "Playful and energetic",
      "Calm and contemplative",
      "Bold and provocative"
    ]
  },
  {
    id: "talking-points",
    question: "What are your 3-5 key talking points?",
    type: "list",
    placeholder: "Add a key message...",
    hint: "These are the core ideas you repeat across all your content."
  },
  {
    id: "origin-story",
    question: "What is your origin story? Why do you do this work?",
    type: "textarea",
    placeholder: "The journey that led you to this work, the moment you knew this was your calling...",
    hint: "People connect with stories, not just services. What makes your journey relatable?"
  },
  {
    id: "client-transformation",
    question: "Describe a typical client transformation story",
    type: "textarea",
    placeholder: "Where they start, the journey, where they end up...",
    hint: "Before/during/after. Make it concrete and emotional."
  },
  {
    id: "objection-handling",
    question: "How do you address common objections in your messaging?",
    type: "textarea",
    placeholder: "Price concerns, time concerns, skepticism... how do you reframe these?",
    hint: "Anticipate resistance and address it proactively in your content."
  },
  {
    id: "call-to-action",
    question: "What is your primary call-to-action?",
    type: "text",
    placeholder: "e.g., Book a free discovery call, Download the guide, Join the waitlist",
    hint: "What ONE action do you want people to take?"
  }
];

export const CHANNELS_QUESTIONS: GuideQuestion[] = [
  {
    id: "primary-channel",
    question: "What is your PRIMARY marketing channel?",
    type: "choice",
    options: [
      "LinkedIn",
      "Instagram",
      "Facebook",
      "TikTok",
      "YouTube",
      "Email/Newsletter",
      "Podcast",
      "Blog/Website",
      "Networking/Events",
      "Referrals"
    ]
  },
  {
    id: "why-channel",
    question: "Why did you choose this channel?",
    type: "textarea",
    placeholder: "Your ideal client is there, you enjoy using it, it aligns with your strengths...",
    hint: "The best channel is where your people are AND where you can show up consistently."
  },
  {
    id: "secondary-channels",
    question: "What secondary channels will you use? (Select up to 2)",
    type: "list",
    placeholder: "Add a secondary channel...",
    hint: "Don't spread too thin. Master one before adding others."
  },
  {
    id: "content-types",
    question: "What types of content will you create?",
    type: "list",
    placeholder: "e.g., Educational posts, client stories, behind-the-scenes, tips...",
    hint: "Match content types to your strengths and what your audience consumes."
  },
  {
    id: "posting-frequency",
    question: "How often will you post on your primary channel?",
    type: "choice",
    options: [
      "Daily",
      "3-5 times per week",
      "2-3 times per week",
      "Weekly",
      "A few times per month"
    ]
  },
  {
    id: "time-commitment",
    question: "How much time can you realistically dedicate to content creation weekly?",
    type: "choice",
    options: [
      "Less than 2 hours",
      "2-5 hours",
      "5-10 hours",
      "10+ hours"
    ]
  },
  {
    id: "content-pillars",
    question: "What are your 3 content pillars?",
    type: "list",
    placeholder: "Add a content pillar...",
    hint: "These are the 3 main topics you'll rotate through. They should serve your audience AND showcase your expertise."
  },
  {
    id: "engagement-strategy",
    question: "How will you engage with your audience?",
    type: "textarea",
    placeholder: "Commenting on others' posts, responding to comments, DMs, live sessions...",
    hint: "Engagement is often more important than posting. How will you build relationships?"
  },
  {
    id: "first-30-days",
    question: "What are your first 30 days focused on?",
    type: "list",
    placeholder: "Add a focus area...",
    hint: "Set up profile, create lead magnet, establish posting rhythm, build connections..."
  }
];

export const CONTENT_QUESTIONS: GuideQuestion[] = [
  {
    id: "content-pillars",
    question: "What are your 3 core content pillars?",
    type: "list",
    placeholder: "e.g., Mindset shifts, Practical strategies, Client success stories...",
    hint: "These 3 topics will be the foundation of everything you create."
  },
  {
    id: "content-formats",
    question: "What content formats will you create?",
    type: "list",
    placeholder: "e.g., Carousel posts, Reels, Long-form articles, Live videos...",
    hint: "Choose formats that match your strengths and your audience's preferences."
  },
  {
    id: "content-strength",
    question: "What type of content do you naturally create best?",
    type: "choice",
    options: [
      "Writing/articles",
      "Short-form video (Reels/TikTok)",
      "Long-form video (YouTube)",
      "Audio/podcasts",
      "Visuals/graphics",
      "Live streaming"
    ]
  },
  {
    id: "batch-creation",
    question: "Will you batch-create content or create in real-time?",
    type: "choice",
    options: [
      "Batch create weekly",
      "Batch create monthly",
      "Create in real-time",
      "Mix of both"
    ]
  },
  {
    id: "content-calendar",
    question: "What does your ideal content calendar look like?",
    type: "textarea",
    placeholder: "Monday: Educational post, Wednesday: Client story, Friday: Call-to-action...",
    hint: "Having a repeatable structure makes creation easier."
  },
  {
    id: "repurposing",
    question: "How will you repurpose content across channels?",
    type: "textarea",
    placeholder: "e.g., Blog post becomes email, social posts, and video script...",
    hint: "One piece of core content can become 5-10 pieces across channels."
  },
  {
    id: "content-tools",
    question: "What tools will you use for content creation?",
    type: "list",
    placeholder: "e.g., Canva, CapCut, Notion, ChatGPT...",
    hint: "Keep your tech stack simple. Master a few tools rather than juggling many."
  },
  {
    id: "content-struggles",
    question: "What do you anticipate being your biggest content challenge?",
    type: "choice",
    options: [
      "Coming up with ideas",
      "Finding time to create",
      "Staying consistent",
      "Creating quality content",
      "Getting engagement",
      "Converting viewers to leads"
    ]
  },
  {
    id: "content-goals",
    question: "What are your 90-day content goals?",
    type: "list",
    placeholder: "e.g., Post 3x per week, grow email list by 100, get first 5 leads...",
    hint: "Be specific and realistic. What would success look like in 90 days?"
  }
];

export const GUIDE_PAGES = {
  "ideal-client": { title: "Ideal Client Profile", questions: IDEAL_CLIENT_QUESTIONS },
  positioning: { title: "Positioning", questions: POSITIONING_QUESTIONS },
  messaging: { title: "Core Messaging", questions: MESSAGING_QUESTIONS },
  channels: { title: "Channel Strategy", questions: CHANNELS_QUESTIONS },
  content: { title: "Content Strategy", questions: CONTENT_QUESTIONS },
} as const;

export type GuidePage = keyof typeof GUIDE_PAGES;

export const isGuidePage = (p: unknown): p is GuidePage => typeof p === "string" && p in GUIDE_PAGES;

// Keep only answers to this page's questions, in a safe shape and size.
export function cleanGuideAnswers(page: GuidePage, raw: unknown): GuideAnswers {
  const out: GuideAnswers = {};
  if (!raw || typeof raw !== "object") return out;
  const src = raw as Record<string, unknown>;
  for (const q of GUIDE_PAGES[page].questions) {
    const v = src[q.id];
    if (typeof v === "string" && v.trim()) out[q.id] = v.slice(0, 5000);
    else if (Array.isArray(v)) {
      const list = v.filter((x): x is string => typeof x === "string" && x.trim() !== "").slice(0, 30).map((x) => x.slice(0, 500));
      if (list.length) out[q.id] = list;
    }
  }
  return out;
}

// Plain-text version of a client's answers, for AI context.
export function guideAnswersAsText(answersByPage: Partial<Record<GuidePage, GuideAnswers>>): string {
  const parts: string[] = [];
  for (const [page, def] of Object.entries(GUIDE_PAGES) as [GuidePage, (typeof GUIDE_PAGES)[GuidePage]][]) {
    const a = answersByPage[page];
    if (!a || !Object.keys(a).length) continue;
    const lines = def.questions
      .filter((q) => a[q.id] !== undefined)
      .map((q) => `- ${q.question} ${Array.isArray(a[q.id]) ? (a[q.id] as string[]).join("; ") : a[q.id]}`);
    parts.push(`${def.title}:\n${lines.join("\n")}`);
  }
  return parts.join("\n\n");
}
