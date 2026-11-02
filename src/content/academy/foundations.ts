import type { Lesson } from "@/lib/academy/types";

// Foundations: written from the User Guide entries named in each lesson's sources. Change the app and the matching
// lesson must change too: see "Update et al" in CLAUDE.md. The first answer in each question is held in `right`; the
// page shuffles the order.
const base = { level: "foundations" as const, kind: "lesson" as const };

export const FOUNDATIONS: Lesson[] = [
  {
    ...base,
    id: "f-what-it-is",
    track: "core",
    title: "What the Command Suite measures",
    minutes: 8,
    summary: "The 12 dimensions, the 8 pillars, the four phases and where every score comes from.",
    sources: ["how-your-scores-work", "business-alignment"],
    sections: [
      {
        heading: "One account, one picture of the business",
        text: "The Suite scores a business on 12 Business Dimensions and 8 operational pillars. Your Brain, Soul and Profit assessments start those scores. What you do in the Suite keeps them current.",
      },
      {
        heading: "One scale everywhere",
        text: "Every score runs from 0 to 100, and the same four phases apply to all of them: Survival 0-40, Growth 41-60, Expansion 61-80 and Legacy 81-100. A dimension at 72 is in Expansion, just like an overall score of 72.",
      },
      {
        heading: "Nobody can type a score in",
        text: "Scores are worked out from answers and activity. AI does one job only: it reads written Brain and Soul answers and gives that part a reading. Fixed weights and plain math do the rest. Profit, Quick Pulse, live data and plan completeness use no AI.",
      },
      {
        heading: "Reading a score",
        text: "Your overall score averages the dimensions that have a score, and it appears once at least three have one. An input with no data yet is not counted as zero. Its weight spreads across the inputs that do have data. The goal is steady progress, not 100 everywhere.",
      },
    ],
    tryIt: { label: "Open Business Alignment", href: "/business-alignment", task: "Find the overall score and phase, then find the three lowest dimensions named under Primary focus." },
    questions: [
      { id: "f1-1", q: "What does the Suite score a business on?", right: "12 Business Dimensions and 8 operational pillars", wrong: ["8 dimensions and 12 pillars", "Only its monthly revenue", "Brain, Soul and Profit, with nothing underneath them"], why: "The assessments feed 12 Business Dimensions and 8 operational pillars. Those are the two sets of scores." },
      { id: "f1-2", q: "A dimension scores 55. Which phase is it in?", right: "Growth", wrong: ["Survival", "Expansion", "Legacy"], why: "The scale is Survival 0-40, Growth 41-60, Expansion 61-80 and Legacy 81-100, so 55 is Growth." },
      { id: "f1-3", q: "What is AI's job in scoring?", right: "It reads written Brain and Soul answers and gives that part a reading", wrong: ["It decides the final score for every dimension", "It reads Profit answers and bank data", "It has no part in scoring at all"], why: "AI only reads written Brain and Soul answers. Fixed weights blend that reading with everything else." },
      { id: "f1-4", q: "An input has no data yet. What happens to it?", right: "It is not counted as zero, and its weight spreads across the inputs with data", wrong: ["It counts as zero until data arrives", "The whole dimension shows 0", "The Suite estimates a number for it"], why: "Missing data is never a zero. Its weight moves to the inputs that have data." },
    ],
  },
  {
    ...base,
    id: "f-find-your-way",
    track: "core",
    title: "Finding your way around",
    minutes: 6,
    summary: "The left menu, the + button, the bell and the Business menu.",
    sources: ["left-menu", "quick-add", "notifications-bell", "business-switcher"],
    sections: [
      {
        heading: "The left menu",
        text: "Pages sit in sections. Press a section name to fold it, and drag pages to put them in your own order. Your order is saved to the account, so it is the same on every device and for the whole team. Team members see only the areas they were given.",
      },
      {
        heading: "The + button",
        text: "The + in the top bar is the fastest way to add what you add most: a task, a reminder, a sale, a post or a planning session. A task with no date goes straight to Today.",
      },
      {
        heading: "The bell",
        text: "The gold number shows alerts you have not read: tasks due, bills coming up, follow-ups ready, score changes and reminders. Press an alert to go to the page that deals with it. Most alerts clear on their own once you deal with what caused them.",
      },
      {
        heading: "The Business menu",
        text: "If an account has two or more businesses, the Business menu in the top bar filters key pages to one of them. A gold highlight means you are looking at one business, not all of them. New items go to the business you chose.",
      },
    ],
    questions: [
      { id: "f2-1", q: "You change the order of pages in the left menu. Who sees that order?", right: "Everyone on the account, on every device", wrong: ["Only you, on this device", "Only the account owner", "Nobody, because it resets each day"], why: "The menu order is saved to the account, so it follows every device and the whole team." },
      { id: "f2-2", q: "You add a task with the + button and give it no date. Where does it go?", right: "Straight to Today", wrong: ["To Backlog", "To Waiting", "Nowhere until you add a date"], why: "A task with no date added from the + goes straight to Today." },
      { id: "f2-3", q: "What does a gold highlight on the Business menu tell you?", right: "You are looking at one business, not all of them", wrong: ["The account has unread alerts", "A payment is overdue", "That business has the highest score"], why: "Gold means the page is filtered to one business, so numbers can look lower than the whole account." },
      { id: "f2-4", q: "An alert sits on the bell. What is the usual way to clear it?", right: "Deal with what caused it, and it clears on its own", wrong: ["Wait for the daily email", "Ask support to remove it", "Sign out and back in"], why: "Most alerts clear themselves once the cause is dealt with. You can also dismiss one with the X." },
    ],
  },
  {
    ...base,
    id: "f-your-day",
    track: "core",
    title: "Running your day",
    minutes: 7,
    summary: "Executive Home is your briefing. Daily Compass is your working page.",
    sources: ["executive-home", "daily-compass"],
    sections: [
      {
        heading: "Executive Home: your briefing",
        text: "This is the page you land on when you sign in. Its cards show your schedule, money, pipeline, tasks, inbox, assistant and 12 Business Dimensions. Check that the time zone beside the date is yours, because it sets your greeting, schedule and due times.",
      },
      {
        heading: "Daily Compass: your working page",
        text: "Press Start My Day to open Daily Compass. Choose High, Medium or Low Energy and it shows the tasks that fit how you feel. Tick tasks off and Today's Progress fills. A task with no energy set counts as medium.",
      },
      {
        heading: "Follow-up drafts wait here",
        text: "Follow-up email drafts show in Daily Compass for you to review and send. Nothing goes out until you press Send.",
      },
    ],
    tryIt: { label: "Open Daily Compass", href: "/daily-compass", task: "Open Today's Focus, choose your energy for today, and see how the task list changes." },
    questions: [
      { id: "f3-1", q: "What does the time zone beside the date on Executive Home control?", right: "Your greeting, your schedule and your due times", wrong: ["Only the clock in the corner", "When your scores refresh", "Which business you are looking at"], why: "That time zone sets your greeting, your schedule and your due times, so check it is yours." },
      { id: "f3-2", q: "You set your energy to Low in Daily Compass. What happens?", right: "Harder tasks tuck away, and you can bring them back with Show higher-energy tasks", wrong: ["Harder tasks are deleted", "Your health score drops", "The tasks move to tomorrow"], why: "Lower energy only hides harder tasks for now. Show higher-energy tasks brings them back." },
      { id: "f3-3", q: "Where do you review a follow-up email draft before it goes out?", right: "Daily Compass", wrong: ["The bell", "Executive Home's Financial Pulse card", "Settings"], why: "Follow-up drafts wait in Daily Compass, and nothing is sent until you press Send." },
      { id: "f3-4", q: "A task has no energy level set. How does Daily Compass treat it?", right: "As medium", wrong: ["As high", "As low", "It leaves the task out"], why: "A task with no energy set counts as medium." },
    ],
  },
  {
    ...base,
    id: "f-tasks",
    track: "core",
    title: "Tasks, reminders and projects",
    minutes: 8,
    summary: "One list of work, what belongs in a reminder, and how projects group tasks.",
    sources: ["tasks", "reminders", "projects"],
    sections: [
      {
        heading: "Tasks: one list of everything to do",
        text: "Tasks sit in Overdue, Today, In Progress, Waiting, Backlog and Done. Overdue fills itself from due dates, so you cannot drag a task into it. Today starts fresh each day: a task left there from an earlier day moves to Backlog.",
      },
      {
        heading: "Waiting on someone",
        text: "Move the task to Waiting and fill in who you are waiting on and the Check back date.",
      },
      {
        heading: "Why finishing tasks matters",
        text: "Finished tasks count toward your health score through the Internal Process & Culture pillar. Finished work lifts it and due dates that pass lower it. Tasks with no date never count against you, and archived tasks still count.",
      },
      {
        heading: "Reminders are different",
        text: "A task is work to do. A reminder is a one-off thing you want to be told about at a set time, such as a free trial that renews or a call to return. Reminders do not change your scores.",
      },
      {
        heading: "Projects group your tasks",
        text: "A project holds the tasks for one thing you are building, with a Board, List and Timeline. Project tasks are ordinary tasks, so you never enter them twice. They also appear on your Tasks page.",
      },
    ],
    tryIt: { label: "Open Tasks", href: "/tasks", task: "Find the Waiting list, then find a project section under the lists if your account has one." },
    questions: [
      { id: "f4-1", q: "A free trial renews on the 14th and you must not forget. What should you make?", right: "A reminder", wrong: ["A project", "A contact note", "A pipeline deal"], why: "A one-off thing you want to be told about at a set time is a reminder." },
      { id: "f4-2", q: "A task is still in Today from yesterday. What happens to it?", right: "It moves to Backlog as Earlier Today", wrong: ["It is deleted", "It stays in Today forever", "It is marked done"], why: "Today starts fresh each day, so yesterday's leftovers move to Backlog as Earlier Today." },
      { id: "f4-3", q: "Does archiving a finished task take it out of your score?", right: "No, archived tasks still count toward follow-through", wrong: ["Yes, it disappears from your score", "Yes, and it lowers your score", "Only after 60 days"], why: "Archived tasks still count, and you can restore them from Archived at the top of the page." },
      { id: "f4-4", q: "You add a task to a project. Do you also need to add it to Tasks?", right: "No, a project's tasks already appear on your Tasks page", wrong: ["Yes, they are two separate lists", "Yes, but only if it has a due date", "No, because project tasks never show on Tasks"], why: "A project's tasks are ordinary tasks, so they show on your Tasks page without entering them twice." },
    ],
  },
  {
    ...base,
    id: "f-people-and-deals",
    track: "core",
    title: "People and deals",
    minutes: 8,
    summary: "How contacts arrive, what the record holds and how the Pipeline works.",
    sources: ["contacts", "contact-record", "pipeline"],
    sections: [
      {
        heading: "Contacts: everyone in one place",
        text: "Everyone who books, buys or fills in a form lands in Contacts on their own, and you can add people yourself. Saving an email already in the list updates that person, so it never makes a second copy.",
      },
      {
        heading: "The contact record",
        text: "One page holds a person's details, tags, pipelines, purchases, agreements, notes and a timeline of every touch. Schedule a follow-up here and it becomes a task for that day. If you add an email draft, it waits in Daily Compass.",
      },
      {
        heading: "The Pipeline: your board of deals",
        text: "Each deal has a value and honest odds of closing. Weighted by probability is each open deal's value multiplied by its odds, added up: what you can expect to close.",
      },
      {
        heading: "Always give a deal a next step",
        text: "Open deals with a Next step count toward your Sales Journey pillar. A deal with no movement for 14 days is marked and counts in Deals to move today.",
      },
    ],
    tryIt: { label: "Open Contacts", href: "/contacts", task: "Search for a person, open the record and find the timeline and Schedule a follow-up." },
    questions: [
      { id: "f5-1", q: "Someone books a call through a booking page. What do you need to do to put them in Contacts?", right: "Nothing, they land in Contacts on their own", wrong: ["Add them by hand", "Import a spreadsheet", "Ask support to add them"], why: "Everyone who books, buys or fills in a form lands in Contacts on their own." },
      { id: "f5-2", q: "You schedule a follow-up on a contact. What does it become?", right: "A task for that day", wrong: ["A reminder only", "A new deal", "An email sent right away"], why: "A scheduled follow-up becomes a task. A draft, if you add one, waits in Daily Compass." },
      { id: "f5-3", q: "What does Weighted by probability show on the Pipeline?", right: "Each open deal's value times its odds, added up", wrong: ["Only deals marked Won", "The number of deals in each column", "Last month's revenue"], why: "It multiplies each open deal's value by its odds and adds them up: what you can expect to close." },
      { id: "f5-4", q: "What keeps a deal counting toward your Sales Journey pillar?", right: "Having a Next step filled in", wrong: ["Having a tag on the contact", "Moving it every day", "Setting its odds to 100%"], why: "Open deals with a Next step filled in are what the Sales Journey pillar reads." },
    ],
  },
  {
    ...base,
    id: "f-assistant",
    track: "core",
    title: "Your AI assistant and Travel Partner",
    minutes: 9,
    summary: "What the assistant can do, why it waits for Approve and how it differs from Travel Partner.",
    sources: ["what-your-assistant-can-do-for-you", "what-your-assistant-will-and-will-not-do", "travel-partner", "waiting-for-my-approval"],
    sections: [
      {
        heading: "Two different things",
        text: "Travel Partner is the button and window in the corner of every page, with the setup checklist and how-to help. Your AI assistant is who you talk to inside it, the same assistant as on Executive Home. Once named, the button wears that name, but the window is still Travel Partner.",
      },
      {
        heading: "Ask, read the card, press Approve",
        text: "Ask in plain words and your assistant prepares the change as a card. Nothing happens until you press Approve. Typing I approve in the chat does not count: you have to press the button. Cards you are not ready for wait under Waiting for my approval.",
      },
      {
        heading: "What about email?",
        text: "Your assistant saves broadcasts and campaigns as drafts, and it never sends or schedules them. Email only goes out from it when you press Approve on a card that says so, such as starting named people on a campaign. Email 1 then goes right away and cannot be undone.",
      },
      {
        heading: "The rules are always on",
        text: "Your instructions can change the assistant's tone and length, but never its rules. It uses only your own information, and it gives general information rather than legal, tax or medical advice.",
      },
    ],
    tryIt: { label: "Open Waiting for my approval", href: "/assistant-approvals", task: "See what is waiting. Notice the cards at the top and the checklist underneath." },
    questions: [
      { id: "f6-1", q: "What is the difference between Travel Partner and your AI assistant?", right: "Travel Partner is the window; the assistant is who you talk to inside it", wrong: ["They are two names for the Help library", "Travel Partner is for team members only", "The assistant only works on Executive Home"], why: "Travel Partner is the corner button and window. Your assistant is the one you talk to inside it." },
      { id: "f6-2", q: "You type I approve in the chat. Does the action go ahead?", right: "No, you have to press the Approve button", wrong: ["Yes, right away", "Yes, after five minutes", "Only for team members"], why: "Typing does not count. Nothing happens until the Approve button is pressed." },
      { id: "f6-3", q: "You ask your assistant to send a broadcast to a tag. What does it do?", right: "It saves the broadcast as a draft for you to review and schedule", wrong: ["It sends it straight away", "It schedules it for tomorrow", "It refuses to write it"], why: "Broadcasts and campaigns are saved as drafts. Your assistant never sends or schedules them." },
      { id: "f6-4", q: "You approve starting a named person on a campaign. Can you undo it?", right: "No, email 1 goes right away and cannot be unsent", wrong: ["Yes, with Undo for 24 hours", "Yes, support can recall it", "Yes, it waits until you confirm by email"], why: "Starting people on a campaign has no Undo, because email 1 goes right away." },
    ],
  },
  {
    ...base,
    id: "f-getting-help",
    track: "core",
    title: "Getting help",
    minutes: 5,
    summary: "Where to look first, and how to reach a person.",
    sources: ["help-and-qa", "contact-support-and-whats-new", "travel-partner"],
    sections: [
      {
        heading: "Fast answers",
        text: "Press the question mark in the top bar to search Help & Q&A. For an answer in a sentence or two, open Travel Partner, choose Help & setup, then How do I…. It answers from the same library, and it still gives the closest answer without an AI key.",
      },
      {
        heading: "Which helper for which question",
        text: "How do I… answers how to use the Suite. For questions about your own business, use your assistant.",
      },
      {
        heading: "Reaching a person",
        text: "Press the lifebuoy in the top bar, or open Help, then Contact Support. Send a request and follow the reply under My requests. You can also email support@lccommandsuite.com. The Command Suite Office Hours card offers live help on Zoom.",
      },
      {
        heading: "What changed?",
        text: "What's new and Recently answered live on the Contact Support page. Check Recently answered first, because your answer may already be there.",
      },
    ],
    tryIt: { label: "Open Contact Support", href: "/help/contact", task: "Find What's new, Recently answered and the Office Hours card." },
    questions: [
      { id: "f7-1", q: "You want to know how your own business is doing this month. Who do you ask?", right: "Your assistant", wrong: ["How do I… in Travel Partner", "The Glossary", "Recently answered"], why: "How do I… answers how to use the Suite. Your assistant answers about your own business." },
      { id: "f7-2", q: "Where do you read the reply to a support request?", right: "In your email, or under My requests on Contact Support", wrong: ["Only on the bell", "In Waiting for my approval", "In your Tasks list"], why: "Replies come by email, and they are also under Help > Contact Support > My requests." },
      { id: "f7-3", q: "You have no AI key yet. What does How do I… do?", right: "It still gives the closest answer from the Help library", wrong: ["It stops working", "It sends your question to support", "It asks you to pay for a key"], why: "Without a key, How do I… still gives the closest answer from the Help library." },
      { id: "f7-4", q: "Where can you get live help from a person?", right: "The Command Suite Office Hours on Zoom", wrong: ["Inside the bell", "Inside your assistant's chat", "There is no live help"], why: "The Command Suite Office Hours card on Contact Support offers live help on Zoom." },
    ],
  },
  {
    ...base,
    id: "c-setup",
    track: "client",
    title: "Setting up your Suite",
    minutes: 8,
    summary: "The five setup steps, your AI key and why the assessments come first.",
    sources: ["set-up-suite", "the-assessment-lock", "saving-your-assessment-answers", "ai-assistant-setup-and-your-key"],
    sections: [
      {
        heading: "Five setup steps",
        text: "Set up Suite has five steps: connect your AI, take your Brain, Soul and Profit assessments, then connect at least one tool. When all five show a check mark, press Enter your Command Suite.",
      },
      {
        heading: "Why most pages wait",
        text: "Your whole Suite is built from your answers, so only a few pages open until your three assessments are finished. The rest opens by itself when the third one is done. Nobody can open it early.",
      },
      {
        heading: "Finishing is a button",
        text: "Answers save as you go, and you want to see Saved to your account beside the save icon. Saving is not finishing: press Complete on the last question of Brain and Soul, and Complete Assessment on Profit.",
      },
      {
        heading: "Your AI key",
        text: "An API key is not a ChatGPT or Claude login, and those logins will not work. The AI company you choose charges your own account for what you use, and LifeCharter receives none of that charge. If you switch companies, your assistant keeps its memory, because your conversations, assessments and plans live in your Suite.",
      },
    ],
    tryIt: { label: "Open Set up Suite", href: "/setup", task: "See which of your five steps show a check mark." },
    questions: [
      { id: "c1-1", q: "Which five things make up Set up Suite?", right: "Connect your AI, Brain, Soul, Profit and at least one tool", wrong: ["Brain, Soul, Profit, Pipeline and Tasks", "Billing, team, AI, email and calendar", "Profile, password, logo, website and AI"], why: "The five steps are your AI, your three assessments and at least one connected tool." },
      { id: "c1-2", q: "You saved all your Profit answers but never pressed the last button. Is it finished?", right: "No, you still need to press Complete Assessment", wrong: ["Yes, saving finishes it", "Yes, after 24 hours", "Only if your coach marks it"], why: "Saving is not finishing. An assessment counts as finished only when you press its last button." },
      { id: "c1-3", q: "Can you paste your ChatGPT login into the AI key box?", right: "No, it needs an API key from Claude or OpenAI", wrong: ["Yes, any login works", "Yes, but only for ChatGPT Plus", "No, because LifeCharter supplies the AI"], why: "An API key is different from a subscription login, so those logins will not work here." },
      { id: "c1-4", q: "You switch your AI key from OpenAI to Claude. What happens to your assistant's memory?", right: "It stays, because your information lives in your Command Suite", wrong: ["It is erased", "It moves to Claude's website", "It needs to be rebuilt by support"], why: "Your conversations, assessments and plans live in your Suite, not with the AI company." },
    ],
  },
  {
    ...base,
    id: "c-scores-to-action",
    track: "client",
    title: "Turning scores into action",
    minutes: 6,
    summary: "Next 3 Moves and your 90-day Growth Roadmap.",
    sources: ["next-three-moves", "growth-roadmap"],
    sections: [
      {
        heading: "Next 3 Moves",
        text: "This card on Business Alignment gives you three things to do next. If you asked for a briefing in the last 30 days, they are its three moves. If not, they come from your three weakest dimensions, your tasks and your year goals. Press Add to tasks on the moves you want.",
      },
      {
        heading: "Your Growth Roadmap",
        text: "Press Build my roadmap for a 90-day plan written from your own scores, answers, plans, income, pipeline and tasks. It names three areas to focus on first, then gives steps for Days 1-30, Days 31-60 and Days 61-90.",
      },
      {
        heading: "Where the work lands",
        text: "A move goes to your Today list at high priority. A roadmap step goes to Backlog at medium priority with no due date. Press Refresh when your scores change. Tasks you already added stay on your list.",
      },
    ],
    tryIt: { label: "Open Business Alignment", href: "/business-alignment", task: "Find Next 3 Moves and read the line at the bottom of the card that says where the moves came from." },
    questions: [
      { id: "c2-1", q: "You press Add to tasks on a Next 3 Moves item. Where does it go?", right: "Today, at high priority", wrong: ["Backlog, with no date", "Waiting", "Your Growth Roadmap"], why: "Moves go into your Today list at high priority." },
      { id: "c2-2", q: "You add a Growth Roadmap step. Where does it go?", right: "Backlog, at medium priority with no due date", wrong: ["Today, at high priority", "Overdue", "Your calendar"], why: "Roadmap steps go to Backlog with no due date. Give them a date when you are ready." },
      { id: "c2-3", q: "What does the Growth Roadmap cover?", right: "90 days, in steps for Days 1-30, 31-60 and 61-90", wrong: ["One week at a time", "A full year by quarter", "Only your Finance dimension"], why: "It is a 90-day plan in three phases, each with two or three steps." },
      { id: "c2-4", q: "You press Refresh on your roadmap. What happens to tasks you already added?", right: "They stay on your list, and only the roadmap text changes", wrong: ["They are deleted", "They move to Done", "They are replaced by new tasks"], why: "Tasks you already added stay on your list. Only the roadmap text changes." },
    ],
  },
  {
    ...base,
    id: "c-first-month",
    track: "client",
    title: "Your first month",
    minutes: 5,
    summary: "How First 30 Days and the Starter Guide work together.",
    sources: ["first-30-days", "starter-guide"],
    sections: [
      {
        heading: "First 30 Days ticks itself",
        text: "It has 23 steps, and each one ticks itself off from your own data when the work is done. There is nothing to mark. Each week opens when the one before it is complete, and steps marked Focus for you strengthen your three lowest dimensions.",
      },
      {
        heading: "The Starter Guide you tick yourself",
        text: "The Starter Guide is the fuller checklist for all 30 days, with where to click and a time estimate for every day. Day 1 is about 6 to 10 hours in as many sittings as you like, because it holds your three assessments. Most other days are under an hour.",
      },
      {
        heading: "It is a path, not a deadline",
        text: "After day 30 nothing closes. The day count stops and your steps stay there to finish at your own pace.",
      },
    ],
    tryIt: { label: "Open First 30 Days", href: "/first-30-days", task: "Find any step marked Focus for you, and see which week you are on." },
    questions: [
      { id: "c3-1", q: "A First 30 Days step will not tick off. What is the likely reason?", right: "The work is not saved on its own page yet", wrong: ["You need to tick it by hand", "Your AI key has expired", "Your plan does not include it"], why: "Steps tick from your real data, so the work has to be saved on its own page." },
      { id: "c3-2", q: "How do the two guides differ?", right: "First 30 Days ticks itself; you tick the Starter Guide yourself", wrong: ["They are the same page", "The Starter Guide is for team members only", "First 30 Days is for your clients"], why: "First 30 Days reads your data. The Starter Guide is the fuller checklist you tick yourself." },
      { id: "c3-3", q: "Why is a week locked?", right: "The week before it is not complete yet", wrong: ["You have not paid for it", "Its date has not arrived", "Your coach must open it"], why: "Each week opens once the one before it is complete." },
      { id: "c3-4", q: "What happens after day 30?", right: "Nothing closes, and your steps stay there to finish", wrong: ["The page disappears", "Your unfinished steps are deleted", "Your account is locked"], why: "The day count stops at 30, and your steps stay for you to finish at your own pace." },
    ],
  },
  {
    ...base,
    id: "c-connect",
    track: "client",
    title: "Connecting your tools and email",
    minutes: 7,
    summary: "Calendar, Stripe and the separate step that lets you email your contacts.",
    sources: ["integrations", "email-sending-setup"],
    sections: [
      {
        heading: "Integrations",
        text: "Under Settings > Integrations you connect your Google or Microsoft 365 calendar and email, and your own Stripe account. Connecting Stripe can change your scores, because the payments, fees and refunds it adds count toward your Finance dimension.",
      },
      {
        heading: "Emailing your contacts is a separate step",
        text: "Connecting Google or Microsoft does not email your contacts. Campaigns, broadcasts and booking emails go through your own Resend account, set up in Contacts > Email sending.",
      },
      {
        heading: "Three steps in Email sending",
        steps: [
          "Create a Resend account and connect it with an API key. Resend shows the key only once.",
          "Add a subdomain such as mail.yourbusiness.com, not your main domain, and add its records where you manage your domain.",
          "Fill in your From name, sign-off and Business mailing address, then press Save.",
        ],
      },
    ],
    tryIt: { label: "Open Email sending", href: "/contacts?tab=sending", task: "Read the top of the tab to see what is ready and what is still waiting." },
    questions: [
      { id: "c4-1", q: "You connected Google in Integrations. Can you now send campaigns to your contacts?", right: "No, campaigns need the Email sending setup with Resend", wrong: ["Yes, right away", "Yes, up to 100 a day", "Only to tagged contacts"], why: "Google or Microsoft does not email your contacts. That goes through your own Resend account." },
      { id: "c4-2", q: "Which domain should you use for sending?", right: "A subdomain, such as mail.yourbusiness.com", wrong: ["Your main domain", "A free Gmail address", "lccommandsuite.com"], why: "A subdomain keeps your everyday email untouched." },
      { id: "c4-3", q: "Besides a verified domain, what do campaigns and broadcasts also need?", right: "Your Business mailing address", wrong: ["A connected Stripe account", "A Google account", "A team member"], why: "Booking emails wait on Resend and a verified domain. Campaigns and broadcasts also need your mailing address." },
      { id: "c4-4", q: "You disconnect Stripe. What happens to payments already in your ledger?", right: "They stay in your ledger", wrong: ["They are removed", "They move to Backlog", "They are refunded"], why: "Disconnecting Stripe does not remove payments already in your ledger." },
    ],
  },
  {
    ...base,
    id: "t-joining",
    track: "team-ops",
    title: "Joining the team account",
    minutes: 5,
    summary: "Your invitation, your sign-in and why your menu looks the way it does.",
    sources: ["accepting-a-team-invitation", "signing-in-and-resetting-your-password", "team-access-limits"],
    sections: [
      {
        heading: "Your invitation",
        text: "Open the email called You're invited to join, press Set your password and choose one of at least 8 characters. The link works once and expires in 7 days. If it has expired, ask the person who invited you to send a fresh one.",
      },
      {
        heading: "Signing in",
        text: "Sign in at lccommandsuite.com/login. To reset your password, press Forgot or set your password?. That email link works once and lasts 24 hours. It comes from community@lccommandsuite.com, so check Other, Promotions and Spam if you do not see it.",
      },
      {
        heading: "What you can see",
        text: "The account owner sets each area to No access, View or Edit, and may add limits such as only your own tasks or no deleting. Changes apply the next time you open a page. If you need something you cannot reach, ask the owner.",
      },
    ],
    questions: [
      { id: "t1-1", q: "Your invitation link says it has expired. What do you do?", right: "Ask the person who invited you to send a fresh one", wrong: ["Create a new account", "Email the invitation back", "Wait 24 hours and try again"], why: "Invitation links are single-use and time-limited, so ask for a fresh one." },
      { id: "t1-2", q: "How long does a password reset link last?", right: "24 hours, and it works once", wrong: ["7 days", "One hour", "It never expires"], why: "A reset link works once and lasts 24 hours. The invitation link is the one that lasts 7 days." },
      { id: "t1-3", q: "A page a teammate uses is missing from your menu. Why?", right: "Team members see the areas they were given", wrong: ["Your browser needs updating", "The page was deleted", "Pages rotate each week"], why: "Each person sees the areas the owner gave them. Ask the owner if you need more." },
      { id: "t1-4", q: "The owner changes your access. When does it apply?", right: "The next time you open a page", wrong: ["The next day", "After you reset your password", "At the start of next month"], why: "Access changes apply the next time you open a page." },
    ],
  },
  {
    ...base,
    id: "t-team-rhythm",
    track: "team-ops",
    title: "How the team runs",
    minutes: 6,
    summary: "The Team Huddle and how SOPs keep work consistent.",
    sources: ["team-huddle", "playbook-sops"],
    sections: [
      {
        heading: "Team Huddle",
        text: "The weekly call lives in one page: a timed agenda, wins, hot topics, urgent items, and to-dos with an owner and a date. Open to-dos carry over to the next new huddle by themselves. A to-do sent to Tasks becomes a task.",
      },
      {
        heading: "Keeping to time",
        text: "If the minutes badge turns red, trim a section or move a topic to the Parking lot, which is not timed.",
      },
      {
        heading: "Playbook & SOPs",
        text: "An SOP is a tick-box checklist with an owner and tools. When you run the process, tick the steps. Press Start a fresh run to clear the ticks.",
      },
      {
        heading: "What Edited since approved means",
        text: "The wording changed after approval, so it needs approving again. Drafts and archived SOPs do not count toward the account's scores. SOPs in use do.",
      },
    ],
    tryIt: { label: "Open Playbook & SOPs", href: "/operations/sops", task: "Open an SOP and find its tick boxes and Start a fresh run." },
    questions: [
      { id: "t2-1", q: "A huddle to-do is not finished by the next call. What happens to it?", right: "It carries over to the next new huddle by itself", wrong: ["It is deleted", "It must be typed in again", "It is marked done"], why: "Open to-dos carry over to your next new huddle by themselves." },
      { id: "t2-2", q: "The minutes badge on the huddle turns red. What should you do?", right: "Trim a section or move a topic to the Parking lot", wrong: ["Start a new huddle", "Mark the huddle done", "Press Start again"], why: "Red means too many minutes are planned. The Parking lot is not timed." },
      { id: "t2-3", q: "You finished running a process and need to run it again. What do you press?", right: "Start a fresh run", wrong: ["Archive", "Edit", "New SOP"], why: "Start a fresh run clears the ticks so the checklist can be used again." },
      { id: "t2-4", q: "Which SOPs count toward the account's scores?", right: "SOPs in use, not drafts or archived ones", wrong: ["Every SOP, including drafts", "Only archived SOPs", "SOPs do not affect scores"], why: "Drafts and archived SOPs do not count. SOPs in use feed the scores." },
    ],
  },
  {
    ...base,
    id: "t-someone-elses-account",
    track: "team-ops",
    title: "Working inside someone else's account",
    minutes: 5,
    summary: "What stays with the owner, and how to be careful with their information.",
    sources: ["team-access-limits", "data-privacy", "ai-assistant-setup-and-your-key", "contacts"],
    sections: [
      {
        heading: "What stays closed",
        text: "Billing, API keys, connected accounts and other members' details stay closed to team members, whatever areas you were given.",
      },
      {
        heading: "What only the owner does",
        text: "Only the account owner can export the contact list or download a backup of the account.",
      },
      {
        heading: "AI on the owner's key",
        text: "Team members use the owner's AI key, and the owner can set a monthly limit for each person. Your assistant acts only within the areas you have.",
      },
    ],
    questions: [
      { id: "t3-1", q: "Which of these can a team member never see, whatever their access?", right: "Billing and API keys", wrong: ["Tasks", "Help", "Their own profile"], why: "Billing, API keys, connected accounts and other members' details always stay closed." },
      { id: "t3-2", q: "Someone asks you for a spreadsheet of all contacts. What do you do?", right: "Ask the account owner, because only they can export the list", wrong: ["Copy the list by hand", "Press Export contacts yourself", "Ask the assistant to email it"], why: "Only the account owner can export the contact list." },
      { id: "t3-3", q: "Whose AI key do you use as a team member?", right: "The account owner's", wrong: ["Your own", "LifeCharter's", "None, team members have no AI"], why: "Team members use the owner's key, and the owner can set a monthly limit." },
      { id: "t3-4", q: "Can you download a full backup of the account?", right: "No, only the owner can", wrong: ["Yes, from Settings", "Yes, if you are an Editor", "Yes, once a month"], why: "Only the account owner can download a backup." },
    ],
  },
  {
    ...base,
    id: "s-outreach",
    track: "team-sales",
    title: "Outreach Pipelines",
    minutes: 7,
    summary: "How DMs are tracked, and why the Suite never sends them for you.",
    sources: ["outreach-pipelines", "add-people-to-an-outreach-pipeline"],
    sections: [
      {
        heading: "One person per card",
        text: "Outreach Pipelines are boards for your DMs and other outreach. Drag a card to its next stage and its follow-up, tag and timeline update on their own.",
      },
      {
        heading: "You send every message",
        text: "Platforms do not let any app read or send DMs. Choose a DM on the card, fill in anything in [brackets], press Copy message and Open their profile, then paste and send it yourself. Press I sent it so it is logged.",
      },
      {
        heading: "Scripts must be approved",
        text: "A script must be approved in Scripts & Templates to show in the Choose a DM to send menu.",
      },
      {
        heading: "Adding many people",
        text: "Add people faster lets you paste a list or upload a spreadsheet. Anyone already on that pipeline is skipped. An upload does not add anyone to marketing contacts, and anyone unsubscribed or marked Do Not Contact is left out.",
      },
      {
        heading: "Booked",
        text: "Moving a card to a Booked stage adds the person to the Pipeline as a deal.",
      },
    ],
    tryIt: { label: "Open Outreach Pipelines", href: "/dm-pipeline", task: "Open a card and find Choose a DM to send." },
    questions: [
      { id: "s1-1", q: "Does the Suite send your DMs?", right: "No, you paste and send each one, then press I sent it", wrong: ["Yes, automatically", "Yes, once approved", "Only on LinkedIn"], why: "Platforms do not let any app send DMs. You send it yourself and log it with I sent it." },
      { id: "s1-2", q: "A script is missing from Choose a DM to send. Why?", right: "It has not been approved in Scripts & Templates", wrong: ["It is too long", "The person has no email", "The pipeline is full"], why: "Only approved scripts show in that menu." },
      { id: "s1-3", q: "You move a card to a Booked stage. What happens?", right: "The person is added to the Pipeline as a deal", wrong: ["An email goes out", "The card is deleted", "They get an invoice"], why: "A Booked stage adds the person to your Pipeline as a deal." },
      { id: "s1-4", q: "You upload a list. Do those people get marketing emails?", right: "No, an upload does not add them to marketing contacts", wrong: ["Yes, right away", "Yes, after one day", "Only if they have a tag"], why: "An upload does not add anyone to marketing contacts." },
    ],
  },
  {
    ...base,
    id: "s-booking",
    track: "team-sales",
    title: "Calendars and bookings",
    minutes: 6,
    summary: "Booking links, hosts, and what to press after a call.",
    sources: ["calendars-and-booking-pages"],
    sections: [
      {
        heading: "Three tabs",
        text: "Calendars has Bookings, Calendars and Hosts. Booking links check each host's real calendars, send reminders and put every booking in Contacts.",
      },
      {
        heading: "After every meeting",
        text: "Open the Bookings tab, press Past 30 days and press Attended or No-show. No-show can send the follow-up email written on that calendar, with a button to choose a new time.",
      },
      {
        heading: "Deals and bookings",
        text: "A calendar can add each booking to the Pipeline as a deal. If someone cancels or does not show, the deal moves to Lost. If they book again it reopens. Mark it Won in the Pipeline when they buy.",
      },
      {
        heading: "Sharing calls",
        text: "To share calls among hosts, choose Round robin among the hosts ticked under Who takes these calls.",
      },
    ],
    tryIt: { label: "Open Calendars", href: "/calendars", task: "Open the Bookings tab and press Past 30 days." },
    questions: [
      { id: "s2-1", q: "A meeting has ended. What do you press, and where?", right: "Attended or No-show, on the Bookings tab", wrong: ["Mark done, on Tasks", "Approve, on Waiting for my approval", "Nothing, the Suite knows"], why: "After a meeting, open the Bookings tab, press Past 30 days and press Attended or No-show." },
      { id: "s2-2", q: "Someone with a deal does not show up. What happens to the deal?", right: "It moves to Lost, and reopens if they book again", wrong: ["It is deleted", "It moves to Won", "Nothing changes"], why: "A no-show moves the deal to Lost. It reopens if they book again." },
      { id: "s2-3", q: "How do two people share the calls on one calendar?", right: "Choose Round robin among the hosts ticked", wrong: ["Make two accounts", "Share one password", "Create a project"], why: "Round robin among the hosts ticked shares calls across each host you tick." },
      { id: "s2-4", q: "Someone buys after a call. What do you do with their deal?", right: "Mark it Won in the Pipeline", wrong: ["Delete the deal", "Press Attended again", "Leave it, because the booking closes it"], why: "Mark it Won in your Pipeline when they buy." },
    ],
  },
  {
    ...base,
    id: "s-after-the-call",
    track: "team-sales",
    title: "After the conversation",
    minutes: 6,
    summary: "Keeping the record and the deal honest after every call.",
    sources: ["lc-volant", "contact-record", "pipeline"],
    sections: [
      {
        heading: "Log it on the deal",
        text: "Open the deal and log the call under Calls and follow-ups, then press Log it on this deal. Calls and follow-ups you log feed the Sales dimension, and their Won and Lost outcomes set the win rate.",
      },
      {
        heading: "Note it on the person",
        text: "On the contact record, type under Add a note and press Save note. Schedule a follow-up so it becomes a task.",
      },
      {
        heading: "Turn a recording into a report",
        text: "LC Volant turns a recording or transcript into a report. Tick the box that everyone agreed to be recorded first, because it is required. Nothing goes to Tasks, Reminders or your calendar until you press the button on that item, and nothing is sent to the client.",
      },
    ],
    questions: [
      { id: "s3-1", q: "Why log calls on a deal?", right: "They feed the Sales dimension and set the win rate", wrong: ["They send the person a recap", "They create an invoice", "They are only for your own notes"], why: "Logged calls are sales activities. They feed the Sales dimension, and their outcomes set the win rate." },
      { id: "s3-2", q: "What must you tick before recording in LC Volant?", right: "That everyone agreed to be recorded", wrong: ["That the deal is Won", "That the contact has a tag", "That your AI key is new"], why: "The consent box is required before you record, upload or write a report." },
      { id: "s3-3", q: "LC Volant writes a report. Does it go to the client?", right: "No, nothing is sent", wrong: ["Yes, automatically", "Yes, after you approve it in chat", "Only if they have a portal"], why: "Nothing is sent. Copy report copies it without the private notes for you to share." },
      { id: "s3-4", q: "You want to remember to call someone back on Friday. What should you do on the record?", right: "Schedule a follow-up for Friday, which becomes a task", wrong: ["Add a tag", "Add a custom field", "Change their email"], why: "A scheduled follow-up becomes a task for that day." },
    ],
  },
  {
    ...base,
    id: "f-exam",
    track: "core",
    kind: "exam",
    title: "Foundations exam",
    minutes: 12,
    summary: "Ten questions on real situations. Pass with 80% to earn your Foundations certificate.",
    sources: ["how-your-scores-work", "tasks", "reminders", "what-your-assistant-can-do-for-you", "contacts", "pipeline", "travel-partner", "daily-compass", "left-menu", "waiting-for-my-approval"],
    sections: [
      {
        heading: "How the exam works",
        text: "The exam covers the core Foundations lessons. Answer every question, then press Check my answers. You need 80% to pass. It shows which questions you missed without giving the answers, so go back to the lessons and try again. Retakes are unlimited.",
      },
    ],
    questions: [
      { id: "fx-1", q: "A new client's overall score is 38. How should you describe that?", right: "They are in the Survival phase, and it is a starting point to improve from", wrong: ["They are in the Growth phase", "The score must be wrong because AI set it", "They should type in a higher number"], why: "" },
      { id: "fx-2", q: "A dimension says partial. What does it mean?", right: "Some inputs are still pending, and the score uses what is there", wrong: ["The score is half of the real number", "The dimension is broken", "An assessment was deleted"], why: "" },
      { id: "fx-3", q: "An old assessment shows getting stale. What does that do to the score?", right: "It still counts, and the mark is a nudge to refresh it", wrong: ["It drops to zero", "It is removed from the score", "The account locks"], why: "" },
      { id: "fx-4", q: "You are waiting on a vendor's answer before you can finish a task. What is the right move?", right: "Move it to Waiting, with who and a Check back date", wrong: ["Delete it and add it again later", "Drag it into Overdue", "Mark it done"], why: "" },
      { id: "fx-5", q: "Which of these should be a reminder rather than a task?", right: "A one-off note to cancel a trial on a set date", wrong: ["Writing this month's newsletter", "Building a landing page", "Calling five leads as part of a project"], why: "" },
      { id: "fx-6", q: "A due date passed on a task and the work never happened. What does that do?", right: "It lowers task follow-through", wrong: ["Nothing, due dates never count", "It raises task follow-through", "It deletes the task"], why: "" },
      { id: "fx-7", q: "You save a new contact whose email is already in your list. What happens?", right: "It updates that person and tells you so", wrong: ["It makes a second copy", "It deletes the first record", "It refuses and loses what you typed"], why: "" },
      { id: "fx-8", q: "A deal is worth $1,000 at 50% odds. What does it add to Weighted by probability?", right: "$500", wrong: ["$1,000", "$50", "$1,500"], why: "" },
      { id: "fx-9", q: "You want your assistant's approval cards all in one place. Where do you look?", right: "Waiting for my approval", wrong: ["Help & Q&A", "Settings > Billing", "The Glossary"], why: "" },
      { id: "fx-10", q: "You press Edit on an assistant card. What happens?", right: "You say what to change, and it prepares a corrected card to approve", wrong: ["The action runs straight away", "You rewrite the card by hand", "The card is thrown away"], why: "" },
    ],
  },
];
