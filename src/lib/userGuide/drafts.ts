import type { GuideEntry } from "./types";

// The batch waiting for Babs on a review page, written there by /api/user-guide/seed-review. Removed at release.
export const GUIDE_DRAFTS: GuideEntry[] = [
 {
  "id": "profile",
  "name": "Profile",
  "area": "Settings",
  "where": "Settings > Profile",
  "href": "/settings?tab=profile",
  "what": "Your own details in the Suite: your photo, name, phone, time zone and a short bio. Your sign-in email shows here too.",
  "ai": "No AI",
  "aiNote": "",
  "steps": [
   "Open Settings from the left menu. Profile opens first.",
   "Press Upload Photo and choose a picture. To replace it, press Change Photo.",
   "Fill in your Full Name, Phone and Bio.",
   "Choose your Timezone. This one saves as soon as you pick it.",
   "Press Save Changes to save your name, phone and bio."
  ],
  "health": "This does not change your scores. It keeps your name, photo and time zone right across the Suite.",
  "tips": [
   "Your photo can be up to 5MB. A square picture of 400 by 400 pixels works best.",
   "Your time zone sets your greeting, your clock and when tasks are due.",
   "Your profile photo is separate from your business logo, which lives under Settings > Workspace."
  ],
  "questions": [
   {
    "q": "How do I change the email I sign in with?",
    "a": "You cannot change it here. Write to support@lccommandsuite.com and we will help."
   },
   {
    "q": "Where did my task reminder settings go?",
    "a": "They are under Settings > Notifications."
   },
   {
    "q": "What happens to my old photo when I add a new one?",
    "a": "The new picture replaces it and the old file is removed. Press the small X on your photo to remove it altogether."
   }
  ],
  "related": [
   "notifications",
   "appearance-and-text-size",
   "security",
   "workspace-and-team"
  ],
  "who": "Everyone. Each person has their own profile.",
  "keywords": [
   "my profile",
   "photo",
   "picture",
   "headshot",
   "avatar",
   "name",
   "phone",
   "bio",
   "time zone",
   "timezone",
   "change email",
   "wrong time"
  ],
  "sections": [
   {
    "id": "profile-picture",
    "title": "Profile picture",
    "body": "Your saved picture stays on the Profile tab after you reload the page. Replacing it removes the old file, and the X on the photo removes it.",
    "keywords": [
     "profile picture",
     "photo",
     "avatar",
     "remove photo",
     "change photo"
    ]
   }
  ]
 },
 {
  "id": "workspace-and-team",
  "name": "Workspace and team",
  "area": "Settings",
  "where": "Settings > Workspace",
  "href": "/settings?tab=workspace",
  "what": "Your business details and your team in one place. Set your name, logo, website and social links, then invite people, choose their roles and see what they have been doing.",
  "ai": "No AI",
  "aiNote": "Team members run AI on the account owner's key. The owner can set a monthly limit for each person here.",
  "steps": [
   "Open Settings, then Workspace.",
   "Add your logo, Workspace Name, Description, Website and Social Profiles, then press Save Workspace.",
   "Under Team Members, press Add Member.",
   "Enter their email, choose Admin, Editor or Viewer, and press Send Invitation.",
   "Use Edit access on an Editor or Viewer if you want to narrow what they can reach."
  ],
  "health": "This does not change your scores. It keeps your business details in one place and lets your team help you.",
  "tips": [
   "Press Send invitation on a person's card to send it again. The link in the invitation works once and expires in 7 days.",
   "Your client portals show the logo from your first workspace.",
   "You count as one person on your team. Your plan sets how many people and workspaces you can have."
  ],
  "questions": [
   {
    "q": "What can each role do?",
    "a": "An Admin runs the account day to day and manages the team, but has no billing, connected accounts or account deletion. An Editor works on tasks, plans, content, finance and sales activity. A Viewer sees what an Editor sees and cannot change anything."
   },
   {
    "q": "Someone says their invitation never came. What do I do?",
    "a": "Press Send invitation on their card. A link appears there too, so you can copy it and send it to them yourself."
   },
   {
    "q": "Can my team see what each other has done?",
    "a": "No. Only you and your admins can see the Activity tab."
   }
  ],
  "related": [
   "team-access-limits",
   "accepting-a-team-invitation",
   "ai-assistant-setup-and-your-key",
   "billing-and-plan",
   "business-segments"
  ],
  "who": "The account owner and Admins. Editors and Viewers do not see this tab. Only the owner can set AI limits or delete a workspace.",
  "keywords": [
   "team",
   "invite",
   "add member",
   "add someone",
   "staff",
   "assistant",
   "roles",
   "admin",
   "editor",
   "viewer",
   "workspace",
   "business name",
   "logo",
   "social links",
   "website",
   "remove member",
   "activity log"
  ],
  "sections": [
   {
    "id": "your-workspace",
    "title": "Your workspaces",
    "body": "Your Workspaces lists each one with how many your plan allows. Press Create New Workspace to add one, or Set as Default Workspace to change your default. You must keep at least one.",
    "keywords": [
     "workspace",
     "default workspace",
     "new workspace",
     "second business",
     "delete workspace",
     "slug"
    ]
   },
   {
    "id": "team-roles",
    "title": "Team roles",
    "body": "Choose Admin, Editor or Viewer when you invite someone. Change it any time from the menu on their card. The Role Permissions box lists what each one can do.",
    "keywords": [
     "roles",
     "admin",
     "editor",
     "viewer",
     "permissions",
     "change role"
    ]
   },
   {
    "id": "ai-limits-per-member",
    "title": "AI limits for each person",
    "body": "Each card shows AI this month. The owner can press Set a monthly limit and enter a number of requests. Leave it blank for no limit. When someone reaches it, their AI stops until the next month.",
    "keywords": [
     "ai limit",
     "monthly limit",
     "ai cap",
     "ai use",
     "requests"
    ]
   },
   {
    "id": "team-activity",
    "title": "Team activity",
    "body": "Open the Activity tab to see who did what. Past 7 days sums up each person, and you can filter the log by Person, Area, From and To.",
    "keywords": [
     "activity",
     "activity log",
     "who did what",
     "audit",
     "history"
    ]
   }
  ]
 },
 {
  "id": "team-access-limits",
  "name": "Team access limits",
  "area": "Settings",
  "where": "Settings > Workspace > Team Members > Edit access",
  "href": "/settings?tab=workspace",
  "what": "Choose exactly what one team member can reach. Turn each area to No access, View or Edit, start from a preset, and add limits such as only their own tasks or no deleting.",
  "ai": "No AI",
  "aiNote": "This page does not use AI. If you leave the AI assistant area on for someone, the assistant acts only within the areas they have.",
  "steps": [
   "Open Settings, then Workspace, and find the person under Team Members.",
   "Press Edit access on their card.",
   "Under What they can reach, choose a preset or Custom.",
   "Set each area to No access, View or Edit.",
   "Tick any limits you want, then press Save access."
  ],
  "health": "This does not change your scores. It lets you share the work while keeping the rest of your account private.",
  "tips": [
   "Changes apply the next time they open a page.",
   "The summary on each card shows what the person can edit, what they can view and their limits.",
   "To undo it all, choose Everything their role allows and press Save access."
  ],
  "questions": [
   {
    "q": "Why is there no Edit access button for my Admin?",
    "a": "Edit access is there for Editors and Viewers only. An Admin has what the Admin role allows."
   },
   {
    "q": "What will a team member never see?",
    "a": "Billing, API keys, connected accounts and other members' details stay closed, whatever you choose here."
   },
   {
    "q": "Can I share one of My Pages without opening all of them?",
    "a": "Yes. Under My Pages, one at a time, choose View or Edit for just that page. It works even when the My Pages area is off."
   }
  ],
  "related": [
   "workspace-and-team",
   "accepting-a-team-invitation",
   "ai-assistant-setup-and-your-key"
  ],
  "who": "The account owner and Admins.",
  "keywords": [
   "permissions",
   "limit access",
   "restrict",
   "what can my team see",
   "view only",
   "hide",
   "bookkeeper",
   "virtual assistant",
   "va",
   "presets",
   "cannot delete",
   "only their own",
   "share a page"
  ],
  "sections": [
   {
    "id": "access-presets",
    "title": "Presets",
    "body": "Start from Virtual assistant, Bookkeeper, Sales, Content, Viewer, or Support & client care, then adjust any area. Changing an area makes it Custom.",
    "keywords": [
     "presets",
     "virtual assistant",
     "bookkeeper",
     "sales",
     "content",
     "support"
    ]
   },
   {
    "id": "show-only-the-areas-above",
    "title": "Show only the areas above",
    "body": "Everything else closes and leaves their menu, including Executive Home and the assistant. Settings and Help stay open.",
    "keywords": [
     "show only",
     "restrict",
     "hide menu",
     "closed"
    ]
   },
   {
    "id": "only-their-own",
    "title": "Tasks and Reminders: only their own",
    "body": "They see only the tasks and reminders that are theirs. The reminders they make are emailed to them and stay off your list and your bell.",
    "keywords": [
     "only their own",
     "own tasks",
     "own reminders",
     "private"
    ]
   },
   {
    "id": "cannot-delete",
    "title": "Cannot delete anything without your permission",
    "body": "They can add, edit and update. A delete is refused and they are asked to come to you.",
    "keywords": [
     "cannot delete",
     "no delete",
     "permission to delete"
    ]
   }
  ]
 },
 {
  "id": "notifications",
  "name": "Notifications",
  "area": "Settings",
  "where": "Settings > Notifications",
  "href": "/settings?tab=notifications",
  "what": "Choose when you hear about timed tasks, and whether the Suite emails you once a day when something needs your attention.",
  "ai": "No AI",
  "aiNote": "",
  "steps": [
   "Open Settings, then Notifications.",
   "Under Task reminders, choose how long before a timed task is due you want a reminder.",
   "Tick and by email if you also want it by email.",
   "Tick or untick the once-a-day email about things that need your attention."
  ],
  "health": "This does not change your scores. It tells you when something needs you, such as a score drop or a slipped goal.",
  "tips": [
   "Changes save as you make them. There is no Save button.",
   "Emails for sign-ups, bookings and registrations are set on each form, calendar and campaign, not here.",
   "The bell in the app keeps showing an alert until it is resolved or dismissed, even after you have been emailed about it."
  ],
  "questions": [
   {
    "q": "What is in the once-a-day email?",
    "a": "Things like a score drop, a slipped goal, a stalled pipeline or a bill coming due. Each alert is emailed once."
   },
   {
    "q": "I am new and have not had this email. Is something wrong?",
    "a": "No. It waits until your Brain, Soul and Profit assessments are done or your account is 14 days old, so your first emails are a welcome and not a to-do list."
   },
   {
    "q": "How do I stop these emails while I am away?",
    "a": "Use Pause my reminder emails under Settings > Out of office."
   }
  ],
  "related": [
   "out-of-office",
   "profile"
  ],
  "who": "Everyone. The once-a-day attention email goes to the account owner.",
  "keywords": [
   "notifications",
   "reminders",
   "task reminder",
   "email alerts",
   "stop emails",
   "turn off emails",
   "daily email",
   "too many emails",
   "alerts",
   "bell"
  ],
  "sections": [
   {
    "id": "new-client-alert-emails-held",
    "title": "New accounts",
    "body": "The once-a-day email is held until your assessments are done or your account is 14 days old.",
    "keywords": [
     "no alert email",
     "new account",
     "held",
     "assessments"
    ]
   }
  ]
 },
 {
  "id": "out-of-office",
  "name": "Out of office",
  "area": "Settings",
  "where": "Settings > Out of office",
  "href": "/settings?tab=away",
  "what": "Going away? Pick your dates once and the Suite covers for you. It can close your booking pages, answer portal messages and pause your reminder emails. Everything your clients signed up for keeps running.",
  "ai": "No AI",
  "aiNote": "You can also tell your assistant your away dates. It prepares a card and nothing changes until you press Approve. This uses your own AI key.",
  "steps": [
   "Open Settings, then Out of office.",
   "Pick your First day away and Last day away.",
   "Write a Note to clients, or leave it blank to use the standard note.",
   "Tick what you want the Suite to do while you are away.",
   "Press Set my away dates."
  ],
  "health": "This does not change your scores. It looks after your clients and quiets your reminders while you rest.",
  "tips": [
   "Your Gmail or Outlook inbox needs its own vacation responder. The Suite cannot answer email sent straight to your inbox.",
   "If you leave the note blank, clients see that you are away, the day you are back, and that you will reply then."
  ],
  "questions": [
   {
    "q": "Do my campaigns stop while I am away?",
    "a": "No. Campaigns, event emails, booking reminders and Client Care keep running."
   },
   {
    "q": "I came home early. How do I turn this off?",
    "a": "Press I'm back (turn off). Everything goes back to normal."
   },
   {
    "q": "Will a client get my note every time they message?",
    "a": "No. Each client gets it once per trip, and you still get their message."
   }
  ],
  "related": [
   "notifications",
   "what-your-assistant-can-do-for-you",
   "profile"
  ],
  "who": "The account owner and Admins. Editors and Viewers do not see this tab.",
  "keywords": [
   "out of office",
   "away",
   "vacation",
   "holiday",
   "time off",
   "auto reply",
   "autoreply",
   "close bookings",
   "block dates",
   "away message",
   "pause reminders"
  ],
  "sections": [
   {
    "id": "close-my-booking-pages",
    "title": "Close my booking pages on those dates",
    "body": "No one can book a time on those days. Your booking pages show your note.",
    "keywords": [
     "close bookings",
     "block dates",
     "booking pages",
     "no bookings"
    ]
   },
   {
    "id": "answer-portal-messages",
    "title": "Answer portal messages for me",
    "body": "A client who messages you in their portal gets your note back once per trip. You still get their message.",
    "keywords": [
     "portal",
     "auto reply",
     "client messages"
    ]
   },
   {
    "id": "pause-my-reminder-emails",
    "title": "Pause my reminder emails",
    "body": "Your daily alerts, task reminders and to-do emails stop until you are back.",
    "keywords": [
     "pause reminders",
     "stop emails",
     "quiet"
    ]
   }
  ]
 },
 {
  "id": "appearance-and-text-size",
  "name": "Appearance and text size",
  "area": "Settings",
  "where": "Settings > Appearance",
  "href": "/settings?tab=appearance",
  "what": "Make the Suite comfortable for your eyes. Choose light or dark, a colour scheme, a text size and how tightly the pages are spaced.",
  "ai": "No AI",
  "aiNote": "",
  "steps": [
   "Open Settings, then Appearance.",
   "Under Theme, press Light, Dark or System.",
   "Under Color Scheme, press LifeCharter, Sacred or Modern.",
   "Under Font Size, press Small, Medium or Large.",
   "Tick Compact mode if you want less padding and more on screen."
  ],
  "health": "This does not change your scores. It makes the Suite easier to read and use.",
  "tips": [
   "System follows the light or dark setting on your device.",
   "You can also switch between light and dark from the bottom of the left menu.",
   "Your choices save as you press them. There is no Save button."
  ],
  "questions": [
   {
    "q": "Will my text size follow me to my phone?",
    "a": "Yes. Your font size is saved to your account and follows you to other devices. Your theme, colour scheme and compact mode are saved on the device you set them on."
   },
   {
    "q": "The left menu is hard to read. Can I make it bigger?",
    "a": "Yes. The menu text follows your Font Size, so Large makes it bigger too."
   }
  ],
  "related": [
   "profile",
   "notifications"
  ],
  "who": "Everyone. Each person sets their own.",
  "keywords": [
   "dark mode",
   "light mode",
   "theme",
   "colors",
   "colours",
   "text size",
   "font size",
   "bigger text",
   "hard to read",
   "small text",
   "compact",
   "accessibility"
  ],
  "sections": [
   {
    "id": "text-size",
    "title": "Text size on every page",
    "body": "Small, Medium and Large change the text on every page, including small labels and tags. Medium is the starting size.",
    "keywords": [
     "text size",
     "font size",
     "bigger text",
     "labels"
    ]
   },
   {
    "id": "left-menu-readability",
    "title": "Left menu",
    "body": "The menu text follows your Font Size. New clients also see Getting Started pinned at the top of the menu until First 30 Days is complete.",
    "keywords": [
     "left menu",
     "menu text",
     "getting started",
     "pinned"
    ]
   },
   {
    "id": "theme",
    "title": "Theme",
    "body": "Choose Light, Dark or System here. The button at the bottom of the left menu switches between light and dark.",
    "keywords": [
     "theme",
     "dark mode",
     "light mode",
     "system"
    ]
   }
  ]
 },
 {
  "id": "ai-assistant-setup-and-your-key",
  "name": "AI Assistant setup and your key",
  "area": "Settings",
  "where": "Settings > AI Assistant",
  "href": "/settings?tab=ai",
  "what": "Connect your own AI key so your assistant comes online. Name your assistant, tell it how to reply and what to remember about you, and see everything it has prepared.",
  "ai": "No AI",
  "aiNote": "This page does not call AI itself. It is where you connect your own key, which powers every AI feature in your Suite. Without a key, your assistant stays offline.",
  "steps": [
   "Open AI Assistant under Settings in the left menu.",
   "Press Get a Claude key or Get an OpenAI key and create an API key on that company's site.",
   "Paste it into the AI key box.",
   "Add an Assistant name, how it should reply, and what it should know about you. All three are optional.",
   "Press Save AI settings, and check for Key configured under the box."
  ],
  "health": "This does not change your scores. It turns on the AI features that read your scores and plans and help you act on them.",
  "tips": [
   "An API key is different from a Claude or ChatGPT subscription, so those logins will not work here.",
   "Create a separate key just for the Command Suite so you can see exactly what it costs.",
   "Voice notes need an OpenAI key. Everything else works with either."
  ],
  "questions": [
   {
    "q": "Who pays for the AI?",
    "a": "The AI company you chose charges your own account for what you use. LifeCharter does not receive any of that charge."
   },
   {
    "q": "If I switch from OpenAI to Claude, does my assistant forget everything?",
    "a": "No. Paste the new key to replace the old one. Your conversations, assessments and plans live in your Command Suite, not with the AI company."
   },
   {
    "q": "Does my team need their own key?",
    "a": "No. Team members use your key, and you can set a monthly limit for each person under Settings > Workspace."
   }
  ],
  "related": [
   "ai-assistant",
   "what-your-assistant-can-do-for-you",
   "what-your-assistant-will-and-will-not-do",
   "workspace-and-team",
   "pop-out-assistant"
  ],
  "who": "The account owner only.",
  "keywords": [
   "ai key",
   "api key",
   "openai",
   "claude",
   "anthropic",
   "chatgpt",
   "connect ai",
   "assistant offline",
   "needs a key",
   "name my assistant",
   "instructions",
   "what does ai cost",
   "sidekick"
  ],
  "sections": [
   {
    "id": "name-and-instructions",
    "title": "Name your assistant and how it replies",
    "body": "Leave the name blank to use the default. Under How should it reply, give standing instructions on tone, length and format, or press a suggestion to add it. These shape how it replies. It still uses only your own information.",
    "keywords": [
     "name",
     "instructions",
     "tone",
     "how it replies",
     "shorter answers"
    ]
   },
   {
    "id": "what-it-should-know",
    "title": "What your assistant should know about you",
    "body": "Facts it should always keep in mind, such as your team, your schedule and your preferences. This is private to your account. Update it whenever things change.",
    "keywords": [
     "remember",
     "memory",
     "about me",
     "notes"
    ]
   },
   {
    "id": "your-own-key",
    "title": "Your own key",
    "body": "Your key can be from Claude or OpenAI, and the Suite recognises which. It is stored securely and is never shown again. Paste a new key any time to replace it.",
    "keywords": [
     "key",
     "claude key",
     "openai key",
     "replace key",
     "encrypted"
    ]
   },
   {
    "id": "what-your-assistant-has-done",
    "title": "What your assistant has done",
    "body": "Open this list to see what your assistant prepared and how it ended: Done, Waiting for you, Cancelled, Undone or Didn't work.",
    "keywords": [
     "activity",
     "history",
     "what has my assistant done",
     "log"
    ]
   }
  ]
 },
 {
  "id": "integrations",
  "name": "Integrations",
  "area": "Settings",
  "where": "Settings > Integrations",
  "href": "/settings?tab=integrations",
  "what": "Connect the outside accounts your Suite works with: your Google or Microsoft 365 calendar and email, and your own Stripe account. You also set your main currency here.",
  "ai": "No AI",
  "aiNote": "",
  "steps": [
   "Open Settings, then Integrations.",
   "Under Calendar & Email, press Add Google account or Add Microsoft 365 account and sign in.",
   "On the Stripe card, press Connect with Stripe, or paste a read-only key using the steps on the card.",
   "Under Currency, choose your main currency.",
   "Use Disconnect on any account to remove it."
  ],
  "health": "Connecting Stripe can change your scores. The payments, fees and refunds it adds to your ledger count toward your Finance dimension, which looks at revenue against your goal, margin and cash runway. Your calendar and email connections do not change your scores.",
  "tips": [
   "Your AI key and email accounts do not count toward your plan's integration spots.",
   "Emailing your contacts is separate. Campaigns, broadcasts and booking emails go through your own Resend account, set up in Contacts > Email sending.",
   "If a Google account shows Calendar is read-only, add that account again so the app can add events."
  ],
  "questions": [
   {
    "q": "Can I read my Gmail inside the Suite?",
    "a": "No. A Google account lets the Suite send email from your own address and use your calendar. It does not read your Gmail inbox. A Microsoft 365 account does show your inbox."
   },
   {
    "q": "Will disconnecting Stripe remove my income from Finance?",
    "a": "No. Payments already in your ledger stay there."
   },
   {
    "q": "Why can I not add another email account?",
    "a": "You have reached your plan's limit. Disconnect one, or look at your plan under Settings > Billing."
   }
  ],
  "related": [
   "billing-and-plan",
   "ai-assistant-setup-and-your-key",
   "data-privacy",
   "workspace-and-team"
  ],
  "who": "The account owner only. Team members do not see this tab.",
  "keywords": [
   "connect",
   "google",
   "gmail",
   "microsoft",
   "outlook",
   "calendar",
   "email account",
   "stripe",
   "payments",
   "disconnect",
   "reconnect",
   "currency",
   "gst",
   "hst"
  ],
  "sections": [
   {
    "id": "calendar-and-email",
    "title": "Calendar & Email",
    "body": "Connect Google or Microsoft 365 to see your calendar, send email from your own address and let the app add events. The card shows how many email accounts your plan allows.",
    "keywords": [
     "calendar",
     "email",
     "google",
     "microsoft",
     "add account"
    ]
   },
   {
    "id": "gmail-sending-and-calendar",
    "title": "Gmail: sending and calendar only",
    "body": "The Suite does not read Gmail inboxes, so read your messages in Gmail itself. Your replies from the Suite still go out from your own address.",
    "keywords": [
     "gmail",
     "inbox",
     "read email",
     "missing emails"
    ]
   },
   {
    "id": "stripe-your-payments",
    "title": "Stripe",
    "body": "Every payment you take through Stripe goes into your Finance Center as income, with fees and refunds as expenses. It syncs each morning, and Sync now runs it any time. Connect with Stripe also lets the Suite make payment links for your offers.",
    "keywords": [
     "stripe",
     "sync",
     "ledger",
     "payment links",
     "fees",
     "refunds"
    ]
   },
   {
    "id": "currency-and-sales-tax",
    "title": "Currency and Canadian sales tax",
    "body": "Choose US or Canadian dollars as your main currency. The two are kept separate and never converted. With Canadian dollars, a sales tax card also appears for GST/HST, QST and PST. The Suite is a tool, not tax advice.",
    "keywords": [
     "currency",
     "canadian dollars",
     "cad",
     "gst",
     "hst",
     "qst",
     "pst"
    ]
   }
  ]
 },
 {
  "id": "billing-and-plan",
  "name": "Billing and plan",
  "area": "Settings",
  "where": "Settings > Billing",
  "href": "/settings?tab=billing",
  "what": "See which plan you are on and manage your billing. Update your card, see your invoices and change your plan through Stripe's secure billing page.",
  "ai": "No AI",
  "aiNote": "",
  "steps": [
   "Open Settings, then Billing.",
   "Check your plan and renewal date under Current plan.",
   "Press Manage billing. This opens Stripe's billing page.",
   "Update your card, open your invoices or choose a different plan.",
   "When you finish, you return to Settings."
  ],
  "health": "This does not change your scores. It keeps your account paid and up to date.",
  "tips": [
   "If your card fails, start with Manage billing to update it.",
   "Press Change to on another plan's card to open the same billing page."
  ],
  "questions": [
   {
    "q": "How do I cancel?",
    "a": "Cancelling is not available in Manage billing. Please contact support."
   },
   {
    "q": "What happens when I change plans?",
    "a": "When you move up, your card on file is charged the prorated difference and you get an email confirming your new plan. When you move down, the unused part of your current period is credited."
   },
   {
    "q": "My team cannot see this page. Is that right?",
    "a": "Yes. Billing is for the account owner only."
   }
  ],
  "related": [
   "if-a-payment-fails",
   "workspace-and-team",
   "integrations"
  ],
  "who": "The account owner only.",
  "keywords": [
   "billing",
   "invoice",
   "receipt",
   "update card",
   "credit card",
   "payment method",
   "change plan",
   "upgrade",
   "downgrade",
   "cancel",
   "renewal",
   "subscription"
  ],
  "sections": [
   {
    "id": "plan-limits",
    "title": "What your plan sets",
    "body": "Your plan sets how many workspaces, team seats, email accounts and integrations you can have, and your AI limits. You can see what you have used on Settings > Workspace and Settings > Integrations.",
    "keywords": [
     "limits",
     "seats",
     "how many",
     "plan limit",
     "reached limit"
    ]
   },
   {
    "id": "plan-upgrade-emails",
    "title": "Emails when you move up",
    "body": "When you move up a plan, you get an email confirming it, followed by one short check-in email. Moving down sends no emails.",
    "keywords": [
     "upgrade email",
     "confirmation",
     "check-in"
    ]
   }
  ]
 },
 {
  "id": "security",
  "name": "Security",
  "area": "Settings",
  "where": "Settings > Security",
  "href": "/settings?tab=security",
  "what": "Keep your account safe. Change your password, turn on two-factor sign-in, sign out of other devices and see when support has opened your account.",
  "ai": "No AI",
  "aiNote": "",
  "steps": [
   "Open Settings, then Security.",
   "To change your password, enter your current one and your new one twice, then press Update Password.",
   "To add two-factor, press Enable 2FA.",
   "Add the account to your authenticator app by scanning the code, copying the setup key or opening it in your app.",
   "Enter the 6-digit code and press Confirm."
  ],
  "health": "This does not change your scores. It protects your account and everything in it.",
  "tips": [
   "Your new password needs at least 8 characters.",
   "Lost a device, or used a shared one? Press Sign out other devices. It signs you out everywhere except where you are now.",
   "Google Authenticator, 1Password and Authy all work for two-factor."
  ],
  "questions": [
   {
    "q": "I forgot my password. What do I do?",
    "a": "On the sign-in page, choose Forgot or set your password and enter your email. We will send you a link."
   },
   {
    "q": "What happens when two-factor is on?",
    "a": "You enter a code from your authenticator app when you sign in. Press Turn off 2FA here if you ever want to stop."
   },
   {
    "q": "Is this the same as Logins & Passwords?",
    "a": "No. This page protects your Suite sign-in. Logins & Passwords is your private vault for other logins."
   }
  ],
  "related": [
   "who-has-opened-my-account",
   "logins-passwords",
   "data-privacy",
   "profile"
  ],
  "who": "Everyone. Who has opened my account shows for the account owner only.",
  "keywords": [
   "password",
   "change password",
   "reset password",
   "two factor",
   "2fa",
   "mfa",
   "authenticator",
   "security code",
   "sign out",
   "lost phone",
   "hacked",
   "who has access"
  ],
  "sections": [
   {
    "id": "sign-out-other-devices",
    "title": "Sign out other devices",
    "body": "Under Sessions, press Sign out other devices to sign out everywhere except here.",
    "keywords": [
     "sign out",
     "log out everywhere",
     "lost device",
     "shared device"
    ]
   },
   {
    "id": "who-has-opened-my-account",
    "title": "Who has opened my account",
    "body": "Support can open your account read-only to help with a request. It can look but not change, send or delete anything. Each time is listed here.",
    "keywords": [
     "support access",
     "who has seen my account",
     "read-only",
     "privacy"
    ]
   }
  ]
 },
 {
  "id": "data-privacy",
  "name": "Data & Privacy",
  "area": "Settings",
  "where": "Settings > Data & Privacy",
  "href": "/settings?tab=data",
  "what": "Download a copy of your information, and ask us to delete your account if you ever need to.",
  "ai": "No AI",
  "aiNote": "",
  "steps": [
   "Open Settings, then Data & Privacy.",
   "Under Export Your Data, press the download you want.",
   "Save the file somewhere safe.",
   "Only if you want to close your account, press Delete under Danger Zone and follow the steps."
  ],
  "health": "This does not change your scores. It gives you your own copy of your plans, reviews and records.",
  "tips": [
   "This year's ledger (CSV) is handy for your bookkeeper or accountant.",
   "Your backup never includes your passwords or API keys.",
   "Your backup never includes private links. Uploaded files stay in the Suite."
  ],
  "questions": [
   {
    "q": "What is in each download?",
    "a": "Full account backup (JSON) is a data file with your records across the Suite: contacts, plans, tasks, finance, pipeline, bookings, projects, agreements, assessments and more. Your plans, goals and reviews (document) is one written document. This year's ledger (CSV) is your income and expenses for the year."
   },
   {
    "q": "If I press Delete, is my account gone right away?",
    "a": "No. It sends a request to our support team. We confirm with you by email before anything is removed."
   },
   {
    "q": "Can my team download a backup?",
    "a": "No. Only the account owner can."
   }
  ],
  "related": [
   "security",
   "billing-and-plan",
   "who-has-opened-my-account"
  ],
  "who": "The account owner only. Team members do not see this tab.",
  "keywords": [
   "export",
   "download",
   "backup",
   "my data",
   "csv",
   "json",
   "ledger",
   "delete account",
   "close account",
   "privacy",
   "accountant"
  ],
  "sections": [
   {
    "id": "delete-account",
    "title": "Delete Account",
    "body": "Press Delete, read the note, type DELETE and press Request account deletion. Nothing is removed until we confirm with you by email. Download a backup first if you want to keep your data. Keep my account closes the box.",
    "keywords": [
     "delete account",
     "close account",
     "remove my data",
     "danger zone"
    ]
   }
  ]
 },
 {
  "id": "logins-passwords",
  "name": "Logins & Passwords",
  "area": "Settings",
  "where": "Settings > Logins & Passwords",
  "href": "/vault",
  "what": "A private vault for your logins and passwords. Each person has their own, and team members cannot open anyone else's. Passwords, secrets, notes and recovery codes are stored encrypted.",
  "ai": "No AI",
  "aiNote": "Your vault is never available to your assistant, and it does not use your AI key.",
  "steps": [
   "Open Logins & Passwords from the left menu.",
   "Enter your Suite password and press Open my vault. It stays open for 15 minutes, or press Lock now.",
   "Press Add a login and fill in its name, type, web address, login and password. Make one creates a strong password for you.",
   "Enter your Suite password at the bottom of the window and press Save.",
   "Use Show or the Password copy button when you need a password. Show hides itself after 20 seconds."
  ],
  "health": "This does not change your scores. It keeps your business logins in one protected place.",
  "tips": [
   "Adding, editing and deleting each ask for your Suite password again.",
   "Please do not store bank card numbers or government ID numbers here.",
   "Press a column heading to sort. Use the filters to see one type, or only logins with 2FA on or off."
  ],
  "questions": [
   {
    "q": "Can my team or LifeCharter see my passwords?",
    "a": "No. Each person has their own vault, and nobody else on your team or at LifeCharter sees yours in the app."
   },
   {
    "q": "Can my assistant read my logins?",
    "a": "No. Your assistant has no access to your vault, and it should never ask you for a password."
   },
   {
    "q": "Can I get a deleted login back?",
    "a": "No. Delete removes the login and its saved password for good, so the window asks for your Suite password first."
   }
  ],
  "related": [
   "security",
   "data-privacy",
   "who-has-opened-my-account"
  ],
  "who": "Private to each person. It opens once your three assessments are finished. Some limited team roles do not have this page.",
  "keywords": [
   "vault",
   "password manager",
   "credentials",
   "security",
   "secret",
   "2fa",
   "two-step sign-in",
   "recovery codes",
   "backup codes",
   "save my passwords",
   "lock",
   "generate password"
  ],
  "sections": [
   {
    "id": "what-each-entry-holds",
    "title": "What each entry holds",
    "body": "Name, type, web address, login, password, a secret such as a security answer or PIN, notes, whether 2FA is on and which kind, a recovery email or phone, recovery codes, and when the password last changed.",
    "keywords": [
     "fields",
     "type",
     "security answer",
     "pin",
     "recovery email",
     "password changed"
    ]
   },
   {
    "id": "show-and-copy",
    "title": "Show and copy",
    "body": "Only one login opens at a time. Show displays its password, secret, recovery codes and notes for 20 seconds. They never appear in the list.",
    "keywords": [
     "reveal",
     "show password",
     "copy password",
     "20 seconds",
     "hide"
    ]
   },
   {
    "id": "recent-activity",
    "title": "Recent activity",
    "body": "Press Show recent activity under the list to see when your vault was opened and when a login was added, changed, shown or deleted.",
    "keywords": [
     "activity log",
     "history",
     "who opened",
     "audit"
    ]
   }
  ]
 },
 {
  "id": "business-segments",
  "name": "Business Segments",
  "area": "Settings",
  "where": "Settings > Business Segments",
  "href": "/segments",
  "what": "Your businesses or brands, and the segments inside each, such as a product line, service, program or audience. Tag income, expenses, tasks, plan goals and sales activity to a segment, and it shows what it earns and its own score.",
  "ai": "Has an AI button",
  "aiNote": "Suggest tags with your assistant proposes a segment for anything not yet tagged, and Read my segments compares your segments and says where to put your attention. Both use your own AI key. Suggested tags wait for you: nothing is tagged until you press Apply, and existing tags are never overwritten.",
  "steps": [
   "Open Business Segments from the left menu.",
   "Press Add your business or brand and type its name.",
   "Press + Add a segment or offering for each thing you want to track, such as Coaching or Courses.",
   "Tag income and expenses to a segment in Finance, and tasks, plan goals and sales activity where you add them.",
   "Or press Suggest tags with your assistant, untick anything that is wrong, and press Apply.",
   "Come back to each segment's card to see its score, what needs work and what is showing progress."
  ],
  "health": "Each segment gets its own score across the 12 dimensions. It starts from your business-wide score and moves with what is tagged to it: Finance from its income and expenses, Sales from its sales activity, and any dimension from its plan goals and tasks. Segment scores do not change your overall score or your business-wide dimension scores.",
  "tips": [
   "With little tagged to a segment, it keeps the business-wide score and says so. The more you tag, the more its own picture shows.",
   "Hover over a bar on a segment's card to see that dimension's score and where it came from.",
   "You can leave general overhead untagged. Pick Leave untagged in the suggestions."
  ],
  "questions": [
   {
    "q": "Do I have to rate each segment myself?",
    "a": "No. You don't rate anything. The score comes from your assessments and what is tagged to that segment."
   },
   {
    "q": "What happens if I delete a segment?",
    "a": "Its scores go with it. Income, expenses and tasks tagged to it stay, just untagged."
   },
   {
    "q": "Why does my segment show the same score as my business?",
    "a": "Not enough is tagged to it yet. Tag tasks, goals, income or sales activity to it, and it will be scored on its own activity."
   }
  ],
  "related": [
   "ai-assistant",
   "ai-assistant-setup-and-your-key",
   "team-access-limits"
  ],
  "who": "Everyone once the three assessments are finished. Team members need the Assessments & Alignment area, and a view-only member can look but not change anything.",
  "keywords": [
   "segment",
   "segments",
   "offering",
   "brand",
   "product line",
   "multiple businesses",
   "score by offer",
   "income by service",
   "tag income",
   "profit by segment",
   "auto tag",
   "untagged"
  ],
  "sections": [
   {
    "id": "how-segment-scores-work",
    "title": "How segment scores work",
    "body": "Each segment starts from your business-wide score for every dimension, then moves with what is tied to it. A card tells you whether it is scored on its own activity or still on the business-wide score.",
    "keywords": [
     "12 dimensions",
     "needs work",
     "showing progress",
     "business-wide score",
     "dimension strip"
    ]
   },
   {
    "id": "suggest-tags",
    "title": "Suggest tags",
    "body": "Once you have a segment and untagged items, a panel shows how many are not tied to a segment. Your assistant suggests one for each item. Untick or change any of them, then press Apply.",
    "keywords": [
     "tie activity",
     "auto tag",
     "leave untagged",
     "apply tags",
     "confidence"
    ]
   },
   {
    "id": "read-my-segments",
    "title": "Read my segments",
    "body": "Press Read my segments and your assistant compares your businesses and segments, then gives you a focus, what to watch and next steps.",
    "keywords": [
     "segment read",
     "compare",
     "focus",
     "next steps"
    ]
   }
  ]
 },
 {
  "id": "ai-assistant",
  "name": "AI Assistant",
  "area": "Settings",
  "where": "Executive Home > AI Assistant card. Set it up in Settings > AI Assistant.",
  "href": "/",
  "what": "Chat with your own named assistant. It answers from your assessments, scores, pillars, tasks, income, SOPs, plans and your next 7 days of calendar, plus the Help library and what you have taught it. It can also prepare changes for you.",
  "ai": "AI-powered",
  "aiNote": "This runs on your own AI key. It answers straight away, and anything that would change your account waits behind Approve. Emails it writes are saved as drafts: it never sends or schedules a broadcast or campaign. The microphone and speaker use your browser's own speech tools, so they need no key.",
  "steps": [
   "Add your AI key in Settings > AI Assistant if you have not yet. Until then the assistant stays offline.",
   "Open Executive Home and type in the AI Assistant box. Enter sends, and Shift+Enter adds a line.",
   "Or press the microphone and speak your question. Press the speaker to have replies read aloud.",
   "When it prepares a change, read the card and press Approve, Edit or Cancel.",
   "Press New conversation to start fresh. The old one is saved under Past conversations.",
   "Press Teach to tell it about you, your team and how you work."
  ],
  "health": "Chatting does not change your scores. Your assistant reads your 12 dimensions, 8 pillars, scores and plans so its answers fit your business. It can also write plan sections for you, behind Approve.",
  "tips": [
   "With the speaker on, a spoken question is sent when you pause, so it works like a conversation.",
   "Your assistant is also in the floating button in the corner of every page, on the tab with its name.",
   "Ask for your top priorities or your easiest tasks, and it ranks your open tasks for you."
  ],
  "questions": [
   {
    "q": "Why can't I open my assistant yet?",
    "a": "It stays closed until your three assessments are finished. It opens on its own when the third one is done."
   },
   {
    "q": "Does it forget me when I start a new conversation?",
    "a": "No. It still knows your account, your notes and your settings. Only the chat on the card starts fresh."
   },
   {
    "q": "Can it see my private answers?",
    "a": "Answers flagged as sensitive are never included, and your logins vault is never available to it."
   }
  ],
  "related": [
   "ai-assistant-setup-and-your-key",
   "what-your-assistant-can-do-for-you",
   "what-your-assistant-will-and-will-not-do",
   "pop-out-assistant",
   "have-my-assistant-work-on-this"
  ],
  "who": "Everyone once the three assessments are finished. Team members use the account owner's AI key and only within their areas, the owner can set a monthly limit for each one, and some limited team roles do not get the assistant.",
  "keywords": [
   "chat",
   "ask",
   "sidekick",
   "assistant name",
   "voice",
   "microphone",
   "read aloud",
   "past conversations",
   "new conversation",
   "teach",
   "thumbs",
   "ai key",
   "what do you know about me"
  ],
  "sections": [
   {
    "id": "assistant-chat",
    "title": "The chat",
    "body": "The conversation stays on the card with the newest message first. It is the same conversation in the pop-out window and the floating button.",
    "keywords": [
     "conversation",
     "newest first",
     "card",
     "executive home"
    ]
   },
   {
    "id": "assistant-voice",
    "title": "Voice",
    "body": "Press the microphone to speak a question, and the speaker to hear replies. Voice works in Chrome, Edge and Safari, at no extra cost and with no key.",
    "keywords": [
     "speak",
     "microphone",
     "speaker",
     "read aloud",
     "chrome",
     "safari"
    ]
   },
   {
    "id": "past-conversations",
    "title": "Past conversations",
    "body": "New conversation saves the current chat under Past conversations, where you can read it, continue it or delete it.",
    "keywords": [
     "history",
     "old chats",
     "continue",
     "delete conversation"
    ]
   },
   {
    "id": "assistant-answer-ratings",
    "title": "Rating an answer",
    "body": "Use the thumbs up or down under an answer. Thumbs down asks for an optional note. Your rating is saved with the question and answer, and LifeCharter uses it to improve the assistant.",
    "keywords": [
     "thumbs up",
     "thumbs down",
     "feedback",
     "wrong answer",
     "note"
    ]
   }
  ]
 },
 {
  "id": "accepting-a-team-invitation",
  "name": "Accepting a team invitation",
  "area": "Settings",
  "where": "Your invitation email",
  "href": "/login",
  "what": "How you join an account as a team member. You open your invitation email, set a password, and you are signed in.",
  "ai": "No AI",
  "aiNote": "",
  "steps": [
   "Open the email from LifeCharter Command Suite called You're invited to join, followed by the team's name.",
   "Press Set your password. If you already have a LifeCharter login with this email, the button says Sign in to Command Suite, so use your usual password.",
   "Type a new password of at least 8 characters, then type it again to confirm.",
   "Press Set password & sign in. The Command Suite opens."
  ],
  "health": "This does not change anyone's scores. It gives you your own login to the account you were invited to.",
  "tips": [
   "The link works once and expires in 7 days.",
   "Questions about your role? Reply to the email to reach the person who added you."
  ],
  "questions": [
   {
    "q": "My link says it has expired or isn't valid. What now?",
    "a": "Invitation links are single-use and time-limited. Ask whoever invited you to send a fresh one."
   },
   {
    "q": "What will I be able to see?",
    "a": "That depends on the role and areas the account owner gave you. Your invitation email says what your role can do."
   },
   {
    "q": "The email never arrived. What can I do?",
    "a": "Ask the person who invited you to press Send invitation again, or to copy your link and send it to you themselves."
   }
  ],
  "related": [
   "workspace-and-team",
   "team-access-limits",
   "profile",
   "security"
  ],
  "who": "Invited team members. The account owner or a team admin sends the invitation.",
  "keywords": [
   "invite",
   "invitation",
   "join team",
   "set password",
   "team member login",
   "invite expired",
   "link not working",
   "accept invite",
   "no email"
  ],
  "sections": [
   {
    "id": "set-your-password",
    "title": "Setting your password",
    "body": "The link opens a page with your name and email. Choose a password of at least 8 characters and press Set password & sign in.",
    "keywords": [
     "accept invite",
     "new password",
     "8 characters",
     "confirm password"
    ]
   },
   {
    "id": "team-invitation-email",
    "title": "The invitation email",
    "body": "The owner or an admin presses Send invitation beside your name in Settings > Workspace. The email comes from LifeCharter Command Suite, and replies go to the person who added you. If there is no reply address on file, they go to support.",
    "keywords": [
     "invitation email",
     "support@lccommandsuite.com",
     "send invitation",
     "resend invite",
     "reply"
    ]
   }
  ]
 },
 {
  "id": "who-has-opened-my-account",
  "name": "Who has opened my account",
  "area": "Settings",
  "where": "Settings > Security, at the bottom",
  "href": "/settings?tab=security",
  "what": "A list of each time LifeCharter support opened your account read-only to help with a request, with the date and time.",
  "ai": "No AI",
  "aiNote": "",
  "steps": [
   "Open Settings from the left menu.",
   "Choose Security.",
   "Scroll to Who has opened my account at the bottom.",
   "Read the list. Each line shows the date and time. If it has never happened, it says No one has opened your account."
  ],
  "health": "This does not change your scores. It shows you when support has been in your account.",
  "tips": [
   "Support can look, but cannot change, send or delete anything.",
   "Support cannot see your inbox, calendar, connected accounts, logins vault or billing.",
   "The list shows your 20 most recent times."
  ],
  "questions": [
   {
    "q": "Why would support open my account?",
    "a": "To help with a support request. Every time it happens is listed here."
   },
   {
    "q": "Does the list say why they opened it?",
    "a": "It shows the date and time only. If a date surprises you, open Help, then Contact Support."
   }
  ],
  "related": [
   "security",
   "data-privacy",
   "logins-passwords"
  ],
  "who": "The account owner.",
  "keywords": [
   "support access",
   "who logged in",
   "account access log",
   "read-only",
   "view my account",
   "privacy",
   "did someone open my account"
  ]
 },
 {
  "id": "if-a-payment-fails",
  "name": "If a payment fails",
  "area": "Settings",
  "where": "The bell, then Settings > Billing",
  "href": "/settings?tab=billing",
  "what": "What to do when a renewal payment for your plan does not go through. The bell tells you, and you update your card in Settings > Billing.",
  "ai": "No AI",
  "aiNote": "",
  "steps": [
   "Look in the bell for Your last payment didn't go through.",
   "Open Settings from the left menu and choose Billing.",
   "Press Manage billing.",
   "Update your card on the billing page that opens.",
   "Come back to the Suite. The alert clears once a payment goes through."
  ],
  "health": "This does not change your scores. It keeps your plan running.",
  "tips": [
   "Update your card as soon as you see the alert, so your plan keeps running without interruption.",
   "Need a hand? Open Help, then Contact Support."
  ],
  "questions": [
   {
    "q": "Who can update the card?",
    "a": "Only the account owner. Billing is closed to team members."
   },
   {
    "q": "Why is the alert still in my bell?",
    "a": "It stays until a payment goes through. If you have updated your card and it is still there, open Help, then Contact Support."
   }
  ],
  "related": [
   "billing-and-plan",
   "notifications"
  ],
  "who": "The account owner.",
  "keywords": [
   "payment failed",
   "card declined",
   "past due",
   "update card",
   "expired card",
   "billing problem",
   "payment didn't go through",
   "manage billing",
   "renewal"
  ]
 },
 {
  "id": "what-your-assistant-can-do-for-you",
  "name": "What your assistant can do for you",
  "area": "Settings",
  "where": "Any assistant chat, plus Daily Operations > Waiting for my approval",
  "href": "/assistant-approvals",
  "what": "Ask in plain words and your assistant prepares the change as a card for you to check. Nothing happens until you press Approve, and most actions have Undo.",
  "ai": "AI-powered",
  "aiNote": "This uses your own AI key. Anything that changes your account waits behind Approve. Broadcasts and email campaigns are saved as drafts: your assistant never sends or schedules them. Two things do send email once you approve them, and the card says so: starting named people on an existing campaign, and an invoice, which Stripe emails.",
  "steps": [
   "Ask in the chat, for example add a task or draft a broadcast to my newsletter tag.",
   "Read the card it prepares. Press its link if you want to see where the work will land.",
   "Press Approve, or Edit to say what to change, or Cancel.",
   "If you are not ready, open Waiting for my approval from the left menu. Every card waits there with its own buttons.",
   "After you approve, press Undo if you change your mind and the card offers it."
  ],
  "health": "This does not change your scores. It can write or revise your Business, Marketing, Sales and Forecasting plan sections from your assessments, one section at a time behind Approve.",
  "tips": [
   "Be specific. Name the contact, tag, form or page you mean, and it can find the right one.",
   "Settings > AI Assistant > What your assistant has done lists what it prepared and how each one turned out.",
   "A card that renames something shows the old name and the new name."
  ],
  "questions": [
   {
    "q": "Can my assistant email people on its own?",
    "a": "No. It saves broadcasts and campaigns as drafts for you to review and schedule. Email only goes out from it if you press Approve on a card that says so, such as starting named people on a campaign."
   },
   {
    "q": "Can I undo everything?",
    "a": "Most things. You cannot undo starting people on a campaign, because email 1 goes right away and cannot be unsent. Adding a contact and sending a problem to support have no Undo either."
   },
   {
    "q": "Why does it say it can't do something?",
    "a": "It only works in your own account, and a team member is limited by their role. Some things stay with you, such as publishing a page or sending an agreement for signature."
   }
  ],
  "related": [
   "ai-assistant",
   "what-your-assistant-will-and-will-not-do",
   "have-my-assistant-work-on-this",
   "ai-assistant-setup-and-your-key",
   "team-access-limits"
  ],
  "who": "Everyone once the three assessments are finished. Team members can only prepare and approve work inside the areas they have.",
  "keywords": [
   "approve",
   "preview",
   "undo",
   "edit card",
   "what can my assistant do",
   "draft",
   "waiting for my approval",
   "actions",
   "tools",
   "add a task",
   "tag contacts",
   "draft email",
   "can it send"
  ],
  "sections": [
   {
    "id": "contacts-tasks-sales",
    "title": "Contacts, tasks and sales",
    "body": "Tag or untag contacts and add a contact. Create and change tasks and reminders. Create an outreach pipeline, add and move people, and add a Sales Pipeline deal.",
    "keywords": [
     "tag",
     "contact",
     "task",
     "reminder",
     "outreach",
     "pipeline",
     "deal"
    ]
   },
   {
    "id": "email-and-content",
    "title": "Email and content drafts",
    "body": "Write a broadcast or email campaign as a draft. Write social posts or a content plan onto your Content Calendar. Create, update and delete pages in your left menu.",
    "keywords": [
     "broadcast",
     "campaign",
     "draft",
     "social posts",
     "content calendar",
     "my pages"
    ]
   },
   {
    "id": "starting-a-campaign",
    "title": "Starting people on a campaign",
    "body": "It can start named people on one of your existing email campaigns, up to 20 per approval. The card lists who, what is sent and when, and who is left out. On Approve, email 1 goes right away and cannot be unsent.",
    "keywords": [
     "enroll",
     "start campaign",
     "email 1",
     "20 people",
     "unsent"
    ]
   },
   {
    "id": "forms-bookings-sops",
    "title": "Forms, booking links, fields and SOPs",
    "body": "Create or change a form, booking link, extra contact field or SOP. When it changes one, the card shows before and after, and Undo restores it.",
    "keywords": [
     "form",
     "booking link",
     "custom field",
     "sop",
     "before and after"
    ]
   },
   {
    "id": "offers-money-payments",
    "title": "Offers, money and payments",
    "body": "Add or change offers, record income or expense entries, prepare an invoice or a payment link, and read how your year is going. It can also show who likely needs a 1099-NEC, as a guide for your accountant and not tax advice.",
    "keywords": [
     "offer",
     "income",
     "expense",
     "invoice",
     "payment link",
     "year so far",
     "1099"
    ]
   },
   {
    "id": "plans-and-projects",
    "title": "Plans and projects",
    "body": "Write or revise plan sections, create a project from a template or blank, and add tasks to a project.",
    "keywords": [
     "business plan",
     "marketing plan",
     "sales plan",
     "forecast",
     "project",
     "template"
    ]
   },
   {
    "id": "courses-away-landing-pages",
    "title": "Courses, away dates and landing pages",
    "body": "Start a course, membership or group program with lessons drafted, with no members and no email. Report course progress. Set or clear away dates. Draft a landing page, which stays a draft until you publish it, and report its visits and conversions.",
    "keywords": [
     "course",
     "membership",
     "group program",
     "lessons",
     "out of office",
     "landing page"
    ]
   },
   {
    "id": "events-time-portals-care",
    "title": "Events, time, client portals and Client Care",
    "body": "Report on events and draft one, which stays closed until you press Open sign-ups. Summarize your time and add time you worked. Check a client's portal and add homework or a goal. Report on Client Care. Add a contact to a course or program with no email sent.",
    "keywords": [
     "event",
     "challenge",
     "time tracking",
     "client portal",
     "homework",
     "client care",
     "program member"
    ]
   },
   {
    "id": "agreements",
    "title": "Agreements and proposals",
    "body": "Show who has signed, and draft an agreement or proposal in LC Plume with its signers. You read it and press Send for signature yourself.",
    "keywords": [
     "agreement",
     "proposal",
     "lc plume",
     "signature",
     "draft"
    ]
   },
   {
    "id": "what-stays-with-you",
    "title": "What stays with you",
    "body": "Your assistant cannot publish a page, open an event for sign-ups, email a portal link, switch on Client Care, email course members, send an agreement for signature, or read a receipt photo in the chat.",
    "keywords": [
     "can't do",
     "cannot",
     "publish",
     "receipt photo",
     "limits"
    ]
   },
   {
    "id": "report-a-problem",
    "title": "Reporting a problem",
    "body": "Tell it something is broken and it writes the problem up for LifeCharter support. You approve it first, and you get a confirmation email.",
    "keywords": [
     "bug",
     "broken",
     "report problem",
     "support"
    ]
   }
  ]
 },
 {
  "id": "pop-out-assistant",
  "name": "Pop-out assistant",
  "area": "Settings",
  "where": "Executive Home > AI Assistant card > Pop out",
  "href": "/",
  "what": "Floats your assistant over any page, so you can work and ask for help side by side. It knows which page you are on, and it is the same conversation as the card.",
  "ai": "AI-powered",
  "aiNote": "This is the same assistant on your own AI key. Anything that changes your account still waits behind Approve.",
  "steps": [
   "Open Executive Home and press Pop out on the AI Assistant card.",
   "Move to any page. The window stays with you.",
   "Drag it by its title bar, and resize it from the corner.",
   "Press the minimize button to shrink it to a small button with your assistant's name. Press that button to open it again.",
   "Press Bring back to Executive Home when you are done."
  ],
  "health": "This does not change your scores. It keeps help beside the work you are doing.",
  "tips": [
   "Ask about the page you are on. The box says which page your assistant is looking at.",
   "Your assistant stays popped out and in the same spot on this device, even after you close the page."
  ],
  "questions": [
   {
    "q": "Is this a different conversation?",
    "a": "No. It reads the same saved conversation as the card, and it has the same Approve cards, New conversation and Past conversations."
   },
   {
    "q": "Where did the card on Executive Home go?",
    "a": "While your assistant is popped out, the card offers a button to bring it back."
   }
  ],
  "related": [
   "ai-assistant",
   "have-my-assistant-work-on-this",
   "what-your-assistant-can-do-for-you"
  ],
  "who": "Everyone once the three assessments are finished. Team members need the assistant in their areas.",
  "keywords": [
   "pop out",
   "floating assistant",
   "float",
   "side by side",
   "minimize",
   "resize",
   "move assistant",
   "bring back"
  ]
 },
 {
  "id": "have-my-assistant-work-on-this",
  "name": "Have my assistant work on this",
  "area": "Settings",
  "where": "Daily Operations > Tasks and Reminders, on each open task or reminder",
  "href": "/tasks",
  "what": "One button that hands a task or reminder to your assistant. It reads the whole item, checks what it can, prepares what it can, and reports back.",
  "ai": "AI-powered",
  "aiNote": "This uses your own AI key. Anything it prepares waits for your Approve. Only its report saves on its own, as a note on the item, and you can Undo that. It never sends anything without you. The one time email goes out is if you approve starting named people on a campaign.",
  "steps": [
   "Open Tasks or Reminders from the left menu.",
   "Press Have my assistant work on this on the item.",
   "Your assistant opens in its floating window and starts work. You can keep working.",
   "Review each card it prepares, and press Approve, Edit or Cancel.",
   "Read the report. Press See report on a task, or See the assistant's report on a reminder.",
   "Open Waiting for my approval to work through your next steps."
  ],
  "health": "The button itself does not change your scores. A task you finish still counts toward task follow-through in the usual way.",
  "tips": [
   "Put the details in the task's notes or the reminder's note first. Your assistant reads all of it.",
   "When an item is finished, it prepares one to three follow-ups as separate cards, or asks one short question."
  ],
  "questions": [
   {
    "q": "Can it tell who replied to my DMs?",
    "a": "Only from your Outreach Pipelines. It cannot read LinkedIn, Instagram, Facebook or WhatsApp, so a reply only shows once you have moved that person to a reply stage."
   },
   {
    "q": "Can it check replies to my email campaign?",
    "a": "Yes, if a Microsoft 365 inbox is connected. It cannot read a Gmail account."
   },
   {
    "q": "Do I have to approve the report?",
    "a": "No. The report saves itself as a note on the item. What needs you is the checklist inside it and any cards it prepared."
   }
  ],
  "related": [
   "what-your-assistant-can-do-for-you",
   "pop-out-assistant",
   "ai-assistant",
   "ai-assistant-setup-and-your-key"
  ],
  "who": "Everyone once the three assessments are finished. Team members need the assistant in their areas, and a team member in the Sales role does not get the button on tasks.",
  "keywords": [
   "work on this",
   "assistant report",
   "see report",
   "task help",
   "reminder help",
   "delegate to assistant",
   "follow up tasks",
   "check outreach",
   "check campaign",
   "next steps"
  ],
  "sections": [
   {
    "id": "the-report",
    "title": "The report",
    "body": "The report is saved on the task or reminder. It sums up where things stand, shows the key numbers, what was done, and any cards still waiting. Each next step is marked Suite, Assistant, You, or You + assistant.",
    "keywords": [
     "report card",
     "summary",
     "key numbers",
     "next steps",
     "checklist"
    ]
   },
   {
    "id": "outreach-check",
    "title": "Checking your outreach",
    "body": "It can report messages logged as sent, first messages and follow-ups, how many people are in each stage, and who is waiting for a follow-up. Name a date range to look at one batch.",
    "keywords": [
     "dms",
     "outreach pipelines",
     "batch",
     "follow-up",
     "messages sent"
    ]
   },
   {
    "id": "email-campaign-check",
    "title": "Checking your email campaigns",
    "body": "It can show who was sent which email and when each person's next email is due. If you ask it to start named people on a campaign, the card lists who and what. On Approve, email 1 goes right away and cannot be unsent.",
    "keywords": [
     "campaign",
     "who was sent",
     "next email",
     "replies",
     "microsoft 365",
     "enroll"
    ]
   }
  ]
 },
 {
  "id": "what-your-assistant-will-and-will-not-do",
  "name": "What your assistant will and will not do",
  "area": "Settings",
  "where": "Behind every assistant answer",
  "href": "/",
  "what": "The rules every client's assistant follows, whatever your own instructions say. Your instructions can change its tone and length, but never these rules.",
  "ai": "AI-powered",
  "aiNote": "These rules sit behind your assistant on your own AI key. If a message suggests serious distress, the caring reply below comes straight away, even with no AI key.",
  "steps": [
   "Ask your assistant as you normally would. The rules are always on, so there is nothing to switch on.",
   "To change its tone, length or focus, open Settings > AI Assistant and fill in How should it reply.",
   "If it cannot do something, it will say so and point you to Help, then Contact Support.",
   "If an answer is off, press thumbs down under it and add a note."
  ],
  "health": "This does not change your scores. It keeps your assistant honest, private and careful with you.",
  "tips": [
   "Your assistant uses only your own information and never mentions other clients.",
   "If it says it did something, a tool really did it. Anything that sends, publishes or changes data waits for your Approve."
  ],
  "questions": [
   {
    "q": "Will it give me legal, tax or medical advice?",
    "a": "It shares general information only, says it is not professional advice, and suggests you check with a qualified professional."
   },
   {
    "q": "Does the LifeCharter team read what I wrote?",
    "a": "The alert the team gets never includes what you wrote. It only says someone should reach out."
   },
   {
    "q": "Can I turn these rules off?",
    "a": "No. They apply to every assistant, on top of your own instructions."
   }
  ],
  "related": [
   "ai-assistant",
   "what-your-assistant-can-do-for-you",
   "ai-assistant-setup-and-your-key",
   "data-privacy"
  ],
  "who": "Every client's assistant, all the time.",
  "keywords": [
   "rules",
   "house rules",
   "will not do",
   "refuse",
   "limits",
   "privacy",
   "legal advice",
   "tax advice",
   "fake testimonials",
   "guarantee",
   "crisis",
   "988",
   "safety"
  ],
  "sections": [
   {
    "id": "house-rules",
    "title": "The house rules",
    "body": "Your assistant will not quote prices for LifeCharter's own services, promise results, income or timelines, or invent features. It uses only your own information, keeps your private details private, and declines fake testimonials, invented results and fear-based marketing.",
    "keywords": [
     "honesty",
     "no invented features",
     "own account only",
     "promises",
     "testimonials",
     "pricing question"
    ]
   },
   {
    "id": "if-you-are-struggling",
    "title": "If you are having a hard time",
    "body": "If a message suggests serious distress, your assistant stops coaching and replies with care and crisis resources: call or text 988 in the US, call 911 in immediate danger, or visit findahelpline.com. A person on the LifeCharter team is told, so they can check in.",
    "keywords": [
     "distress",
     "crisis",
     "988",
     "911",
     "help line",
     "check in"
    ]
   },
   {
    "id": "hardship-and-frustration",
    "title": "Money worries and frustration",
    "body": "If you mention financial hardship, it never suggests spending or debt, and offers free, low-effort next steps. If you are frustrated with the Suite, it fixes what it can and points you to support. In both cases the LifeCharter team is told, so a real person can follow up.",
    "keywords": [
     "hardship",
     "can't pay",
     "frustrated",
     "support",
     "real person"
    ]
   },
   {
    "id": "quiet-accounts",
    "title": "If you have been away",
    "body": "A daily check lets the LifeCharter team know when someone has not signed in for two weeks, so a person can reach out.",
    "keywords": [
     "not signed in",
     "two weeks",
     "inactive",
     "check in"
    ]
   }
  ]
 }
];
