import type { GuideEntry } from "./types";

// The batch waiting for Babs on a review page, written there by /api/user-guide/seed-review. Removed at release.
export const GUIDE_DRAFTS: GuideEntry[] = [
 {
  "id": "set-up-suite",
  "name": "Set up Suite",
  "area": "Getting Started",
  "where": "Getting Started > Set up Suite",
  "href": "/setup",
  "what": "Your setup checklist. Five steps get your Command Suite ready: connect your AI, take your Brain, Soul and Profit assessments, then connect at least one tool. A check mark shows beside each step when it is done.",
  "ai": "No AI",
  "aiNote": "This page does not run AI itself. Connect your AI is where you add your own key, and your assistant uses that key afterward. The company you choose charges your own account for what you use.",
  "steps": [
   "Open Set up Suite from the left menu. While you are new, Getting Started sits at the top of the menu.",
   "Press Start beside Connect your AI, then add your Claude or OpenAI key in Settings.",
   "Press Start beside Brain Assessment, then do the same for Soul and Profit. Finish each one with the Complete button on its last question.",
   "Press Connect your tools and connect your calendar and email. One connection completes this step.",
   "When all five steps show a check mark, press Enter your Command Suite."
  ],
  "health": "This page does not change your scores. The assessments it opens do: your Brain, Soul and Profit answers feed your 12 dimensions and 8 pillars. Your AI key, your tools and your website address do not change a score.",
  "tips": [
   "Keep your Starter Guide open beside you. Open your Starter Guide at the top of this page takes you there.",
   "To move faster, open the ChatGPT or Claude you have already trained on your business on one half of your screen and the assessment on the other. Let it help you draft, then paste in what you agree with.",
   "Each step changes to Review once it is done, so you can go back to it."
  ],
  "questions": [
   {
    "q": "Can I use my ChatGPT or Claude login?",
    "a": "No. This step needs an API key from Claude (Anthropic) or OpenAI. A key is not a new account, and a ChatGPT or Claude.ai login will not work here."
   },
   {
    "q": "Can I stop and come back?",
    "a": "Yes. The assessments save as you go. Press I'll finish later at the bottom of the page if you want to leave the checklist for now."
   },
   {
    "q": "Why is Finish setup to continue greyed out?",
    "a": "One of the five steps is still open. The button changes to Enter your Command Suite when your AI, your three assessments and at least one tool are done."
   }
  ],
  "related": [
   "the-assessment-lock",
   "first-30-days",
   "starter-guide",
   "ai-assistant-setup-and-your-key",
   "integrations",
   "website-review"
  ],
  "who": "Everyone can open it. Connecting your AI and your tools is for the account owner. A team member set to Show only the areas above does not see it.",
  "keywords": [
   "set up",
   "setup",
   "onboarding",
   "get started",
   "first steps",
   "checklist",
   "connect ai",
   "ai key",
   "api key",
   "connect tools",
   "connect calendar",
   "assessments",
   "website address",
   "enter your command suite",
   "finish later"
  ],
  "sections": [
   {
    "id": "connect-your-ai",
    "title": "Connect your AI",
    "body": "Add your own key from Claude (Anthropic) or OpenAI so your assistant can draft plans, insights, reviews, captions and proposals. The company you choose charges your own account. LifeCharter does not receive that money or control it.",
    "keywords": [
     "ai key",
     "api key",
     "openai",
     "claude",
     "anthropic",
     "chatgpt",
     "cost of ai"
    ]
   },
   {
    "id": "three-assessments",
    "title": "Your three assessments",
    "body": "Each one shows its time: Brain about 3 to 5 hours, Soul about 2 to 3 hours and Profit about 1 to 2 hours. Take them in as many sittings as you like.",
    "keywords": [
     "brain",
     "soul",
     "profit",
     "how long",
     "time",
     "sittings"
    ]
   },
   {
    "id": "connect-your-tools",
    "title": "Connect your tools",
    "body": "Connect your Google or Microsoft calendar and email in Settings. Emailing your contacts is a separate step, set up later in Contacts > Email sending.",
    "keywords": [
     "calendar",
     "email",
     "google",
     "microsoft",
     "integrations",
     "required"
    ]
   },
   {
    "id": "website-address",
    "title": "What's your website address?",
    "body": "Once your three assessments are finished, type your website here and press Save. It goes to your Website Alignment Review. No website yet? Leave it blank.",
    "keywords": [
     "website",
     "website address",
     "website review"
    ]
   },
   {
    "id": "getting-started-at-the-top",
    "title": "Getting Started at the top of your menu",
    "body": "While you are new, the whole Getting Started section stays at the top of your left menu. When every First 30 Days step is complete, it goes back to its usual place.",
    "keywords": [
     "menu",
     "left menu",
     "moved",
     "pinned",
     "top of menu"
    ]
   }
  ]
 },
 {
  "id": "first-30-days",
  "name": "First 30 Days",
  "area": "Getting Started",
  "where": "Getting Started > First 30 Days",
  "href": "/first-30-days",
  "what": "Your guided first month, in 23 steps. It starts with your three assessments, then gives you a few small steps a week. Each step ticks itself off from your own data when the work is done.",
  "ai": "No AI",
  "aiNote": "This page does not use AI. Some of the pages its steps open do, such as your plans, and those use your own AI key.",
  "steps": [
   "Finish your three assessments, then open First 30 Days from the left menu.",
   "Press a step to open the page where that work happens.",
   "Do the work there. The step ticks itself off, so there is nothing to mark here.",
   "Start with any step marked Focus for you.",
   "When a week is fully done, the next one opens."
  ],
  "health": "This page does not change your scores. It reads your latest scores and marks the steps that strengthen your three lowest dimensions with Focus for you. It helps you turn the Suite into how you run your business. Each step's own page says whether that work counts toward a score.",
  "tips": [
   "Open the Starter Guide link at the top of the page for a checklist version with where to click.",
   "The bar at the top shows your day and how many steps are done.",
   "The Your first 30 days card on Executive Home shows the week you are on."
  ],
  "questions": [
   {
    "q": "Why will a step not tick off?",
    "a": "Steps tick from your real data, so the work has to be saved on its own page. Some need more than one item, such as three income or expense entries, or five posts or ideas on your Content Calendar."
   },
   {
    "q": "Why is a week locked?",
    "a": "Each week opens once the one before it is complete. Finish what is still open in the earlier week and the next one opens."
   },
   {
    "q": "What happens after day 30?",
    "a": "Nothing closes. The day count stops at 30, and your steps stay here for you to finish at your own pace."
   }
  ],
  "related": [
   "set-up-suite",
   "starter-guide",
   "the-assessment-lock",
   "executive-home",
   "business-alignment"
  ],
  "who": "Everyone. It opens once your three assessments are finished. A team member set to Show only the areas above does not see it.",
  "keywords": [
   "first 30 days",
   "first month",
   "30 day plan",
   "getting started",
   "what do i do next",
   "onboarding",
   "steps",
   "checklist",
   "week 1",
   "focus for you",
   "locked week",
   "step not ticking"
  ],
  "sections": [
   {
    "id": "the-weeks",
    "title": "The weeks",
    "body": "Start here is your assessments. Week 1 is your foundation: vision, offers, Pipeline and income goal. Week 2 is money and rhythm. Week 3 is systems and plans. Week 4 is momentum: content, Client Care, goals, email sending and Quick Pulse.",
    "keywords": [
     "week 1",
     "week 2",
     "week 3",
     "week 4",
     "start here",
     "foundation",
     "momentum",
     "systems and plans",
     "money and rhythm"
    ]
   },
   {
    "id": "focus-for-you",
    "title": "Focus for you",
    "body": "A gold Focus for you label shows the dimension and score a step strengthens. These steps move to the top of their week until they are done.",
    "keywords": [
     "focus for you",
     "lowest scores",
     "weakest",
     "gold label"
    ]
   },
   {
    "id": "how-steps-tick",
    "title": "How steps tick off",
    "body": "Each step checks your own account. Your first SOP must be one you made active or wrote yourself, because an untouched template does not count. Legal needs five items marked done or not applicable. Pillars need Go deeper answers on three of your eight.",
    "keywords": [
     "tick",
     "check off",
     "sop",
     "legal",
     "pillars",
     "go deeper",
     "not ticking"
    ]
   },
   {
    "id": "executive-home-card",
    "title": "The Your first 30 days card",
    "body": "This card on Executive Home shows the week you are on. It leaves when every step is done, or after 60 days.",
    "keywords": [
     "executive home",
     "card",
     "dashboard"
    ]
   }
  ]
 },
 {
  "id": "starter-guide",
  "name": "Starter Guide",
  "area": "Getting Started",
  "where": "Getting Started > Starter Guide",
  "href": "/starter-guide.html",
  "what": "A step-by-step checklist for all 30 days, with a time estimate for every day. Each step says where to click and how you will know it worked. It also lists your calls, next steps, where to get help and common questions.",
  "ai": "No AI",
  "aiNote": "The guide does not use AI. Its steps show you when and how to use your assistant, and one optional step shows how to get help from your own ChatGPT or Claude.",
  "steps": [
   "Open Starter Guide from the left menu, or press Open your Starter Guide on Set up Suite.",
   "Use the row of links at the top to jump to a day. Start with Day 1.",
   "Follow each step. Press its Open button to go to the right page.",
   "Tick each box as you finish it.",
   "Check You will know it worked when, so you know the step is done.",
   "Bookmark the guide and come back to it each day."
  ],
  "health": "This does not change your scores. Ticking a box here only tracks your place in the guide. The work you do in the Suite is what counts, and each page's own entry says how.",
  "tips": [
   "Day 1 is about 6 to 10 hours, in as many sittings as you like, because it holds your three assessments. Most other days are under an hour. These are estimates.",
   "It is a path, not a deadline. Stop whenever you like and pick up at the next step.",
   "The guide stays open while you finish your assessments, so keep it beside you."
  ],
  "questions": [
   {
    "q": "Do my ticks save?",
    "a": "Yes, as you go. Press Clear my ticks at the bottom of the guide if you want to start over."
   },
   {
    "q": "How is this different from First 30 Days?",
    "a": "First 30 Days ticks itself off from your data. The Starter Guide is the fuller checklist you tick yourself, with where to click for every step."
   },
   {
    "q": "What if I skip a step?",
    "a": "Nothing breaks. Your assistant simply knows a little less about you until you come back to it."
   }
  ],
  "related": [
   "first-30-days",
   "set-up-suite",
   "welcome-overview",
   "coaching-calls-and-replays",
   "the-assessment-lock"
  ],
  "who": "Everyone. A team member set to Show only the areas above does not see it.",
  "keywords": [
   "starter guide",
   "checklist",
   "day 1",
   "30 days",
   "step by step",
   "where do i start",
   "tick boxes",
   "how long does setup take",
   "your calls",
   "next steps",
   "bookmark"
  ],
  "sections": [
   {
    "id": "thirty-days-at-a-glance",
    "title": "Your thirty days at a glance",
    "body": "A table near the top lists what you do each day and about how long it takes. Days 1 to 5 get you started. Days 6 to 30 cover your money, SOPs, legal, plans, outreach, goals, email setup, content and getting paid.",
    "keywords": [
     "table",
     "each day",
     "time estimate",
     "days 6 to 30",
     "overview"
    ]
   },
   {
    "id": "your-calls",
    "title": "Your calls",
    "body": "This part lists your live calls in Mountain time. You do not need to join every call. Pick what serves you.",
    "keywords": [
     "calls",
     "office hours",
     "alignment anchor",
     "launch call",
     "schedule"
    ]
   },
   {
    "id": "one-question",
    "title": "One question I want to ask",
    "body": "Day 5 has a box for the question on your mind. Type it in and it is saved with your ticks.",
    "keywords": [
     "question",
     "day 5",
     "catch up"
    ]
   },
   {
    "id": "next-steps-and-help",
    "title": "Next steps and help",
    "body": "After Day 30 the guide lists more to set up when you are ready, such as your contacts, booking page and landing pages. If you get stuck tells you how to reach Help and support.",
    "keywords": [
     "next steps",
     "help",
     "support",
     "after day 30",
     "if you get stuck"
    ]
   }
  ]
 },
 {
  "id": "welcome-overview",
  "name": "Welcome Overview",
  "area": "Getting Started",
  "where": "Getting Started > Welcome Overview",
  "href": "/handouts/client-welcome-overview.pdf",
  "what": "A 16-page picture tour of your Command Suite. It holds a welcome note from Babs, a map of the whole Suite, your first 30 days, ten area maps, life after day 30 and your first steps. It is a map, not a to-do list.",
  "ai": "No AI",
  "aiNote": "This is a PDF to read. It does not use AI.",
  "steps": [
   "Open Welcome Overview from the left menu, just under Starter Guide.",
   "Read the welcome note and look at the big-picture map.",
   "Turn to any of the ten area pages you want to know more about.",
   "Use What it is, Where to find it and Start here on that page.",
   "Finish with Your First Steps on the last page."
  ],
  "health": "This does not change your scores. It helps you see how the Suite fits together, including how your assessments become your Business Health Score.",
  "tips": [
   "You need to be signed in to open it.",
   "It stays open while you finish your three assessments, so it is a good place to see what is coming."
  ],
  "questions": [
   {
    "q": "Is this the same as the Starter Guide?",
    "a": "No. The Welcome Overview shows you the whole Suite. The Starter Guide is your day-by-day checklist."
   },
   {
    "q": "Do I have to read it all?",
    "a": "No. Read the pages you need, whenever you like."
   }
  ],
  "related": [
   "starter-guide",
   "first-30-days",
   "set-up-suite",
   "glossary"
  ],
  "who": "Everyone. A team member set to Show only the areas above does not see it.",
  "keywords": [
   "welcome overview",
   "welcome pdf",
   "overview",
   "big picture",
   "map",
   "brain map",
   "tour",
   "what is in the suite",
   "handout",
   "pdf"
  ],
  "sections": [
   {
    "id": "area-maps",
    "title": "The ten area maps",
    "body": "Coaching, Support & Community; Alignment & Health; Run Your Day; Your AI Assistant; Plans & Goals; Clients & Delivery; Sales & Marketing; Your Money; Meetings & Team; Systems & Operations. Each has its own map.",
    "keywords": [
     "area maps",
     "ten areas",
     "maps",
     "what it is",
     "where to find it",
     "start here"
    ]
   },
   {
    "id": "first-30-and-after",
    "title": "Your First 30 Days and Life After Day 30",
    "body": "One page shows your first month at a glance. Another shows how the Suite and coaching work together after that.",
    "keywords": [
     "first 30 days",
     "after day 30",
     "life after day 30",
     "coaching"
    ]
   }
  ]
 },
 {
  "id": "website-review",
  "name": "Website Review",
  "area": "Getting Started",
  "where": "Getting Started > Website Review",
  "href": "/website-review",
  "what": "Your Website Alignment Review. Our team reads your website against the positioning, voice and offer you are building here, then gives you the five changes that matter most. It is included with Command Suite.",
  "ai": "No AI",
  "aiNote": "Our team writes your Review. There is no AI button on this page.",
  "steps": [
   "Open Website Review from the left menu.",
   "Under What's your website address?, type your address and press Save.",
   "Your Review is being written then shows on the page, with the date to expect it.",
   "Watch your email. We email you when it is ready, and it appears on this page.",
   "Read your five changes. Write to support@lccommandsuite.com if you want to talk it through."
  ],
  "health": "This does not change your scores. It helps your website match the positioning and offer you are building in the Suite.",
  "tips": [
   "No website yet? Leave it blank and add it whenever you are ready.",
   "Type the address like yourbusiness.com. You do not need the https part."
  ],
  "questions": [
   {
    "q": "Can I have more than one website reviewed?",
    "a": "Your plan includes a set number of reviews. The Add another website box shows how many you have used. Type the address and press Add website while you have a place left."
   },
   {
    "q": "I added the wrong website. What do I do?",
    "a": "Press Take this website off my list. This frees up the place, and it works until the Review has been delivered."
   },
   {
    "q": "Can I remove a Review once it is delivered?",
    "a": "No. A delivered Review stays on your list, so you can keep coming back to it."
   }
  ],
  "related": [
   "set-up-suite",
   "first-30-days",
   "workspace-and-team",
   "marketing-plan",
   "business-plan"
  ],
  "who": "Everyone. It opens once your three assessments are finished. Team members need the Website Review area.",
  "keywords": [
   "website review",
   "website alignment review",
   "review my website",
   "website feedback",
   "add website",
   "five changes",
   "website address",
   "my website"
  ],
  "sections": [
   {
    "id": "add-another-website",
    "title": "Add another website",
    "body": "Once your first website is in, this box shows how many reviews you have used. Each website gets its own Review, and they all show on this page.",
    "keywords": [
     "another website",
     "second website",
     "add website",
     "used",
     "limit"
    ]
   },
   {
    "id": "take-a-website-off",
    "title": "Take this website off my list",
    "body": "This shows while a Review is being written. Taking a website off frees up a place on your list.",
    "keywords": [
     "remove website",
     "wrong website",
     "delete website",
     "take off"
    ]
   }
  ]
 },
 {
  "id": "glossary",
  "name": "Glossary",
  "area": "Getting Started",
  "where": "Getting Started > Glossary",
  "href": "/glossary",
  "what": "The Command Suite's own words, plus the business, sales and marketing terms it uses, from A to Z.",
  "ai": "No AI",
  "aiNote": "",
  "steps": [
   "Open Glossary from the left menu.",
   "Search for a word, or use the letter bar to jump.",
   "Press a term's type button to see only Command Suite, Business, Sales or Marketing words. Press All terms to see everything again."
  ],
  "health": "This does not change your scores. It helps you read your scores and plans with confidence.",
  "tips": [
   "A word with a dotted underline in the app shows a one-line meaning when you hover over it or tap it.",
   "The Glossary stays open while you finish your three assessments."
  ],
  "questions": [
   {
    "q": "What does a dotted underline mean?",
    "a": "That word is in the Glossary. Hover over it or tap it for a quick meaning."
   }
  ],
  "related": [
   "business-alignment",
   "set-up-suite",
   "how-your-scores-work"
  ],
  "who": "Everyone. A team member set to Show only the areas above does not see it.",
  "keywords": [
   "definitions",
   "meaning",
   "words",
   "terms",
   "dictionary",
   "what does this mean",
   "glossary",
   "travel partner",
   "hope seat",
   "true north",
   "buried",
   "domain scores"
  ],
  "sections": [
   {
    "id": "filter-by-type",
    "title": "Filter by type",
    "body": "The buttons under the search box show All terms, Command Suite, Business, Sales or Marketing. Each term has its own type button that does the same.",
    "keywords": [
     "filter",
     "type",
     "business",
     "sales",
     "marketing",
     "command suite"
    ]
   },
   {
    "id": "you-will-see-it-in",
    "title": "You will see it in",
    "body": "Many terms list the pages where the word appears. Press one to open that page.",
    "keywords": [
     "where is this used",
     "pages",
     "links"
    ]
   }
  ]
 },
 {
  "id": "the-assessment-lock",
  "name": "The assessment lock",
  "area": "Getting Started",
  "where": "Every new account",
  "href": "/setup",
  "what": "Until you finish your Brain, Soul and Profit assessments, only a few pages open. Your whole Suite is built from your answers, so the rest waits until they are in. It opens by itself when the third one is finished.",
  "ai": "No AI",
  "aiNote": "Your assistant stays closed during the lock and opens with the rest of your Suite. You can still connect your AI key in Settings.",
  "steps": [
   "Open Set up Suite from the left menu.",
   "Take your Brain, Soul and Profit assessments. They save as you go, so use as many sittings as you like.",
   "On the last question of Brain and Soul, press Complete. On Profit, press Complete Assessment.",
   "When the third one is finished, the rest of your Suite opens by itself. If your menu still looks short, refresh the page."
  ],
  "health": "The lock itself does not change your scores. It makes sure your scores and plans start from your real answers, because your assessments feed your 12 dimensions and 8 pillars.",
  "tips": [
   "Saving some answers is not the same as finishing. Press Complete at the end of each assessment.",
   "Stuck? Help stays open, and so does Contact Support."
  ],
  "questions": [
   {
    "q": "Why can I only open a few pages?",
    "a": "Your three assessments are not all finished yet. Your Suite shows Set up Suite, the three assessments, Settings, Help, your User Guide, Starter Guide, Welcome Overview and Glossary until they are."
   },
   {
    "q": "Can someone open the rest for me early?",
    "a": "No. Finishing your three assessments is what opens it."
   },
   {
    "q": "What does it mean when a save says to finish my assessments first?",
    "a": "You tried to change something outside the pages that are open. Finish your three assessments, and you can do it then."
   }
  ],
  "related": [
   "set-up-suite",
   "saving-your-assessment-answers",
   "alignment-profile",
   "brain-profile",
   "soul-profile",
   "profit-profile"
  ],
  "who": "New client accounts. Team members are not locked.",
  "keywords": [
   "locked",
   "lock",
   "cannot open",
   "can't open",
   "greyed out",
   "menu empty",
   "short menu",
   "only setup",
   "unlock",
   "full access",
   "finish assessments first",
   "pages missing",
   "assistant missing"
  ],
  "sections": [
   {
    "id": "what-stays-open",
    "title": "What stays open",
    "body": "Set up Suite, your Brain, Soul and Profit assessments, Alignment Profile, Settings, Help, your User Guide, Starter Guide, Welcome Overview and Glossary. Quick Pulse and Command Shift open with the rest of your Suite.",
    "keywords": [
     "open pages",
     "settings",
     "help",
     "quick pulse",
     "command shift"
    ]
   },
   {
    "id": "what-counts-as-finished",
    "title": "What counts as finished",
    "body": "An assessment is finished when you press its last button: Complete on Brain and Soul, Complete Assessment on Profit. Your check mark on Set up Suite shows it counted.",
    "keywords": [
     "finished",
     "complete",
     "complete assessment",
     "check mark",
     "done"
    ]
   }
  ]
 },
 {
  "id": "signing-in-and-resetting-your-password",
  "name": "Signing in and resetting your password",
  "area": "Getting Started",
  "where": "Sign-in page, at lccommandsuite.com/login",
  "href": "/forgot-password",
  "what": "How to sign in to your Command Suite, and how to set or reset your password by email. If you turned on two-factor sign-in, you also enter a code from your authenticator app.",
  "ai": "No AI",
  "aiNote": "Signing in does not use AI.",
  "steps": [
   "Go to lccommandsuite.com/login, type your email and password, and press Enter the Suite.",
   "If you have two-factor sign-in on, type the 6-digit code from your authenticator app and press Verify & enter.",
   "To set or reset your password, press Forgot or set your password?, type your email and press Send my link.",
   "Open the email and press Choose my password, then press Set my new password.",
   "Type your new password twice and press Update password. You land in your Suite, signed in."
  ],
  "health": "This does not change your scores. It keeps your account safe.",
  "tips": [
   "Passwords need at least 8 characters. A short phrase of 3 or 4 unrelated words works well.",
   "The email link works once and lasts 24 hours.",
   "Turn on two-factor sign-in in Settings > Security."
  ],
  "questions": [
   {
    "q": "It says it couldn't find an account with that email. What now?",
    "a": "Check the spelling, and try the address you used when you signed up. If it still is not found, write to support@lccommandsuite.com and we will help."
   },
   {
    "q": "My reset email has not come. Where is it?",
    "a": "It comes from community@lccommandsuite.com. Check Other, Promotions and Spam, or wait a moment and try again."
   },
   {
    "q": "It says my link has expired. What do I do?",
    "a": "Press Request a new link, or go back to Forgot or set your password?. A fresh link comes straight to you."
   }
  ],
  "related": [
   "security",
   "the-assessment-lock",
   "accepting-a-team-invitation",
   "profile"
  ],
  "who": "Everyone.",
  "keywords": [
   "sign in",
   "log in",
   "login",
   "password",
   "forgot password",
   "reset password",
   "set password",
   "change password",
   "locked out",
   "no account",
   "link expired",
   "two-factor",
   "2fa",
   "authenticator",
   "verification code",
   "can't log in"
  ],
  "sections": [
   {
    "id": "no-account-found",
    "title": "Email with no account",
    "body": "If no account uses that address, the page tells you so, with the support address, so you are not left waiting for an email. The page allows a few tries every 15 minutes. If it asks you to wait, wait a few minutes and try again.",
    "keywords": [
     "couldn't find an account",
     "wrong email",
     "not registered",
     "too many requests",
     "try again"
    ]
   },
   {
    "id": "account-ready-sign-in-button",
    "title": "The sign-in button in your account emails",
    "body": "Your account-ready email has a Choose my password and sign in button. It signs you in and opens the page to choose your password. If the link has expired, use Forgot or set your password? with the same email address.",
    "keywords": [
     "account ready email",
     "first time sign in",
     "choose my password",
     "sign in button",
     "new account"
    ]
   },
   {
    "id": "two-step-verification",
    "title": "Two-step verification",
    "body": "With two-factor sign-in on, a second screen asks for the 6-digit code after your password. Your authenticator app shows the code.",
    "keywords": [
     "two-step verification",
     "authentication code",
     "authenticator app",
     "6-digit code",
     "2fa code"
    ]
   },
   {
    "id": "password-will-not-save",
    "title": "If your new password is refused",
    "body": "A password that has shown up in a known data breach cannot be used here, even if it is long. Choose a different one.",
    "keywords": [
     "password refused",
     "data breach",
     "weak password",
     "password not accepted"
    ]
   }
  ]
 },
 {
  "id": "your-welcome-emails-and-calls",
  "name": "Your welcome emails and calls",
  "area": "Getting Started",
  "where": "Sent to your email automatically",
  "href": "/setup",
  "what": "What arrives after you join: a series of welcome emails from Babs, and invitations to your first calls. They show you where to start and who is with you. They come to the email address on your account.",
  "ai": "No AI",
  "aiNote": "These are written emails. They do not use your AI key.",
  "steps": [
   "Look for your setup email, Your first hour in Command Suite, step by step, shortly after your account opens.",
   "Follow it to sign in, open your Starter Guide, connect your AI and begin your assessments.",
   "Book your one-on-one Welcome Call with Babs, then open your Launch Call invitation and add it to your calendar.",
   "Finish your three assessments, and look for your Next Chapter Call invitation.",
   "Reply to any of these emails if you have a question."
  ],
  "health": "These do not change your scores. The Next Chapter Call goes through what your scores show and what to do first.",
  "tips": [
   "Can't find an email? Check Other, Promotions and Spam, or write to support@lccommandsuite.com.",
   "Every Command Suite client is welcome at any Launch Call, so if your date does not work you can join the next one."
  ],
  "questions": [
   {
    "q": "How do I book my Next Chapter Call?",
    "a": "Use the button in your invitation, or go to lccommandsuite.com/book/next-chapter-call. If no time fits, reply to the email and we will find one."
   },
   {
    "q": "When is the New Client Launch Call?",
    "a": "Every other Thursday at 1:00 PM Mountain, for 90 minutes on Zoom. Your invitation has your date, the Zoom link and a calendar file."
   },
   {
    "q": "Why did I not get the Why your assessment answers matter email?",
    "a": "It is skipped once your three assessments are done."
   }
  ],
  "related": [
   "set-up-suite",
   "starter-guide",
   "the-assessment-lock",
   "coaching-calls-and-replays",
   "website-review",
   "signing-in-and-resetting-your-password"
  ],
  "who": "New clients. Team members do not get these emails.",
  "keywords": [
   "welcome email",
   "welcome emails",
   "setup email",
   "first hour",
   "next chapter call",
   "launch call",
   "new client launch call",
   "welcome call",
   "book a call",
   "call with babs",
   "one on one",
   "calendar invitation",
   "zoom link",
   "did not get email"
  ],
  "sections": [
   {
    "id": "welcome-series",
    "title": "Your welcome emails",
    "body": "Your setup email comes first and you get it once. More follow over your first two weeks, covering your tool connection and website, The Collective, your Website Alignment Review and what is next. One that no longer applies to you may be skipped.",
    "keywords": [
     "welcome series",
     "email series",
     "first two weeks",
     "setup email"
    ]
   },
   {
    "id": "why-your-answers-matter",
    "title": "Why your assessment answers matter so much",
    "body": "This email comes after your setup email. It explains why thorough answers build the foundation your Suite supports you from.",
    "keywords": [
     "assessment email",
     "why answers matter",
     "thorough answers"
    ]
   },
   {
    "id": "next-chapter-call",
    "title": "Next Chapter Call",
    "body": "Once you have finished all three assessments, you are invited to a 30-minute one-on-one with Babs. She reads your results first, and the call goes through what they show and what to do first.",
    "keywords": [
     "next chapter call",
     "results call",
     "after assessments",
     "one on one",
     "1:1"
    ]
   },
   {
    "id": "new-client-launch-call",
    "title": "New Client Launch Call",
    "body": "When you book your Welcome Call, you get a separate invitation to the next Launch Call, a live group session for clients in their first 30 days. Book by the Wednesday before a Thursday call to join that one. Otherwise you join the next one, and it always comes after your Welcome Call.",
    "keywords": [
     "launch call",
     "group call",
     "every other thursday",
     "cut-off",
     "invitation"
    ]
   }
  ]
 },
 {
  "id": "saving-your-assessment-answers",
  "name": "Saving your assessment answers",
  "area": "Getting Started",
  "where": "Each assessment page, beside the save icon",
  "href": "/assessments",
  "what": "Your Brain, Soul and Profit answers save to your account as you go, so you can stop and come back on any device. The words beside the save icon tell you exactly where your answers are.",
  "ai": "No AI",
  "aiNote": "Saving does not use AI. Fill this section with my AI copies a ready-made prompt for your own ChatGPT or Claude. You paste its reply back and review every answer, so it does not use your Suite AI key.",
  "steps": [
   "Open your assessment from Set up Suite or Alignment Profile.",
   "Answer in your own words. Your answers save a few seconds after you stop typing.",
   "Look beside the save icon. You want it to say Saved to your account.",
   "If a notice says a save failed, keep the page open and check your internet. The Suite keeps trying by itself.",
   "To carry on elsewhere, sign in on another device and open the same assessment.",
   "When you reach the last question, press Complete, or Complete Assessment on Profit."
  ],
  "health": "Saving does not change your scores by itself. Your Brain, Soul and Profit answers feed your 12 dimensions and 8 pillars, and an assessment only counts as finished when you press its last button.",
  "tips": [
   "Keep the page open until it says Saved to your account.",
   "If the failed notice stays, sign out and sign back in, then come back. Tell your coach if it still does not clear."
  ],
  "questions": [
   {
    "q": "I saved my AI's answers but do I have to click through them?",
    "a": "No. When you press Save on the answers, such as Save 50 answers, they go straight in. Press Next only if you want to read or change one."
   },
   {
    "q": "I answered on two devices. Which answer wins?",
    "a": "The answer on the device you are using stays as it is. Your saved answers fill in any questions still empty there."
   },
   {
    "q": "Can a failed save erase what I already saved?",
    "a": "No. A failed save never erases earlier answers. Your latest answers stay on the device until the save goes through."
   }
  ],
  "related": [
   "alignment-profile",
   "brain-profile",
   "soul-profile",
   "profit-profile",
   "the-assessment-lock",
   "set-up-suite"
  ],
  "who": "Everyone. Team members need the Assessments & Alignment area.",
  "keywords": [
   "save",
   "saved",
   "not saved",
   "saved on this device",
   "saved to your account",
   "lost answers",
   "assessment answers",
   "another device",
   "different device",
   "phone",
   "progress bar",
   "bar did not move",
   "answered",
   "fill this section with my ai",
   "come back later"
  ],
  "sections": [
   {
    "id": "save-status-words",
    "title": "What the save words mean",
    "body": "Saved to your account means the Suite has your answers. Saving means it is on its way. Saved on this device means only this browser has them so far. Not saved to your account yet means a save failed and the Suite is trying again.",
    "keywords": [
     "saved to your account",
     "saving",
     "saved on this device",
     "not saved to your account yet",
     "status"
    ]
   },
   {
    "id": "progress-bars",
    "title": "The progress bars",
    "body": "The bars and the N of M answered line show how many questions you have answered, not where you are in the assessment. Answers from Fill this section with my AI show the moment you press Save.",
    "keywords": [
     "progress bar",
     "answered",
     "n of m",
     "section bar",
     "fill this section"
    ]
   },
   {
    "id": "any-device",
    "title": "Assessments on any device",
    "body": "Saved answers come back from your account on any computer, phone or browser. You can start on one and finish on another.",
    "keywords": [
     "any device",
     "switch devices",
     "computer",
     "phone",
     "browser",
     "continue"
    ]
   }
  ]
 },
 {
  "id": "help-and-qa",
  "name": "Help and Q&A",
  "area": "Help and everywhere",
  "where": "Help at the bottom of the left menu, or the question mark in the top bar",
  "href": "/help/qa",
  "what": "A searchable library of answers about the Suite, plus any questions and answers you add yourself. The Help group in the left menu also has short guides to each health card on your dashboard.",
  "ai": "No AI",
  "aiNote": "This page is a plain search. For an answer in a sentence or two, open Travel Partner, choose Help & setup, then How do I…. It answers from this same library.",
  "steps": [
   "Press the question mark in the top bar to open Help & Q&A.",
   "Type in Search the knowledge base, or press a category such as Getting Started.",
   "Press a question to open its answer. Press it again to close it.",
   "To keep your own answer here, press Add your own Q&A at the bottom of the page.",
   "Fill in the category, question and answer, then press Save."
  ],
  "health": "Reading Help does not change your scores. The guides in the Help group explain what your health cards mean and how to read them.",
  "tips": [
   "Your own Q&A entries belong to your account, and Travel Partner can answer from them too.",
   "Press any picture in an answer to open it full size."
  ],
  "questions": [
   {
    "q": "Can I remove an entry?",
    "a": "Yes, if you added it. Open it and press Remove this entry. The built-in answers stay."
   },
   {
    "q": "What if I cannot find my answer?",
    "a": "Open Contact Support and send a request. The team replies by email, and you can follow it under My requests."
   }
  ],
  "related": [
   "travel-partner",
   "contact-support-and-whats-new",
   "glossary",
   "how-your-scores-work"
  ],
  "who": "Everyone, including team members and anyone still finishing their assessments.",
  "keywords": [
   "help",
   "q&a",
   "faq",
   "questions",
   "answers",
   "knowledge base",
   "how do i",
   "search help",
   "help center",
   "add my own answer"
  ],
  "sections": [
   {
    "id": "help-explainer-pages",
    "title": "Help explainer pages",
    "body": "The Help group in the left menu has a short guide to each of these: Overall Business Health, 12-Domain Business Alignment, AI Business Guide, Next 3 Moves, Domain Scores, Business Health Trend, Operating Rhythm, Milestones & Momentum and Revenue Snapshot.",
    "keywords": [
     "health card",
     "explainer",
     "what does this card mean",
     "domain scores",
     "next 3 moves",
     "health trend",
     "revenue snapshot",
     "milestones",
     "operating rhythm"
    ]
   },
   {
    "id": "client-journey-maps",
    "title": "Client Journey Maps",
    "body": "Four one-page maps show how the Suite works from your first hello onward: Executive Consultation Journey, Self-Serve Starter Journey, Inside the Suite: Your First 30 Days, and Life After Day 30. Press Getting Started in Help & Q&A and open the question about the whole client journey. Gold dots are what you do, teal dots are what the Suite does automatically, and ivory dots are what the team does.",
    "keywords": [
     "journey map",
     "client journey",
     "first 30 days",
     "life after day 30",
     "map",
     "gold dot",
     "what happens next"
    ]
   }
  ]
 },
 {
  "id": "contact-support-and-whats-new",
  "name": "Contact Support and What's New",
  "area": "Help and everywhere",
  "where": "Help > Contact Support, or the lifebuoy in the top bar",
  "href": "/help/contact",
  "what": "Your one place to reach the LifeCharter team and see what has changed. Send a support request, follow your replies under My requests, and read What's new and Recently answered.",
  "ai": "No AI",
  "aiNote": "",
  "steps": [
   "Press the lifebuoy in the top bar, or open Help, then Contact Support.",
   "Under Submit a Support Request, fill in your name, email, category, subject and message.",
   "Choose Which app is this about and a Priority.",
   "Press Send Message.",
   "Read any suggested answers that appear under While you wait, these might answer it.",
   "Watch your email for a reply, or open My requests on this page to read it and press Send reply."
  ],
  "health": "This does not change your scores. It gets you help and shows you what is new in the Suite.",
  "tips": [
   "The more detail you put in your message, the faster the team can help.",
   "Check Recently answered first. Your answer may already be there.",
   "Support hours and the team's response commitment are on the page."
  ],
  "questions": [
   {
    "q": "Can I email instead of using the form?",
    "a": "Yes. Email support@lccommandsuite.com. The Email Us card at the top of the page has the address."
   },
   {
    "q": "Is there live help?",
    "a": "Yes. The Command Suite Office Hours card offers live help on Zoom. Press See the schedule."
   },
   {
    "q": "Who can see what I send?",
    "a": "Support requests go to the LifeCharter support team. What's new and Recently answered are the same for every account, and Recently answered has names removed."
   }
  ],
  "related": [
   "suggestions-light-bulb",
   "help-and-qa",
   "travel-partner",
   "lc-volant",
   "who-has-opened-my-account"
  ],
  "who": "Everyone. Team members keep Help and Contact Support even when their other areas are limited.",
  "keywords": [
   "support",
   "contact",
   "contact support",
   "help desk",
   "ticket",
   "email support",
   "my requests",
   "reply",
   "whats new",
   "updates",
   "fixes",
   "recently answered",
   "office hours",
   "support hours",
   "something is broken"
  ],
  "sections": [
   {
    "id": "my-requests",
    "title": "My requests",
    "body": "Every request you send is listed here with its replies. Open one to read the conversation, type in Add a reply, and press Send reply. You also get an email when the team replies.",
    "keywords": [
     "my requests",
     "ticket status",
     "reply to support",
     "follow up"
    ]
   },
   {
    "id": "whats-new",
    "title": "What's new",
    "body": "Every update and fix to the Suite, newest first. Press an update to open or close it, or use Expand all and Collapse all. Press the What's new heading to fold the whole list away. This device remembers that choice. Press Show earlier updates for older ones.",
    "keywords": [
     "whats new",
     "updates",
     "changelog",
     "release notes",
     "fixes",
     "new features",
     "collapse",
     "expand all"
    ]
   },
   {
    "id": "recently-answered",
    "title": "Recently answered",
    "body": "Questions other clients have asked and how they were resolved, with names removed.",
    "keywords": [
     "recently answered",
     "resolved",
     "common questions"
    ]
   },
   {
    "id": "one-support-route",
    "title": "One route for every app",
    "body": "Which app is this about lets you choose Command Suite or LC Volant, so your request reaches the right person. The Get help button in LC Volant opens this same form with LC Volant already chosen.",
    "keywords": [
     "which app",
     "lc volant help",
     "get help",
     "volant support"
    ]
   },
   {
    "id": "reported-on-this-page",
    "title": "Your reports and the boards",
    "body": "Anything you send with the light bulb shows here too. Glitches your team has reported is private to your account. Suggestions and General Feedback are boards every Command Suite login can see and vote on. Press Share a suggestion or Share your feedback to add to them.",
    "keywords": [
     "glitches",
     "suggestions",
     "general feedback",
     "vote",
     "board"
    ]
   }
  ]
 },
 {
  "id": "travel-partner",
  "name": "Travel Partner",
  "area": "Help and everywhere",
  "where": "Floating button, bottom right of every page",
  "href": "/",
  "what": "Your helper that follows you from page to page. One tab is your AI assistant. The other is Help & setup, with your setup checklist and a box for how-to questions.",
  "ai": "AI-powered",
  "aiNote": "The assistant tab and How do I… both use your own AI key. Anything the assistant changes for you waits behind Approve. Without a key, How do I… still gives you the closest answer from the Help library.",
  "steps": [
   "Press Travel Partner at the bottom right of the page.",
   "To talk to your assistant, press the Ask tab, which carries your assistant's name.",
   "For setup, press Help & setup, then Setup checklist, and press Next Step to go to it.",
   "For a how-to answer, press Help & setup, then How do I…, and type in Ask about any feature.",
   "If the answer does not cover it, press Send this to support.",
   "To move the button, drag the grip. Press Reset to put it back."
  ],
  "health": "Using Travel Partner does not change your scores. The setup checklist points you to your assessments, and those are what set your scores.",
  "tips": [
   "Until your setup is finished it opens on Help & setup. After that it opens on your assistant.",
   "Setup steps tick themselves when you finish them. The steps under Get going you tick by hand.",
   "How do I… answers how to use the Suite. For questions about your own business, use your assistant."
  ],
  "questions": [
   {
    "q": "Does it know my business?",
    "a": "Your assistant does. How do I… only answers from the Help library and any Q&A you added."
   },
   {
    "q": "Why is the button missing?",
    "a": "It does not show inside The Collective, which has its own space."
   },
   {
    "q": "Where do I see a question I sent to support?",
    "a": "You get an email reply, and it is under Help > Contact Support > My requests."
   }
  ],
  "related": [
   "ai-assistant",
   "ai-assistant-setup-and-your-key",
   "help-and-qa",
   "contact-support-and-whats-new",
   "what-your-assistant-can-do-for-you"
  ],
  "who": "Everyone. A team member's AI use runs on the account owner's key, and the owner can set a monthly limit.",
  "keywords": [
   "travel partner",
   "floating button",
   "widget",
   "help widget",
   "assistant",
   "chat",
   "setup checklist",
   "how do i",
   "ask",
   "move the button",
   "progress",
   "bottom right"
  ],
  "sections": [
   {
    "id": "setup-checklist",
    "title": "Setup checklist",
    "body": "The same steps as Set up Suite, then Get going. The percentage on the button shows how far along you are. Press Finish setup when it appears to open Set up Suite.",
    "keywords": [
     "setup checklist",
     "progress",
     "percent",
     "get going",
     "next step"
    ]
   },
   {
    "id": "how-do-i",
    "title": "How do I…",
    "body": "Type any how-to question. Answers come from the Help library and your own Q&A.",
    "keywords": [
     "how do i",
     "ask about any feature",
     "how to"
    ]
   }
  ]
 },
 {
  "id": "quick-add",
  "name": "Quick add (+)",
  "area": "Help and everywhere",
  "where": "The + button in the top bar",
  "href": "/",
  "what": "A shortcut for the things you add most, from any page: a task, a reminder, a sale, a post or a planning session.",
  "ai": "No AI",
  "aiNote": "",
  "steps": [
   "Press the + in the top bar.",
   "Press New task or New reminder to add one in a small box without leaving your page.",
   "For a task, type what needs doing. Add a date, time and priority if you want them, then press Add to today or Add task.",
   "For a reminder, type what you need to remember and press a quick time, or pick a date and time and press Save.",
   "Press Log a sale, Create content or Schedule planning session to open that page, ready to fill in."
  ],
  "health": "The + itself does not change your scores. A task you add here counts toward your Internal Process & Culture pillar like any other task.",
  "tips": [
   "A task with no date goes straight to Today.",
   "If you add a time to a task, choose Due by this time or Do it at this time.",
   "Pressing the + again closes the menu."
  ],
  "questions": [
   {
    "q": "Where do these go?",
    "a": "Tasks go to Tasks, reminders to Reminders, sales to Sales Activities and posts to the Content Calendar."
   },
   {
    "q": "What is the difference between a task and a reminder?",
    "a": "A task is work to do. A reminder is a one-off thing you want to be told about at a set time."
   }
  ],
  "related": [
   "tasks",
   "reminders",
   "sales-activities",
   "planning-hub",
   "business-segments"
  ],
  "who": "Everyone. Team members can use what their areas allow.",
  "keywords": [
   "plus",
   "+",
   "quick add",
   "add task fast",
   "new task",
   "new reminder",
   "log a sale",
   "create content",
   "schedule planning session",
   "shortcut",
   "top bar"
  ]
 },
 {
  "id": "notifications-bell",
  "name": "Notifications bell",
  "area": "Help and everywhere",
  "where": "The bell in the top bar",
  "href": "/settings?tab=notifications",
  "what": "A live list of what needs you right now, built from your own account: tasks due, bills coming up, follow-ups ready, score changes, reminders and more.",
  "ai": "No AI",
  "aiNote": "",
  "steps": [
   "Look for the gold number on the bell. It shows how many alerts you have not read.",
   "Press the bell to open your list.",
   "Press an alert to go to the page that deals with it.",
   "Press Mark all read to clear the gold number.",
   "Hover over an alert and press the X to dismiss it."
  ],
  "health": "The bell does not change your scores. It tells you when something has moved, such as a score drop, a slipped plan goal or a pillar in the Survival phase.",
  "tips": [
   "Most alerts clear on their own once you deal with what caused them.",
   "The list checks for new alerts every minute.",
   "An alert stays on the bell until it is resolved or dismissed, even after it has been emailed to you."
  ],
  "questions": [
   {
    "q": "Can I get these by email?",
    "a": "Yes. Turn on the once-a-day email under Settings > Notifications. The important alerts are sent once each."
   },
   {
    "q": "It says You're all caught up. Is that right?",
    "a": "Yes. Nothing in your account needs attention right now."
   },
   {
    "q": "Does the bell cover The Collective?",
    "a": "This bell covers your Suite account. See Collective profile and notifications for that space."
   }
  ],
  "related": [
   "notifications",
   "out-of-office",
   "reminders",
   "tasks",
   "collective-profile-and-notifications"
  ],
  "who": "Everyone on the account. It shows the account's alerts.",
  "keywords": [
   "bell",
   "notifications",
   "alerts",
   "gold number",
   "unread",
   "mark all read",
   "dismiss",
   "what needs my attention",
   "all caught up"
  ]
 },
 {
  "id": "business-switcher",
  "name": "Business switcher",
  "area": "Help and everywhere",
  "where": "Top bar, beside the page title",
  "href": "/segments",
  "what": "If you run more than one business, this filters your key pages to one of them, or shows All businesses together. With one business it simply shows your business name.",
  "ai": "No AI",
  "aiNote": "",
  "steps": [
   "Add your businesses under Settings > Business Segments.",
   "Press the Business menu in the top bar.",
   "Choose a business, or All businesses. The page reloads.",
   "Work as usual. New items go to the business you chose."
  ],
  "health": "Choosing a business only changes what you see. Each business also has its own score on Progress, under Health by business.",
  "tips": [
   "A gold highlight on the menu means you are looking at one business, not all of them.",
   "Your choice is kept on this device, so another device can show a different business.",
   "Press Manage businesses at the bottom of the menu to add or change them."
  ],
  "questions": [
   {
    "q": "What does it filter?",
    "a": "Executive Home, Daily Compass, tasks, finances, Sales Activities, Pipeline and Offers & Packages. Legal & Compliance and Progress follow it too."
   },
   {
    "q": "Why do I not see it on my phone?",
    "a": "The Business menu shows on larger screens only. Use a tablet or computer to switch."
   },
   {
    "q": "Numbers look too low for one business. Why?",
    "a": "Money with no business yet is left out. Look for the banner on the Finance page and press Assign them to."
   }
  ],
  "related": [
   "business-segments",
   "finance-center",
   "legal-compliance",
   "progress",
   "workspace-and-team"
  ],
  "who": "Everyone with two or more businesses. The account switcher shows only for people with their own account who are also on another account's team.",
  "keywords": [
   "business switcher",
   "switch business",
   "two businesses",
   "multiple businesses",
   "all businesses",
   "filter by business",
   "change account",
   "my account",
   "second business",
   "brand"
  ],
  "sections": [
   {
    "id": "account-switcher",
    "title": "Account switcher",
    "body": "If you own an account and are also on someone else's team, a toggle in the top bar lets you switch between My Account and theirs. In their account you use their data and AI, within the limits of your role. Your own account stays as it was.",
    "keywords": [
     "account switcher",
     "my account",
     "team account",
     "two accounts",
     "switch account"
    ]
   },
   {
    "id": "finance-per-business",
    "title": "Finance per business",
    "body": "Money you add goes to the business chosen at the top, and Income, Expenses, Bills, Profit & Loss and Pulse show just that business. All businesses adds them together. If some money has no business yet, a banner offers Assign them to, one press for all of it. Budget, income goals and tax set-aside stay account-wide.",
    "keywords": [
     "finance by business",
     "assign to business",
     "unassigned money",
     "profit and loss by business",
     "banner"
    ]
   },
   {
    "id": "health-by-business",
    "title": "Health by business",
    "body": "Open Progress to see each business's own score. It starts from your account's assessment scores and moves with what is tied to that business, such as its tasks, its money and its compliance checklist. Choose a business at the top to see its dimensions and notes.",
    "keywords": [
     "health by business",
     "score per business",
     "business score",
     "progress"
    ]
   },
   {
    "id": "legal-compliance-per-business",
    "title": "Legal & Compliance per business",
    "body": "Each business keeps its own checklist, which starts empty. All businesses is the account-wide checklist. Your account's Legal figure is the average of the checklists you have started.",
    "keywords": [
     "compliance by business",
     "legal checklist",
     "per business checklist"
    ]
   }
  ]
 },
 {
  "id": "suggestions-light-bulb",
  "name": "Suggestions light bulb",
  "area": "Help and everywhere",
  "where": "The light bulb in the top bar",
  "href": "/help/contact",
  "what": "The quick way to tell the team something from any page: report a glitch, share a suggestion or give general feedback.",
  "ai": "No AI",
  "aiNote": "",
  "steps": [
   "Press the light bulb in the top bar.",
   "Choose Something's not working, I have a suggestion or General feedback.",
   "Add a short title and a few details.",
   "For a glitch, leave the box ticked if you want a support ticket so the team follows up with you directly.",
   "Press Send."
  ],
  "health": "This does not change your scores. It tells the team what would make the Suite better for you.",
  "tips": [
   "Suggestions and general feedback can be seen by everyone with a Command Suite login, so leave out private details.",
   "Say what you were doing and what you expected. It helps the team find a glitch faster.",
   "Vote on other people's ideas under Help > Contact Support."
  ],
  "questions": [
   {
    "q": "Who can see a glitch I report?",
    "a": "Only your account, your team and the LifeCharter team."
   },
   {
    "q": "Where do I see what I sent?",
    "a": "Press See it on your Support page after you send, or open Help > Contact Support."
   },
   {
    "q": "Will I hear about the fix?",
    "a": "Fixes are listed under What's new on the Contact Support page. If you opened a support ticket, the team follows up with you directly."
   }
  ],
  "related": [
   "contact-support-and-whats-new",
   "help-and-qa"
  ],
  "who": "Everyone.",
  "keywords": [
   "light bulb",
   "lightbulb",
   "feedback",
   "suggestion",
   "idea",
   "feature request",
   "report a bug",
   "glitch",
   "something is not working",
   "vote"
  ]
 },
 {
  "id": "left-menu",
  "name": "Left menu",
  "area": "Help and everywhere",
  "where": "Left side of every page",
  "href": "/",
  "what": "Your way around the Suite. Pages sit in sections, and you can fold, shrink and rearrange the menu to suit how you work.",
  "ai": "No AI",
  "aiNote": "",
  "steps": [
   "Press a section name to fold or open it.",
   "Press the arrow at the top of the menu to shrink it to icons. Hover over an icon to see its name.",
   "Drag a page to a new place. Or use the small up and down arrows beside it.",
   "Drag a whole section by its grip to move it.",
   "Hover over a section name and press A–Z to sort its pages.",
   "To go back to the standard order, press Reset menu order at the bottom."
  ],
  "health": "The menu does not change your scores. It only changes how you get around.",
  "tips": [
   "Your order is saved to your account, so it is the same on every device and for your whole team.",
   "Rearranging works with the full menu open, not the icon view.",
   "If a drag does not land, use the small up and down arrows. They always work."
  ],
  "questions": [
   {
    "q": "Why do I not see a page someone else has?",
    "a": "Team members see the areas they were given. Team Huddle shows only when your account has a team."
   },
   {
    "q": "Where is Help?",
    "a": "At the bottom of the menu, under the sections. Press Help to open its list."
   },
   {
    "q": "How do I open the menu on a phone?",
    "a": "Press the menu button at the top left. Press Close menu when you are done."
   }
  ],
  "related": [
   "use-it-on-your-phone",
   "team-access-limits",
   "appearance-and-text-size",
   "help-and-qa"
  ],
  "who": "Everyone. Reset menu order shows once your order has been changed.",
  "keywords": [
   "left menu",
   "sidebar",
   "navigation",
   "menu",
   "reorder menu",
   "drag pages",
   "move section",
   "fold section",
   "collapse menu",
   "reset menu order",
   "a to z",
   "where is",
   "cannot find page"
  ],
  "sections": [
   {
    "id": "menu-sections",
    "title": "Sections in the menu",
    "body": "Daily Operations, Clients & Sales, Marketing, Client Delivery, Money, Alignment & Systems, Settings and Getting Started. Help sits below them.",
    "keywords": [
     "sections",
     "daily operations",
     "clients and sales",
     "marketing",
     "client delivery",
     "money",
     "alignment and systems",
     "getting started"
    ]
   }
  ]
 },
 {
  "id": "use-it-on-your-phone",
  "name": "Use it on your phone",
  "area": "Help and everywhere",
  "where": "Daily Operations > Quick Capture has the steps",
  "href": "/capture",
  "what": "Put the Suite on your phone's home screen so it opens like an app. Every signed-in page is made to fit a phone.",
  "ai": "No AI",
  "aiNote": "",
  "steps": [
   "Sign in to the Suite in your phone's browser.",
   "On iPhone in Safari, tap Share, then Add to Home Screen.",
   "On Android in Chrome, tap the three-dot menu, then Install app.",
   "Open the Suite from the new icon on your home screen.",
   "Press and hold the icon for shortcuts to Quick capture, Daily Compass and your tasks."
  ],
  "health": "Using a phone does not change your scores. Tasks and money you capture there count the same as anywhere else.",
  "tips": [
   "Quick Capture is built for the phone, for a task or money in or out while you are out.",
   "Tap the menu button at the top left to reach the left menu and Help.",
   "On a phone, Contact Support sits under Help in the menu."
  ],
  "questions": [
   {
    "q": "Do I need to download it from an app store?",
    "a": "No. You add it from your phone's browser."
   },
   {
    "q": "What looks different on a phone?",
    "a": "The left menu opens from a button, and Contact Support moves into it. The top search box and the Business menu do not show."
   },
   {
    "q": "Is there a separate step for The Collective?",
    "a": "Yes. The Collective has its own steps. See The Collective on your phone."
   }
  ],
  "related": [
   "quick-capture",
   "left-menu",
   "collective-on-your-phone",
   "business-switcher"
  ],
  "who": "Everyone.",
  "keywords": [
   "phone",
   "mobile",
   "iphone",
   "android",
   "install",
   "add to home screen",
   "home screen",
   "app",
   "app icon",
   "download app",
   "tablet",
   "shortcut"
  ],
  "sections": [
   {
    "id": "install-on-phone",
    "title": "Install on your phone",
    "body": "Add to Home Screen on iPhone, or Install app on Android. The same steps are on the Quick Capture page.",
    "keywords": [
     "install",
     "add to home screen",
     "install app",
     "safari",
     "chrome"
    ]
   },
   {
    "id": "phone-width-layout",
    "title": "How pages fit a phone",
    "body": "Pages stay within your screen. The feedback, notification and quick-add panels fit inside it, and the account switcher gets its own row.",
    "keywords": [
     "phone layout",
     "fits screen",
     "sideways",
     "small screen"
    ]
   }
  ]
 },
 {
  "id": "what-the-suite-does-on-its-own",
  "name": "What the Suite does on its own",
  "area": "Help and everywhere",
  "where": "Runs automatically, with nothing to open",
  "href": "/settings?tab=notifications",
  "what": "The Suite keeps working when you are away from your screen. It sends what you scheduled, reminds you of what is coming and keeps your connected tools up to date.",
  "ai": "No AI",
  "aiNote": "",
  "steps": [
   "Set up what you want sent, such as a campaign, a broadcast or a calendar.",
   "Connect your tools under Settings, such as Stripe and your calendar.",
   "Choose your reminder emails under Settings > Notifications.",
   "Let it run. The bell tells you if something needs you."
  ],
  "health": "These jobs do not change your scores by themselves. Income from a connected Stripe account lands in your Finance records, which feed your Finance dimension.",
  "tips": [
   "Going away? Use Settings > Out of office to pause your reminder emails.",
   "Nothing goes to your clients unless you turned it on or scheduled it."
  ],
  "questions": [
   {
    "q": "Do I have to leave the Suite open?",
    "a": "No. These all run on their own, whether or not you are signed in."
   },
   {
    "q": "What if a connected calendar stops working?",
    "a": "The Suite checks it regularly. You get a bell alert and an email with a link to reconnect it."
   },
   {
    "q": "Why did I not get an email I expected?",
    "a": "Check Settings > Notifications and Settings > Out of office. Emails to your own contacts depend on your email sending setup."
   }
  ],
  "related": [
   "notifications",
   "out-of-office",
   "email-sending-setup",
   "connect-stripe",
   "calendars-and-booking-pages",
   "integrations"
  ],
  "who": "Everyone. Each job works on the account's own data and only where it has been set up.",
  "keywords": [
   "automatic",
   "automations",
   "runs by itself",
   "background",
   "scheduled",
   "reminder emails",
   "broadcast",
   "stripe sync",
   "booking reminders",
   "what happens automatically"
  ],
  "sections": [
   {
    "id": "sends-for-you",
    "title": "What it sends",
    "body": "Scheduled broadcasts, the emails in your campaign series, reminders for booked meetings and events, and nudges to anyone who has not yet signed a document in LC Plume.",
    "keywords": [
     "broadcast",
     "campaign",
     "booking reminder",
     "event reminder",
     "sign reminder"
    ]
   },
   {
    "id": "reminds-you",
    "title": "What it reminds you of",
    "body": "Timed tasks and reminders you typed in, if you have email reminders on, and the once-a-day email about what needs your attention.",
    "keywords": [
     "task reminder",
     "daily email",
     "reminder email"
    ]
   },
   {
    "id": "keeps-connected",
    "title": "What it keeps up to date",
    "body": "Sales from your connected Stripe account come into your records each morning, and connected calendars are checked regularly. If you turned on the automatic pick-up in LC Volant, your Zoom recordings are collected and transcribed.",
    "keywords": [
     "stripe sync",
     "calendar check",
     "zoom recordings",
     "volant"
    ]
   }
  ]
 },
 {
  "id": "calls-with-the-lifecharter-team",
  "name": "Calls with the LifeCharter team",
  "area": "Help and everywhere",
  "where": "Booking links the team sends you",
  "href": "/book/new-client-welcome-call",
  "what": "One-on-one calls you book yourself: your New Client Welcome Call, and a Client Check-In Call when you need extra support. Both are 30 minutes with Babs on Zoom.",
  "ai": "No AI",
  "aiNote": "",
  "steps": [
   "Open the booking link in your email.",
   "Choose a day and time. Times show in your own time zone.",
   "Fill in your name, your email and any question on the form.",
   "Press Confirm booking.",
   "Watch for your confirmation email. It has your Zoom link and a calendar invitation."
  ],
  "health": "Booking a call does not change your scores. It is your time with Babs to get help with what matters most.",
  "tips": [
   "Choose Reschedule or cancel after you book if your plans change.",
   "Your confirmation email has everything you need to join."
  ],
  "questions": [
   {
    "q": "When do I book my Welcome Call?",
    "a": "After you sign. The link is in the email you get, with your name and email filled in."
   },
   {
    "q": "What happens after I book my Welcome Call?",
    "a": "You are invited to the next New Client Launch Call. The date, Zoom link and a calendar file come by email."
   },
   {
    "q": "How far ahead can I book?",
    "a": "Up to 30 days ahead. A Welcome Call needs 12 hours' notice and a Check-In Call needs 24 hours' notice."
   }
  ],
  "related": [
   "coaching-calls-and-replays",
   "contact-support-and-whats-new",
   "calendars-and-booking-pages"
  ],
  "who": "LifeCharter clients. These are the team's calendars, not your own booking pages.",
  "keywords": [
   "welcome call",
   "new client welcome call",
   "check-in call",
   "client check-in",
   "book a call",
   "call with babs",
   "zoom call",
   "launch call",
   "reschedule",
   "cancel call",
   "one on one"
  ],
  "sections": [
   {
    "id": "new-client-welcome-call",
    "title": "New Client Welcome Call",
    "body": "A 30-minute one-on-one with Babs on Zoom, once you have signed. Book at lccommandsuite.com/book/new-client-welcome-call.",
    "keywords": [
     "welcome call",
     "first call",
     "new client"
    ]
   },
   {
    "id": "client-check-in-call",
    "title": "Client Check-In Call",
    "body": "A 30-minute one-on-one with Babs on Zoom for when you need extra support. Book at lccommandsuite.com/book/client-check-in-call.",
    "keywords": [
     "check-in call",
     "extra support",
     "stuck",
     "quiet"
    ]
   }
  ]
 },
 {
  "id": "privacy-terms-and-your-agreement",
  "name": "Privacy, terms and your agreement",
  "area": "Help and everywhere",
  "where": "Legal pages on lccommandsuite.com",
  "href": "/legal/privacy-policy",
  "what": "The legal pages that cover your Suite account: the Privacy Policy, the Terms of Sale & Service Agreement, the Year-1 Commitment Acknowledgment and the Community Guidelines & Terms of Use.",
  "ai": "No AI",
  "aiNote": "",
  "steps": [
   "Open the page you need. The addresses are listed below.",
   "Read it in your browser. These pages are public, so you do not need to sign in.",
   "Questions about your agreement? Send a request through Help > Contact Support."
  ],
  "health": "These pages do not change your scores. Your Legal & Compliance checklist is what feeds your Legal dimension.",
  "tips": [
   "The Privacy Policy explains what is collected and how it is used, including Google data.",
   "The Community Guidelines are for The LifeCharter Collective."
  ],
  "questions": [
   {
    "q": "Where do I control my own data?",
    "a": "Under Settings > Data & Privacy. The Privacy Policy explains your choices."
   },
   {
    "q": "Can LifeCharter support see my account?",
    "a": "Only in a read-only view, to help with a support request. See Who has opened my account."
   }
  ],
  "related": [
   "data-privacy",
   "who-has-opened-my-account",
   "legal-compliance",
   "security",
   "lc-plume"
  ],
  "who": "Everyone. These pages are public.",
  "keywords": [
   "privacy",
   "privacy policy",
   "terms",
   "terms of sale",
   "agreement",
   "year 1",
   "year-1 agreement",
   "contract",
   "legal",
   "community guidelines",
   "my data",
   "cancel terms"
  ],
  "sections": [
   {
    "id": "privacy-policy",
    "title": "Privacy Policy",
    "body": "lccommandsuite.com/legal/privacy-policy",
    "keywords": [
     "privacy policy",
     "data",
     "google data"
    ]
   },
   {
    "id": "terms-of-sale",
    "title": "Terms of Sale & Service Agreement",
    "body": "lccommandsuite.com/legal/terms-of-sale",
    "keywords": [
     "terms of sale",
     "service agreement",
     "terms"
    ]
   },
   {
    "id": "year-1-agreement",
    "title": "Year-1 Commitment Acknowledgment",
    "body": "lccommandsuite.com/legal/year-1-agreement",
    "keywords": [
     "year 1",
     "year-1",
     "commitment",
     "agreement"
    ]
   },
   {
    "id": "community-guidelines",
    "title": "Community Guidelines & Terms of Use",
    "body": "lccommandsuite.com/legal/community-guidelines",
    "keywords": [
     "community guidelines",
     "collective rules"
    ]
   }
  ]
 },
 {
  "id": "newer-version-notice",
  "name": "Newer version notice",
  "area": "Help and everywhere",
  "where": "Bar at the bottom of any page, when an update is ready",
  "href": "/",
  "what": "When the Suite is updated while you have a page open, a small bar lets you know and loads the newest version with one press.",
  "ai": "No AI",
  "aiNote": "",
  "steps": [
   "Look for A newer version of the Suite is ready at the bottom of your page.",
   "Finish and save anything you are typing.",
   "Press Refresh now.",
   "Or press Later to hide the bar for now."
  ],
  "health": "This does not change your scores or your data. It only loads the latest version of the page.",
  "tips": [
   "The Suite checks every 10 minutes, and when you come back to the tab.",
   "If a menu or page looks out of date, refresh your browser."
  ],
  "questions": [
   {
    "q": "Do I have to refresh right away?",
    "a": "No. Press Later and carry on. The bar comes back at the next check."
   },
   {
    "q": "Where can I read what changed?",
    "a": "Open Help > Contact Support and look under What's new."
   }
  ],
  "related": [
   "contact-support-and-whats-new",
   "help-and-qa"
  ],
  "who": "Everyone.",
  "keywords": [
   "newer version",
   "refresh",
   "refresh now",
   "update",
   "update available",
   "reload",
   "bar at bottom",
   "new version",
   "later"
  ]
 },
 {
  "id": "content-calendar",
  "name": "Content Calendar",
  "area": "Marketing",
  "where": "Marketing > Content Calendar",
  "href": "/daily-compass/calendar",
  "what": "A month calendar and a place to write your social posts. Create content drafts a caption and hashtags for you, ready to copy into your social apps. The Suite does not post to social accounts for you.",
  "ai": "Has an AI button",
  "aiNote": "Draft with AI writes a caption and hashtags using your own AI key, and leans on your Marketing Plan when it is filled in. It only fills the Caption box, and nothing is posted. Your chat assistant can also write posts in chat for you to copy.",
  "steps": [
   "Open Content Calendar from the left menu and press Create content.",
   "Press the platforms you are writing for, so the caption fits them.",
   "Under Draft with AI, type a few words about the post and press Draft.",
   "Read the Caption box and change anything you like.",
   "Copy your caption and paste it into your social app."
  ],
  "health": "This page does not change your scores. It helps you turn your Marketing Plan into posts you can use.",
  "tips": [
   "Copy your caption before you close the panel, so you do not lose it.",
   "Fill in your Marketing Plan first. Your drafts will sound more like you.",
   "Put your own details in wherever a draft shows [brackets]."
  ],
  "questions": [
   {
    "q": "Why can't I press Schedule or Publish now?",
    "a": "Posting to social accounts from the Suite is not available on your account right now, so those buttons are greyed out and a notice says so. Paste your post into each social app yourself."
   },
   {
    "q": "Why does it ask me to connect my AI key?",
    "a": "Draft with AI uses your own key. Connect it in Settings and press Draft again."
   }
  ],
  "related": [
   "marketing-plan",
   "testimonials",
   "scripts-templates",
   "daily-compass",
   "ai-assistant-setup-and-your-key"
  ],
  "who": "Everyone. Team members need the Content Calendar area.",
  "keywords": [
   "content calendar",
   "create content",
   "social post",
   "caption",
   "hashtags",
   "draft with ai",
   "instagram post",
   "facebook post",
   "linkedin post",
   "plan my content",
   "write a post"
  ],
  "sections": [
   {
    "id": "draft-with-ai",
    "title": "Draft with AI",
    "body": "Type a few words about the post and press Draft. Your caption and hashtags land in the Caption box, where you can change them.",
    "keywords": [
     "draft",
     "caption",
     "hashtags",
     "ai caption"
    ]
   }
  ]
 },
 {
  "id": "campaigns",
  "name": "Campaigns",
  "area": "Marketing",
  "where": "Marketing > Campaigns & Broadcasts > Campaigns tab",
  "href": "/sequences-manager",
  "what": "Timed email series. Each email goes out a set number of days after someone joins, at the hour you choose in that person's own time zone. People join from your forms, your booking calendars or a contact record.",
  "ai": "No AI",
  "aiNote": "This page has no AI button. Your chat assistant can write a whole campaign for you. It waits behind Approve, arrives paused with nobody in it, and you turn it on yourself.",
  "steps": [
   "Open Campaigns & Broadcasts. If a note says email sending is not set up, press Set up email sending first.",
   "Type a name in New campaign name and press the plus button.",
   "Press Add email, fill in Send on day, Subject and your text, then press Save.",
   "Choose your Daily send time.",
   "Press Turn on when the emails are ready.",
   "Open the People tab to add someone, or have a form or booking calendar start the campaign."
  ],
  "health": "Each campaign you have turned on counts toward your Communication pillar. Pausing a campaign takes it out of that count. Nothing else on this page changes your scores.",
  "tips": [
   "Press Preview to see the email, or the send icon on any email for a test to your own inbox.",
   "Use Skip anyone tagged to keep people out. Anyone who picks up that tag later is taken out too.",
   "Type {{first_name}} in your text to fill in each person's name. Your sign-off and footer are added for you."
  ],
  "questions": [
   {
    "q": "Who do my campaign emails come from?",
    "a": "From you. They go out through your own Resend account and your own domain, using the sender you set under Contacts > Email sending. Nothing goes to your contacts until that is done."
   },
   {
    "q": "What does Pause whole campaign do?",
    "a": "Nothing more goes out until you turn it back on. To stop one person only, use the pause or Stop for good buttons beside them on the People tab."
   },
   {
    "q": "What is the difference between a campaign and a broadcast?",
    "a": "A campaign is a series that each person moves through on their own timing. A broadcast is one email to a group, sent once."
   }
  ],
  "related": [
   "broadcasts",
   "email-sending-setup",
   "forms",
   "calendars-and-booking-pages",
   "resend-a-single-email",
   "contact-record"
  ],
  "who": "Everyone. Team members need the Campaigns area. Email sending must be set up before anything goes out.",
  "keywords": [
   "campaign",
   "email series",
   "email sequence",
   "drip",
   "automated emails",
   "follow up emails",
   "nurture",
   "send on day",
   "turn on campaign",
   "pause campaign",
   "unsubscribe"
  ],
  "sections": [
   {
    "id": "campaign-people",
    "title": "People in a campaign",
    "body": "The People tab shows who is in it, how many emails they have had, whether they registered and their status. Add someone from your contacts or add someone new. Their first email goes when the campaign is on.",
    "keywords": [
     "people tab",
     "add someone",
     "enroll",
     "registered",
     "stop for good"
    ]
   },
   {
    "id": "unsubscribe",
    "title": "Unsubscribe",
    "body": "Your emails carry an Unsubscribe link. One click takes that person off your emails and stops any campaign they are in. It touches that contact only, and they cannot be added back to a campaign.",
    "keywords": [
     "unsubscribe",
     "opt out",
     "stop emails",
     "unsubscribed"
    ]
   }
  ]
 },
 {
  "id": "broadcasts",
  "name": "Broadcasts",
  "area": "Marketing",
  "where": "Marketing > Campaigns & Broadcasts > Broadcasts tab",
  "href": "/sequences-manager?tab=broadcasts",
  "what": "A one-time email to everyone with the tags you choose, plus anyone you add by name. Send it now or schedule it. Unsubscribed contacts are always left out.",
  "ai": "No AI",
  "aiNote": "This page has no AI button. Your chat assistant can write a broadcast for you. It waits behind Approve and arrives as a draft. It never sends or schedules it. You do that yourself.",
  "steps": [
   "Open Campaigns & Broadcasts and press the Broadcasts tab.",
   "Type a name in New blank broadcast and press the plus button.",
   "Under Who gets it, press your tags. Add skips or names if you need them, then press Save.",
   "Under The email, write your Subject and text. Press Preview, then Send me a test.",
   "Under Send, pick a Date and Time and press Schedule, or press Send now."
  ],
  "health": "Broadcasts do not change your scores. They help you reach your whole list, or one group of it, at once.",
  "tips": [
   "Use Skip anyone with these tags to leave people out, even if they match your other tags.",
   "Tick a campaign under Skip anyone still receiving so nobody gets two things at once.",
   "The list is fixed the moment sending starts, so check the people count first."
  ],
  "questions": [
   {
    "q": "Who does a broadcast come from?",
    "a": "From you, through your own Resend account and your own domain. Set this up under Contacts > Email sending. A note on the page tells you if it is not ready."
   },
   {
    "q": "Can I change my mind after I schedule it?",
    "a": "Yes. Press Unschedule and it is a draft again, or change the date and press Reschedule."
   },
   {
    "q": "Can I stop one that is already going out?",
    "a": "Press Stop sending while it is sending. Anyone already emailed stays emailed."
   }
  ],
  "related": [
   "campaigns",
   "tag-library",
   "email-sending-setup",
   "resend-a-single-email",
   "contacts"
  ],
  "who": "Everyone. Team members need the Campaigns area. Email sending must be set up before anything goes out.",
  "keywords": [
   "broadcast",
   "newsletter",
   "one time email",
   "email blast",
   "email my list",
   "send to a tag",
   "schedule email",
   "email everyone",
   "mass email"
  ],
  "sections": [
   {
    "id": "after-a-broadcast",
    "title": "After it goes out",
    "body": "An open broadcast shows how many were sent, waiting, failed and skipped. People · who this went to lists each person, their status and when.",
    "keywords": [
     "sent",
     "failed",
     "skipped",
     "who got it",
     "recipients"
    ]
   }
  ]
 },
 {
  "id": "events",
  "name": "Events",
  "area": "Marketing",
  "where": "Marketing > Events",
  "href": "/events",
  "what": "Run a live event or a multi-day challenge with its own sign-up page in your name and color. The Suite sends the confirmation, reminders, each challenge day and your replay, and adds sign-ups to Contacts with a tag.",
  "ai": "No AI",
  "aiNote": "This page has no AI button. Your chat assistant can draft an event for you behind Approve. It never opens sign-ups. You press Open for sign-ups yourself.",
  "steps": [
   "Type a name under New event, choose Live event or Challenge, and press Create.",
   "Fill in The page, then your date, time and join link, or your challenge days. Press Save.",
   "For a challenge, write Each day and press Save the days.",
   "Press Open for sign-ups, then Copy sign-up link and share it.",
   "After a live event, press Attended or Missed beside each person.",
   "Add your Replay link and press Email the replay to everyone."
  ],
  "health": "Someone new to your contacts counts as a new contact in your Customer Acquisition pillar for 30 days. The event itself and attendance do not change your scores.",
  "tips": [
   "Use your own join link from Zoom, Meet, Teams or any other service.",
   "Choose a Follow-up campaign. It starts when the replay goes out, or when a challenge ends.",
   "Press Open the page to see what people will see."
  ],
  "questions": [
   {
    "q": "What emails go out, and from whom?",
    "a": "A confirmation with add-to-calendar links, then reminders the day before and one hour before. They come from your own address, through your own Resend account, so set up email sending first."
   },
   {
    "q": "How do tags work on an event?",
    "a": "Everyone who signs up gets a registered tag with your event's web address in it. Attended and Missed add their own tags. Extra tags for sign-ups adds yours too."
   },
   {
    "q": "When does a challenge start?",
    "a": "On the date you set for Day 1. If you leave it empty, each person starts the day after they join."
   }
  ],
  "related": [
   "landing-pages",
   "campaigns",
   "email-sending-setup",
   "invite-tracker",
   "contacts",
   "tag-library"
  ],
  "who": "Everyone. Team members need the Contacts area. Email sending must be set up for the emails to go out.",
  "keywords": [
   "event",
   "webinar",
   "workshop",
   "masterclass",
   "challenge",
   "live event",
   "sign up page",
   "registration",
   "replay",
   "reminder emails",
   "attended",
   "zoom link"
  ],
  "sections": [
   {
    "id": "live-events",
    "title": "Live events",
    "body": "Set the date, time, length and your join link. You can add a Seat limit. When it is over, mark who came with Attended or Missed.",
    "keywords": [
     "webinar",
     "workshop",
     "seat limit",
     "attended",
     "missed"
    ]
   },
   {
    "id": "challenges",
    "title": "Challenges",
    "body": "Set the number of days and the daily email time. Each day goes out by email and opens on each person's private challenge page, where they tick it off.",
    "keywords": [
     "challenge",
     "daily email",
     "challenge page",
     "tick off"
    ]
   },
   {
    "id": "event-replay",
    "title": "Replay and follow-up",
    "body": "Add your replay link and how many hours it stays open. Leave the hours empty for no limit. If you set a limit, people who got the replay get a reminder about 12 hours before it closes.",
    "keywords": [
     "replay",
     "video",
     "deadline",
     "follow-up"
    ]
   }
  ]
 },
 {
  "id": "landing-pages",
  "name": "Landing Pages",
  "area": "Marketing",
  "where": "Marketing > Landing Pages",
  "href": "/landing-pages",
  "what": "Simple branded pages built on your own forms, events, offers and booking pages. Pick a template, fill in the words with a live preview, and publish. Each page counts its visits and how many people took action.",
  "ai": "Has an AI button",
  "aiNote": "Draft the words has your assistant write from your form, event, offer or booking page and your notes, using your own AI key. Nothing changes until you press Use on a part or Use all, then Save. It never makes up results or testimonials. Your chat assistant can also draft a page behind Approve, but you press Publish yourself.",
  "steps": [
   "Type a Page name if you like, then press a template under Make a new page.",
   "Under Basics, choose the form, event, offer or booking page it uses.",
   "Press Draft the words, or type your own words under Words. Press Use on the parts you want.",
   "Set your Look and add testimonials if you like, then press Save.",
   "Press Preview to check it, then press Publish.",
   "Back on All landing pages, press Copy beside the link and share it."
  ],
  "health": "A new person who signs up through an opt-in or event page counts as a new contact in your Customer Acquisition pillar for 30 days. The page itself and its visits do not change your scores.",
  "tips": [
   "Running Facebook or Instagram ads? Paste your Meta pixel ID under Ads tracking.",
   "Press Duplicate to start a new page from one that works.",
   "If you have a verified short-link domain, your page also opens on your own domain."
  ],
  "questions": [
   {
    "q": "Why does my page say something is missing?",
    "a": "Each template needs its piece: a form, an event, an offer with a payment link or a pasted Buy link, or a booking page. Choose it under Basics."
   },
   {
    "q": "What does Unpublish do?",
    "a": "It takes the page down, and the link stops working until you publish again. Archive also takes it offline and moves it to Archived, where you can press Restore as draft."
   },
   {
    "q": "Which testimonials can I pick from?",
    "a": "Approved or featured ones from your Testimonials page that the person agreed to share. You can also type one in."
   }
  ],
  "related": [
   "forms",
   "events",
   "offers-packages",
   "calendars-and-booking-pages",
   "testimonials",
   "short-links"
  ],
  "who": "Everyone. Team members need the Contacts area.",
  "keywords": [
   "landing page",
   "sales page",
   "opt in page",
   "freebie page",
   "webinar page",
   "book a call page",
   "funnel",
   "meta pixel",
   "conversion rate",
   "website page",
   "publish a page"
  ],
  "sections": [
   {
    "id": "landing-templates",
    "title": "The four templates",
    "body": "Opt-in uses a form, and sign-ups get that form's tags and campaign. Webinar or event registers people for one of your Events. Sales page sends buyers to your payment link. Book a call shows your open times on the page. Paid booking pages show a button instead.",
    "keywords": [
     "opt-in",
     "webinar",
     "sales page",
     "book a call",
     "template"
    ]
   },
   {
    "id": "landing-numbers",
    "title": "Visits and rate",
    "body": "Each page shows visits, what it counts (sign-ups, registrations, Buy clicks or bookings) and your rate, for the last 30 days and all time.",
    "keywords": [
     "visits",
     "conversions",
     "rate",
     "stats"
    ]
   }
  ]
 },
 {
  "id": "testimonials",
  "name": "Testimonials",
  "area": "Marketing",
  "where": "Marketing > Testimonials",
  "href": "/reviews",
  "what": "Ask your clients for a few words, approve what comes in, and reuse it in your marketing. Each client gets a personal link. Their review lands here as Pending until you act on it.",
  "ai": "Has an AI button",
  "aiNote": "Draft with my assistant writes your request note, and Read my testimonials shows what clients value and what proof is missing. Both use your own AI key. The note stays in the box for you to edit, and nothing is sent.",
  "steps": [
   "Press Request a review and type their name. Add what you worked on if you like.",
   "Write your note, or press Draft with my assistant, then press Create link.",
   "Under Requests you've sent, press Copy message + link and send it yourself.",
   "When a review comes in, press Approve, Feature or Hide.",
   "On an approved review, press Copy or Make a post to reuse it."
  ],
  "health": "The number of testimonials you have feeds your Referral Process pillar. That part reaches full marks at five.",
  "tips": [
   "Add one I received saves praise you already have. Tick the box if they said you can share it.",
   "Only reviews you approve or feature are used in your marketing or shared with your assistant.",
   "Add their email on the request and you get a one-click way to email the link yourself."
  ],
  "questions": [
   {
    "q": "Does the Suite email the request for me?",
    "a": "No. Nothing is sent from here. You get a personal link and a message to send yourself, by email or however you talk to them."
   },
   {
    "q": "What does my client have to do?",
    "a": "They open the link, leave a rating and their story, and can add a video or audio link. They must tick the box saying you may share it."
   },
   {
    "q": "What does Make a post do?",
    "a": "It opens Create content on your Content Calendar with the quote and their name already in the caption."
   }
  ],
  "related": [
   "content-calendar",
   "landing-pages",
   "client-care",
   "marketing-plan",
   "contacts"
  ],
  "who": "Everyone. Team members need the Testimonials area.",
  "keywords": [
   "testimonial",
   "review",
   "request a review",
   "ask for a review",
   "client feedback",
   "social proof",
   "star rating",
   "feature a review",
   "approve a review",
   "review link"
  ],
  "sections": [
   {
    "id": "review-collection-page",
    "title": "Your review link",
    "body": "Each request gets its own personal link. Your client sees a simple form for a star rating, a headline, their experience and an optional video or audio link, with a box to agree to sharing.",
    "keywords": [
     "review link",
     "collection page",
     "personal link",
     "rating",
     "consent"
    ]
   },
   {
    "id": "request-tracking",
    "title": "Requests you've sent",
    "body": "Each request shows whether it was sent, opened or completed. The cards at the top show your response rate and average rating.",
    "keywords": [
     "requests",
     "opened",
     "completed",
     "response rate"
    ]
   }
  ]
 },
 {
  "id": "links-forms",
  "name": "Links & Forms",
  "area": "Marketing",
  "where": "Marketing > Links & Forms",
  "href": "/links-directory",
  "what": "Every link and form in your account in one place: your offers' checkout links, booking pages, forms and short links. It fills in as you create them. Search it, copy a link or open it.",
  "ai": "No AI",
  "aiNote": "This page does not use AI.",
  "steps": [
   "Open Links & Forms from the left menu.",
   "Type in the search box to find a link.",
   "Press Copy beside it to share it, or Open to see the page.",
   "If a section is empty, press its link to create your first one."
  ],
  "health": "This page does not change your scores. It saves you hunting for the right link.",
  "tips": [
   "A form's row shows its tags and which campaign it starts.",
   "A short link's row shows where it goes and how many clicks it has.",
   "Offers with no link yet are named under the offers list, so you can see what to fix."
  ],
  "questions": [
   {
    "q": "Why is one of my offers missing from the list?",
    "a": "Only offers with a saved checkout link are listed. Add the link on the offer in Offers & Packages."
   },
   {
    "q": "Can I edit a link here?",
    "a": "No. This page only lists them. Change a link where it lives: Offers & Packages, Calendars, Forms or Short Links."
   },
   {
    "q": "What does off beside a form or booking page mean?",
    "a": "That form or booking page is turned off in your account."
   }
  ],
  "related": [
   "short-links",
   "forms",
   "offers-packages",
   "calendars-and-booking-pages",
   "landing-pages"
  ],
  "who": "Everyone. Team members need the Contacts area.",
  "keywords": [
   "links",
   "forms",
   "my links",
   "all my links",
   "checkout link",
   "booking link",
   "form link",
   "copy link",
   "where is my link"
  ]
 },
 {
  "id": "short-links",
  "name": "Short Links",
  "area": "Marketing",
  "where": "Marketing > Short Links",
  "href": "/short-links",
  "what": "Turn a long web address into a short link for a bio, a slide or a text message. Every click is counted, each link has a QR code, and you can repoint or turn off a link any time without changing it where you shared it.",
  "ai": "No AI",
  "aiNote": "This page does not use AI.",
  "steps": [
   "Press New short link.",
   "Paste the address under Where it should go.",
   "Add What it's for, and a Custom code if you want one.",
   "Press Create link.",
   "Copy the link and share it. Use the QR code button for a code you can download."
  ],
  "health": "Short Links do not change your scores. They show you which places bring people in.",
  "tips": [
   "Set up Your short-link domain so people see your address instead of lccommandsuite.com.",
   "Leave Custom code blank and one is made for you.",
   "If you delete a link, anyone who has it lands on a not found page. Turn it off instead if you may want it back."
  ],
  "questions": [
   {
    "q": "How do I see my clicks?",
    "a": "Press View clicks on a link. It shows the last 30 days and where clicks came from. The total on the card is always exact."
   },
   {
    "q": "How do I use my own domain?",
    "a": "Open Your short-link domain, type a domain like go.yourbusiness.com, and add the record it shows at your domain provider. DNS changes can take a few minutes to a few hours."
   },
   {
    "q": "Can I change where a link goes?",
    "a": "Yes. Press Edit and change Where it should go. The short link stays the same."
   }
  ],
  "related": [
   "links-forms",
   "landing-pages",
   "offers-packages"
  ],
  "who": "Everyone. Team members need the Contacts area.",
  "keywords": [
   "short link",
   "link shortener",
   "qr code",
   "branded link",
   "click tracking",
   "custom domain",
   "shorten a url",
   "link in bio"
  ],
  "sections": [
   {
    "id": "short-link-domain",
    "title": "Your short-link domain",
    "body": "Point your own domain or subdomain at your short links. Until then your links use lccommandsuite.com/l/.",
    "keywords": [
     "domain",
     "subdomain",
     "dns",
     "own domain"
    ]
   },
   {
    "id": "qr-codes",
    "title": "QR codes",
    "body": "Press the QR code button on a link and press Download PNG.",
    "keywords": [
     "qr",
     "qr code",
     "download png"
    ]
   }
  ]
 },
 {
  "id": "invite-tracker",
  "name": "Invite Tracker",
  "area": "Marketing",
  "where": "Marketing > Invite Tracker",
  "href": "/invites",
  "what": "See who you invited, whether the invite went out, and who registered and when. Each list is built from a tag, so anyone in Contacts with that tag shows up.",
  "ai": "No AI",
  "aiNote": "This page does not use AI.",
  "steps": [
   "Press New invite list.",
   "Fill in the event name and invite tag, then choose your Sign-up form and Invite campaign. Press Create.",
   "Under Invite people, choose Send them the invite email or I already invited them myself.",
   "Add a name and email, or press Or paste a list of people.",
   "Watch the Invited, Invite sent and Registered counts, and press Download CSV for a copy."
  ],
  "health": "A new person you add counts as a new contact in your Customer Acquisition pillar for 30 days. The list itself does not change your scores.",
  "tips": [
   "Build the invite first in Campaigns & Broadcasts: one email with a button to your sign-up form.",
   "Link a sign-up form, or registrations cannot be tracked.",
   "Registered without an invite shows people who signed up but were not on your list."
  ],
  "questions": [
   {
    "q": "Why haven't my invites gone out?",
    "a": "If your invite campaign is off, invites wait until you turn it on in Campaigns & Broadcasts. A note on the page tells you."
   },
   {
    "q": "What does I already invited them myself do?",
    "a": "No email is sent. They are added to the list and marked Invite sent right away."
   },
   {
    "q": "Does removing someone delete them?",
    "a": "No. It takes off the invite tag. They stay in Contacts."
   }
  ],
  "related": [
   "campaigns",
   "forms",
   "tag-library",
   "events",
   "contacts"
  ],
  "who": "Everyone. Team members need the Contacts area. Sending invites needs email sending set up.",
  "keywords": [
   "invite",
   "invite list",
   "invite tracker",
   "who registered",
   "guest list",
   "rsvp",
   "track invites",
   "download csv"
  ],
  "sections": [
   {
    "id": "invite-list-settings",
    "title": "List settings",
    "body": "Press List settings to change the invite campaign or which tags make up the list. Anyone in Contacts with a highlighted tag shows on it. Changing this sends no email.",
    "keywords": [
     "list settings",
     "invite tag",
     "change tags"
    ]
   }
  ]
 },
 {
  "id": "meta-lead-ads",
  "name": "Meta Lead Ads",
  "area": "Marketing",
  "where": "Marketing > Meta Lead Ads",
  "href": "/meta-leads",
  "what": "Send every Facebook or Instagram lead form straight into your Suite. Your own private address and your own free Make account pass each lead along. Each lead becomes a tagged contact, and can get a card in the pipeline you pick.",
  "ai": "No AI",
  "aiNote": "This page does not use AI.",
  "steps": [
   "Scroll to Lead capture and copy your private address under Your address.",
   "Under Add new leads to this pipeline, choose a pipeline, or Contacts only.",
   "Follow Set it up in Make on the page, using your own free Make account.",
   "Test it with Meta's Lead Ads Testing Tool, as the steps show.",
   "Turn your Make scenario on so it reads Active.",
   "Check Latest leads to see each lead arrive."
  ],
  "health": "Each lead who is new to your contacts counts as a new contact in your Customer Acquisition pillar for 30 days. Nothing else on this page changes your scores.",
  "tips": [
   "Keep your address private. Anyone who has it can add contacts to your account.",
   "If Make is ever down, download your leads from Meta's Leads Center and use Upload leads from a file.",
   "You need to be an admin of the Facebook Page your ads run from."
  ],
  "questions": [
   {
    "q": "What tags does a lead get?",
    "a": "The tag lead-meta-ad, plus a tag with that ad's own name."
   },
   {
    "q": "Why does my test lead say test?",
    "a": "Meta's test leads show in Latest leads with the status test. They never become contacts."
   },
   {
    "q": "Can I use Zapier instead of Make?",
    "a": "Yes. It works the same way: a Facebook Lead Ads trigger, then Webhooks by Zapier, POST, to the same address."
   }
  ],
  "related": [
   "meta-ads-weekly-report",
   "outreach-pipelines",
   "contacts",
   "tag-library",
   "landing-pages"
  ],
  "who": "Everyone. Team members need the Outreach area. You need your own free Make account.",
  "keywords": [
   "meta",
   "facebook ads",
   "instagram ads",
   "lead ads",
   "lead form",
   "make.com",
   "zapier",
   "leads center",
   "linkedin lead form",
   "upload leads"
  ],
  "sections": [
   {
    "id": "linkedin-lead-forms",
    "title": "LinkedIn lead forms",
    "body": "People who fill in a LinkedIn Lead Gen Form can arrive the same way. Use the separate address on the page and your own Make account. They are tagged lead-linkedin-form plus the form's own tag.",
    "keywords": [
     "linkedin",
     "lead gen form",
     "lead-linkedin-form"
    ]
   },
   {
    "id": "upload-leads-from-a-file",
    "title": "Upload leads from a file",
    "body": "A backup for when Make is down. Download your leads from Meta's Leads Center and add the file here.",
    "keywords": [
     "upload leads",
     "csv",
     "leads center",
     "file"
    ]
   }
  ]
 },
 {
  "id": "client-portals",
  "name": "Client Portals",
  "area": "Client Delivery",
  "where": "Client Delivery > Client Portals",
  "href": "/client-portals",
  "what": "Give each client a private page in your own name and logo. It shows their sessions left, upcoming bookings, invoices to pay, session notes you share, homework, goals, files and messages. There is no password. The private link is the key.",
  "ai": "No AI",
  "aiNote": "This page has no AI button. Your chat assistant can tell you how a portal stands, and can add homework or a goal behind Approve. Nothing is emailed when it does.",
  "steps": [
   "Under Add a client, type a name or email and press Open.",
   "Press the Create button for their portal.",
   "Add a package, homework, goals or files in the sections below.",
   "Press See what they see to check it.",
   "Press Email them the link, or Copy link and send it yourself."
  ],
  "health": "Client Portals do not change your scores. They give each client one place for everything you are doing together.",
  "tips": [
   "Add a note in Note at the top of their portal to make it feel personal.",
   "Press Use as my default for new portals once you love a look.",
   "Sections with nothing in them stay out of sight on their own."
  ],
  "questions": [
   {
    "q": "How does a session get used?",
    "a": "One is used when you mark their booking Attended in Calendars. Use the minus and plus buttons to adjust it by hand."
   },
   {
    "q": "What if a client loses their link?",
    "a": "They can go to lccommandsuite.com/portal, enter their email and get their private link. You can also press New link. The old one then stops working, so email them the new one."
   },
   {
    "q": "Which session notes do they see?",
    "a": "Only LC Volant notes you choose to share. Private notes and drafts never show."
   }
  ],
  "related": [
   "lc-volant",
   "calendars-and-booking-pages",
   "payments-invoices",
   "courses-memberships",
   "contact-record",
   "email-sending-setup"
  ],
  "who": "Everyone. Team members need the Contacts area. Emailing links and messages needs email sending set up.",
  "keywords": [
   "client portal",
   "portal",
   "private page",
   "client page",
   "homework",
   "client goals",
   "sessions left",
   "package",
   "share files",
   "client messages",
   "lost link"
  ],
  "sections": [
   {
    "id": "packages-and-sessions",
    "title": "Packages and sessions",
    "body": "Add a package with its number of sessions and an optional Use by date. Choose which calendars count, or leave them all unticked for any.",
    "keywords": [
     "package",
     "sessions",
     "use by",
     "sessions left"
    ]
   },
   {
    "id": "portal-messages-and-files",
    "title": "Messages and files",
    "body": "You and your client can write to each other here, and each side gets an email. Both of you can share files and links.",
    "keywords": [
     "messages",
     "files",
     "links",
     "share a file"
    ]
   },
   {
    "id": "portal-look",
    "title": "How their portal looks",
    "body": "Press Customize to set the colors, font style, heading, logo, banner and which sections show, with their names and order.",
    "keywords": [
     "customize",
     "colors",
     "logo",
     "banner",
     "sections"
    ]
   }
  ]
 },
 {
  "id": "courses-memberships",
  "name": "Courses & Memberships",
  "area": "Client Delivery",
  "where": "Client Delivery > Courses & Memberships",
  "href": "/programs",
  "what": "Build courses, memberships and group programs right here. Lessons sit in modules and open on a schedule, and members use them inside their own client portal. You see each member's progress.",
  "ai": "No AI",
  "aiNote": "This page has no AI button. Your chat assistant can draft a course with its modules and lessons, add lessons and add a member, all behind Approve. It never emails your members.",
  "steps": [
   "Under Make a new, choose Self-paced course, Membership or Group program.",
   "Type a Name and press Create.",
   "Fill in the details, choose an offer under Sold as if you sell it, and press Save details.",
   "Add your lessons under Lessons, with a module, text, video, link or file.",
   "Under Members, find a person, tick the email box if you want, and press Add."
  ],
  "health": "Courses and memberships do not change your scores. They help you deliver your work to many people at once.",
  "tips": [
   "Choose an offer under Sold as and buyers join on their own.",
   "On a self-paced course, set Opens after to release a lesson that many days after someone joins.",
   "Moving from another platform? Press Bring your buyers over at the top of the page."
  ],
  "questions": [
   {
    "q": "Where do my members see it?",
    "a": "In their own client portal. A member needs their portal link, so use Email link beside their name."
   },
   {
    "q": "What happens when a membership payment is cancelled?",
    "a": "Access ends on its own."
   },
   {
    "q": "What does Archive do?",
    "a": "Members no longer see it. You can turn it back on later."
   }
  ],
  "related": [
   "client-portals",
   "bring-your-buyers-over",
   "offers-packages",
   "lc-volant",
   "payment-links-on-offers"
  ],
  "who": "Everyone. Team members need the Contacts area.",
  "keywords": [
   "course",
   "membership",
   "group program",
   "cohort",
   "lessons",
   "modules",
   "drip",
   "online course",
   "students",
   "members",
   "progress"
  ],
  "sections": [
   {
    "id": "self-paced-courses",
    "title": "Self-paced courses",
    "body": "People start any time, and each lesson can open a set number of days after they join. You can add a Not before date and an access length in days. Members press Mark complete, see a progress bar and get your finish message.",
    "keywords": [
     "self-paced",
     "drip",
     "access length",
     "progress bar",
     "mark complete"
    ]
   },
   {
    "id": "memberships",
    "title": "Memberships",
    "body": "Ongoing access to a growing library for as long as they are a member. A finished payment plan does not end access.",
    "keywords": [
     "membership",
     "subscription",
     "ongoing",
     "library"
    ]
   },
   {
    "id": "group-programs",
    "title": "Group programs",
    "body": "Run a group with dated lessons, Sessions with join links, Group homework each member ticks off, and shared LC Volant group notes. Private notes and drafts never show.",
    "keywords": [
     "group program",
     "cohort",
     "sessions",
     "group homework"
    ]
   },
   {
    "id": "group-conversation",
    "title": "Group conversation",
    "body": "Members can post and reply, showing first names only. As host you can post, reply, pin or delete, or turn the conversation off.",
    "keywords": [
     "group conversation",
     "community",
     "feed",
     "posts"
    ]
   }
  ]
 },
 {
  "id": "bring-your-buyers-over",
  "name": "Bring your buyers over",
  "area": "Client Delivery",
  "where": "Client Delivery > Courses & Memberships > Bring your buyers over",
  "href": "/course-bridge",
  "what": "Still selling on another platform while you move your courses into the Suite? Connect it here and every sale lands in your Suite: the buyer in Contacts with tags, the money in Finance, a follow-up campaign, and a seat in the matching Suite course.",
  "ai": "No AI",
  "aiNote": "This page does not use AI.",
  "steps": [
   "Open Courses & Memberships and press Bring your buyers over.",
   "Under Connect a platform, choose yours and press Connect.",
   "Press Copy and paste your address into the platform, using the steps shown on the card.",
   "Press Send a test sale to check it. It uses a test buyer named Eloise, and no money moves.",
   "Under Products, choose what happens for each product and press Save."
  ],
  "health": "A sale you record as income counts as income in your Finance dimension. A buyer who is new to your contacts counts as a new contact in your Customer Acquisition pillar for 30 days.",
  "tips": [
   "A product shows under Products after its first sale or test sale.",
   "Keep your address private. Anyone with it can send sales to your account.",
   "On Payhip, add your Payhip API key so unsigned messages are refused."
  ],
  "questions": [
   {
    "q": "Which platforms can I connect?",
    "a": "Payhip, Kajabi, Teachable and Thinkific, or any platform through Zapier or Make. Kajabi needs its Growth or Pro plan, and Teachable its Growth plan or higher."
   },
   {
    "q": "What happens when a buyer gets a refund?",
    "a": "The income comes back out, they get a refunded tag, and they lose the seat in the Suite course."
   },
   {
    "q": "What happens when a subscription is cancelled?",
    "a": "They get a cancelled tag and the matching Suite membership ends."
   }
  ],
  "related": [
   "courses-memberships",
   "contacts",
   "income",
   "campaigns",
   "tag-library"
  ],
  "who": "Everyone. Team members need the Contacts area.",
  "keywords": [
   "kajabi",
   "teachable",
   "thinkific",
   "payhip",
   "zapier",
   "make",
   "course platform",
   "move my courses",
   "import buyers",
   "bridge",
   "webhook"
  ],
  "sections": [
   {
    "id": "bridge-products",
    "title": "Products",
    "body": "Every buyer is tagged customer, with tags for the platform and the product. For each product you can add extra tags, start a campaign, give a seat in a Suite course and record the sale as income.",
    "keywords": [
     "products",
     "tags",
     "start a campaign",
     "seat",
     "record income"
    ]
   },
   {
    "id": "recent-sales",
    "title": "Recent sales",
    "body": "A list of what has come in. Each message is handled once, so a repeat from the platform is ignored.",
    "keywords": [
     "recent sales",
     "repeat",
     "history"
    ]
   }
  ]
 },
 {
  "id": "client-care",
  "name": "Client Care",
  "area": "Client Delivery",
  "where": "Client Delivery > Client Care",
  "href": "/client-care",
  "what": "Stay close to your clients without having to remember to. A 30-day check-in, a quarterly pulse, an exit survey, and a task for you when a client goes quiet. Everything is written and switched off until you turn it on.",
  "ai": "No AI",
  "aiNote": "This page does not use AI. Your chat assistant can tell you which pieces are on and which clients have gone quiet. It cannot switch them on or off.",
  "steps": [
   "Open Client Care. If a note says email sending is not set up, press Set up email sending.",
   "Tag your clients client or customer in Contacts. Payments through the Suite add customer on their own.",
   "Press Read or edit the email on a piece and make it sound like you.",
   "Turn on the switch for each piece you want.",
   "When someone stops working with you, tag them former-client to send the exit survey."
  ],
  "health": "Each email piece you switch on is a campaign that is turned on, so it counts toward your Communication pillar. The quiet-client tasks do not change your scores.",
  "tips": [
   "Preview the form opens each check-in form as your client sees it.",
   "Choose a booking page for the third quiet-client note, or leave it off and they reply instead.",
   "You can switch pieces on before email sending is ready. The emails wait until it is."
  ],
  "questions": [
   {
    "q": "What counts as going quiet?",
    "a": "No bookings, payments, emails or notes for 2 weeks. You get a task to reach out personally. Nothing is emailed on its own, but you can start the 3 quiet-client notes yourself."
   },
   {
    "q": "Who are these emails from?",
    "a": "From your own address, through your own Resend account, with your own sign-off."
   },
   {
    "q": "Can a client get these twice?",
    "a": "Someone gets each email once, and the quarterly pulse once a quarter. Unsubscribed contacts are always skipped, and former clients never get the check-ins."
   }
  ],
  "related": [
   "contacts",
   "tag-library",
   "campaigns",
   "forms",
   "email-sending-setup",
   "testimonials"
  ],
  "who": "Everyone. Team members need the Contacts area. Email sending must be set up for the emails to go out.",
  "keywords": [
   "client care",
   "check-in",
   "30 day check in",
   "quarterly pulse",
   "exit survey",
   "quiet client",
   "client retention",
   "former client",
   "stay in touch"
  ],
  "sections": [
   {
    "id": "thirty-day-check-in",
    "title": "30-day check-in",
    "body": "30 days after someone becomes a client, one email with a short form on what's working, what's hard, whether a call would help, and a testimonial ask.",
    "keywords": [
     "30 day",
     "check-in"
    ]
   },
   {
    "id": "quarterly-pulse",
    "title": "Quarterly pulse",
    "body": "Every 90 days while they are a client, one email with three quick questions.",
    "keywords": [
     "quarterly",
     "pulse",
     "90 days"
    ]
   },
   {
    "id": "exit-survey",
    "title": "Exit survey",
    "body": "When you tag someone former-client, they get a warm thank-you with a short survey.",
    "keywords": [
     "exit survey",
     "former-client",
     "offboarding"
    ]
   },
   {
    "id": "quiet-clients",
    "title": "Quiet clients",
    "body": "A task for you when a client has gone quiet for 2 weeks, plus 3 ready notes you can start yourself.",
    "keywords": [
     "quiet",
     "gone quiet",
     "task",
     "reach out"
    ]
   }
  ]
 },
 {
  "id": "resend-a-single-email",
  "name": "Resend a single email",
  "area": "Marketing",
  "where": "Marketing > Campaigns & Broadcasts",
  "href": "/sequences-manager",
  "what": "Send one email again, right now, to one person, without changing anyone's schedule. You can do this from a campaign or from a broadcast that has gone out.",
  "ai": "No AI",
  "aiNote": "This does not use AI.",
  "steps": [
   "Open Campaigns & Broadcasts and open your campaign or broadcast.",
   "In a campaign, open the People tab and press the resend icon beside the person.",
   "Choose the email and press Send now.",
   "Or on the campaign's Emails tab, open Who got this email and press Resend.",
   "In a broadcast that has gone out, type a name under Resend to one person."
  ],
  "health": "Resending an email does not change your scores. It helps when someone missed one or joined late.",
  "tips": [
   "On a campaign's Emails tab, the person-plus icon sends an email to any address. They are not added to the campaign.",
   "A broadcast's failed list has a Resend button beside each address that failed.",
   "Use this for someone who joined after a broadcast went out."
  ],
  "questions": [
   {
    "q": "Will this move them along in the campaign?",
    "a": "No. Nobody's schedule changes."
   },
   {
    "q": "Why was my resend refused?",
    "a": "That person has unsubscribed, so they cannot be emailed."
   }
  ],
  "related": [
   "campaigns",
   "broadcasts",
   "email-sending-setup",
   "contact-record"
  ],
  "who": "Everyone. Team members need the Campaigns area. Email sending must be set up.",
  "keywords": [
   "resend",
   "send again",
   "resend email",
   "missed email",
   "didn't get my email",
   "send to one person",
   "email one person"
  ],
  "sections": [
   {
    "id": "resend-from-a-campaign",
    "title": "From a campaign",
    "body": "Resend to someone in it from the People tab, send to anyone by address with the person-plus icon, or use each email's Who got this email list.",
    "keywords": [
     "campaign",
     "people tab",
     "who got this email",
     "send to someone"
    ]
   },
   {
    "id": "resend-from-a-broadcast",
    "title": "From a broadcast",
    "body": "Once it has gone out, send it to any contact with Resend to one person, or to anyone who failed.",
    "keywords": [
     "broadcast",
     "resend to one person",
     "failed"
    ]
   }
  ]
 },
 {
  "id": "meta-ads-weekly-report",
  "name": "Meta Ads weekly report",
  "area": "Marketing",
  "where": "Marketing > Meta Lead Ads, at the top of the page",
  "href": "/meta-leads",
  "what": "Upload the file you export from Ads Manager and see how each ad is doing: what to keep, pause or stop and why, what each lead costs, and what the same spending would bring in a week, a month and a quarter.",
  "ai": "No AI",
  "aiNote": "This report does not use AI. The verdicts come from fixed rules and your own answers.",
  "steps": [
   "In Ads Manager, open the Ads tab and set your dates, for example Last 7 days.",
   "Next to Columns, choose Performance and clicks. Use the download arrow, then Export table data, as .csv.",
   "On Meta Lead Ads, under Add this week's numbers, choose that file.",
   "Answer Guided questions: decide your next step and save.",
   "Read your verdicts under Each ad and What to do with each ad, and why."
  ],
  "health": "This report does not change your scores. It helps you decide where your ad money goes.",
  "tips": [
   "Judge trends over a week or more. Meta can still adjust the last few days.",
   "The report rebuilds every time you add an export.",
   "Mondays you get a reminder that says your report is ready or asks for a new export."
  ],
  "questions": [
   {
    "q": "What do the verdicts mean?",
    "a": "Give it more, Keep going, Watch, Pause or Stop. Each ad's reason is written in plain words beside it, and is judged against your yardstick."
   },
   {
    "q": "What is my yardstick?",
    "a": "The cost per lead each ad is measured against. It comes from your target, your break-even, or the campaign's own average until you set one."
   },
   {
    "q": "Where do the numbers after the click come from?",
    "a": "From your own contacts in the Suite. They show who registered, showed up, booked and became a client, with the ad spend for each step."
   }
  ],
  "related": [
   "meta-lead-ads",
   "events",
   "budget-planner",
   "contacts",
   "reminders"
  ],
  "who": "Everyone. Team members need the Outreach area.",
  "keywords": [
   "meta ads report",
   "facebook ads report",
   "weekly report",
   "ads manager",
   "cost per lead",
   "ad verdict",
   "which ad is working",
   "ad spend",
   "export csv",
   "guided questions"
  ],
  "sections": [
   {
    "id": "ad-verdicts",
    "title": "Ad verdicts",
    "body": "For each ad you see spend, seen, link clicks, click rate, leads, cost per lead, share of leads and a verdict with its reason.",
    "keywords": [
     "verdict",
     "pause",
     "stop",
     "cost per lead"
    ]
   },
   {
    "id": "ad-projections",
    "title": "If cost per lead stays the same",
    "body": "What the same daily spending would cost and bring in over a week, a month and a quarter, with a note if you would reach your monthly limit.",
    "keywords": [
     "projection",
     "monthly limit",
     "forecast"
    ]
   },
   {
    "id": "guided-questions",
    "title": "Guided questions",
    "body": "Thirteen questions set your yardstick, such as your goal, what a client is worth and your budget. Notes appear under What your answers say.",
    "keywords": [
     "guided questions",
     "yardstick",
     "target",
     "what your answers say"
    ]
   },
   {
    "id": "event-sign-up-counts",
    "title": "Events held on a schedule",
    "body": "If your event repeats every week, every other week or every four weeks, sign-ups are counted for each event on its own and start again at zero after each one. A table shows every event, with a total for each month.",
    "keywords": [
     "sign-ups",
     "recurring event",
     "count",
     "each month"
    ]
   }
  ]
 }
];
