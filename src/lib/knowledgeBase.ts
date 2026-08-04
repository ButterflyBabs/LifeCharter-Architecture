// LifeCharter knowledge base — the comprehensive Q&A behind the Help page and
// the Travel Partner "Ask" widget. This is the single source of truth for how
// every feature works. As new features ship, add their Q&A here (and clients can
// add their own entries via the Help page, stored in the qa_entries table).
export interface KbEntry {
  id: string;
  category: string;
  question: string;
  answer: string;
  keywords: string[];
}

export const KB_CATEGORIES: string[] = [
  "Getting Started",
  "Daily Rhythm",
  "Business Alignment",
  "Planning",
  "Sales",
  "Finance",
  "Operations",
  "Growth & Reviews",
  "AI & Automation",
  "Integrations",
  "Account & Settings",
];

export const KNOWLEDGE_BASE: KbEntry[] = [
  // ---- Getting Started ----
  {
    id: "gs-what-is",
    category: "Getting Started",
    question: "What is LifeCharter Command Suite?",
    answer:
      "LifeCharter is your business command center. It brings your daily execution (Morning Brief, Daily Compass, tasks, quick wins), your strategy (Business Plan, Marketing Plan, 12 business dimensions), your numbers (the full Finance suite), your operations (8 operational pillars), and your growth engine (reviews, follow-ups, content) into one place — with an AI guide woven throughout.",
    keywords: ["what", "lifecharter", "overview", "about", "suite", "command"],
  },
  {
    id: "gs-travel-partner",
    category: "Getting Started",
    question: "What is the Travel Partner widget?",
    answer:
      "Travel Partner is your always-available guide, docked in the corner of the screen. It walks you through setting up LifeCharter step by step, tracks your progress, and — in Ask mode — answers questions about how anything in the app works. It checks this knowledge base first and only suggests contacting support if it genuinely can't answer.",
    keywords: ["travel partner", "widget", "guide", "help", "assistant"],
  },
  {
    id: "gs-where-start",
    category: "Getting Started",
    question: "Where should I start?",
    answer:
      "Start with your Domain Assessment (Assessments) to establish a baseline across your 12 business dimensions. Then create your Business Plan and Marketing Plan. From there, set up Sales, Finance, and Operations. The Travel Partner widget lays this out as a guided journey with time estimates.",
    keywords: ["start", "begin", "first", "onboarding", "setup", "getting started"],
  },

  // ---- Daily Rhythm ----
  {
    id: "dr-morning-brief",
    category: "Daily Rhythm",
    question: "What is the Morning Brief?",
    answer:
      "The Morning Brief is your daily launchpad. It greets you by time of day, shows your next meeting (which advances through the day as meetings pass, and shows an 'all done' state once they're over), your top focus tasks for today, anything carried over from earlier, and your Quick Wins. It's designed to be the first page you open each morning.",
    keywords: ["morning brief", "brief", "next meeting", "daily", "today", "focus"],
  },
  {
    id: "dr-daily-compass",
    category: "Daily Rhythm",
    question: "What is the Daily Compass?",
    answer:
      "The Daily Compass is your daily execution hub. It shows AI insights from your business bot grounded in your 12 dimensions and 8 operational pillars, your priority tasks, your Quick Wins (fully editable and AI-assisted), today's activity, and your Global Control contacts. It's where you turn strategy into action each day.",
    keywords: ["daily compass", "compass", "insights", "execution", "priorities"],
  },
  {
    id: "dr-quick-wins",
    category: "Daily Rhythm",
    question: "How do Quick Wins work?",
    answer:
      "Quick Wins are small, high-leverage actions you can do today. You get 10 to choose from, and clicking any one instantly creates a real task for today. You can edit each win's wording manually or with AI ('Polish with AI'), delete ones that don't fit, and generate brand-new AI suggestions tailored to your weakest business areas. They appear on both the Daily Compass (full manage mode) and the Morning Brief (quick tap-to-add).",
    keywords: ["quick wins", "quick win", "quickwins", "actions", "tasks", "ai suggest", "10"],
  },
  {
    id: "dr-notifications",
    category: "Daily Rhythm",
    question: "What do the notifications (the bell) show?",
    answer:
      "The bell in the top navigation is a live feed of things that need your attention: expenses that still need categorizing, operational pillars you've flagged as needing attention, tasks due today or overdue, and follow-ups that are ready. Click any notification to jump straight to the relevant page. You can mark items read, dismiss them, or mark all read; the unread count on the bell is real.",
    keywords: ["notifications", "bell", "alerts", "unread", "top nav"],
  },
  {
    id: "dr-tasks",
    category: "Daily Rhythm",
    question: "How do tasks work?",
    answer:
      "Tasks flow through statuses: backlog, today, in progress, waiting, and done. You can add them manually, and many parts of the app create them for you — Quick Wins, the follow-up engine, and the tax module (which adds a task to pay estimated quarterly taxes). Tasks can carry a due date and be tagged to any of your 12 business dimensions.",
    keywords: ["tasks", "todo", "task list", "due", "status"],
  },

  // ---- Business Alignment ----
  {
    id: "ba-12-dimensions",
    category: "Business Alignment",
    question: "What are the 12 business dimensions?",
    answer:
      "The 12 dimensions are the full picture of business health: Marketing, Sales, Operations, Finance, Team, Systems, Leadership, Vision, Product, Client Experience, Legal, and Sustainability. Your scores come from your completed assessments and feed your overall alignment score and your AI insights.",
    keywords: ["12 dimensions", "dimensions", "business dimensions", "alignment", "domains", "scores"],
  },
  {
    id: "ba-assessment",
    category: "Business Alignment",
    question: "How does the Domain Assessment work?",
    answer:
      "The assessment rates each of your 12 dimensions to establish a baseline. Scores come only from completed assessments (there's no manual-slider fallback), so your numbers reflect real reflection. Your overall score maps to a business phase: Survival, Growth, Expansion, or Legacy.",
    keywords: ["assessment", "domain assessment", "baseline", "score", "phase", "survival growth"],
  },
  {
    id: "ba-phases",
    category: "Business Alignment",
    question: "What do the business phases mean?",
    answer:
      "Your overall alignment score places you in a phase: Survival (0-40) is about stabilizing the fundamentals, Growth (41-60) about building momentum, Expansion (61-80) about scaling what works, and Legacy (81-100) about lasting impact. The phase shapes the guidance you get.",
    keywords: ["phase", "survival", "growth", "expansion", "legacy", "stage"],
  },

  // ---- Planning ----
  {
    id: "pl-business-plan",
    category: "Planning",
    question: "What goes in the Business Plan?",
    answer:
      "The Business Plan captures your vision, goals, and strategic priorities. It's the strategic anchor the rest of the app references — your Daily Compass insights and next moves are grounded in the direction you set here.",
    keywords: ["business plan", "vision", "goals", "strategy", "priorities"],
  },
  {
    id: "pl-marketing-plan",
    category: "Planning",
    question: "What is the Marketing Plan for?",
    answer:
      "The Marketing Plan clarifies your positioning, your ideal client, and your messaging. It's the foundation for your content, sales conversations, and outreach — so everything you say points in the same direction.",
    keywords: ["marketing plan", "positioning", "ideal client", "messaging", "brand"],
  },

  // ---- Sales ----
  {
    id: "sa-pipeline",
    category: "Sales",
    question: "How does the Sales pipeline work?",
    answer:
      "The Sales section holds your pipeline, your offers, and your sales process. You track prospects through stages, manage the offers you present, and turn interest into committed clients. Sales activity feeds into your overall business health.",
    keywords: ["sales", "pipeline", "offers", "prospects", "deals", "sales process"],
  },
  {
    id: "sa-follow-up",
    category: "Sales",
    question: "How does the follow-up engine work?",
    answer:
      "The follow-up engine keeps relationships warm. Contacts and tasks can carry a follow-up schedule; when a follow-up comes due, it surfaces in your notifications and Daily Compass so you reach out at the right moment. It works hand-in-hand with your Global Control contacts.",
    keywords: ["follow up", "follow-up", "followup", "engine", "reach out", "contacts", "cadence"],
  },

  // ---- Finance ----
  {
    id: "fi-center",
    category: "Finance",
    question: "What's in the Finance Center?",
    answer:
      "The Finance Center is your money command center with seven sections: Financial Pulse (cash-flow dashboard), Income Tracker, Expense Manager, Tech Stack Optimizer, P&L / Financial Reports, Budget Planner, and Tax Preparation. An AI health assessment runs across the whole section to flag where things are out of line and suggest specific fixes.",
    keywords: ["finance", "finance center", "money", "financial", "sections"],
  },
  {
    id: "fi-pulse",
    category: "Finance",
    question: "What is the Financial Pulse?",
    answer:
      "The Financial Pulse is your at-a-glance cash-flow dashboard: income, expenses, and net for week-to-date, month-to-date, and year-to-date, plus your budget status and an AI-graded health score. It pulls live from your Finance Center ledger.",
    keywords: ["financial pulse", "pulse", "cash flow", "dashboard", "mtd", "ytd", "health"],
  },
  {
    id: "fi-segments",
    category: "Finance",
    question: "Can I track income by business segment?",
    answer:
      "Yes. Income and expenses can be tagged to a business segment, so you can see which segments are the most profitable. The Finance Center breaks down profit by segment to show where your money is really coming from.",
    keywords: ["segment", "segments", "profitable", "business segment", "profit by segment"],
  },
  {
    id: "fi-budget",
    category: "Finance",
    question: "How flexible is the Budget Planner?",
    answer:
      "As minimal or as detailed as you want. Minimal mode is a single overall monthly budget (and optionally a monthly income target); detailed mode lets you set a budget per category. Budgets are monthly figures, and year-to-date budget is calculated from months elapsed.",
    keywords: ["budget", "budget planner", "minimal", "detailed", "categories", "monthly"],
  },
  {
    id: "fi-tax",
    category: "Finance",
    question: "How does Tax Preparation help with quarterly taxes?",
    answer:
      "The Tax module watches for uncategorized expenses and alerts you to categorize them first, so your estimate is accurate. Once expenses are clean, it calculates your estimated quarterly tax payment and adds a task to your list to pay it — with the proper amount. You'll always be cautioned about uncategorized expenses before it calculates, so you get the best possible assessment.",
    keywords: ["tax", "taxes", "quarterly", "estimated", "uncategorized", "tax prep", "irs"],
  },
  {
    id: "fi-reports",
    category: "Finance",
    question: "Can I export financial reports?",
    answer:
      "Yes. You can export financial reports — weekly, monthly, quarterly, annual, or a custom date range — as CSV or PDF. P&L statements are available for month, quarter, and year. Choose the exact date range you want when you run a report.",
    keywords: ["export", "reports", "csv", "pdf", "p&l", "pnl", "date range", "weekly monthly"],
  },
  {
    id: "fi-techstack",
    category: "Finance",
    question: "What is the Tech Stack Optimizer?",
    answer:
      "The Tech Stack Optimizer tracks your software spend from your ledger and uses AI to spot overlap, unused tools, and savings opportunities — so you can trim what you don't need and keep your tooling lean.",
    keywords: ["tech stack", "software", "subscriptions", "optimizer", "saas", "tools", "spend"],
  },
  {
    id: "fi-import",
    category: "Finance",
    question: "Can I import my financial data?",
    answer:
      "Yes. You can import a statement, and the system parses the transactions so you can review and commit them into your Finance Center ledger rather than entering everything by hand.",
    keywords: ["import", "statement", "csv import", "bank", "transactions", "upload"],
  },

  // ---- Operations ----
  {
    id: "op-pillars",
    category: "Operations",
    question: "What are the 8 operational pillars?",
    answer:
      "The 8 pillars are the operational backbone of your business: Customer Acquisition, Sales Journey, Onboarding, Support/Customer Service, Communication, Fulfillment, Internal Process & Culture, and Referral Process. On the Operations page you set each pillar's status and notes; that feeds your Daily Compass insights and overall business health.",
    keywords: ["operations", "8 pillars", "pillars", "operational", "acquisition", "onboarding", "fulfillment"],
  },
  {
    id: "op-status",
    category: "Operations",
    question: "How do I update an operational pillar?",
    answer:
      "On the Operations page, set each pillar's status (Not started, In progress, Needs attention, or Solid) and add notes on what's working or needs attention. Marking a pillar 'Needs attention' surfaces a notification. The AI Operations Insights card reads your pillar statuses and tells you where to focus next.",
    keywords: ["update pillar", "status", "needs attention", "solid", "operations insights", "notes"],
  },

  // ---- Growth & Reviews ----
  {
    id: "gr-reviews",
    category: "Growth & Reviews",
    question: "How does review / testimonial collection work?",
    answer:
      "The Reviews section runs your testimonial collection system. You can request reviews from clients and gather social proof that strengthens your marketing and sales. A quick win even prompts you to send a testimonial request to your best client.",
    keywords: ["reviews", "testimonial", "collect", "social proof", "feedback"],
  },

  // ---- AI & Automation ----
  {
    id: "ai-bot",
    category: "AI & Automation",
    question: "How does the AI in LifeCharter work?",
    answer:
      "Your AI guide (Mariposa by default) is woven throughout the app: it grades your financial health, suggests Quick Wins tailored to your weakest areas, generates Daily Compass insights grounded in your 12 dimensions and 8 pillars, optimizes your tech stack, and answers your questions in the Travel Partner widget. It uses your own connected AI key.",
    keywords: ["ai", "mariposa", "bot", "assistant", "intelligence", "how ai works"],
  },
  {
    id: "ai-key",
    category: "AI & Automation",
    question: "Why do I need to connect an AI key?",
    answer:
      "AI features (health analysis, insights, Quick Win suggestions, tech-stack optimization, Ask answers) run on your own AI key, connected in Settings / AI Guide. If a feature says it needs a key, that's what it's asking for. Your key stays yours and powers all the AI in the app.",
    keywords: ["ai key", "api key", "connect key", "openai", "settings", "needs key"],
  },
  {
    id: "ai-scripts",
    category: "AI & Automation",
    question: "What are Scripts & Templates?",
    answer:
      "Scripts & Templates are reusable scripts for common conversations — sales calls, follow-ups, outreach — stored by category in a directory. You can save your own and generate new ones with AI, which asks you a few questions and drafts a script tailored to your situation. (This module is being rolled out.)",
    keywords: ["scripts", "templates", "script", "conversation", "directory", "generate script"],
  },
  {
    id: "ai-content",
    category: "AI & Automation",
    question: "How do Create Content and the Content Calendar work?",
    answer:
      "Create Content and the Content Calendar connect to PostStream to draft, schedule, and manage your social posts from inside LifeCharter. These two features are being connected to PostStream and will light up once that integration is finished.",
    keywords: ["content", "create content", "content calendar", "poststream", "social", "posts", "schedule"],
  },

  // ---- Integrations ----
  {
    id: "in-global-control",
    category: "Integrations",
    question: "What is the Global Control integration?",
    answer:
      "Global Control connects your contacts into LifeCharter so you can see and manage them alongside your daily work, and drive the follow-up engine from real relationships. You connect it with your Global Control API key in Settings.",
    keywords: ["global control", "contacts", "crm", "integration", "gc"],
  },
  {
    id: "in-poststream",
    category: "Integrations",
    question: "What is PostStream?",
    answer:
      "PostStream powers anything to do with creating and scheduling social posts — it's the engine behind Create Content and the Content Calendar. You connect it with your PostStream API key in Settings; the content features activate once the connection is complete.",
    keywords: ["poststream", "social", "scheduling", "posts", "content integration"],
  },

  // ---- Account & Settings ----
  {
    id: "as-settings",
    category: "Account & Settings",
    question: "What can I manage in Settings?",
    answer:
      "Settings is where you connect integrations (Global Control, PostStream, your AI key), configure your AI Guide, and manage your account and workspace. If a feature needs a key or a connection, Settings is where you add it.",
    keywords: ["settings", "account", "workspace", "manage", "configure", "integrations panel"],
  },
];

// Lightweight keyword-overlap retrieval: score each entry against the query and
// return the best matches. Good enough to ground the AI answer without a vector DB.
export function searchKb(query: string, limit = 5): KbEntry[] {
  const q = query.toLowerCase();
  const terms = q.split(/[^a-z0-9]+/).filter((t) => t.length > 2);
  const scored = KNOWLEDGE_BASE.map((e) => {
    let score = 0;
    const hay = `${e.question} ${e.answer} ${e.keywords.join(" ")} ${e.category}`.toLowerCase();
    for (const kw of e.keywords) {
      if (q.includes(kw)) score += 3;
    }
    for (const t of terms) {
      if (hay.includes(t)) score += 1;
      if (e.question.toLowerCase().includes(t)) score += 1;
    }
    return { e, score };
  });
  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.e);
}
