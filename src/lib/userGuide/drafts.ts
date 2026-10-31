import type { GuideEntry } from "./types";

// The batch waiting for Babs on a review page, written there by /api/user-guide/seed-review. Removed at release.
export const GUIDE_DRAFTS: GuideEntry[] = [
 {
  "id": "business-alignment",
  "name": "Business Alignment",
  "area": "Alignment & Systems",
  "where": "Alignment & Systems > Business Alignment",
  "href": "/business-alignment",
  "what": "Your business health in one view: your overall score and phase, a radar and a score for each of the 12 dimensions, your score trend and your revenue snapshot, in cards you can arrange. Your briefing and Growth Roadmap sit at the top.",
  "ai": "Has an AI button",
  "aiNote": "Brief me uses your own AI key. Your assistant explains your score and phase, what is driving your weakest areas, and three moves you can add to your tasks. Your scores are not written by this button. Without a key, the page shows a link to your AI settings.",
  "steps": [
   "Open Business Alignment from the left menu.",
   "Look at your overall score and phase first.",
   "Find your lowest dimensions on the radar. Primary focus names your three lowest.",
   "Press Brief me to hear what is driving them.",
   "Press Add to my tasks on the moves you want.",
   "Hover over a card and drag its handle to put your cards in the order you like."
  ],
  "health": "This is where your health shows. Your overall score is the average of the dimensions that have a score, and it sets your phase: Survival 0-40, Growth 41-60, Expansion 61-80 or Legacy 81-100. It appears once at least three dimensions have a score. Looking at this page does not change your scores.",
  "tips": [
   "The goal is progress, not perfection, so watch your trend as well as today's number.",
   "Your card order is saved in the browser you are using, so another device keeps its own order.",
   "A small arrow under a dimension score shows how far it has moved since your baseline."
  ],
  "questions": [
   {
    "q": "Do I need 100 in all 12 dimensions?",
    "a": "No. The goal is alignment and steady progress."
   },
   {
    "q": "Why does the page say Domain when you say dimension?",
    "a": "They mean the same thing. The 12-Domain Business Alignment chart and Domain Scores card show your 12 dimensions."
   },
   {
    "q": "Can I see why one dimension has its score?",
    "a": "Yes. On Executive Home, press that dimension's card under 12 Business Dimensions."
   }
  ],
  "related": [
   "how-your-scores-work",
   "growth-roadmap",
   "next-three-moves",
   "operating-rhythm",
   "dimension-detail",
   "progress",
   "ai-business-guide",
   "brain-profile",
   "tasks"
  ],
  "who": "Everyone. Team members need the Assessments & Alignment area. Some cards draw on other areas, so Next 3 Moves and Operating Rhythm need the Tasks area and Revenue Snapshot needs Finance.",
  "keywords": [
   "score",
   "health",
   "dashboard",
   "radar",
   "dimensions",
   "domains",
   "domain scores",
   "phase",
   "survival",
   "growth",
   "expansion",
   "legacy",
   "trend",
   "overall business health",
   "rearrange cards"
  ],
  "sections": [
   {
    "id": "health-cards",
    "title": "Health cards",
    "body": "Overall Business Health shows your score out of 100, your phase and your Primary focus. The radar and Domain Scores show all 12 dimensions. Business Health Trend draws a line once you have two dated points. Revenue Snapshot shows this month's revenue and net, average deal size, win rate and your last six months of income and expenses.",
    "keywords": [
     "overall business health",
     "primary focus",
     "radar chart",
     "domain scores",
     "business health trend",
     "revenue snapshot",
     "win rate",
     "average deal size"
    ]
   },
   {
    "id": "briefing",
    "title": "Alignment briefing",
    "body": "Brief me at the top of the page explains your score and phase, what is driving your weakest areas, and gives you three moves. Add to my tasks puts a move in Today. Your briefing is saved to your account, and Refresh writes a new one.",
    "keywords": [
     "brief me",
     "explain my score",
     "weakest",
     "three moves",
     "what's driving it",
     "refresh"
    ]
   }
  ],
  "starter": true
 },
 {
  "id": "growth-roadmap",
  "name": "Growth Roadmap",
  "area": "Alignment & Systems",
  "where": "Alignment & Systems > Business Alignment, under your briefing",
  "href": "/business-alignment",
  "what": "Your 90-day plan, written from your own scores, assessment answers, plans, income, pipeline and tasks. It names three areas to focus on first, then gives you steps for Days 1-30, Days 31-60 and Days 61-90.",
  "ai": "AI-powered",
  "aiNote": "Your assistant writes the whole roadmap when you press Build my roadmap, using your own AI key. Without a key, the page shows a link to your AI settings. It is saved to your account under your assistant's name. Nothing goes on your task list until you press Add to my tasks.",
  "steps": [
   "Open Business Alignment from the left menu.",
   "Find your growth roadmap under the briefing and press Build my roadmap.",
   "Read Where to focus first.",
   "Look through the steps for Days 1-30, Days 31-60 and Days 61-90.",
   "Press a step's name to open the right screen for it.",
   "Press Add to my tasks on each step you want to do."
  ],
  "health": "This does not change your scores. It reads them and turns your weakest areas into a plan. Finishing the tasks you add counts toward task follow-through, like any other task.",
  "tips": [
   "Press Refresh when your scores change. It writes a new roadmap in place of the old one.",
   "Each phase has two or three steps, so the plan stays doable."
  ],
  "questions": [
   {
    "q": "Where do steps go when I add them?",
    "a": "Into your Backlog list on Tasks, at medium priority with no due date. Give them a date when you are ready."
   },
   {
    "q": "Will Refresh keep my tasks?",
    "a": "Yes. Tasks you already added stay on your list. Only the roadmap text changes."
   }
  ],
  "related": [
   "business-alignment",
   "next-three-moves",
   "how-your-scores-work",
   "tasks"
  ],
  "who": "Everyone. Team members need the Assessments & Alignment area, with Edit to build one. Adding a step also needs the Tasks area.",
  "keywords": [
   "roadmap",
   "90 day plan",
   "90-day",
   "build my roadmap",
   "next steps",
   "where to focus first",
   "days 1-30",
   "growth plan",
   "assessment results"
  ]
 },
 {
  "id": "next-three-moves",
  "name": "Next Three Moves",
  "area": "Alignment & Systems",
  "where": "Alignment & Systems > Business Alignment > Next 3 Moves card",
  "href": "/business-alignment",
  "what": "Three things to do next, shown as a card. If you asked for a briefing in the last 30 days, these are its three moves. If not, they come from your three weakest dimensions, your tasks and your year goals.",
  "ai": "No AI",
  "aiNote": "This card does not run AI itself. When your moves come from a briefing, your assistant wrote them when you pressed Brief me, which uses your own AI key. Otherwise the moves are worked out from your own data.",
  "steps": [
   "Open Business Alignment from the left menu and find the Next 3 Moves card.",
   "Read the line at the bottom of the card to see where your moves came from.",
   "Press a move's name to open the page for it.",
   "Press Add to tasks on the moves you want to take on."
  ],
  "health": "This does not change your scores. It points you to your weakest areas so you know where to start. Finishing the tasks you add counts toward task follow-through.",
  "tips": [
   "Press Brief me at the top of the page for sharper moves.",
   "High impact means the score is under 50, or that area has overdue tasks or a slipped goal."
  ],
  "questions": [
   {
    "q": "Where do moves go when I add them?",
    "a": "Into your Today list on Tasks, at high priority."
   },
   {
    "q": "Why does the card say to start an assessment?",
    "a": "Your moves need scores in at least three dimensions, or a recent briefing. Until then the card asks you to start with your assessments."
   }
  ],
  "related": [
   "business-alignment",
   "growth-roadmap",
   "goal-ladder",
   "tasks"
  ],
  "who": "Everyone. Team members need the Assessments & Alignment area for the page and the Tasks area for this card.",
  "keywords": [
   "next 3 moves",
   "next moves",
   "what should I do next",
   "priorities",
   "weakest areas",
   "add to tasks",
   "high impact"
  ]
 },
 {
  "id": "operating-rhythm",
  "name": "Operating Rhythm",
  "area": "Alignment & Systems",
  "where": "Alignment & Systems > Business Alignment > Operating Rhythm card",
  "href": "/business-alignment",
  "what": "The routines that keep your business running: daily habits, a weekly review and a monthly check-in. You set them once, and you check them off on the days they are due.",
  "ai": "Has an AI button",
  "aiNote": "The Suggest a rhythm button carries your assistant's name and uses your own AI key. Your assistant suggests routines that fit your business and skips ones you already have. Nothing is saved until you untick what you do not want and press the Add to my rhythm button.",
  "steps": [
   "Open Business Alignment from the left menu and find the Operating Rhythm card.",
   "Press Add a routine and type what you want to do.",
   "Choose Every day, Every week or Every month, then the day if it asks for one, and press Add.",
   "Or press Suggest a rhythm, untick what you do not want, and add the rest.",
   "Check off each routine on the days it is due."
  ],
  "health": "Having routines set counts toward your Internal Process & Culture pillar, and three routines fills that part. It looks at how many routines you have set up, not how many you tick off.",
  "tips": [
   "Start with three to five. A rhythm you keep beats a long list you do not.",
   "Press What is an Operating Rhythm, and how do I use it? on the card for ideas.",
   "Your routines also count toward your streak in the Weekly View."
  ],
  "questions": [
   {
    "q": "Is this different from recurring tasks?",
    "a": "No. Your routines are your recurring tasks, so one added here shows there too. A routine due today also shows on your Tasks page with a Recurring label."
   },
   {
    "q": "How do I remove a routine?",
    "a": "Hover over it, press the trash can and confirm. To edit one, use Recurring Tasks on Executive Home."
   }
  ],
  "related": [
   "business-alignment",
   "weekly-review",
   "tasks",
   "operations"
  ],
  "who": "Everyone. Team members need the Tasks area to see and change routines, and the Operations & SOPs area for the suggest button.",
  "keywords": [
   "routines",
   "habits",
   "recurring",
   "daily weekly monthly",
   "suggest a rhythm",
   "add a routine",
   "schedule",
   "monthly check-in"
  ]
 },
 {
  "id": "how-your-scores-work",
  "name": "How your scores work",
  "area": "Alignment & Systems",
  "where": "Behind every score in your Command Suite",
  "href": "/business-alignment",
  "what": "Every score is worked out from what you answered and what you do in the Suite. You cannot type a score in. Your overall score, each of the 12 dimensions, each of the 8 pillars and your Quick Pulse result all use the same 0 to 100 scale.",
  "ai": "AI-powered",
  "aiNote": "The blending is plain math, and AI only does one job. It reads your written Brain and Soul answers and gives that part a 0 to 100 reading, using your own AI key, when you finish Brain or Soul. Soul questions marked sensitive are left out. Without a key, those parts show as AI scoring pending. Profit, Quick Pulse, live data and plan completeness use no AI.",
  "steps": [
   "Finish your Brain, Soul and Profit assessments.",
   "Open Business Alignment to see your overall score and phase.",
   "On Executive Home, press a dimension card to see what makes up that score.",
   "Press any input on that page to go where you can improve it.",
   "Take your Quick Pulse Check-in each month to keep your scores and trend current."
  ],
  "health": "This is how your health is measured. Each dimension blends its own inputs at set weights. Your overall score averages the dimensions that have a score. The 8 pillars are scored the same way, plus your Go deeper answers, and their average feeds your Operations dimension. Your business plans feed Marketing, Sales and Vision.",
  "tips": [
   "One scale everywhere: Survival 0-40, Growth 41-60, Expansion 61-80, Legacy 81-100. A dimension at 72 is in Expansion, just like an overall score of 72.",
   "A suggested schedule keeps scores current: Quick Pulse monthly, Profit quarterly, Brain twice a year and Soul once a year.",
   "An input with no data yet is not counted as zero. Its weight spreads across the inputs that have data."
  ],
  "questions": [
   {
    "q": "Does AI decide my score?",
    "a": "No. AI only reads your written Brain and Soul answers. Fixed weights blend that reading with your other inputs, and the math does the rest."
   },
   {
    "q": "What does partial mean?",
    "a": "Some inputs for that dimension are still pending. The score uses what is there, and it firms up as the rest comes in."
   },
   {
    "q": "Does an old answer lower my score?",
    "a": "No. After 90 days an assessment input is marked getting stale, and after 14 days a Quick Pulse is too. It still counts. The mark is a nudge to refresh it."
   }
  ],
  "related": [
   "business-alignment",
   "dimension-detail",
   "progress",
   "brain-profile",
   "soul-profile",
   "profit-profile",
   "quick-pulse-check-in",
   "operations",
   "tasks"
  ],
  "who": "Everyone. This works the same way on every account.",
  "keywords": [
   "how is my score calculated",
   "scoring",
   "formula",
   "weights",
   "survival growth expansion legacy",
   "phases",
   "partial",
   "stale",
   "ai scoring pending",
   "12 dimensions",
   "8 pillars",
   "task follow-through",
   "why did my score change"
  ],
  "sections": [
   {
    "id": "alignment-scoring",
    "title": "Alignment scoring",
    "body": "A dimension can draw on your Profit, Brain and Soul assessments, your latest Quick Pulse, live data from the Suite and how complete your plans are. Each dimension uses its own mix. Your overall score appears once at least three dimensions have a score.",
    "keywords": [
     "inputs",
     "weights",
     "profit",
     "brain",
     "soul",
     "quick pulse",
     "live data",
     "plan completeness"
    ]
   },
   {
    "id": "task-follow-through",
    "title": "Task follow-through",
    "body": "Finished tasks lift your Internal Process & Culture pillar, and that pillar feeds your Operations dimension. It looks at work finished in the last 60 days, open tasks past their due date and tasks due in the next 14 days. It needs at least three of those to count, and tasks with no date never count against you.",
    "keywords": [
     "tasks",
     "follow through",
     "overdue",
     "due dates",
     "internal process and culture",
     "operations score",
     "60 days"
    ]
   }
  ]
 },
 {
  "id": "dimension-detail",
  "name": "Dimension detail",
  "area": "Alignment & Systems",
  "where": "Executive Home > 12 Business Dimensions > press any dimension card",
  "href": "/dimensions/marketing",
  "what": "One page for one of your 12 dimensions. It shows the score and phase, every input behind it with its share of the score, which inputs are fresh, and how to lift it with lessons and quarterly milestones.",
  "ai": "Has an AI button",
  "aiNote": "Show me how writes a personal lesson from your own answers and numbers. Propose my milestones suggests 3 to 5 milestones for this quarter. Both use your own AI key. Milestones are not added until you choose them and press the Add button. The score on this page is not written by these buttons.",
  "steps": [
   "Open Executive Home and find 12 Business Dimensions.",
   "Press a dimension card.",
   "Read each input and how much of the score it carries.",
   "Press an input to go where you can improve it.",
   "Scroll down to the lessons and press Show me how for one written for your business.",
   "Press Start the assessment to set milestones for this quarter."
  ],
  "health": "This shows how one dimension's score is built. Improve any input and the score follows. Reading lessons and setting milestones do not change the score themselves.",
  "tips": [
   "A check mark means an input is current, a clock means it is getting stale, and an empty circle means it has no data yet.",
   "A score under 60 shows Learn how to lift this on Executive Home and takes you straight to the lessons."
  ],
  "questions": [
   {
    "q": "Why does an input show a dash?",
    "a": "It has no data yet. Its weight spreads across the other inputs until it does. The line tells you why, such as not answered yet."
   },
   {
    "q": "Where do my milestones go?",
    "a": "They become quarter goals on your Goal Ladder. You can also tick a box to put each first step on your Tasks."
   }
  ],
  "related": [
   "how-your-scores-work",
   "business-alignment",
   "goal-ladder",
   "tasks"
  ],
  "who": "Everyone. Team members need the Assessments & Alignment area. Milestones also need the Planning & Goals area.",
  "keywords": [
   "why this score",
   "why is my score low",
   "learn how to lift this",
   "inputs",
   "weights",
   "lessons",
   "how to run",
   "show me how",
   "milestones",
   "marketing score",
   "finance score"
  ],
  "sections": [
   {
    "id": "dimension-lessons",
    "title": "How to run this area well",
    "body": "Short lessons for this part of your business appear here when there are some for it, and they can include a video or a handout. Show me how writes a personal lesson with a first action for this week. Write a fresh one replaces it.",
    "keywords": [
     "lessons",
     "personal lesson",
     "show me how",
     "write a fresh one",
     "video",
     "handout"
    ]
   },
   {
    "id": "dimension-milestones",
    "title": "Milestones for this quarter",
    "body": "Answer four short questions and press Propose my milestones. Edit what comes back, choose the quarter and the year goal it supports, then add them. Milestones are saved under your plan, so build your Business Plan first. Retake the assessment any time.",
    "keywords": [
     "milestone assessment",
     "propose my milestones",
     "quarter goals",
     "retake the assessment"
    ]
   }
  ]
 },
 {
  "id": "goal-ladder",
  "name": "Goal Ladder",
  "area": "Alignment & Systems",
  "where": "Alignment & Systems > Goal Ladder",
  "href": "/planning/goals",
  "what": "Your year goals from your Business, Marketing and Sales Plans, broken down into quarter, month and week goals. Each goal has a status, and a count shows how many steps under it are met.",
  "ai": "Has an AI button",
  "aiNote": "On any goal, the sparkle button suggests three smaller goals. Propose my milestones suggests milestones for one of your 12 dimensions. Both use your own AI key. Suggestions are not saved until you press Add.",
  "steps": [
   "Open Goal Ladder from the left menu.",
   "Find a year goal under its plan.",
   "Press Quarter goal, type the goal, add a target if you want one, choose when it is for and press Add.",
   "Do the same on that goal to add month goals, then week goals.",
   "Change the status beside each goal as the work moves: Not started, In progress, Met or Slipped."
  ],
  "health": "Goals do not change your 12 dimension scores or your 8 pillars. Your year goals show on Progress, and a year goal marked Slipped can shape your Next 3 Moves.",
  "tips": [
   "Tick Show only what's current to see this quarter, this month and this week.",
   "Weeks start on Monday, and a week goal is the smallest step.",
   "The sparkle button is the quickest way to break a big goal down."
  ],
  "questions": [
   {
    "q": "Why is my ladder empty?",
    "a": "Your year goals come from your plans. Build your Business, Marketing or Sales Plan and its goals appear here."
   },
   {
    "q": "Can I remove a goal?",
    "a": "You can remove quarter, month and week goals with the trash can, and anything under them goes too. Year goals belong to your plan, so they stay."
   }
  ],
  "related": [
   "business-plan",
   "marketing-plan",
   "sales-plan",
   "planning-hub",
   "progress",
   "next-three-moves"
  ],
  "who": "Everyone. Team members need the Planning & Goals area.",
  "keywords": [
   "goals",
   "yearly goals",
   "quarterly goals",
   "monthly goals",
   "weekly goals",
   "break down a goal",
   "cascade",
   "okr",
   "milestones",
   "goal status",
   "slipped"
  ],
  "sections": [
   {
    "id": "milestone-assessment",
    "title": "Milestone assessment",
    "body": "Choose one of your 12 dimensions at the top of the page. Answer four short questions and your assistant proposes 3 to 5 milestones for this quarter. Edit them, choose the year goal they support, and add them as quarter goals. A milestone can stand on its own without a year goal.",
    "keywords": [
     "milestone assessment",
     "propose my milestones",
     "quarter milestones",
     "not tied to a year goal"
    ]
   }
  ]
 },
 {
  "id": "weekly-review",
  "name": "Weekly Review",
  "area": "Alignment & Systems",
  "where": "Alignment & Systems > Weekly Review",
  "href": "/planning/review",
  "what": "A guided review of about 10 minutes, weekly or monthly. You see your numbers, your assistant briefs you, you answer three questions, and you leave with three tasks for next week or next month.",
  "ai": "AI-powered",
  "aiNote": "Your assistant writes the briefing when you start and proposes your three tasks from your answers, using your own AI key. Without a key, you still get your numbers and questions, and you type your own tasks. Nothing goes on your task list until you press Finish my review.",
  "steps": [
   "Open Weekly Review from the left menu and choose Weekly or Monthly.",
   "Press the start button to see your numbers and your briefing.",
   "Answer the three questions, then press Next: my three tasks.",
   "Edit the tasks and due dates, and untick any you do not want.",
   "Press Finish my review."
  ],
  "health": "Finished reviews count toward your Internal Process & Culture pillar. It looks at reviews finished in the last 90 days, and three fills that part. The tasks you take on count toward task follow-through.",
  "tips": [
   "A weekly review covers Monday to Sunday. On a Monday it looks back at last week.",
   "In the first 7 days of a month, a monthly review looks back at last month.",
   "Your past reviews stay at the bottom of the page."
  ],
  "questions": [
   {
    "q": "Where do my three tasks go?",
    "a": "Into your Backlog list on Tasks at high priority, with the due dates you chose."
   },
   {
    "q": "What numbers does it show?",
    "a": "Income against your goal, tasks finished and overdue, new and closed deals in your pipeline, and bills due next period."
   },
   {
    "q": "Can I run a scheduled planning session this way?",
    "a": "Yes. Press Start session on the Planning Hub. When you finish the review, the session is marked complete with the review as its notes."
   }
  ],
  "related": [
   "planning-hub",
   "operating-rhythm",
   "tasks",
   "progress"
  ],
  "who": "Everyone. Team members need the Planning & Goals area.",
  "keywords": [
   "review",
   "weekly review",
   "monthly review",
   "reflection",
   "what moved forward",
   "three tasks",
   "past reviews",
   "finish my review"
  ]
 },
 {
  "id": "progress",
  "name": "Progress",
  "area": "Alignment & Systems",
  "where": "Alignment & Systems > Progress",
  "href": "/progress",
  "what": "How far you have come since your baseline. It shows your overall score and each dimension then and now, a trend line, and how your plan goals are tracking.",
  "ai": "Has an AI button",
  "aiNote": "Read my progress uses your own AI key. Your assistant says what has moved since your baseline and why, what has stalled, and what to do to keep it going. Your read is saved to your account.",
  "steps": [
   "Open Progress from the left menu.",
   "Press Read my progress for your assistant's read.",
   "Check your overall score against your baseline.",
   "Use the menu on the trend chart to switch between Overall and one dimension.",
   "Look at By dimension to see what moved up or down.",
   "Look at Plan execution to see how your goals are tracking."
  ],
  "health": "This does not change your scores. It shows how they have moved since your baseline. Plan execution shows your year goals as met, in progress, not started or slipped.",
  "tips": [
   "Your trend line grows when you complete a Quick Pulse Check-in, so a monthly check-in keeps it moving.",
   "Your baseline stays fixed, so you always measure against where you started."
  ],
  "questions": [
   {
    "q": "Why does a dimension say new?",
    "a": "It had no score when your baseline was set, so there is nothing to compare it with yet."
   },
   {
    "q": "Do my quarter and week goals count in Plan execution?",
    "a": "No. Plan execution counts your year goals. The Goal Ladder shows the steps under them."
   }
  ],
  "related": [
   "business-alignment",
   "how-your-scores-work",
   "quick-pulse-check-in",
   "goal-ladder",
   "year-in-review"
  ],
  "who": "Everyone. Team members need the Assessments & Alignment area.",
  "keywords": [
   "progress",
   "trajectory",
   "baseline",
   "movement",
   "trend line",
   "read my progress",
   "plan execution",
   "score history",
   "health by business",
   "by dimension"
  ],
  "sections": [
   {
    "id": "health-by-business",
    "title": "Health by business",
    "body": "With more than one business, Progress shows each business's own score. It starts from your assessment scores and moves with that business's tasks and its compliance checklist. Choose a business at the top of the page to see its dimensions.",
    "keywords": [
     "health by business",
     "more than one business",
     "business switcher",
     "compliance checklist"
    ]
   }
  ]
 },
 {
  "id": "planning-hub",
  "name": "Planning Hub",
  "area": "Alignment & Systems",
  "where": "Alignment & Systems > Planning Hub",
  "href": "/planning",
  "what": "All your planning in one place. Cards show where your Business, Marketing and Sales Plans, Financial Forecasting, reviews and Finance stand. You can also schedule planning sessions, write a proposal and export your plans.",
  "ai": "Has an AI button",
  "aiNote": "Brief me says where your plans stand, what is going well, what needs attention and your next three moves. Create Proposal drafts a proposal from your plans and numbers. Both use your own AI key. You choose whether to use or send anything a proposal says.",
  "steps": [
   "Open Planning Hub from the left menu.",
   "Press Brief me for your planning briefing.",
   "Press a card to open that plan or area.",
   "Press New Planning Session, fill it in and press Schedule.",
   "When the day comes, press Start session to run it as a guided review, or Done to close it."
  ],
  "health": "The Hub itself does not change your scores. Completing your plans does: your Business Plan feeds Vision, your Marketing Plan feeds Marketing and your Sales Plan feeds Sales. A session run with Start session counts as a finished review. One closed with Done does not.",
  "tips": [
   "Add a date to a session and it goes on your connected calendar, marked On calendar.",
   "Planning Session History shows the sessions you have finished."
  ],
  "questions": [
   {
    "q": "What does Export All Plans give me?",
    "a": "One Markdown file with your plans and goals, your finance snapshot for the year, your forecast and your review schedule."
   },
   {
    "q": "What kinds of proposal can it write?",
    "a": "A grant application, investor or funding request, partnership proposal, business loan narrative or sponsorship proposal. The more of your plans you have written, the richer it is."
   }
  ],
  "related": [
   "business-plan",
   "marketing-plan",
   "sales-plan",
   "forecasting",
   "weekly-review",
   "goal-ladder",
   "print-or-share-a-plan"
  ],
  "who": "Everyone. Team members need the Planning & Goals area.",
  "keywords": [
   "planning",
   "plans overview",
   "planning session",
   "schedule a session",
   "export all plans",
   "create proposal",
   "grant",
   "investor",
   "loan",
   "sponsorship",
   "brief me",
   "download plans"
  ],
  "sections": [
   {
    "id": "planning-sessions",
    "title": "Planning sessions",
    "body": "New Planning Session sets a title, area, date, time and notes. Upcoming Planning Sessions lists what is ahead, each with Start session and Done. Planning Session History keeps the ones you finished.",
    "keywords": [
     "new planning session",
     "schedule",
     "calendar",
     "upcoming planning sessions",
     "planning session history",
     "start session"
    ]
   },
   {
    "id": "create-proposal",
    "title": "Create Proposal",
    "body": "Press Create Proposal, pick a type, add a funder or recipient if you have one, and press Generate proposal. Download .md saves a copy, and your recent proposals stay listed in the same window.",
    "keywords": [
     "proposal",
     "generate proposal",
     "grant application",
     "funding request",
     "download"
    ]
   }
  ]
 },
 {
  "id": "business-plan",
  "name": "Business Plan",
  "area": "Alignment & Systems",
  "where": "Alignment & Systems > Business Plan",
  "href": "/business-plan",
  "what": "Your business written down in nine sections: vision, offers, market, revenue model, 12-month goals, positioning, operations, team and risks. Five are Foundational and four are Optional. Tabs let you build it, track goals, run check-ins and print it.",
  "ai": "AI-powered",
  "aiNote": "Draft with AI writes a section from your assessments, your answers and your other sections. Generate Business Plan writes your goals, and Generate review writes a check-in. All three use your own AI key. Draft with AI saves straight into the section, so read it and edit it. Your assistant can also write or change a section from the chat, and that waits behind Approve.",
  "steps": [
   "Open Business Plan from the left menu. You start on the Build tab.",
   "Open a section and answer its questions.",
   "Press Draft with AI, or type the section yourself in Section content.",
   "Read it, change anything you like, then press Mark section complete.",
   "Fill the five Foundational sections first, then go deeper wherever you like.",
   "On the Goals tab, press Generate Business Plan, then set each goal's status as you go."
  ],
  "health": "This plan feeds your Vision dimension. What counts is how many of the five Foundational sections have text in them, so Optional sections do not change it, and neither does marking a section complete. Goal statuses do not change your 12 dimensions. A goal you assign to a business segment counts toward that segment's own score.",
  "tips": [
   "Press Save or click away and your text is saved.",
   "Changing the text of a finished section takes off its Complete mark, so mark it again when you are happy.",
   "Your Business Plan feeds every other plan, because your assistant reads it when it drafts them."
  ],
  "questions": [
   {
    "q": "What is the difference between Foundational and Optional?",
    "a": "Foundational sections are the practical minimum for a useful plan. Optional sections add depth. Nothing stops you moving around, but printing needs every section, Optional ones too."
   },
   {
    "q": "What does Redraft with AI do to my text?",
    "a": "It replaces what is in the section with a new draft and saves it. If you want to keep your wording, copy it somewhere first."
   },
   {
    "q": "What happens when I press Regenerate on the Goals tab?",
    "a": "It builds a new version of the plan's goals, and every goal starts again at Not started."
   }
  ],
  "related": [
   "planning-hub",
   "marketing-plan",
   "sales-plan",
   "forecasting",
   "print-or-share-a-plan"
  ],
  "who": "Everyone. Team members need the Planning & Goals area.",
  "keywords": [
   "business plan",
   "vision",
   "mission",
   "values",
   "offers",
   "target market",
   "revenue model",
   "pricing",
   "12 month goals",
   "milestones",
   "positioning",
   "risks",
   "draft with ai",
   "mark section complete"
  ],
  "sections": [
   {
    "id": "business-plan-build",
    "title": "Build tab",
    "body": "Your sections, each marked Foundational or Optional. Two meters at the top show your Foundational baseline and your Overall depth. The Foundational sections are Vision, Mission & Values, What You Offer, Target Market & Ideal Client, Revenue Model & Pricing, and 12-Month Goals & Milestones.",
    "keywords": [
     "build",
     "sections",
     "foundational baseline",
     "overall depth",
     "meters"
    ]
   },
   {
    "id": "business-plan-goals",
    "title": "Goals tab",
    "body": "Press Generate Business Plan and your assistant writes goals from your Brain and Soul answers and your scores. Each goal shows its dimension and target, and you set its status: Not started, In progress, Met or Slipped.",
    "keywords": [
     "goals",
     "generate business plan",
     "regenerate",
     "goal status",
     "slipped"
    ]
   },
   {
    "id": "business-plan-check-ins",
    "title": "Check-ins tab",
    "body": "Choose Monthly, Quarterly, Semi-annual or Annual review and press Generate review. You get what to celebrate, what needs attention with what to do about it, and your highest-leverage next move. Earlier ones stay under Past check-ins.",
    "keywords": [
     "check-in",
     "review",
     "generate review",
     "past check-ins",
     "quarterly review"
    ]
   }
  ]
 },
 {
  "id": "marketing-plan",
  "name": "Marketing Plan",
  "area": "Alignment & Systems",
  "where": "Alignment & Systems > Marketing Plan",
  "href": "/marketing-plan",
  "what": "How the right people find, trust and choose you, in seven sections: ideal client, positioning, core offer, channels, content strategy, brand voice and metrics. Four are Foundational and three are Optional.",
  "ai": "AI-powered",
  "aiNote": "Draft with AI writes a section from your assessments, your answers and your other sections. Generate Marketing Plan writes your goals, and Generate review writes a check-in. All three use your own AI key. Draft with AI saves straight into the section, so read it and edit it. Your assistant can also write or change a section from the chat, and that waits behind Approve.",
  "steps": [
   "Open Marketing Plan from the left menu. You start on the Build tab.",
   "Open a section and answer its questions. Answers save when you click away.",
   "Press Draft with AI, or type the section yourself in Section content.",
   "Read it, change anything you like, then press Mark section complete.",
   "On the Goals tab, press Generate Marketing Plan, then set each goal's status as you go.",
   "On the Check-ins tab, choose how often and press Generate review."
  ],
  "health": "This plan feeds your Marketing dimension and your Customer Acquisition pillar. What counts is how many of the four Foundational sections have text in them, so Optional sections do not change it. Goal statuses do not change your 12 dimensions.",
  "tips": [
   "Your assistant reads the sections you have already written, so each draft fits the last.",
   "Changing the text of a finished section takes off its Complete mark, so mark it again when you are happy.",
   "Your Customer Acquisition pillar on Operations links back to Channels & Cadence here."
  ],
  "questions": [
   {
    "q": "What does Redraft with AI do to my text?",
    "a": "It replaces what is in the section with a new draft and saves it. If you want to keep your wording, copy it somewhere first."
   },
   {
    "q": "Which sections count as Foundational?",
    "a": "Ideal Client Profile, Positioning & Core Message, Core Offer & Promise, and Channels & Cadence."
   }
  ],
  "related": [
   "business-plan",
   "sales-plan",
   "planning-hub",
   "print-or-share-a-plan",
   "operations"
  ],
  "who": "Everyone. Team members need the Planning & Goals area.",
  "keywords": [
   "marketing plan",
   "ideal client",
   "icp",
   "positioning",
   "core message",
   "channels",
   "content strategy",
   "brand voice",
   "story",
   "marketing metrics",
   "core offer"
  ],
  "sections": [
   {
    "id": "marketing-plan-sections",
    "title": "The seven sections",
    "body": "Foundational: Ideal Client Profile, Positioning & Core Message, Core Offer & Promise, and Channels & Cadence. Optional: Content Strategy, Brand Voice & Story, and Marketing Metrics & Targets.",
    "keywords": [
     "ideal client profile",
     "positioning",
     "channels and cadence",
     "content strategy",
     "brand voice",
     "marketing metrics"
    ]
   }
  ]
 },
 {
  "id": "sales-plan",
  "name": "Sales Plan",
  "area": "Alignment & Systems",
  "where": "Alignment & Systems > Sales Plan",
  "href": "/sales",
  "what": "How you turn interest into committed clients, in seven sections: offers and pricing, who you sell to, your sales process, revenue targets, conversion, follow-up and referrals. Four are Foundational and three are Optional. It also suggests weekly activity targets.",
  "ai": "AI-powered",
  "aiNote": "Draft with AI writes a section from your assessments, your answers and your other sections. Suggest my targets works out weekly activity targets, Generate Sales Plan writes your goals, and Generate review writes a check-in. All of these use your own AI key. Draft with AI saves straight into the section. Suggested targets are not saved until you press Use as my weekly goals. Your assistant can also write or change a section from the chat, and that waits behind Approve.",
  "steps": [
   "Open Sales Plan from the left menu. You start on the Build tab.",
   "Open a section and answer its questions.",
   "Press Draft with AI, or type the section yourself in Section content.",
   "Read it, change anything you like, then press Mark section complete.",
   "At the top, press Suggest my targets, then Use as my weekly goals if they look right.",
   "On the Goals tab, press Generate Sales Plan, then set each goal's status as you go."
  ],
  "health": "This plan feeds your Sales dimension and your Sales Journey pillar. What counts is how many of the four Foundational sections have text in them, so Optional sections do not change it. Your weekly targets and goal statuses do not change your 12 dimensions.",
  "tips": [
   "The Sales row at the top takes you to Pipeline, Sales Activities, Scripts & Templates and Offers & Packages.",
   "Changing the text of a finished section takes off its Complete mark, so mark it again when you are happy.",
   "Your Sales Journey and Referral Process pillars on Operations link back here."
  ],
  "questions": [
   {
    "q": "Where do my weekly targets go?",
    "a": "They become your weekly goals in Sales Activities and show in your Weekly View and Today's Activity."
   },
   {
    "q": "What are the targets based on?",
    "a": "Your assistant works backwards from your Sales Plan, your income goals and your pipeline. You see the reason, along with your current number for each activity."
   }
  ],
  "related": [
   "business-plan",
   "marketing-plan",
   "forecasting",
   "print-or-share-a-plan",
   "planning-hub"
  ],
  "who": "Everyone. Team members need the Pipeline, Offers & Sales Plan area.",
  "keywords": [
   "sales plan",
   "sales targets",
   "quotas",
   "weekly goals",
   "pricing ladder",
   "follow-up cadence",
   "objections",
   "referral strategy",
   "sales process",
   "suggest my targets"
  ],
  "sections": [
   {
    "id": "sales-plan-sections",
    "title": "The seven sections",
    "body": "Foundational: Offers & Pricing Ladder, Who You Sell To, Pipeline & Sales Process, and Revenue Targets & Quotas. Optional: Conversion & Objections, Follow-up Cadence, and Referral Strategy. Two meters show your Foundational baseline and your Overall depth.",
    "keywords": [
     "section depth",
     "meters",
     "offers and pricing ladder",
     "conversion",
     "referral strategy"
    ]
   },
   {
    "id": "weekly-sales-targets",
    "title": "Weekly sales targets",
    "body": "Press Suggest my targets for weekly numbers of calls, follow-ups, emails, DMs, meetings, demos and proposals. Press Use as my weekly goals to save them.",
    "keywords": [
     "weekly sales targets",
     "activity targets",
     "use as my weekly goals",
     "calls",
     "follow-ups"
    ]
   }
  ]
 },
 {
  "id": "forecasting",
  "name": "Forecasting",
  "area": "Alignment & Systems",
  "where": "Alignment & Systems > Forecasting",
  "href": "/planning/forecast",
  "what": "Revenue, expenses and net projected 1 to 24 months ahead in three scenarios: Conservative, Expected and Optimistic. They come from your recent income and open pipeline. Below the numbers is the Forecast Plan, where you write the reasoning behind them.",
  "ai": "Has an AI button",
  "aiNote": "Read my forecast has your assistant explain what the numbers mean and suggest an income goal. Draft with AI writes a Forecast Plan section, and Generate review writes a check-in. All three use your own AI key. The numbers are calculated and do not need AI. A suggested goal is not saved until you press Use as my income goals. Draft with AI saves straight into the section.",
  "steps": [
   "Open Forecasting from the left menu.",
   "Under Assumptions, set your Horizon (months), Growth %/mo, Pipeline close % and Expense %.",
   "Press Recalculate.",
   "Press a scenario to see it month by month.",
   "Press Read my forecast, then Use as my income goals if the suggestion looks right.",
   "Scroll to Forecast Plan and fill in its sections the same way as your other plans."
  ],
  "health": "Your forecast and Forecast Plan do not change your scores. They help you plan ahead and test your numbers. If you press Use as my income goals, the monthly goal becomes the target your Finance dimension measures income against.",
  "tips": [
   "Leave Expense % at 0 and it is worked out from your own income and expenses.",
   "Add your deals to the Pipeline and the forecast uses each deal's own value and probability.",
   "Conservative and Optimistic sit a little below and above your Expected case."
  ],
  "questions": [
   {
    "q": "Why does it say Showing your revenue plan?",
    "a": "No income is recorded yet, so it shows your own income goals as a plan, revenue only. Expected is the plan as written, Conservative is 80% of it and Optimistic is 120%. Once you record income, it switches to projections."
   },
   {
    "q": "Where do the numbers come from?",
    "a": "Your starting point is your average monthly income, using your three most recent months. Growth is applied each month, your expected pipeline closings are added, and your expense ratio is taken off."
   },
   {
    "q": "Why can't I change Pipeline close %?",
    "a": "When your Pipeline has open deals, the rate comes from each deal's own probability, so there is nothing to type."
   }
  ],
  "related": [
   "budget-planner",
   "sales-plan",
   "planning-hub",
   "print-or-share-a-plan",
   "business-plan"
  ],
  "who": "Everyone. Team members need the Planning & Goals area.",
  "keywords": [
   "forecast",
   "forecasting",
   "projections",
   "scenarios",
   "conservative",
   "expected",
   "optimistic",
   "revenue plan",
   "assumptions",
   "income goals",
   "recalculate",
   "forecast plan",
   "growth rate"
  ],
  "sections": [
   {
    "id": "forecast-assumptions",
    "title": "Assumptions",
    "body": "Four numbers drive the forecast: Horizon (months), Growth %/mo, Pipeline close % and Expense % (0=auto). Change them and press Recalculate. Your choices are kept for next time.",
    "keywords": [
     "assumptions",
     "horizon",
     "growth",
     "pipeline close",
     "expense ratio",
     "recalculate"
    ]
   },
   {
    "id": "forecast-plan",
    "title": "Forecast Plan",
    "body": "The written reasoning behind your numbers. Revenue Streams & Drivers, Key Growth Assumptions and Financial Targets are Foundational. Risks & Levers is Optional. Print / Share and your check-ins sit below it on the same page.",
    "keywords": [
     "forecast plan",
     "revenue streams",
     "drivers",
     "financial targets",
     "risks and levers"
    ]
   }
  ]
 },
 {
  "id": "print-or-share-a-plan",
  "name": "Print or share a plan",
  "area": "Alignment & Systems",
  "where": "Each plan > Print / Share",
  "href": "/business-plan",
  "what": "Turn a finished plan into a branded PDF or Word document to send to a funder, partner or advisor. It works for your Business, Marketing, Sales and Forecast Plans. It is built from what is in your plan right now.",
  "ai": "Has an AI button",
  "aiNote": "Write the cover letter has your assistant draft the letter from your plan, using your own AI key, and you can edit every word. Without a key you get a simple letter from a template instead. Downloading does not use AI.",
  "steps": [
   "Open the plan and press the Print / Share tab. For the Forecast Plan, open Forecasting and scroll to Print / Share at the bottom.",
   "If it is locked, it lists what is left. Press Mark section complete on each section, Optional ones too.",
   "Under Who is it for?, choose Funding request, Partnership proposal or General copy, and check the names.",
   "Under Cover letter, say what you are asking for, then press Write the cover letter or write your own.",
   "Under What goes in, choose your extras. This shows on the Business Plan and Forecast Plan only.",
   "Press Download PDF to send it, or Download Word (to edit) to keep working on it."
  ],
  "health": "Printing or sharing a plan does not change your scores. It gives you a finished document to use with other people.",
  "tips": [
   "Download a fresh copy after you change your plan. Files do not update on their own.",
   "Changing a section's text takes off its Complete mark, which locks Print / Share until you mark it again.",
   "Leave the letter blank on a funding request or partnership proposal and a simple one is made for you. A General copy has no letter unless you write one."
  ],
  "questions": [
   {
    "q": "Why is Print / Share locked?",
    "a": "Every section of that plan has to have text and be marked Complete. Each plan unlocks on its own, so your Marketing Plan does not need your Business Plan finished."
   },
   {
    "q": "Can I put my other plans in my Business Plan document?",
    "a": "Yes. On the Business Plan, your Marketing, Sales and Forecast Plans can each go in as an appendix once all of that plan's sections are complete. You can also add a Financial overview."
   },
   {
    "q": "Why can't I press Download?",
    "a": "Add your business name under Who is it for? first."
   }
  ],
  "related": [
   "business-plan",
   "marketing-plan",
   "sales-plan",
   "forecasting"
  ],
  "who": "Everyone, once every section of that plan is marked Complete. Team members need Planning & Goals, or Pipeline, Offers & Sales Plan for the Sales Plan.",
  "keywords": [
   "print",
   "share",
   "pdf",
   "word",
   "download plan",
   "export plan",
   "funding request",
   "grant",
   "investor",
   "partnership proposal",
   "cover letter",
   "appendix",
   "financial overview"
  ],
  "sections": [
   {
    "id": "print-financial-overview",
    "title": "Financial overview and forecast figures",
    "body": "On the Business Plan, Financial overview adds your year-to-date income and expenses, your income goals and your forecast scenarios. On the Forecast Plan, Forecast figures adds your revenue plan or projections. Year-to-date results only appear once you have some.",
    "keywords": [
     "financial overview",
     "forecast figures",
     "year to date",
     "revenue targets"
    ]
   }
  ]
 },
 {
  "id": "playbook-sops",
  "name": "Playbook & SOPs",
  "area": "Alignment & Systems",
  "where": "Alignment & Systems > Playbook & SOPs",
  "href": "/operations/sops",
  "what": "How your business runs, written down once. Each SOP is a tick-box checklist with an owner and tools. Your library starts with 50 ready-made templates as drafts, grouped by your 8 pillars, for you to fit to your business and approve.",
  "ai": "Has an AI button",
  "aiNote": "Draft it for me turns your notes into a new SOP. The buttons under Have your assistant work on this SOP rework the one you are editing. Both use your own AI key, and nothing is saved until you press Save SOP. In the chat, your assistant can add a template, add a step or rewrite an SOP, and that waits behind Approve. The rest of the page works without AI.",
  "steps": [
   "Open Playbook & SOPs from the left menu.",
   "Press an SOP to read it, or press New SOP to start one.",
   "Press Edit to change it. Fill in any [bracketed placeholders] with your own details, then press Save SOP.",
   "Press Approve to put it in use.",
   "When you run the process, tick the steps. Press Start a fresh run to clear the ticks."
  ],
  "health": "SOPs in use feed your Systems dimension and your Internal Process & Culture pillar. An SOP in the Onboarding, Support, Communication or Fulfillment area also feeds that pillar, and through your pillars, your Operations score. Drafts and archived SOPs do not count.",
  "tips": [
   "Start with the process you explain most often.",
   "A line that starts with ## becomes a section header. Start each step with the action, because its first sentence shows in bold.",
   "Choose the right area when you write an SOP, so it counts toward the matching pillar."
  ],
  "questions": [
   {
    "q": "What does Edited since approved mean?",
    "a": "The wording changed after you approved it. Press Approve again to sign off the new version."
   },
   {
    "q": "Can I bring back a template I deleted?",
    "a": "Yes. Press Template library, then Add to my SOPs, or Add all that are not in my SOPs yet."
   },
   {
    "q": "What is the difference between Archive and delete?",
    "a": "Archive keeps the SOP but stops it counting, and Restore brings it back as a draft. Delete removes it for good."
   }
  ],
  "related": [
   "operations",
   "sop-template-library",
   "tasks"
  ],
  "who": "Everyone. Team members need the Operations & SOPs area.",
  "keywords": [
   "sop",
   "sops",
   "playbook",
   "standard operating procedure",
   "process",
   "procedure",
   "checklist",
   "template",
   "approve",
   "draft",
   "archive",
   "print sop"
  ],
  "sections": [
   {
    "id": "sop-approval",
    "title": "Approve and Withdraw approval",
    "body": "Each card shows Needs approval, Approved or Edited since approved. Approve puts the SOP in use and counts it as reviewed today. Withdraw approval sends it back to a draft.",
    "keywords": [
     "approve",
     "withdraw approval",
     "needs approval",
     "edited since approved",
     "in use"
    ]
   },
   {
    "id": "sop-archive",
    "title": "Archive and Restore",
    "body": "Open an SOP and press Archive to keep it without counting it. Press Show archived to see those SOPs again, open one and press Restore to bring it back as a draft.",
    "keywords": [
     "archive",
     "restore",
     "show archived",
     "hide archived"
    ]
   },
   {
    "id": "sop-reading-tools",
    "title": "Reading and running an SOP",
    "body": "Open any SOP to tick steps, Print it, press Mark reviewed today, or press Make a copy for a draft you can adapt. Ticks are saved on the SOP, so everyone running it sees the same list.",
    "keywords": [
     "tick box",
     "print",
     "mark reviewed today",
     "make a copy",
     "start a fresh run"
    ]
   }
  ]
 },
 {
  "id": "operations",
  "name": "Operations",
  "area": "Alignment & Systems",
  "where": "Alignment & Systems > Operations",
  "href": "/operations",
  "what": "Your 8 operational pillars, each scored 0 to 100 by the Suite, not by you. Each card shows what its score is built from, so you can see what is lifting it and what is holding it back.",
  "ai": "Has an AI button",
  "aiNote": "Generate insights has your assistant read your pillars and tell you where to focus next, using your own AI key. Press Refresh for a new read. The pillar scores work without pressing it.",
  "steps": [
   "Open Operations from the left menu.",
   "Read the top row for your Operations score and how many pillars sit in each phase.",
   "On a pillar card, read What your score is built from.",
   "Press Go deeper, answer what you can, then press Save answers.",
   "Back on Operations, press Generate insights to see where to focus next."
  ],
  "health": "Each pillar is scored from your Brain and Profit answers, your Quick Pulse check-ins, your activity in the Suite and that pillar's Go deeper answers. The average of the eight is one part of your Operations dimension. The Operations score at the top of this page is that dimension. Notes do not change a score.",
  "tips": [
   "A pillar showing Not scored yet needs some data. Its Go deeper questions are the fastest way in.",
   "A pillar scoring 40 or below raises an alert on your bell.",
   "For Onboarding, Support, Communication and Fulfillment, an SOP in that area in Playbook & SOPs helps the score."
  ],
  "questions": [
   {
    "q": "Can I set a pillar score myself?",
    "a": "No. The Suite works it out from your answers and activity. To change it, work on what the card shows."
   },
   {
    "q": "Why is my Operations score different from the average of my pillars?",
    "a": "It also includes your Profit answers, your Brain answers and your Quick Pulse check-in."
   },
   {
    "q": "What are the eight pillars?",
    "a": "Customer Acquisition, Sales Journey, Onboarding, Support / Customer Service, Communication, Fulfillment, Internal Process & Culture, and Referral Process."
   }
  ],
  "related": [
   "playbook-sops",
   "how-your-scores-work",
   "go-deeper-questionnaires",
   "quick-pulse-check-in",
   "business-alignment"
  ],
  "who": "Everyone. Team members need the Operations & SOPs area.",
  "keywords": [
   "operations",
   "8 pillars",
   "pillars",
   "operational",
   "pillar score",
   "go deeper",
   "operations score",
   "operations insights",
   "acquisition",
   "onboarding",
   "fulfillment",
   "referral",
   "not scored yet"
  ],
  "sections": [
   {
    "id": "pillar-cards",
    "title": "Pillar cards",
    "body": "Each card shows the score, its phase (Survival, Growth, Expansion or Legacy), what it is built from, your Notes and a Go deeper button. Some cards also link to the plan where you plan that pillar.",
    "keywords": [
     "pillar card",
     "phase",
     "survival",
     "notes",
     "what your score is built from"
    ]
   },
   {
    "id": "ai-operations-insights",
    "title": "AI Operations Insights",
    "body": "Your assistant gives a headline and a high, medium or low priority for the pillars that need you. Your last set stays on the page until you press Refresh.",
    "keywords": [
     "ai operations insights",
     "generate insights",
     "refresh",
     "where to focus"
    ]
   }
  ]
 },
 {
  "id": "alignment-profile",
  "name": "Alignment Profile",
  "area": "Alignment & Systems",
  "where": "Alignment & Systems > Alignment Profile",
  "href": "/assessments",
  "what": "The home for your assessments. It holds your Brain, Soul and Profit assessments, your Quick Pulse Check-in and your check-in rhythm. Your assistant can also write a portrait of you and your business here.",
  "ai": "Has an AI button",
  "aiNote": "Write my profile has your assistant write a portrait of you and your business from your Brain, Soul and Profit answers, using your own AI key. Private answers are never included. It is saved to your account, and press Refresh for a new one. Your assessments have their own AI help.",
  "steps": [
   "Open Alignment Profile from the left menu.",
   "On an assessment card, press Start Assessment. Once it is finished, the button reads Review your answers.",
   "Follow the card at the bottom of the page, which shows what you have finished and what is next.",
   "Press Write my profile once your answers are in.",
   "Use Your Check-in Rhythm to see what is due, and press Retake or Start."
  ],
  "health": "This page does not change your scores by itself. It leads to the assessments that do. Your Brain, Soul, Profit and Quick Pulse answers feed your 12 dimensions and 8 pillars. Your written profile does not change a score, but your assistant uses it.",
  "tips": [
   "Keep your scores current with the suggested rhythm: Quick Pulse monthly, Profit quarterly, Brain twice a year and Soul once a year.",
   "Your scores use four phases: Survival 0 to 40, Growth 41 to 60, Expansion 61 to 80 and Legacy 81 to 100."
  ],
  "questions": [
   {
    "q": "Why can I only see some pages?",
    "a": "Until you finish all three assessments, your Suite opens only Set up Suite, the assessments, Settings and Help. The rest opens by itself when the third is finished."
   },
   {
    "q": "Why does a Command Shift card show for me?",
    "a": "It shows only if you did The Command Shift. Press Bring in my Command Shift work and your assistant and plan drafts can build on it."
   }
  ],
  "related": [
   "brain-profile",
   "soul-profile",
   "profit-profile",
   "quick-pulse-check-in",
   "command-shift-answers",
   "how-your-scores-work"
  ],
  "who": "Everyone. Team members need the Assessments & Alignment area.",
  "keywords": [
   "alignment profile",
   "assessments",
   "assessment hub",
   "check-in schedule",
   "check-in rhythm",
   "write my profile",
   "portrait",
   "retake",
   "brain soul profit",
   "locked pages"
  ],
  "sections": [
   {
    "id": "your-check-in-rhythm",
    "title": "Your Check-in Rhythm",
    "body": "A card for each assessment shows when you last took it, when it is next due and whether it is Not started, Due now, Due soon or Up to date.",
    "keywords": [
     "check-in rhythm",
     "due now",
     "due soon",
     "up to date",
     "last taken"
    ]
   },
   {
    "id": "your-written-profile",
    "title": "Your written profile",
    "body": "Your assistant writes who you are, how your business runs and the money, with your strengths and where things pull apart. It may also say what to answer next to sharpen it.",
    "keywords": [
     "written profile",
     "write my profile",
     "strengths",
     "where things pull apart"
    ]
   }
  ]
 },
 {
  "id": "brain-profile",
  "name": "Brain Profile",
  "area": "Alignment & Systems",
  "where": "Alignment Profile > Brain",
  "href": "/assessments/brain",
  "what": "The assessment about your systems and operations: 538 questions in 12 sections, from your business identity to your tech stack. It is one of the three assessments, with Soul and Profit.",
  "ai": "Has an AI button",
  "aiNote": "Fill this section with my AI gives you a ready-made prompt to copy into the AI you already use. You paste the reply back, review every answer and choose what to keep. This does not use your AI key. When you press Complete, the Suite reads your answers to score them, and that part does use your own AI key.",
  "steps": [
   "Open Brain from Alignment Profile and press Start Assessment.",
   "Answer one section at a time. Your answers save as you go.",
   "Leave and come back whenever you like, on any device.",
   "If you have more than one business or revenue stream, answer the follow-ups so each one is covered.",
   "On the last question, press Complete."
  ],
  "health": "Your Brain answers are scored and feed most of your 12 dimensions and all 8 of your pillars. Your full Command Suite opens once Brain, Soul and Profit are all finished.",
  "tips": [
   "Plan on 3 to 5 hours. It does not have to happen in one sitting.",
   "Press a section box below the question to jump to the first one you have not answered.",
   "Answer honestly about your business as it is today. Your scores, plans and guidance all start here."
  ],
  "questions": [
   {
    "q": "Will I lose my answers if I close the page?",
    "a": "No. Answers save to your account as you go and come back on any device. Check the note beside the save icon. If it says Saved on this device, keep the page open until it says Saved to your account."
   },
   {
    "q": "Do I have to answer every question?",
    "a": "No question stops you moving on, but fuller answers make your scores and guidance better. Your Brain only counts as finished when you press Complete."
   }
  ],
  "related": [
   "alignment-profile",
   "soul-profile",
   "profit-profile",
   "business-alignment",
   "how-your-scores-work"
  ],
  "who": "Everyone. Team members need the Assessments & Alignment area.",
  "keywords": [
   "brain",
   "brain assessment",
   "assessment",
   "questions",
   "systems",
   "operations",
   "questionnaire",
   "autosave",
   "revenue streams",
   "fill this section with my ai",
   "more than one business"
  ],
  "sections": [
   {
    "id": "brain-more-than-one-business",
    "title": "More than one business or revenue stream",
    "body": "In Business Identity, a follow-up asks for the stage of each business. In Business Model, How many separate revenue streams does the business have? adds the same eight questions for each further stream, up to five.",
    "keywords": [
     "more than one business",
     "stage of each business",
     "revenue streams",
     "five streams"
    ]
   },
   {
    "id": "brain-fill-with-your-ai",
    "title": "Fill this section with my AI",
    "body": "Copy the prompt into a new chat with your AI, answer its questions, then paste its reply back. You review every answer before it is saved, and you can see which ones replace an answer you already gave.",
    "keywords": [
     "fill this section with my ai",
     "chatgpt",
     "copy prompt",
     "paste reply"
    ]
   }
  ],
  "starter": true
 },
 {
  "id": "soul-profile",
  "name": "Soul Profile",
  "area": "Alignment & Systems",
  "where": "Alignment Profile > Soul",
  "href": "/assessments/soul",
  "what": "The assessment about you, your purpose and your voice: 263 questions in nine sections, from Core Identity to your Story Library. It is one of the three assessments, with Brain and Profit.",
  "ai": "Has an AI button",
  "aiNote": "Fill this section with my AI gives you a ready-made prompt to copy into the AI you already use. You paste the reply back, review every answer and choose what to keep. This does not use your AI key, and Private questions are left out unless you tick Include private questions. When you press Complete, the Suite reads your answers to score them, and that part does use your own AI key. Private answers are left out of that scoring.",
  "steps": [
   "Open Soul from Alignment Profile and press Start Assessment.",
   "Answer one section at a time. Your answers save as you go.",
   "Questions marked Private are kept out of the Suite's AI, so answer them in your own time.",
   "Leave and come back whenever you like, on any device.",
   "On the last question, press Complete."
  ],
  "health": "Your Soul answers are scored and feed your Leadership, Vision, Client Experience and Sustainability dimensions and your Communication pillar. Private answers are left out. Your full Command Suite opens once Brain, Soul and Profit are all finished.",
  "tips": [
   "Plan on 2 to 3 hours. It does not have to happen in one sitting.",
   "Press a section box below the question to jump to the first one you have not answered.",
   "Answer honestly and in your own words. Your scores, plans and guidance all start here."
  ],
  "questions": [
   {
    "q": "Who sees my Private answers?",
    "a": "They are saved to your account and marked Private. The Suite's AI does not read them for your scores, plans, written profile or assistant. If you tick Include private questions in the Fill prompt, those questions go to your own AI, and it is told to use only what you say in that chat."
   },
   {
    "q": "Will I lose my answers if I close the page?",
    "a": "No. Answers save to your account as you go and come back on any device."
   },
   {
    "q": "Do I have to answer every question?",
    "a": "No question stops you moving on, but your Soul only counts as finished when you press Complete."
   }
  ],
  "related": [
   "alignment-profile",
   "brain-profile",
   "profit-profile",
   "how-your-scores-work"
  ],
  "who": "Everyone. Team members need the Assessments & Alignment area.",
  "keywords": [
   "soul",
   "soul assessment",
   "assessment",
   "purpose",
   "values",
   "calling",
   "voice",
   "private questions",
   "sensitive",
   "origin story",
   "story library",
   "fill this section with my ai"
  ],
  "sections": [
   {
    "id": "soul-private-questions",
    "title": "Private questions",
    "body": "50 questions carry a Private mark, many of them about your story and what you have been through. The mark is already set on those questions.",
    "keywords": [
     "private",
     "sensitive",
     "never sent to ai",
     "protected stories"
    ]
   },
   {
    "id": "soul-sections",
    "title": "The nine sections",
    "body": "Core Identity, Origin Story, Calling, Purpose, and Sacred Why, Values and Standards, Beliefs and Worldview, Voice and Communication Style, Emotional Texture and Presence, Client Transformation, and Story Library.",
    "keywords": [
     "sections",
     "core identity",
     "origin story",
     "client transformation",
     "story library"
    ]
   }
  ]
 },
 {
  "id": "profit-profile",
  "name": "Profit Profile",
  "area": "Alignment & Systems",
  "where": "Alignment & Systems > Alignment Profile > Profit Profile",
  "href": "/assessments/profit",
  "what": "The assessment that rates how your business is doing across 12 business domains, from Marketing to Sustainability. It has 60 questions: most are a 1 to 5 rating and each domain ends with one multiple-choice question. It is one of the three assessments, with Brain and Soul.",
  "ai": "Has an AI button",
  "aiNote": "Fill this section with my AI gives you a ready-made prompt for the domain you are on, to copy into the AI you already use. You paste the reply back, review every answer and choose what to keep. This does not use your AI key.",
  "steps": [
   "Open Alignment Profile from the left menu and press Start Assessment on the Profit Profile card.",
   "Pick the answer that fits your business as it is today, then press Next.",
   "Press a domain name at the top to move to that domain.",
   "Press Complete Assessment on the last question to save your scores."
  ],
  "health": "Your Profit answers are scored by domain and feed most of your 12 dimensions and your 8 pillars. Your full Command Suite opens once Brain, Soul and Profit are all finished.",
  "tips": [
   "Plan on 1 to 2 hours. It does not have to happen in one sitting.",
   "Rate the business as it is now, not as you hope it will be. Honest answers give you scores you can use.",
   "If you change answers later, go to the last question and press Complete Assessment again so your scores update."
  ],
  "questions": [
   {
    "q": "Will I lose my answers if I close the page?",
    "a": "No. Answers save to your account as you go and come back on any device."
   },
   {
    "q": "Why is Next greyed out?",
    "a": "Next stays off until you answer the question on the screen."
   },
   {
    "q": "How is a domain score worked out?",
    "a": "Each answer becomes a number out of 100, and the domain score is the average of that domain's answers."
   }
  ],
  "related": [
   "brain-profile",
   "soul-profile",
   "alignment-profile",
   "how-your-scores-work",
   "quick-pulse-check-in"
  ],
  "who": "Everyone. Team members need the Assessments & Alignment area.",
  "keywords": [
   "profit assessment",
   "profit profile",
   "assessment",
   "12 domains",
   "60 questions",
   "rating",
   "1 to 5",
   "domain scores",
   "business health",
   "retake profit",
   "review my answers",
   "quarterly",
   "fill with ai"
  ],
  "sections": [
   {
    "id": "domain-scores",
    "title": "Domain Scores",
    "body": "The panel under the question shows a score for each domain as you answer, so you can see where you stand before you finish.",
    "keywords": [
     "domain scores",
     "percent",
     "progress",
     "my scores so far"
    ]
   },
   {
    "id": "profit-rhythm",
    "title": "Coming back each quarter",
    "body": "Your Check-in Rhythm on Alignment Profile suggests a Profit re-read every quarter and shows when it is due. Press Retake there, or Review your answers on the card.",
    "keywords": [
     "retake",
     "quarterly",
     "check-in rhythm",
     "review your answers",
     "due"
    ]
   }
  ]
 },
 {
  "id": "quick-pulse-check-in",
  "name": "Quick Pulse Check-in",
  "area": "Alignment & Systems",
  "where": "Alignment & Systems > Alignment Profile > Quick Pulse Check-in",
  "href": "/assessments/quick-pulse-checkin",
  "what": "A short check-in with 18 questions, six each on Brain, Soul and Profit. It takes about five minutes. You see your result out of 100 in one of the four phases, how each area moved since last time, and suggested next steps.",
  "ai": "No AI",
  "aiNote": "The next steps come from a set list chosen by your scores, not from AI. Your assistant reads your check-in answers when you chat with it.",
  "steps": [
   "On Alignment Profile, press Start Quick Pulse.",
   "Choose the answer from 1 to 5 that fits right now, then press Next.",
   "On the last question, press Complete Check-in.",
   "Read your Brain, Soul and Profit scores and your Total Score.",
   "Read your suggested steps under Three Steps Forward."
  ],
  "health": "Your answers feed your 12 dimensions and your 8 pillars, and each check-in adds a dated point to your score trend on Progress.",
  "tips": [
   "Take it once a month, or any time your business feels different than it did.",
   "It opens once your Brain, Soul and Profit assessments are finished.",
   "Your Check-in Rhythm on Alignment Profile shows when the next one is due."
  ],
  "questions": [
   {
    "q": "What do the phases mean?",
    "a": "Survival is 0 to 40, Growth is 41 to 60, Expansion is 61 to 80 and Legacy is 81 to 100. They are the same four phases used across your Suite."
   },
   {
    "q": "Why do I see two steps and not three?",
    "a": "Steps are chosen from your lowest area and from any drop since last time. If nothing dropped, you see fewer steps."
   },
   {
    "q": "Can I stop halfway?",
    "a": "Your place is saved in the browser you are using, so come back on the same device to carry on. It only reaches your account when you press Complete Check-in."
   }
  ],
  "related": [
   "alignment-profile",
   "progress",
   "how-your-scores-work",
   "profit-profile",
   "brain-profile"
  ],
  "who": "Everyone. Team members need the Assessments & Alignment area.",
  "keywords": [
   "quick pulse",
   "pulse",
   "check-in",
   "checkin",
   "monthly check in",
   "18 questions",
   "five minutes",
   "score trend",
   "phase",
   "three steps forward",
   "retake",
   "start quick pulse"
  ],
  "sections": [
   {
    "id": "three-steps-forward",
    "title": "Three Steps Forward",
    "body": "Suggested next steps chosen from your lowest score and what changed since last time. They are also saved to your account.",
    "keywords": [
     "three steps forward",
     "next steps",
     "action steps",
     "lowest score"
    ]
   },
   {
    "id": "your-progress-over-time",
    "title": "Your Progress Over Time",
    "body": "After your first check-in, the results page lists your last five with the date and each score.",
    "keywords": [
     "history",
     "past check-ins",
     "progress over time",
     "last check-in"
    ]
   }
  ]
 },
 {
  "id": "legal-compliance",
  "name": "Legal & Compliance",
  "area": "Alignment & Systems",
  "where": "Alignment & Systems > Legal & Compliance",
  "href": "/compliance",
  "what": "One checklist for contracts, insurance, licenses and filings: 31 items in 8 groups. Give each item a status, keep a link to the document and notes, and track renewal dates. It is a general guide for small businesses, not legal advice, so check anything you are unsure of with your attorney or accountant.",
  "ai": "Has an AI button",
  "aiNote": "What applies to my business? has your assistant mark what matters most for you and what likely does not apply, on your own AI key. These are suggestions only. You accept each one yourself, and the latest set is saved. The checklist works without AI.",
  "steps": [
   "Open Legal & Compliance from the left menu.",
   "Press What applies to my business? if you would like your assistant's suggestions.",
   "Press an item to open it, then add the date, a link to the document and any notes.",
   "Set the status on each item: Not started, In progress, Done or Doesn't apply.",
   "To add your own, type it in Add your own item at the bottom and press Add."
  ],
  "health": "Your checklist feeds your Legal dimension, alongside your Profit answers on Legal. Done counts in full, In progress counts half and Doesn't apply is left out.",
  "tips": [
   "If you run more than one business, choose one at the top of the page and it keeps its own checklist.",
   "Mark what truly does not apply as Doesn't apply so it stops counting against you.",
   "Save the link to each document here so you can find it fast at renewal time."
  ],
  "questions": [
   {
    "q": "Is this legal advice?",
    "a": "No. It is a checklist to keep you organized. Rules vary, so check anything you are unsure of with your attorney or accountant."
   },
   {
    "q": "Why do only some items have a date?",
    "a": "The date box shows on items that renew or come due, and on items you add yourself."
   },
   {
    "q": "What does the percent at the top mean?",
    "a": "It is how much of what applies to you is done. In progress counts as half."
   }
  ],
  "related": [
   "profit-profile",
   "how-your-scores-work",
   "dimension-detail",
   "progress",
   "business-alignment"
  ],
  "who": "Everyone. Team members need the Legal & Compliance area.",
  "keywords": [
   "legal",
   "compliance",
   "checklist",
   "contracts",
   "insurance",
   "licenses",
   "permits",
   "filings",
   "renewals",
   "due dates",
   "privacy policy",
   "trademark",
   "what applies to my business",
   "legal score",
   "attorney"
  ],
  "sections": [
   {
    "id": "what-applies",
    "title": "What applies to my business?",
    "body": "Your assistant reads what it knows about your business. Items it sees as important show Priority for you with a short reason. Items that likely do not apply offer Likely doesn't apply · mark it. Press Check again for a fresh look.",
    "keywords": [
     "what applies",
     "priority for you",
     "likely doesn't apply",
     "check again",
     "suggestions"
    ]
   },
   {
    "id": "coming-up",
    "title": "Coming up in the next 45 days",
    "body": "Items with a date in the next 45 days, or overdue, show in a card at the top. You also get a notification when one is within 14 days or overdue.",
    "keywords": [
     "renewal",
     "overdue",
     "coming up",
     "45 days",
     "reminder",
     "notification"
    ]
   },
   {
    "id": "each-business",
    "title": "A checklist for each business",
    "body": "A business you choose at the top starts with its own empty checklist. Your overall Legal figure averages the checklists you have started, and each business's own score uses its own checklist.",
    "keywords": [
     "each business",
     "multiple businesses",
     "business switcher",
     "separate checklist"
    ]
   }
  ]
 },
 {
  "id": "year-in-review",
  "name": "Year in Review",
  "area": "Alignment & Systems",
  "where": "Alignment & Systems > Year in Review",
  "href": "/year-in-review",
  "what": "Your year on one page, built from what is already in your Suite: income, expenses and net with your best month and a month-by-month chart, new customers and contacts, sessions and hours, events and sign-ups, program members, tasks finished, goals reached, your business score, and client quotes. You can share it with a private link.",
  "ai": "No AI",
  "aiNote": "This page does not use AI. You can ask your assistant in chat how your year is going and it will read you these same numbers.",
  "steps": [
   "Open Year in Review from the left menu.",
   "Choose the Year at the top right.",
   "Read your numbers, then fix anything that looks off on its own page, such as Income or Contacts.",
   "To share it, press Make a share link, then Copy.",
   "Tick Show income, expenses and net only if you want money on the shared page."
  ],
  "health": "This does not change your scores. It helps by showing your year in one place, including your business score at the start and end of the year.",
  "tips": [
   "Tag contacts client or customer so they count as new customers.",
   "Use Open to see exactly what people will see before you send the link.",
   "Each year has its own link, so a share link for one year does not show another."
  ],
  "questions": [
   {
    "q": "Who can see my share link?",
    "a": "Anyone who has the link. Money stays hidden unless you tick the box. Press Stop sharing and the link ends at once."
   },
   {
    "q": "Which client quotes appear?",
    "a": "Up to three approved testimonials your clients agreed to share, with first names only. They also show on the shared page."
   },
   {
    "q": "Why is there no business score?",
    "a": "It needs at least two score points in that year to show a start and an end."
   }
  ],
  "related": [
   "progress",
   "tasks",
   "goal-ladder",
   "budget-planner",
   "business-alignment"
  ],
  "who": "Everyone. Team members need the Finance area.",
  "keywords": [
   "year in review",
   "annual review",
   "year end",
   "my year",
   "yearly summary",
   "wrapped",
   "share my year",
   "share link",
   "best month",
   "stop sharing",
   "annual report",
   "testimonials"
  ],
  "sections": [
   {
    "id": "share-link",
    "title": "Share link",
    "body": "Make a share link creates a private page for that year. Copy and Open are beside it. The box shows or hides income, expenses and net, and Stop sharing turns the link off.",
    "keywords": [
     "share link",
     "make a share link",
     "copy",
     "stop sharing",
     "hide money",
     "show income"
    ]
   }
  ]
 },
 {
  "id": "ai-business-guide",
  "name": "AI Business Guide",
  "area": "Alignment & Systems",
  "where": "Alignment & Systems > Business Alignment, in the AI Business Guide card",
  "href": "/business-alignment",
  "what": "A chat with your assistant on your Business Alignment page. The card greets you with your score and phase and lists your next moves as suggested focus. Your assistant answers from your assessments, scores and what is in your account.",
  "ai": "AI-powered",
  "aiNote": "This uses your own AI key. Without one, the chat asks you to add your key in Settings > AI Assistant. Anything your assistant prepares to change for you waits behind Approve in the chat. It is the same assistant as on Executive Home, and it keeps the same conversation.",
  "steps": [
   "Open Business Alignment from the left menu and find the AI Business Guide card.",
   "Read the greeting and your Suggested Focus.",
   "Press Ask, followed by your assistant's name, to open the chat.",
   "Type your question in Ask for guidance and press Enter.",
   "Press a Quick actions button under a reply to hear more on that point."
  ],
  "health": "This does not change your scores. It helps by explaining your scores and phase and helping you choose what to work on next. Your assessments are what it reads, so more complete answers give you better guidance.",
  "tips": [
   "Ask one clear question, such as what to focus on this week.",
   "Your conversation stays here when you leave the page.",
   "Treat what it says as guidance. The final decisions are yours."
  ],
  "questions": [
   {
    "q": "Is this different from the assistant on Executive Home?",
    "a": "No. It is the same assistant with the same memory of your recent conversation."
   },
   {
    "q": "Can it change things in my account?",
    "a": "It can prepare changes, and each one waits for you to press Approve."
   },
   {
    "q": "Why can I not open it yet?",
    "a": "Your assistant and this page open once your Brain, Soul and Profit assessments are finished."
   }
  ],
  "related": [
   "business-alignment",
   "next-three-moves",
   "how-your-scores-work",
   "growth-roadmap",
   "brain-profile"
  ],
  "who": "Everyone. Team members need the Assessments & Alignment area.",
  "keywords": [
   "ai business guide",
   "ai guide",
   "assistant",
   "chat",
   "ask",
   "guidance",
   "suggested focus",
   "what should i focus on",
   "my score",
   "advice",
   "business coach chat"
  ]
 },
 {
  "id": "go-deeper-questionnaires",
  "name": "Go deeper questionnaires",
  "area": "Alignment & Systems",
  "where": "Alignment & Systems > Operations, in the Go deeper link on each pillar card",
  "href": "/operations",
  "what": "A short set of questions for each of your 8 pillars, about how that part of your business runs today. Each pillar has five or six questions. Answer what you can and skip what does not apply.",
  "ai": "No AI",
  "aiNote": "The questions do not use AI. Your AI Operations Insights card on the Operations page reads your answers, including what you type in the open questions, when it writes insights. That card uses your own AI key.",
  "steps": [
   "Open Operations from the left menu.",
   "On a pillar card, press Go deeper.",
   "Answer the questions that fit your business.",
   "Press Save answers.",
   "Press Back to Operations and check that pillar's score."
  ],
  "health": "Your choice answers are scored into that pillar, and the 8 pillars feed your Operations dimension and your overall score. Open-text answers are not scored. They help your AI insights.",
  "tips": [
   "A pillar that says Not scored yet can often be brought in by answering its Go deeper questions.",
   "For Where do new clients come from today, more than one channel scores higher.",
   "Three of the pillars link to the plan where you plan that area."
  ],
  "questions": [
   {
    "q": "Do I have to answer every question?",
    "a": "No. Answer what you can and skip what does not apply. The card shows how many you have answered."
   },
   {
    "q": "Can I change my answers later?",
    "a": "Yes. Open Go deeper again, change them and press Save answers."
   },
   {
    "q": "Why did my score not change after I typed a long answer?",
    "a": "Open-text answers are not scored. They shape your AI insights. Choice answers are what move the score."
   }
  ],
  "related": [
   "operations",
   "how-your-scores-work",
   "playbook-sops",
   "marketing-plan",
   "sales-plan"
  ],
  "who": "Everyone. Team members need the Operations & SOPs area.",
  "keywords": [
   "go deeper",
   "pillar questions",
   "8 pillars",
   "operations questions",
   "not scored yet",
   "pillar score",
   "questionnaire",
   "save answers",
   "operations insights",
   "customer acquisition",
   "referral process",
   "onboarding"
  ],
  "sections": [
   {
    "id": "what-is-scored",
    "title": "What is scored",
    "body": "Choice answers each carry a score, and the pillar's Go deeper score is their average. The channel and asking questions score on how many you pick. Open-text answers are not scored.",
    "keywords": [
     "scored",
     "choice answers",
     "breadth",
     "open text"
    ]
   }
  ]
 },
 {
  "id": "command-shift-answers",
  "name": "Command Shift answers",
  "area": "Alignment & Systems",
  "where": "Alignment & Systems > Alignment Profile > Command Shift card. It shows only if you did the 21-Day Challenge.",
  "href": "/assessments/command-shift",
  "what": "The answers you wrote during The Command Shift 21-Day Challenge, such as your mission line, True North, core offer, brand voice and positioning. Bring them into your Suite once, then read and edit them here. Your assistant and your plan drafts build on them.",
  "ai": "No AI",
  "aiNote": "This page does not use AI. Your assistant reads these answers when it helps you and when it drafts your plans.",
  "steps": [
   "On Alignment Profile, find the Command Shift card.",
   "Press Bring in my Command Shift work, or Bring it in on the Executive Home banner.",
   "Read your answers on the Your Command Shift page, each marked with its Challenge day.",
   "Change anything that has grown since, then press Save under that answer.",
   "To come back later, press View and edit on the Command Shift card."
  ],
  "health": "This does not change your scores. It helps by giving your assistant and your plans your own words to start from.",
  "tips": [
   "This page opens once your Brain, Soul and Profit assessments are finished.",
   "Empty Marketing Plan sections for positioning, core offer and brand voice start from what you wrote.",
   "Save works one answer at a time, so press it before moving on."
  ],
  "questions": [
   {
    "q": "I do not see the Command Shift card. Why?",
    "a": "It shows only for people who did the 21-Day Challenge and have answers to bring in."
   },
   {
    "q": "Will bringing it in overwrite my Marketing Plan?",
    "a": "No. It only fills sections that are empty. Nothing you already wrote is replaced."
   },
   {
    "q": "If I edit an answer here, does my Marketing Plan change?",
    "a": "No. Your edit saves here. Change the plan on the Marketing Plan page."
   }
  ],
  "related": [
   "alignment-profile",
   "marketing-plan",
   "planning-hub",
   "brain-profile",
   "soul-profile"
  ],
  "who": "Everyone who did the 21-Day Challenge. Team members need the Assessments & Alignment area.",
  "keywords": [
   "command shift",
   "21 day challenge",
   "challenge answers",
   "bring it in",
   "import challenge",
   "mission line",
   "true north",
   "brand voice",
   "positioning",
   "core offer",
   "edit my answers"
  ],
  "sections": [
   {
    "id": "command-shift-import",
    "title": "Bring it in",
    "body": "A banner on Executive Home and the Command Shift card both copy your Challenge answers into your Suite. The banner leaves once they are in. It is safe to press again, because it only adds what is missing.",
    "keywords": [
     "bring it in",
     "import",
     "banner",
     "executive home",
     "bring in my command shift work"
    ]
   }
  ]
 },
 {
  "id": "sop-template-library",
  "name": "SOP template library",
  "area": "Alignment & Systems",
  "where": "Alignment & Systems > Playbook & SOPs, Template library button",
  "href": "/operations/sops",
  "what": "Fifty ready-made SOPs across your 8 pillars, already in your account as drafts you can edit. Each one opens as a tick-box checklist with section headers. Make them fit your business, approve them and they go into use. If you delete one, you can add it back from Template library.",
  "ai": "Has an AI button",
  "aiNote": "In the editor, Have your assistant work on this SOP can fit it to your business, fill in the [placeholders] it knows, add section headers, shorten it, add what to prepare first, or follow what you type. It uses your own AI key. The result lands in the editor and nothing saves until you press Save SOP. In chat, your assistant can add a template or change an SOP, and that waits behind Approve. The library itself does not use AI.",
  "steps": [
   "Open Playbook & SOPs from the left menu. Your template drafts are listed by pillar.",
   "Press a card to read it as a checklist.",
   "Press Edit to change the wording and fill in the [bracketed placeholders], then press Save SOP.",
   "Press Approve to put it in use.",
   "To add a template back, press Template library, then Add to my SOPs."
  ],
  "health": "Drafts do not change your scores. Once you approve an SOP it counts as in use, which feeds your Systems dimension and the matching pillars on Operations. An archived SOP stops counting.",
  "tips": [
   "Start with the process you explain most often, not all fifty.",
   "Use Make a copy to adapt one for a different situation.",
   "Editing an approved SOP shows Edited since approved until you approve it again."
  ],
  "questions": [
   {
    "q": "Do the templates count before I change them?",
    "a": "No. A template draft counts only once you approve it."
   },
   {
    "q": "Are the ticks saved?",
    "a": "Yes. Ticks are saved on the SOP, so everyone running it sees the same list. Ticking never counts as an edit."
   },
   {
    "q": "How do I add a section header?",
    "a": "In the editor, press Add a section header. Any step line that starts with ## becomes a header."
   }
  ],
  "related": [
   "playbook-sops",
   "operations",
   "go-deeper-questionnaires",
   "tasks",
   "how-your-scores-work"
  ],
  "who": "Everyone. Team members need the Operations & SOPs area.",
  "keywords": [
   "sop templates",
   "template library",
   "50 templates",
   "sop",
   "checklist",
   "ready-made sops",
   "playbook",
   "tick box",
   "section header",
   "start a fresh run",
   "add to my sops",
   "process",
   "procedures"
  ],
  "sections": [
   {
    "id": "add-templates",
    "title": "Template library",
    "body": "Search the list by pillar. Press Add to my SOPs for one, or Add all that are not in my SOPs yet. A template you already have shows In your SOPs.",
    "keywords": [
     "template library",
     "add to my sops",
     "add all",
     "search templates",
     "in your sops"
    ]
   },
   {
    "id": "sop-checklist",
    "title": "Running an SOP as a checklist",
    "body": "Each step has a tick box and its first sentence is bold. A bar shows how many are done. Press Start a fresh run to clear the ticks for next time.",
    "keywords": [
     "checklist",
     "tick box",
     "progress bar",
     "start a fresh run",
     "clear ticks"
    ]
   },
   {
    "id": "sop-editor",
    "title": "Editing a template",
    "body": "In the editor you can change any step, move steps up or down, remove them, and use Add a step or Add a section header. Make a copy saves a new draft to adapt.",
    "keywords": [
     "edit sop",
     "move step",
     "reorder",
     "make a copy",
     "add a step"
    ]
   }
  ]
 }
];
