import type { GuideEntry } from "./types";

// The guide's entries. Each one is checked against the code before it goes in, and Babs approves it before release.
export const GUIDE_ENTRIES: GuideEntry[] = [
  {
    "id": "executive-home",
    "name": "Executive Home",
    "area": "Daily Operations",
    "where": "Daily Operations > Executive Home",
    "href": "/",
    "what": "The page you land on when you sign in. It is your briefing for the day, in cards: your schedule, money, pipeline, tasks, inbox, your assistant and your 12 Business Dimensions.",
    "ai": "Has an AI button",
    "aiNote": "The AI Assistant card answers from your own account and uses your own AI key. Anything it changes for you waits behind Approve. The other cards on this page do not use AI.",
    "steps": [
      "Open Executive Home from the left menu. It is also the first page you see when you sign in.",
      "Check that the time zone beside the date is yours. It sets your greeting, your schedule and your due times.",
      "Press Start My Day to open Daily Compass, Create Content to start a post in the Content Calendar, or Add Task to add a task.",
      "Read across your cards and press through to the full page for anything that needs you.",
      "To move a card, hover over it and drag the grip in its top-right corner."
    ],
    "health": "Your 12 Business Dimensions sit at the bottom of this page, so you can see your scores at a glance. Income and expenses you add on the Financial Pulse card feed your Finance dimension. Tasks you finish count toward your task follow-through.",
    "tips": [
      "Your card layout is remembered in that browser, so another computer can look different.",
      "Drop a card into an empty space to send it to the end of the page.",
      "Your first 30 days only shows while it is useful."
    ],
    "questions": [
      {
        "q": "Why do I see a banner at the top?",
        "a": "One banner shows until your assessments, your AI and at least one connected tool are finished. Press Continue setup to carry on. If you did The Command Shift, a second one offers Bring it in, which brings your answers into your account."
      },
      {
        "q": "Why does my Morning Brief card say to connect my calendar?",
        "a": "No calendar is connected yet. Use Connect Google Calendar or Connect Microsoft 365 Calendar on the Today's Schedule card."
      },
      {
        "q": "What are the Income and Expense buttons on Financial Pulse?",
        "a": "They add money in or out without leaving the page. The entry goes into your Finance records."
      }
    ],
    "related": [
      "morning-brief",
      "todays-schedule",
      "inbox",
      "daily-compass",
      "tasks",
      "business-alignment"
    ],
    "who": "Everyone. Team members need the Executive Home area. The Sales role does not open this page.",
    "keywords": [
      "home",
      "dashboard",
      "landing page",
      "first page",
      "cards",
      "rearrange",
      "drag",
      "layout",
      "time zone",
      "timezone",
      "start my day",
      "create content",
      "add task",
      "executive briefing"
    ],
    "sections": [
      {
        "id": "morning-brief-card",
        "title": "Your Morning Brief card",
        "body": "Shows your meetings today, how many open tasks you have, and revenue this month. Press the card to open the full Morning Brief.",
        "keywords": [
          "morning brief",
          "meetings today",
          "tasks require attention",
          "revenue this month"
        ]
      },
      {
        "id": "first-30-days-card",
        "title": "Your first 30 days card",
        "body": "Shows the day you are on, the steps you have done, and the steps left in your current stage. Stages open one at a time, starting with your assessments. Press See all for the whole list.",
        "keywords": [
          "first 30 days",
          "day of 30",
          "getting started",
          "focus",
          "steps"
        ]
      },
      {
        "id": "pipeline-offers-card",
        "title": "Pipeline & Offers card",
        "body": "Shows your open deals, the weighted value, what you won this month, deals by stage, your top offer and how many deals need moving. Press Open board to go to your Pipeline.",
        "keywords": [
          "pipeline",
          "offers",
          "deals",
          "weighted",
          "won this month",
          "top offer"
        ]
      },
      {
        "id": "collective-card",
        "title": "The Collective card",
        "body": "Your way into the community. Members also see any new notifications and the next live session. Press Go to The Collective to open it.",
        "keywords": [
          "collective",
          "community",
          "notifications",
          "next live",
          "group coaching"
        ]
      },
      {
        "id": "financial-pulse-card",
        "title": "Financial Pulse card",
        "body": "Choose week, month or year to see your income, how it compares with the last period, and how close you are to your income goal, with a bar chart. Income and Expense add an entry here. View revenue by segment appears once you have income recorded.",
        "keywords": [
          "financial pulse",
          "revenue",
          "income",
          "expense",
          "goal",
          "bar chart",
          "segment",
          "week month year"
        ]
      },
      {
        "id": "priority-tasks",
        "title": "Priority Tasks",
        "body": "Four columns: Today, In Progress, Waiting and Recurring. The first three show your top three tasks, soonest due first. Press a task to open it. Recurring shows what repeats today, and you check each one off there.",
        "keywords": [
          "priority tasks",
          "today",
          "in progress",
          "waiting",
          "recurring",
          "columns"
        ]
      },
      {
        "id": "coaching-calls-reminders-cards",
        "title": "Coaching calls and Reminders cards",
        "body": "Coaching calls lists this week's and next week's calls, with See all calls and replays beside them. Reminders shows the one-off things you must not forget.",
        "keywords": [
          "coaching calls",
          "replays",
          "reminders",
          "this week",
          "next week"
        ]
      },
      {
        "id": "ai-assistant-card",
        "title": "AI Assistant card",
        "body": "Ask your assistant anything about your business, by typing or with the microphone. Pop out floats it over any page. New conversation starts fresh and saves the old one under Past conversations.",
        "keywords": [
          "assistant",
          "ai",
          "ask",
          "pop out",
          "new conversation",
          "past conversations",
          "microphone",
          "read aloud",
          "teach"
        ]
      },
      {
        "id": "twelve-business-dimensions",
        "title": "12 Business Dimensions",
        "body": "A score card for each dimension. Press one to see why it has that score. A score under 60 shows Learn how to lift this. Drag the cards to reorder them, or fold the whole row by its title.",
        "keywords": [
          "12 dimensions",
          "dimensions",
          "scores",
          "why this score",
          "learn how to lift this"
        ]
      }
    ]
  },
  {
    "id": "todays-schedule",
    "name": "Today's Schedule",
    "area": "Daily Operations",
    "where": "Executive Home > Today's Schedule card",
    "href": "/",
    "what": "A card on Executive Home that puts your day in time order: events from every connected Google and Microsoft 365 calendar, mixed with your timed tasks and today's recurring tasks.",
    "ai": "No AI",
    "aiNote": "The card does not use AI. Your assistant can read your connected calendar when you ask about your week in the AI Assistant card.",
    "steps": [
      "Open Executive Home from the left menu and find Today's Schedule.",
      "If no calendar is connected, press Connect Google Calendar or Connect Microsoft 365 Calendar.",
      "Read your day from top to bottom. Tasks carry a small label such as Task, Due by or Recurring.",
      "Use the arrows to page forward to future days. Press Today to come back.",
      "Press Open Google Calendar or Open Microsoft Calendar to go to your real calendar."
    ],
    "health": "This does not change your scores. It helps you see the shape of your day in one place.",
    "tips": [
      "Give a task a time of day and it appears here, even with no calendar connected.",
      "Your schedule follows the time zone beside the date at the top of Executive Home."
    ],
    "questions": [
      {
        "q": "Why don't I see my recurring tasks on a future day?",
        "a": "Recurring tasks show on today only. Future days show your calendar events and timed tasks."
      },
      {
        "q": "How far ahead can I look?",
        "a": "Up to 60 days."
      },
      {
        "q": "Can I change a meeting from this card?",
        "a": "No. Open your calendar with the link on the card to change a meeting."
      }
    ],
    "related": [
      "executive-home",
      "morning-brief",
      "tasks",
      "recurring-tasks"
    ],
    "who": "Everyone. Calendar events show for the person who connected the calendar. Only the account owner can connect one, and team members do not see the owner's calendar here. Timed tasks still show.",
    "keywords": [
      "calendar",
      "schedule",
      "meetings",
      "appointments",
      "agenda",
      "google calendar",
      "outlook",
      "microsoft 365",
      "connect calendar",
      "future days",
      "timed tasks",
      "today"
    ]
  },
  {
    "id": "inbox",
    "name": "Inbox",
    "area": "Daily Operations",
    "where": "Executive Home > Inbox card",
    "href": "/",
    "what": "A card on Executive Home for your email. Microsoft 365 mail shows here to read, search, reply to and sort. A Gmail account connects for sending only, so read your Gmail in Gmail itself.",
    "ai": "No AI",
    "aiNote": "The Inbox card does not use AI.",
    "steps": [
      "Open Executive Home from the left menu and find Inbox.",
      "If nothing is connected, press Connect Microsoft 365 to read mail here, or Connect Gmail to send from your Gmail address.",
      "Search your mail, or use All and Unread to filter the list.",
      "Press a message to read the whole conversation. Then use Reply or Forward, add a label, mark it unread, archive it or move it to Trash.",
      "Press Compose to write a new message, choose which account it comes From, and attach files if you need them."
    ],
    "health": "This does not change your scores. It keeps your email close to the rest of your day.",
    "tips": [
      "With more than one account connected, a filter for each account appears above the list.",
      "Keep attachments under about 4 MB in total.",
      "Fold the card down to its title with the arrow beside Inbox. That choice is remembered on this device."
    ],
    "questions": [
      {
        "q": "Why can't I see my Gmail messages?",
        "a": "A Google account connects for sending email and your calendar only. The Suite cannot read your Gmail inbox, so open Gmail to read it. Your replies can still go out from your Gmail address."
      },
      {
        "q": "It says my account isn't connecting right now. What do I do?",
        "a": "Press Reconnect it in Settings and sign in to that account again."
      },
      {
        "q": "How many email accounts can I connect?",
        "a": "Your plan sets the number. The card shows how many you have used, and shows Add Gmail and Add Microsoft 365 while you have room."
      }
    ],
    "related": [
      "executive-home",
      "contacts",
      "todays-schedule"
    ],
    "who": "Everyone. Reading mail here needs Microsoft 365, and Gmail is sending only. Only the account owner can connect an account, and team members do not see the owner's mail here.",
    "keywords": [
      "email",
      "mail",
      "gmail",
      "outlook",
      "microsoft 365",
      "m365",
      "compose",
      "reply",
      "forward",
      "archive",
      "trash",
      "unread",
      "labels",
      "search mail",
      "attachments",
      "connect email",
      "send email"
    ],
    "sections": [
      {
        "id": "gmail-send-only",
        "title": "If you connect Gmail",
        "body": "Compose still works and sends from your Gmail address. Search, Reply and Mark Read are hidden when every account is Gmail, because there is no mail here to act on. A note on the card explains this.",
        "keywords": [
          "gmail",
          "send only",
          "cannot read",
          "google"
        ]
      },
      {
        "id": "reading-a-message",
        "title": "Reading a message",
        "body": "The whole conversation opens with the latest message showing. Attachments can be downloaded. + Label adds a label or a new one, and icons mark it unread, archive it or move it to Trash.",
        "keywords": [
          "read",
          "conversation",
          "thread",
          "attachment",
          "download",
          "label",
          "mark unread",
          "archive",
          "trash"
        ]
      }
    ]
  },
  {
    "id": "morning-brief",
    "name": "Morning Brief",
    "area": "Daily Operations",
    "where": "Executive Home > Your Morning Brief card",
    "href": "/morning-brief",
    "what": "A one-page start to your day. Your assistant writes you a short briefing, and below it sit your next meeting, open tasks, revenue this month, today's calendar, where to focus and four Quick Wins.",
    "ai": "AI-powered",
    "aiNote": "Your assistant writes the briefing when you open the page, using your own AI key. Without a key, press Set up your AI assistant, and the rest of the page still works. Refresh writes a new one.",
    "steps": [
      "On Executive Home, press the Your Morning Brief card.",
      "Read your briefing at the top.",
      "Check Next meeting, Tasks and Revenue this month. Press any of them to go to the full page.",
      "Tick the circle beside a task in Where to focus today or Carried over from earlier to mark it done.",
      "Tap a Quick Win to act on it, then press Open Daily Compass to get to work."
    ],
    "health": "Reading this page does not change your scores. Tasks you tick done here count toward your task follow-through, which feeds your health score.",
    "tips": [
      "Next meeting moves on through the day as your meetings pass.",
      "Each time you open the page your assistant writes a fresh briefing, which uses your AI key.",
      "Press Show all to see every Quick Win here. To edit them, go to Daily Compass."
    ],
    "questions": [
      {
        "q": "Why does it say to add my AI key?",
        "a": "The briefing needs your own AI key. Press Set up your AI assistant to connect one."
      },
      {
        "q": "What is Carried over from earlier?",
        "a": "Open tasks that are not in your Today list. Up to six show here, highest priority first."
      },
      {
        "q": "Where do I find this in the left menu?",
        "a": "It is not in the left menu. Open it from the Your Morning Brief card on Executive Home."
      }
    ],
    "related": [
      "executive-home",
      "daily-compass",
      "quick-wins",
      "tasks",
      "todays-schedule"
    ],
    "who": "Everyone. Team members need the Daily Compass area. Tasks, money and calendar parts of the page follow their other areas.",
    "keywords": [
      "morning brief",
      "briefing",
      "daily briefing",
      "start my day",
      "next meeting",
      "carried over",
      "where to focus",
      "summary of my day",
      "ai briefing"
    ],
    "sections": [
      {
        "id": "where-to-focus-today",
        "title": "Where to focus today",
        "body": "Up to six tasks from your Today list, highest priority first. Tick one to mark it done and it drops off the page.",
        "keywords": [
          "focus",
          "today",
          "top tasks",
          "priority",
          "mark done"
        ]
      },
      {
        "id": "carried-over",
        "title": "Carried over from earlier",
        "body": "Up to six open tasks that are not in your Today list, so nothing slips out of sight.",
        "keywords": [
          "carried over",
          "overflow",
          "still open",
          "earlier"
        ]
      }
    ]
  },
  {
    "id": "daily-compass",
    "name": "Daily Compass",
    "area": "Daily Operations",
    "where": "Daily Operations > Daily Compass",
    "href": "/daily-compass",
    "what": "Your working page for today. It shows what to do now, matched to your energy, with a progress bar, your deals to move, today's activity, insights from your assistant and your Quick Wins.",
    "ai": "Has an AI button",
    "aiNote": "Your assistant writes the Insights card from your own data, using your own AI key. AI suggest and Polish with AI in Quick Wins use the same key. Follow-up email drafts show here for you to review and send. Without a key, the rest of the page still works.",
    "steps": [
      "Open Daily Compass from the left menu, or press Start My Day on Executive Home.",
      "Press the arrow beside Today's Focus to open it. It starts folded.",
      "Choose High Energy, Medium Energy or Low Energy to see the tasks that fit how you feel.",
      "Tick tasks off as you finish them and watch Today's Progress fill.",
      "Check Deals to move today and Upcoming follow-ups.",
      "Use Quick Actions to jump to Sales Activities, the Content Calendar or Scripts & Templates."
    ],
    "health": "Tasks you finish here count toward your task follow-through, part of your health score. Insights are written from your scores, your 12 dimensions and your 8 pillars, but reading them does not change your scores.",
    "tips": [
      "Drag a card by its grip to move it. The order is remembered on this device.",
      "Lower your energy and harder tasks tuck away. Press Show higher-energy tasks to bring them back."
    ],
    "questions": [
      {
        "q": "What counts toward Today's Progress?",
        "a": "Your focus tasks plus the recurring tasks due today."
      },
      {
        "q": "How do I set a task's energy?",
        "a": "Choose it when you add the task with Add Task here. A task with no energy set counts as medium."
      },
      {
        "q": "Why are my insights the same as earlier?",
        "a": "They are kept for 30 minutes so the page does not run your AI every time. Press the refresh icon on the card for a new set."
      }
    ],
    "related": [
      "quick-wins",
      "weekly-view",
      "tasks",
      "morning-brief",
      "sales-activities",
      "scripts-templates",
      "reminders"
    ],
    "who": "Everyone. Team members need the Daily Compass area.",
    "keywords": [
      "compass",
      "daily compass",
      "today",
      "energy",
      "focus",
      "progress",
      "start my day",
      "deals",
      "follow-ups",
      "insights",
      "activity",
      "priorities"
    ],
    "sections": [
      {
        "id": "todays-focus",
        "title": "Today's Focus",
        "body": "Tasks in Today or In Progress, plus anything due today or overdue, filtered by your energy. Tasks you finished today stay in view. A follow-up marked AI draft ready has Review and Send buttons.",
        "keywords": [
          "todays focus",
          "energy",
          "high energy",
          "low energy",
          "ai draft ready",
          "review",
          "send",
          "follow-up email"
        ]
      },
      {
        "id": "quick-actions",
        "title": "Quick Actions",
        "body": "Three tiles that open Sales Activities, the Content Calendar and Scripts & Templates. Drag them to reorder them.",
        "keywords": [
          "quick actions",
          "shortcuts",
          "sales activities",
          "content calendar",
          "scripts"
        ]
      },
      {
        "id": "deals-to-move-today",
        "title": "Deals to move today",
        "body": "Deals whose next step is due today or overdue, and deals with no movement in 14 days or more. Press one to open its card on your Pipeline.",
        "keywords": [
          "deals",
          "stalled",
          "overdue",
          "next step",
          "pipeline"
        ]
      },
      {
        "id": "todays-activity",
        "title": "Today's Activity",
        "body": "Counts your Sales Calls, Follow-ups and Posts for today, with your recent entries. It adds up Sales Activities dated today and follow-up tasks you complete today.",
        "keywords": [
          "activity",
          "calls",
          "follow-ups",
          "posts",
          "today's count"
        ]
      },
      {
        "id": "upcoming-follow-ups",
        "title": "Upcoming follow-ups",
        "body": "The next six future follow-ups or timed tasks. The card only shows when you have some.",
        "keywords": [
          "upcoming",
          "follow-ups",
          "scheduled",
          "next"
        ]
      },
      {
        "id": "insights",
        "title": "Insights",
        "body": "Up to three short insights, each tied to something specific in your data. If there is not enough data yet, it says so and points you to what to finish.",
        "keywords": [
          "insights",
          "ai insights",
          "refresh",
          "advice",
          "assistant"
        ]
      }
    ]
  },
  {
    "id": "quick-wins",
    "name": "Quick Wins",
    "area": "Daily Operations",
    "where": "Daily Compass > Quick Wins",
    "href": "/daily-compass",
    "what": "A menu of small, high-impact moves. You start with ten. Six send a ready-made email and four add a task to today. The win stays on your list so you can use it again.",
    "ai": "Has an AI button",
    "aiNote": "AI suggest adds a new win tailored to your weakest area. Polish with AI rewrites one you are editing. Both use your own AI key. AI suggest saves the new win to your list straight away, and you can edit or delete it. The ready-made emails are not written by AI.",
    "steps": [
      "Open Daily Compass from the left menu and find Quick Wins at the bottom of the page.",
      "Press a win marked Add to put it on today's tasks.",
      "Press a win marked Send, then search your contacts and pick the person.",
      "Read the email, change anything you like, and fill in any parts in [square brackets].",
      "Press Send it. If sending is not set up yet, press Copy, send it from your own email, then press I sent it myself.",
      "Press Manage to edit or delete a win, or to add your own."
    ],
    "health": "A finished Quick Win counts as a task done, which feeds your task follow-through. A Send win is also logged on Sales Activities, and recent sales activity feeds your Sales dimension and your Customer Acquisition pillar.",
    "tips": [
      "Change the words so they sound like you, then press Save this as my wording. Go back to the starting wording undoes it.",
      "Keep the title of a Send win as it is. If you change the title, it becomes a plain Add win.",
      "The first four wins on your list also show on your Morning Brief."
    ],
    "questions": [
      {
        "q": "Whose name is on the email?",
        "a": "Your first name as the account owner, even when a team member sends it."
      },
      {
        "q": "What gets logged when I send one?",
        "a": "A completed task for today, an Email on Sales Activities, and a note on that person's timeline. I sent it myself logs the same three."
      },
      {
        "q": "Why can't I press Send it?",
        "a": "Pick the person and fill in every [bracketed] part first. Send it stays off if your email sending is not set up or if the person has unsubscribed."
      }
    ],
    "related": [
      "daily-compass",
      "morning-brief",
      "tasks",
      "contacts",
      "sales-activities"
    ],
    "who": "Everyone. Team members need the Daily Compass and Tasks areas, plus Contacts to pick a person for a Send win.",
    "keywords": [
      "quick wins",
      "quick win",
      "small actions",
      "testimonial request",
      "referral",
      "thank you note",
      "reconnect",
      "follow up proposal",
      "ready-made email",
      "email template",
      "ai suggest",
      "polish with ai",
      "my wording",
      "manage"
    ],
    "sections": [
      {
        "id": "send-emails",
        "title": "The six ready-made emails",
        "body": "Testimonial request, share a client win, reconnect with a past client, follow up an open proposal, ask for a referral, and thank a referral partner. They go out from your own email setup under Contacts > Email sending.",
        "keywords": [
          "send",
          "ready-made",
          "testimonial",
          "referral",
          "reconnect",
          "proposal",
          "thank you",
          "email sending"
        ]
      },
      {
        "id": "save-my-wording",
        "title": "Save this as my wording",
        "body": "Saves your version of that email for your whole account. The person's name and your signature fill in on their own each time.",
        "keywords": [
          "save wording",
          "my wording",
          "own voice",
          "edit template",
          "starting wording"
        ]
      },
      {
        "id": "manage-quick-wins",
        "title": "Manage your list",
        "body": "Manage shows edit and delete buttons on each win, and Add a quick win at the end. You can set the title, a one-line detail, an emoji and a priority.",
        "keywords": [
          "manage",
          "edit",
          "delete",
          "add a quick win",
          "priority",
          "emoji"
        ]
      }
    ]
  },
  {
    "id": "weekly-view",
    "name": "Weekly View",
    "area": "Daily Operations",
    "where": "Daily Compass > Weekly View",
    "href": "/daily-compass/weekly",
    "what": "Your real week, Monday to Sunday: what you did each day, your streak, your weekly goals and a summary of your calls, posts, follow-ups and tasks.",
    "ai": "No AI",
    "aiNote": "",
    "steps": [
      "Open Daily Compass from the left menu and press Weekly View at the top.",
      "Look at your Day Streak, Longest Streak and Active Days This Week.",
      "Read each day's box to see what you did.",
      "Check your Weekly Goals. Press Set goals to change your targets in Sales Activities.",
      "Use the arrows to look back at earlier weeks. Press This week to return."
    ],
    "health": "This does not change your scores. It shows the week's real activity against your goals, so you can see your rhythm.",
    "tips": [
      "One small thing keeps a day active: finish a task, check off a recurring task, log a call or follow-up, or publish a post.",
      "A quiet morning does not break your streak. It still counts yesterday until today's first action.",
      "Posting goals live in the Content Calendar, not here."
    ],
    "questions": [
      {
        "q": "What counts as an active day?",
        "a": "A day when you did at least one thing: finished a task, checked off a recurring task, logged a call or follow-up, or published a post."
      },
      {
        "q": "Where do the numbers come from?",
        "a": "Calls and follow-ups come from Sales Activities and follow-up tasks you complete. Posts come from your Content Calendar. Tasks come from your task list and recurring tasks."
      },
      {
        "q": "Why does a goal say no goal set?",
        "a": "You have not set a weekly target for it yet. Press Set goals to add one in Sales Activities."
      }
    ],
    "related": [
      "daily-compass",
      "sales-activities",
      "tasks",
      "recurring-tasks"
    ],
    "who": "Everyone. Team members need the Daily Compass area.",
    "keywords": [
      "weekly view",
      "week",
      "streak",
      "longest streak",
      "active days",
      "weekly goals",
      "week summary",
      "goals",
      "habit",
      "monday to sunday",
      "last week"
    ],
    "sections": [
      {
        "id": "weekly-goals",
        "title": "Weekly Goals",
        "body": "Bars for Sales Calls, Follow-ups and Proposals Sent, plus any other activity you set a target for. Targets come from Sales Activities.",
        "keywords": [
          "goals",
          "targets",
          "sales calls",
          "follow-ups",
          "proposals"
        ]
      },
      {
        "id": "week-summary",
        "title": "Week Summary",
        "body": "Your totals for the week: Sales Calls, Posts Published, Follow-ups and Tasks Done.",
        "keywords": [
          "summary",
          "totals",
          "calls",
          "posts",
          "tasks done"
        ]
      }
    ]
  },
  {
    "id": "sales-activities",
    "name": "Sales Activities",
    "area": "Daily Operations",
    "where": "Daily Compass > Quick Actions > Sales Activities",
    "href": "/daily-compass/sales-activities",
    "what": "Your log of every sales touch: calls, follow-ups, emails, DMs, meetings, demos and proposals. It adds them up into tiles, shows this week against your goals, and gives you a report.",
    "ai": "Has an AI button",
    "aiNote": "Press Report, then AI summary. Your assistant reads your activity against your Sales Plan, weekly targets and pipeline and writes what is working, where the gaps are and your best next move. This uses your own AI key. Without a key you see the plain numbers instead.",
    "steps": [
      "Open Daily Compass from the left menu and press Sales Activities under Quick Actions.",
      "Press Log activity. Choose the type and priority, then add the contact, what it is about, the date and the value.",
      "Press Save. Set the outcome on the activity when you know it: Connected, No answer, Booked, Won, Lost or Nurture.",
      "Tick the circle on an activity when it is complete.",
      "Under This week vs. goals, type your weekly goal beside each type.",
      "Press Report, choose your dates, then press AI summary or CSV."
    ],
    "health": "Your log feeds your scores. Activities dated in the last 30 days count toward your Sales dimension and your Customer Acquisition pillar. Your Won and Lost outcomes set your win rate, which counts toward your Sales dimension and your Sales Journey pillar.",
    "tips": [
      "Set an outcome on every activity. Only Won and Lost outcomes shape your win rate.",
      "The trash button deletes an activity straight away, with no second question."
    ],
    "questions": [
      {
        "q": "Do I have to log the DMs I send from Outreach Pipelines?",
        "a": "No. Each DM you log with I sent it on a card is added here as a DM, so it counts toward your weekly DM total."
      },
      {
        "q": "Can I log something fast from another page?",
        "a": "Yes. Use the round + at the top of the app and choose Log a sale. It opens the Log activity window."
      },
      {
        "q": "How is the Conversion tile worked out?",
        "a": "It is won activities divided by contacted ones. Contacted means any activity with an outcome other than No answer."
      }
    ],
    "related": [
      "scripts-templates",
      "contacts",
      "daily-compass",
      "quick-wins"
    ],
    "who": "Everyone. Team members need the Sales Activities area.",
    "keywords": [
      "sales log",
      "log a call",
      "log activity",
      "log a sale",
      "touches",
      "calls",
      "follow-ups",
      "dm",
      "meetings",
      "demos",
      "proposals",
      "outcome",
      "pipeline value",
      "conversion",
      "weekly goals",
      "targets",
      "report",
      "csv",
      "export"
    ],
    "sections": [
      {
        "id": "activity-tiles",
        "title": "Activity tiles",
        "body": "Four tiles sit at the top: Activities, Pipeline (open value), Won and Conversion. Use the filter buttons under them to see all, open, completed or one type.",
        "keywords": [
          "tiles",
          "pipeline value",
          "won",
          "conversion",
          "filter"
        ]
      },
      {
        "id": "weekly-goals",
        "title": "This week vs. goals",
        "body": "Each activity type shows what you have done this week against the goal you typed, with a bar. Change a goal any time by typing over it.",
        "keywords": [
          "weekly target",
          "goal",
          "this week",
          "tally"
        ]
      },
      {
        "id": "activity-report",
        "title": "Report",
        "body": "Press Report, pick From and To dates, or leave them blank for all time. AI summary writes a short read of your activity. CSV downloads your activity as a spreadsheet file.",
        "keywords": [
          "ai summary",
          "csv",
          "download",
          "date range",
          "export"
        ]
      },
      {
        "id": "logged-for-you",
        "title": "Activities logged for you",
        "body": "A DM you log with I sent it on an Outreach Pipelines card is added here. So is a Quick Win email you send from the Suite.",
        "keywords": [
          "i sent it",
          "outreach pipelines",
          "automatic",
          "quick win email"
        ]
      },
      {
        "id": "activity-segment",
        "title": "Tag to a segment",
        "body": "You can tag an activity to one of your business segments when you log it, so it shows up in that segment's Sales score.",
        "keywords": [
          "segment",
          "business segment",
          "tag"
        ]
      }
    ]
  },
  {
    "id": "scripts-templates",
    "name": "Scripts & Templates",
    "area": "Daily Operations",
    "where": "Daily Compass > Quick Actions > Scripts & Templates",
    "href": "/daily-compass/scripts",
    "what": "Ready-to-use words for your sales and marketing. The Starter Library has 200 scripts, emails and DMs. My Library holds your own, private to your account.",
    "ai": "Has an AI button",
    "aiNote": "Two places use your own AI key. In Fill in & personalize, your assistant rewrites a script using what it knows about your business. In New, AI (guided) drafts a script from a few questions. Nothing is saved until you save it, and you can read and change every word first.",
    "steps": [
      "Open Daily Compass from the left menu and press Scripts & Templates under Quick Actions.",
      "Choose Starter Library or My Library, then search or filter by category and platform.",
      "Press View to read one, or Copy to take it as it is.",
      "Press Fill in & personalize, type in the blanks and check the Preview.",
      "Ask your assistant to rewrite it if you like, then press Save to My Library or Copy."
    ],
    "health": "This does not change your scores. It gives you the right words faster, so your sales and marketing work gets done.",
    "tips": [
      "Use [brackets] in your own scripts. Anything in brackets becomes a blank to fill in.",
      "Click a platform badge on any script to see everything for that platform."
    ],
    "questions": [
      {
        "q": "Can other clients see what I save?",
        "a": "No. Starter items are shared examples for everyone. What you save to My Library is private to your account."
      },
      {
        "q": "Can I change a Starter Library script?",
        "a": "Save it to My Library first. That gives you your own copy to edit."
      },
      {
        "q": "Why is my script marked Draft · not approved?",
        "a": "It is waiting for you. Drafts are not offered when you send DMs. Press Approve and it replaces the original of the same name, if there is one."
      }
    ],
    "related": [
      "sales-activities",
      "quick-wins",
      "daily-compass",
      "contacts"
    ],
    "who": "Everyone. Team members need the Scripts area.",
    "keywords": [
      "scripts",
      "templates",
      "email template",
      "dm template",
      "sales script",
      "swipe",
      "wording",
      "what to say",
      "objections",
      "follow up",
      "library",
      "my library",
      "starter library",
      "personalize",
      "rewrite",
      "favorites",
      "fill in the blanks"
    ],
    "sections": [
      {
        "id": "starter-library",
        "title": "Starter Library",
        "body": "200 ready-to-use scripts, emails and DMs across Sales, Prospecting, Objections, Onboarding, Follow-up, Content, Nurture and Closing. Press Save to My Library to keep your own copy.",
        "keywords": [
          "200 scripts",
          "examples",
          "categories"
        ]
      },
      {
        "id": "my-library",
        "title": "My Library",
        "body": "Your own scripts and the ones you saved. You can edit, delete and star them, and press Favorites to see only your stars. Each one shows how often you have used it.",
        "keywords": [
          "favorites",
          "star",
          "edit",
          "private",
          "saved scripts"
        ]
      },
      {
        "id": "fill-in-personalize",
        "title": "Fill in & personalize",
        "body": "Type in the blanks and watch the Preview update. Then press Make it mine, Shorter, Warmer or More direct, or type what to change and press Rewrite. Undo rewrite puts it back.",
        "keywords": [
          "blanks",
          "make it mine",
          "shorter",
          "warmer",
          "more direct",
          "rewrite",
          "undo"
        ]
      },
      {
        "id": "new-script",
        "title": "Write or generate a new one",
        "body": "Press New. Choose Write it myself, or AI (guided) and answer what it is for, who it is for, the channel, type, tone and key points. Generate draft drops the result into a form to change before you save.",
        "keywords": [
          "new script",
          "generate",
          "ai guided",
          "write my own",
          "generate draft"
        ]
      },
      {
        "id": "add-to-dm-pipeline",
        "title": "Add to DM Pipeline",
        "body": "Scripts in My Library meant for DMs have an Add to DM Pipeline button. Use it to log who you sent the script to.",
        "keywords": [
          "dm pipeline",
          "outreach",
          "log who i sent",
          "send"
        ]
      },
      {
        "id": "drafts-to-review",
        "title": "Drafts to review",
        "body": "When you have drafts, My Library shows how many and a Drafts to review filter. Approve them one at a time, or narrow the list and approve the ones shown.",
        "keywords": [
          "draft",
          "approve",
          "not approved",
          "review"
        ]
      }
    ]
  },
  {
    "id": "tasks",
    "name": "Tasks",
    "area": "Daily Operations",
    "where": "Daily Operations > Tasks",
    "href": "/tasks",
    "what": "One list of everything you have to do. Your tasks sit in Overdue, Today, In Progress, Waiting, Backlog and Done, each project has its own section below them, and open work from other pages, such as reminders and project milestones, appears here too.",
    "ai": "Has an AI button",
    "aiNote": "Press Have my assistant work on this on any open task. Your assistant reads the task, checks what it can, prepares what it can and reports back. This uses your own AI key. Anything it prepares waits for your Approve, and See report on the task opens its report.",
    "steps": [
      "Open Tasks from the left menu.",
      "Add a task in the box at the top. Give it a priority, a due date and a project if you want them.",
      "Drag it between lists as the work moves. On a phone, use More on the task.",
      "When you are waiting on someone, move it to Waiting and fill in who and the Check back date.",
      "Mark it done when it is finished, then archive what is done when you want a tidy list."
    ],
    "health": "Finishing tasks counts toward your health score, through your Internal Process & Culture pillar. Task follow-through looks at work you finished in the last 60 days, open tasks past their due date, and tasks due in the next 14 days. Finished work lifts it and due dates that pass lower it. It needs at least three tasks, and tasks with no date never count against you.",
    "tips": [
      "Today starts fresh each day. A task left in Today from an earlier day moves to Backlog as Earlier Today.",
      "Choose List or Cards beside the search box. Your choice follows you to every device.",
      "Press a count under the Add box to jump to that list. Hover over it to see what it includes."
    ],
    "questions": [
      {
        "q": "Does archiving a task remove it from my score?",
        "a": "No. Archived tasks still count toward follow-through. Open Archived at the top of the page to restore one."
      },
      {
        "q": "Why is there a task here I did not add?",
        "a": "Dashed rows are open work from another page, such as a reminder or a project milestone. Each one opens where it lives, and marking it done here updates that page."
      },
      {
        "q": "Can I drag a task into Overdue?",
        "a": "No. Overdue fills itself from due dates. It shows open tasks dated before today, and only when there are some."
      }
    ],
    "related": [
      "reminders",
      "recurring-tasks",
      "projects",
      "waiting-for-my-approval",
      "business-alignment",
      "contacts"
    ],
    "who": "Everyone. Team members need the Tasks area. A team member in the Sales role sees only the tasks assigned to them, and does not get the assistant button or the rows from other pages.",
    "keywords": [
      "to do",
      "todo",
      "list",
      "due date",
      "priority",
      "assign",
      "overdue",
      "backlog",
      "archive",
      "kanban",
      "drag",
      "notes",
      "project",
      "program",
      "search tasks",
      "filter",
      "delegate"
    ],
    "sections": [
      {
        "id": "lists-and-today",
        "title": "Lists and the Today rule",
        "body": "Each list folds away. Today holds tasks dated today plus anything you drag or add there today. Backlog holds what is not for now. Done shows the newest 12 first, with Show all.",
        "keywords": [
          "today",
          "fold",
          "collapse",
          "counts",
          "done list",
          "earlier today"
        ]
      },
      {
        "id": "waiting",
        "title": "Waiting list",
        "body": "Each task in Waiting has a Waiting on box and a Check back date, and shows how long it has waited. On its check-back day it returns to Today with a Time to check chip.",
        "keywords": [
          "waiting on",
          "check back",
          "follow up later",
          "time to check"
        ]
      },
      {
        "id": "list-or-cards",
        "title": "List or Cards",
        "body": "List shows compact rows. Cards shows a grid with the notes preview, project and Waiting row inside. Search, filters and dragging work the same in both.",
        "keywords": [
          "view",
          "layout",
          "grid",
          "rows"
        ]
      },
      {
        "id": "one-list",
        "title": "One list for everything outstanding",
        "body": "Dashed rows carry a label and show open work from elsewhere: reminders, project milestones, legal checklist items, recurring tasks due today, huddle to-dos and your assistant's steps for you. They show in the Everyone view.",
        "keywords": [
          "dashed",
          "linked",
          "milestone",
          "legal",
          "huddle",
          "recurring",
          "assistant step"
        ]
      },
      {
        "id": "notes-project-program",
        "title": "Notes, project, program and search",
        "body": "Press More on a task for Notes and additional information, Project and Program. The first line of your notes shows under the title. Search looks in titles, notes, project names and program names, and the counts follow your filters.",
        "keywords": [
          "notes",
          "additional information",
          "program",
          "offer",
          "search",
          "all projects",
          "all programs",
          "clear filters"
        ]
      },
      {
        "id": "project-sections",
        "title": "Project sections",
        "body": "Under the lists is a folded section for each project, with its own add box. Press New project beside Archived to start one. Drag a task onto a section to file it there, or onto No project to take it out.",
        "keywords": [
          "new project",
          "project section",
          "file under project",
          "no project"
        ]
      },
      {
        "id": "reorder-sections",
        "title": "Put sections in your order",
        "body": "Every section has a grip on its left edge. Drag it to set your own order, which is saved to your account. This works with a mouse or trackpad, not touch.",
        "keywords": [
          "reorder",
          "grip",
          "drag sections",
          "arrange"
        ]
      },
      {
        "id": "archive",
        "title": "Archive",
        "body": "Use Archive on one finished task, or Archive all done in the Done list. Archived at the top lists them with Restore.",
        "keywords": [
          "archive all done",
          "restore",
          "archived",
          "tidy"
        ]
      },
      {
        "id": "assign-tasks",
        "title": "Assign to your team",
        "body": "Choose a team member when you add a task, or under More. They get an email about a new task. The buttons above the Add box show Everyone, Assigned to me or one person.",
        "keywords": [
          "assign",
          "team",
          "delegate",
          "assigned to me",
          "everyone"
        ]
      }
    ]
  },
  {
    "id": "recurring-tasks",
    "name": "Recurring Tasks",
    "area": "Daily Operations",
    "where": "Executive Home > Priority Tasks > Recurring",
    "href": "/",
    "what": "The routines that repeat in your business: every day, on certain days of the week, or once a month. The RECURRING column shows only what is due today, and you tick each one off for the day.",
    "ai": "No AI",
    "aiNote": "There is no AI button here. Your assistant can see the recurring tasks due today when you chat with it.",
    "steps": [
      "Open Executive Home from the left menu and find the Priority Tasks card.",
      "Press the + beside RECURRING.",
      "Type a title, then choose Every day, On certain days of the week or Once a month under Repeats.",
      "Add a time of day if you want one, and choose Due by this time or Do it at this time.",
      "Pick a priority and press Add recurring task.",
      "Tick a task off in the RECURRING column each time you do it."
    ],
    "health": "Having routines set counts toward your Internal Process & Culture pillar. It looks at how many recurring tasks you have set up, not how many you tick off.",
    "tips": [
      "Choosing certain days? Press Weekdays only to pick Monday to Friday at once.",
      "A task set for the 31st lands on the last day of shorter months."
    ],
    "questions": [
      {
        "q": "How do I change or stop a recurring task?",
        "a": "Press its name in the RECURRING column, or press the + to see them all. Use the pencil to edit it or the trash can to delete it. Editing keeps the days you already ticked off."
      },
      {
        "q": "Do recurring tasks show anywhere else?",
        "a": "Yes. Those due today also show on your Tasks page with a Recurring label, and timed ones show in Today's Schedule."
      }
    ],
    "related": [
      "tasks",
      "executive-home",
      "todays-schedule",
      "reminders",
      "daily-compass"
    ],
    "who": "Everyone. Team members need the Tasks area.",
    "keywords": [
      "recurring",
      "repeat",
      "repeating",
      "routine",
      "habit",
      "daily task",
      "weekly task",
      "monthly task",
      "check off",
      "operating rhythm",
      "cadence",
      "every day"
    ],
    "sections": [
      {
        "id": "recurring-tasks-window",
        "title": "Recurring tasks window",
        "body": "Press the + beside RECURRING to open it. It lists all your recurring tasks, including ones not due today, and has the form to add a new one.",
        "keywords": [
          "manage",
          "see all",
          "add recurring task",
          "edit"
        ]
      },
      {
        "id": "recurring-reminders",
        "title": "Reminders for timed routines",
        "body": "A recurring task with a time of day gets a reminder before it is due, in the bell and by email if you have email reminders on. You set how far ahead in Settings > Notifications.",
        "keywords": [
          "time of day",
          "bell",
          "reminder",
          "due by"
        ]
      }
    ]
  },
  {
    "id": "reminders",
    "name": "Reminders",
    "area": "Daily Operations",
    "where": "Daily Operations > Reminders",
    "href": "/reminders",
    "what": "One-off things you must not forget, such as a free trial that renews, a deadline or a call to return. They are separate from your tasks.",
    "ai": "Has an AI button",
    "aiNote": "Press Have my assistant work on this on any reminder. Your assistant reads it, checks what it can, prepares what it can and reports back. This uses your own AI key. Anything it prepares waits for your Approve. You can also ask your assistant in the chat to list, add or complete reminders.",
    "steps": [
      "Open Reminders from the left menu.",
      "Type what the reminder should say, and add notes if you want them.",
      "Press a time under Remind me, or pick a date and time and press Save reminder.",
      "When it comes due, mark it done, or snooze it with Remind me in 1 hour, Tomorrow or Next week.",
      "Press Edit to change it, or the trash can to delete it."
    ],
    "health": "This does not change your scores. It keeps one-off dates from slipping past you.",
    "tips": [
      "Use the notes box for the account, the link and what to do, so you can act the moment it comes due.",
      "Use Reminders for one-off things and Tasks for work you have to do."
    ],
    "questions": [
      {
        "q": "Where will I see a reminder?",
        "a": "On this page, on the Reminders card on Executive Home and Daily Compass, in the bell, and on your Tasks page. It is also emailed to you once when it comes due, if your email reminders are on."
      },
      {
        "q": "Can I add one without leaving my page?",
        "a": "Yes. Press the round + at the top of the app and choose New reminder, or use the Reminders card."
      },
      {
        "q": "If I snooze a reminder, will I get another email?",
        "a": "Yes. Snoozing or changing the time sets it up to be emailed again when it comes due."
      }
    ],
    "related": [
      "tasks",
      "recurring-tasks",
      "executive-home",
      "daily-compass",
      "waiting-for-my-approval"
    ],
    "who": "Everyone. Team members need the Tasks area. A team member limited to their own work sees only the reminders they made, and those stay off the owner's list.",
    "keywords": [
      "reminder",
      "remind me",
      "alert",
      "free trial",
      "renew",
      "cancel",
      "deadline",
      "snooze",
      "bell",
      "notification",
      "one-off",
      "do not forget",
      "email reminder",
      "due"
    ],
    "sections": [
      {
        "id": "remind-me-times",
        "title": "Remind me times",
        "body": "Choose In 1 hour, In 3 hours, Tomorrow 9 am, In 24 hours or Next Monday 9 am. Or pick any date and time and press Save reminder.",
        "keywords": [
          "quick times",
          "tomorrow",
          "next monday",
          "date and time"
        ]
      },
      {
        "id": "due-now-coming-up",
        "title": "Due now and Coming up",
        "body": "The page sorts your reminders into Due now and Coming up, with Show done underneath. Press the arrow on a done reminder to reopen it. The bell shows what is due now and what is coming up in the next 24 hours.",
        "keywords": [
          "due now",
          "coming up",
          "show done",
          "reopen",
          "bell"
        ]
      },
      {
        "id": "assistant-report",
        "title": "The assistant's report",
        "body": "After your assistant works on a reminder, press See the assistant's report on it to read what it did and what it prepared.",
        "keywords": [
          "report",
          "see the assistant's report",
          "work on this"
        ]
      },
      {
        "id": "task-reminders",
        "title": "Task reminders",
        "body": "This is a separate setting for tasks that have a time. In Settings > Notifications, choose 10 minutes to 2 hours ahead, and whether you also get an email. The same email switch covers your one-off reminders.",
        "keywords": [
          "task reminders",
          "lead time",
          "settings",
          "notifications",
          "email switch",
          "timed task"
        ]
      }
    ]
  },
  {
    "id": "waiting-for-my-approval",
    "name": "Waiting for my approval",
    "area": "Daily Operations",
    "where": "Daily Operations > Waiting for my approval",
    "href": "/assistant-approvals",
    "what": "One page with everything your assistant has prepared and is waiting on you for, plus your checklist of things it asked you to read, decide or do.",
    "ai": "AI-powered",
    "aiNote": "Everything here comes from your assistant, which uses your own AI key. Nothing it prepares happens until you press Approve. Typing I approve in the chat does not count. You have to press the button.",
    "steps": [
      "Open Waiting for my approval from the left menu.",
      "Read each card. If it has a link, press it to see the item in a pop-up window.",
      "Press Approve to go ahead, Cancel to throw it away, or Edit to say what to change.",
      "Under Your checklist, open each item and read it.",
      "Press Approve this one, Mark done or Mark decided on each item. Approve one and the others stay waiting."
    ],
    "health": "This page does not change your scores. It keeps you in control of what your assistant does in your account.",
    "tips": [
      "Edit does not change the card. You say what to change, and your assistant prepares a corrected one for you to approve.",
      "Some finished actions show an Undo button straight after you approve them."
    ],
    "questions": [
      {
        "q": "What if I do nothing?",
        "a": "Nothing happens. The card stays here until you approve or cancel it."
      },
      {
        "q": "I approved something in the chat window. Will it still show here?",
        "a": "No. A decision in one place updates every other copy of the card."
      },
      {
        "q": "Why do I see two lists?",
        "a": "The cards at the top are things your assistant has ready to carry out. Your checklist underneath is what it needs from you, grouped by the task or reminder it came from."
      }
    ],
    "related": [
      "tasks",
      "reminders",
      "projects",
      "contacts"
    ],
    "who": "Everyone. Team members need the AI assistant area, and the assistant acts only within the areas they have.",
    "keywords": [
      "approve",
      "approval",
      "waiting",
      "assistant prepared",
      "pending",
      "cards",
      "checklist",
      "review",
      "sign off",
      "next steps",
      "cancel",
      "edit card",
      "undo",
      "report a problem"
    ],
    "sections": [
      {
        "id": "approval-cards",
        "title": "Approval cards",
        "body": "Each card says what your assistant wants to do and has its own Approve, Edit and Cancel. The same cards show in your assistant's window.",
        "keywords": [
          "approve",
          "edit",
          "cancel",
          "send changes",
          "card"
        ]
      },
      {
        "id": "your-checklist",
        "title": "Your checklist",
        "body": "Each item is handled on its own and shows who it is for: Suite, Assistant, You or You + assistant. Depending on the item you get Open, Edit, Approve this one, Mark done, Mark decided, Have my assistant do this now, Ask my assistant to help or Remind me.",
        "keywords": [
          "checklist",
          "mark done",
          "mark decided",
          "remind me",
          "ask my assistant to help",
          "have my assistant do this now"
        ]
      },
      {
        "id": "pop-up-window",
        "title": "Pop-up work window",
        "body": "Open shows the item in one reusable pop-up window, so your list stays where it is.",
        "keywords": [
          "pop-up",
          "open",
          "new window",
          "work window"
        ]
      },
      {
        "id": "report-a-problem",
        "title": "Reporting a problem",
        "body": "If the Suite itself is not working, your assistant can offer to send the problem to support for you. It is sent only when you press Approve.",
        "keywords": [
          "report a problem",
          "support",
          "something broken",
          "bug"
        ]
      }
    ]
  },
  {
    "id": "projects",
    "name": "Projects",
    "area": "Daily Operations",
    "where": "Daily Operations > Projects",
    "href": "/projects",
    "what": "Groups your tasks into the things you are building: a launch, a challenge, a client, a program. Each project has a Board, a List, a Timeline and its own details and sharing.",
    "ai": "No AI",
    "aiNote": "The page has no AI button. In the chat, your assistant can create a project from a template or add tasks to one. It shows you a preview first and nothing happens until you press Approve. This uses your own AI key.",
    "steps": [
      "Open Projects from the left menu.",
      "Press New project.",
      "Under Start from, choose Blank project or a ready-made plan.",
      "Give it a name, a date and a goal if you want one, then press Create project.",
      "Work from the Board, List and Timeline tabs. Press a task to edit it.",
      "Use Details & sharing for milestones, notes and private links."
    ],
    "health": "A project itself does not change your scores. Its tasks are ordinary tasks, though, so finishing them on time counts toward task follow-through in your Internal Process & Culture pillar.",
    "tips": [
      "Drag a project card by its grip, or use the up and down arrows beside it, to put your cards in your own order.",
      "Use Open projects and Everything above the cards to show or hide finished projects."
    ],
    "questions": [
      {
        "q": "Do I have to enter project tasks twice?",
        "a": "No. A project's tasks are ordinary tasks, so they also appear on your Tasks page."
      },
      {
        "q": "Does my client need an account to see a project?",
        "a": "No. They get a private link and need no account. Nothing is emailed, so copy the link and send it yourself."
      },
      {
        "q": "What happens to the tasks if I delete a project?",
        "a": "You choose. Keep them as ordinary tasks, or delete them too."
      }
    ],
    "related": [
      "import-a-project",
      "tasks",
      "time",
      "team-huddle",
      "waiting-for-my-approval"
    ],
    "who": "Everyone. Team members need the Projects and Time area.",
    "keywords": [
      "projects",
      "project management",
      "launch",
      "plan",
      "board",
      "kanban",
      "gantt",
      "timeline",
      "milestones",
      "template",
      "masterclass template",
      "21 day challenge",
      "share with client",
      "contractor",
      "group tasks"
    ],
    "sections": [
      {
        "id": "project-templates",
        "title": "Ready-made plans",
        "body": "Start from MasterClass, MasterClass (repeating, four weeks), Monthly event (repeating) or 21-Day Challenge (Command Shift). Pick the date to plan around and every task is dated for you. You can change any date afterwards.",
        "keywords": [
          "template",
          "masterclass",
          "monthly event",
          "challenge",
          "command shift",
          "dated tasks"
        ]
      },
      {
        "id": "board-list-timeline",
        "title": "Board, List and Timeline",
        "body": "Board has To do, Today, In progress, Waiting and Done, and you drag cards between them. List shows the same tasks as rows. Timeline shows them across dates, with your milestones.",
        "keywords": [
          "board",
          "list",
          "timeline",
          "gantt",
          "stages",
          "columns"
        ]
      },
      {
        "id": "edit-project-task",
        "title": "Edit a task",
        "body": "Press a task to set its stage, priority, start and due dates, notes and who it is assigned to. Tick the box to show it to the clients and contractors you shared the project with.",
        "keywords": [
          "edit task",
          "stage",
          "assigned to",
          "shared task"
        ]
      },
      {
        "id": "project-milestones",
        "title": "Milestones",
        "body": "Add milestones under Details & sharing, and change their names and dates right there. Open milestones also appear on your Tasks page.",
        "keywords": [
          "milestone",
          "dates",
          "key dates"
        ]
      },
      {
        "id": "share-project",
        "title": "Share with a client or contractor",
        "body": "Create a private link under Details & sharing. A client sees the project, its progress, milestones and shared tasks. A contractor also can move the tasks assigned to them. Remove someone and the link stops working.",
        "keywords": [
          "share",
          "private link",
          "client view",
          "contractor",
          "guest",
          "create link"
        ]
      }
    ]
  },
  {
    "id": "import-a-project",
    "name": "Import a project",
    "area": "Daily Operations",
    "where": "Daily Operations > Projects > Import a project",
    "href": "/projects",
    "what": "Bring a project in from Notion, ClickUp, Asana, Trello, Monday.com, Todoist, Jira or a spreadsheet. It arrives as one new project with its tasks, dates and sections. Nothing you already have is changed.",
    "ai": "No AI",
    "aiNote": "The import reads your file without AI and does not use your AI key.",
    "steps": [
      "Open Projects from the left menu and press Import a project.",
      "Export the project from your other tool. The window shows how for each one.",
      "Press Choose a file, or paste your list and press Read what I pasted.",
      "Check where each column goes, give the project a name, and look over the first tasks as they will arrive.",
      "Press the Import button. It shows how many tasks will come in.",
      "Press Open the project to see it."
    ],
    "health": "The import itself does not change your scores. Imported tasks are ordinary tasks, so they count toward task follow-through, which is part of your Internal Process & Culture pillar. Finished work lifts it. Open tasks whose due dates have passed lower it.",
    "tips": [
      "Before you import, check the dates. An open task that arrives with a past due date counts as slipped until you finish it or change its date.",
      "Export one project at a time. Each import takes up to 5 MB and 2,000 tasks."
    ],
    "questions": [
      {
        "q": "Will this change my existing projects or tasks?",
        "a": "No. Each import creates one new project and leaves everything else alone."
      },
      {
        "q": "What happens to people named on the tasks?",
        "a": "Anyone on your team is matched by name or email. Anyone else is kept as a note on the task."
      },
      {
        "q": "Can I upload an Excel file?",
        "a": "Save it as a CSV first, or select the cells and paste them in."
      }
    ],
    "related": [
      "projects",
      "tasks"
    ],
    "who": "Everyone. Team members need edit access to the Projects and Time area.",
    "keywords": [
      "import",
      "import project",
      "bring in",
      "move from",
      "migrate",
      "transfer",
      "notion",
      "clickup",
      "asana",
      "trello",
      "monday",
      "todoist",
      "jira",
      "airtable",
      "google sheets",
      "excel",
      "spreadsheet",
      "csv",
      "upload tasks"
    ],
    "sections": [
      {
        "id": "what-you-can-bring",
        "title": "What you can bring in",
        "body": "Upload a CSV, a Trello JSON file, a Markdown checklist or a zip, which is how Notion exports. You can also paste copied spreadsheet cells or a plain list with one task per line.",
        "keywords": [
          "csv",
          "trello json",
          "markdown",
          "checklist",
          "notion zip",
          "paste",
          "file type"
        ]
      },
      {
        "id": "match-your-columns",
        "title": "Matching your columns",
        "body": "The Suite recognizes the tool and matches each column to task name, status, priority, start and due dates, assigned to, notes, labels and section. You can change any match. Only the task name is required.",
        "keywords": [
          "columns",
          "mapping",
          "match",
          "fields",
          "status",
          "priority",
          "labels"
        ]
      },
      {
        "id": "sections-and-statuses",
        "title": "Sections and statuses",
        "body": "If your file has sections, choose whether they become milestones on the timeline, the task's status, or just a note on each task. Your own status words can each be sent to Backlog, Today, In progress, Waiting or Done.",
        "keywords": [
          "sections",
          "lists",
          "milestones",
          "timeline",
          "status words",
          "backlog"
        ]
      },
      {
        "id": "dates",
        "title": "Reading your dates",
        "body": "If your dates look like 03/04/2026, choose whether that means March 4 or April 3. The Suite also reads Jira dates such as 15/Sep/26. It tells you how many dates it could not read, and those tasks arrive without that date.",
        "keywords": [
          "date format",
          "day first",
          "month first",
          "jira dates",
          "unreadable dates"
        ]
      }
    ]
  },
  {
    "id": "time",
    "name": "Time",
    "area": "Daily Operations",
    "where": "Daily Operations > Time",
    "href": "/time",
    "what": "Track the hours you spend on each client, project and task. See how full your week is, how much of it is billable, and what that time is worth.",
    "ai": "No AI",
    "aiNote": "The page itself has no AI. Your chat assistant can tell you this week's or last week's hours against your capacity, and add time you already worked, which waits behind Approve. It cannot run a timer. The assistant uses your own AI key.",
    "steps": [
      "Open Time from the left menu.",
      "Under Start a timer, choose a client, project or task if you like, and say what you worked on.",
      "Press Start. Press Stop when you finish.",
      "Forgot the timer? Use Add time by hand further down the page.",
      "Set your weekly hours and rates under Capacity and rates, then press Save capacity and rates.",
      "Check your week at the top, and press Download CSV for your records or invoicing."
    ],
    "health": "This does not change your scores. It shows where your hours go, so you can see whether your week matches your capacity.",
    "tips": [
      "Client, project and task are all optional, so you can start the timer first and stay focused.",
      "Rates apply to new entries. Changing a rate does not change time you already tracked.",
      "Download CSV gives you the week on screen, so choose the week and the Only my time box first."
    ],
    "questions": [
      {
        "q": "Can I fix an entry after I stop the timer?",
        "a": "Yes. Under Entries you can change the minutes, switch between Billable and Not billable, or delete the entry."
      },
      {
        "q": "Can I see my team's time?",
        "a": "Yes. Untick Only my time to see everyone's entries for that week."
      },
      {
        "q": "What if I never set a weekly target?",
        "a": "The page uses a 30-hour week until you change it under Capacity and rates."
      }
    ],
    "related": [
      "projects",
      "tasks",
      "contacts"
    ],
    "who": "Everyone. Team members need the Projects and Time area. Each person runs their own timer.",
    "keywords": [
      "time tracking",
      "timer",
      "timesheet",
      "hours",
      "billable",
      "billable hours",
      "hourly rate",
      "capacity",
      "stopwatch",
      "track time",
      "retainer",
      "invoice hours",
      "csv"
    ],
    "sections": [
      {
        "id": "timer-and-manual-time",
        "title": "Timer or time by hand",
        "body": "You can have one timer running at a time. Billable is ticked unless you untick it. Add time by hand asks for the date, the time you started, and the hours and minutes.",
        "keywords": [
          "start",
          "stop",
          "add time",
          "manual time",
          "forgot timer"
        ]
      },
      {
        "id": "your-week",
        "title": "Your week at a glance",
        "body": "Three cards show This week against your weekly hours, Billable hours, and Billable value. Below them are totals By client and By project, then every entry by day. Use the arrows for other weeks, and This week to come back.",
        "keywords": [
          "this week",
          "billable value",
          "by client",
          "by project",
          "over capacity",
          "other weeks"
        ]
      },
      {
        "id": "capacity-and-rates",
        "title": "Capacity and rates",
        "body": "Set the hours you want to work each week and a default hourly rate. Add a separate rate for any client. New entries for that client use their rate, and other entries use the default.",
        "keywords": [
          "capacity",
          "weekly target",
          "default rate",
          "client rate",
          "hourly rate"
        ]
      }
    ]
  },
  {
    "id": "lc-volant",
    "name": "LC Volant",
    "area": "Daily Operations",
    "where": "Daily Operations > LC Volant",
    "href": "/volant",
    "what": "Turn any recording or transcript into a clear report. Pick one of 21 templates, bring in the conversation, and send each action item to Tasks, a reminder or your calendar.",
    "ai": "AI-powered",
    "aiNote": "Write my report uses your own AI key. Turning a recording into a transcript does not use your key. Nothing goes to Tasks, Reminders or your calendar until you press the button on that item, and draft emails are never sent for you.",
    "steps": [
      "Open LC Volant from the left menu and press New report.",
      "Pick a template. The page shows what your report will have.",
      "Add a name and date. If the session was with someone, choose them so the report is saved on their contact record.",
      "Tick the box that everyone agreed to be recorded, then record, upload, or paste your transcript.",
      "Press Write my report.",
      "Send each action item where it belongs with Add to Tasks, Set a reminder or Add to calendar."
    ],
    "health": "This does not change your scores. It keeps what was said and decided in one place. An action item you press Add to Tasks on becomes a task, and tasks count toward task follow-through in your Internal Process & Culture pillar.",
    "tips": [
      "The consent box is required before you record, upload or write a report. Some states require every person's consent.",
      "Keep the page open while you use Record now. Once a recording is uploaded you can leave, and the bell tells you when it is ready.",
      "A very long transcript is read up to about 10,000 words, and the report tells you when that happens."
    ],
    "questions": [
      {
        "q": "Do you keep my recording?",
        "a": "No. A recording uploaded or made in the Suite is deleted once it is transcribed, and the text is kept. Zoom cloud recordings stay in your Zoom."
      },
      {
        "q": "How much can I transcribe?",
        "a": "Each account can transcribe 10 hours of recordings a month, with up to 3 in progress at a time. The page shows your hours used. Transcript files and pasted text do not count."
      },
      {
        "q": "Does the report go out to my client?",
        "a": "No. Nothing is sent. Copy report copies it without the private notes, and Copy draft copies a draft email for you to edit and send yourself."
      }
    ],
    "related": [
      "tasks",
      "reminders",
      "contacts",
      "team-huddle"
    ],
    "who": "Everyone. Team members need the LC Volant area.",
    "keywords": [
      "volant",
      "transcript",
      "transcribe",
      "transcription",
      "recording",
      "record a meeting",
      "meeting notes",
      "session notes",
      "coaching notes",
      "report",
      "summary",
      "action items",
      "zoom recording",
      "captions",
      "srt",
      "subtitles",
      "notetaker",
      "note taker",
      "voice memo"
    ],
    "sections": [
      {
        "id": "record-now",
        "title": "Record now",
        "body": "Record right in the Suite with your microphone. Tick the box to also record an online call in another Chrome or Edge tab. You can Pause, Resume or Discard, then press Stop and transcribe.",
        "keywords": [
          "record now",
          "microphone",
          "record a call",
          "pause",
          "stop and transcribe",
          "chrome",
          "edge"
        ]
      },
      {
        "id": "zoom-cloud-recordings",
        "title": "Zoom cloud recordings",
        "body": "If you see Connect Zoom, press it and your recordings from the last 30 days are listed with a Transcribe button. Pick up new recordings automatically brings in new ones of 3 minutes or more, and you can limit it to meetings with certain words in their name. Turn it on only for meetings where everyone agrees to be recorded.",
        "keywords": [
          "connect zoom",
          "zoom",
          "cloud recording",
          "automatic",
          "pick up new recordings",
          "meeting name"
        ]
      },
      {
        "id": "upload-a-recording",
        "title": "Upload a recording",
        "body": "Upload audio or video from Zoom, your phone, a camera or any recorder, up to 2 GB. Common files such as mp4, mov, mp3, m4a and wav all work. If a video is too big, upload the audio only.",
        "keywords": [
          "upload",
          "video",
          "audio",
          "mp4",
          "mov",
          "mp3",
          "m4a",
          "wav",
          "2 gb"
        ]
      },
      {
        "id": "transcript-files",
        "title": "Transcript files and pasted text",
        "body": "Already have a transcript? Upload a .txt, .docx, .pdf, .vtt, .srt or .md file from any app, or paste the text into the box.",
        "keywords": [
          "transcript file",
          "txt",
          "docx",
          "pdf",
          "vtt",
          "paste transcript",
          "otter",
          "plaud"
        ]
      },
      {
        "id": "name-the-voices",
        "title": "Name the voices and captions",
        "body": "When a recording is transcribed, press Name the voices and use it. Each voice shows its first words so you can tell who is who. Then press Use this transcript, or Download captions (.srt) for your videos.",
        "keywords": [
          "speakers",
          "speaker labels",
          "voices",
          "captions",
          "srt",
          "use this transcript"
        ]
      },
      {
        "id": "templates",
        "title": "The 21 templates",
        "body": "Templates cover coaching, mastermind and group sessions, team meetings, consultations, brain dumps, conferences, workshops, speaking and retreat planning, client kickoffs, strategy sessions, podcasts, webinars, partnership and vendor calls, client success and hiring interviews, networking, and advisor and investor meetings.",
        "keywords": [
          "template",
          "coaching session",
          "team meeting",
          "consultation",
          "brain dump",
          "workshop",
          "podcast",
          "webinar",
          "hiring interview",
          "networking"
        ]
      },
      {
        "id": "action-items",
        "title": "Action items",
        "body": "Each action item has Add to Tasks, Set a reminder and Add to calendar, and can use all three. Calendar needs your Google or Microsoft calendar connected. Edit and Remove work until the item has been sent somewhere. Add an action item lets you add one the report missed.",
        "keywords": [
          "add to tasks",
          "set a reminder",
          "add to calendar",
          "edit action item",
          "add an action item"
        ]
      },
      {
        "id": "your-reports",
        "title": "Your reports",
        "body": "Your reports are listed on the left. On any report you can Copy report, Show transcript, Rename or Delete. Press Names to call this page and each template whatever fits your business. The page name also changes in your left menu.",
        "keywords": [
          "copy report",
          "show transcript",
          "rename",
          "delete report",
          "names",
          "rename page",
          "custom name"
        ]
      }
    ]
  },
  {
    "id": "team-huddle",
    "name": "Team Huddle",
    "area": "Daily Operations",
    "where": "Daily Operations > Team Huddle",
    "href": "/team-huddle",
    "what": "Your weekly team call in one place: a timed agenda, wins, hot topics, urgent items, and to-dos with an owner and a date. It keeps the call to your own time limit, 30 minutes to start.",
    "ai": "Has an AI button",
    "aiNote": "Create summary and to-dos reads a transcript you paste or upload and uses your own AI key. It writes a summary, wins, decisions, hot topics and to-dos. Nothing joins your to-do list until you press Add these to the to-dos.",
    "steps": [
      "Open Team Huddle from the left menu and press New huddle.",
      "Edit anything on the agenda. Changes save by themselves.",
      "Press Start to run the call on the clock, and Next section when one is finished.",
      "Add to-dos with an owner and a date, plus your notes and recording link.",
      "Press Mark done when the call is over."
    ],
    "health": "This does not change your scores. It keeps your team's call short and every to-do owned. A to-do you send to Tasks becomes a task, and tasks count toward task follow-through in your Internal Process & Culture pillar.",
    "tips": [
      "Open to-dos carry over to your next new huddle by themselves.",
      "If the minutes badge turns red, trim a section or move a topic to the Parking lot, which is not timed.",
      "The start time on a huddle is in Mountain Time."
    ],
    "questions": [
      {
        "q": "Why don't I see Team Huddle in my menu?",
        "a": "It shows once your account has a team member or someone added to the huddle by email."
      },
      {
        "q": "Who gets the agenda email?",
        "a": "The people listed under Who can open this page. Add a team member there if you want them on the email. Send me a test goes only to you."
      }
    ],
    "related": [
      "tasks",
      "lc-volant",
      "projects"
    ],
    "who": "Shows once the account has a team member or huddle guest. The account owner and team admins run it. Editors can change the agenda and to-dos. Viewers can read it.",
    "keywords": [
      "huddle",
      "team meeting",
      "weekly meeting",
      "team call",
      "agenda",
      "meeting agenda",
      "standup",
      "stand up",
      "to-dos",
      "action items",
      "meeting summary",
      "transcript",
      "parking lot"
    ],
    "sections": [
      {
        "id": "customize-your-huddle",
        "title": "Customize for your team",
        "body": "Press Customize for your team to set the huddle's name, time limit, usual day and usual start, then Save settings. Shape an agenda, then press Use this agenda for every new huddle. Go back to the standard agenda undoes that.",
        "keywords": [
          "customize",
          "time limit",
          "usual day",
          "template",
          "standard agenda",
          "settings"
        ]
      },
      {
        "id": "run-on-the-clock",
        "title": "Run it on the clock",
        "body": "Start shows the section you are in, how long you have been on it, and when you are over. Next section goes to the next one, and Stop ends the timer. Sections with zero minutes are skipped by the clock.",
        "keywords": [
          "start",
          "timer",
          "next section",
          "over time",
          "clock"
        ]
      },
      {
        "id": "who-can-open-it",
        "title": "Who can open it",
        "body": "Invited team members open it from their own menu. Admins manage it, editors edit it and viewers read it. Under Who can open this page you can also add anyone by the email they sign in with, and tick Can edit if they should change the agenda.",
        "keywords": [
          "share",
          "sharing",
          "who can open this page",
          "can edit",
          "guest",
          "invite",
          "role"
        ]
      },
      {
        "id": "email-the-agenda",
        "title": "Email the agenda",
        "body": "Send me a test emails only you, marked as a test. Email this agenda to everyone above sends the same email to the people on your list. It comes from the Command Suite, and replies go to you.",
        "keywords": [
          "send me a test",
          "email this agenda",
          "test email",
          "agenda email"
        ]
      },
      {
        "id": "to-dos-to-tasks",
        "title": "Turn a to-do into a task",
        "body": "Press the add-to-tasks icon beside a to-do to send it to your Tasks. The account owner and team admins can do this.",
        "keywords": [
          "to-do to task",
          "add to tasks",
          "send to tasks"
        ]
      },
      {
        "id": "transcript-and-summary",
        "title": "Transcript and summary",
        "body": "The account owner and team admins can paste a transcript or upload a .txt or .vtt file from Zoom, then press Create summary and to-dos. Word and PDF files are not read here, so save them as text or paste them. Read the summary before you share it.",
        "keywords": [
          "transcript",
          "summary",
          "create summary and to-dos",
          "zoom transcript",
          "vtt",
          "ai summary",
          "decisions"
        ]
      }
    ]
  },
  {
    "id": "accountability-partner",
    "name": "Accountability Partner",
    "area": "Daily Operations",
    "where": "Daily Operations > Accountability Partner",
    "href": "/accountability",
    "what": "A shared space with someone who helps you follow through: your commitments, their encouragement, and a gentle nudge when it counts. Your partner sees only what you add here, nothing else in your account.",
    "ai": "Has an AI button",
    "aiNote": "Draft it with AI, Suggest a reward and Write some for me use your own AI key. They see only what you type on this page, never your business data. A partner outside the Suite gets the same help on your key, with a daily limit.",
    "steps": [
      "Open Accountability Partner from the left menu.",
      "Press Invite an accountability partner, add their name and email, and press Send invitation.",
      "When they say yes, open their card.",
      "On Commitments, press Add a commitment and add what you are promising.",
      "On Our agreement, write how you want to be held accountable.",
      "Come back each week for the Check-in, and celebrate under Wins."
    ],
    "health": "This does not change your scores. It helps you follow through with someone beside you. If you share one of your existing tasks as a commitment, the two stay linked, so marking it Done also finishes the task, and tasks count toward task follow-through in your Internal Process & Culture pillar.",
    "tips": [
      "Nobody in mind? The page links to a place in the Collective to find an accountability partner.",
      "You can have up to three partners at a time.",
      "You can start adding commitments and your side of the agreement while you wait for a yes."
    ],
    "questions": [
      {
        "q": "Does my partner need a Command Suite account?",
        "a": "No. Someone outside the Suite gets a private link by email and has nothing to sign up for."
      },
      {
        "q": "Can my partner see my business?",
        "a": "No. They see only the commitments you add here, and you see only what they add."
      },
      {
        "q": "Can I stop for a while?",
        "a": "Yes. Press Pause and no reminders or emails go out until you press Resume. End closes the partnership and makes it read-only for you both."
      }
    ],
    "related": [
      "tasks",
      "daily-compass"
    ],
    "who": "Everyone. Team members need the Accountability Partner area.",
    "keywords": [
      "accountability",
      "accountability partner",
      "buddy",
      "partner",
      "commitments",
      "encouragement",
      "nudge",
      "check-in",
      "check in",
      "agreement",
      "reward",
      "consequence",
      "stuck",
      "wins",
      "hold me accountable",
      "promise"
    ],
    "sections": [
      {
        "id": "commitments",
        "title": "Commitments",
        "body": "Add a task, milestone, project, deadline or habit, or share one of your tasks. Tick This is a promise, not just a to-do, and add a reward if you like. Mark each one Not started, In progress or Done. Both of you can leave notes.",
        "keywords": [
          "commitments",
          "add a commitment",
          "habit",
          "deadline",
          "milestone",
          "promise",
          "reward"
        ]
      },
      {
        "id": "encouragement",
        "title": "Encouragement",
        "body": "Send an Encourage, Nudge, Inspire, Support or Celebrate message, save your own, or press Write some for me. Ask for support tells your partner you are stuck.",
        "keywords": [
          "encouragement",
          "nudge",
          "celebrate",
          "write some for me",
          "i'm stuck",
          "ask for support"
        ]
      },
      {
        "id": "calls",
        "title": "Calls",
        "body": "On the Calls tab, ask for a quick call or propose a standing call every week or every other week. Add your Zoom or Meet link or a phone number under How will you two connect, and it goes on every call you set up.",
        "keywords": [
          "calls",
          "schedule a call",
          "standing call",
          "quick call",
          "zoom link",
          "calendar file"
        ]
      },
      {
        "id": "check-in",
        "title": "Check-in",
        "body": "A short weekly note on what went well, where you got stuck and what you are committing to. Past check-ins stay listed on the tab.",
        "keywords": [
          "check-in",
          "weekly check in",
          "what went well",
          "stuck"
        ]
      },
      {
        "id": "our-agreement",
        "title": "Our agreement",
        "body": "Each of you writes how you want to be held accountable, the tone you respond to best, your rewards, and what happens if something slips. Choose A pledge, Tracked, Both or Keep it light.",
        "keywords": [
          "agreement",
          "pledge",
          "tracked",
          "keep it light",
          "tone",
          "draft it with ai",
          "consequence"
        ]
      },
      {
        "id": "wins",
        "title": "Wins",
        "body": "Everything either of you has finished lands here.",
        "keywords": [
          "wins",
          "finished",
          "celebrate",
          "done"
        ]
      },
      {
        "id": "reminders-and-alerts",
        "title": "Reminders and alerts",
        "body": "You get a friendly reminder the day before something is due, and a gentle note if it slips. Untick Email me about this to stop the emails for that partnership.",
        "keywords": [
          "daily reminders",
          "due tomorrow",
          "email me about this",
          "notifications",
          "bell"
        ]
      },
      {
        "id": "partner-private-page",
        "title": "Your partner's private page",
        "body": "A partner outside the Suite uses a private link with no login. They can add their own commitments, notes and encouragement, and set up calls. Copy their link from their card if you need to send it again.",
        "keywords": [
          "private link",
          "no login",
          "outside partner",
          "partner page",
          "copy their link",
          "no account"
        ]
      },
      {
        "id": "coach-view",
        "title": "Letting your coach see it",
        "body": "On a partnership, tick Let my coach see this. Your coach gets a read-only view, and your partner sees a note saying so. Untick it any time.",
        "keywords": [
          "coach",
          "let my coach see this",
          "read-only",
          "privacy"
        ]
      }
    ]
  },
  {
    "id": "quick-capture",
    "name": "Quick Capture",
    "area": "Daily Operations",
    "where": "Daily Operations > Quick Capture",
    "href": "/capture",
    "what": "A phone-friendly page for the two things you jot down on the move: a task, or money in or out.",
    "ai": "No AI",
    "aiNote": "",
    "steps": [
      "Open Quick Capture from the left menu, or from the shortcut on your phone.",
      "Choose Task or Money.",
      "For a task, type what needs doing and add a due date if you want one.",
      "For money, choose Money in or Money out and enter the amount and date, plus any details you have.",
      "Press Save."
    ],
    "health": "A task counts toward task follow-through in your Internal Process & Culture pillar, like any other task. Money in and money out go into your Finance records, and this month's income and expenses feed your Finance dimension once you have an income goal set.",
    "tips": [
      "A task with no due date goes straight to Today.",
      "Fill in the details as you capture money, so you never have to reopen the entry later."
    ],
    "questions": [
      {
        "q": "Where does what I capture go?",
        "a": "Tasks go to your Tasks list and money goes to your Finance records. Open my tasks or Open my Cash Flow under the form takes you there."
      },
      {
        "q": "How do I put the Suite on my phone?",
        "a": "On iPhone in Safari, tap Share, then Add to Home Screen. On Android in Chrome, tap the three-dot menu, then Install app. The steps are on the page."
      }
    ],
    "related": [
      "tasks",
      "daily-compass"
    ],
    "who": "Everyone. Team members need the Daily Compass area to open the page, the Tasks area to save a task, and the Finance area to save money.",
    "keywords": [
      "quick capture",
      "capture",
      "phone",
      "mobile",
      "on the go",
      "jot",
      "add task fast",
      "expense",
      "income",
      "receipt",
      "money in",
      "money out",
      "home screen",
      "shortcut",
      "app icon",
      "install app"
    ],
    "sections": [
      {
        "id": "capture-money",
        "title": "Money in and money out",
        "body": "Money asks for the same details as the Finance pages: date, category, a note, and From or Paid to. Money out also asks whether it is one-time or recurring, and for recurring, how often and how it renews. Your business segment shows if you have segments.",
        "keywords": [
          "money in",
          "money out",
          "expense",
          "income",
          "category",
          "paid to",
          "recurring",
          "segment"
        ]
      },
      {
        "id": "bill-match",
        "title": "Matching a bill",
        "body": "If an expense looks like a bill you already track, the page offers to link them, so nothing is counted twice.",
        "keywords": [
          "bill",
          "link bill",
          "match",
          "double count"
        ]
      },
      {
        "id": "phone-shortcut",
        "title": "Phone home-screen shortcut",
        "body": "Once the Suite is on your phone, press and hold the app icon for shortcuts to Quick capture, Daily Compass and your tasks.",
        "keywords": [
          "home screen",
          "shortcut",
          "press and hold",
          "app icon",
          "add to home screen"
        ]
      }
    ]
  },
  {
    "id": "my-pages",
    "name": "My Pages",
    "area": "Daily Operations",
    "where": "Left menu > MY PAGES",
    "href": "/",
    "what": "Pages you add to your own left menu: a tracker, a checklist, a client list, a plan or notes. They can hold headings, text, highlighted notes, checklists, tables and links, all in the Command Suite look.",
    "ai": "No AI",
    "aiNote": "There is no AI button on the page. Your chat assistant builds and changes pages using your own AI key. It shows you a preview and waits for your Approve before anything is created, changed or deleted.",
    "steps": [
      "Ask your assistant to make a page, for example a page called Podcast Launch with a checklist and a guest tracker.",
      "Check the preview and press Approve.",
      "Open your new page under MY PAGES in the left menu.",
      "Change anything by hand. Your changes save by themselves.",
      "Use the buttons at the bottom of the page to add a heading, text, highlighted note, checklist, table or link."
    ],
    "health": "This does not change your scores. It gives you a home for anything the Suite has no page for. A page built from your scores or income is a snapshot, not a live link.",
    "tips": [
      "Pages do not update by themselves. Ask your assistant to refresh one when you want the latest figures.",
      "Ask your assistant to add links to your other Suite pages, so everything you need is one click away."
    ],
    "questions": [
      {
        "q": "Why don't I see MY PAGES in my menu?",
        "a": "The section shows once you have at least one page. Ask your assistant to make your first one."
      },
      {
        "q": "How do I remove a page?",
        "a": "Open the page and press Delete this page at the bottom, or ask your assistant to delete it and approve the preview."
      },
      {
        "q": "Can my team see my pages?",
        "a": "Only if you give them access. You can open all of My Pages to a team member, or give them one page at a time to view or edit."
      }
    ],
    "related": [
      "waiting-for-my-approval",
      "tasks"
    ],
    "who": "Everyone. The section shows once a page exists. Team members need the My Pages area, or you can give them single pages.",
    "keywords": [
      "my pages",
      "custom page",
      "new page",
      "add a page",
      "create a page",
      "tracker",
      "checklist",
      "table",
      "notes page",
      "left menu",
      "personal page",
      "refresh page"
    ],
    "sections": [
      {
        "id": "what-a-page-holds",
        "title": "What a page can hold",
        "body": "Headings, text, highlighted notes, checklists, tables and links. Hover over a block to move it up or down or delete it. Every page uses the Command Suite look, whoever builds it.",
        "keywords": [
          "blocks",
          "headings",
          "highlighted note",
          "checklist",
          "table",
          "link",
          "reorder"
        ]
      },
      {
        "id": "pages-from-your-data",
        "title": "Filling a page from your Suite",
        "body": "Your assistant can build or refresh a page from your tasks, scores, income against your goals, calendar and pipeline. Each refresh is a preview you approve.",
        "keywords": [
          "refresh",
          "snapshot",
          "growth tracker",
          "scores on a page",
          "update figures"
        ]
      },
      {
        "id": "reorder-in-the-menu",
        "title": "Order in your menu",
        "body": "Drag your pages into the order you want in the left menu. The order is saved to your account.",
        "keywords": [
          "reorder",
          "drag",
          "menu order",
          "left menu"
        ]
      },
      {
        "id": "pages-to-review",
        "title": "Pages made for your review",
        "body": "A page made for review opens with Edit and Approved buttons. Some notes carry their own Edit and Approve. Use Reopen as a draft to go back.",
        "keywords": [
          "approved",
          "draft",
          "review",
          "reopen as a draft"
        ]
      }
    ]
  },
  {
    "id": "coaching-calls-and-replays",
    "name": "Coaching calls and replays",
    "area": "Daily Operations",
    "where": "Coaching calls card on Executive Home and Daily Compass",
    "href": "/",
    "what": "The Coaching calls card shows your Command Suite calls for this week and next week, with a button to join each one and a link to the full schedule and replays.",
    "ai": "No AI",
    "aiNote": "",
    "steps": [
      "Find the Coaching calls card on Executive Home or Daily Compass.",
      "Choose This week or Next week.",
      "Press Zoom on a call. It changes to Join now 10 minutes before the call starts.",
      "Press See all calls and replays for the full schedule.",
      "In the Collective's Events, open Past & replays to watch a call you missed."
    ],
    "health": "This does not change your scores. It gives you live coaching and support each week.",
    "tips": [
      "You do not need to attend them all. Pick what serves you each week.",
      "The first time you join a call series, Zoom asks for your name and email once."
    ],
    "questions": [
      {
        "q": "Where do I find a replay?",
        "a": "Press See all calls and replays on the card, then open Past & replays in the Collective's Events."
      },
      {
        "q": "Why is the card empty?",
        "a": "It shows only calls still to come. When none are left this week, try Next week or the full schedule on the Collective's Events page."
      }
    ],
    "related": [
      "executive-home",
      "daily-compass"
    ],
    "who": "Every Command Suite account.",
    "keywords": [
      "coaching calls",
      "group coaching",
      "calls",
      "zoom",
      "join",
      "replay",
      "replays",
      "recording",
      "schedule",
      "dimension call",
      "hope seat",
      "soul session",
      "office hours",
      "alignment anchor",
      "collective events",
      "flight crew mixer"
    ],
    "sections": [
      {
        "id": "this-weeks-calls",
        "title": "This week's coaching calls",
        "body": "The card lists each upcoming call by day with its time. A call turns active 10 minutes before it starts, and stays that way until it ends. Times show in your own time zone.",
        "keywords": [
          "this week",
          "next week",
          "join now",
          "upcoming calls"
        ]
      },
      {
        "id": "tuesday-dimension-calls",
        "title": "Tuesday Dimension Calls",
        "body": "Each Tuesday has one Dimension Call, 6:00 to 7:15pm Mountain: Growth on the first Tuesday, the Hope Seat on the second, a SOUL Session on the third, Community on the fourth, and the Flight Crew Mixer on a fifth.",
        "keywords": [
          "tuesday",
          "dimension call",
          "growth",
          "hope seat",
          "soul session",
          "community",
          "flight crew mixer"
        ]
      },
      {
        "id": "replays",
        "title": "Replays",
        "body": "Once a call's recording is ready, its replay is added to that session in the Collective, under Events and Past & replays.",
        "keywords": [
          "replay",
          "recording",
          "missed a call",
          "watch later",
          "past and replays"
        ]
      }
    ]
  },
  {
    "id": "contacts",
    "name": "Contacts",
    "area": "Clients & Sales",
    "where": "Clients & Sales > Contacts",
    "href": "/contacts",
    "what": "Your address book. Everyone who books, buys or fills in a form lands here, and you can add people yourself.",
    "ai": "Has an AI button",
    "aiNote": "When you schedule a follow-up, your assistant can draft the email using your own AI key. Without a key you can still write the email yourself.",
    "steps": [
      "Open Contacts from the left menu.",
      "Search for a person, or filter by tag.",
      "Add a new contact. The Suite checks for a duplicate first.",
      "Open a contact to see their record and schedule a follow-up.",
      "Export your list whenever you need a copy."
    ],
    "health": "New contacts are part of the live data behind your scores, so keeping this list current gives your dimensions and pillars a truer picture.",
    "tips": [
      "Add tags as you go, so you can filter to the right people later."
    ],
    "questions": [
      {
        "q": "Do I have to enter people who book or buy?",
        "a": "No. Everyone who books, buys or fills in a form lands here on their own."
      }
    ],
    "related": [
      "tasks"
    ],
    "who": "Everyone. Team members need the Contacts area.",
    "keywords": [
      "crm",
      "address book",
      "people",
      "clients",
      "leads",
      "customers",
      "tags",
      "export",
      "import",
      "follow up",
      "follow-up"
    ],
    "starter": true
  },
  {
    "id": "brain-profile",
    "name": "Brain Profile",
    "area": "Alignment & Systems",
    "where": "Alignment Profile > Brain",
    "href": "/assessments/brain",
    "what": "The assessment about your systems and operations: 325 questions in 12 sections. It is one of the three assessments, with Soul and Profit.",
    "ai": "Has an AI button",
    "aiNote": "Fill this section with my AI gives you a ready-made prompt to copy into the AI you already use. You paste the reply back, review every answer and choose what to keep. This does not use your AI key.",
    "steps": [
      "Open Brain from Alignment Profile.",
      "Answer one section at a time. Your answers save as you go.",
      "Leave and come back whenever you like, on any device.",
      "If you have more than one business or revenue stream, answer the follow-up so each one is covered."
    ],
    "health": "Your Brain answers are scored and feed your 12 dimensions and your 8 pillars. Your full Command Suite opens once Brain, Soul and Profit are all finished.",
    "tips": [
      "Plan on 3 to 5 hours. It does not have to happen in one sitting."
    ],
    "questions": [
      {
        "q": "Will I lose my answers if I close the page?",
        "a": "No. Answers save to your account as you go and come back on any device."
      }
    ],
    "related": [
      "business-alignment"
    ],
    "who": "Everyone.",
    "keywords": [
      "assessment",
      "questions",
      "systems",
      "operations",
      "questionnaire",
      "autosave",
      "revenue streams"
    ],
    "starter": true
  },
  {
    "id": "business-alignment",
    "name": "Business Alignment",
    "area": "Alignment & Systems",
    "where": "Alignment & Systems > Business Alignment",
    "href": "/business-alignment",
    "what": "Your business health in one view: your overall score, the radar and score for each of the 12 dimensions, your score trend and your revenue snapshot, in cards you can arrange.",
    "ai": "AI-powered",
    "aiNote": "Brief me uses your own AI key. Your assistant explains your score and phase, what is driving your weakest areas, and three moves you can add to your tasks.",
    "steps": [
      "Open Business Alignment from the left menu.",
      "Look at your overall score and phase first.",
      "Find your lowest dimensions on the radar.",
      "Press Brief me to hear what is driving them.",
      "Add the moves you want to your tasks."
    ],
    "health": "This is where your health shows. Your overall score sets your phase: Survival, Growth, Expansion or Legacy.",
    "tips": [
      "The goal is progress, not perfection, so watch your trend as well as today's number."
    ],
    "questions": [
      {
        "q": "Do I need 100 in all 12 dimensions?",
        "a": "No. The goal is alignment and steady progress."
      }
    ],
    "related": [
      "brain-profile",
      "tasks"
    ],
    "who": "Everyone. Team members need the Alignment area.",
    "keywords": [
      "score",
      "health",
      "dashboard",
      "radar",
      "dimensions",
      "domains",
      "phase",
      "survival",
      "growth",
      "expansion",
      "legacy",
      "trend"
    ],
    "sections": [
      {
        "id": "briefing",
        "title": "Alignment briefing",
        "body": "Brief me at the top of the page explains your score, what drives your weakest areas, and three moves to add as tasks.",
        "keywords": [
          "brief me",
          "explain my score",
          "weakest",
          "three moves"
        ]
      }
    ],
    "starter": true
  },
  {
    "id": "logins-passwords",
    "name": "Logins & Passwords",
    "area": "Settings",
    "where": "Settings > Logins & Passwords",
    "href": "/vault",
    "what": "A private vault for your logins and passwords. Each person has their own, and team members cannot open anyone else's.",
    "ai": "No AI",
    "aiNote": "Your passwords are never available to your assistant.",
    "steps": [
      "Open Logins & Passwords from the left menu.",
      "Enter your Suite password to unlock it. It stays open for 15 minutes, or press Lock now.",
      "Add a login with its name, type, web address and password. The password generator can make one for you.",
      "Use Show or Copy when you need a password. Show lasts 20 seconds."
    ],
    "health": "This does not change your scores. It keeps your business logins in one protected place.",
    "tips": [
      "Adding, editing and deleting each ask for your Suite password again."
    ],
    "questions": [
      {
        "q": "Can my team see my passwords?",
        "a": "No. Each person has their own vault."
      }
    ],
    "related": [
      "glossary"
    ],
    "who": "Private to each person.",
    "keywords": [
      "vault",
      "password manager",
      "credentials",
      "security",
      "secret",
      "2fa",
      "recovery codes"
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
      "Press a term's type button to see only Command Suite, Business, Sales or Marketing words."
    ],
    "health": "This does not change your scores. It helps you read your scores and plans with confidence.",
    "tips": [
      "A word with a dotted underline anywhere in the app shows a one-line meaning when you hover over it or tap it."
    ],
    "questions": [
      {
        "q": "What does a dotted underline mean?",
        "a": "That word is in the Glossary. Hover over it or tap it for a quick meaning."
      }
    ],
    "related": [
      "business-alignment"
    ],
    "who": "Everyone.",
    "keywords": [
      "definitions",
      "meaning",
      "words",
      "terms",
      "dictionary"
    ]
  }
];

export const guideEntry = (id: string) => GUIDE_ENTRIES.find((e) => e.id === id) ?? null;
