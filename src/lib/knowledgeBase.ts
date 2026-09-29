// LifeCharter knowledge base — the comprehensive Q&A behind the Help page and
// the Travel Partner "Ask" widget. This is the single source of truth for how
// every feature works. Update it whenever a feature ships or changes (last full
// refresh: Sept 2026). As new features ship, add their Q&A here (and clients can
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
      "The Daily Compass is your daily execution hub. It shows AI insights from your business bot grounded in your 12 dimensions and 8 operational pillars, your priority tasks, your Quick Wins (fully editable and AI-assisted), and today's activity, with Scripts & Templates, the Content Calendar and Sales Activities a click away. It's where you turn strategy into action each day.",
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
      "The bell in the top navigation is a live feed of things that need your attention: expenses that still need categorizing, operational pillars you've flagged as needing attention, tasks that are overdue, follow-ups that are ready, and deadline reminders — a timed task shows up as 'Due in 20 min' (or 'Starts in 20 min') once it's inside your reminder window. The bell refreshes every minute. Click any notification to jump to the relevant page, mark items read, dismiss them, or mark all read. You can also get deadline reminders by email — choose how far ahead and turn email on or off in Settings → Profile → Task reminders.",
    keywords: ["notifications", "bell", "alerts", "unread", "top nav", "reminder", "reminders", "due soon"],
  },
  {
    id: "dr-tasks",
    category: "Daily Rhythm",
    question: "How do tasks work?",
    answer:
      "Tasks flow through statuses: backlog, today, in progress, waiting, and done. You can add them manually (from the dashboard, the Tasks page, or the + quick-add button), and many parts of the app create them for you — Quick Wins, the follow-up engine, and the tax module. A task can carry a due date and an optional time of day, and can be tagged to any of your 12 business dimensions. Your tasks are private to your own account. For things that repeat, use Recurring tasks in the Priority Tasks card on the dashboard.",
    keywords: ["tasks", "todo", "task list", "due", "status", "priority tasks", "private"],
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
      "The follow-up engine keeps relationships warm. Contacts and tasks can carry a follow-up schedule; when a follow-up comes due, it surfaces in your notifications and Daily Compass so you reach out at the right moment. It works hand-in-hand with your Contacts (Daily Operations → Contacts).",
    keywords: ["follow up", "follow-up", "followup", "engine", "reach out", "contacts", "cadence"],
  },
  {
    id: "sa-contacts-crm",
    category: "Sales",
    question: "What are Contacts, Forms and Broadcasts?",
    answer:
      "Contacts (Daily Operations → Contacts) is your own CRM: everyone who fills in one of your forms, books a call or is added by hand, with tags and a timeline of every touch. Forms gives you a hosted sign-up link (or a plain HTML form for your website) that saves people as contacts, tags them and can start a sequence. Broadcasts sends a one-time email to everyone with a tag. Only your account sees your contacts.",
    keywords: ["contacts", "crm", "forms", "broadcast", "newsletter", "tags", "leads", "sign up form"],
  },
  {
    id: "sa-contact-emails",
    category: "Sales",
    question: "Why can I see my emails with a contact on their record?",
    answer:
      "Open a contact in Contacts and the Emails section lists every email with them, newest first: mail you've sent and received in your connected Gmail or Microsoft 365 (including Sent), plus the sequence and broadcast emails the Suite sent them. It checks your mailboxes each time you open someone, or click Refresh emails; click an email to read it in full. Only the account owner sees emails from their own mailboxes. Team members see just the Suite's emails. To start, connect a mailbox in Settings → Integrations.",
    keywords: ["contact emails", "email history", "gmail", "outlook", "microsoft 365", "sent mail", "contact record", "inbox"],
  },
  {
    id: "sa-contacts-import",
    category: "Sales",
    question: "How do I import or export my contacts?",
    answer:
      "Open Contacts and click Import contacts. Export your list from Gmail/Google Contacts, Outlook, iPhone/iCloud, Excel or your old CRM (GoHighLevel, Mailchimp, Kajabi and others) as a CSV or vCard (.vcf) file and drop it in, or paste cells from a spreadsheet. Check how each column is matched, look over the preview, and confirm these people have agreed to hear from you; up to 5,000 contacts per import. Everyone gets an \"imported\" tag, people already in your contacts are merged (never duplicated), unsubscribes stay in place, and importing never emails anyone or starts a sequence. Export contacts downloads your whole list as a CSV.",
    keywords: ["import", "export", "upload", "csv", "vcard", "vcf", "spreadsheet", "gmail", "outlook", "iphone", "mailchimp", "gohighlevel", "move contacts", "contacts"],
  },
  {
    id: "sa-sequences",
    category: "Sales",
    question: "How do Sequences work, and why won't my emails send yet?",
    answer:
      "A sequence is a timed email series: day 0 goes right away, then each email on its day at the hour you pick, in each person's own time zone. People join by hand, from a form or from a booking calendar, and anyone who unsubscribes is never emailed again. Emails go out from your own domain, so first open Contacts → Email sending, add a domain like mail.yourbusiness.com, add the DNS records it shows at your domain provider, click Check verification, and fill in your mailing address (the law requires it on marketing emails). Until then, sequences and broadcasts can't be turned on.",
    keywords: ["sequences", "email series", "drip", "nurture", "sending domain", "dns", "verify", "email sending", "mailing address"],
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
      "The Financial Pulse has two faces. On your dashboard it's a card you can switch between Week, Month and Year: it shows your income so far, how that compares with the previous week/month/year, the percentage of your income goal reached, and bars for the period (days, weeks or months). The Finance Center's Financial Pulse page goes deeper: income, expenses and net for week-to-date, month-to-date and year-to-date, your budget status, and an AI-graded health score. Both pull live from your Finance Center ledger, and the periods follow your time zone.",
    keywords: ["financial pulse", "pulse", "cash flow", "dashboard", "mtd", "ytd", "health", "week", "month", "year", "goal"],
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
    id: "segments-autotag",
    category: "AI & Automation",
    question: "How do I tie my existing income, tasks and goals to a business segment?",
    answer:
      "On Business Segments, once you have a segment, a panel shows how many items aren't tied to one yet. Choose Suggest tags and your assistant reads your income and expenses (repeats are grouped), tasks, plan goals and sales activity, and proposes a segment for each from the wording and what it knows about how your business is organized. You review every suggestion — untick or change any, leave general overhead untagged — then apply. Nothing changes until you confirm, and existing tags are never overwritten. Tagged activity is what lets each segment's score show where work is needed and where it's progressing.",
    keywords: ["segment", "tag", "untagged", "auto tag", "assistant", "income", "tasks", "goals", "sales", "offering"],
  },
  {
    id: "alignment-ai",
    category: "AI & Automation",
    question: "How does my assistant work in the Alignment section?",
    answer:
      "Each Alignment page has a read written by your own assistant, saved to your account: Business Alignment gives a briefing on what your score and phase mean and three moves you can add to your tasks with one click; Progress reads what has moved since your baseline and why; the Alignment Profile is a written portrait of you and your business from your Brain, Soul and Profit answers (private answers are never included); Business Segments compares your businesses and segments using the income you tag to each; Reviews reads what your clients say and finds lines worth using in your marketing. All of it feeds back into your assistant, so Daily Compass insights, Quick Wins and Scripts know it too.",
    keywords: ["alignment", "progress", "segments", "profile", "reviews", "testimonials", "briefing", "assistant", "baseline"],
  },
  {
    id: "reviews-collect",
    category: "Content & Social",
    question: "How do I collect client reviews and testimonials?",
    answer:
      "Open Reviews and choose Request a review. Enter the client's name (and email if you want a one-click email), and your assistant can draft the note. You get a personal link to send yourself — nothing is emailed for you. When they open it they see a simple form for a rating, a few words, and permission to share; their review lands in your list as Pending for you to Approve, Feature or Hide. Approved reviews can become a post in your Content Calendar with one click, and your assistant reads them to find your strongest proof. Each link takes exactly one review.",
    keywords: ["reviews", "testimonials", "collect", "request a review", "client feedback", "social proof"],
  },
  {
    id: "planning-ai",
    category: "AI & Automation",
    question: "How does my AI assistant help with Strategic Planning?",
    answer:
      "Every planning area runs on your own assistant, using your own AI key and following your standing instructions. It reads everything it knows about you — assessments, your Business, Marketing, Sales and Forecasting plans, goals, budgets, forecast, pipeline and tasks — so what it drafts stays consistent across them. Planning Hub: a briefing on where your plans stand and your next three moves. Plans: draft each section, review on a schedule, generate goals, and build proposals. Sales Plan: suggests weekly activity targets that become your goals in Sales Activities and the Weekly View. Forecasting: reads the forecast and suggests income goals that feed the Financial Pulse. Finance: assesses your financial health and suggests a budget from what you actually spend. Everything it writes is saved to your account under your assistant's name, and every other part of the Suite — Daily Compass insights, Quick Wins, Scripts — draws on the same plans.",
    keywords: ["planning", "assistant", "business plan", "marketing plan", "sales plan", "forecast", "finance", "budget", "briefing", "goals", "strategic"],
  },
  {
    id: "scripts-templates",
    category: "AI & Automation",
    question: "What are Scripts & Templates, and can I make my own?",
    keywords: ["scripts", "templates", "library", "starter library", "my library", "fill in", "personalize", "sales script", "email template", "save"],
    answer:
      "Scripts & Templates (Daily Compass) has a Starter Library of 56 ready-to-use scripts and emails across Sales, Prospecting, Objections, Onboarding, Follow-up, Content, Nurture and Closing. Open one and use Fill in & personalize to type in the blanks, or ask your AI assistant to rewrite it in your voice using what you've told it about your business (shorter, warmer, more direct, or your own instruction). Save any of them to My Library to keep your own copy, or write or generate new ones. What you save in My Library is private to your account — no other client can see it.",
  },
  {
    id: "ai-bot",
    category: "AI & Automation",
    question: "How does the AI in LifeCharter work?",
    answer:
      "Your AI assistant (called Sidekick until you name it yourself in Settings → AI Assistant) is woven throughout the app: it grades your financial health, suggests Quick Wins tailored to your weakest areas, generates Daily Compass insights grounded in your 12 dimensions and 8 pillars, optimizes your tech stack, and answers your questions in the Travel Partner widget. It uses your own connected AI key.",
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
      "They're one place now: the Content Calendar. Use Create content to write a post, pick platforms from your connected accounts, draft the caption + hashtags with AI, add media, and save as draft, schedule, or publish now through PostStream. Every post shows on its day, color-coded by status. Open any planned post and choose Schedule or publish to send it through PostStream from the calendar — the two stay linked, so a post that goes out (or one you make directly in PostStream) shows up as posted on the calendar and counts once.",
    keywords: ["content", "create content", "content calendar", "poststream", "social", "posts", "schedule", "publish"],
  },

  // ---- Integrations ----
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
      "Settings is where you connect integrations (PostStream, your AI key), connect your Google and Microsoft email and calendar accounts, configure your AI Guide, choose your time zone and task-reminder preferences (Profile), and manage your account, team and workspace. If a feature needs a key or a connection, Settings is where you add it.",
    keywords: ["settings", "account", "workspace", "manage", "configure", "integrations panel", "profile", "time zone", "reminders"],
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
      "Open a plan (Business, Marketing, Sales, or Forecasting) and use the Build tab. Each plan is a set of sections; the foundational ones are marked 'Foundational,' the rest are optional depth. For any section you can answer its questions (they save on their own) and click 'Draft with AI' — it writes that section from your Brain/Soul/Profit assessments, your answers, and your other sections. Edit freely; it autosaves. Two meters show your baseline and overall depth.",
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
      "On the Content Calendar, click Create content (or open a planned post and choose Schedule or publish). Pick platforms, add media if you like, then choose Save as draft, Schedule (with a date and time), or Publish now. Scheduled and published posts stay on the calendar on their day; deleting a scheduled post there also cancels it in PostStream.",
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
      "In Settings → Integrations, the Calendar & Email card lists every email account you've connected and how many your plan allows (for example '1 of 3 used'). Use 'Add Google account' or 'Add Microsoft 365 account' to sign in with real Google or Microsoft credentials, and Disconnect to remove one. Connected accounts power your dashboard inbox and Today's Schedule, and let the app add events for you. Your connections are private to your account.",
    keywords: ["connect calendar", "google", "microsoft", "email", "outlook", "calendar email", "add account", "disconnect", "gmail"],
  },
  {
    id: "cal-write",
    category: "Calendar & Connections",
    question: "Why does it say my Google calendar is read-only?",
    answer:
      "Your original Google connection granted read-only calendar access, so the app can show your events but not add them. To let it write events, go to Settings → Integrations, and use 'Add Google account' to sign in with that same Google account again, approving the calendar permission. The read-only note under the account disappears once it's done. Microsoft has write access by default.",
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
  {
    id: "cal-booking-links",
    category: "Calendar & Connections",
    question: "How do booking links (Calendars) work?",
    answer:
      "Daily Operations → Calendars gives you booking pages like Calendly. Add hosts, send each host their private connect link so their Google or Microsoft calendar is checked for busy times, then create a calendar with its length, buffers, questions and where you'll meet. Every booking lands in Contacts and can start a sequence or open a Pipeline deal. Confirmation and reminder emails go out from your own verified domain (Contacts → Email sending); until then, bookings still work and the host's calendar invite still goes out.",
    keywords: ["booking link", "calendly", "calendars", "book a call", "appointments", "hosts", "reminders", "scheduling page"],
  },

  // ---- Getting Started (navigation) ----
  {
    id: "gs-quick-add",
    category: "Getting Started",
    question: "What does the + button in the top bar do?",
    answer:
      "The '+' is a quick-add menu. It opens a short list to instantly create a new task (a small form right there, with an optional due date, time and 'due by' or 'do it at' choice), log a sale, create content, or schedule a planning session. The bell next to it is your notifications, and the '?' opens Help & Q&A.",
    keywords: ["plus button", "quick add", "top bar", "new task", "shortcut", "navigation", "due date", "time"],
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

  // ---- Tasks, time zone, reminders, plans (added Sept 2026) ----
  {
    id: "dr-task-time",
    category: "Daily Rhythm",
    question: "Can I give a task a due date and a time?",
    answer:
      "Yes. When you add a task (dashboard Add Task, the Tasks page, or the + quick-add), set an optional date and time of day. Choose 'Due by this time' for a deadline, or 'Do it at this time' to set it aside on your schedule. A date with no time means due by the end of that day. The task card shows a label like 'Due by 3:00 PM', 'At 11:00 AM', 'Due today' or 'Overdue', tasks with times sort soonest first, and timed tasks due today also appear in Today's Schedule next to your calendar events. On the Tasks page you can change or remove a task's date and time later.",
    keywords: ["due date", "time", "deadline", "due by", "schedule a task", "set time", "task time", "overdue", "at this time"],
  },
  {
    id: "dr-recurring",
    category: "Daily Rhythm",
    question: "How do recurring tasks work?",
    answer:
      "Recurring tasks live in the fourth column of the Priority Tasks card on the dashboard. Click the + next to RECURRING to add one: give it a title, choose how often it repeats (every day, certain days of the week — with a 'Weekdays only' shortcut — or once a month on a day you pick; a task set for the 31st lands on the last day of shorter months), and optionally a time of day ('due by' or 'do it at'). The column shows only what's due today; check a task off and it stays ticked for the day, then resets on its next day. Timed recurring tasks also appear in Today's Schedule and trigger reminders. Use the same + box to see or delete your recurring tasks.",
    keywords: ["recurring", "repeat", "repeating", "daily task", "weekly task", "monthly task", "habit", "check off", "cadence", "routine"],
  },
  {
    id: "dr-task-reminders",
    category: "Daily Rhythm",
    question: "How do deadline reminders work?",
    answer:
      "Any task or recurring task with a time of day gets a reminder before it's due. In the app, the bell shows 'Due in 20 min' (or 'Starts in 20 min') once it's inside your reminder window. If email reminders are on, you also get one email — once per task — at that point. Change how far ahead (10 minutes to 2 hours) or turn the email off in Settings → Profile → Task reminders. Tasks with only a date (no time) don't send reminders; the bell flags them once they're overdue.",
    keywords: ["reminder", "reminders", "remind me", "notify", "email reminder", "deadline", "due soon", "lead time", "alert"],
  },
  {
    id: "fi-goals",
    category: "Finance",
    question: "How do I set an income goal and see my progress?",
    answer:
      "Your monthly income goal is the income target in Finance → Budget (you can also set it right on the dashboard's Financial Pulse card). Switch the card to Month to see the percentage of it reached. Yearly defaults to 12 times your monthly goal and weekly to the yearly goal divided by 52 — or click 'Edit goal' on the Week or Year view to set your own number for that period. The percentage is your income so far in that period divided by its goal. Goals are private to your account.",
    keywords: ["goal", "income goal", "revenue goal", "target", "percent", "progress", "financial pulse", "weekly goal", "yearly goal", "monthly goal"],
  },
  {
    id: "as-timezone",
    category: "Account & Settings",
    question: "How do I set my time zone?",
    answer:
      "Use the small time zone menu next to the date at the top of your dashboard, or Settings → Profile → Timezone. Your choice is saved to your account and sets your greeting (morning, afternoon, evening), the clock, Today's Schedule, when tasks are due, and where 'this week/month/year' start in the Financial Pulse. Until you choose one, the app uses your browser's time zone.",
    keywords: ["time zone", "timezone", "clock", "greeting", "wrong time", "morning", "evening", "local time"],
  },
  {
    id: "cal-limit",
    category: "Calendar & Connections",
    question: "How many email accounts can I connect?",
    answer:
      "It depends on your plan: Starter includes 1 connected email account, Growth includes 3, and VIP is unlimited. Each Google or Microsoft 365 account you connect counts as one. Settings → Integrations → Calendar & Email shows how many you've used, lets you disconnect one to free a spot, and hides the Add buttons once you're at your limit. Your dashboard inbox and calendar combine every account you've connected.",
    keywords: ["how many", "email accounts", "limit", "multiple accounts", "second email", "add another", "plan limit", "mailboxes", "connect more"],
  },
  {
    id: "as-plans",
    category: "Account & Settings",
    question: "What's the difference between Starter, Growth and VIP?",
    answer:
      "Starter is built for one business running lean (1 business workspace, 1 seat, 1 connected email account, up to 5 integrations). Growth gives you room to grow — up to 3 business workspaces, 2 seats, 3 connected email accounts, up to 10 integrations, monthly 1:1 coaching, and expanded AI limits. VIP removes the limits — unlimited workspaces, seats, email accounts and integrations, customized to you, priority AI, and white-glove support. Everything in the Command Suite is included in every plan; the plans differ in capacity and hands-on help. Your current plan and billing are under Settings, where 'Manage billing' opens your billing portal.",
    keywords: ["plans", "tiers", "starter", "growth", "vip", "difference", "upgrade", "limits", "pricing", "billing", "what's included"],
  },
  {
    id: "as-collective",
    category: "Account & Settings",
    question: "What is The Collective and how do I get to it?",
    answer:
      "The LifeCharter Collective is LifeCharter's community — channels and conversations, events, direct messages, an Alignment Journal, and resources. Open it from 'The Collective' in the left navigation. It has its own look and menu, and a 'Command Suite' button takes you back to the dashboard. It's a separate space from your business data — nothing from your Command Suite is shared with the community.",
    keywords: ["collective", "community", "lifecharter collective", "channels", "events", "journal", "members", "switch"],
  },
  {
    id: "ai-assistant-learns",
    category: "AI & Automation",
    question: "Does my AI assistant learn from my assessments?",
    answer:
      "Yes. Your assistant reads your own Brain, Soul and Profit assessment answers — each one counts as soon as you give it (the Brain and Soul assessments save as you go; you don't have to finish) — along with your live dimension scores, your open and recurring tasks for today, your income against your goals, today's events from the calendars you've connected, and your recent conversation with it, so its advice is about your business rather than generic. Anything you mark sensitive in the Soul assessment is never shown to it. Your data is only ever used for your own account. You can wipe its memory of your conversations any time with 'Clear memory' on the dashboard's AI Assistant card; that doesn't touch your assessments.",
    keywords: ["assistant", "ai", "learn", "learns", "assessments", "memory", "remember", "personalized", "sensitive", "private", "clear memory", "brain", "soul", "profit"],
  },
  {
    id: "ai-assistant-instructions",
    category: "AI & Automation",
    question: "Can I tell my AI assistant how to reply?",
    answer:
      "Yes. In Settings → AI Assistant, the 'How should your assistant reply?' box holds standing instructions it follows every time — for example 'be direct and skip the pep talk', 'keep answers under 80 words', 'use short bullet points', or 'always end with one next step'. Tap the suggestions to add them, edit freely (up to 1,500 characters), and click Save. Instructions shape tone, length, format and focus; your assistant still only uses your own information and never invents facts. You can rename it in the same place, and clear its memory of past conversations with 'Clear memory' on the dashboard's AI Assistant card.",
    keywords: ["instructions", "how to reply", "tone", "style", "shorter", "bullet", "customize", "assistant", "name", "rename", "personality", "format"],
  },

  // ---- Added Sept 28 2026: pages and changes not covered above ----
  {
    id: "gs-sidebar",
    category: "Getting Started",
    question: "How is the menu on the left organized?",
    answer:
      "The left menu follows how you run the business. Daily Operations is today's work: Executive Home, Daily Compass, Tasks, Contacts, Calendars, Sequences, Pipeline, Quick Capture and The Collective. Planning & Numbers is your weekly and monthly rhythm: Weekly Review, Finance, Forecasting, Goal Ladder and the Planning Hub. Growth is getting and keeping clients: Offers & Packages, Sales Plan, Marketing Plan, Testimonials and Website Review. Alignment is the big picture: Business Alignment, Alignment Profile, Progress, Business Segments and your Business Plan. Systems is how the business runs: Operations, Playbook & SOPs, Legal & Compliance, AI Assistant and Settings. Getting Started, at the bottom, holds Set up Suite and First 30 Days. Click any section heading to fold it away; the page you're on always stays visible. Your photo and name at the bottom open Light/Dark mode, Sign out and your workspace.",
    keywords: ["menu", "sidebar", "navigation", "left menu", "sections", "where is", "find", "sign out", "log out", "dark mode", "light mode"],
  },
  {
    id: "gs-setup-suite",
    category: "Getting Started",
    question: "What is Set up Suite?",
    answer:
      "Set up Suite (Getting Started → Set up Suite) is the short setup that makes everything else work: connect your AI, then take the Brain, Soul and Profit assessments that give your assistant its context and set your business-health baseline, and add your website address for your Website Alignment Review. Each step shows whether it's done.",
    keywords: ["set up", "setup", "set up suite", "onboarding", "first steps", "assessments", "connect ai", "website address"],
  },
  {
    id: "gs-first-30",
    category: "Getting Started",
    question: "What is First 30 Days?",
    answer:
      "First 30 Days (Getting Started → First 30 Days) is twelve small steps that turn the Suite into how you run your business: write your vision, add your offers and prices, put open opportunities in the Pipeline, set your monthly income goal, record this month's income and expenses, add your regular bills, do your first weekly review, write your first SOP, rate your 8 operational pillars, work through the Legal & Compliance checklist, break a yearly goal into this quarter, and take your first monthly Quick Pulse. Each step ticks itself off when it's done, and the ones that strengthen your lowest scores are marked for you.",
    keywords: ["first 30 days", "30 days", "checklist", "getting started", "steps", "onboarding", "new client"],
  },
  {
    id: "dr-quick-capture",
    category: "Daily Rhythm",
    question: "What is Quick Capture?",
    answer:
      "Quick Capture (Daily Operations → Quick Capture) is a phone-friendly page for the two things you jot down on the move: a task, or money in or out. On your phone, press and hold the Command Suite app icon for shortcuts to Quick Capture, the Daily Compass and your tasks.",
    keywords: ["quick capture", "capture", "phone", "mobile", "on the go", "jot", "expense", "income", "shortcut"],
  },
  {
    id: "pl-weekly-review",
    category: "Planning",
    question: "How does the Weekly Review work?",
    answer:
      "Weekly Review (Planning & Numbers → Weekly Review) is a short weekly sit-down with your real numbers: what came in and went out, your tasks and goals, and your assistant's read on what they mean. It suggests next steps with due dates; edit them, untick any you don't want, and they go straight onto your task list. Finishing it marks that week's planning session complete, with the review saved as its notes.",
    keywords: ["weekly review", "review", "weekly", "planning session", "rhythm", "check in", "next steps"],
  },
  {
    id: "pl-goal-ladder",
    category: "Planning",
    question: "What is the Goal Ladder?",
    answer:
      "The Goal Ladder (Planning & Numbers → Goal Ladder) breaks your year's goals into this quarter, this month and this week, so a big goal always has a next step. Choose an area, answer four short questions, and your assistant proposes this quarter's milestones for it; edit them before you save.",
    keywords: ["goal ladder", "goals", "quarter", "quarterly", "milestones", "yearly goal", "break down"],
  },
  {
    id: "sa-offers",
    category: "Sales",
    question: "What goes in Offers & Packages?",
    answer:
      "Offers & Packages (Growth → Offers & Packages) lists everything you sell: your signature program, packages, retainers and products, each with its price, what's included and who it's for. Deals in your Pipeline point to these offers, and Executive Home shows which offer is bringing in the most. To stop selling an offer but keep its history, set it to Retired instead of deleting it.",
    keywords: ["offers", "packages", "pricing", "products", "services", "what I sell", "retired"],
  },
  {
    id: "op-sops",
    category: "Operations",
    question: "How do Playbook & SOPs work?",
    answer:
      "Playbook & SOPs (Systems → Playbook & SOPs) is how your business runs, written down once. Name a process, jot how you do it today in your own words, and your assistant drafts clean, numbered steps you can edit. Your SOPs make it easier to hand work to a team member and keep things consistent.",
    keywords: ["sop", "sops", "playbook", "process", "procedures", "standard operating procedure", "document", "delegate"],
  },
  {
    id: "op-compliance",
    category: "Operations",
    question: "What is Legal & Compliance?",
    answer:
      "Legal & Compliance (Systems → Legal & Compliance) is one checklist for contracts, insurance, licenses and filings. Use 'What applies to my business?' and your assistant suggests which items matter for you. Ticking items off feeds your Legal score in your business health. It's a checklist to keep you organized, not legal advice; check anything important with a qualified professional.",
    keywords: ["legal", "compliance", "contracts", "insurance", "licenses", "filings", "checklist", "legal score"],
  },
  {
    id: "gr-website-review",
    category: "Growth & Reviews",
    question: "What is the Website Alignment Review?",
    answer:
      "Every Command Suite client gets a Website Alignment Review, included. Add your website address in Set up Suite or on the Website Review page (Growth → Website Review), and within 14 days of joining we read your site against the positioning, voice and offer you build in the Suite and give you the five changes that matter most. You'll get an email when it's ready, and it stays on your Website Review page. If your site needs rebuilding, ask about the Website Build.",
    keywords: ["website review", "website alignment", "website", "site", "review", "five changes", "website build"],
  },
  {
    id: "as-team-access",
    category: "Account & Settings",
    question: "How do I give a team member access, and control what they see?",
    answer:
      "In Settings → Team, invite someone by email and choose a role: Admin (runs the account day to day and manages the team; no billing, connected accounts or account deletion), Editor (works on the business: tasks, plans, content, finance and sales activity), Viewer (sees what an Editor sees but changes nothing), or Sales (the sales page only). Then use 'Choose which features they can reach' to turn each area on, view-only or off, or start from a preset such as Virtual assistant, Bookkeeper, Sales, Content or Viewer. 'Contacts, calendars & sequences' is its own area. Team members never see your connected inbox, and only the account owner can export contacts or set up your sending domain. Changes apply the next time they open a page.",
    keywords: ["team", "team member", "invite", "roles", "permissions", "access", "admin", "editor", "viewer", "assistant", "va", "bookkeeper"],
  },
  {
    id: "as-activity-log",
    category: "Account & Settings",
    question: "Can I see what my team has done in the account?",
    answer:
      "Yes. The activity log in Settings → Team shows who did what across the account: what was added, changed or deleted, and by whom. Only you and your admins can see it. You can also set a monthly AI limit for each team member so their use of your AI stays within what you choose.",
    keywords: ["activity log", "audit", "history", "who changed", "team activity", "ai limit", "ai cap"],
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
