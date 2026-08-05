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
  "Forecasting",
  "Sales",
  "Finance",
  "Operations",
  "Content & Social",
  "Growth & Reviews",
  "AI & Automation",
  "Calendar & Connections",
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
      "The Business Plan is a guided, sectioned builder: Vision/Mission/Values, What You Offer, Target Market, Revenue Model, and 12-Month Goals form the foundational baseline, plus optional depth (positioning, operations, team, risks). AI drafts each section from your assessments and your answers. It's the strategic anchor the rest of the app references, and it feeds your business-health score.",
    keywords: ["business plan", "vision", "goals", "strategy", "priorities", "sections", "baseline"],
  },
  {
    id: "pl-marketing-plan",
    category: "Planning",
    question: "What is the Marketing Plan for?",
    answer:
      "The Marketing Plan is a guided builder covering your ideal client, positioning and core message, core offer/promise, and channels (baseline), plus content strategy, brand voice, and metrics. AI drafts each section from your assessments so your content, sales, and outreach all point the same direction.",
    keywords: ["marketing plan", "positioning", "ideal client", "messaging", "brand", "channels"],
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
      "Scripts & Templates is a live directory of reusable scripts for common conversations — sales calls, follow-ups, outreach, objections — stored by category. You get starter scripts to begin with, can search/favorite/copy/edit them, and create new ones two ways: write it yourself, or 'AI (guided)' which asks a few questions (purpose, audience, channel, tone, key points) and drafts a script you can edit before saving.",
    keywords: ["scripts", "templates", "script", "conversation", "directory", "generate script", "objections"],
  },
  {
    id: "ai-content",
    category: "AI & Automation",
    question: "How do Create Content and the Content Calendar work?",
    answer:
      "Both are live through PostStream. Create Content lets you compose a post, pick platforms from your connected accounts, draft the caption + hashtags with AI, add media, and save as draft / schedule / publish now. The Content Calendar shows every post on its date, color-coded by status (draft, scheduled, published), where you can publish or delete.",
    keywords: ["content", "create content", "content calendar", "poststream", "social", "posts", "schedule", "publish"],
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
      "PostStream (Post Bridge) powers creating and scheduling social posts across Instagram, YouTube, TikTok, X, Bluesky, LinkedIn, Facebook, Threads, Reddit, and Pinterest — it's the engine behind Create Content and the Content Calendar. Connect it with your PostStream API key in Settings → Integrations; saving validates the key live, and your connected channels then populate the platform picker.",
    keywords: ["poststream", "post bridge", "social", "scheduling", "posts", "content integration", "channels"],
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

  // ---- Planning (Hub + plan builders + reviews + proposals) ----
  {
    id: "pl-hub",
    category: "Planning",
    question: "What is the Planning Hub?",
    answer:
      "The Planning Hub is your strategic command surface. It rolls up live status for your Business Plan, Marketing Plan, Sales Plan, Financial Forecasting, and Finance — each card shows real metrics (goal completeness, pipeline value, MTD/YTD net) plus a status and last-updated. Below the cards it holds your Upcoming Reviews and Review History, and the actions New Planning Session, Export All Plans, and Create Proposal.",
    keywords: ["planning hub", "planning", "hub", "rollup", "strategic", "overview"],
  },
  {
    id: "pl-builder",
    category: "Planning",
    question: "How do I build a plan?",
    answer:
      "Open a plan (Business, Marketing, Sales, or Forecasting) and use the Build tab. Each plan is a set of sections; the foundational ones are marked 'Foundational,' the rest are optional depth. For any section you can answer a guiding question or two and click 'Draft with AI' — it writes that section from your Brain/Soul/Profit assessments, your answers, and your other sections. Edit freely; it autosaves. Two meters show your baseline and overall depth.",
    keywords: ["build plan", "plan builder", "sections", "draft with ai", "foundational", "baseline", "how to build"],
  },
  {
    id: "pl-baseline",
    category: "Planning",
    question: "What is the foundational baseline and is it required?",
    answer:
      "The baseline is the practical minimum that makes a plan meaningful — the sections marked 'Foundational.' It's strongly guided but never blocks you: the app nudges you to complete it and shows a baseline meter, but you can go as deep or as light as you want. Completing your Business Plan's baseline also lifts your business-health score.",
    keywords: ["baseline", "foundational", "required", "minimum", "meaningful plan"],
  },
  {
    id: "pl-reviews",
    category: "Planning",
    question: "How do plan reviews work?",
    answer:
      "On any plan's Reviews tab, pick a cadence — monthly, quarterly, semi-annual, or annual — and generate an AI review. It reads your plan against your real numbers and goals, then celebrates specific strengths, flags areas needing attention each with a concrete fix, and names the single highest-leverage next move. Every review is saved to history.",
    keywords: ["plan review", "review", "monthly", "quarterly", "annual", "cadence", "strengths", "attention"],
  },
  {
    id: "pl-proposal",
    category: "Planning",
    question: "How do I create a grant or proposal?",
    answer:
      "On the Planning Hub, click Create Proposal. Pick a type (grant application, investor request, partnership, loan narrative, or sponsorship), optionally name the funder, and generate — the AI assembles a full draft from your completed plans and your numbers. You can download it as Markdown and edit. The more of your plans you've written, the richer the proposal.",
    keywords: ["proposal", "grant", "grant application", "investor", "loan", "sponsorship", "funding", "create proposal"],
  },
  {
    id: "pl-goals",
    category: "Planning",
    question: "What's the difference between plan sections and goals?",
    answer:
      "Sections (the Build tab) are the written substance of your plan — vision, market, revenue model, and so on. Goals (the Goals tab) are the concrete outcomes you track, each with a status (not started, in progress, met, slipped). Goals can be AI-generated from your assessments and feed your progress and business health.",
    keywords: ["goals", "sections", "difference", "goal status", "progress"],
  },
  {
    id: "pl-export",
    category: "Planning",
    question: "Can I export all my plans at once?",
    answer:
      "Yes. On the Planning Hub, Export All Plans downloads one combined Markdown document with every plan and its goals, your finance snapshot, the forecast scenarios, and your review schedule — a single portable strategic document.",
    keywords: ["export", "export plans", "download", "markdown", "combined"],
  },

  // ---- Forecasting ----
  {
    id: "fc-what",
    category: "Forecasting",
    question: "How does Financial Forecasting work?",
    answer:
      "Forecasting projects your revenue, expenses, and net forward from your trailing ledger run-rate plus your open sales pipeline. It shows three scenarios — conservative, expected, and optimistic — with a month-by-month breakdown and cumulative totals. It lives under the Planning Hub and also has its own sidebar link.",
    keywords: ["forecasting", "forecast", "projections", "revenue projection", "scenarios"],
  },
  {
    id: "fc-assumptions",
    category: "Forecasting",
    question: "What assumptions can I change in the forecast?",
    answer:
      "Four: the horizon (how many months to project), expected monthly growth %, what share of your open pipeline closes over the horizon, and an expense ratio (leave it at 0 to derive it automatically from your actuals). Change them and hit Recalculate — the three scenarios update, with conservative and optimistic set a step below and above your expected case.",
    keywords: ["forecast assumptions", "growth", "pipeline close", "expense ratio", "horizon", "recalculate"],
  },
  {
    id: "fc-plan",
    category: "Forecasting",
    question: "What is the Forecast Plan on the forecasting page?",
    answer:
      "Below the calculator, the Forecast Plan is the narrative behind your numbers — revenue streams and drivers, your key growth assumptions and why they're realistic, your financial targets, and the risks and levers. Like the other plans, AI can draft each section, and you can run cadence reviews on it.",
    keywords: ["forecast plan", "revenue streams", "assumptions rationale", "targets", "risks", "levers"],
  },

  // ---- Sales (activities) ----
  {
    id: "sa-activities",
    category: "Sales",
    question: "How do Sales Activities work?",
    answer:
      "Sales Activities logs every touch — calls, follow-ups, emails, DMs, meetings, demos, proposals — with a contact, priority, dollar value, date, and outcome. It aggregates them into tiles (total activities, open pipeline value, won value, conversion rate) and a this-week-vs-goals panel with editable weekly targets. You can also add one fast from the '+' quick-add menu.",
    keywords: ["sales activities", "log activity", "calls", "pipeline", "conversion", "aggregate", "touches"],
  },
  {
    id: "sa-report",
    category: "Sales",
    question: "Can I report on my sales activity?",
    answer:
      "Yes. In Sales Activities, the Report button lets you pick a date range (or leave it blank for all-time) and either generate an AI-written performance summary (what's working, where the gaps are, the highest-leverage next move) or download a CSV of every activity with totals.",
    keywords: ["sales report", "report", "csv", "ai summary", "performance", "date range"],
  },

  // ---- Content & Social ----
  {
    id: "cs-connect",
    category: "Content & Social",
    question: "How do I connect my social accounts?",
    answer:
      "Add your PostStream API key in Settings → Integrations. Saving validates it live; once connected, your linked channels (Instagram, LinkedIn, X, Facebook, and more) appear as options when you compose in Create Content.",
    keywords: ["connect social", "poststream key", "accounts", "channels", "integrations"],
  },
  {
    id: "cs-schedule",
    category: "Content & Social",
    question: "How do I schedule or publish a post?",
    answer:
      "In Create Content, write your post, pick platforms, add media if you like, then choose Save as draft, Schedule (with a date and time), or Publish now. Scheduled and published posts appear on the Content Calendar on their day, where you can also publish or delete.",
    keywords: ["schedule post", "publish", "draft", "content calendar", "post"],
  },
  {
    id: "cs-caption",
    category: "Content & Social",
    question: "Can AI write my captions?",
    answer:
      "Yes. In Create Content, type a short idea and click Draft — your AI guide writes a platform-native caption plus hashtags, tuned to the platforms you selected. Edit it before scheduling or publishing.",
    keywords: ["caption", "ai caption", "hashtags", "draft caption", "write post"],
  },

  // ---- Calendar & Connections ----
  {
    id: "cal-connect",
    category: "Calendar & Connections",
    question: "How do I connect my calendar and email?",
    answer:
      "In Settings → Integrations, the Calendar & Email card at the top lets you connect Google Workspace or Microsoft 365 with real sign-in. Each shows a clear Connected / Not connected status. This powers reading your inbox and calendar, and lets the app add events for you.",
    keywords: ["connect calendar", "google", "microsoft", "email", "outlook", "calendar email"],
  },
  {
    id: "cal-write",
    category: "Calendar & Connections",
    question: "Why does it say my Google calendar is read-only?",
    answer:
      "Your original Google connection granted read-only calendar access, so the app can show your events but not add them. To let it write events, click Reconnect on the Google Workspace card in Settings → Integrations and approve the calendar permission. Once done, the card shows 'Calendar write enabled ✓.' Microsoft has write access by default.",
    keywords: ["read-only", "calendar write", "reconnect google", "add events", "permission", "scope"],
  },
  {
    id: "cal-planning",
    category: "Calendar & Connections",
    question: "Does scheduling a planning session add it to my calendar?",
    answer:
      "Yes — when you schedule a planning session with a date (and time) on the Planning Hub, it creates a real event on your connected calendar that day, and the session shows an 'On calendar' badge. If Google is still read-only, it schedules in the hub and prompts you to reconnect for calendar access.",
    keywords: ["planning session calendar", "add to calendar", "event", "on calendar", "schedule session"],
  },

  // ---- Getting Started (navigation) ----
  {
    id: "gs-quick-add",
    category: "Getting Started",
    question: "What does the + button in the top bar do?",
    answer:
      "The '+' is a quick-add menu. It opens a short list to instantly create a new task (a small form right there), log a sale, create content, or schedule a planning session — each takes you straight to the right place with the form ready. The bell next to it is your notifications, and the '?' opens Help & Q&A.",
    keywords: ["plus button", "quick add", "top bar", "new task", "shortcut", "navigation"],
  },

  // ---- Business Alignment (scoring + plans) ----
  {
    id: "ba-plan-health",
    category: "Business Alignment",
    question: "How do my plans affect my business health score?",
    answer:
      "Your Business Plan is a source in the scoring engine: as you fill its foundational sections, its completeness feeds your business-health score (it stays neutral until you start, so a blank plan never penalizes you). Combined with your 12-dimension assessments, operational pillars, and pulse check-ins, this makes your health reflect both where you are and how solid your plan foundation is.",
    keywords: ["business health", "score", "plan completeness", "scoring", "health score", "dimensions"],
  },
  {
    id: "ba-assessments-detail",
    category: "Business Alignment",
    question: "What do the Brain, Soul, and Profit assessments each cover?",
    answer:
      "Brain maps your business systems — marketing, sales, operations, finance, team, and more — in your own words. Soul captures your identity, values, calling, and story. Profit scores your 12 business dimensions. Together they seed your scores and give the AI the context it uses to draft your plans, reviews, and proposals in your real voice and situation.",
    keywords: ["brain", "soul", "profit", "assessment", "what covers", "identity", "systems"],
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
