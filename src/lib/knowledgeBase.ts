// LifeCharter knowledge base — the comprehensive Q&A behind the Help page and
// the Travel Partner "Ask" widget. This is the single source of truth for how
// every feature works. Update it whenever a feature ships or changes (last full
// refresh: Oct 4 2026). As new features ship, add their Q&A here (and clients can
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
      "The bell in the top navigation is a live feed of things that need your attention: expenses that still need categorizing, operational pillars that score in the Survival phase, tasks that are overdue, follow-ups that are ready, and deadline reminders — a timed task shows up as 'Due in 20 min' (or 'Starts in 20 min') once it's inside your reminder window. The bell refreshes every minute. Click any notification to jump to the relevant page, mark items read, dismiss them, or mark all read. You can also get deadline reminders by email — choose how far ahead and turn email on or off in Settings → Profile → Task reminders.",
    keywords: ["notifications", "bell", "alerts", "unread", "top nav", "reminder", "reminders", "due soon"],
  },
  {
    id: "dr-projects",
    category: "Daily Rhythm",
    question: "What is the Projects page and how do I start a project?",
    answer:
      "Projects (Daily Operations → Projects) group your tasks into the things you are building: a launch, a challenge, a client, a program. A project's tasks are ordinary tasks, so they also appear on your Tasks board and nothing is entered twice. Press New project and start blank, or from a ready-made plan: MasterClass (promotion, registration, the event, the replay and follow-up) or the 21-Day Challenge, which is Command Shift (the build, the launch, the three weeks and the wrap-up with an offer). Pick the date to plan around (the MasterClass day, or Day 1 of the challenge) and every task is dated for you; change any date afterwards. You can also ask your AI assistant: 'set up a 21-Day Challenge starting January 11'. It shows you a preview first and you press Approve. To put your project cards in your own order, drag a card by the grip (the six dots at its bottom right), or press the up and down arrows beside it to move it one place at a time; the order is saved to your account.",
    keywords: ["projects", "project management", "new project", "reorder projects", "rearrange cards", "drag project", "template", "masterclass template", "21 day challenge", "command shift", "launch plan", "group tasks"],
  },
  {
    id: "dr-project-views",
    category: "Daily Rhythm",
    question: "How do the Board, List and Timeline views work in a project?",
    answer:
      "Open a project and choose a view. Board: your tasks as cards in columns (To do, Today, In progress, Waiting, Done), like a pipeline. Drag a card to another column, or up and down inside one; click a card to edit its name, notes, stage, priority, start and due dates and who it is assigned to. List: every task in one table, soonest first, with a stage menu in each row and a box to add tasks. Timeline: a Gantt chart with a bar for each task from its start to its due date, diamonds for milestones and a line for today; click a bar to edit the task. Details & sharing: the goal, status, dates, owner, notes, milestones and who the project is shared with. To change a milestone, open Details & sharing: click its name and type (it saves when you press Enter or click away), pick a new date in the date box beside it, tick the box when it is reached, or press the x to remove it. The progress bar at the top counts done tasks.",
    keywords: ["board", "gantt", "timeline", "list view", "drag and drop", "kanban", "cards", "milestones", "project progress"],
  },
  {
    id: "dr-project-share",
    category: "Daily Rhythm",
    question: "Can I share a project with a client or a contractor?",
    answer:
      "Yes. In a project, open Details & sharing, add their name, choose Client or Contractor and press Create link. Copy the link and send it yourself; nothing is emailed for you, and they need no account. A client sees the project, its progress, the milestones and only the tasks you mark 'Show this task to the clients and contractors' (open a card to tick it); they cannot change anything. A contractor sees the same and can also move the tasks assigned to them (assign a task to a contractor from the card). Remove the person any time and their link stops working. Your team members work inside the project as usual: assign them tasks from the card, and what they can open follows their role and feature access.",
    keywords: ["share project", "client link", "contractor", "guest", "invite", "private link", "team", "assign", "view only"],
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
      "Your overall alignment score places you in a phase: Survival (0-40) is about stabilizing the fundamentals, Growth (41-60) about building momentum, Expansion (61-80) about scaling what works, and Legacy (81-100) about lasting impact. The phase shapes the guidance you get. The same four phases and cutoffs describe each of your 12 domains and your Quick Pulse result, so there is only one scale to learn: a domain at 72 is in Expansion, just like an overall score of 72.",
    keywords: ["phase", "survival", "growth", "expansion", "legacy", "stage"],
  },

  // ---- Planning ----
  {
    id: "pl-print-plan",
    category: "Planning",
    question: "How do I print or share my business plan marketing plan or sales plan (PDF or Word) for a funder, partner or agency?",
    answer:
      "Open Alignment & Systems > Business Plan (or Marketing Plan, or Sales Plan; for the Forecast Plan, open Forecasting and scroll to Print / Share at the bottom) and choose the Print / Share tab. It unlocks when EVERY section of that plan is marked Complete (open a section on the Build tab and press Mark section complete; the tab shows which ones are left). Then: (1) pick who it is for: a funding request, a partnership proposal, or a general copy; (2) add your business name, your name and, if you like, the recipient and organization; (3) say what you are asking for or proposing and press Write the cover letter (your assistant drafts it from your plan, and you can edit every word; leave it blank and a simple letter is made for you); (4) choose what goes in: a financial overview made from your own numbers (your revenue targets, and your year-to-date results and forecast once you have entered income) and, as appendices, your Marketing, Sales and Forecast plans (each is offered once all of its sections are complete). The Marketing Plan and Sales Plan versions are the same flow without the financial overview and appendices (those belong to the business plan). Then download a PDF to send, or a Word file you can keep editing. The file has a branded cover, your cover letter, contents with page numbers, every section in order, and a footer on each page. It is built from your plan as it is right now, so download a fresh copy after you change anything.",
    keywords: ["print business plan", "business plan pdf", "word document", "funding request", "grant", "investor", "partnership proposal", "share my plan", "attach plan", "cover letter", "export plan", "download plan", "print share"],
  },
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
      "The follow-up engine keeps relationships warm. Contacts and tasks can carry a follow-up schedule; when a follow-up comes due, it surfaces in your notifications and Daily Compass so you reach out at the right moment. It works hand-in-hand with your Contacts (Clients & Sales → Contacts).",
    keywords: ["follow up", "follow-up", "followup", "engine", "reach out", "contacts", "cadence"],
  },
  {
    id: "sa-contacts-crm",
    category: "Sales",
    question: "What are Contacts and Forms, and how do I edit a contact?",
    answer:
      "Contacts (Clients & Sales → Contacts) is your own CRM: everyone who fills in one of your forms, books a call or is added by hand, with tags and a timeline of every touch. Click someone to open their record, then Edit to change their name, email, phone, company, title, website, address, birthday, social profiles (Instagram, Facebook, LinkedIn and YouTube, as a link or @handle; each opens in one click) and relationship (Client, Coach, Affiliate, Partner and so on, or your own). Under “Add or remove fields” you can add your own fields, like Referred by, and they appear on every contact. Tags show as buttons: click the x to remove one, type to add one, or click a tag to see everyone who has it. Tag history lists every tag added or removed, when, and where it came from (a form, a booking, an import or a person). Calls attended and Purchases show, newest first with dates, every call they attended (completed bookings and, for LifeCharter, MasterClass attendance from Zoom) and everything they bought (checkout purchases, Website Build orders and deals won in your Pipeline, with amounts); use + Add to log a call or a purchase the Suite didn't see, such as a coaching call or a sale made elsewhere. Schedule a follow-up on any contact: pick the day, say what it's about, and (if you like) click “Draft the email with AI” to have your assistant write it; edit it, then Schedule follow-up. It becomes a task, and on its day the draft is waiting in Daily Compass with Review and Send (nothing goes out until you press Send). Wherever you add a person (Contacts, a campaign, a deal, a sales activity, the Invite Tracker), the Suite suggests people already in your Contacts as you type, so you never add anyone twice. Forms gives you a hosted sign-up link (or a plain HTML form for your website) that saves people as contacts, tags them and can start a campaign; you can set the button text and a thank-you message, and you get an email for each sign-up. One-time emails to everyone with a tag are in Campaigns & Broadcasts. Only your account sees your contacts.",
    keywords: ["contacts", "crm", "forms", "edit contact", "custom fields", "address", "relationship", "tag history", "tags", "leads", "sign up form"],
  },
  {
    id: "sa-contact-emails",
    category: "Sales",
    question: "Why can I see my emails with a contact on their record?",
    answer:
      "Open a contact in Contacts and the Emails section lists every email with them, newest first: mail you've sent and received in your connected Gmail or Microsoft 365 (including Sent), plus the campaign and broadcast emails the Suite sent them. It checks your mailboxes each time you open someone, or click Refresh emails; click an email to read it in full. Only the account owner sees emails from their own mailboxes. Team members see just the Suite's emails. To start, connect a mailbox in Settings → Integrations.",
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
    id: "gs-executive-home-layout",
    category: "Getting Started",
    question: "Can I rearrange the cards on Executive Home?",
    answer:
      "Yes. Hover over a card and drag it by the grip in its top-right corner to where you want it. Every card moves on its own: the coaching calls, Your Morning Brief, Today's Schedule, First 30 Days, Pipeline, The Collective, Financial Pulse, Priority Tasks, your inbox and the AI Assistant. You can also drop a card into an empty space, and the cards fill the gaps. Your layout is remembered in that browser. Today's Schedule shows today; use its arrows to look at future days. In the Recurring column of Priority Tasks, click a task's name to edit or delete it.",
    keywords: ["executive home", "rearrange", "drag", "layout", "cards", "move card", "dashboard"],
  },
  {
    id: "sa-tag-library",
    category: "Sales",
    question: "Where can I see all my tags and what each one means?",
    answer:
      "Open Tag Library (Clients & Sales → Tag Library). It lists every tag in your account, grouped by family, with how many people carry each one (click the number to see them in Contacts), what adds it (a form, a calendar, a pipeline stage, a broadcast, an invite list, or the Suite itself), and a note you can type to record what the tag means. Rename changes a tag on everyone who has it. Retire takes it off everyone; nobody is removed from Contacts, and the page warns you when something is still adding that tag.",
    keywords: ["tags", "tag library", "all tags", "rename tag", "retire tag", "remove tag", "what does this tag mean", "tag list"],
  },
  {
    id: "sa-dm-pipeline",
    category: "Sales",
    question: "How do I track DMs and other outreach, and can I have more than one pipeline?",
    answer:
      "Use Outreach Pipelines (Clients & Sales → Outreach Pipelines). Every card shows where the conversation is happening as a coloured label (Instagram, Facebook, LinkedIn, Email or Text) with a matching stripe down its left edge; the filter buttons above the board count the people on each platform, and anyone linked to Contacts is tagged from-instagram, from-facebook, from-linkedin and so on, so you can filter Contacts by it too. Cards can also move by themselves: if a pipeline has stages named for it (Registered, Attended, No-show, Consultation booked), a person's card moves there when the Suite sees it happen, as long as the card has their email or is linked to their contact. A card only moves forward and never leaves a closed stage. You can have as many pipelines as you like, one per campaign or audience: click New pipeline, name it, give it a short tag, and start from DM outreach stages or three simple ones. Under Stages & settings you can rename, add, remove and reorder stages, set each stage's follow-up days, give each stage its own tag, and mark a stage Booked (it adds the person to your Sales Pipeline) or Closed. Add people with Add a person (it suggests people already in Contacts; an email adds them to Contacts), or from a DM script in Scripts & Templates with Add to DM Pipeline. Drag a card to its next stage: its follow-up date sets itself and becomes a task, and the person's contact record swaps the old stage tag for the new one, so their tags always show where they are. Their contact record also lists every pipeline they're in and their stage. Instagram, Facebook and LinkedIn don't let any app read the DMs you send, so you log each person as you message them. Cards turn gold on their follow-up day and red when overdue, and you can filter by Instagram, Facebook, LinkedIn, Email or Text.",
    keywords: ["dm", "dms", "direct message", "instagram", "facebook", "linkedin", "dm pipeline", "outreach", "follow up", "prospecting", "social selling"],
  },
  {
    id: "gr-affiliates",
    category: "Growth",
    question: "How do affiliates work in the Suite?",
    answer:
      "Clients & Sales → Affiliates has four parts. Recruiting is a pipeline for people you'd like as affiliates; drag someone to Active affiliate and they're added to My affiliates with their own link. My affiliates gives each affiliate a tracked link (lccommandsuite.com/r/their-code) that counts clicks and remembers the visitor for 60 days: sign-ups on your Suite forms and bookings on your Suite calendars are credited to them, and so are later purchases through your Suite checkout. Commission is set by product (Commission by product) and can be changed for any one affiliate on their page; sales you make elsewhere can be added by hand. Mark commissions paid and they're recorded as an Affiliate Commissions expense in Finance. Each affiliate has a private dashboard link to send them, with a monthly report (clicks, people referred, sales by product, commissions owed and paid) they can download as a spreadsheet; you see the same report on their page. Programs I promote keeps your own affiliate links and codes (Amazon and others) in one place; earnings you mark paid are added to Finance as Affiliate Income. If you're an affiliate yourself (for LifeCharter, for example), My partnerships shows your link and your monthly report right inside the app.",
    keywords: ["affiliate", "affiliates", "referral", "referral link", "commission", "partner", "partnership", "amazon associates", "payout", "monthly report"],
  },
  {
    id: "gr-short-links",
    category: "Growth",
    question: "How do I shorten a link and track its clicks?",
    answer:
      "Clients & Sales → Short Links. Click New short link, paste the real web address, and the Suite gives you a short one — lccommandsuite.com/l/ plus a code it picks for you, or one you choose yourself if that exact code is still free (codes are shared across every account, so it's first come, first served, same as affiliate codes). Add a title just for your own reference if you like. Share the short link anywhere — a bio, a slide, a text, a QR code — and every click is counted. Pencil edits where it points to or its title without changing the short code itself, so anything you've already shared keeps working. The power button turns a link off (visitors land on a \"not found\" page instead) without deleting it, and the trash can removes it for good. Click the chart icon on any link to see its last 30 days of clicks and where they came from (Instagram, Facebook, direct, and so on), or the QR icon for a scannable, downloadable code for that link. Your own address instead of lccommandsuite.com: open \"Your short-link domain\" at the top of the page, add a domain or subdomain you own (like go.yourbusiness.com), add the one DNS record it shows you at your domain provider, then click Check verification. Once it's verified, every short link (new and existing) automatically uses it — go.yourbusiness.com/code instead of lccommandsuite.com/l/code — and QR codes update to match.",
    keywords: ["short link", "short links", "link shortener", "shorten a link", "bitly", "short.io", "tracked link", "qr code", "bio link", "custom domain", "own domain", "branded link"],
  },
  {
    id: "sa-invite-tracker",
    category: "Sales",
    question: "How do I track who I invited to an event and who registered?",
    answer:
      "Clients & Sales → Invite Tracker. Create an invite list for the event, give it an invite tag (like open-house-invite) and link it to the event's sign-up form. Everyone in Contacts with that tag is on the list, so you can invite people by tagging them in Contacts or on an import, or add them right on the page by name or email (it suggests people already in your Contacts) or by pasting a whole list. Build the invite itself as a campaign in Campaigns & Broadcasts (one email with a button to your sign-up form), then pick it under List settings → Invite campaign. Under Invite people, choose “Send them the invite email” (emails them the invite and records when it went out) or “I already invited them myself” (no email; marked Invite sent now). Keep the invite and the “you're in” confirmation as two separate campaigns: the confirmation should start only from the sign-up form. Registered fills in on its own, with the date and time, as soon as they sign up on the form. People who registered without the tag are shown underneath. Taking the tag off removes someone from the list, and you can download the list as a CSV.",
    keywords: ["invite", "invites", "invite tracker", "guest list", "rsvp", "registered", "event", "who registered"],
  },
  {
    id: "em-own-resend",
    category: "Sales",
    question: "Why do I connect my own Resend account to send email, and how?",
    answer:
      "Resend is the service that delivers your campaigns, broadcasts and booking emails. You use your own free Resend account so your sending is yours: it counts on your own plan, your own domain and your own reputation, never on anyone else's. To set it up, open Contacts → Email sending. Step 1: create a free account at resend.com, open API Keys, create a key with Full access (a key that can only send can't add your domain), and paste it into the Suite. It is stored encrypted and never shown again. Step 2: add your domain (a subdomain like mail.yourbusiness.com works well) and add the DNS records shown at your domain provider, then click Check verification. Step 3: fill in who your emails come from and your mailing address. Only the account owner can connect or change it. If you disconnect Resend, your domain is removed from your Resend account and the Suite stops emailing your contacts until you connect again. Emails the Suite itself sends you (password resets, support replies, reminders) are separate and not part of your plan.",
    keywords: ["resend", "email sending", "api key", "domain", "dns", "verify", "connect resend", "sending domain", "deliverability", "full access"],
  },
  {
    id: "sa-sequences",
    category: "Sales",
    question: "How do Campaigns and Broadcasts work, and why won't my emails send yet?",
    answer:
      "Both lists are grouped under section headers by offer (for example a MasterClass or a challenge): type the offer name in the Offer box on a campaign or a broadcast and it moves under that header, with everything else for that offer. A broadcast can also leave people out: under 'Skip anyone still receiving', tick a campaign and anyone in the middle of it is skipped, so nobody gets a follow-up series and a new promotion at the same time; the recipient count updates as you tick. 'Skip anyone with these tags' does the same by tag: add a tag (for example the tag for people who attended the last session) and anyone carrying it is left out. A campaign has the same rule in its settings, 'Skip anyone tagged': people with that tag are never started on the campaign, and anyone who picks the tag up partway through is taken out. Campaigns & Broadcasts (Clients & Sales) has two tabs. A campaign is a timed email series: day 0 goes right away, then each email on its day at the hour you pick, in each person's own time zone. People join from a form or a booking calendar, or you add them: open the campaign's People tab and search your contacts by name or email, or open a contact and use “Add to a campaign”. Anyone who unsubscribes is never emailed again. Each campaign's People tab shows who's in it, how many emails they've had, and Registered: the date and time they signed up on a form that starts the campaign or that its emails link to (or tick it yourself if they confirmed another way). Turn on “Email me when someone registers” to get an email whenever someone joins. To send one person an email again (they didn't get it, or deleted it), click the circular-arrow Resend button on their row, pick which email in the series, and click Send now; it goes to them right away, shows on their contact timeline, and the schedule won't send that email to them a second time. A broadcast is a one-time email to everyone with the tags you pick, plus anyone you add by name, sent now or at a time you schedule. Once a broadcast has gone out, open it and use “Resend to one person” to send that same email to anyone in your Contacts (including someone who joined after it went out), or click Resend next to an address it couldn't reach. Nobody who has unsubscribed can be resent to. Writing tips for campaign and broadcast emails: a line starting with ## is a heading, **words** are bold, lines starting with - are bullets, and [Button words](https://your-link) makes a named link. Use Send test to see it in your inbox first. Emails go out through your own Resend account and from your own domain, so first open Contacts → Email sending: (1) create a free Resend account at resend.com, make an API key with Full access and paste it in; (2) add a domain like mail.yourbusiness.com and add the DNS records it shows at your domain provider, then click Check verification; (3) fill in who your emails come from and your mailing address (the law requires it on marketing emails). Until then, campaigns and broadcasts can't be turned on.",
    keywords: ["campaigns", "broadcasts", "sequences", "email series", "drip", "nurture", "newsletter", "sending domain", "dns", "verify", "email sending", "mailing address"],
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
      "The Financial Pulse has two faces. On your dashboard it's a card you can switch between Week, Month and Year: it shows your income so far, how that compares with the previous week/month/year, the percentage of your income goal reached, and bars for the period (days, weeks or months). The Finance Center's Financial Pulse page goes deeper: income, expenses and net for week-to-date, month-to-date and year-to-date, your budget status, and an AI-graded health score. Both pull live from your Finance Center ledger, and the periods follow your time zone. To add money in or out, use the Income and Expense buttons right on the dashboard card (a small window opens, you save, and the card updates), or click the card's title to open the full Financial Pulse page, which also has Add entry, Import and P&L.",
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
      "The 8 pillars are the operational backbone of your business: Customer Acquisition, Sales Journey, Onboarding, Support/Customer Service, Communication, Fulfillment, Internal Process & Culture, and Referral Process. You don't set them by hand: the Suite scores each pillar 0-100 from your Brain and Profit assessments, your Quick Pulse check-ins, what you do in the Suite (leads, pipeline, SOPs, email sequences, referrals) and the Go deeper questions for that pillar, using the same four phases as the rest of the app. The average of the eight feeds your Operations score and your overall business health.",
    keywords: ["operations", "8 pillars", "pillars", "operational", "acquisition", "onboarding", "fulfillment", "score", "scored"],
  },
  {
    id: "op-pillar-not-scored",
    category: "Operations",
    question: "Why does an operational pillar say 'Not scored yet', and is it the same for every account?",
    answer:
      "Every account's pillars are scored the same way, from that account's own data only. A pillar shows 'Not scored yet' when the Suite has nothing to score it from: no Profit or Brain answers that apply, no Quick Pulse check-in, no matching activity in the Suite, and none of its Go deeper questions answered. Each answered input adds to the score, and a pillar's card lists exactly what it is built from and what is still missing. The quickest way to bring a pillar in is to answer its Go deeper questions on the Operations page, then take your Quick Pulse check-in. Open-text answers help your AI insights but are not scored; choice answers are.",
    keywords: ["not scored", "pillar", "score", "go deeper", "operations", "why", "missing", "no score"],
  },
  {
    id: "op-status",
    category: "Operations",
    question: "How do I improve an operational pillar's score?",
    answer:
      "Each pillar card on the Operations page shows its score and exactly what it is built from, so you can see what is lifting it and what is holding it back. To raise it: answer that pillar's Go deeper questions (some pillars cannot be scored until you do), write the matching SOP in Playbook & SOPs, take your Quick Pulse check-in, and keep using the Suite for that area (for example run a pipeline, set up email sequences, or track referrals). A pillar that scores 40 or below sends you a notification. Add notes on each card for yourself. The AI Operations Insights card reads your scores and tells you where to focus next.",
    keywords: ["update pillar", "improve pillar", "pillar score", "status", "needs attention", "operations insights", "notes", "go deeper"],
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
      "Scripts & Templates (Daily Compass) has a Starter Library of 56 ready-to-use scripts and emails across Sales, Prospecting, Objections, Onboarding, Follow-up, Content, Nurture and Closing. Open one and use Fill in & personalize to type in the blanks, or ask your AI assistant to rewrite it in your voice using what you've told it about your business (shorter, warmer, more direct, or your own instruction). Save any of them to My Library to keep your own copy, or write or generate new ones. What you save in My Library is private to your account — no other client can see it. Each one can be tagged with the platforms it's for (Instagram, Facebook, LinkedIn, YouTube, Spotify, Email, DM or Text): pick them in the editor, filter with the Platform buttons, click a platform badge on any card to see everything for it, or type the platform in search.",
  },
  {
    id: "ai-bot",
    category: "AI & Automation",
    question: "How does the AI in LifeCharter work?",
    answer:
      "Your AI assistant (called Sidekick until you name it yourself in Settings → AI Assistant) is woven throughout the app: it grades your financial health, suggests Quick Wins tailored to your weakest areas, generates Daily Compass insights grounded in your 12 dimensions and 8 pillars, optimizes your tech stack, and answers your questions in the Travel Partner widget. It uses your own connected AI key. It always has a short map of the whole Command Suite in mind (where things live, how scores work, what it can do for you), and it uses the Help library for step-by-step how-to questions.",
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
      "They're one place now: the Content Calendar, in the left menu under Daily Operations right after Daily Compass. Use Create content to write a post, pick platforms from your connected accounts, draft the caption + hashtags with AI, add media, and save as draft, schedule, or publish now through PostStream. Every post shows on its day, color-coded by status. Open any planned post and choose Schedule or publish to send it through PostStream from the calendar — the two stay linked, so a post that goes out (or one you make directly in PostStream) shows up as posted on the calendar and counts once.",
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
    id: "gs-lc-beacon",
    category: "Content & Social",
    question: "What is LC Beacon, and does my Content Calendar change?",
    answer:
      "LC Beacon (beacon.lccommandsuite.com) is LifeCharter's own social posting app: you connect your social accounts once, then write, schedule and publish posts to them from one place. It is live for AmiLynne today with Bluesky, Facebook Pages, Instagram, LinkedIn and YouTube working. LinkedIn is personal profiles only (company Pages are not supported yet), and YouTube videos posted through Beacon stay Private until Google's audit is passed. Threads is built but not connected yet, and TikTok, Pinterest and X are not available. More platforms are being added and approved. It is not open to clients yet. Nothing changes for you now: your Content Calendar still publishes through PostStream exactly as before. When Beacon is approved for every platform, the Content Calendar will move over to it, you will be told ahead of time, and this Help library will explain the new steps.",
    keywords: ["beacon", "lc beacon", "social posting", "publish", "poststream", "content calendar", "social accounts", "schedule posts"],
  },
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
      "Clients & Sales → Calendars gives you booking pages like Calendly. Add hosts, send each host their private connect link so their Google or Microsoft calendar is checked for busy times, then create a calendar with its length, buffers, questions and where you'll meet. Every booking lands in Contacts and can start a sequence or open a Pipeline deal. Confirmation and reminder emails go out through your own Resend account and verified domain (Contacts → Email sending); until then, bookings still work and the host's calendar invite still goes out.",
    keywords: ["booking link", "calendly", "calendars", "book a call", "appointments", "hosts", "reminders", "scheduling page"],
  },

  // ---- Getting Started (navigation) ----
  {
    id: "gs-quick-add",
    category: "Getting Started",
    question: "What does the + button in the top bar do?",
    answer:
      "The '+' is a quick-add menu. It opens a short list to instantly create a new task (a small form right there, with an optional due date, time and 'due by' or 'do it at' choice), log a sale, create content, or schedule a planning session. The light bulb next to it is for a glitch, a suggestion or feedback; the bell is your notifications; the '?' opens Help & Q&A.",
    keywords: ["plus button", "quick add", "top bar", "new task", "shortcut", "navigation", "due date", "time"],
  },
  {
    id: "gs-feedback-bulb",
    category: "Getting Started",
    question: "What's the light bulb in the top bar for?",
    answer:
      "Click it for three choices. Something's not working lets you describe a glitch and, if you check the box, also opens a real support ticket our team follows up on — either way it shows up under Help → Contact Support → \"Glitches your team has reported,\" visible only to your own account. I have a suggestion and General feedback both go on a shared board at the bottom of that same page that every Command Suite user can see and thumbs-up — voting tells us how many people want the same thing. We can mark any of the three Open, Under review, Planned, Shipped or Closed, which shows right on the item.",
    keywords: ["light bulb", "lightbulb", "feedback", "suggestion", "glitch", "bug report", "vote", "thumbs up", "roadmap", "feature request"],
  },
  {
    id: "gs-accountability-partner",
    category: "Getting Started",
    question: "How do I set up an accountability partner?",
    answer:
      "Open Daily Operations → Accountability Partner and choose Invite an accountability partner. Add their name and email. Your partner can be another Command Suite client or anyone outside the system: someone without an account gets a private link by email and needs nothing to sign up for. Your partner never sees your account. They see only the commitments you add on this page, and you see only what they add. You can have up to three partners at a time, and either of you can pause or end a partnership whenever you like. Don't have someone in mind? The Collective has a Find an Accountability Partner channel under Community, where members share what they're working on and the kind of accountability that helps them; when you find a fit, invite them from this page.",
    keywords: ["accountability", "accountability partner", "partner", "invite", "buddy", "check in", "hold me accountable"],
  },
  {
    id: "gs-accountability-how",
    category: "Getting Started",
    question: "What can I do on the Accountability Partner page?",
    answer:
      "Commitments: add tasks, milestones, projects, deadlines or habits (or share one of your existing tasks), mark them as a promise, and attach a reward and what happens if it slips. Both of you can leave notes on any commitment. Encouragement: send a template message (Encourage, Nudge, Inspire, Support, Celebrate), save your own, or tap Write some for me for AI-written options; the I'm stuck button asks your partner for support in one tap. Check-in: a five-minute weekly note on what went well, where you got stuck and what you're committing to. Our agreement: each of you writes how you want to be held accountable, the tone that works for you, your rewards, and what happens if something slips. You choose whether that is a pledge in writing, tracked on each commitment as followed through or not, both, or kept light. Wins: everything either of you has finished. You also get a friendly reminder the day before something is due and a gentle note if it slips. New encouragement, nudges, I'm stuck requests, your partner's wins and invitations also show up in the bell at the top, so you see them right away; they clear once you open the page.",
    keywords: ["accountability", "commitments", "encouragement", "nudge", "check-in", "agreement", "reward", "consequence", "stuck", "wins", "streak"],
  },
  {
    id: "gs-accountability-calls",
    category: "Getting Started",
    question: "How do I schedule a call with my accountability partner?",
    answer:
      "Open your partner and tap the Calls tab. Quick call: tap In 30 minutes, In an hour, This evening or Tomorrow and your partner gets a request they can accept in one tap. Standing call: pick the day or days, the time, every week or every other week, and how long, then propose it. Once your partner says yes it is confirmed and both of you get an email with a calendar file that adds it to Apple, Google or Outlook with a reminder 10 minutes before. Everyone sees times in their own timezone, and a standing call keeps its clock time through daylight saving. Put your Zoom or Meet link (or a phone number) in the How will you two connect box and it is added to every call you set up. A request waiting for you, and a call starting within the hour, show in the bell at the top and at the top of your partner page, where Join opens the call link. You can skip a single date, withdraw a request, or cancel a call at any time. Partners outside the Suite do all of this from their private link.",
    keywords: ["accountability", "call", "schedule", "recurring", "weekly", "quick call", "calendar", "zoom", "reminder", "partner"],
  },
  {
    id: "gs-accountability-ai",
    category: "Getting Started",
    question: "Does the Accountability Partner page have AI help, and who pays for it?",
    answer:
      "Yes. Draft it with AI on the Our agreement tab writes how you'd like to be held accountable, your rewards and what happens if you miss something, from a few words about how you work. Suggest a reward on a commitment and Write some for me on the Encouragement tab work the same way. It uses your own AI key (Settings → AI Assistant) and sees only what you type on this page, never your business data. When your partner is outside the Suite, their writing help runs on your key, with a daily limit. Consequences are always self-chosen and kept kind: the AI will soften anything that shames or harms.",
    keywords: ["accountability", "ai", "draft", "write for me", "reward", "consequence", "key"],
  },
  {
    id: "gs-accountability-coach",
    category: "Getting Started",
    question: "Can my coach see my accountability partnership?",
    answer:
      "Only if you choose. On a partnership page, turn on Let my coach see this and your coach gets a read-only view of it. Turn it off any time and she can no longer see it. Your partner sees a note on their page whenever your coach can see the partnership, so nothing is hidden from them, and a coach can't change anything.",
    keywords: ["accountability", "coach", "visible", "privacy", "read-only"],
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
      "Recurring tasks live in the fourth column of the Priority Tasks card on the dashboard. Click the + next to RECURRING to add one: give it a title, choose how often it repeats (every day, certain days of the week — with a 'Weekdays only' shortcut — or once a month on a day you pick; a task set for the 31st lands on the last day of shorter months), and optionally a time of day ('due by' or 'do it at'). The column shows only what's due today; check a task off and it stays ticked for the day, then resets on its next day. Timed recurring tasks also appear in Today's Schedule and trigger reminders. To change or stop one, click its name in the RECURRING column (or click the + to see all of them, including ones not due today), then use the pencil to edit it (title, schedule, time or priority) or the trash can to delete it. Editing keeps the days you've already checked off.",
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
      "Your monthly income goal is the income target in Finance → Budget (you can also set it right on the dashboard's Financial Pulse card). Switch the card to Month to see the percentage of it reached. Yearly defaults to 12 times your monthly goal and weekly to the yearly goal divided by 52 — or click 'Edit goal' on the Week or Year view to set your own number for that period. The percentage is your income so far in that period divided by its goal. Growing month by month? In Finance → Budget, the Month-by-month income goals card lets you give each of the next 12 months its own goal. Your Financial Pulse follows it: this month's goal is that month's own number, the week is that goal spread over its weeks, and the year adds up your month goals for the calendar year. A month with no goal of its own uses your monthly goal. Goals are private to your account.",
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
      "Yes. Your assistant reads your own Brain, Soul and Profit assessment answers — each one counts as soon as you give it (the Brain and Soul assessments save as you go; you don't have to finish) — along with your live dimension scores, your open and recurring tasks for today, your income against your goals, today's events from the calendars you've connected, and your recent conversation with it, so its advice is about your business rather than generic. Anything you mark sensitive in the Soul assessment is never shown to it. Your data is only ever used for your own account. It also keeps the facts you give it under Settings → AI Assistant → 'What should your assistant know about you and how you work?' (see 'How do I teach my AI assistant about me, my team and how I work?'). It remembers your recent conversation (about the last six hours), so older advice never overrides what is true in your account today. Your conversation stays on the AI Assistant card, newest first. 'New conversation' starts a fresh one and saves the old one under 'Past conversations' (read, continue or delete it); your assistant still knows your account, your Teach notes and your settings. When you tell it something lasting about you or your team, it offers to save it to your Teach notes so you never repeat yourself.",
    keywords: ["assistant", "ai", "learn", "learns", "assessments", "memory", "remember", "personalized", "sensitive", "private", "clear memory", "new conversation", "past conversations", "brain", "soul", "profit"],
  },
  {
    id: "ai-assistant-instructions",
    category: "AI & Automation",
    question: "Can I tell my AI assistant how to reply?",
    answer:
      "Yes. In Settings → AI Assistant, the 'How should your assistant reply?' box holds standing instructions it follows every time — for example 'be direct and skip the pep talk', 'keep answers under 80 words', 'use short bullet points', or 'always end with one next step'. Tap the suggestions to add them, edit freely (up to 1,500 characters), and click Save. Instructions shape tone, length, format and focus; your assistant still only uses your own information and never invents facts. You can rename it in the same place, and start a fresh conversation with 'New conversation' on the dashboard's AI Assistant card (the old one is saved under Past conversations).",
    keywords: ["instructions", "how to reply", "tone", "style", "shorter", "bullet", "customize", "assistant", "name", "rename", "personality", "format"],
  },

  // ---- Added Sept 28 2026: pages and changes not covered above ----
  {
    id: "gs-sidebar",
    category: "Getting Started",
    question: "How is the menu on the left organized?",
    answer:
      "The left menu follows how you run the business, with like things together. Daily Operations is today's rhythm: Executive Home, Daily Compass, Content Calendar, Tasks, Projects, Accountability Partner, Quick Capture, The Collective, Finance, Offers & Packages and Testimonials. Clients & Sales is your CRM: Contacts, Pipeline, Outreach Pipelines, Calendars, Campaigns & Broadcasts, Invite Tracker, Affiliates and Short Links. Alignment & Systems holds the big picture, your four plans and how the business runs, all in one place: Business Alignment, Alignment Profile, Progress, Business Plan, Marketing Plan, Sales Plan, Forecasting, Goal Ladder, Planning Hub, Weekly Review, Business Segments, Operations, Playbook & SOPs and Legal & Compliance. Settings holds your AI Assistant and Settings. Getting Started, at the bottom, holds Set up Suite, First 30 Days, the Starter Guide and Website Review. Click any section heading to fold it away; the page you're on always stays visible. Your photo and name at the bottom open Light/Dark mode, Sign out and your workspace.",
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
    id: "ba-growth-roadmap",
    category: "Business Alignment",
    question: "Where is my personalized growth roadmap?",
    answer:
      "On the Business Alignment page, just below your briefing. Once your three assessments are in, press Build my roadmap and your assistant writes your 90-day Growth Roadmap from your own scores and answers: the three areas to focus on first, then three phases (Days 1 to 30, 31 to 60 and 61 to 90) with two or three specific steps each. Every step opens the right screen, and one click adds it to your tasks. Press Refresh any time your scores change. It uses your own AI key, saves with your account, and never quotes your private answers.",
    keywords: ["growth roadmap", "roadmap", "90 day", "plan", "recommendations", "business alignment", "next steps", "assessment results"],
  },
  {
    id: "gs-starter-guide",
    category: "Getting Started",
    question: "Is there a step-by-step guide to setting up?",
    answer:
      "Yes. The Starter Guide is a checklist that takes you from your first sign-in to a Suite that knows you, one small step at a time. Day 1 has five steps (connect your AI, take the Brain, Soul and Profit assessments, and connect one tool), each with where to click and how you will know it worked. It also covers a look around Executive Home, your first week of coaching calls, your First 30 Days, and next steps for when you are ready (like bringing your contacts in and connecting your own Resend account so you can email them). Tick each box as you go; your ticks are saved on your device. Open it from Getting Started → Starter Guide in the menu, or from the Set up Suite page.",
    keywords: ["starter guide", "setup guide", "checklist", "step by step", "getting started", "onboarding", "first steps", "set up"],
  },
  {
    id: "gs-first-30",
    category: "Getting Started",
    question: "What is First 30 Days?",
    answer:
      "First 30 Days (Getting Started → First 30 Days) starts with your three assessments (Brain, Soul and Profit), because everything else in the Suite is informed by your answers. Then come small steps, one week at a time. Week 1: write your vision, add your offers and prices, put open opportunities in the Pipeline, set your monthly income goal. Week 2: record this month's income and expenses, add your regular bills, do your first weekly review, check your forecast and set its assumptions. Week 3 (systems and plans): write your first SOP, answer the Go deeper questions on three of your 8 operational pillars, work through the Legal & Compliance checklist, finish your Business Plan by marking every section complete (that unlocks the printable PDF and Word plan), write your Marketing Plan (your assistant can draft each section). Week 4: break a yearly goal into this quarter, take your first monthly Quick Pulse. Each week opens once the one before it is fully checked off, and steps tick themselves off from your own data. The ones that strengthen your lowest scores are marked for you. Your current stage also shows on Executive Home under Your first 30 days.",
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
      "Weekly Review (Alignment & Systems → Weekly Review) is a short weekly sit-down with your real numbers: what came in and went out, your tasks and goals, and your assistant's read on what they mean. It suggests next steps with due dates; edit them, untick any you don't want, and they go straight onto your task list. Finishing it marks that week's planning session complete, with the review saved as its notes.",
    keywords: ["weekly review", "review", "weekly", "planning session", "rhythm", "check in", "next steps"],
  },
  {
    id: "pl-goal-ladder",
    category: "Planning",
    question: "What is the Goal Ladder?",
    answer:
      "The Goal Ladder (Alignment & Systems → Goal Ladder) breaks your year's goals into this quarter, this month and this week, so a big goal always has a next step. Choose an area, answer four short questions, and your assistant proposes this quarter's milestones for it; edit them before you save.",
    keywords: ["goal ladder", "goals", "quarter", "quarterly", "milestones", "yearly goal", "break down"],
  },
  {
    id: "sa-offers",
    category: "Sales",
    question: "What goes in Offers & Packages?",
    answer:
      "Offers & Packages (Daily Operations → Offers & Packages) lists everything you sell: your signature program, packages, retainers and products, each with its price, what's included and who it's for. Deals in your Pipeline point to these offers, and Executive Home shows which offer is bringing in the most. To stop selling an offer but keep its history, set it to Retired instead of deleting it.",
    keywords: ["offers", "packages", "pricing", "products", "services", "what I sell", "retired"],
  },
  {
    id: "op-sops",
    category: "Operations",
    question: "How do Playbook & SOPs work?",
    answer:
      "Playbook & SOPs (Alignment & Systems → Playbook & SOPs) is how your business runs, written down once. Name a process, jot how you do it today in your own words, and your assistant drafts clean, numbered steps you can edit. Your SOPs make it easier to hand work to a team member and keep things consistent.",
    keywords: ["sop", "sops", "playbook", "process", "procedures", "standard operating procedure", "document", "delegate"],
  },
  {
    id: "op-compliance",
    category: "Operations",
    question: "What is Legal & Compliance?",
    answer:
      "Legal & Compliance (Alignment & Systems → Legal & Compliance) is one checklist for contracts, insurance, licenses and filings. Use 'What applies to my business?' and your assistant suggests which items matter for you. Ticking items off feeds your Legal score in your business health. It's a checklist to keep you organized, not legal advice; check anything important with a qualified professional.",
    keywords: ["legal", "compliance", "contracts", "insurance", "licenses", "filings", "checklist", "legal score"],
  },
  {
    id: "gr-website-review",
    category: "Growth & Reviews",
    question: "What is the Website Alignment Review?",
    answer:
      "Every Command Suite client gets a Website Alignment Review, included. Add your website address in Set up Suite or on the Website Review page (Getting Started → Website Review), and within 14 days of joining we read your site against the positioning, voice and offer you build in the Suite and give you the five changes that matter most. You'll get an email when it's ready, and it stays on your Website Review page. If your site needs rebuilding, ask about the Website Build.",
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
  {
    id: "gs-coaching-calls",
    category: "Getting Started",
    question: "What coaching calls come with the Command Suite?",
    answer:
      "Executive coaching is part of every Command Suite plan, and the live calls are where it happens. Every week (all times Mountain): Monday 10am, the Weekly Alignment Anchor (last week's wins and challenges, this week's goals; if you make one call a week, make it this one). Tuesday 6pm, the 90-minute Dimension Call: Growth on the first Tuesday, the Hope Seat on the second, a SOUL Session on the third, Community on the fourth, and the Flight Crew Mixer (round robin networking) on a fifth Tuesday. Wednesday 1pm, Sales & Marketing Coaching (20 to 30 minutes of teaching, then open support). Thursday 11am, Command Suite Office Hours for anything tech related, with a build-along every other week. Friday 10am, The Inner Command, our mindset call about life and business. New clients also have the New Client Launch Call every other Thursday at 1pm during their first 30 days. Growth and VIP members are invited to a quarterly intensive (a Friday and Saturday, 10am to 2pm on Zoom), and there's an annual in-person retreat for Command Suite clients. The Coaching calls card (Monday to Friday, with Zoom buttons) is on Executive Home and Daily Compass, with This week and Next week tabs so you can plan ahead; on Executive Home you can drag that card wherever you like, and the full schedule and replays are on the Collective's Events page. Each call has its own Zoom room; the first time you join one, Zoom asks you to register once. You don't need to attend them all: pick what serves you each week. Know a founder who'd benefit? Founder's Half Hour, every Tuesday at 1pm, is free and open to everyone.",
    keywords: ["coaching", "calls", "group coaching", "schedule", "alignment anchor", "office hours", "inner command", "mindset", "hope seat", "dimension call", "launch call", "build along", "intensive", "retreat", "support call"],
  },
  {
    id: "gs-call-register",
    category: "Getting Started",
    question: "Do I need to register for each coaching call, and where are the replays?",
    answer:
      "Each call series has its own Zoom room. The first time you join one, Zoom asks for your name and email once; after that the same link takes you straight in every week. Your next 7 days of calls are on Executive Home and Daily Compass (“This week's coaching calls”), with a Join now button that lights up 10 minutes before a call. Replays are in the Collective under Events → Past & replays. Replays are added on their own: once a recorded call's video has finished processing (usually within a few hours), it appears on that session under Events → Past & replays in the Collective.",
    keywords: ["register", "registration", "zoom", "join", "replay", "recording", "coaching call", "link"],
  },
  {
    id: "gs-hope-seat",
    category: "Getting Started",
    question: "What are the Hope Seat and the Flight Crew Mixer?",
    answer:
      "Both are Tuesday Dimension Calls (6pm Mountain, 90 minutes). On the second Tuesday, one to three members are invited into the Hope Seat for direction and coaching while everyone else holds space and learns alongside them; what's shared there stays in the room. In months with a fifth Tuesday, the call becomes the Flight Crew Mixer: round robin networking so you get to know the founders you're flying with.",
    keywords: ["hope seat", "flight crew mixer", "networking", "round robin", "tuesday", "dimension call"],
  },
  {
    id: "gs-founders-half-hour",
    category: "Getting Started",
    question: "What is Founder's Half Hour, and can I invite someone?",
    answer:
      "Founder's Half Hour is a free 30-minute coaching and mentoring call with Babs every Tuesday at 1pm Mountain, open to everyone. Bring a question about your business and leave with a next step. Yes, invite a friend or a fellow founder: they register at https://us02web.zoom.us/meeting/register/Yv6WtkGmRaGGDLhoPrMMfw",
    keywords: ["founder's half hour", "founders half hour", "free call", "public call", "invite", "friend", "tuesday noon"],
  },

  // ---- Added Oct 4 2026 ----
  {
    id: "ai-assistant-teach",
    category: "AI & Automation",
    question: "How do I teach my AI assistant about me, my team and how I work?",
    answer:
      "Go to Settings → AI Assistant and fill in the box 'What should your assistant know about you and how you work?' (the 'Teach' link on the dashboard's AI Assistant card opens it). Write plain sentences: who is on your team and what each person handles, the days and hours you work, your busy season, what matters most this quarter, how you like to sell, anything it should always keep in mind. Up to 3,000 characters, private to your account, and you can edit it any time. It is different from 'How should your assistant reply?', which controls its style (short, direct, bullets). Click Save and it applies to your next question.",
    keywords: ["teach", "train", "assistant", "remember", "know about me", "notes", "team", "preferences", "personalize", "ai", "learn"],
  },
  {
    id: "ai-assistant-howto",
    category: "AI & Automation",
    question: "Can my AI assistant tell me how to do things in the Command Suite?",
    answer:
      "Yes. Ask it things like 'where do I add an offer?' or 'how do I connect my calendar?' and it answers from the Command Suite Help library, the same answers you find under Help. If the Help library does not cover your question it says so instead of guessing, and you can reach support from Help → Contact Support.",
    keywords: ["assistant", "how do i", "where do i", "help", "ask", "how to", "mariposa", "sidekick", "guide"],
  },
  {
    id: "ai-assistant-tasks",
    category: "AI & Automation",
    question: "Can my AI assistant tell me my top priorities or the easiest tasks to finish?",
    answer:
      "Yes. Ask it things like 'what are my top three priorities?' or 'what are the five easiest tasks I can finish?' and it answers from all of your open tasks, ranked the same way every time. Top priorities put overdue and critical work first, then what is due soonest, then high priority, then what you already moved to today or started. 'Easiest' uses the effort level you set on each task (low, medium or high), so set effort on your tasks for the best answer; most tasks default to medium, and it will tell you honestly when fewer than five are marked low. Tasks marked Waiting are left out because you can't do them yet. It can read your tasks but not change them: move one to Today from the Tasks page or Daily Compass.",
    keywords: ["tasks", "priorities", "top three", "easiest", "quick wins", "what should i do", "assistant", "effort", "energy", "prioritize"],
  },
  {
    id: "ai-assistant-actions",
    category: "AI & Automation",
    question: "What can my AI assistant do for me, and is it safe?",
    answer:
      "Beyond answering questions, your assistant can do work in your own account. Ask it to: tag or untag contacts and add a contact; create or change tasks (priority, effort, due date, move to Today); create an outreach pipeline, add people to it and move them between stages; add a deal to your Sales Pipeline; write a broadcast email or an email campaign as a DRAFT; write social posts and add them to your Content Calendar; draft a section of your Business, Marketing, Sales or Forecasting plan from your assessment answers; or create a page in your own left menu (under MY PAGES), keep it updated and delete it when you are done with checklists, tables, notes and links. Every change shows you a preview first and nothing happens until you press Approve. Press Edit to say what to change (it brings back a corrected preview), or Cancel to throw it away. Most things can be undone with one click afterwards. You can also ask it to delete a page it built. It only ever works in your own account, and a team member can only do what their role allows. Emails are only saved as drafts: it never sends, schedules or turns on an email or message, and it never publishes a post right now. You review and send from Campaigns & Broadcasts yourself. It cannot yet do everything in the Suite; if it can't, it will say so and offer the closest thing.",
    keywords: ["assistant", "ai", "do things", "tag contacts", "create pipeline", "draft email", "create page", "content plan", "approve", "safe", "actions", "build", "automation", "write my plan", "plan section"],
  },
  {
    id: "ai-assistant-plans",
    category: "AI & Automation",
    question: "Can my AI assistant write my business, marketing or sales plan?",
    answer:
      "Yes, one section at a time. Ask it, for example, 'write my Ideal Client section' or 'fill in the empty sections of my Sales Plan'. It first looks at the plan to see what is empty, then drafts the section from your Brain, Soul, Profit and Command Shift answers and what you have told it. You see the full new text before anything is saved: press Approve to save it, Edit to tell it what to change, or Cancel. If the section already has your own writing, the preview warns you that it would be replaced (or it can add to the end instead), and Undo puts your old text back. When your assistant writes a section it fills that section's question fields in the same approval, and the preview lists them. For sections written earlier with empty fields, ask it to 'fill in the fields from my text': it reads what the section already says and fills only the empty fields (never overwriting an answer), with one approval for the whole plan. Undo reverses either. If a section already has text, your assistant first asks whether to replace it or add to it, so it never overwrites your writing by surprise. After each section you approve, your assistant names the next empty one: say 'next' and it drafts it, so you can move through a whole plan one approval at a time. The plan page you have open updates by itself the moment you approve or undo, no refresh needed. Saved drafts are marked 'Drafted by' your assistant in the plan builder. Change the text yourself and the label becomes Edited; press Mark section complete when you are happy with it and it shows Complete (Reopen undoes that). It never invents facts your assessments don't give, and it keeps private Soul answers out of your plans unless you ask. Completing plan sections also raises your Marketing and Sales readiness in your scores, the same as writing them yourself.",
    keywords: ["write my plan", "business plan", "marketing plan", "sales plan", "forecasting plan", "plan section", "ideal client", "draft plan", "assistant", "assessments", "fill in my plan"],
  },
  {
    id: "gs-my-pages",
    category: "Getting Started",
    question: "What are My Pages in the left menu?",
    answer:
      "My Pages are pages you add to your own menu: a tracker, a checklist, a client list, a plan, notes. Ask your AI assistant to create one (for example 'make a page called Podcast Launch with a checklist and a guest tracker') and approve the preview, and it appears under MY PAGES in the left menu. A page can hold headings, text, highlighted notes, checklists, tables and links, and every page automatically uses the Command Suite look (Cormorant Garamond headlines, indigo and gold, raised cards), whoever builds it. You can edit everything on the page yourself, add or delete blocks, and ask the assistant to add to it or update it later ('tick off episode 3, add Dana to the guest tracker'). To remove a page, ask the assistant to delete it (you approve first, and can undo right after), or open the page and use Delete this page at the bottom. Pages are private to your account.",
    keywords: ["my pages", "custom page", "new page", "left menu", "tracker", "checklist", "table", "create a page"],
  },
  {
    id: "gs-menu-arrange",
    category: "Getting Started",
    question: "Can I rearrange the left menu?",
    answer:
      "Yes, two ways. Drag a whole SECTION (Daily Operations, Clients & Sales, Growth and so on) by the small grip that appears to the left of its heading when you hover, and drop it where you want it. Or drag a single page within its section by the grip on its right. You can also click a section heading to fold it, and with the keyboard, focus a section's grip and press the up or down arrow. Your order is saved to your account, so it is the same on every device and for your team, and you can change it any time by dragging again. 'Reset menu order' at the bottom of the menu puts it back to the standard order.",
    keywords: ["left menu", "navigation", "sections", "drag", "rearrange", "reorder", "move section", "sidebar", "order"],
  },
  {
    id: "ai-assistant-popout",
    category: "AI & Automation",
    question: "Can I keep my AI assistant open while I work on another page?",
    answer:
      "Yes. On the AI Assistant card on Executive Home, click Pop out. Your assistant floats over whatever page you open next, so you can work on a task and ask for help side by side, and it knows which page you are on. Drag it by its title bar, resize it from the corner, minimize it to a small button, or press Bring back to Executive Home (or the X) to put it back. It is the same conversation in both places, so nothing is lost.",
    keywords: ["pop out", "popout", "float", "floating", "assistant", "side by side", "keep open", "window", "minimize"],
  },
  {
    id: "ai-assistant-wrong-advice",
    category: "AI & Automation",
    question: "My assistant told me to do something I already finished. What do I do?",
    answer:
      "Your assistant reads your account fresh every time you ask, so it should know what you have completed. If an answer still looks out of date, click 'New conversation' on the AI Assistant card (your old one is saved, and your assessments and data are untouched) and ask again. If it is still wrong, send us what it said from Help → Contact Support, or with the light bulb, and we will fix it for everyone.",
    keywords: ["wrong", "outdated", "already did", "stale", "assistant", "clear memory", "new conversation", "past conversations", "incorrect", "mistake", "repeat"],
  },
  {
    id: "gs-contact-support",
    category: "Getting Started",
    question: "How do I contact support, and how fast will I hear back?",
    answer:
      "Click the lifebuoy icon in the top-right corner (or open Help → Contact Support). Fill in the form and we reply within 24 hours on business days (Monday to Friday, 9am to 5pm Mountain). You also get an email when we reply, and you can read and answer the conversation on the same page under My requests, where each request shows Open, In progress, Waiting or Resolved. You can email support@lccommandsuite.com too. VIP members have priority support with 4-hour response times, plus an urgent line: text or WhatsApp \"URGENT\" to (720) 987-2080 (VIP members only). Command Suite Office Hours is the live call for anything tech related.",
    keywords: ["support", "contact", "help", "email", "lifebuoy", "response time", "urgent", "vip", "ticket", "request", "hours", "whatsapp", "text"],
  },
  {
    id: "gs-whats-new",
    category: "Getting Started",
    question: "Where can I see what's new, what's been fixed, and answers other clients got?",
    answer:
      "Open Help → Contact Support (the lifebuoy icon) and scroll down. 'What's new' lists the updates and fixes we have made, newest first, so when you report something you can watch for the fix there. 'Recently answered' shows questions other clients asked and how we resolved them, with names removed, so your answer may already be there before you write in. Above them are the Suggestions and General Feedback boards, where you can vote for what you want built next.",
    keywords: ["what's new", "whats new", "updates", "fixes", "changelog", "release", "recently answered", "resolved", "support log", "new features"],
  },
  {
    id: "ba-assessment-flow",
    category: "Business Alignment",
    question: "What happens when I finish an assessment, and how do I know which is next?",
    answer:
      "When you finish Brain, Soul or Profit, the Suite points you straight to the next one you have not done. On the Assessments page each card shows Start, Continue or Completed, and the 'Complete the Full Assessment' card at the bottom reflects what is already done and what is outstanding. Once all three are complete, your Business Health Score, your three next moves, your Growth Roadmap and your Alignment Profile are all built from your own answers. The Assessments page also has your Quick Pulse check-in to track progress over time.",
    keywords: ["assessment", "next assessment", "complete", "finished", "brain", "soul", "profit", "full assessment", "progress", "completed"],
  },
  {
    id: "dr-compass-layout",
    category: "Daily Rhythm",
    question: "Can I rearrange or collapse cards on the Daily Compass?",
    answer:
      "Yes. Hover over any Daily Compass card and drag it by its grip to move it, including into empty space; the cards fill the gaps. Today's Focus spans the full width and starts collapsed so the page is calm: click it to open it, and it shows with a white background when collapsed so you do not overlook it. Quick Actions sits above it. Your layout is remembered in that browser.",
    keywords: ["daily compass", "drag", "rearrange", "collapse", "today's focus", "layout", "cards", "quick actions"],
  },
  {
    id: "dr-schedule-future",
    category: "Daily Rhythm",
    question: "Can I see my schedule for future days on Executive Home?",
    answer:
      "Yes. Today's Schedule shows today's events from the calendars you have connected. Use the arrows on that card to move forward to future days (and back again). The coaching calls card has This week and Next week tabs, so you can plan the following week's calls ahead of time.",
    keywords: ["schedule", "future", "next day", "arrows", "calendar", "tomorrow", "upcoming", "today's schedule", "next week"],
  },
  {
    id: "ai-content-calendar-nav",
    category: "Content & Social",
    question: "Where is the Content Calendar in the menu?",
    answer:
      "In the left menu under Daily Operations, there is a Content Calendar link, right below the Daily Compass. It opens the same calendar you reach from the Daily Compass, where you plan and schedule your posts.",
    keywords: ["content calendar", "menu", "navigation", "left menu", "daily operations", "social", "posts", "calendar"],
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
