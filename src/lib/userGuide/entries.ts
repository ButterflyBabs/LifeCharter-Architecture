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
      "Any deal can have its own odds. Untick Use the stage's default to set them."
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
      "A TEST label beside Payment link means your Stripe connection is in test mode, so no real money moves."
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
        "body": "The pipeline starts with these stages: To email, Email 1 sent, Emails 2 and 3 sent (no reply yet), Replied, Invited, Registered, Attended, No-show, Consultation booked, Client, Nurture, and Asked to stop or bounced.",
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
