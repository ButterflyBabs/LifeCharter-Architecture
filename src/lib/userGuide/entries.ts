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
    ],
    "starter": true
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
    "id": "the-collective",
    "name": "The Collective",
    "area": "Daily Operations",
    "where": "Daily Operations > The Collective",
    "href": "/community",
    "what": "The LifeCharter community: conversations, live events, private messages, your private Alignment Journal and the LifeCharter Library. It has its own look, its own menu and its own address. Nothing from your Command Suite is shared with the community.",
    "ai": "Has an AI button",
    "aiNote": "On Home, What you missed has a Catch me up button that summarizes new posts and replies, only from channels you can open. It uses your own AI key, or Mariposa on your Collective Plus allowance. You are asked to allow this once. The safety check on posts and replies runs on LifeCharter's side and never uses your key. Everything else on Home works without AI.",
    "steps": [
      "Press The Collective in the left menu. It opens at collective.lccommandsuite.com.",
      "Sign in with your usual email and password the first time.",
      "If you are new, follow Four small steps to settle in, then press the I'm settled button to hide them.",
      "Read your Home cards: Alignment Anchor, Your Intention, Your Next Session and Share a Win.",
      "Press Share with the Collective to post, and choose where under Post to.",
      "Use the Collective's own menu for My Journal, Messages, Notifications, Events, Members and Help & FAQ."
    ],
    "health": "This does not change your scores. It gives you community, live support and people who understand what you are building.",
    "tips": [
      "On a phone, the bottom bar has Home, Channels, Messages, Events and Me.",
      "Above your feed, choose All, Community or My programs to narrow what you see.",
      "Hide What you missed with its X when you do not need it.",
      "The Command Suite button in the Collective's menu takes you back to your Suite."
    ],
    "questions": [
      {
        "q": "Why am I asked to sign in again?",
        "a": "The Collective has its own address, so it keeps its own sign-in. Use the same email and password. Command Suite sign-in stays on lccommandsuite.com."
      },
      {
        "q": "Can other members see my business data?",
        "a": "No. The Collective is a separate space. Nothing from your Command Suite is shared with the community."
      },
      {
        "q": "Why don't I see The Collective in my left menu?",
        "a": "It appears once your assessments are finished. A team member whose access is limited to their own areas does not see it in the menu."
      }
    ],
    "related": [
      "collective-channels-and-posts",
      "collective-events-and-calls",
      "my-alignment-journal",
      "collective-profile-and-notifications",
      "executive-home"
    ],
    "who": "Every Command Suite client and invited team member is added as a member. Anyone else joins with an invitation.",
    "keywords": [
      "collective",
      "community",
      "lifecharter collective",
      "feed",
      "home",
      "what you missed",
      "catch me up",
      "search posts",
      "group",
      "sign in to collective",
      "welcome"
    ],
    "sections": [
      {
        "id": "collective-home-and-feed",
        "title": "Collective Home and feed",
        "body": "At the top of Home is Search posts and replies, then What you missed and your four cards. Below them is a Share with the Collective box and your feed of newest activity. The latest announcement from the past week stays on top.",
        "keywords": [
          "home",
          "feed",
          "search",
          "alignment anchor",
          "your intention",
          "your next session",
          "share a win"
        ]
      },
      {
        "id": "collective-help-and-faq",
        "title": "Help & FAQ",
        "body": "Answers to common questions about the Collective, with a search box. Press Message an admin to send a private message if you still need help.",
        "keywords": [
          "help",
          "faq",
          "questions",
          "message an admin",
          "support"
        ]
      },
      {
        "id": "collective-safety-check",
        "title": "Automatic safety check",
        "body": "New and edited posts and replies are checked automatically. Anything flagged goes to an admin to review, and clearly harmful content is hidden until an admin has looked at it. Private messages are never scanned.",
        "keywords": [
          "moderation",
          "safety",
          "flagged",
          "hidden post",
          "harmful"
        ]
      },
      {
        "id": "collective-public-page-and-joining",
        "title": "The public page and joining",
        "body": "Anyone can press Request your invitation on the public page at collective.lccommandsuite.com. A personal link and invite code arrive by email, and they join under New here. Existing members use Already a member.",
        "keywords": [
          "join",
          "invite code",
          "invitation",
          "request an invite",
          "new here",
          "already a member"
        ]
      },
      {
        "id": "collective-own-address",
        "title": "The Collective's own address",
        "body": "The Collective lives at collective.lccommandsuite.com. Old links to the Collective forward there on their own. If you used push notifications or a home screen icon on the old address, switch them on once more on the new one.",
        "keywords": [
          "address",
          "url",
          "collective.lccommandsuite.com",
          "old link",
          "sign in",
          "push moved"
        ]
      }
    ]
  },
  {
    "id": "collective-events-and-calls",
    "name": "Collective events and calls",
    "area": "Daily Operations",
    "where": "Daily Operations > The Collective > Events",
    "href": "/community/events",
    "what": "LifeCharter Live: Alignment Anchors, office hours, workshops and more, shown in your time zone. The full coaching call schedule and replays are here too.",
    "ai": "Has an AI button",
    "aiNote": "My focus note on a past session writes one private takeaway and a next step. It uses your own AI key, or Mariposa on your Collective Plus allowance. Hosts also get Write recap, which drafts a recap from pasted notes. It uses the host's own AI key, or LifeCharter's key if they have none, and never counts against a Plus allowance. Nothing posts until the host presses Post recap.",
    "steps": [
      "Open Events from the Collective's menu, or from the bottom bar on a phone.",
      "Choose Upcoming, Calendar or Past & replays.",
      "On a session, press Going or Maybe. Going on a series covers every session.",
      "Press Add to calendar, or Add series to calendar for a repeating event.",
      "When it is time, press Join link. It changes to Join now 30 minutes before the start.",
      "To catch up, open Past & replays and press Watch the replay."
    ],
    "health": "This does not change your scores. It gives you live coaching, learning and connection each week.",
    "tips": [
      "Going gets you a reminder about an hour before each session. Maybe does not.",
      "On Calendar, press a day to see what is on it.",
      "Your Next Session on Collective Home opens the next one for you."
    ],
    "questions": [
      {
        "q": "Where is the replay of a call I missed?",
        "a": "Open Past & replays and find the session. A replay shows there once it has been added, so a very recent call may not have one yet."
      },
      {
        "q": "Why can't I see a session someone mentioned?",
        "a": "Each event is for the whole Collective or for certain channels. You see the ones for the whole Collective and for channels you can open."
      },
      {
        "q": "Who can see my focus note?",
        "a": "Only you. It is saved privately on that session. If the session has no recap yet, tell it what stood out to you first."
      }
    ],
    "related": [
      "coaching-calls-and-replays",
      "the-collective",
      "collective-plus",
      "collective-profile-and-notifications"
    ],
    "who": "Every Collective member, for the events shown to them. My focus note needs Collective Plus or your own AI key. Write recap is for the session's host.",
    "keywords": [
      "events",
      "calendar",
      "live",
      "lifecharter live",
      "alignment anchor",
      "office hours",
      "workshop",
      "rsvp",
      "going",
      "replay",
      "join link",
      "zoom",
      "recap"
    ],
    "sections": [
      {
        "id": "events-lifecharter-live",
        "title": "Events (LifeCharter Live)",
        "body": "Each session shows its type, who it is for, the time and any repeat pattern. Series have one RSVP and a reminder before each session. Add to calendar saves a calendar file for your own calendar.",
        "keywords": [
          "lifecharter live",
          "rsvp",
          "series",
          "reminder",
          "add to calendar",
          "calendar file"
        ]
      },
      {
        "id": "events-past-and-replays",
        "title": "Past & replays",
        "body": "Past sessions from the last 18 months, newest first. Press Watch the replay when one has been added, or Read the recap when the host has posted one.",
        "keywords": [
          "replay",
          "past sessions",
          "recording",
          "watch the replay",
          "read the recap"
        ]
      },
      {
        "id": "events-my-focus-note",
        "title": "My focus note",
        "body": "On a past session, press My focus note, add what stood out, and press Write my focus note. Edit the takeaway and next step, then press Save privately.",
        "keywords": [
          "focus note",
          "takeaway",
          "next step",
          "save privately"
        ]
      }
    ]
  },
  {
    "id": "my-alignment-journal",
    "name": "My Alignment Journal",
    "area": "Daily Operations",
    "where": "Daily Operations > The Collective > My Journal",
    "href": "/community/journal",
    "what": "Your private weekly journal: an intention, your wins and a reflection, with simple tracking and a search. Only you see it. Anything you choose to share goes to the Collective as a headline and a note, never your journal.",
    "ai": "Has an AI button",
    "aiNote": "Inside an entry, Sharpen my intention, Help me unpack this and Draft my reflection use AI, as do Speak it instead and the patterns button. They run on your own AI key, or Mariposa on your Collective Plus allowance. Your words go to the AI only when you tap. Voice notes need an OpenAI key. A Claude key covers the rest. The Sunday week in review runs on its own once you have allowed Mariposa.",
    "steps": [
      "Open My Journal from the Collective's menu.",
      "Under This week, press Set my intention, write a headline and press Save to journal.",
      "Press Capture a win when something moves forward. Add as many as you like.",
      "At the end of the week, press Reflect on my week and rate how aligned it felt, 1 to 5.",
      "Use the private journal box in any entry for the fuller story.",
      "To share an intention or win, turn on Also share with the Collective and press Save & share."
    ],
    "health": "This does not change your scores. The 12 areas of life you can tag are journal labels, not your 12 Business Dimensions. It helps you keep your intention and wins in view week by week.",
    "tips": [
      "Wins start with sharing on, and intentions start with it off. The journal remembers your last choice, so check the switch before you save.",
      "Monday and Friday journal reminders come in the app and by push. Turn them off in your profile if you prefer, but that also stops the Sunday review.",
      "Your Intention and Share a Win on Collective Home open the same entries."
    ],
    "questions": [
      {
        "q": "Who can see my journal?",
        "a": "Only you. If you share an entry, the Collective sees the headline and any note you wrote for them. Your private journal is never shared."
      },
      {
        "q": "Can I share a reflection?",
        "a": "No. Only intentions and wins can be shared. Intentions go to This Week's Intention and wins go to the Wins conversation."
      },
      {
        "q": "Why don't I see Monthly report or Export?",
        "a": "They appear when you have Collective Plus or your own AI key connected, and at least one journal entry."
      }
    ],
    "related": [
      "collective-plus",
      "collective-profile-and-notifications",
      "the-collective",
      "accountability-partner"
    ],
    "who": "Every Collective member. The 90-day focus, Sunday review, Monthly report and Export need Collective Plus or your own AI key connected.",
    "keywords": [
      "journal",
      "alignment journal",
      "my journal",
      "intention",
      "weekly intention",
      "win",
      "wins",
      "reflection",
      "rating",
      "area of life",
      "private",
      "voice note",
      "speak",
      "mariposa"
    ],
    "sections": [
      {
        "id": "journal-this-week",
        "title": "This week",
        "body": "One intention, any number of wins and one reflection for each week. Below them you see your tracking, then past weeks. Use Search your journal to find an old entry. Press the pencil on an entry to edit or delete it.",
        "keywords": [
          "this week",
          "intention",
          "wins",
          "reflection",
          "tracking",
          "search your journal"
        ]
      },
      {
        "id": "journal-90-day-focus",
        "title": "Your 90-day focus",
        "body": "Name one bigger goal for the next 90 days. Your weekly intentions roll up into it. In an entry, tick Toward my 90-day focus to link it.",
        "keywords": [
          "90-day focus",
          "90 day goal",
          "focus",
          "bigger goal"
        ]
      },
      {
        "id": "journal-voice-notes",
        "title": "Voice notes",
        "body": "Press Speak it instead, talk for up to 5 minutes, then press Stop. Your words become text. Press Tidy it up to clean the text while keeping your words, then Add to my journal. The recording is not kept.",
        "keywords": [
          "voice",
          "voice note",
          "speak it instead",
          "dictate",
          "microphone",
          "tidy it up"
        ]
      },
      {
        "id": "journal-sunday-review",
        "title": "Sunday week in review",
        "body": "On Sunday, if you journaled that week and have journal reminders on, you get a short personal review with a focus for the week ahead. It shows in your journal and as a notification.",
        "keywords": [
          "sunday review",
          "week in review",
          "weekly review",
          "mariposa review"
        ]
      },
      {
        "id": "journal-export",
        "title": "Journal export",
        "body": "Press Export. Choose Everything, This year or Last 90 days, choose whether to include your private notes, then press Save as PDF.",
        "keywords": [
          "export",
          "pdf",
          "print journal",
          "download journal",
          "save as pdf"
        ]
      },
      {
        "id": "journal-monthly-report",
        "title": "Journal monthly report",
        "body": "Press Monthly report to see weeks with an intention, your wins, your average alignment, a balance wheel of your areas of life and your alignment trend. With three or more entries, press What patterns do you see? for a look at the month.",
        "keywords": [
          "monthly report",
          "alignment report",
          "balance wheel",
          "radar",
          "alignment trend"
        ]
      }
    ]
  },
  {
    "id": "lifecharter-library",
    "name": "LifeCharter Library",
    "area": "Daily Operations",
    "where": "Daily Operations > The Collective > LifeCharter Library",
    "href": "/community/library",
    "what": "Templates, worksheets, recordings and tools in one place, grouped by category. Each item is a file, a video or a link.",
    "ai": "Has an AI button",
    "aiNote": "Ask the Library answers your question from Library items you can see and lists the items it used under From. It uses your own AI key, or Mariposa on your Collective Plus allowance. Of your own words, only your question is sent. Browsing and searching the Library do not use AI.",
    "steps": [
      "Open LifeCharter Library from the Collective's menu.",
      "Choose Library at the top, or a channel if it has its own resources.",
      "Type in Search to find an item by its title, description or category.",
      "Press an item's title to open it in a new tab.",
      "To ask a question, type it in the Ask box and press Ask."
    ],
    "health": "This does not change your scores. It keeps the LifeCharter resources you need close by.",
    "tips": [
      "Under an answer, press an item's name beside From to open it.",
      "Channel chips show only for channels that have their own resources."
    ],
    "questions": [
      {
        "q": "Why don't I see the Library in the Collective's menu?",
        "a": "It appears once there is something in it."
      },
      {
        "q": "Why don't I see the Ask box?",
        "a": "Ask the Library needs Collective Plus or your own AI key connected. Without either, you see an invitation to Collective Plus instead."
      }
    ],
    "related": [
      "collective-plus",
      "the-collective",
      "collective-events-and-calls"
    ],
    "who": "Every Collective member. Ask the Library needs Collective Plus or your own AI key connected.",
    "keywords": [
      "library",
      "resources",
      "templates",
      "worksheets",
      "recordings",
      "guides",
      "tools",
      "ask the library",
      "mariposa",
      "frameworks"
    ],
    "sections": [
      {
        "id": "library-resources-by-category",
        "title": "Resources by category",
        "body": "Items are grouped under category headings. Each one shows its title, a short description, and whether it is a file, a video or a link.",
        "keywords": [
          "categories",
          "resources",
          "files",
          "videos",
          "links"
        ]
      },
      {
        "id": "ask-the-library",
        "title": "Ask the Library",
        "body": "Ask about LifeCharter's frameworks and resources. The answer comes from the main Library and the channels you belong to, and it names the items it used.",
        "keywords": [
          "ask the library",
          "ask mariposa",
          "question",
          "frameworks"
        ]
      }
    ]
  },
  {
    "id": "collective-plus",
    "name": "Collective Plus",
    "area": "Daily Operations",
    "where": "Daily Operations > The Collective > Collective Plus (My Plus once you have it)",
    "href": "/community/plus",
    "what": "An optional add-on in the Collective that turns on Mariposa, the LifeCharter AI coach, and the tools around your journal. If your own AI key is connected in the Suite, you already have every Plus feature on your own key and there is nothing to buy.",
    "ai": "AI-powered",
    "aiNote": "Plus is the AI side of the Collective. If your own AI key is connected, everything runs on your key, under your assistant's name, and uses no Plus allowance. Otherwise it runs as Mariposa on a monthly Plus allowance that resets on the 1st. You are asked to allow Mariposa once, and you can withdraw that in your profile. Mariposa never posts or sends anything for you.",
    "steps": [
      "Open Collective Plus from the Collective's menu. It reads My Plus once you have it.",
      "If you see Included with your Command Suite, you are set and there is nothing to do.",
      "To add it, choose Monthly or Annual and press Join Collective Plus.",
      "Check your plan and Mariposa this month to see how much of your allowance you have used.",
      "Press Manage billing to manage or cancel your plan.",
      "Try Mariposa in My Journal: press Set my intention, then Sharpen my intention."
    ],
    "health": "This does not change your scores. The monthly alignment report reflects your journal only. It helps you get more from your weekly journaling.",
    "tips": [
      "Posting, conversations, messages, events and your journal stay in your membership without Plus.",
      "Plus is added on the web."
    ],
    "questions": [
      {
        "q": "Do I need Plus if I have Command Suite?",
        "a": "Not if your own AI key is connected. The page then says Included with your Command Suite. If it offers you Plus instead, connect your AI key in the Suite first."
      },
      {
        "q": "What happens when my allowance runs out?",
        "a": "You see a note that you have reached this month's Mariposa limit. It resets on the 1st. The rest of the Collective keeps working."
      },
      {
        "q": "How do I cancel?",
        "a": "Press Manage billing on this page. Deleting your Collective account also cancels Plus right away."
      }
    ],
    "related": [
      "my-alignment-journal",
      "lifecharter-library",
      "collective-on-your-phone",
      "collective-profile-and-notifications"
    ],
    "who": "Every Collective member. An invited team member uses their account owner's AI key.",
    "keywords": [
      "collective plus",
      "plus",
      "my plus",
      "mariposa",
      "ai coach",
      "upgrade",
      "manage billing",
      "cancel plus",
      "allowance",
      "limit reached"
    ],
    "sections": [
      {
        "id": "what-plus-includes",
        "title": "What Plus includes",
        "body": "Mariposa in your journal, the Sunday week-in-review, the monthly alignment report, Ask the Library, your 90-day focus, journal export, and a small Plus badge on your profile and in the member directory.",
        "keywords": [
          "what's included",
          "plus features",
          "plus badge",
          "sunday review",
          "monthly report",
          "export"
        ]
      },
      {
        "id": "plus-your-ai-privacy",
        "title": "Your privacy with Mariposa",
        "body": "Your journal stays private to you. When you ask for help, the text involved is sent to the AI service to write the answer. Nothing is shared with other members.",
        "keywords": [
          "privacy",
          "openai",
          "training",
          "consent",
          "allow mariposa"
        ]
      }
    ]
  },
  {
    "id": "collective-on-your-phone",
    "name": "The Collective on your phone",
    "area": "Daily Operations",
    "where": "On your phone: The Collective > Me > Put the Collective on your phone",
    "href": "/community/profile#app",
    "what": "The Collective on your phone, with its own icon and push notifications. It is the same live community you see on the web. The Put the Collective on your phone card in your profile shows the exact steps for your phone and browser.",
    "ai": "Has an AI button",
    "aiNote": "The same buttons as on the web, on the same AI: your own key, or Mariposa on your Collective Plus allowance. Nothing about AI is different on your phone.",
    "steps": [
      "On your phone, open collective.lccommandsuite.com/community in Safari or Chrome and sign in.",
      "Press Me in the bottom bar.",
      "Find Put the Collective on your phone and follow the steps it shows for your phone.",
      "Open the Collective from its new icon on your home screen.",
      "In Me, under Notifications, press Turn on."
    ],
    "health": "This does not change your scores. It keeps your community within reach during the day.",
    "tips": [
      "If you opened the link inside Instagram or Facebook, press the menu and choose Open in browser first. Those apps cannot install it.",
      "On iPhone, push notifications only work once you open the Collective from its home screen icon.",
      "On a computer, the card tells you to open the page on your phone instead."
    ],
    "questions": [
      {
        "q": "Why don't I get notifications on my iPhone?",
        "a": "Open the Collective from its home screen icon, then check that your profile says Push is on for this device."
      }
    ],
    "related": [
      "collective-profile-and-notifications",
      "the-collective",
      "collective-plus"
    ],
    "who": "Every Collective member.",
    "keywords": [
      "iphone",
      "app",
      "phone",
      "mobile",
      "app store",
      "install",
      "home screen",
      "add to home screen",
      "android",
      "push",
      "download app",
      "iphone",
      "android",
      "app",
      "home screen",
      "install"
    ],
    "sections": [
      {
        "id": "collective-add-to-home-screen",
        "title": "Add it to your home screen",
        "body": "On iPhone, use Share, then Add to Home Screen, then Add. On Android in Chrome, use the menu, then Install app. Where your browser allows it, you see an Install the Collective button instead.",
        "keywords": [
          "add to home screen",
          "install the collective",
          "share button",
          "install app",
          "chrome",
          "safari"
        ]
      }
    ]
  },
  {
    "id": "collective-channels-and-posts",
    "name": "Collective channels and posts",
    "area": "Daily Operations",
    "where": "Daily Operations > The Collective > Community and Your Channels in the Collective's menu",
    "href": "/community/s/commons",
    "what": "Channels are the areas of the Collective, such as Community and any program you belong to. Each channel holds conversations on one topic, where members post, reply and react.",
    "ai": "Has an AI button",
    "aiNote": "Help me say this rewrites your draft Warmer, Clearer or Shorter in your own voice. Catch me up summarizes a post with six or more replies. Both use your own AI key, or Mariposa on your Collective Plus allowance. Nothing posts for you. You review it and press Post or Reply yourself.",
    "steps": [
      "Open a channel from the Collective's menu. On a phone, press Channels in the bottom bar.",
      "Press a conversation in the channel to read it.",
      "Press the box at the top, write your post, and type @ to tag someone.",
      "Press Photo / video to add a file, then press Post.",
      "Press a post to open it, then reply or add a reaction.",
      "Press the three dots on a post to edit, delete or report it."
    ],
    "health": "This does not change your scores. It gives you a place to ask, share and be encouraged by people doing the same work.",
    "tips": [
      "Paste a YouTube, Vimeo or Loom link and it plays right in the post.",
      "Add up to 10 photos or files to a post, each up to 50 MB.",
      "Looking for an accountability partner? Try the Find an Accountability Partner conversation in Community."
    ],
    "questions": [
      {
        "q": "Why can't I post in a channel?",
        "a": "If you see Join channel, press it first. Some conversations, like announcements, are only for updates from the hosts."
      },
      {
        "q": "How do I leave a channel?",
        "a": "Open the channel and press Leave channel. Community and other default channels cannot be left."
      },
      {
        "q": "What happens when I report something?",
        "a": "Choose what is wrong and press Send report. An admin reviews it, and the person is not told who reported them."
      }
    ],
    "related": [
      "the-collective",
      "collective-messages",
      "collective-members-directory",
      "accountability-partner"
    ],
    "who": "Every Collective member. You see public channels and the private ones you belong to.",
    "keywords": [
      "channels",
      "spaces",
      "posts",
      "post",
      "reply",
      "thread",
      "reaction",
      "mention",
      "tag",
      "pin",
      "report a post",
      "help me say this",
      "catch me up",
      "wins"
    ],
    "sections": [
      {
        "id": "spaces-and-channels",
        "title": "Channels",
        "body": "Your menu lists Community, Your Channels and Start Here. A channel page shows its conversations, upcoming events and members. Public channels can be read before you join. Private ones show only once you belong to them.",
        "keywords": [
          "channels",
          "spaces",
          "private channel",
          "public channel",
          "join channel",
          "start here"
        ]
      },
      {
        "id": "posts-and-threads",
        "title": "Posts and threads",
        "body": "Open a post to see its replies. You can reply to a reply, react, attach a photo or video, and delete your own reply. Press the flag to report a reply. New replies appear as they come in.",
        "keywords": [
          "post",
          "thread",
          "replies",
          "reactions",
          "attachments",
          "report",
          "flag"
        ]
      }
    ]
  },
  {
    "id": "collective-messages",
    "name": "Collective messages",
    "area": "Daily Operations",
    "where": "Daily Operations > The Collective > Messages",
    "href": "/community/messages",
    "what": "Private conversations with fellow members, one-on-one or in a small group.",
    "ai": "Has an AI button",
    "aiNote": "Help me say this appears above the box once you have written a little. It rewrites your draft Warmer, Clearer or Shorter in your own voice, using your own AI key or Mariposa on your Collective Plus allowance. It never sends for you. Private messages are not scanned by the Collective's safety check.",
    "steps": [
      "Open Messages from the Collective's menu, or from the bottom bar on a phone.",
      "Press New and choose one person, or two or more for a group.",
      "For a group, add a Group name if you like.",
      "Press the button at the bottom to start the conversation.",
      "Write your message. Press Enter to send, or Shift and Enter for a new line."
    ],
    "health": "This does not change your scores. It helps you build real relationships with other members.",
    "tips": [
      "You can also press Message on any member's profile.",
      "Press the image button beside the box to add a photo or video.",
      "New messages show as a count on Messages, not in your Notifications list."
    ],
    "questions": [
      {
        "q": "Why does it say my message couldn't be sent?",
        "a": "The member may not be accepting messages from you. In a group, you may no longer be in the conversation."
      },
      {
        "q": "How do I stop people messaging me?",
        "a": "In your profile, turn off Let members send me direct messages, then press Save changes. To stop one person, block them from their profile."
      },
      {
        "q": "How do I report a message?",
        "a": "Press the flag beside the message, choose what is wrong and press Send report."
      }
    ],
    "related": [
      "collective-members-directory",
      "collective-profile-and-notifications",
      "collective-channels-and-posts"
    ],
    "who": "Every Collective member, unless the other person has turned messages off or blocked you.",
    "keywords": [
      "messages",
      "dm",
      "direct message",
      "private message",
      "group message",
      "group chat",
      "new message",
      "help me say this",
      "leave group"
    ],
    "sections": [
      {
        "id": "direct-messages",
        "title": "Direct messages",
        "body": "A one-on-one conversation with another member. Your list shows the latest message from each conversation, newest first, with a dot on anything unread.",
        "keywords": [
          "direct message",
          "dm",
          "one on one",
          "unread"
        ]
      },
      {
        "id": "group-messages",
        "title": "Group messages",
        "body": "Press the group's name to see who is in it. Anyone in the group can rename it or use Add people. Whoever started it can remove people. Press Leave this group to leave.",
        "keywords": [
          "group",
          "add people",
          "rename group",
          "remove",
          "leave this group"
        ]
      }
    ]
  },
  {
    "id": "collective-members-directory",
    "name": "Collective members directory",
    "area": "Daily Operations",
    "where": "Daily Operations > The Collective > Members",
    "href": "/community/members",
    "what": "The people of The LifeCharter Collective. Find members by name, focus or location and open their profiles.",
    "ai": "No AI",
    "aiNote": "",
    "steps": [
      "Open Members from the Collective's menu.",
      "Type in Search by name, focus or location.",
      "Use the Everyone list to narrow it to one of your channels.",
      "Press a member to open their profile.",
      "Press Message to write to them."
    ],
    "health": "This does not change your scores. It helps you find people to learn from, collaborate with and encourage.",
    "tips": [
      "To stay out of the directory, turn off Show me in the member directory in your profile, then press Save changes.",
      "A small gold mark beside a name means that member has Collective Plus.",
      "Press your own card, then Edit profile, to change what others see."
    ],
    "questions": [
      {
        "q": "Why can't I find someone?",
        "a": "They may have chosen not to show in the directory, or you may have blocked them."
      },
      {
        "q": "What does Block do?",
        "a": "You do not see their posts or replies, you cannot message each other, and their tags and replies do not notify you. They are not told. You can press Unblock anytime."
      }
    ],
    "related": [
      "collective-messages",
      "collective-profile-and-notifications",
      "accountability-partner"
    ],
    "who": "Every Collective member.",
    "keywords": [
      "members",
      "directory",
      "find a member",
      "search people",
      "profile",
      "block",
      "unblock",
      "report member"
    ],
    "sections": [
      {
        "id": "members-directory",
        "title": "Members directory",
        "body": "A card for each member with their photo, what they do and their location. Search and the channel list work together.",
        "keywords": [
          "directory",
          "search",
          "filter by channel"
        ]
      },
      {
        "id": "member-profiles",
        "title": "Member profiles",
        "body": "A profile shows a member's photo, bio, location, website, channels and recent posts. From there you can press Message, Block or Report.",
        "keywords": [
          "member profile",
          "bio",
          "recent posts",
          "message",
          "block",
          "report"
        ]
      }
    ]
  },
  {
    "id": "collective-profile-and-notifications",
    "name": "Collective profile and notifications",
    "area": "Daily Operations",
    "where": "Daily Operations > The Collective > your photo and name (Profile & settings), or Me on a phone. Notifications has its own place in the Collective's menu.",
    "href": "/community/profile",
    "what": "Your photo, bio, privacy and notification choices in the Collective, and the page that lists what you have been notified about. This is your Collective profile, separate from your Suite settings.",
    "ai": "No AI",
    "aiNote": "Nothing on these pages uses AI. Your profile has a Mariposa (AI) card that shows whether you have allowed Mariposa, with a Withdraw permission button.",
    "steps": [
      "Press your photo and name at the bottom of the Collective's menu, or Me on a phone.",
      "Press Change photo and fill in your name, focus, location, website and About you.",
      "Under Privacy, choose whether you show in the directory and can be messaged.",
      "Under Notifications, choose email, push and journal reminders.",
      "Press Save changes.",
      "To get push on this device, press Turn on in the Notifications card."
    ],
    "health": "This does not change your scores. It helps members get to know you and keeps your notifications to what you want.",
    "tips": [
      "Your phone number is private. Only admins can see it.",
      "Under Per channel, set each channel to Everything, Announcements only or Muted.",
      "Appearance offers Light, Dark or System and is saved on that device."
    ],
    "questions": [
      {
        "q": "How do I stop Collective emails?",
        "a": "Turn off Email me about announcements, replies and messages in your profile, then press Save changes."
      },
      {
        "q": "How do I delete my Collective account?",
        "a": "Press Delete my account at the bottom of your profile, type DELETE and press Delete permanently. This cannot be undone."
      },
      {
        "q": "What if my login also has Command Suite?",
        "a": "You see Request received, and the LifeCharter team finishes the deletion and confirms by email. Any Collective Plus subscription is cancelled the moment you ask, so you are not billed again."
      }
    ],
    "related": [
      "the-collective",
      "collective-on-your-phone",
      "collective-plus",
      "collective-members-directory",
      "my-alignment-journal"
    ],
    "who": "Every Collective member.",
    "keywords": [
      "profile",
      "notifications",
      "bell",
      "push",
      "email digest",
      "mute",
      "privacy",
      "photo",
      "bio",
      "delete account",
      "change password",
      "dark mode",
      "mariposa permission"
    ],
    "sections": [
      {
        "id": "collective-notifications",
        "title": "Collective notifications",
        "body": "The Notifications page lists announcements, replies, tags, event reminders and journal nudges. Press one to open it, or press Mark all read. Push arrives on your devices, and email gathers anything still unread.",
        "keywords": [
          "notifications",
          "mark all read",
          "push",
          "email digest",
          "reminders"
        ]
      },
      {
        "id": "collective-profile",
        "title": "Collective profile",
        "body": "Your profile also holds Blocked members, Put the Collective on your phone, the Mariposa (AI) card, and links for Community guidelines and Change password.",
        "keywords": [
          "profile",
          "blocked members",
          "community guidelines",
          "change password",
          "consent"
        ]
      },
      {
        "id": "collective-delete-account-plus",
        "title": "Deleting your account stops Plus billing",
        "body": "A Collective-only account is deleted in one step, with Plus cancelled. It removes your profile, posts, replies, reactions, messages, journal and uploads. If your login also has Command Suite, the team finishes the deletion, and Plus is cancelled as soon as you ask.",
        "keywords": [
          "delete my account",
          "cancel plus",
          "billing",
          "request received"
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
    "what": "Your address book. Everyone who books, buys or fills in a form lands here, and you can add people yourself. Every touch shows on that person's timeline.",
    "ai": "Has an AI button",
    "aiNote": "When you schedule a follow-up on a contact, Draft the email with AI writes it using your own AI key. Nothing is sent until you press Send in Daily Compass. Without a key you can still write the email yourself. In chat, your assistant can also find and add contacts, and any change waits behind Approve. The rest of this page does not use AI.",
    "steps": [
      "Open Contacts from the left menu.",
      "Search by name or email, or choose a tag in the All tags menu.",
      "Press Add contact, fill in the email and anything else you know, and press Save. As you type, the Suite shows people already in your list so you can open them instead.",
      "Press a person in the list to see their record and timeline.",
      "On their record, use Schedule a follow-up to pick a day and say what it is about, then press Schedule follow-up.",
      "Press Export contacts whenever you want a copy of your list as a spreadsheet file."
    ],
    "health": "Contacts added in the last 30 days count toward your Customer Acquisition pillar. Contacts who came through an affiliate count toward your Referral Process pillar. Keeping this list current gives those two pillars a truer picture.",
    "tips": [
      "Press any tag on a person to see everyone who has it.",
      "Add tags as you go, so you can filter to the right people later.",
      "Moving your list over from somewhere else? Press Import contacts instead of adding people one by one."
    ],
    "questions": [
      {
        "q": "Do I have to enter people who book or buy?",
        "a": "No. Everyone who books, buys or fills in a form lands here on their own."
      },
      {
        "q": "What if I add someone who is already here?",
        "a": "The Suite does not make a second copy. If you save an email that is already in your list, it updates that person and tells you so."
      },
      {
        "q": "What happens to a follow-up I schedule?",
        "a": "It becomes a task for that day. If you added an email draft, the draft waits for you in Daily Compass on that day."
      }
    ],
    "related": [
      "contact-record",
      "import-contacts",
      "forms",
      "tag-library",
      "tasks"
    ],
    "who": "Everyone. Team members need the Contacts area. Only the account owner can export the list.",
    "keywords": [
      "crm",
      "address book",
      "people",
      "clients",
      "leads",
      "customers",
      "tags",
      "search",
      "add contact",
      "duplicate",
      "export",
      "download list",
      "import",
      "follow up",
      "follow-up",
      "timeline"
    ],
    "starter": true
  },
  {
    "id": "import-contacts",
    "name": "Import contacts",
    "area": "Clients & Sales",
    "where": "Clients & Sales > Contacts > Contacts tab > Import contacts",
    "href": "/contacts",
    "what": "Brings your existing list into the Suite from a CSV or vCard file, or from cells you paste out of a spreadsheet. You check everything before it saves, and it never emails anyone.",
    "ai": "No AI",
    "aiNote": "This does not use AI. The columns are matched by the Suite itself, and you can change any match.",
    "steps": [
      "Export your list from where it lives now. How to export from… on the import panel shows the steps for Gmail, Outlook, iPhone, your old CRM and spreadsheets.",
      "Open Contacts and press Import contacts.",
      "Drop in your file, or press Paste from a spreadsheet instead and then Use pasted list.",
      "On Match your columns, check each column. Only the email is required.",
      "Read the counts and the preview, keep or change the tag, and tick the box to confirm these people have agreed to hear from you.",
      "Press the Import button and keep the page open until it finishes."
    ],
    "health": "Contacts added in the last 30 days, imports included, count toward your Customer Acquisition pillar. People you already had do not count again.",
    "tips": [
      "The Suite adds a tag with today's date to everyone in the import, so you can find the group afterward. Change it or leave it blank.",
      "Excel and Numbers files will not load. Save as CSV first, or copy the cells and paste them.",
      "If rows were skipped, press Download skipped rows (CSV), fix them and import that file."
    ],
    "questions": [
      {
        "q": "Will importing email anyone?",
        "a": "No. Importing does not email anyone or start a campaign."
      },
      {
        "q": "What happens to people already in my contacts?",
        "a": "They are merged, not copied. Tags already on them are kept. Anyone who unsubscribed stays unsubscribed."
      },
      {
        "q": "How big can my file be?",
        "a": "Up to 5 MB and 5,000 contacts in one import. For more, split the list into smaller files and import each one."
      }
    ],
    "related": [
      "contacts",
      "tag-library",
      "forms"
    ],
    "who": "Everyone. Team members need the Contacts area.",
    "keywords": [
      "import",
      "upload",
      "csv",
      "vcard",
      "vcf",
      "spreadsheet",
      "paste",
      "bring my list",
      "move contacts",
      "gmail contacts",
      "outlook contacts",
      "iphone contacts",
      "mailchimp",
      "gohighlevel",
      "kajabi",
      "merge",
      "skipped rows",
      "consent"
    ]
  },
  {
    "id": "forms",
    "name": "Forms",
    "area": "Clients & Sales",
    "where": "Clients & Sales > Contacts > Forms tab",
    "href": "/contacts?tab=forms",
    "what": "Sign-up and lead forms with their own share link. Each submission saves the person as a contact, tags them, and can start one of your campaigns.",
    "ai": "No AI",
    "aiNote": "This page does not use AI. In chat, your assistant can create a form or change an existing one. It waits behind Approve, and Undo puts the old version back.",
    "steps": [
      "Open Contacts and press the Forms tab.",
      "Type a name in New form name and press the plus button.",
      "Under Settings, list your fields, one per line, then press Save fields. Add * for required, and : choice | choice for a list.",
      "Set the tags, the button text, the thank-you message and, if you like, a campaign to start.",
      "Press Preview to see what the person will see.",
      "Press the copy icon beside Share link and share it. Press Turn on if the form is off."
    ],
    "health": "This does not have its own score. New people from a form count toward your Customer Acquisition pillar, and people credited to an affiliate count toward your Referral Process pillar.",
    "tips": [
      "Email is always included, so you do not need to add it.",
      "Tick Email me each new submission to hear about each one.",
      "A campaign only sends once your Email sending setup is finished."
    ],
    "questions": [
      {
        "q": "Can I put a form on my own website?",
        "a": "Yes. Link to the share link, or point a plain HTML form at the address shown on the form. The form shows the input names to use."
      },
      {
        "q": "Where do I see who filled it in?",
        "a": "Open the form and look under Submissions. Each person also lands in Contacts."
      },
      {
        "q": "What does Turn off do?",
        "a": "The form stops taking new submissions. You can press Turn on at any time."
      }
    ],
    "related": [
      "contacts",
      "email-sending-setup",
      "tag-library",
      "affiliates"
    ],
    "who": "Everyone. Team members need the Contacts area.",
    "keywords": [
      "form",
      "forms",
      "sign up form",
      "signup",
      "lead form",
      "opt in",
      "opt-in",
      "share link",
      "embed",
      "website form",
      "thank you message",
      "submissions",
      "button text",
      "questions"
    ],
    "sections": [
      {
        "id": "form-preview",
        "title": "Form preview",
        "body": "Press Preview on any form to see it as the person will: the fields, the button, the thank-you message and what happens after they press the button. You can try the boxes and choices. Nothing is sent or saved, and it shows your typed fields even before you save them.",
        "keywords": [
          "preview",
          "see my form",
          "test form",
          "what they see",
          "hide preview"
        ]
      }
    ]
  },
  {
    "id": "email-sending-setup",
    "name": "Email sending setup",
    "area": "Clients & Sales",
    "where": "Clients & Sales > Contacts > Email sending tab",
    "href": "/contacts?tab=sending",
    "what": "Three steps that let the Suite email your contacts from your own business. You connect your own Resend account, verify your own sending domain, and say who your emails come from.",
    "ai": "No AI",
    "aiNote": "This does not use AI.",
    "steps": [
      "Open Contacts and press the Email sending tab.",
      "Create a free account at resend.com/signup. Open API Keys, press Create API Key and choose Full access.",
      "Paste the key into step 1 and press Connect Resend.",
      "In step 2, type a subdomain like mail.yourbusiness.com and press Add domain.",
      "Add each record shown where you manage your domain, using the copy buttons, then press Check verification.",
      "In step 3, fill in your From name, sign-off and Business mailing address, then press Save."
    ],
    "health": "This does not change your scores. It helps by letting your campaigns, broadcasts and booking emails reach people.",
    "tips": [
      "Use a subdomain, not your main domain. It keeps your everyday email untouched.",
      "Resend shows your key only once, so paste it right away.",
      "Leave a box in step 3 empty to use what is shown in grey."
    ],
    "questions": [
      {
        "q": "What is waiting until I finish?",
        "a": "Booking confirmations and reminders wait on your Resend account and verified domain. Campaigns and broadcasts also need your mailing address. The top of the tab shows what is ready."
      },
      {
        "q": "My domain still says Not found yet. What now?",
        "a": "Check that each record matches exactly, then press Check verification again. Some domain providers take longer than others."
      },
      {
        "q": "Is connecting Google or Microsoft in Settings the same thing?",
        "a": "No. That does not email your contacts. Calendar invites from a host's connected calendar still go out, but all other email to contacts needs this setup."
      }
    ],
    "related": [
      "contacts",
      "forms",
      "calendars-and-booking-pages"
    ],
    "who": "Only the account owner can connect Resend or add or remove the domain. Team members with the Contacts area can see this tab and change step 3.",
    "keywords": [
      "email sending",
      "resend",
      "api key",
      "domain",
      "verify domain",
      "dns",
      "records",
      "sender",
      "from name",
      "from address",
      "reply to",
      "sign-off",
      "mailing address",
      "can-spam",
      "emails not sending",
      "deliverability"
    ]
  },
  {
    "id": "pipeline",
    "name": "Pipeline",
    "area": "Clients & Sales",
    "where": "Clients & Sales > Pipeline",
    "href": "/sales/pipeline",
    "what": "Your board of deals, from first conversation to won. Each deal has a value and your honest odds of closing it, so you can see what is open and what you can expect to close.",
    "ai": "No AI",
    "aiNote": "This page does not use AI. In chat, your assistant can add a deal for you, and it waits behind Approve.",
    "steps": [
      "Open Pipeline from the left menu.",
      "Press Add a deal. Fill in Who it's with, or search your contacts there.",
      "Choose an Offer to fill in the Deal value, add a Next step and its due date, then press Save deal.",
      "Drag the card to its next column, or use the Move to menu on the card.",
      "Open a deal to log a call under Calls and follow-ups, then press Log it on this deal.",
      "Press Edit columns to rename, reorder, add or remove columns and set their default odds."
    ],
    "health": "Open deals with a Next step filled in count toward your Sales Journey pillar. Calls and follow-ups you log on a deal are sales activities. They feed your Sales dimension, and their Won and Lost outcomes set your win rate.",
    "tips": [
      "Give every open deal a next step. It keeps the deal moving and it is what your Sales Journey pillar reads.",
      "A deal with no movement for 14 days is marked, and it counts in Deals to move today.",
      "Any deal can have its own odds. Untick Use the stage's default to set them.",
      "Add an email to a deal and that person is saved to Contacts, so you never enter them twice."
    ],
    "questions": [
      {
        "q": "What does Weighted by probability mean?",
        "a": "Each open deal's value multiplied by its odds of closing, added up. It is what you can expect to close."
      },
      {
        "q": "What happens if I remove a column with deals in it?",
        "a": "Edit columns asks where those deals should go. If you do not choose, they move to the first open column."
      },
      {
        "q": "Do deals appear here on their own?",
        "a": "Yes, in two cases: a calendar set to Add each booking to the Pipeline as a deal, and a card moved to a Booked stage in Outreach Pipelines."
      }
    ],
    "related": [
      "offers-packages",
      "sales-activities",
      "calendars-and-booking-pages",
      "outreach-pipelines",
      "contacts"
    ],
    "who": "Everyone. Team members need the Pipeline, Offers & Sales Plan area.",
    "keywords": [
      "pipeline",
      "deals",
      "deal board",
      "kanban",
      "stages",
      "columns",
      "probability",
      "odds",
      "weighted",
      "won this month",
      "next step",
      "sales",
      "forecast",
      "lost deal",
      "edit columns"
    ],
    "sections": [
      {
        "id": "pipeline-tiles",
        "title": "The four tiles",
        "body": "Open pipeline is the value of your open deals. Weighted by probability is what you can expect to close. Won this month is what you closed this month. Deals to move today counts deals that are due, overdue or stuck.",
        "keywords": [
          "open pipeline",
          "weighted by probability",
          "won this month",
          "deals to move today",
          "tiles"
        ]
      },
      {
        "id": "calls-and-follow-ups",
        "title": "Calls and follow-ups on a deal",
        "body": "Open a saved deal to log a call or follow-up with Log it on this deal, or attach one you logged in the last 90 days. These also show in Sales Activities.",
        "keywords": [
          "log a call",
          "calls and follow-ups",
          "attach activity",
          "deal history"
        ]
      }
    ]
  },
  {
    "id": "calendars-and-booking-pages",
    "name": "Calendars and booking pages",
    "area": "Clients & Sales",
    "where": "Clients & Sales > Calendars",
    "href": "/calendars",
    "what": "Booking links people use to pick a time with you. They check each host's real calendars, send reminders and put every booking in Contacts. The page has three tabs: Bookings, Calendars and Hosts.",
    "ai": "No AI",
    "aiNote": "This page does not use AI. In chat, your assistant can create a booking link or change an existing one. It waits behind Approve, and Undo puts the old values back.",
    "steps": [
      "Open Calendars and press the Hosts tab. Fill in Add a host and press Add host.",
      "Type the host's working hours and press Save host. Then press Connect calendars, or Copy link to send the host their private link.",
      "Press the Calendars tab, type a New calendar name and press the plus button.",
      "Set the length, gaps, notice, hosts, where you will meet and any questions, then press Save calendar.",
      "If the top button says Turn on, press it. Then copy your Booking link and share it.",
      "After a meeting, open the Bookings tab, press Past 30 days and press Attended or No-show."
    ],
    "health": "Booking pages do not change your scores on their own. New people who book land in Contacts, and they count toward your Customer Acquisition pillar.",
    "tips": [
      "Finish Email sending setup first, or confirmation and reminder emails stay off. Bookings still work, and invites from a host's connected calendar still go out.",
      "Write a No-show follow-up email on the calendar. It goes out when you press No-show, with a button to choose a new time.",
      "Tick Add each booking to the Pipeline as a deal to have a deal open for each new booking."
    ],
    "questions": [
      {
        "q": "How do I use Zoom or Google Meet?",
        "a": "Under Where, choose Somewhere else and paste your own meeting link in Details."
      },
      {
        "q": "Can more than one person take these calls?",
        "a": "Yes. Under Who takes these calls, choose Round robin among the hosts ticked and tick each host."
      },
      {
        "q": "What happens to the deal if someone cancels?",
        "a": "It moves to Lost, and the same happens with No-show. If they book again it reopens. Mark it Won in your Pipeline when they buy."
      }
    ],
    "related": [
      "paid-and-deposit-booking",
      "email-sending-setup",
      "contacts",
      "pipeline"
    ],
    "who": "Everyone. Team members need the Calendars area. Hosts need a connected calendar for their busy times to be checked, but they do not need a Suite account to connect it.",
    "keywords": [
      "booking",
      "booking link",
      "booking page",
      "calendly",
      "schedule",
      "appointments",
      "hosts",
      "round robin",
      "buffer",
      "gap",
      "notice",
      "no-show",
      "attended",
      "reminders",
      "reschedule",
      "cancel",
      "working hours"
    ],
    "sections": [
      {
        "id": "public-booking-page",
        "title": "Your public booking page",
        "body": "This is where people pick a time. Once they book, they get a confirmation and a calendar invite, then reminders 24 hours and 1 hour before. Name, email and phone are always asked.",
        "keywords": [
          "public page",
          "pick a time",
          "confirmation",
          "24 hour reminder",
          "1 hour reminder"
        ]
      },
      {
        "id": "manage-booking",
        "title": "Rescheduling or canceling",
        "body": "Each booking has a private link so the person can reschedule or cancel without logging in. You can also press Cancel on the Bookings tab, add a note, and they are told.",
        "keywords": [
          "reschedule",
          "cancel booking",
          "change my time",
          "manage booking"
        ]
      },
      {
        "id": "host-calendar-connect",
        "title": "Connecting a host's calendars",
        "body": "Each host has a private link for connecting Google or Microsoft calendars, with no Suite account needed. People can only book times when all connected calendars are free. New link makes a fresh one and stops the old one.",
        "keywords": [
          "connect calendar",
          "google calendar",
          "microsoft calendar",
          "outlook calendar",
          "connect link",
          "busy times"
        ]
      },
      {
        "id": "calendar-connection-alert",
        "title": "If a calendar stops working",
        "body": "Every connected host calendar is checked every 30 minutes. If one stops working, you get a bell alert and an email with a Reconnect link, then a reminder every 3 days. Until it is fixed, your booking page may show no open times. The alert clears itself once the calendar works again. There is nothing to set up.",
        "keywords": [
          "calendar broken",
          "reconnect",
          "no times showing",
          "no available times",
          "calendar alert",
          "expired"
        ]
      }
    ]
  },
  {
    "id": "paid-and-deposit-booking",
    "name": "Paid and deposit booking",
    "area": "Clients & Sales",
    "where": "Clients & Sales > Calendars > Calendars tab > a calendar > Payment when they book",
    "href": "/calendars?tab=calendars",
    "what": "Lets a booking calendar ask for the full price or a deposit before the time is theirs. People pay on your own Stripe account, and the booking is confirmed once they have paid.",
    "ai": "No AI",
    "aiNote": "This does not use AI.",
    "steps": [
      "Connect your Stripe account in Settings > Integrations.",
      "Open Calendars, press the Calendars tab and choose a calendar.",
      "Under Payment when they book, choose Pay the full price to book or Pay a deposit to book.",
      "Enter the Price, and the Deposit if you chose one.",
      "Press Save calendar.",
      "Open your Booking link to see the amount people will be shown."
    ],
    "health": "Paid bookings post to your Finance Center as income, and income feeds your Finance dimension.",
    "tips": [
      "Once paid, the person gets the usual confirmation emails and calendar event, and their contact and any deal are set up as with a free booking.",
      "To collect the rest of a deposit, send an invoice from Payments & Invoices."
    ],
    "questions": [
      {
        "q": "What if someone starts paying and does not finish?",
        "a": "Their time is held for 30 minutes while they pay. An unpaid hold is released and the time goes back on the calendar."
      },
      {
        "q": "Does the Suite refund people who cancel?",
        "a": "No. You get an email saying what they paid, and you make any refund in your own Stripe account if your policy allows."
      },
      {
        "q": "If a paid booking moves to a new time, are they charged again?",
        "a": "No. A paid booking that moves keeps its payment."
      }
    ],
    "related": [
      "calendars-and-booking-pages",
      "payment-links-on-offers",
      "offers-packages"
    ],
    "who": "Everyone. Team members need the Calendars area. You need your own Stripe account connected first.",
    "keywords": [
      "paid booking",
      "deposit",
      "charge for a call",
      "payment when they book",
      "stripe",
      "take payment",
      "refund",
      "held time",
      "hold",
      "pay to book"
    ]
  },
  {
    "id": "outreach-pipelines",
    "name": "Outreach Pipelines",
    "area": "Clients & Sales",
    "where": "Clients & Sales > Outreach Pipelines",
    "href": "/dm-pipeline",
    "what": "Boards for tracking your DMs and other outreach, one person per card. Drag a card to its next stage and its follow-up, tag and timeline update on their own. You send each message yourself, and the Suite keeps count.",
    "ai": "Has an AI button",
    "aiNote": "In the message window, your assistant can customize a message for one person, and the Prospect Qualifier section on a card can score them. Both use your own AI key. A customized message only fills the box, and nothing is sent or saved until you copy it and press I sent it. In chat, your assistant can also create pipelines and add or move people, and those changes wait behind Approve.",
    "steps": [
      "Open Outreach Pipelines and choose a pipeline from the row at the top, or press New pipeline.",
      "Press Add a person. For many people at once, open Add people faster.",
      "On a card, use Choose a DM to send and pick one of your scripts.",
      "In the small window, fill in anything in [brackets], press Copy message and Open their profile, then paste and send it yourself.",
      "Choose where to move them under After you send it, and press I sent it.",
      "Drag a card to its next stage at any time. Its follow-up date sets itself and becomes a task."
    ],
    "health": "Each DM you log with I sent it counts as a sales activity. Your activity in the last 30 days feeds your Sales dimension and your Customer Acquisition pillar. Follow-ups made here are regular tasks, so finishing them counts toward your task follow-through.",
    "tips": [
      "Your scripts must be approved in Scripts & Templates to show in the Choose a DM to send menu. The DM scripts & templates button takes you there.",
      "Add an email to a card that says Not in Contacts. That puts them in Contacts and tags them.",
      "On LinkedIn, send a connection request first and wait in Connect request sent: waiting until they accept."
    ],
    "questions": [
      {
        "q": "Does the Suite send my DMs?",
        "a": "No. Platforms do not let any app read or send your DMs. You paste and send each message, then press I sent it to log it."
      },
      {
        "q": "What does a Booked stage do?",
        "a": "Moving a card there adds the person to your Pipeline as a deal. Set which stage is Booked under Stages & settings."
      },
      {
        "q": "Can I have more than one pipeline?",
        "a": "Yes. Press New pipeline and start from DM outreach stages, Cold email stages or Three simple stages. Rename stages, tags and follow-ups under Stages & settings."
      }
    ],
    "related": [
      "add-people-to-an-outreach-pipeline",
      "cold-email-stages-and-updates",
      "scripts-templates",
      "prospect-qualifier",
      "pipeline",
      "sales-activities"
    ],
    "who": "Everyone. Team members need the Outreach Pipelines, Prospect Qualifier & Meta leads area.",
    "keywords": [
      "outreach",
      "dm",
      "dms",
      "direct message",
      "dm pipeline",
      "prospecting",
      "social selling",
      "linkedin",
      "instagram",
      "facebook",
      "whatsapp",
      "follow up",
      "stages",
      "daily limit",
      "scripts",
      "connect request",
      "new pipeline"
    ],
    "sections": [
      {
        "id": "message-window",
        "title": "The message window",
        "body": "Picking a script opens the message in its own small window, with the person's name filled in. Press Make it warmer, Make it shorter or another button, or type what to change, and Back to the original undoes it. I sent it logs the DM on the card, their timeline and Sales Activities. Not yet closes it with nothing logged.",
        "keywords": [
          "choose a dm to send",
          "copy message",
          "open their profile",
          "i sent it",
          "not yet",
          "customize message",
          "make it warmer"
        ]
      },
      {
        "id": "daily-dm-limit",
        "title": "Daily DM counter",
        "body": "Above the board, each platform shows new DMs sent in the last 24 hours against your daily limit, such as LinkedIn 3 / 25. It starts at 25. Follow-up DMs show beside it. It turns gold when you are close and red at the limit, with the time the next one opens. Press the limit number to change it.",
        "keywords": [
          "daily limit",
          "dm limit",
          "counter",
          "how many dms",
          "restricted account",
          "25 a day"
        ]
      },
      {
        "id": "whatsapp-outreach",
        "title": "WhatsApp and other platforms",
        "body": "Each card shows its platform: Instagram, Facebook, LinkedIn, WhatsApp, Email or Text. The buttons above the board filter by platform. Contacts reached there get a matching tag, such as from-whatsapp.",
        "keywords": [
          "whatsapp",
          "platform",
          "from-whatsapp",
          "filter by platform"
        ]
      },
      {
        "id": "all-outreach-every-pipeline",
        "title": "All outreach, every pipeline",
        "body": "Press Show on this panel at the top to see where everyone is right now, by channel and by pipeline, across all your pipelines.",
        "keywords": [
          "all outreach",
          "overview",
          "every pipeline",
          "by channel",
          "totals"
        ]
      },
      {
        "id": "connect-request-stage",
        "title": "Connect request sent: waiting",
        "body": "DM pipelines include this stage after To reach out, for LinkedIn. The message window will not log a DM from this stage until you tick that they have accepted your request.",
        "keywords": [
          "connect request",
          "linkedin connection",
          "waiting",
          "accepted"
        ]
      },
      {
        "id": "personal-links",
        "title": "Personal links",
        "body": "Under Stages & settings, fill in Personal links go to with your own page. Each person on that pipeline then has their own link to it. Use [their personal link] in a script and it fills in for that person.",
        "keywords": [
          "personal link",
          "tracking link",
          "landing page",
          "link clicks"
        ]
      },
      {
        "id": "private-contact",
        "title": "Do not contact - private contact",
        "body": "The last stage on every outreach pipeline. Move someone here when they are a private contact you do not want to reach out to. The card gets no follow-ups and stays put. It does not unsubscribe them from your emails.",
        "keywords": [
          "do not contact",
          "private contact",
          "friend",
          "family",
          "personal contact"
        ]
      }
    ]
  },
  {
    "id": "offers-packages",
    "name": "Offers & Packages",
    "area": "Clients & Sales",
    "where": "Clients & Sales > Offers & Packages",
    "href": "/sales/offers",
    "what": "One place for everything you sell: price, what is included, who it is for and your checkout link. Deals in your Pipeline point to these offers.",
    "ai": "No AI",
    "aiNote": "This page does not use AI. In chat, your assistant can list, add and change offers, and changes wait behind Approve.",
    "steps": [
      "Open Offers & Packages from the left menu.",
      "Press Add an offer.",
      "Fill in the Offer name, Format, Status, Price and How it's paid.",
      "Add The transformation, What's included, Who it's for and any Guarantee.",
      "Paste your Sales page or checkout link, then press Save offer.",
      "Drag the grip on a card to put your offers in the order you want."
    ],
    "health": "This does not change your scores. It helps by keeping your prices and offers in one place, ready for your deals.",
    "tips": [
      "To stop selling an offer but keep its history, set it to Retired instead of deleting it.",
      "Choosing an offer on a deal fills in the deal value for you.",
      "Keep unfinished ideas as Draft. The Active, Draft, Retired and All buttons show each group."
    ],
    "questions": [
      {
        "q": "Can I search my offers?",
        "a": "Yes. The search box finds an offer by name, price or what is included."
      },
      {
        "q": "Why can't I see an offer I added?",
        "a": "Check the buttons above the cards. The page opens on Active, so a Draft or Retired offer is under its own button or All."
      },
      {
        "q": "Can people pay from here?",
        "a": "Yes, once your Stripe account is connected you can make a payment link on an offer. You can also paste a link from elsewhere in Sales page or checkout link."
      }
    ],
    "related": [
      "payment-links-on-offers",
      "pipeline",
      "paid-and-deposit-booking"
    ],
    "who": "Everyone. Team members need the Pipeline, Offers & Sales Plan area.",
    "keywords": [
      "offers",
      "packages",
      "products",
      "services",
      "programs",
      "pricing",
      "price list",
      "what i sell",
      "catalog",
      "checkout link",
      "guarantee",
      "retainer",
      "retired",
      "reorder offers"
    ]
  },
  {
    "id": "payment-links-on-offers",
    "name": "Payment links on offers",
    "area": "Clients & Sales",
    "where": "Clients & Sales > Offers & Packages, the Payment link box on each offer card",
    "href": "/sales/offers",
    "what": "Turn any offer into a link people can pay through. The link is made on your own Stripe account, and payments go straight to your Stripe. You can share it anywhere.",
    "ai": "No AI",
    "aiNote": "This box does not use AI. If you ask, your assistant can make or remake a payment link for an offer, and that waits behind Approve.",
    "steps": [
      "Open Offers & Packages. If a card says Connect with Stripe, press it and connect your Stripe account first.",
      "Press Edit on the offer. Set the price and How it's paid, then press Save offer. For a Payment plan, also fill in Number of payments.",
      "Press Create payment link on the card. The words beside the button show what the buyer will be charged.",
      "Press Copy link and share it, or press Open to see what your buyer sees.",
      "If the price changes, press Remake. To stop selling through the link, press Turn off."
    ],
    "health": "A payment link does not change your scores on its own. Each payment adds income to your Finance records, and that income feeds your Finance dimension.",
    "tips": [
      "Your link does not follow a price change. Press Remake, and the old link stops working.",
      "A TEST label beside Payment link means your Stripe connection is in test mode, so no real money moves.",
      "If you already saved a link in Sales page or checkout link, the box shows it with Copy link and Open. Press Make a new payment link instead if you want one made here."
    ],
    "questions": [
      {
        "q": "Why can't I see the Create payment link button?",
        "a": "The offer needs a price, and a payment plan needs its number of payments, from 2 to 24. The box tells you what is missing. If it says Connect with Stripe, connect that first."
      },
      {
        "q": "Why does the box not show for my team member?",
        "a": "Only the account owner or a team admin can manage payments. The box stays hidden for everyone else."
      },
      {
        "q": "Does my buyer pay tax through the link?",
        "a": "Only if you collect GST/HST or a provincial sales tax. The link then opens a short page where the buyer picks their province, or Outside Canada, and sees the tax before paying. A link made before you turned tax on adds none, so press Remake."
      }
    ],
    "related": [
      "offers-packages",
      "paid-and-deposit-booking",
      "lc-plume",
      "pipeline"
    ],
    "who": "Everyone, once Stripe is connected. Team members need the Pipeline area to open the page. Only the account owner or a team admin can create, remake or turn off a link.",
    "keywords": [
      "payment link",
      "pay link",
      "checkout link",
      "get paid",
      "take payment",
      "stripe",
      "sell an offer",
      "buy button",
      "payment plan",
      "monthly payments",
      "installments",
      "subscription",
      "remake link",
      "turn off link",
      "sales tax",
      "gst"
    ],
    "sections": [
      {
        "id": "ways-to-charge",
        "title": "The three ways to charge",
        "body": "The link follows How it's paid on your offer. One-time is paid in full. Monthly charges every month until cancelled. Payment plan splits the offer's price into monthly payments, from 2 to 24, and stops by itself after the last one.",
        "keywords": [
          "paid in full",
          "one-time",
          "monthly until cancelled",
          "payment plan",
          "split payments",
          "stops after last payment"
        ]
      },
      {
        "id": "copy-open-remake-turn-off",
        "title": "Copy link, Open, Remake and Turn off",
        "body": "Once a link exists, these four sit in the box. Copy link copies it, Open shows it, Remake makes a fresh link at the offer's current price and stops the old one, and Turn off stops the link.",
        "keywords": [
          "copy link",
          "open link",
          "remake",
          "turn off",
          "new link",
          "price changed"
        ]
      }
    ]
  },
  {
    "id": "lc-plume",
    "name": "LC Plume",
    "area": "Clients & Sales",
    "where": "Clients & Sales > LC Plume",
    "href": "/agreements",
    "what": "The Suite's own e-signature for agreements and proposals. Write or upload a document, send it for signature, and get back a sealed PDF with a certificate of completion. Every step is recorded.",
    "ai": "No AI",
    "aiNote": "This page does not use AI. Your assistant can tell you who has signed, and it can draft an agreement or proposal for you. The draft waits behind Approve, and the assistant never sends it. You read it and send it yourself.",
    "steps": [
      "Under New, choose Agreement or Proposal. Pick a choice under Start from, add who it is For if you like, and press Create.",
      "Write the document, or press Upload a PDF or Word file. Fill every blank in the Fill in the blanks box.",
      "Under Signers, add each person's full name and email in the order they should sign. Tick I sign too if you sign last.",
      "Add a Sign by date or a Note in the email if you want them, then press Save.",
      "Press Preview and send. Check what each signer will see, then press Looks right, send for signature.",
      "Follow the progress in your list. When everyone has signed, press Download signed PDF."
    ],
    "health": "LC Plume does not change your scores. It helps you keep every agreement and proposal signed, sealed and in one place.",
    "tips": [
      "Have your attorney review any starter template before you use it.",
      "A document cannot be changed once it is sent. Void it, press Make a copy, fix the copy and send that.",
      "Press Save as my template to keep your own wording for next time."
    ],
    "questions": [
      {
        "q": "Why can't I press Preview and send?",
        "a": "A blank is still empty. Fill each one in the Fill in the blanks box. The Preview window also lists anything else to fix, such as a missing signer name or email."
      },
      {
        "q": "A signer gave me the wrong email. What do I do?",
        "a": "Open the agreement. Under Signers, press Send to a different email, type the right address and press Send to this email. The old link stops working."
      },
      {
        "q": "Who does the email come from?",
        "a": "Your own verified sending address, if you have set one up. Until then it comes from the Suite with your business name on it."
      }
    ],
    "related": [
      "contact-record",
      "offers-packages",
      "email-sending-setup",
      "contacts"
    ],
    "who": "Everyone. Team members need the Contacts area.",
    "keywords": [
      "agreement",
      "agreements",
      "contract",
      "proposal",
      "e-signature",
      "esignature",
      "sign",
      "signature",
      "docusign",
      "nda",
      "contractor agreement",
      "coaching agreement",
      "signed pdf",
      "certificate of completion",
      "void",
      "resend",
      "sign now"
    ],
    "sections": [
      {
        "id": "write-or-upload",
        "title": "Write it or upload it",
        "body": "Write in the page, using {{Start date}} style blanks and ## at the start of a line for a heading. Or upload a PDF, and signatures go on a page added at the end. A Word .docx file becomes text you can edit. Files can be up to 15 MB. An older .doc needs saving as .docx or PDF first.",
        "keywords": [
          "upload pdf",
          "upload word",
          "docx",
          "blanks",
          "fill in the blanks",
          "headings",
          "double braces"
        ]
      },
      {
        "id": "templates",
        "title": "Templates",
        "body": "Start from one of four starter templates: coaching agreement, contractor agreement, NDA or proposal. Your own saved wording shows under My templates.",
        "keywords": [
          "template",
          "starter template",
          "my templates",
          "save as my template",
          "coaching agreement",
          "nda"
        ]
      },
      {
        "id": "what-your-signer-does",
        "title": "What your signer does",
        "body": "They get an email with a private link and press Email me a code. They type the 6-digit code from that email. It lasts 15 minutes and allows 5 tries. Then they agree to sign electronically and type or draw their signature, or press Decline to sign and give a reason. If someone declines, you get an email.",
        "keywords": [
          "signer",
          "private link",
          "6-digit code",
          "verification code",
          "type signature",
          "draw signature",
          "decline"
        ]
      },
      {
        "id": "while-it-is-out",
        "title": "While it is out for signature",
        "body": "Signers get a gentle reminder after 3 days, then every 3 days. Remind now sends one straight away. Resend sends a fresh private link and the old one stops working. Void stops every link. If a Sign by date passes, the document expires. Only a draft can be deleted. Sent documents are kept for the record.",
        "keywords": [
          "remind now",
          "reminder",
          "resend",
          "void",
          "expired",
          "sign by date",
          "audit trail",
          "delete an agreement"
        ]
      },
      {
        "id": "needs-your-signature",
        "title": "Needs your signature",
        "body": "When it is your turn, the list shows Needs your signature and a Sign now button. You are already signed in, so there is no email to find.",
        "keywords": [
          "sign now",
          "needs your signature",
          "my turn to sign",
          "i sign too"
        ]
      },
      {
        "id": "signed-copy",
        "title": "The signed copy",
        "body": "When everyone has signed, the sealed PDF is emailed to every signer and to you. It includes a signature page and a certificate of completion. Email signed copy sends it again. If the document is linked to a contact, their timeline notes it and their record lists it with Download signed PDF.",
        "keywords": [
          "signed copy",
          "sealed pdf",
          "certificate of completion",
          "email signed copy",
          "download signed pdf",
          "contact record"
        ]
      },
      {
        "id": "proposals",
        "title": "Proposals",
        "body": "On a proposal you can pick an offer and an amount. The signer sees the amount as Investment.",
        "keywords": [
          "proposal",
          "amount",
          "investment",
          "offer",
          "proposal price"
        ]
      }
    ]
  },
  {
    "id": "prospect-qualifier",
    "name": "Prospect Qualifier",
    "area": "Clients & Sales",
    "where": "Clients & Sales > Prospect Qualifier",
    "href": "/qualifier",
    "what": "Find out whether someone is a good fit before you message them. Score one person's profile, or a whole list, against your Ideal Client Profile. Then send the right people to an Outreach Pipeline.",
    "ai": "AI-powered",
    "aiNote": "Scoring and Draft it for me both use your own AI key. A drafted profile is not saved until you press Save profile. Nobody goes on a pipeline until you press the add button.",
    "steps": [
      "Open the Ideal Client Profiles tab. Fill in who you serve, or press Draft it for me, and read it over.",
      "Reword the levels to fit your market, mark This is my ideal client on one, and press Save profile.",
      "Open Qualify a prospect, pick the profile under Score against, and paste their profile text.",
      "Press Score this prospect. Read the priority, the fit, their level, the gap and the warm DM angle.",
      "Choose a pipeline and press Add to pipeline if you want to reach out."
    ],
    "health": "Scoring prospects does not change your scores or your plans. Draft it for me reads your plans and offers, but it does not change them. This page helps you spend your outreach time on the right people.",
    "tips": [
      "Keep one Ideal Client Profile for each offer, because each has a different ideal client.",
      "For the best read, paste their profile page and their recent posts.",
      "Use a list score to see who to look at first, then do the full score on that person's pipeline card."
    ],
    "questions": [
      {
        "q": "Why do I have to paste the text? Can't I just paste their link?",
        "a": "The Suite cannot open a profile link, because the platforms block it. Open the profile, select everything on the page, copy it and paste it in. It needs a fair amount of text before the button will work."
      },
      {
        "q": "What do the priorities mean?",
        "a": "High: send the warm DM this week. Medium: engage with a few of their posts first, then message later. Low: follow them and watch. Skip: move on to the next profile."
      },
      {
        "q": "Why does it say to connect my AI key?",
        "a": "Scoring runs on your own AI key. Add it under AI Assistant, then try again."
      }
    ],
    "related": [
      "outreach-pipelines",
      "add-people-to-an-outreach-pipeline",
      "offers-packages",
      "scripts-templates"
    ],
    "who": "Everyone with an AI key connected. Team members need the Outreach area.",
    "keywords": [
      "qualifier",
      "prospect qualifier",
      "qualify",
      "ideal client",
      "ideal client profile",
      "icp",
      "score a prospect",
      "score a list",
      "audience qualifier",
      "good fit",
      "fit",
      "priority",
      "warm dm",
      "dm angle",
      "lead scoring"
    ],
    "sections": [
      {
        "id": "ideal-client-profiles",
        "title": "Ideal Client Profiles",
        "body": "Every score is measured against one of these. You describe who you serve, the problem you solve, what your ideal client has and is missing, and your red flags. Then you reword the four levels and mark one as your ideal client. You can tie a profile to an offer, and empty answers start from what that offer says.",
        "keywords": [
          "ideal client profile",
          "icp",
          "levels",
          "red flags",
          "draft it for me",
          "new profile"
        ]
      },
      {
        "id": "qualify-a-prospect",
        "title": "Qualify a prospect",
        "body": "Paste one person's profile text to get a fit of yes, borderline or no, their level, the gap, a warm DM angle and a priority of High, Medium, Low or Skip, with what to do next. Past scores sit under Recently scored.",
        "keywords": [
          "qualify a prospect",
          "score this prospect",
          "recently scored",
          "fit",
          "gap",
          "dm angle"
        ]
      },
      {
        "id": "audience-qualifier",
        "title": "Audience Qualifier",
        "body": "Score a whole list from a spreadsheet (.xlsx or .csv) or pasted cells. The first row must be your column headings. The score uses only what the list holds, such as title, headline and company, because it cannot see their posts. Up to 1,000 people are scored per list. Keep the page open while it runs.",
        "keywords": [
          "audience qualifier",
          "score a whole list",
          "spreadsheet",
          "csv",
          "excel",
          "bulk",
          "template"
        ]
      },
      {
        "id": "adding-a-scored-list",
        "title": "Adding a scored list to a pipeline",
        "body": "Open a list under Your scored lists. Everyone scored High who is not already on a pipeline starts ticked. Change the ticks, choose a pipeline and press the Add selected to pipeline button. It warns you who is already on a pipeline, and nobody goes on the same pipeline twice. High priority starts in To reach out, and Medium and Low start in Nurture. If your pipeline does not have that stage, they go to its first open stage.",
        "keywords": [
          "your scored lists",
          "add selected to pipeline",
          "already on a pipeline",
          "duplicates",
          "which stage"
        ]
      },
      {
        "id": "qualifier-on-a-pipeline-card",
        "title": "On a pipeline card",
        "body": "Open any card on an Outreach Pipeline and use its Prospect Qualifier section. The score stays on the card, and you can press Score again later.",
        "keywords": [
          "pipeline card",
          "score on a card",
          "score again",
          "outreach pipeline card"
        ]
      }
    ]
  },
  {
    "id": "tag-library",
    "name": "Tag Library",
    "area": "Clients & Sales",
    "where": "Clients & Sales > Tag Library",
    "href": "/tags",
    "what": "Every tag in your account on one page. You can see how many people carry each one, what adds it, and your own note on what it means. You can also rename or retire a tag.",
    "ai": "No AI",
    "aiNote": "This page does not use AI. Your assistant can add a tag to contacts or take one off, and that waits behind Approve.",
    "steps": [
      "Open Tag Library. Tags are grouped by family, so tags that share a first word sit together.",
      "Search by tag, note or where it comes from, or press Most people first to sort by size.",
      "Press the number under People to see those contacts in Contacts.",
      "Type in Your note to record what a tag means. It saves when you click away or press Enter.",
      "Press Rename to change a tag on everyone who has it, or Retire to take it off everyone."
    ],
    "health": "Tags do not change your scores. They help you keep your contacts organized, so your broadcasts and campaigns reach the right people.",
    "tips": [
      "Rename changes the tag on your contacts only. If a form, calendar or pipeline adds the old name, change it there too, or the old tag will come back.",
      "Retire never removes anyone from Contacts. The page warns you when something still adds that tag, so it can come back."
    ],
    "questions": [
      {
        "q": "Why does a tag say Added by hand?",
        "a": "Nothing in the Suite adds that tag by itself. Someone typed it on a contact."
      },
      {
        "q": "How do I add a new tag?",
        "a": "Add it on a contact, or use it on a form, calendar or pipeline. It shows here as soon as it is used."
      },
      {
        "q": "Why is my tag list empty?",
        "a": "No contact, form, calendar or pipeline has used a tag yet."
      }
    ],
    "related": [
      "contacts",
      "forms",
      "contact-record",
      "import-contacts"
    ],
    "who": "Everyone. Team members need the Contacts area.",
    "keywords": [
      "tags",
      "tag library",
      "all tags",
      "tag list",
      "rename tag",
      "retire tag",
      "remove tag",
      "delete tag",
      "what does this tag mean",
      "who has this tag",
      "labels"
    ],
    "sections": [
      {
        "id": "what-adds-it",
        "title": "What adds it",
        "body": "This column shows where a tag comes from, such as a form, a calendar, a pipeline stage, a broadcast, an invite list or the Suite itself.",
        "keywords": [
          "what adds it",
          "where a tag comes from",
          "automatic tag",
          "added by hand"
        ]
      },
      {
        "id": "rename-and-retire",
        "title": "Rename and Retire",
        "body": "Rename moves a tag to a new name on every contact who has it, and your note moves with it. Retire takes a tag off everyone after you press Yes, retire it. Nobody is removed from Contacts.",
        "keywords": [
          "rename",
          "retire",
          "yes retire it",
          "change a tag name",
          "take a tag off everyone"
        ]
      }
    ]
  },
  {
    "id": "affiliates",
    "name": "Affiliates",
    "area": "Clients & Sales",
    "where": "Clients & Sales > Affiliates",
    "href": "/affiliates",
    "what": "Run your own affiliate program. Recruit partners, give each one tracked links, set commissions by product, record sales and show each affiliate a private report. You can also keep the programs you promote in one place.",
    "ai": "Has an AI button",
    "aiNote": "Most of this page does not use AI. On the Recruiting tab, each card has a Prospect Qualifier section whose Score this prospect button uses your own AI key.",
    "steps": [
      "On Commission rates, set the % for each offer, or add one of your own programs or offerings.",
      "On My affiliates, press Add an affiliate. Fill in their name and link code, then press Add affiliate. You can also drag someone to Active affiliate on Recruiting.",
      "Press their name to open their page. Under Product links, add a link for each product you want them to share.",
      "Copy their link and their private dashboard link, and send both to them.",
      "Under Sales & commissions, check each sale. Press Add sale for anything sold elsewhere.",
      "When you pay a commission, set that sale's status to Paid."
    ],
    "health": "How many affiliates you have and how many people they refer both feed your Referral Process pillar. That pillar counts toward your Operations dimension.",
    "tips": [
      "Set a number of days under Pay commission this many days after the payment, so a refund window passes before you pay.",
      "Every product link lasts 365 days. You and the affiliate get an email before it ends, and Renew 365 days adds another year.",
      "Sales and commissions on this page are tracked in US dollars."
    ],
    "questions": [
      {
        "q": "Why does a sale say Needs a %?",
        "a": "That sale has no commission rate yet. Type the % on the sale, or set a rate for that offer on Commission rates. Once it has a rate it moves to Owed."
      },
      {
        "q": "What happens if a customer gets a refund?",
        "a": "A full refund before the payable date, on a sale you have not paid, marks the sale Void by itself. Any other refund is never changed for you. The sale shows Refund to review, and you press Done once you have decided."
      },
      {
        "q": "Does an affiliate need a login to see their report?",
        "a": "No. Their private dashboard link opens with no login. Press New link on their page if it ever needs changing, and the old one stops working."
      }
    ],
    "related": [
      "offers-packages",
      "payment-links-on-offers",
      "your-own-lifecharter-affiliate-links",
      "contacts",
      "lc-plume"
    ],
    "who": "Everyone. Team members need the Contacts area. The Recruiting tab also needs the Outreach area.",
    "keywords": [
      "affiliate",
      "affiliates",
      "affiliate program",
      "referral",
      "referral link",
      "partner",
      "commission",
      "commissions",
      "payout",
      "tracked link",
      "monthly report",
      "amazon associates",
      "recruit affiliates"
    ],
    "sections": [
      {
        "id": "recruiting",
        "title": "Recruiting",
        "body": "A board for people you would like as affiliates. Move someone to Active affiliate and they are added to My affiliates with their own link.",
        "keywords": [
          "recruiting",
          "recruit",
          "active affiliate",
          "new recruiting board"
        ]
      },
      {
        "id": "my-affiliates",
        "title": "My affiliates",
        "body": "Shows your totals and a line for each affiliate: their links, clicks, people referred, sales, owed and paid. A note beside a name tells you when a sale or refund needs your review. Remove affiliate stops their link and deletes their history, so set their Status to Paused under Details if you want to keep it.",
        "keywords": [
          "my affiliates",
          "add an affiliate",
          "clicks",
          "referred",
          "owed",
          "paid",
          "remove affiliate"
        ]
      },
      {
        "id": "commission-rates",
        "title": "Commission rates",
        "body": "Set the % an affiliate earns on each offer. You can set a different % for one affiliate on their page. A program you add here is yours alone, and it also shows in Offers & Packages.",
        "keywords": [
          "commission rates",
          "commission by product",
          "add a program",
          "percent",
          "different rate for one affiliate"
        ]
      },
      {
        "id": "product-links",
        "title": "Product links",
        "body": "Give an affiliate one tracked link per product, each with its own code and landing page. A visitor is remembered for 365 days, and sign-ups and bookings from your Suite forms and calendars are credited to the affiliate.",
        "keywords": [
          "product links",
          "tracked link",
          "365 days",
          "renew",
          "landing page",
          "implementation fee"
        ]
      },
      {
        "id": "affiliate-dashboard",
        "title": "The affiliate's private dashboard",
        "body": "A no-login page you send to each affiliate. It shows their monthly report, and they can download it as a spreadsheet. You see the same report on their page under Monthly report.",
        "keywords": [
          "affiliate dashboard",
          "private dashboard",
          "monthly report",
          "spreadsheet download",
          "no login"
        ]
      },
      {
        "id": "sales-and-commissions",
        "title": "Sales & commissions",
        "body": "Each affiliate's page lists their sales, with the amount, the %, the commission, the payable date and the status. Mark a sale Paid and the commission goes into Finance as an Affiliate Commissions expense.",
        "keywords": [
          "sales and commissions",
          "add sale",
          "mark paid",
          "owed",
          "void",
          "affiliate commissions expense",
          "finance"
        ]
      },
      {
        "id": "credit-from-your-stripe-sales",
        "title": "Credit from your own Stripe sales",
        "body": "When someone buys through your connected Stripe and is already in your Contacts, matched by email, the sale is credited to the affiliate who referred them. Each charge counts once. A sale with no commission rate waits as Needs a %.",
        "keywords": [
          "stripe",
          "automatic credit",
          "auto",
          "matched by email",
          "needs a %",
          "review"
        ]
      },
      {
        "id": "programs-i-promote",
        "title": "Programs I promote",
        "body": "Keep the affiliate programs you belong to in one place, with your links, codes, terms and earnings. Earnings you mark Paid are added to Finance as income.",
        "keywords": [
          "programs i promote",
          "my affiliate links",
          "amazon",
          "affiliate income",
          "earnings"
        ]
      }
    ]
  },
  {
    "id": "add-people-to-an-outreach-pipeline",
    "name": "Add people to an Outreach Pipeline",
    "area": "Clients & Sales",
    "where": "Clients & Sales > Outreach Pipelines > Add people faster",
    "href": "/dm-pipeline",
    "what": "Quick ways to get people onto a pipeline without adding them one by one. Paste a list, upload a spreadsheet, click a browser button on a profile, or pull in LinkedIn connection requests from your inbox.",
    "ai": "No AI",
    "aiNote": "Adding people does not use AI. Your assistant can put people on a pipeline for you, and that waits behind Approve. Once someone is on a card, its Prospect Qualifier section can score them with your own AI key.",
    "steps": [
      "Open Outreach Pipelines and choose the pipeline you want at the top.",
      "Press Add people faster.",
      "To paste, type or paste one person per line under Paste a list, choose They are on, and press Add to my pipeline.",
      "To upload, choose your .csv under Upload a list, check how many people were found, and press the Add button.",
      "Read the note under the box. It tells you who was added and who was skipped."
    ],
    "health": "Cards on a pipeline do not change your scores. This helps you keep your outreach moving.",
    "tips": [
      "Facebook, LinkedIn and Instagram do not let anyone export a group or follower list, so build your list from what you can see.",
      "Not sure about a list? Score it first in the Audience Qualifier. The same spreadsheet template works there.",
      "Use Download the do-not-email list before you load a list into another email tool."
    ],
    "questions": [
      {
        "q": "Will I get the same person twice?",
        "a": "Anyone already on that pipeline is skipped. For a paste, that means the same profile link, or the same name on the same platform. For an upload, it means the same email or profile link. Adding one person at a time also refuses a repeat."
      },
      {
        "q": "Do people I upload get my marketing emails?",
        "a": "No. An upload does not add anyone to your marketing contacts. Anyone unsubscribed or marked Do Not Contact is left out. Someone already in Contacts is linked to their card."
      },
      {
        "q": "Why can't I switch on LinkedIn requests from my inbox?",
        "a": "It reads a connected Microsoft 365 inbox. A Gmail connection can send but not read. Connect Microsoft 365 in Settings > Integrations first."
      }
    ],
    "related": [
      "outreach-pipelines",
      "prospect-qualifier",
      "cold-email-stages-and-updates",
      "import-contacts",
      "contacts"
    ],
    "who": "Everyone. Team members need the Outreach area.",
    "keywords": [
      "add people",
      "add people faster",
      "paste a list",
      "upload a list",
      "csv",
      "spreadsheet",
      "bulk add",
      "import to pipeline",
      "facebook group",
      "group members",
      "linkedin requests",
      "connection requests",
      "bookmark",
      "browser button",
      "do not email list",
      "template"
    ],
    "sections": [
      {
        "id": "paste-a-list",
        "title": "Paste a list",
        "body": "One person per line: their name, then their profile link and a line about them if you have them. Spreadsheet cells, commas, pipes and tabs all read. Up to 100 at a time. They land in the first stage. Download the spreadsheet template (.csv) gives you the columns: Name, Profile link, Headline and Group.",
        "keywords": [
          "paste a list",
          "one per line",
          "up to 100",
          "spreadsheet template",
          "they are on"
        ]
      },
      {
        "id": "upload-a-list",
        "title": "Upload a list (.csv)",
        "body": "A spreadsheet with a header row: First name, Last name, Email, Company, Title, Location, Profile link. A name plus an email or profile link is enough. Up to 2,000 people in a file under 4 MB. You see how many were found before you add them, and each person becomes a card in the first stage.",
        "keywords": [
          "upload a list",
          "csv",
          "email list",
          "2,000",
          "reached by",
          "download the template"
        ]
      },
      {
        "id": "add-to-my-pipeline-button",
        "title": "The + Add to my pipeline browser button",
        "body": "Drag this button to your bookmarks bar. Click it on a LinkedIn, Instagram or Facebook profile, and the Add card window opens with their name and profile link filled in. You click it yourself, so nothing runs in the background.",
        "keywords": [
          "bookmark",
          "browser button",
          "bookmarks bar",
          "add to my pipeline",
          "linkedin profile",
          "copy the button code"
        ]
      },
      {
        "id": "linkedin-connection-requests",
        "title": "LinkedIn connection requests, from your inbox",
        "body": "Tick Add LinkedIn connection requests from my inbox. Each new request becomes a card in To reach out, with their profile link and a reminder for today. It is checked about every 15 minutes. The Suite reads only LinkedIn's invitation emails and never touches your LinkedIn.",
        "keywords": [
          "linkedin",
          "connection requests",
          "microsoft 365",
          "inbox",
          "every 15 minutes"
        ]
      }
    ]
  },
  {
    "id": "cold-email-stages-and-updates",
    "name": "Cold email stages and updates",
    "area": "Clients & Sales",
    "where": "Clients & Sales > Outreach Pipelines > New pipeline, and Add people faster > Update from your cold-email tool",
    "href": "/dm-pipeline",
    "what": "A ready-made pipeline for cold email, and a quick way to keep it up to date. Send from your own Google mailboxes with the Cold email sender, or from your own cold-email tool and paste the addresses here.",
    "ai": "No AI",
    "aiNote": "This does not use AI. Your assistant can create a pipeline or move people on one, and that waits behind Approve.",
    "steps": [
      "On Outreach Pipelines, press New pipeline. Give it a name, choose Cold email stages, and press Create pipeline.",
      "Open Add people faster and add your list under Upload a list.",
      "Send your emails from your own cold-email tool.",
      "Back in Add people faster, find Update from your cold-email tool. Paste the addresses, one per line or as a column from a spreadsheet.",
      "Under What happened, choose what happened to those people, and press Update their cards."
    ],
    "health": "Cards on a pipeline do not change your scores. This helps you see where every cold email conversation stands.",
    "tips": [
      "Stages that are only waiting make no follow-up tasks, so a big upload does not flood your Tasks. A reply makes one.",
      "Choose Asked to stop as soon as someone asks, so the Suite never emails them either.",
      "One update covers every pipeline a person is on, so paste each address once.",
      "Send from a separate domain, not your main one. It protects your everyday email."
    ],
    "questions": [
      {
        "q": "Why did a card not move?",
        "a": "Cards only move forward, so someone already further along stays where they are. The note after you update tells you how many were already further along and how many addresses are not on any pipeline."
      },
      {
        "q": "What does Asked to stop do?",
        "a": "It moves their card to the stop stage and marks them Do Not Contact in Contacts, even if they had no card. They are unsubscribed, tagged, and taken out of your email campaigns."
      },
      {
        "q": "Is Bounced the same as Asked to stop?",
        "a": "No. Bounced moves the card to the same stage, but it does not mark the person Do Not Contact."
      }
    ],
    "related": [
      "outreach-pipelines",
      "add-people-to-an-outreach-pipeline",
      "contacts",
      "tasks"
    ],
    "who": "Everyone. Team members need the Outreach area.",
    "keywords": [
      "cold email",
      "cold outreach",
      "cold email pipeline",
      "cold email stages",
      "update cards",
      "email 1 sent",
      "replied",
      "bounced",
      "asked to stop",
      "unsubscribe",
      "do not contact",
      "instantly",
      "smartlead"
    ],
    "sections": [
      {
        "id": "cold-email-stages",
        "title": "Cold email stages",
        "body": "The pipeline starts with these stages: To email, Email 1 sent, Emails 2 and 3 sent (no reply yet), Replied, Invited, Registered, Attended, No-show, Consultation booked, Client, Nurture, Asked to stop or bounced, and Do not contact - private contact.",
        "keywords": [
          "cold email stages",
          "to email",
          "email 1 sent",
          "emails 2 and 3 sent",
          "consultation booked",
          "new pipeline template"
        ]
      },
      {
        "id": "update-from-your-cold-email-tool",
        "title": "Update from your cold-email tool",
        "body": "Paste addresses and choose Email 1 sent, Emails 2 and 3 sent, They replied, Asked to stop or Bounced (bad address). Their cards move on every pipeline they are on.",
        "keywords": [
          "update from your cold-email tool",
          "what happened",
          "update their cards",
          "they replied",
          "paste addresses"
        ]
      },
      {
        "id": "cold-email-sender",
        "title": "Cold email sender",
        "body": "On a Cold email pipeline, open Cold email sender, add a connected Google mailbox, write your own emails, add your business name and postal address, and save. It stays off until everything in [brackets] is filled in. Each mailbox starts at 5 a day and grows to its cap, on weekdays inside your send window. Replies go to your own inbox. Connect Microsoft 365 and replies and stop requests are picked up on their own. Without it, paste them under Update from your cold-email tool.",
        "keywords": [
          "cold email sender",
          "send cold email",
          "gmail",
          "mailbox",
          "warm up",
          "footer"
        ]
      }
    ]
  },
  {
    "id": "contact-record",
    "name": "Contact record",
    "area": "Clients & Sales",
    "where": "Clients & Sales > Contacts, then click any contact",
    "href": "/contacts",
    "what": "Everything about one person, on one page. Their details, tags, pipelines, purchases, agreements, emails, notes and a timeline of every touch.",
    "ai": "Has an AI button",
    "aiNote": "Draft the email with AI, under Schedule a follow-up, uses your own AI key. Nothing goes out until you press Send in Daily Compass. The rest of the record does not use AI.",
    "steps": [
      "Open Contacts and click a person's name.",
      "Press Edit to change their details, then press Save changes.",
      "Under Tags, type to add a tag, press the x to remove one, or click a tag to see everyone who has it.",
      "Type under Add a note and press Save note.",
      "Under Schedule a follow-up, pick the day, say what it is about, and press Schedule follow-up."
    ],
    "health": "Each new contact added in the last 30 days counts toward your Customer Acquisition pillar. Editing a record or adding a note does not change your scores. The record helps you remember every person and every conversation.",
    "tips": [
      "Use + Add under Calls attended or Purchases to log something the Suite didn't see, such as a sale made elsewhere.",
      "Fields you add under Add or remove fields appear on every contact in your account.",
      "Removing a custom field deletes what was filled in for it on every contact."
    ],
    "questions": [
      {
        "q": "Where does a scheduled follow-up go?",
        "a": "It becomes a task. If you added a draft, it waits in Daily Compass on that day, and nothing is sent until you press Send."
      },
      {
        "q": "Why can't I see my emails with this person?",
        "a": "Your emails show once you connect your mailbox in Settings > Integrations. Only the account owner sees mail from connected mailboxes."
      },
      {
        "q": "How do I add someone to an email campaign?",
        "a": "Under Email campaigns, choose Add to a campaign, then press Add. This does not show for someone who has unsubscribed."
      }
    ],
    "related": [
      "contacts",
      "tag-library",
      "tasks",
      "lc-plume",
      "outreach-pipelines",
      "pipeline"
    ],
    "who": "Everyone. Team members need the Contacts area. Some parts, such as Emails and Payments & invoices, show only to the people who can see them.",
    "keywords": [
      "contact record",
      "contact page",
      "client record",
      "edit contact",
      "contact details",
      "address",
      "birthday",
      "socials",
      "notes",
      "timeline",
      "tag history",
      "custom fields",
      "relationship",
      "purchases",
      "follow up",
      "history with a client"
    ],
    "sections": [
      {
        "id": "details-and-socials",
        "title": "Details and socials",
        "body": "Name, email, phone, company, title, website, address and birthday, plus Instagram, Facebook, LinkedIn and YouTube. Each social opens in one click.",
        "keywords": [
          "details",
          "phone",
          "address",
          "birthday",
          "instagram",
          "facebook",
          "linkedin",
          "youtube"
        ]
      },
      {
        "id": "relationship",
        "title": "Relationship",
        "body": "Mark who this person is to you, using the choices in Edit or your own, such as Mentor. A person can have more than one.",
        "keywords": [
          "relationship",
          "client",
          "partner",
          "coach",
          "affiliate",
          "add your own"
        ]
      },
      {
        "id": "custom-fields",
        "title": "Custom fields",
        "body": "Press Edit, then Add or remove fields to make your own, such as Referred by. A field can be short text, long text, a number, a date, a link or a choice list.",
        "keywords": [
          "custom fields",
          "add or remove fields",
          "referred by",
          "choice list"
        ]
      },
      {
        "id": "calls-attended-and-purchases",
        "title": "Calls attended and Purchases",
        "body": "Calls attended lists the calls this person came to, and Purchases lists what they bought. Press + Add to log one by hand.",
        "keywords": [
          "calls attended",
          "purchases",
          "what they bought",
          "log a call",
          "log a purchase"
        ]
      },
      {
        "id": "agreements-on-the-record",
        "title": "Agreements",
        "body": "Shows their LC Plume agreements and where each one stands. A finished one has Download signed PDF.",
        "keywords": [
          "agreements",
          "lc plume",
          "signed pdf",
          "out for signature"
        ]
      },
      {
        "id": "pipelines-on-the-record",
        "title": "Pipelines",
        "body": "Shows each Outreach Pipeline they are on, their stage and their next follow-up date.",
        "keywords": [
          "pipelines",
          "outreach pipeline",
          "stage",
          "follow up date"
        ]
      },
      {
        "id": "tags-and-tag-history",
        "title": "Tags and Tag history",
        "body": "Tags show as buttons you can add, remove or click. Tag history lists each tag added or removed, when, and where it came from.",
        "keywords": [
          "tags",
          "tag history",
          "add a tag",
          "remove a tag"
        ]
      },
      {
        "id": "email-campaigns-on-the-record",
        "title": "Email campaigns",
        "body": "Shows the campaigns this person is in, their status and how many emails they have been sent.",
        "keywords": [
          "email campaigns",
          "sequence",
          "add to a campaign"
        ]
      },
      {
        "id": "schedule-a-follow-up",
        "title": "Schedule a follow-up",
        "body": "Pick a day and say what it is about. Draft the email with AI writes a draft you can edit, or you can write your own. Then press Schedule follow-up.",
        "keywords": [
          "schedule a follow-up",
          "follow up",
          "draft the email with ai",
          "reminder to follow up"
        ]
      },
      {
        "id": "payments-and-portal",
        "title": "Payments & invoices and Client portal",
        "body": "Payments & invoices lists what this person has paid and been invoiced. Client portal opens their private page for sessions, homework, files, notes and messages.",
        "keywords": [
          "payments",
          "invoices",
          "client portal",
          "portal"
        ]
      },
      {
        "id": "emails-on-the-record",
        "title": "Emails",
        "body": "Shows emails with this person from your connected mailbox, plus emails the Suite sent them. Press Refresh emails to check again.",
        "keywords": [
          "emails",
          "email history",
          "refresh emails",
          "connected mailbox"
        ]
      },
      {
        "id": "timeline",
        "title": "Timeline",
        "body": "A running list of every touch with this person, with the date and time, including your notes.",
        "keywords": [
          "timeline",
          "activity",
          "history",
          "notes",
          "every touch"
        ]
      }
    ]
  },
  {
    "id": "your-own-lifecharter-affiliate-links",
    "name": "Your own LifeCharter affiliate links",
    "area": "Clients & Sales",
    "where": "Clients & Sales > Affiliates > My partnerships",
    "href": "/affiliates",
    "what": "Your account comes with your own affiliate links for LifeCharter products. Copy any of them, share them, and see your month-by-month report here.",
    "ai": "No AI",
    "aiNote": "This tab does not use AI.",
    "steps": [
      "Open Affiliates and press the My partnerships tab.",
      "Find your LifeCharter product links.",
      "Press Copy link beside the one you want, and share it.",
      "Check your report at the bottom of the tab for your numbers, month by month.",
      "To keep other programs here too, press Add one under Your own additional links."
    ],
    "health": "This does not change your scores. These links sit with LifeCharter, so they do not count as affiliates in your own program. They help you share what you already use.",
    "tips": [
      "A sale through your link is credited to you.",
      "Each link shows the date it runs until. Paused beside a link means it is not active right now."
    ],
    "questions": [
      {
        "q": "Why don't I see the My partnerships tab?",
        "a": "It shows only when your login email is set up as an affiliate. If you expected to see it, ask LifeCharter support."
      },
      {
        "q": "Is this the same as running my own affiliates?",
        "a": "No. This tab is for links you share as someone else's affiliate. The other tabs on the page are for your own program and the people who promote you."
      },
      {
        "q": "Where do my additional links show?",
        "a": "They are yours alone, and they also show on Programs I promote."
      }
    ],
    "related": [
      "affiliates"
    ],
    "who": "Clients whose login email is set up as an affiliate. This tab belongs to the person signed in, not their team.",
    "keywords": [
      "my partnerships",
      "my affiliate link",
      "my links",
      "lifecharter affiliate",
      "refer lifecharter",
      "share lifecharter",
      "referral link",
      "partner link",
      "my commission report"
    ]
  },
  {
    "id": "finance-center",
    "name": "Finance Center",
    "area": "Money",
    "where": "Money > Finance",
    "href": "/finance",
    "what": "The front door to your money. See your financial health number and this month's income, expenses and net, then open any Finance page from its card. Each card shows a live line from your own records.",
    "ai": "No AI",
    "aiNote": "This page does not use AI. The AI buttons are on the pages it opens. In chat, your assistant can record an income or expense entry, and that waits behind Approve.",
    "steps": [
      "Open Finance from the left menu.",
      "Read the four tiles at the top: Financial health, Income (MTD), Expenses (MTD) and Net (MTD).",
      "Scan the live line on each card, such as bills due or budget left after bills.",
      "Press a card to open that page."
    ],
    "health": "The Financial health number here is its own number, built from your profit margin this year and your expense budget. It is not one of your 12 dimensions. The income and expenses behind it do feed your Finance dimension.",
    "tips": [
      "A live line turns red-brown when something needs a look, such as overdue bills or being over budget.",
      "Financial health stays blank until you have at least one entry this year."
    ],
    "questions": [
      {
        "q": "What do MTD and YTD mean?",
        "a": "MTD is month to date, so this month so far. YTD is year to date, so this year so far."
      },
      {
        "q": "Why do I see a Sales tax card and someone else does not?",
        "a": "That card only shows for accounts registered for GST/HST, QST or PST."
      },
      {
        "q": "Do I have to enter the same thing on each page?",
        "a": "No. Everything you record goes into one set of records, and every Finance page reads from it."
      }
    ],
    "related": [
      "income",
      "expenses",
      "cash-flow-dashboard",
      "bills-cash-calendar",
      "budget-planner",
      "profit-loss",
      "tax-preparation",
      "tech-stack-optimizer"
    ],
    "who": "Everyone. Team members need the Finance area. The Bookkeeper preset sees Finance only.",
    "keywords": [
      "finance",
      "finance center",
      "money",
      "my numbers",
      "financial health",
      "health score",
      "income this month",
      "expenses this month",
      "net",
      "mtd",
      "ytd",
      "money overview"
    ],
    "sections": [
      {
        "id": "finance-connections",
        "title": "How the Finance pages connect",
        "body": "One set of records feeds every card. Each detail page has a Connected to strip showing what the related pages say right now, and each item is a link. Add forms suggest the categories you already use, so Software and software do not split your reports.",
        "keywords": [
          "connected to",
          "strip",
          "linked pages",
          "one ledger",
          "categories",
          "live numbers"
        ]
      },
      {
        "id": "more-than-one-business",
        "title": "If you have more than one business",
        "body": "Money added while a business is chosen in the switcher belongs to that business. Income, Expenses, Bills, Profit & Loss and the Financial Pulse then show that business, and All businesses adds them together. Budgets and income goals cover the whole account. If some money has no business yet, a banner offers to assign it in one click.",
        "keywords": [
          "business switcher",
          "all businesses",
          "assign",
          "unassigned money",
          "two businesses",
          "banner"
        ]
      },
      {
        "id": "two-currencies",
        "title": "US and Canadian dollars",
        "body": "Totals use your account's main currency. Money in the other currency shows as its own small note and is never added into the same number.",
        "keywords": [
          "usd",
          "cad",
          "currency",
          "canadian dollars",
          "kept separate"
        ]
      }
    ]
  },
  {
    "id": "income",
    "name": "Income",
    "area": "Money",
    "where": "Money > Finance > Income Tracker",
    "href": "/finance/income",
    "what": "Log money coming in, with who paid you and where it came from. See your total for the month and the year, plus lists by source and by who paid you.",
    "ai": "Has an AI button",
    "aiNote": "Read my income & spending has your assistant look at where your money comes from, where it goes and what to change. It uses your own AI key, and the read is saved to your account. Your assistant can also record income in chat, and that waits behind Approve.",
    "steps": [
      "On the Finance Center, press Income Tracker.",
      "Press Add income.",
      "Fill in Amount, Source / category and Date. Leave Date blank to use today.",
      "Add From (client or source) and a Note if you like. If you have business segments, you can choose one.",
      "Press Add. It appears under Recent income."
    ],
    "health": "Income you record this month feeds your Finance dimension, measured against your monthly income goal. Income tagged to a business segment also counts toward that segment's own score.",
    "tips": [
      "Pick from the suggested categories so one source does not split into two spellings.",
      "Fill in From each time. That builds your By who paid you list.",
      "Delete happens right away with no second check. To fix an entry, use the pencil instead."
    ],
    "questions": [
      {
        "q": "Do I need to enter Stripe payments by hand?",
        "a": "Payments made through a payment link on your connected Stripe add income to your Finance records for you. Check Recent income before adding one yourself, so it is not counted twice."
      },
      {
        "q": "Can I edit an income entry?",
        "a": "Yes. Press the pencil on the entry, change the amount, category, date, From or note, and press Save changes. Money that came from Stripe keeps its amount and date."
      },
      {
        "q": "What does toward target mean?",
        "a": "It shows your monthly income goal under This month. You set that goal in the Budget Planner."
      }
    ],
    "related": [
      "expenses",
      "cash-flow-dashboard",
      "budget-planner",
      "import-transactions",
      "revenue-by-segment",
      "connect-stripe",
      "quick-capture"
    ],
    "who": "Everyone. Team members need the Finance area.",
    "keywords": [
      "income",
      "income tracker",
      "add income",
      "log income",
      "money in",
      "revenue",
      "sales",
      "who paid me",
      "by source",
      "record a payment",
      "client payment"
    ],
    "sections": [
      {
        "id": "by-source-by-who-paid",
        "title": "By source and By who paid you",
        "body": "By source adds up your income by category. By who paid you adds it up by the name in From. Each currency stays on its own.",
        "keywords": [
          "by source",
          "by who paid you",
          "top clients",
          "income by client"
        ]
      },
      {
        "id": "sales-tax-on-income",
        "title": "Sales tax on income",
        "body": "If your account is registered for GST/HST, QST or PST, the add form also has boxes for the tax you charged and where the customer is. That tax is kept apart from the amount.",
        "keywords": [
          "gst",
          "hst",
          "pst",
          "qst",
          "tax charged",
          "customer province"
        ]
      }
    ]
  },
  {
    "id": "expenses",
    "name": "Expenses",
    "area": "Money",
    "where": "Money > Finance > Expense Manager",
    "href": "/finance/expenses",
    "what": "Log money going out, with who you paid and whether it repeats. Compare each category with its budget and keep a receipt photo with the expense.",
    "ai": "Has an AI button",
    "aiNote": "Read my income & spending has your assistant look at your spending and suggest what to change, on your own AI key. Snap a receipt also uses AI to read a photo. Your assistant can record an expense in chat, and that waits behind Approve.",
    "steps": [
      "On the Finance Center, press Expense Manager.",
      "Press Add expense, or press Snap a receipt to start from a photo.",
      "Fill in Amount, Category and Date. Leave Date blank to use today.",
      "Add Paid to, then choose One-time or Recurring.",
      "For Recurring, choose How often and Auto-renews or I renew it manually.",
      "Press Add. It appears under Recent expenses."
    ],
    "health": "Expenses you record this month feed your Finance dimension, through your profit margin. Expenses tagged to a business segment also count toward that segment's own score.",
    "tips": [
      "Always choose a category. Uncategorized expenses trigger a warning on Tax Preparation and in your bell.",
      "Press the pencil on an expense to change its amount, category, date, Paid to or note. Its receipt photo stays with it.",
      "A document icon on an expense opens its receipt photo."
    ],
    "questions": [
      {
        "q": "What happens when I choose Recurring?",
        "a": "Today's payment is saved as an expense, and the next renewal goes onto your Bills & Cash Calendar. You do not need to add it there too."
      },
      {
        "q": "Why did it ask to link my expense to a bill?",
        "a": "The expense looks like a bill you track, by name, amount and date. Press Yes, link them so it is not counted twice. The bill then moves to its next due date."
      },
      {
        "q": "If I delete a recurring expense, does the bill go too?",
        "a": "No. Delete only removes that expense. To stop the bill, use the trash icon on Bills & Cash Calendar."
      }
    ],
    "related": [
      "snap-a-receipt",
      "bills-cash-calendar",
      "budget-planner",
      "tech-stack-optimizer",
      "tax-preparation",
      "import-transactions",
      "quick-capture"
    ],
    "who": "Everyone. Team members need the Finance area.",
    "keywords": [
      "expenses",
      "expense manager",
      "add expense",
      "log expense",
      "spending",
      "money out",
      "paid to",
      "vendor",
      "recurring",
      "subscription",
      "uncategorized",
      "category budget",
      "auto-renews"
    ],
    "sections": [
      {
        "id": "category-vs-budget",
        "title": "By category vs budget",
        "body": "Once you set category budgets, each category shows what you spent this month against its budget, with a bar that turns red-brown when you go over.",
        "keywords": [
          "category budget",
          "over budget",
          "spend vs budget"
        ]
      },
      {
        "id": "link-to-a-bill",
        "title": "Linking an expense to a bill",
        "body": "After you save a one-time expense that matches an upcoming bill, a box offers to link them. Nothing new is recorded, and the bill rolls to its next date.",
        "keywords": [
          "link bill",
          "yes, link them",
          "double count",
          "counted twice"
        ]
      }
    ]
  },
  {
    "id": "snap-a-receipt",
    "name": "Snap a receipt",
    "area": "Money",
    "where": "Money > Finance > Expense Manager, the Snap a receipt button",
    "href": "/finance/expenses",
    "what": "Take a photo of a receipt, or upload one, and your assistant fills in the expense for you. You check it and press Add. The photo stays with the expense.",
    "ai": "AI-powered",
    "aiNote": "Your assistant reads the photo using your own AI key. It fills in the details as a draft, and nothing is saved until you check it and press Add. Add your AI key in Settings > AI first. A team member's receipts run on the account's key and count toward any AI limit the owner sets.",
    "steps": [
      "On the Finance Center, press Expense Manager.",
      "Press Snap a receipt, then take a photo or choose one.",
      "Wait while it says Reading your receipt.",
      "Check the form that opens: Amount, Category, Date, Note and Paid to.",
      "Press Add."
    ],
    "health": "Reading a receipt changes nothing. Once you press Add, the expense feeds your Finance dimension like any other expense.",
    "tips": [
      "Lay the receipt flat in good light. If parts are hard to read, the form asks you to check every field.",
      "It suggests from the categories you already use, so your reports stay tidy.",
      "A subscription receipt starts as One-time. Switch to Recurring before you press Add."
    ],
    "questions": [
      {
        "q": "What kind of file works?",
        "a": "A photo in JPG, PNG or WebP, up to 8 MB. A normal iPhone camera photo works. A PDF will not."
      },
      {
        "q": "Where is the photo kept?",
        "a": "With the expense. Press the document icon on it to open a private link, which lasts a few minutes."
      },
      {
        "q": "What if I close the form without pressing Add?",
        "a": "No expense is saved, and the photo is not linked to anything. Snap it again when you are ready."
      }
    ],
    "related": [
      "expenses",
      "gst-hst",
      "provincial-sales-tax-qst-pst-rst",
      "tax-preparation"
    ],
    "who": "Everyone with an AI key connected. Team members need the Finance area.",
    "keywords": [
      "snap a receipt",
      "receipt",
      "photo",
      "scan receipt",
      "upload receipt",
      "camera",
      "read receipt",
      "keep receipts",
      "receipt photo",
      "invoice photo"
    ],
    "sections": [
      {
        "id": "receipt-sales-tax",
        "title": "Sales tax on a receipt",
        "body": "If your account is registered for GST/HST, the GST/HST printed on the receipt goes in its own box and Amount is the total before it. Quebec QST registrants get the QST in its own box too.",
        "keywords": [
          "gst on receipt",
          "hst",
          "qst",
          "tax box",
          "claim back"
        ]
      }
    ]
  },
  {
    "id": "cash-flow-dashboard",
    "name": "Cash Flow Dashboard",
    "area": "Money",
    "where": "Money > Finance > Cash Flow Dashboard. The page is headed Financial Pulse.",
    "href": "/finance/pulse",
    "what": "Your money at a glance. See income, expenses and net for this week, this month and this year, how you track to budget, profit by business segment and a month-by-month chart.",
    "ai": "Has an AI button",
    "aiNote": "Run my assessment has your assistant grade your financial health out of 100, flag where expenses look high and suggest specific steps, on your own AI key. It saves to your account, so it is there when you return. Press Refresh for a new one.",
    "steps": [
      "On the Finance Center, press Cash Flow Dashboard.",
      "Read This week, This month and Year to date.",
      "Press Add entry, choose Income or Expense, fill in the form and press Add.",
      "Type a Monthly expense budget and a Monthly income target, and press Set beside each.",
      "Press Run my assessment for your assistant's read.",
      "Use Import to bring in a statement, or P&L to open your full report."
    ],
    "health": "Entries added here feed your Finance dimension, and so do your Monthly income target and Cash in the bank. The Financial health number on this page is separate. It blends your profit margin with how spending tracks to budget, and your assistant's score out of 100 is separate too.",
    "tips": [
      "Set one overall budget for the simple view, or press Set budgets by category for more detail.",
      "Tag entries with a business segment to see which parts of the business are most profitable.",
      "A recurring expense added here also lands on Bills & Cash Calendar."
    ],
    "questions": [
      {
        "q": "Why are there two health numbers?",
        "a": "Financial health is worked out from your numbers. The Health Assessment score is your assistant's own grade. They can differ, and neither one is your Finance dimension score."
      },
      {
        "q": "Is this the same as the Financial Pulse on my dashboard?",
        "a": "Both read the same records. The card on Executive Home is the quick view, and its title opens this page."
      },
      {
        "q": "Where do I download my entries?",
        "a": "Open Profit & Loss and press CSV. The file includes Paid to, Payment type, How often and Renewal."
      }
    ],
    "related": [
      "income",
      "expenses",
      "bills-cash-calendar",
      "budget-planner",
      "profit-loss",
      "import-transactions",
      "revenue-by-segment"
    ],
    "who": "Everyone. Team members need the Finance area.",
    "keywords": [
      "cash flow",
      "cash flow dashboard",
      "financial pulse",
      "pulse",
      "add entry",
      "week to date",
      "wtd",
      "mtd",
      "ytd",
      "profit by segment",
      "most profitable",
      "monthly chart",
      "health assessment",
      "income target"
    ],
    "sections": [
      {
        "id": "add-entry-details",
        "title": "What Add entry asks for",
        "body": "For an expense, it asks who was paid, One-time or Recurring, how often and how it renews. How often can be Weekly, Every 2 weeks, Monthly, Quarterly, Every 6 months or Yearly. Recent entries then show the name and a Recurring badge.",
        "keywords": [
          "paid to",
          "one-time",
          "recurring",
          "how often",
          "every 2 weeks",
          "every 6 months",
          "renewal",
          "recurring badge"
        ]
      },
      {
        "id": "cash-in-the-bank",
        "title": "Cash in the bank",
        "body": "Type what your business has in its accounts and press Set. Your Finance dimension uses it to work out how many months of expenses you have covered. Update it when it changes. The date under the box shows when you last did.",
        "keywords": [
          "cash",
          "bank balance",
          "runway",
          "savings"
        ]
      },
      {
        "id": "profit-by-segment",
        "title": "Profit by business segment",
        "body": "This card shows income, expenses and net for the year by segment. The top earner gets a Most profitable label. Tag entries with a segment in the add form.",
        "keywords": [
          "segment",
          "profit by segment",
          "most profitable",
          "unassigned"
        ]
      }
    ]
  },
  {
    "id": "bills-cash-calendar",
    "name": "Bills & Cash Calendar",
    "area": "Money",
    "where": "Money > Finance > Bills & Cash Calendar",
    "href": "/finance/bills",
    "what": "See what is due to go out and when, on a calendar and in a list. Mark a bill Paid and it records the expense and moves to its next date.",
    "ai": "No AI",
    "aiNote": "This page does not use AI. In chat, your assistant knows about bills that are overdue or due soon. A recurring expense it records for you, behind Approve, also lands here.",
    "steps": [
      "On the Finance Center, press Bills & Cash Calendar.",
      "Under Add a bill, fill in the name, Paid to, amount and next due date.",
      "Choose how often and a category. Tick Renews automatically if it is on autopay.",
      "Press Add bill. It appears on the calendar and under Coming up (next 60 days).",
      "When a bill is paid, press Paid on its row."
    ],
    "health": "A bill on its own does not change your scores. When you press Paid, the expense it records feeds your Finance dimension. Your bills also show in the Budget Planner as money still due this month.",
    "tips": [
      "Auto-renewing bills are not recorded for you. They stay on the calendar until you press Paid.",
      "Give a bill an amount. Without one, Paid moves the date but records no expense.",
      "A recurring expense added on Expenses or the Financial Pulse appears here by itself."
    ],
    "questions": [
      {
        "q": "Why is my autopay bill showing as overdue?",
        "a": "The page cannot see your bank, so it does not know the money left. Press Paid and it records the expense and moves to the next date."
      },
      {
        "q": "How do I remove a bill?",
        "a": "Press the trash icon on its row, then confirm Stop tracking. Payments already recorded stay in your records."
      },
      {
        "q": "Can I add a bill that only happens once?",
        "a": "Yes. Choose One time in the how often box. After you press Paid, it leaves your list."
      }
    ],
    "related": [
      "expenses",
      "budget-planner",
      "tech-stack-optimizer",
      "tax-preparation",
      "cash-flow-dashboard"
    ],
    "who": "Everyone. Team members need the Finance area.",
    "keywords": [
      "bills",
      "bill calendar",
      "cash calendar",
      "due dates",
      "overdue",
      "upcoming bills",
      "autopay",
      "renewals",
      "mark paid",
      "subscriptions",
      "rent",
      "loan payment",
      "cash check"
    ],
    "sections": [
      {
        "id": "top-tiles",
        "title": "The four tiles",
        "body": "Due in the next 7 days, Due in the next 30 days, Overdue, and Cash check this month. The cash check sets the income you have so far this month beside the bills still due.",
        "keywords": [
          "due in the next 7 days",
          "due in the next 30 days",
          "overdue",
          "cash check this month"
        ]
      },
      {
        "id": "marking-paid",
        "title": "Paid, Edit and Stop tracking",
        "body": "Paid records the expense dated today, with the bill's Paid to name and renewal type, and rolls the bill to its next date. Edit opens the bill in the form. These buttons show on a bill's next due date only.",
        "keywords": [
          "paid",
          "mark paid",
          "edit bill",
          "stop tracking",
          "next due"
        ]
      },
      {
        "id": "quick-add",
        "title": "Quick add",
        "body": "Quarterly estimated-tax dates adds the upcoming US estimated-tax dates as one-time bills with no amount, so check them with your tax professional. Subscriptions from my Tech Stack adds your tools as monthly bills.",
        "keywords": [
          "quick add",
          "quarterly estimated-tax dates",
          "subscriptions from my tech stack",
          "import subscriptions"
        ]
      },
      {
        "id": "connected-strip",
        "title": "Connected to",
        "body": "This strip shows your budget left after bills, your software spend and your cash flow this month. Each one is a link.",
        "keywords": [
          "budget left after bills",
          "tech tools",
          "connected to"
        ]
      }
    ]
  },
  {
    "id": "budget-planner",
    "name": "Budget Planner",
    "area": "Money",
    "where": "Money > Finance > Budget Planner",
    "href": "/finance/budget",
    "what": "Set your income goals and spending budgets, as simple or as detailed as you like. Each category shows what you have spent, what is still due from bills this month and what is left.",
    "ai": "Has an AI button",
    "aiNote": "Suggest a budget has your assistant build a monthly budget from what you spent over about the last three months, shaped by your plans and forecast. It uses your own AI key. Nothing is saved until you press Use this budget.",
    "steps": [
      "On the Finance Center, press Budget Planner.",
      "Under Income goals, type a Weekly, Monthly or Yearly goal and press Set.",
      "If you are growing, fill in Month-by-month income goals and press Save month goals.",
      "Under Overall monthly spending, type your Expense budget (monthly) and press Set.",
      "For more detail, add a Category and Monthly $ under Expense budgets by category, then press Add.",
      "Or press Suggest a budget, review it, and press Use this budget."
    ],
    "health": "Your monthly income goal, or this month's own goal, is the target your Finance dimension measures income against. Your expense budgets do not change that dimension. They feed the separate Financial health number and your budget lines.",
    "tips": [
      "Leave Weekly or Yearly blank and they are worked out from your monthly goal.",
      "A month left blank under Month-by-month uses your monthly goal.",
      "Press the X beside a category to clear its budget."
    ],
    "questions": [
      {
        "q": "Why does Suggest a budget say to add expenses first?",
        "a": "It builds from what you actually spend, so it needs some expenses from the last few months."
      },
      {
        "q": "Does Use this budget replace everything?",
        "a": "It sets a budget for each category it lists. Other category budgets and your overall budget stay as they are."
      },
      {
        "q": "What does the (avg) amount mean in a suggestion?",
        "a": "That is your average monthly spend in that category, so you can compare it with the suggested amount."
      }
    ],
    "related": [
      "expenses",
      "bills-cash-calendar",
      "cash-flow-dashboard",
      "income",
      "finance-center"
    ],
    "who": "Everyone. Team members need the Finance area.",
    "keywords": [
      "budget",
      "budget planner",
      "income goal",
      "revenue goal",
      "monthly goal",
      "weekly goal",
      "yearly goal",
      "expense budget",
      "category budget",
      "suggest a budget",
      "month by month goals",
      "spending limit",
      "left after bills"
    ],
    "sections": [
      {
        "id": "income-goals",
        "title": "Income goals",
        "body": "Your Financial Pulse tracks these. The Weekly, Monthly and Yearly goals live here, and Forecasting can also fill them with Use as my income goals.",
        "keywords": [
          "income goals",
          "weekly",
          "monthly",
          "yearly",
          "goal tracking"
        ]
      },
      {
        "id": "month-by-month-goals",
        "title": "Month-by-month income goals",
        "body": "Give each of the next 12 months its own goal, and your Financial Pulse follows that ramp.",
        "keywords": [
          "ramp",
          "month by month",
          "save month goals",
          "growth goals"
        ]
      },
      {
        "id": "category-budget-lines",
        "title": "Spent, still due and left",
        "body": "Each category shows spent against its monthly budget. When bills in that category are still due this month, a line adds what is due and what is left.",
        "keywords": [
          "still due",
          "left",
          "spent",
          "bills this month",
          "over budget"
        ]
      }
    ]
  },
  {
    "id": "profit-loss",
    "name": "Profit & Loss",
    "area": "Money",
    "where": "Money > Finance > Financial Reports. The page is headed Profit & Loss.",
    "href": "/finance/pnl",
    "what": "A profit and loss statement for any period, with income and expenses by category and your net profit. Download it, print it, and see who paid you and who you paid.",
    "ai": "Has an AI button",
    "aiNote": "Read my P&L has your assistant look at your margin, your biggest costs and where profit is growing or leaking, on your own AI key. It reads your recent months, not only the period on screen. The read is saved to your account.",
    "steps": [
      "On the Finance Center, press Financial Reports.",
      "Choose Week, Month, Quarter, Year or Custom.",
      "Use the arrows to move between periods. For Custom, pick two dates and press Apply.",
      "Read Income, Expenses and Net Profit.",
      "Press CSV, PDF or Print to take it with you."
    ],
    "health": "This does not change your scores. It helps by showing whether your business made money in any period, using the same records that feed your Finance dimension.",
    "tips": [
      "CSV lists every transaction, which suits an accountant or bookkeeper. PDF is the tidy statement.",
      "Expenses with no category show as Uncategorized here, so tidy them for a cleaner report.",
      "Fill in Paid to and From on your entries so the Who paid you and Who you paid lists fill up."
    ],
    "questions": [
      {
        "q": "Why does a note show below Net Profit?",
        "a": "That is money in your other currency, kept separate. It is never added into the totals above."
      },
      {
        "q": "Do the name lists print?",
        "a": "No. Who paid you and Who you paid show on screen only. They are not in the print view or the PDF."
      },
      {
        "q": "Is this ready to give my accountant?",
        "a": "It is a report from the entries you recorded. Your accountant can use the CSV, and they will tell you if they need anything else."
      }
    ],
    "related": [
      "income",
      "expenses",
      "monthly-money-review",
      "tax-preparation",
      "cash-flow-dashboard"
    ],
    "who": "Everyone. Team members need the Finance area.",
    "keywords": [
      "profit and loss",
      "p&l",
      "pnl",
      "financial reports",
      "income statement",
      "net profit",
      "report",
      "export",
      "csv",
      "pdf",
      "print",
      "quarterly report",
      "custom dates",
      "who paid me",
      "who i paid"
    ],
    "sections": [
      {
        "id": "who-paid-you-who-you-paid",
        "title": "Who paid you and Who you paid",
        "body": "Under the statement, these lists show the top names for the period, using From on income and Paid to on expenses.",
        "keywords": [
          "who paid you",
          "who you paid",
          "top clients",
          "vendors",
          "by name"
        ]
      },
      {
        "id": "csv-columns",
        "title": "What is in the CSV",
        "body": "Date, Type, Category, Description, Amount, Currency, Paid to, Payment type, How often and Renewal, with totals at the end. Each currency has its own totals.",
        "keywords": [
          "csv columns",
          "download transactions",
          "spreadsheet",
          "export"
        ]
      }
    ]
  },
  {
    "id": "monthly-money-review",
    "name": "Monthly Money Review",
    "area": "Money",
    "where": "Money > Finance > Monthly Money Review",
    "href": "/finance/monthly-review",
    "what": "A one-month snapshot of your money: income, expenses, net and margin, plus the top categories where your money went. Look back through past months and print it.",
    "ai": "Has an AI button",
    "aiNote": "Read my month has your assistant compare this month, or the last complete month, with the months before. It says what changed, what drove it and the one money decision worth making now. It uses your own AI key, and the read is saved to your account.",
    "steps": [
      "On the Finance Center, press Monthly Money Review.",
      "Use the arrows to choose a month.",
      "Read Income, Expenses and Net, with your margin under Net.",
      "Check Where the money went for your top five expense categories.",
      "Press Read my month, or press Print to keep a copy."
    ],
    "health": "This does not change your scores. It helps you see one month clearly, using the same records that feed your Finance dimension.",
    "tips": [
      "Press Open full P&L for every category in that month.",
      "Set a monthly date to read this page, such as the first week of each month."
    ],
    "questions": [
      {
        "q": "What is the margin?",
        "a": "The share of your income left after expenses that month. It only shows when the month has income."
      },
      {
        "q": "Does Read my month follow the month I picked?",
        "a": "No. It reads your recent months, so pick the current month if you want the page and the read to match."
      }
    ],
    "related": [
      "profit-loss",
      "cash-flow-dashboard",
      "budget-planner",
      "finance-center"
    ],
    "who": "Everyone. Team members need the Finance area.",
    "keywords": [
      "monthly money review",
      "monthly review",
      "month summary",
      "where the money went",
      "margin",
      "top expenses",
      "last month",
      "read my month",
      "month end"
    ]
  },
  {
    "id": "tax-preparation",
    "name": "Tax Preparation",
    "area": "Money",
    "where": "Money > Finance > Tax Preparation",
    "href": "/finance/tax",
    "what": "A planning estimate of what to set aside for taxes this year, from your own income and expenses. See a per-quarter amount and expenses by category, and export the year for your accountant. This is not tax advice.",
    "ai": "Has an AI button",
    "aiNote": "Check my tax readiness has your assistant look at what to categorize, what you might be missing and what to set aside, on your own AI key. It is an estimate, not tax advice, and the read is saved to your account.",
    "steps": [
      "On the Finance Center, press Tax Preparation.",
      "If a yellow box says expenses are uncategorized, deal with those first.",
      "Type your Estimated tax rate, then click away to save it. Ask your tax professional what rate suits you.",
      "Read Income (YTD), Deductible expenses, Taxable net and Set aside.",
      "Press Add quarterly payment to my tasks.",
      "Press Export year (CSV) when you are ready to hand it to your accountant."
    ],
    "health": "This does not change your scores. It helps by showing what to set aside before a payment comes due.",
    "tips": [
      "Use a category such as Taxes when you record a tax payment. The page keeps those out of the expense total.",
      "The rate starts at 25% until you change it, and it saves to your account.",
      "Press Add quarterly payment once per payment. The Bills entry is added only once, but each press adds another task."
    ],
    "questions": [
      {
        "q": "Does the page decide what is deductible?",
        "a": "No. Deductible expenses is every expense you recorded this year, except taxes you already paid. Your tax professional decides what really counts."
      },
      {
        "q": "Does the set-aside drop after I pay taxes?",
        "a": "No. Taxes paid show on their own line under the category list, and the set-aside is not reduced by them."
      },
      {
        "q": "How is the per-quarter amount worked out?",
        "a": "Your set-aside divided by four. The payment date shown follows the US estimated-tax calendar, so check your own dates with your tax professional."
      }
    ],
    "related": [
      "profit-loss",
      "bills-cash-calendar",
      "1099-contractor-totals",
      "gst-hst",
      "provincial-sales-tax-qst-pst-rst",
      "expenses"
    ],
    "who": "Everyone. Team members need the Finance area.",
    "keywords": [
      "tax",
      "taxes",
      "tax preparation",
      "tax prep",
      "set aside",
      "quarterly taxes",
      "estimated taxes",
      "tax rate",
      "deductions",
      "write offs",
      "uncategorized",
      "export for accountant",
      "irs",
      "tax readiness"
    ],
    "sections": [
      {
        "id": "uncategorized-alert",
        "title": "The uncategorized warning",
        "body": "A yellow box counts expenses with no category and links to Expenses. If you press Add quarterly payment while any remain, the page warns you first and the button changes to Add task anyway. To give an old expense a category, open Expenses and press the pencil on it.",
        "keywords": [
          "uncategorized",
          "categorize",
          "review expenses",
          "add task anyway"
        ]
      },
      {
        "id": "add-quarterly-payment",
        "title": "Add quarterly payment",
        "body": "This adds a high-priority task with the amount and due date, and puts an Estimated tax payment on your Bills & Cash Calendar once, so your budget sees it coming. The button is greyed out when your taxable net for the year is zero or less.",
        "keywords": [
          "add quarterly payment",
          "tax task",
          "tax bill",
          "payment reminder",
          "next estimated payment"
        ]
      },
      {
        "id": "potential-deductions",
        "title": "Potential deductions",
        "body": "This lists your expenses by category with a total. It is a starting point for you and your tax professional, not a ruling on what you can claim.",
        "keywords": [
          "potential deductions",
          "expenses by category",
          "total deductible",
          "taxes already paid"
        ]
      }
    ]
  },
  {
    "id": "1099-contractor-totals",
    "name": "1099 contractor totals",
    "area": "Money",
    "where": "Money > Finance > Tax Preparation > 1099 contractor totals",
    "href": "/finance/1099",
    "what": "Everyone you paid in a year, taken from the Paid to name on your expenses. Mark your contractors and the page shows who may need a 1099-NEC, who still needs a W-9, and gives you a file for your accountant.",
    "ai": "No AI",
    "aiNote": "This page does not use AI. In chat, your assistant can tell you who you paid, who is marked as a contractor and who likely needs a 1099-NEC.",
    "steps": [
      "Open Finance from the left menu, press Tax Preparation, then press 1099 contractor totals.",
      "Pick the year at the top of the page.",
      "Tick Contractor beside each person or business you paid for work who is not your employee.",
      "Tick W-9 on file once you have their form, and Only by card / PayPal if you never paid them any other way.",
      "Check the 1099-NEC column, then press Download for my accountant."
    ],
    "health": "This does not change your scores. It helps by keeping your contractor totals ready for your accountant at year end.",
    "tips": [
      "Expenses with no Paid to name are not on the list. The box at the top shows their total, so you can add the name on the Expenses page.",
      "The same payee counts as one person even if you typed the name a little differently.",
      "Use Show only contractors for a shorter list."
    ],
    "questions": [
      {
        "q": "What does Likely needed mean?",
        "a": "That contractor is ticked, was not paid only by card or PayPal, and reached the reporting amount shown on the page for that year. It is a guide to bring to your accountant, not tax advice."
      },
      {
        "q": "Why is someone I paid missing?",
        "a": "The page lists expenses with a Paid to name. It counts US-dollar payments only, so someone paid only in Canadian dollars is left off."
      },
      {
        "q": "Does the Suite file the 1099 for me?",
        "a": "No. The page gives you the totals and the download. You or your accountant prepare and file the forms."
      }
    ],
    "related": [
      "expenses",
      "tax-preparation",
      "snap-a-receipt"
    ],
    "who": "Everyone can open it. It is built for US businesses, because a 1099 is a US form. Team members need the Finance area.",
    "keywords": [
      "1099",
      "1099-nec",
      "contractor",
      "contractors",
      "w-9",
      "w9",
      "paid to",
      "who did i pay",
      "vendor totals",
      "year end",
      "freelancer",
      "accountant",
      "january 31"
    ]
  },
  {
    "id": "gst-hst",
    "name": "GST/HST",
    "area": "Money",
    "where": "Money > Finance > Sales tax (GST/HST, QST, PST). Turn it on in Settings > Integrations > Canadian sales tax",
    "href": "/finance/gst-hst",
    "what": "For Canadian businesses registered for GST/HST. Once it is on, the Suite adds the tax to your invoices, offer payment links and paid bookings at the rate for your customer's province, records it apart from your income, and works out the numbers for your return.",
    "ai": "No AI",
    "aiNote": "This page does not use AI. In chat, your assistant can give you a GST/HST summary for a period. Snap a receipt can also read the GST/HST on a receipt with your own AI key, and you check it before it is saved.",
    "steps": [
      "Open Settings, press Integrations, and find Canadian sales tax (GST/HST, QST, PST). It shows when your main currency is Canadian dollars.",
      "Tick My business is registered for GST/HST, add your GST/HST number, province and how often you file, then press Save sales tax settings.",
      "If you made payment links before turning this on, press Remake on each offer so they charge the tax.",
      "Add the GST/HST you paid when you enter expenses, using the GST/HST box.",
      "When a return is coming up, open Finance and press Sales tax (GST/HST, QST, PST). Use the arrows to pick the period.",
      "Check any sales listed under Check these sales, then press Download for my accountant (CSV)."
    ],
    "health": "This does not change your scores. It helps by keeping the tax apart from your income and your return numbers ready for each period.",
    "tips": [
      "Each card shows the matching CRA line number, so your accountant can follow it: lines 101, 103, 106 and 109.",
      "On an invoice, the province comes from the contact's address and you can change it in Customer is in. A payment link asks the buyer on a short page before they pay.",
      "Only Canadian-dollar entries are counted. US-dollar money is listed in a note on the page and is in the download."
    ],
    "questions": [
      {
        "q": "Does the Suite file my return?",
        "a": "No. It works out the numbers from what you recorded. You or your accountant file with the CRA. Adjustments, instalments and anything unusual are for your accountant."
      },
      {
        "q": "What rates does it use?",
        "a": "It uses the rate for where your customer is: 13% HST in Ontario, 14% in Nova Scotia, 15% in New Brunswick, Newfoundland and Labrador and Prince Edward Island, and 5% GST elsewhere in Canada. Customers outside Canada are not charged."
      },
      {
        "q": "I am not registered. Will the Suite tell me if I get close?",
        "a": "Yes. If your main currency is Canadian dollars, you get an alert and an email as your sales near the $30,000 registration line, and again if you pass it. Ask your tax professional what that means for your business."
      }
    ],
    "related": [
      "provincial-sales-tax-qst-pst-rst",
      "currency-usd-and-cad",
      "tax-preparation",
      "payments-invoices",
      "payment-links-on-offers",
      "snap-a-receipt"
    ],
    "who": "Accounts with Canadian dollars as their main currency, or already registered. Only the account owner can turn it on, because team members do not see Settings > Integrations. Team members need the Finance area to see the report.",
    "keywords": [
      "gst",
      "hst",
      "gst/hst",
      "sales tax",
      "canadian tax",
      "canada tax",
      "cra",
      "tax return",
      "input tax credit",
      "itc",
      "claim back tax",
      "business number",
      "file by",
      "pay by",
      "small supplier",
      "30000",
      "register for gst"
    ]
  },
  {
    "id": "tech-stack-optimizer",
    "name": "Tech Stack Optimizer",
    "area": "Money",
    "where": "Money > Finance > Tech Stack Optimizer",
    "href": "/finance/techstack",
    "what": "Finds the software and subscriptions in your expenses for this year and totals them. You see an estimated monthly cost, your year to date and each tool, and you can put a renewal on your Bills & Cash Calendar.",
    "ai": "Has an AI button",
    "aiNote": "Press Optimize with AI and your assistant looks over your tools for overlap, plans you could downgrade and possible savings. This uses your own AI key. It only gives suggestions and changes nothing.",
    "steps": [
      "Open Finance from the left menu and press Tech Stack Optimizer.",
      "Check the tools listed under Your tools.",
      "Press Add to Bills beside a tool to put it on your Bills & Cash Calendar. Tools already there say On Bills.",
      "Press Optimize with AI for ideas on where to save.",
      "Act on any idea you like in the tool itself, then press the refresh icon to look again later."
    ],
    "health": "This does not change your scores. It helps you see what your tools cost and spot spending you could trim.",
    "tips": [
      "Add a Paid to name on your software expenses. Tools are grouped by that name, so one vendor shows as one line.",
      "If a tool is missing, give the expense a category like Software or Subscription, or name the tool in the note.",
      "Check the amount and date on the Bills page after you press Add to Bills. The bill starts from the estimated monthly cost and the first of next month."
    ],
    "questions": [
      {
        "q": "Why is something here that is not software?",
        "a": "Any expense marked as recurring is counted, and so is one with software-type words in its category, note or Paid to name, such as plan, email or app."
      },
      {
        "q": "How is the monthly amount worked out?",
        "a": "It is an estimate: what you have spent on the tool this year divided by the months so far. A tool paid once a year will look spread out."
      },
      {
        "q": "Why does the AI button ask for a key?",
        "a": "The review runs on your own AI key. Press Set up your AI assistant to add it. The button also needs at least one tool on the list."
      }
    ],
    "related": [
      "expenses",
      "bills-cash-calendar",
      "budget-planner"
    ],
    "who": "Everyone. Team members need the Finance area.",
    "keywords": [
      "tech stack",
      "software",
      "subscriptions",
      "saas",
      "tools",
      "apps",
      "renewals",
      "cancel subscription",
      "save money",
      "overlap",
      "monthly software cost",
      "optimizer"
    ]
  },
  {
    "id": "import-transactions",
    "name": "Import transactions",
    "area": "Money",
    "where": "Money > Finance > Cash Flow Dashboard > Import",
    "href": "/finance/import",
    "what": "Turns a bank or card statement, a CSV or invoice text into income and expense entries. You upload or paste it, your assistant reads the rows, and you check them before anything goes into your Finance Center.",
    "ai": "AI-powered",
    "aiNote": "Parse with AI reads your text and sorts it into transactions with a date, description, category, type and amount. This uses your own AI key. Nothing is saved until you check the rows and press Import.",
    "steps": [
      "Open Finance from the left menu, press Cash Flow Dashboard, then press Import.",
      "Press Upload CSV / text, or paste your statement rows into the box.",
      "Press Parse with AI.",
      "Check each row. Change the date, description, category, type or amount, and untick or remove any row you do not want.",
      "If the money is not in your main currency, choose the Currency above the table.",
      "Press Import to add the ticked rows to your Finance Center."
    ],
    "health": "Imported income and expenses go into your Finance ledger. This month's entries in your main currency count toward your Finance dimension, one of your 12 dimensions, once you have a monthly income goal set.",
    "tips": [
      "CSV exports from your bank or card work best. For a PDF statement, copy the text and paste it in.",
      "A long statement is cut off. The assistant reads about the first 16,000 characters and up to 300 rows, so split a big file into smaller pieces.",
      "One import is one currency. Do your US-dollar and Canadian-dollar statements separately."
    ],
    "questions": [
      {
        "q": "Does it catch duplicates?",
        "a": "No. Every row you import is added as new. Untick anything already in your Finance Center, such as Stripe payments that came in on their own."
      },
      {
        "q": "Will imported expenses show on my 1099 totals?",
        "a": "Not until they have a Paid to name. Imported rows come in without one, so add it on the Expenses page."
      },
      {
        "q": "It says to add my AI key. What do I do?",
        "a": "Press Set up your AI assistant and add your key, then come back and press Parse with AI. You can also add single entries by hand on the Income and Expenses pages."
      }
    ],
    "related": [
      "finance-center",
      "income",
      "expenses",
      "cash-flow-dashboard",
      "connect-stripe",
      "currency-usd-and-cad"
    ],
    "who": "Everyone. Team members need the Finance area and a role that can edit.",
    "keywords": [
      "import",
      "upload statement",
      "bank statement",
      "credit card statement",
      "csv",
      "quickbooks",
      "qbo",
      "paste transactions",
      "bring in my books",
      "pdf statement",
      "bookkeeping",
      "transactions",
      "move from quickbooks"
    ],
    "sections": [
      {
        "id": "quickbooks-connection",
        "title": "Using QuickBooks",
        "body": "The Suite does not connect to QuickBooks. The QuickBooks card in Settings > Integrations does not sync anything. Keep QuickBooks as your books, export a CSV from it and bring that in here. To send numbers the other way, use Export year (CSV) on Tax Preparation, or the export on Financial Reports, and give the file to your bookkeeper.",
        "keywords": [
          "quickbooks",
          "qbo",
          "intuit",
          "connect quickbooks",
          "accounting software",
          "bookkeeper",
          "xero",
          "sync",
          "export csv"
        ]
      }
    ]
  },
  {
    "id": "revenue-by-segment",
    "name": "Revenue by Segment",
    "area": "Money",
    "where": "Daily Operations > Executive Home > View revenue by segment",
    "href": "/revenue",
    "what": "A simple view of this month's revenue across each business and segment, against a target you set. You type these numbers in yourself, month by month. They are separate from your Finance Center.",
    "ai": "No AI",
    "aiNote": "This page does not use AI, and your assistant has no tool for these entries.",
    "steps": [
      "Set up your businesses and segments in Business Segments, under Settings in the left menu.",
      "On Executive Home, press View revenue by segment.",
      "Press Record revenue.",
      "Choose the Segment and Month, type the Actual and Target, then press Save.",
      "Read the total for This month, the change from last month, and the bar for each segment."
    ],
    "health": "This does not change your scores. It helps you compare your segments against a target. To move a segment's score, tag income and expenses to that segment in Finance.",
    "tips": [
      "The link on Executive Home appears once you have income or expenses recorded. Until then that spot says Add your first income to see your pulse.",
      "Numbers here do not come from Income or Stripe, and they do not go there either. Keep them in step yourself if you use both.",
      "Amounts use your main currency, in whole dollars."
    ],
    "questions": [
      {
        "q": "Can I fix a number I entered wrong?",
        "a": "Not on this page. There is no edit or delete here, and each Save adds to that month, so check the numbers before you press Save."
      },
      {
        "q": "Why is the Segment list empty?",
        "a": "You need at least one business with a segment first. Add them in Business Segments, then come back."
      }
    ],
    "related": [
      "finance-center",
      "income",
      "profit-loss"
    ],
    "who": "Everyone. Team members need the Finance area.",
    "keywords": [
      "revenue by segment",
      "segment revenue",
      "revenue target",
      "actual vs target",
      "income by business",
      "business segments",
      "this month revenue",
      "multiple businesses",
      "record revenue"
    ]
  },
  {
    "id": "payments-invoices",
    "name": "Payments & Invoices",
    "area": "Money",
    "where": "Money > Payments & Invoices",
    "href": "/payments",
    "what": "Every payment taken through the Suite in one place: payment links, invoices, payment plans, monthly subscriptions and paid bookings. You can send an invoice to any contact, paid in full or in monthly payments. The money goes straight to your own Stripe account.",
    "ai": "No AI",
    "aiNote": "This page does not use AI. In chat, your assistant can look up payments and unpaid invoices, and prepare an invoice or an offer payment link. Nothing is sent until you press Approve.",
    "steps": [
      "Open Payments & Invoices from the left menu. If it asks, connect your Stripe account first.",
      "Press New invoice.",
      "Choose the Contact, pick an Offer if you want, and fill in What it's for and the Total amount.",
      "Under Payments, choose Paid in full or a number of monthly payments, from 2 to 24, and set Due within (days).",
      "Press Send invoice. Stripe emails it from your own Stripe account, with a secure pay page.",
      "Watch the Invoices list. Use Copy pay link, Open, PDF, Void or Stop plan on any invoice."
    ],
    "health": "This page does not change your scores by itself. Paid amounts reach your Finance ledger through the Stripe sync, and this month's income and expenses in your main currency count toward your Finance dimension, one of your 12 dimensions, once you have a monthly income goal set.",
    "tips": [
      "You can start an invoice from a contact too. Open their record and press Send an invoice under Payments & invoices.",
      "A payment plan stops by itself after the last payment. A new invoice goes out each month until then.",
      "The three boxes at the top show Paid this month, Unpaid invoices and Payment plans running. Your other currency shows on its own Kept separate line."
    ],
    "questions": [
      {
        "q": "What happens if I void an invoice or stop a plan?",
        "a": "A voided invoice's link stops working. If you stop a plan, payments already made stay paid and no more invoices go out."
      },
      {
        "q": "Why can't I send an invoice to this contact?",
        "a": "The contact needs an email address, and Stripe's smallest charge applies to each payment. The message on the form tells you what is missing."
      },
      {
        "q": "What does the TEST label mean?",
        "a": "That payment or invoice was made in Stripe's test mode. Test payments do not go into your Finance Center."
      }
    ],
    "related": [
      "connect-stripe",
      "offers-packages",
      "payment-links-on-offers",
      "income",
      "gst-hst",
      "currency-usd-and-cad"
    ],
    "who": "The account owner and team admins. Stripe must be connected to send invoices. Other team members cannot load this page, even with the Finance area.",
    "keywords": [
      "invoice",
      "invoices",
      "send invoice",
      "bill a client",
      "payment plan",
      "installments",
      "monthly payments",
      "payments",
      "unpaid invoice",
      "void invoice",
      "pay link",
      "get paid",
      "stripe invoice",
      "subscription",
      "refund"
    ],
    "sections": [
      {
        "id": "automatic-payment-posting",
        "title": "What happens when someone pays",
        "body": "It happens on its own. The payment appears here. The person is added or updated in Contacts with the customer tag and a tag for the offer they bought. The payment goes on their timeline, and their open deal moves to Won, unless that deal is for a different offer. The invoice or plan updates. The Stripe sync then puts the income, Stripe's fees and any affiliate credit in your Finance Center. Refunds are recorded too.",
        "keywords": [
          "automatic",
          "payment posted",
          "deal won",
          "customer tag",
          "bought tag",
          "timeline",
          "refund recorded",
          "stripe fees",
          "webhook"
        ]
      }
    ]
  },
  {
    "id": "connect-stripe",
    "name": "Connect Stripe",
    "area": "Money",
    "where": "Settings > Integrations > Stripe",
    "href": "/settings?tab=integrations",
    "what": "Links your own Stripe account to the Suite. Your payments go straight to you, and the Suite can make payment links, invoices and booking payments on your account. Your payments, refunds and Stripe fees also come into your Finance Center each morning.",
    "ai": "No AI",
    "aiNote": "This does not use AI. If Stripe is not connected, your assistant will ask you to connect it before it can prepare an invoice or payment link.",
    "steps": [
      "Open Settings from the left menu and press Integrations.",
      "Find the Stripe card and press Connect with Stripe.",
      "Sign in to Stripe and allow the connection.",
      "Back in Settings, check that the card says Connected with Stripe.",
      "Press Sync now if you want your payments brought in straight away."
    ],
    "health": "Connecting does not change your scores by itself. Synced income and expenses go into your Finance ledger, and this month's entries in your main currency count toward your Finance dimension, one of your 12 dimensions, once you have a monthly income goal set.",
    "tips": [
      "Press Disconnect to unlink Stripe. Payments already in your Finance Center stay there.",
      "The card shows when it last synced and any problem from the last try.",
      "Test payments never reach your Finance Center."
    ],
    "questions": [
      {
        "q": "Does the Suite hold my money?",
        "a": "No. Everything is made on your own Stripe account, so the money goes straight to you."
      },
      {
        "q": "How far back does it go?",
        "a": "Your first sync looks back 90 days. After that, it brings in what is new each morning and never adds the same item twice."
      },
      {
        "q": "Can I only bring payments into Finance, without payment links?",
        "a": "Yes. Follow the steps on the card to make a read-only key in Stripe and paste it in. With a key, the Suite can bring payments in, but it cannot make payment links for you."
      }
    ],
    "related": [
      "payments-invoices",
      "payment-links-on-offers",
      "income",
      "expenses",
      "currency-usd-and-cad"
    ],
    "who": "The account owner. Team members do not see Settings > Integrations.",
    "keywords": [
      "stripe",
      "connect stripe",
      "link stripe",
      "take payments",
      "accept cards",
      "get paid",
      "stripe sync",
      "sync now",
      "payment processor",
      "disconnect stripe",
      "restricted key",
      "read only key",
      "stripe fees"
    ],
    "sections": [
      {
        "id": "connect-with-stripe",
        "title": "Connect with Stripe",
        "body": "One click, with no keys to copy. It connects your own Stripe account, so payment links, invoices and booking payments are made on your account. The money goes straight to you.",
        "keywords": [
          "connect with stripe",
          "one click",
          "own stripe account",
          "payment links",
          "no platform fee",
          "oauth"
        ]
      },
      {
        "id": "stripe-sync",
        "title": "Stripe sync",
        "body": "Each morning, your Stripe payments come into your Finance Center as income, and Stripe's fees and any refunds come in as expenses. Press Sync now on the Stripe card any time. Nothing comes in twice.",
        "keywords": [
          "stripe sync",
          "sync now",
          "every morning",
          "fees",
          "refunds",
          "ledger",
          "income from stripe"
        ]
      }
    ]
  },
  {
    "id": "currency-usd-and-cad",
    "name": "Currency (USD and CAD)",
    "area": "Money",
    "where": "Settings > Integrations > Currency",
    "href": "/settings?tab=integrations",
    "what": "Pick your main currency, US dollars or Canadian dollars. New offers, invoices, bills and money entries start in it, and you can switch any single item to the other currency. The two are always kept separate. The Suite never adds them together or converts one into the other.",
    "ai": "No AI",
    "aiNote": "This does not use AI. In chat, your assistant shows each amount in its own currency and does not add the two together.",
    "steps": [
      "Open Settings from the left menu and press Integrations.",
      "Find the Currency card.",
      "Press US dollars or Canadian dollars. It saves as soon as you press it.",
      "To use the other currency on a single item, use the USD/CAD picker next to its amount."
    ],
    "health": "Your Finance dimension, one of your 12 dimensions, counts income and expenses in your main currency only. Amounts in your other currency stay out of that score.",
    "tips": [
      "Changing your main currency never changes anything you already entered.",
      "Look for Kept separate under a total. That line is your other currency.",
      "To be paid in Canadian dollars without conversion, connect a Canadian Stripe account. A US Stripe account can charge in CAD, but Stripe converts it to US dollars and charges a conversion fee."
    ],
    "questions": [
      {
        "q": "Does the Suite convert between the two?",
        "a": "No. Each amount stays in its own currency, and there are no exchange rates. Other currencies are not available."
      },
      {
        "q": "Which currency does Stripe charge?",
        "a": "Stripe charges in the item's own currency, so a CAD offer charges in CAD."
      },
      {
        "q": "Why don't I see my Canadian-dollar payments on the 1099 page?",
        "a": "A 1099 is a US form, so that page counts US dollars only."
      }
    ],
    "related": [
      "gst-hst",
      "provincial-sales-tax-qst-pst-rst",
      "connect-stripe",
      "offers-packages",
      "1099-contractor-totals"
    ],
    "who": "Everyone. Only the account owner can change the main currency, because team members do not see Settings > Integrations.",
    "keywords": [
      "currency",
      "canadian dollars",
      "cad",
      "usd",
      "us dollars",
      "canada",
      "main currency",
      "change currency",
      "two currencies",
      "exchange rate",
      "convert",
      "kept separate"
    ]
  },
  {
    "id": "provincial-sales-tax-qst-pst-rst",
    "name": "Provincial sales tax (QST, PST, RST)",
    "area": "Money",
    "where": "Money > Finance > Sales tax (GST/HST, QST, PST). Turn it on in Settings > Integrations > Canadian sales tax",
    "href": "/finance/gst-hst",
    "what": "For Canadian businesses registered for Quebec QST, BC or Saskatchewan PST, or Manitoba RST. Each one has its own number and filing schedule, works with or without GST/HST, and gets its own return section. Tax is added only for customers in a province you are registered in.",
    "ai": "No AI",
    "aiNote": "This page does not use AI. If you are registered for QST, Snap a receipt can also read the QST on a receipt with your own AI key, and you check it before it is saved.",
    "steps": [
      "Open Settings, press Integrations, and find Canadian sales tax (GST/HST, QST, PST). It shows when your main currency is Canadian dollars.",
      "Under Provincial sales tax, tick each one you are registered for. Add the number and how often you file, then press Save sales tax settings.",
      "For BC, Saskatchewan or Manitoba, tick Provincial sales tax applies on each offer, booking calendar or invoice it applies to.",
      "If you made payment links before, press Remake on each offer so they charge the tax.",
      "Open Finance and press Sales tax (GST/HST, QST, PST). Each registration has its own section with its own period.",
      "Press Download for my accountant (CSV) in that section. The button names the tax."
    ],
    "health": "This does not change your scores. It helps by keeping each provincial tax apart from your income and from GST/HST, ready for its own return.",
    "tips": [
      "QST is added for Quebec customers on everything that has GST. BC, Saskatchewan and Manitoba tax is added only where you tick it.",
      "Each tax shows as its own line on invoices, pay pages and bookings.",
      "The file by and pay by dates shown are the GST/HST dates. A province's own dates can differ, so confirm them with your tax professional."
    ],
    "questions": [
      {
        "q": "Does PST apply to what I sell?",
        "a": "The Suite never decides that for you. Settings notes that most coaching and consulting is not subject to it, while software, digital products and goods often are. Ask your tax professional which of your offers it applies to."
      },
      {
        "q": "Can I claim back tax I paid on expenses?",
        "a": "The page has a claim-back box for QST only, and a Quebec registrant can record QST paid on an expense. PST and RST you paid are treated as part of the cost, so there is nothing to claim back here."
      },
      {
        "q": "Will the Suite warn me about provincial registration?",
        "a": "No. The $30,000 alert is for GST/HST only. Ask your tax professional about the rules in your province."
      }
    ],
    "related": [
      "gst-hst",
      "currency-usd-and-cad",
      "tax-preparation",
      "offers-packages",
      "payments-invoices",
      "snap-a-receipt"
    ],
    "who": "Accounts with Canadian dollars as their main currency, or already registered. Only the account owner can turn it on, because team members do not see Settings > Integrations. Team members need the Finance area to see the returns.",
    "keywords": [
      "qst",
      "tvq",
      "pst",
      "rst",
      "quebec sales tax",
      "provincial sales tax",
      "bc pst",
      "saskatchewan pst",
      "manitoba rst",
      "revenu quebec",
      "provincial tax",
      "provincial sales tax applies",
      "9.975",
      "tax by province"
    ]
  },
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
    "aiNote": "The blending is plain math, and AI only does one job. It reads your written Brain and Soul answers and gives that part a 0 to 100 reading, using your own AI key, when you finish Brain or Soul. Soul questions marked sensitive are left out. Without a key, those parts show as AI scoring pending. Add your key and press Score my answers on Alignment Profile. Profit, Quick Pulse, live data and plan completeness use no AI.",
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
      },
      {
        "q": "What does AI scoring pending mean?",
        "a": "Your written Brain or Soul answers have not been read yet, usually because no AI key was connected when you finished. Add your key, open Alignment Profile and press Score my answers."
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
        "id": "score-my-answers",
        "title": "Score my answers",
        "body": "If you finished Brain or Soul with no AI key connected, a card here says those answers still need scoring. Add your key, come back and press Score my answers. It uses your own AI key, and the card leaves once they are scored.",
        "keywords": [
          "ai scoring pending",
          "score my answers",
          "rescore",
          "scores missing"
        ]
      },
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
  },
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
      "Use Edit access on an Editor or Viewer if you want to narrow what they can reach.",
      "For a contractor, advisor or reviewer, set Access ends on (when you invite them, or on their card afterwards). Their login stops working after that day."
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
        "q": "How do I give a contractor or advisor access for a limited time?",
        "a": "Choose Access ends on when you invite them, or open their card later and use Set last day. Their login works through that day, counted in your own time zone, and stops after it. They see a message that their access has ended. To turn it back on, choose a new last day; to keep them in for good, press No end date. Their card shows Ends and the date, and turns to Access ended when the day has passed."
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
      "hst",
      "connect",
      "calendar",
      "google",
      "microsoft"
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
      "subscription",
      "change",
      "upgrade",
      "downgrade"
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
  },
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

export const guideEntry = (id: string) => GUIDE_ENTRIES.find((e) => e.id === id) ?? null;
