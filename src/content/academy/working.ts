import type { Lesson } from "@/lib/academy/types";

// Working Knowledge: written from the User Guide entries named in each lesson's sources. Change the app and the matching
// lesson must change too: see "Update et al" in CLAUDE.md. The first answer in each question is held in `right`; the
// page shuffles the order.
const base = { level: "working" as const, kind: "lesson" as const };

export const WORKING: Lesson[] = [
  {
    ...base,
    id: "w-start-day",
    track: "core",
    title: "Starting your day with what matters",
    minutes: 8,
    summary: "Your Morning Brief, Today's Schedule, the Inbox card and Quick Wins.",
    sources: ["morning-brief", "todays-schedule", "inbox", "quick-wins"],
    sections: [
      {
        heading: "Your Morning Brief",
        text: "This page is not in the left menu. Open it from the Your Morning Brief card on Executive Home. Your assistant writes a short briefing each time you open it, using the AI key, and the rest of the page still works without a key. Where to focus today shows up to six tasks from your Today list. Carried over from earlier shows up to six open tasks that are not in Today.",
      },
      {
        heading: "Today's Schedule",
        text: "This Executive Home card puts your day in time order: calendar events, timed tasks and today's recurring tasks. Give a task a time of day and it appears here, even with no calendar connected. You can look up to 60 days ahead, but recurring tasks show on today only. To change a meeting, open your calendar with the link on the card.",
      },
      {
        heading: "The Inbox card",
        text: "Microsoft 365 mail shows here to read, search, reply to and sort. Gmail connects for sending only, so read your Gmail in Gmail itself. Only the account owner can connect an account, and team members do not see the owner's mail here.",
      },
      {
        heading: "Quick Wins",
        text: "Quick Wins sit at the bottom of Daily Compass. You start with ten: six send a ready-made email and four add a task to today. A win stays on your list so you can use it again.",
      },
      {
        heading: "Sending a Quick Win",
        steps: [
          "Press a win marked Send, then search your contacts and pick the person.",
          "Read the email, change anything you like, and fill in any parts in [square brackets].",
          "Press Send it. If sending is not set up yet, press Copy, send it from your own email, then press I sent it myself.",
        ],
      },
      {
        heading: "What a sent win logs",
        text: "Both ways log the same three things: a completed task for today, an Email on Sales Activities, and a note on that person's timeline. The email carries the account owner's first name, even when a team member sends it.",
      },
    ],
    tryIt: { label: "Open Daily Compass", href: "/daily-compass", task: "Scroll to Quick Wins at the bottom of the page and find one marked Send and one marked Add.", question: "Which Quick Win would help your business most this week, and who is it for?" },
    questions: [
      { id: "w1-1", q: "You cannot find your Morning Brief in the left menu. Where do you open it?", right: "From the Your Morning Brief card on Executive Home", wrong: ["From Settings", "From the bell", "From the Tasks page"], why: "The Morning Brief is not in the left menu. You open it from its card on Executive Home." },
      { id: "w1-2", q: "You want a task to appear in Today's Schedule, but no calendar is connected. What do you do?", right: "Give the task a time of day", wrong: ["Connect a calendar first, because it is required", "Add it as a reminder", "Move it to In Progress"], why: "A task with a time of day appears in Today's Schedule, even with no calendar connected." },
      { id: "w1-3", q: "Why can't you see your Gmail messages on the Inbox card?", right: "Gmail connects for sending only, so you read it in Gmail itself", wrong: ["You need to pay for an add-on", "You have to turn on two-factor sign-in first", "Gmail messages take a day to appear"], why: "The Suite cannot read a Gmail inbox. Only Microsoft 365 mail shows on the card to read." },
      { id: "w1-4", q: "You send a Quick Win email to a past client. What gets logged?", right: "A completed task, an Email on Sales Activities and a note on their timeline", wrong: ["Nothing, because Quick Wins are not tracked", "A new deal on the Pipeline", "Only a note on their timeline"], why: "A Send win logs those three things, and I sent it myself logs the same three." },
      { id: "w1-5", q: "A team member sends a Quick Win email. Whose first name is on it?", right: "The account owner's", wrong: ["The team member's", "The contact's", "LifeCharter's"], why: "The email carries the account owner's first name, even when a team member sends it." },
    ],
  },
  {
    ...base,
    id: "w-routines",
    track: "core",
    dimension: "operations",
    title: "Your routines and your week",
    minutes: 7,
    summary: "Recurring tasks, Weekly View and catching things with Quick Capture.",
    sources: ["recurring-tasks", "weekly-view", "quick-capture"],
    sections: [
      {
        heading: "Setting up a recurring task",
        steps: [
          "On Executive Home, find the Priority Tasks card and press the + beside RECURRING.",
          "Type a title, then choose Every day, On certain days of the week or Once a month.",
          "Add a time of day if you want one, and choose Due by this time or Do it at this time.",
          "Pick a priority and press Add recurring task.",
        ],
      },
      {
        heading: "What the RECURRING column shows",
        text: "It shows only what is due today, and you tick each one off for the day. Press the + to see them all. Editing a recurring task keeps the days you already ticked off. A task set for the 31st lands on the last day of shorter months.",
      },
      {
        heading: "How routines count",
        text: "Having routines set counts toward your Internal Process & Culture pillar. It looks at how many recurring tasks you have set up, not how many you tick off.",
      },
      {
        heading: "Weekly View",
        text: "Your real week, Monday to Sunday, with your Day Streak, Weekly Goals and a Week Summary. One small thing keeps a day active: finish a task, check off a recurring task, log a call or follow-up, or publish a post. Press Set goals to change your targets, which live in Sales Activities. Posting goals live in the Content Calendar.",
      },
      {
        heading: "Quick Capture",
        text: "A phone-friendly page for the two things you jot down when you are away from your desk: a task, or money in or out. A task with no due date goes straight to Today. Money goes into your Finance records. If an expense looks like a bill you already track, the page offers to link them so nothing is counted twice.",
      },
    ],
    tryIt: { label: "Open Weekly View", href: "/daily-compass/weekly", task: "Find your Day Streak and your Weekly Goals, then look back at last week with the arrows.", question: "What one routine would make the biggest difference to your business if you did it every week?" },
    questions: [
      { id: "w2-1", q: "A routine does not show in the RECURRING column today. What is the likely reason?", right: "It is not due today, because the column shows only what is due today", wrong: ["It was deleted overnight", "It has no priority set", "You did not tick it yesterday"], why: "The column shows only what is due today. Press the + beside RECURRING to see them all." },
      { id: "w2-2", q: "What does your Internal Process & Culture pillar look at for routines?", right: "How many recurring tasks you have set up", wrong: ["How many you ticked off this week", "How long each one takes", "How early you tick them"], why: "It counts how many recurring tasks you have set up, not how many you tick off." },
      { id: "w2-3", q: "You set a task to repeat on the 31st. What happens in a shorter month?", right: "It lands on the last day of that month", wrong: ["It skips that month", "It moves to the 1st of the next month", "It turns itself off"], why: "A task set for the 31st lands on the last day of shorter months." },
      { id: "w2-4", q: "Which of these keeps a day active on your Weekly View?", right: "Logging a call", wrong: ["Opening Executive Home", "Reading your Morning Brief", "Changing your text size"], why: "A day is active when you finish a task, check off a recurring task, log a call or follow-up, or publish a post." },
      { id: "w2-5", q: "You capture a task on your phone with no due date. Where does it go?", right: "Straight to Today", wrong: ["To Backlog", "To your calendar", "To Overdue"], why: "A task with no due date goes straight to Today." },
    ],
  },
  {
    ...base,
    id: "w-time-projects",
    track: "core",
    title: "Tracking time and bringing projects in",
    minutes: 7,
    summary: "The timer, capacity and rates, and importing a project from another tool.",
    sources: ["time", "import-a-project"],
    sections: [
      {
        heading: "Tracking your time",
        text: "Under Start a timer, choose a client, project or task if you like, say what you worked on and press Start. All three are optional, so you can start first and stay focused. You can have one timer running at a time. Billable is ticked unless you untick it. Forgot the timer? Use Add time by hand.",
      },
      {
        heading: "Capacity and rates",
        text: "Set the hours you want to work each week, a default hourly rate and any separate client rates. Until you do, the page uses a 30-hour week. Rates apply to new entries, so changing a rate does not change time you already tracked.",
      },
      {
        heading: "Reading your week",
        text: "Each person runs their own timer. Untick Only my time to see everyone's entries for that week. Download CSV gives you the week on screen, so choose the week and the Only my time box first. Time does not change your scores.",
      },
      {
        heading: "Importing a project",
        steps: [
          "Open Projects and press Import a project.",
          "Export the project from your other tool. The window shows how for each one.",
          "Press Choose a file, or paste your list and press Read what I pasted.",
          "Check where each column goes, name the project and look over the first tasks.",
          "Press the Import button, then Open the project.",
        ],
      },
      {
        heading: "Before you import",
        text: "Check the dates. An open task that arrives with a past due date counts as slipped until you finish it or change its date. Each import creates one new project and leaves everything else alone. Export one project at a time. Each import takes up to 5 MB and 2,000 tasks. Save an Excel file as a CSV first, or paste the cells.",
      },
    ],
    tryIt: { label: "Open Time", href: "/time", task: "Find Capacity and rates and see how many hours a week are set.", question: "How many hours a week do you want to work in your business, and what should most of them go to?" },
    questions: [
      { id: "w3-1", q: "You raise your hourly rate. What happens to time you already tracked?", right: "It does not change, because rates apply to new entries", wrong: ["It updates to the new rate", "It is marked Not billable", "It is deleted"], why: "Rates apply to new entries. Changing a rate does not change time you already tracked." },
      { id: "w3-2", q: "You never set a weekly target. What does the Time page use?", right: "A 30-hour week", wrong: ["A 40-hour week", "No target at all", "Whatever you worked last week"], why: "The page uses a 30-hour week until you change it under Capacity and rates." },
      { id: "w3-3", q: "You worked for an hour but forgot the timer. What do you do?", right: "Use Add time by hand", wrong: ["Start the timer and wait an hour", "Ask the owner to enter it", "Leave it out, because it cannot be added later"], why: "Add time by hand asks for the date, the time you started, and the hours and minutes." },
      { id: "w3-4", q: "You import a project with an open task due last month. What happens to it?", right: "It counts as slipped until you finish it or change its date", wrong: ["The Suite moves the date forward", "The task is left out of the import", "It never affects your follow-through"], why: "Check the dates before you import. An open task with a past due date counts as slipped." },
      { id: "w3-5", q: "Will importing a project change the projects you already have?", right: "No, it creates one new project and leaves everything else alone", wrong: ["Yes, it merges with your largest project", "Yes, it replaces the project with the same name", "Only if the dates overlap"], why: "Each import creates one new project and leaves everything else alone." },
    ],
  },
  {
    ...base,
    id: "w-contacts",
    track: "core",
    title: "Building a clean contact list",
    minutes: 9,
    summary: "Importing a list, keeping tags tidy, making forms and finding every link.",
    sources: ["import-contacts", "tag-library", "forms", "links-forms"],
    sections: [
      {
        heading: "Importing contacts",
        steps: [
          "Export your list from where it lives now, then open Contacts and press Import contacts.",
          "Drop in a CSV or vCard file, or press Paste from a spreadsheet instead.",
          "On Match your columns, check each column. Only the email is required.",
          "Read the counts and preview, keep or change the tag, and tick the box to confirm these people agreed to hear from you.",
          "Press the Import button and keep the page open until it finishes.",
        ],
      },
      {
        heading: "What an import does and does not do",
        text: "It never emails anyone or starts a campaign. People already in your contacts are merged, not copied, and anyone who unsubscribed stays unsubscribed. The Suite adds a tag with today's date so you can find the group afterward. Each import takes up to 5 MB and 5,000 contacts. Excel and Numbers files will not load, so save as CSV first or paste the cells.",
      },
      {
        heading: "Tag Library",
        text: "Every tag shows how many people carry it, what adds it and your own note on what it means. Rename changes the tag on your contacts only, so if a form, calendar or pipeline adds the old name, change it there too or the old tag will come back. Retire takes a tag off everyone and never removes anyone from Contacts. To make a new tag, add it on a contact or use it on a form, calendar or pipeline.",
      },
      {
        heading: "Making a form",
        steps: [
          "Open Contacts, press the Forms tab, type a name and press the plus button.",
          "List your fields, one per line, then press Save fields. Add * for required. Email is always included.",
          "Set the tags, the button text, the thank-you message and, if you like, a campaign to start.",
          "Press Preview to see what the person will see.",
          "Press the copy icon beside Share link and share it.",
        ],
      },
      {
        heading: "After someone fills it in",
        text: "Each submission saves the person as a contact and tags them. A campaign on the form only sends once Email sending is finished. Turn off stops new submissions, and Turn on brings the form back.",
      },
      {
        heading: "Links & Forms",
        text: "This page lists every checkout link, booking page, form and short link in one place, so you can search, copy or open one. It only lists them. Change a link where it lives. An offer shows here only once it has a saved checkout link.",
      },
    ],
    tryIt: { label: "Open Tag Library", href: "/tags", task: "Sort by Most people first and read what adds your largest tag.", question: "Which group of people in your business most needs its own tag, and what would you do with that list?" },
    questions: [
      { id: "w4-1", q: "Will importing 500 contacts email them?", right: "No, importing does not email anyone or start a campaign", wrong: ["Yes, they get a welcome email", "Yes, unless you untick a box", "Only those with a tag"], why: "Importing never emails anyone or starts a campaign." },
      { id: "w4-2", q: "Someone in your import unsubscribed earlier. What happens?", right: "They stay unsubscribed", wrong: ["They are subscribed again", "They are deleted", "The import stops"], why: "Anyone who unsubscribed stays unsubscribed. People already in your contacts are merged, not copied." },
      { id: "w4-3", q: "You rename a tag, and the old name comes back a week later. Why?", right: "A form, calendar or pipeline still adds the old name", wrong: ["Rename only lasts seven days", "Another contact typed it in the Tag Library", "The Tag Library resets each week"], why: "Rename changes the tag on your contacts only. Change it on the form, calendar or pipeline too." },
      { id: "w4-4", q: "You retire a tag. What happens to the people who had it?", right: "The tag comes off them, and they stay in Contacts", wrong: ["They are deleted from Contacts", "They are unsubscribed", "They are moved to a new tag"], why: "Retire takes the tag off everyone and never removes anyone from Contacts." },
      { id: "w4-5", q: "A new form has a campaign chosen, but no email has gone out. What is the likely reason?", right: "Email sending is not finished yet", wrong: ["Forms cannot start campaigns", "The form needs ten submissions first", "The share link has expired"], why: "A campaign only sends once your Email sending setup is finished." },
      { id: "w4-6", q: "A link is wrong on Links & Forms. Where do you change it?", right: "Where it lives, such as Offers & Packages, Calendars, Forms or Short Links", wrong: ["Right there on Links & Forms", "In Settings", "In the Tag Library"], why: "Links & Forms only lists them. Change a link where it lives." },
    ],
  },
  {
    ...base,
    id: "w-sales-log",
    track: "core",
    dimension: "sales",
    title: "Logging sales work and using scripts",
    minutes: 8,
    summary: "How Sales Activities feeds your scores, and how to make a script your own.",
    sources: ["sales-activities", "scripts-templates"],
    sections: [
      {
        heading: "Logging an activity",
        steps: [
          "Open Daily Compass and press Sales Activities under Quick Actions, or use the round + and choose Log a sale.",
          "Press Log activity. Choose the type and priority, add the contact, what it is about, the date and the value, then press Save.",
          "Set the outcome when you know it: Connected, No answer, Booked, Won, Lost or Nurture.",
          "Tick the circle on the activity when it is complete.",
        ],
      },
      {
        heading: "How it feeds your scores",
        text: "Activities dated in the last 30 days count toward your Sales dimension and your Customer Acquisition pillar. Won and Lost outcomes set your win rate, so set an outcome on every activity. Conversion is won activities divided by contacted ones, and contacted means any outcome other than No answer.",
      },
      {
        heading: "What logs itself",
        text: "A DM you log with I sent it on an Outreach Pipelines card is added here, and so is a Quick Win email you send from the Suite. The trash button deletes an activity straight away, with no second question.",
      },
      {
        heading: "Goals and reports",
        text: "Under This week vs. goals, type your weekly goal beside each type. Press Report and choose your dates, then press AI summary or CSV. Without an AI key you see the plain numbers.",
      },
      {
        heading: "Two script libraries",
        text: "The Starter Library has 200 scripts, emails and DMs. They are shared examples, so save one to My Library first to get your own copy to edit. What you save to My Library is private to your account.",
      },
      {
        heading: "Making a script yours",
        text: "Anything in [brackets] becomes a blank to fill in. Press Fill in & personalize, type in the blanks and check the Preview. You can ask your assistant to rewrite it, then press Save to My Library or Copy. A script marked Draft · not approved is not offered when you send DMs until you press Approve.",
      },
    ],
    tryIt: { label: "Open Sales Activities", href: "/daily-compass/sales-activities", task: "Find This week vs. goals and read what is set for each type.", question: "What weekly sales goal would stretch your business without overwhelming you?" },
    questions: [
      { id: "w5-1", q: "Which outcomes shape your win rate?", right: "Only Won and Lost", wrong: ["Every outcome you set", "Only Booked", "Connected and No answer"], why: "Only Won and Lost outcomes shape your win rate." },
      { id: "w5-2", q: "You sent a DM and pressed I sent it on the pipeline card. Do you also log it in Sales Activities?", right: "No, it is added there as a DM", wrong: ["Yes, it must be logged twice", "Yes, but only for Won deals", "No, because DMs are never counted"], why: "Each DM you log with I sent it is added here, so it counts toward your weekly DM total." },
      { id: "w5-3", q: "How far back do activities count toward your Sales dimension?", right: "The last 30 days", wrong: ["The last 7 days", "The last 90 days", "All time"], why: "Activities dated in the last 30 days count toward your Sales dimension and Customer Acquisition pillar." },
      { id: "w5-4", q: "You press the trash button on an activity by mistake. What happens?", right: "It is deleted straight away, with no second question", wrong: ["It asks you to confirm", "It moves to Archived", "It stays for 30 days"], why: "The trash button deletes an activity straight away." },
      { id: "w5-5", q: "You want to change the wording of a Starter Library script. What do you do first?", right: "Save it to My Library to get your own copy", wrong: ["Edit it where it is", "Ask support to change it", "Delete it and write a new one"], why: "Starter items are shared examples. Saving to My Library gives you your own copy to edit." },
      { id: "w5-6", q: "Your new script is marked Draft · not approved. What does that mean for your DMs?", right: "It is not offered when you send DMs until you press Approve", wrong: ["It goes out with a Draft label", "It is sent to the owner for review", "Nothing, because approval only affects emails"], why: "Drafts are not offered when you send DMs. Press Approve and it can be used." },
    ],
  },
  {
    ...base,
    id: "w-assistant-work",
    track: "core",
    title: "Giving your assistant real work",
    minutes: 8,
    summary: "Teaching it, keeping it beside you and handing it a task or reminder.",
    sources: ["ai-assistant", "pop-out-assistant", "have-my-assistant-work-on-this"],
    sections: [
      {
        heading: "What it answers from",
        text: "Your assistant answers from your assessments, scores, pillars, tasks, income, SOPs, plans and your next 7 days of calendar, plus the Help library and what you have taught it. Press Teach to tell it about you, your team and how you work. Answers flagged as sensitive are never included, and your logins vault is never available to it.",
      },
      {
        heading: "Conversations and voice",
        text: "New conversation starts the chat fresh and saves the old one under Past conversations. It still knows your account, your notes and your settings. The microphone and speaker use your browser's own speech tools, so they need no key.",
      },
      {
        heading: "Pop it out",
        text: "Press Pop out on the AI Assistant card and it floats over any page. It knows which page you are on, and it is the same conversation as the card. Drag it by its title bar, shrink it with the minimize button, and press Bring back to Executive Home when you are done.",
      },
      {
        heading: "Have my assistant work on this",
        steps: [
          "Put the details in the task's notes or the reminder's note first. Your assistant reads all of it.",
          "Open Tasks or Reminders and press Have my assistant work on this on the item.",
          "Keep working while it opens in its floating window and gets started.",
          "Review each card it prepares, and press Approve, Edit or Cancel.",
          "Read the report, then open Waiting for my approval for your next steps.",
        ],
      },
      {
        heading: "The report",
        text: "Only the report saves on its own, as a note on the item, and you can Undo that. It sums up where things stand and marks each next step Suite, Assistant, You, or You + assistant. Everything else waits for your Approve, and it never sends anything without you. A team member in the Sales role does not get this button on tasks.",
      },
      {
        heading: "What it can and cannot check",
        text: "It cannot read LinkedIn, Instagram, Facebook or WhatsApp, so a DM reply only shows once you have moved that person to a reply stage on your Outreach Pipeline. It can check replies to an email campaign only if a Microsoft 365 inbox is connected.",
      },
    ],
    tryIt: { label: "Open Tasks", href: "/tasks", task: "Open a task and find Have my assistant work on this, if your account has it.", question: "Which open job in your business could your assistant start on, and what details would it need from you?" },
    questions: [
      { id: "w6-1", q: "You start a new conversation. Does your assistant forget you?", right: "No, it still knows your account, your notes and your settings", wrong: ["Yes, everything is erased", "Yes, until you press Teach again", "It forgets your plans only"], why: "Only the chat on the card starts fresh. The old one is saved under Past conversations." },
      { id: "w6-2", q: "Can your assistant read your logins vault?", right: "No, the vault is never available to it", wrong: ["Yes, if you approve it", "Yes, for the account owner", "Only the login names"], why: "Your logins vault is never available to your assistant, and answers flagged as sensitive are never included." },
      { id: "w6-3", q: "Is the pop-out window a different conversation from the card?", right: "No, it is the same saved conversation", wrong: ["Yes, each page has its own", "Yes, it is erased when you close it", "Yes, it has no Approve cards"], why: "It reads the same saved conversation as the card, with the same Approve cards." },
      { id: "w6-4", q: "What should you do before pressing Have my assistant work on this?", right: "Put the details in the task's notes or the reminder's note", wrong: ["Mark the task done", "Move the task to Waiting", "Turn on two-factor sign-in"], why: "Your assistant reads the whole item, so details in the notes give it what it needs." },
      { id: "w6-5", q: "Do you have to approve your assistant's report?", right: "No, it saves itself as a note on the item", wrong: ["Yes, or it is thrown away", "Yes, and it is emailed to you first", "Only on reminders"], why: "The report saves itself. What needs you is the checklist inside it and any cards it prepared." },
      { id: "w6-6", q: "Your assistant says nobody replied to your DMs, but someone did. Why?", right: "It cannot read social apps, so a reply shows only once you move that person to a reply stage", wrong: ["Its AI key has expired", "DMs take a week to appear", "It only reads replies on LinkedIn"], why: "It reads your Outreach Pipelines, not LinkedIn, Instagram, Facebook or WhatsApp." },
    ],
  },
  {
    ...base,
    id: "w-agreements",
    track: "core",
    title: "Agreements with LC Plume",
    minutes: 8,
    summary: "Writing a document, sending it for signature and fixing a problem.",
    sources: ["lc-plume"],
    sections: [
      {
        heading: "From draft to signature",
        steps: [
          "Under New, choose Agreement or Proposal, pick a choice under Start from and press Create.",
          "Write the document, or press Upload a PDF or Word file. Fill every blank in the Fill in the blanks box.",
          "Under Signers, add each person's full name and email in the order they should sign. Tick I sign too if you sign last.",
          "Add a Sign by date or a Note in the email if you want them, then press Save.",
          "Press Preview and send, check what each signer will see, then press Looks right, send for signature.",
          "When everyone has signed, press Download signed PDF.",
        ],
      },
      {
        heading: "Starting points",
        text: "There are four starter templates: coaching agreement, contractor agreement, NDA and proposal. Have your attorney review any starter template before you use it. Press Save as my template to keep your own wording. On a proposal, the signer sees the amount as Investment.",
      },
      {
        heading: "What your signer does",
        text: "They get an email with a private link and press Email me a code. The 6-digit code lasts 15 minutes and allows 5 tries. Then they agree to sign electronically and type or draw their signature, or press Decline to sign and give a reason.",
      },
      {
        heading: "While it is out",
        text: "Signers get a reminder after 3 days, then every 3 days. Remind now sends one straight away. Resend sends a fresh private link and the old one stops working. If the signer gave you the wrong email, use Send to a different email. If a Sign by date passes, the document expires.",
      },
      {
        heading: "Fixing a sent document",
        text: "A document cannot be changed once it is sent. Void it, press Make a copy, fix the copy and send that. Only a draft can be deleted, because sent documents are kept for the record.",
      },
      {
        heading: "The signed copy",
        text: "When everyone has signed, the sealed PDF is emailed to every signer and to you, with a signature page and a certificate of completion. Your assistant can draft an agreement or proposal behind Approve, but it never sends one. You read it and send it yourself.",
      },
    ],
    tryIt: { label: "Open LC Plume", href: "/agreements", task: "Look at the choices under New and Start from. Do not send anything.", question: "Which agreement does your business use most often, and what wording do you want to keep every time?" },
    questions: [
      { id: "w7-1", q: "You cannot press Preview and send. What is the usual reason?", right: "A blank is still empty", wrong: ["Your AI key is missing", "The document is too long", "Stripe is not connected"], why: "Fill each blank in the Fill in the blanks box. The Preview window also lists anything else to fix." },
      { id: "w7-2", q: "You spot a mistake in a document already out for signature. What do you do?", right: "Void it, press Make a copy, fix the copy and send that", wrong: ["Edit it where it is", "Delete it and start again", "Ask the signer to cross it out"], why: "A document cannot be changed once it is sent, and only a draft can be deleted." },
      { id: "w7-3", q: "A signer gave you the wrong email address. What do you press?", right: "Send to a different email, under Signers", wrong: ["Void, then delete the document", "Remind now", "Download signed PDF"], why: "Send to a different email sends it to the right address, and the old link stops working." },
      { id: "w7-4", q: "Your assistant drafted a proposal. Who sends it?", right: "You do, after you read it", wrong: ["Your assistant, on Approve", "LifeCharter support", "It sends itself after 3 days"], why: "The draft waits behind Approve, and your assistant never sends it." },
      { id: "w7-5", q: "A signer's code stopped working after a while. How long does it last?", right: "15 minutes", wrong: ["24 hours", "7 days", "3 days"], why: "The 6-digit code lasts 15 minutes and allows 5 tries." },
    ],
  },
  {
    ...base,
    id: "w-your-settings",
    track: "core",
    title: "Your settings, your safety and your phone",
    minutes: 8,
    summary: "The choices that are yours alone, keeping your sign-in safe and using the Suite on a phone.",
    sources: ["profile", "notifications", "appearance-and-text-size", "security", "logins-passwords", "use-it-on-your-phone"],
    sections: [
      {
        heading: "Profile",
        text: "Each person has their own photo, name, phone, bio and time zone. Your time zone saves as soon as you pick it. Press Save Changes for your name, phone and bio. To change the email you sign in with, write to support@lccommandsuite.com.",
      },
      {
        heading: "Notifications",
        text: "Under Task reminders, choose how long before a timed task is due you want a reminder, and tick and by email if you want that too. Changes save as you make them. Emails for sign-ups, bookings and registrations are set on each form, calendar and campaign, not here. The once-a-day attention email goes to the account owner.",
      },
      {
        heading: "Appearance",
        text: "Choose a theme, a color scheme, a font size and Compact mode. Your choices save as you press them. Font size follows you to other devices and makes the left menu bigger too. Your theme, color scheme and compact mode stay on the device you set them on.",
      },
      {
        heading: "Security",
        text: "Change your password here, and turn on two-factor with an authenticator app such as Google Authenticator, 1Password or Authy. Lost a device or used a shared one? Press Sign out other devices. It signs you out everywhere except where you are now.",
      },
      {
        heading: "Logins & Passwords",
        text: "This is your private vault for other logins, and your teammates cannot open it. Enter your Suite password to open it. It stays open for 15 minutes, and Show hides itself after 20 seconds. Adding, editing and deleting each ask for your Suite password again. A deleted login cannot be brought back. Please do not store bank card numbers or government ID numbers here.",
      },
      {
        heading: "On your phone",
        text: "You add the Suite from your phone's browser, not an app store. On iPhone in Safari, tap Share, then Add to Home Screen. On Android in Chrome, tap the three-dot menu, then Install app. Press and hold the icon for shortcuts to Quick capture, Daily Compass and your tasks.",
      },
    ],
    tryIt: { label: "Open Security", href: "/settings?tab=security", task: "See whether two-factor is on for your sign-in. Change nothing unless you want to.", question: "Which login would hurt your business most if it were lost, and how is it protected today?" },
    questions: [
      { id: "w8-1", q: "You set your font size to Large on your computer. What happens on your phone?", right: "It follows you, because font size is saved to your account", wrong: ["Nothing, because every setting stays on one device", "The phone goes to dark mode", "You must set it again in Quick Capture"], why: "Font size follows you. Theme, color scheme and compact mode stay on the device you set them on." },
      { id: "w8-2", q: "You used a shared computer and forgot to sign out. What do you press?", right: "Sign out other devices, under Security", wrong: ["Update Password only", "Lock now, in your vault", "Turn off 2FA"], why: "Sign out other devices signs you out everywhere except where you are now." },
      { id: "w8-3", q: "You delete a login from your vault. Can you get it back?", right: "No, it is gone for good", wrong: ["Yes, from Archived", "Yes, for 30 days", "Yes, support can restore it"], why: "Delete removes the login and its saved password for good, so it asks for your Suite password first." },
      { id: "w8-4", q: "How do you put the Suite on your phone?", right: "Add it from your phone's browser", wrong: ["Download it from the app store", "Ask support for an install link", "Scan a code in Settings"], why: "There is no app store step. You add it from Safari on iPhone or Chrome on Android." },
      { id: "w8-5", q: "You want to change the email you sign in with. What do you do?", right: "Write to support@lccommandsuite.com", wrong: ["Type a new one on your Profile", "Change it in Notifications", "Ask your assistant to approve it"], why: "You cannot change it on the Profile page, so write to support." },
    ],
  },
  {
    ...base,
    id: "wc-records",
    track: "client",
    dimension: "finance",
    title: "Recording your money",
    minutes: 9,
    summary: "Income, expenses, receipts and bringing in a statement without counting anything twice.",
    sources: ["income", "expenses", "snap-a-receipt", "import-transactions"],
    sections: [
      {
        heading: "Adding income",
        text: "On the Finance Center, press Income Tracker, then Add income. Fill in Amount, Source / category and Date, and leave Date blank to use today. Fill in From each time, because that builds your By who paid you list. Income this month feeds your Finance dimension, measured against the monthly income goal you set in the Budget Planner.",
      },
      {
        heading: "Do not count Stripe twice",
        text: "Payments made through a payment link on your connected Stripe add income for you. Check Recent income before adding one yourself.",
      },
      {
        heading: "Adding expenses",
        text: "On the Finance Center, press Expense Manager, then Add expense. Add Paid to, then choose One-time or Recurring. Always choose a category, because uncategorized expenses trigger a warning on Tax Preparation and in your bell. Choosing Recurring saves today's payment and puts the next renewal on your Bills & Cash Calendar.",
      },
      {
        heading: "Fixing an entry",
        text: "To fix an entry, press the pencil. Delete happens right away with no second check on income. Deleting a recurring expense does not stop its bill. Use the trash icon on Bills & Cash Calendar for that.",
      },
      {
        heading: "Snap a receipt",
        text: "Press Snap a receipt, then take a photo or choose one. Your assistant fills in a draft, and nothing is saved until you check it and press Add. A JPG, PNG or WebP photo up to 8 MB works, and a PDF will not. A subscription receipt starts as One-time, so switch it to Recurring before you press Add.",
      },
      {
        heading: "Importing a statement",
        steps: [
          "Open Cash Flow Dashboard and press Import.",
          "Press Upload CSV / text, or paste your statement rows into the box.",
          "Press Parse with AI, then check each row and untick anything you do not want.",
          "Press Import to add the ticked rows to your Finance Center.",
        ],
      },
      {
        heading: "Imports do not catch duplicates",
        text: "Every row you import is added as new, so untick anything already in your Finance Center, such as Stripe payments. Imported rows have no Paid to name, so add it on the Expenses page if you need your 1099 totals. The Suite does not connect to QuickBooks. Export a CSV from it and bring that in here.",
      },
    ],
    tryIt: { label: "Open Expense Manager", href: "/finance/expenses", task: "Find Snap a receipt and look at your Recent expenses for anything with no category.", question: "Which money habit would keep your records most accurate: logging income, categorizing expenses or saving receipts, and when will you do it each week?" },
    questions: [
      { id: "wc1-1", q: "A client paid through your Stripe payment link. Do you add the income by hand?", right: "No, check Recent income first, because it adds itself", wrong: ["Yes, always", "Yes, but only at month end", "No, because Stripe money never reaches Finance"], why: "Payments through a payment link on your connected Stripe add income for you. Adding it again counts it twice." },
      { id: "wc1-2", q: "What happens when you choose Recurring on an expense?", right: "Today's payment is saved and the next renewal goes on your Bills & Cash Calendar", wrong: ["The Suite pays it for you", "Nothing is saved until the next renewal", "It is added to your budget as income"], why: "You do not need to add it to Bills & Cash Calendar too." },
      { id: "wc1-3", q: "An expense has no category. What happens?", right: "It triggers a warning on Tax Preparation and in your bell", wrong: ["It is deleted at month end", "The Suite picks a category and saves it", "Nothing, categories are only for looks"], why: "Uncategorized expenses trigger a warning, so always choose a category." },
      { id: "wc1-4", q: "You snap a photo of a receipt and close the form without pressing Add. What is saved?", right: "Nothing, so snap it again when you are ready", wrong: ["The expense, as a draft", "The photo, on Bills & Cash Calendar", "The expense, once you connect Stripe"], why: "No expense is saved until you check it and press Add." },
      { id: "wc1-5", q: "You import a bank statement that includes Stripe payments already in Finance. What should you do?", right: "Untick those rows, because the import does not catch duplicates", wrong: ["Nothing, the Suite removes duplicates", "Import it twice", "Disconnect Stripe first"], why: "Every row you import is added as new." },
    ],
  },
  {
    ...base,
    id: "wc-month",
    track: "client",
    dimension: "finance",
    title: "Reading your month",
    minutes: 8,
    summary: "The Finance Center, your bills, the Monthly Money Review and your Profit & Loss.",
    sources: ["finance-center", "bills-cash-calendar", "monthly-money-review", "profit-loss"],
    sections: [
      {
        heading: "The Finance Center",
        text: "The four tiles show Financial health, Income (MTD), Expenses (MTD) and Net (MTD). MTD means this month so far. Everything you record goes into one set of records, and every Finance page reads from it. Financial health is its own number, built from your profit margin this year and your expense budget. It is not one of your 12 dimensions.",
      },
      {
        heading: "Bills & Cash Calendar",
        text: "Add a bill with its name, Paid to, amount, next due date and how often. When it is paid, press Paid. That records the expense dated today and moves the bill to its next date. Give a bill an amount, because without one Paid moves the date but records no expense.",
      },
      {
        heading: "Why an autopay bill shows overdue",
        text: "The page cannot see your bank, so auto-renewing bills are not recorded for you. They stay on the calendar until you press Paid. Press the trash icon and confirm Stop tracking to remove a bill. Payments already recorded stay in your records.",
      },
      {
        heading: "Monthly Money Review",
        text: "A one-month snapshot: income, expenses, net and margin, plus your top five expense categories. Margin is the share of your income left after expenses. Set a monthly date to read this page. Read my month reads your recent months, not only the month you picked, so pick the current month if you want the page and the read to match.",
      },
      {
        heading: "Profit & Loss",
        text: "On the Finance Center, press Financial Reports. Choose Week, Month, Quarter, Year or Custom. CSV lists every transaction, which suits an accountant or bookkeeper, and PDF is the tidy statement. Who paid you and Who you paid show on screen only. They fill up when you enter From and Paid to.",
      },
    ],
    tryIt: { label: "Open Monthly Money Review", href: "/finance/monthly-review", task: "Read Where the money went for this month or last month.", question: "Where did your money go last month, and what one decision does that point to?" },
    questions: [
      { id: "wc2-1", q: "Is the Financial health number on the Finance Center one of your 12 dimensions?", right: "No, it is its own number", wrong: ["Yes, it is your Finance dimension", "Yes, it is your Operations dimension", "It is your overall score"], why: "It is built from your profit margin this year and your expense budget. The income and expenses behind it do feed your Finance dimension." },
      { id: "wc2-2", q: "Your autopay bill went through, but it shows overdue. Why?", right: "The page cannot see your bank, so you press Paid", wrong: ["Your Stripe account is disconnected", "The bill was paid twice", "It clears on its own at month end"], why: "Auto-renewing bills stay on the calendar until you press Paid." },
      { id: "wc2-3", q: "You press Paid on a bill with no amount. What happens?", right: "The date moves, but no expense is recorded", wrong: ["The Suite estimates the amount", "The bill is deleted", "It records an expense of zero and warns your bell"], why: "Give a bill an amount. Without one, Paid moves the date but records no expense." },
      { id: "wc2-4", q: "Which download suits your accountant, who wants every transaction?", right: "CSV", wrong: ["Print", "A screenshot of Who paid you", "The Monthly Money Review"], why: "CSV lists every transaction. PDF is the tidy statement." },
      { id: "wc2-5", q: "What is the margin on your Monthly Money Review?", right: "The share of your income left after expenses that month", wrong: ["Your income goal for the month", "The amount left in your bank", "Your expenses divided by your bills"], why: "Margin is the share of your income left after expenses. It only shows when the month has income." },
    ],
  },
  {
    ...base,
    id: "wc-get-paid",
    track: "client",
    dimension: "finance",
    title: "Selling your offers and getting paid",
    minutes: 10,
    summary: "Stripe, offers, payment links, invoices and paid bookings.",
    sources: ["connect-stripe", "offers-packages", "payment-links-on-offers", "payments-invoices", "paid-and-deposit-booking"],
    sections: [
      {
        heading: "Connect your own Stripe",
        text: "Open Settings, then Integrations, and press Connect with Stripe. Everything is made on your own Stripe account, so the money goes straight to you. Each morning your payments come into your Finance Center as income, and Stripe's fees and refunds come in as expenses. Your first sync looks back 90 days, and nothing comes in twice.",
      },
      {
        heading: "Offers & Packages",
        text: "One place for everything you sell. Press Add an offer, fill in the name, Format, Status, Price and How it's paid, then press Save offer. Choosing an offer on a deal fills in the deal value for you. To stop selling an offer but keep its history, set it to Retired instead of deleting it.",
      },
      {
        heading: "Making a payment link",
        steps: [
          "Press Edit on the offer, set the price and How it's paid, then press Save offer.",
          "Press Create payment link on the card. The words beside the button show what the buyer will be charged.",
          "Press Copy link and share it, or press Open to see what your buyer sees.",
        ],
      },
      {
        heading: "When the price changes",
        text: "Your link does not follow a price change. Press Remake, and the old link stops working. Turn off stops selling through the link. One-time is paid in full, Monthly charges every month until cancelled, and a Payment plan splits the price into 2 to 24 monthly payments and stops by itself.",
      },
      {
        heading: "Sending an invoice",
        steps: [
          "Open Payments & Invoices and press New invoice.",
          "Choose the Contact, pick an Offer if you want, and fill in What it's for and the Total amount.",
          "Choose Paid in full or a number of monthly payments, and set Due within (days).",
          "Press Send invoice. Stripe emails it from your own Stripe account.",
        ],
      },
      {
        heading: "What happens when someone pays",
        text: "It happens on its own. The payment appears on Payments & Invoices, the person gets the customer tag and a tag for the offer, the payment goes on their timeline, and their open deal moves to Won unless that deal is for a different offer. Void stops an invoice's link. Stop plan keeps what was paid and sends no more invoices.",
      },
      {
        heading: "Taking payment when they book",
        text: "On a calendar, under Payment when they book, choose Pay the full price to book or Pay a deposit to book, then press Save calendar. Their time is held for 30 minutes while they pay. To collect the rest of a deposit, send an invoice. The Suite does not refund people who cancel. You make any refund in your own Stripe account.",
      },
    ],
    tryIt: { label: "Open Offers & Packages", href: "/sales/offers", task: "Open your main offer and check its price and How it's paid.", question: "Which offer would you most like someone to be able to pay for today, and what is stopping that now?" },
    questions: [
      { id: "wc3-1", q: "Does the Suite hold your money?", right: "No, it goes straight to your own Stripe account", wrong: ["Yes, until the end of the month", "Yes, until the client's session is done", "Only for payment plans"], why: "Everything is made on your own Stripe account, so the money goes straight to you." },
      { id: "wc3-2", q: "You change an offer's price. What happens to its payment link?", right: "It keeps the old price until you press Remake", wrong: ["It updates by itself", "It stops working that day", "It charges the difference"], why: "Your link does not follow a price change. Press Remake, and the old link stops working." },
      { id: "wc3-3", q: "A payment plan reaches its last payment. What happens?", right: "It stops by itself", wrong: ["It keeps charging until cancelled", "You must press Stop plan", "It starts again at the first payment"], why: "A payment plan stops by itself after the last one. Monthly is the one that runs until cancelled." },
      { id: "wc3-4", q: "A client pays an invoice. Do you need to move their deal to Won?", right: "No, it moves on its own unless the deal is for a different offer", wrong: ["Yes, always", "Yes, and tag them by hand", "No, because deals never close from payments"], why: "A payment updates the contact, the timeline and the open deal on its own." },
      { id: "wc3-5", q: "You want to stop selling an offer but keep its history. What do you do?", right: "Set it to Retired", wrong: ["Delete it", "Set its price to zero", "Remove its name"], why: "Retired keeps the history. Use the Active, Draft, Retired and All buttons to see each group." },
      { id: "wc3-6", q: "Someone who paid to book cancels. How do they get a refund?", right: "You make it in your own Stripe account if your policy allows", wrong: ["The Suite refunds them on its own", "They press Refund on the booking page", "LifeCharter support sends it"], why: "You get an email saying what they paid, and any refund is yours to make." },
    ],
  },
  {
    ...base,
    id: "wc-plans",
    track: "client",
    dimension: "vision",
    title: "Writing your three plans",
    minutes: 9,
    summary: "The Business, Marketing and Sales Plans, and what really moves your scores.",
    sources: ["planning-hub", "business-plan", "marketing-plan", "sales-plan"],
    sections: [
      {
        heading: "Three plans, one way of working",
        steps: [
          "Open the plan. You start on the Build tab.",
          "Open a section and answer its questions.",
          "Press Draft with AI, or type the section yourself in Section content.",
          "Read it, change anything you like, then press Mark section complete.",
          "On the Goals tab, generate the plan's goals and set each goal's status as you go.",
        ],
      },
      {
        heading: "Start with the Foundational sections",
        text: "The Business Plan has nine sections and five are Foundational. The Marketing Plan and Sales Plan have seven each, and four are Foundational. Your Business Plan feeds every other plan, because your assistant reads it when it drafts them.",
      },
      {
        heading: "What moves your scores",
        text: "Your Business Plan feeds Vision, your Marketing Plan feeds Marketing and your Sales Plan feeds Sales. What counts is how many Foundational sections have text in them. Optional sections do not change it, and neither does marking a section complete. Goal statuses do not change your 12 dimensions.",
      },
      {
        heading: "Protect your wording",
        text: "Draft with AI saves straight into the section. Redraft with AI replaces what is there, so copy your wording somewhere first if you want to keep it. Changing the text of a finished section takes off its Complete mark. Pressing Regenerate on the Goals tab builds new goals, and every goal starts again at Not started.",
      },
      {
        heading: "Weekly sales targets",
        text: "On the Sales Plan, press Suggest my targets. Nothing is saved until you press Use as my weekly goals. They then become your weekly goals in Sales Activities.",
      },
      {
        heading: "The Planning Hub",
        text: "Press Brief me to hear where your plans stand. Press New Planning Session to schedule one. When the day comes, Start session runs it as a guided review, which counts as a finished review. A session closed with Done does not. Create Proposal drafts a proposal from your plans and numbers, and you choose whether to use or send it.",
      },
    ],
    tryIt: { label: "Open Planning Hub", href: "/planning", task: "Press a plan card and see which Foundational sections still need text.", question: "Which section of your plans would give you the most clarity if you wrote it this week?" },
    questions: [
      { id: "wc4-1", q: "You finish every Optional section of your Marketing Plan. Does your Marketing score change from that?", right: "No, only Foundational sections with text count", wrong: ["Yes, Optional sections count double", "Yes, once you mark them complete", "Only if you print the plan"], why: "What counts is how many of the four Foundational sections have text in them." },
      { id: "wc4-2", q: "You press Redraft with AI on a section you wrote. What happens to your text?", right: "It is replaced by a new draft and saved", wrong: ["It is kept beside the new draft", "Nothing, until you press Approve", "It moves to Past check-ins"], why: "Redraft replaces what is in the section. Copy your wording first if you want to keep it." },
      { id: "wc4-3", q: "You edit a section already marked Complete. What happens?", right: "The Complete mark comes off, so mark it again when you are happy", wrong: ["Your edit is refused", "The plan is deleted", "Nothing, the mark stays"], why: "Changing the text of a finished section takes off its Complete mark." },
      { id: "wc4-4", q: "You press Regenerate on the Goals tab. What happens to the goals' statuses?", right: "Every goal starts again at Not started", wrong: ["They all become Met", "They carry over to the new goals", "Slipped goals are kept and the rest removed"], why: "Regenerate builds a new version of the plan's goals, and every goal starts again at Not started." },
      { id: "wc4-5", q: "You close a planning session with Done. Does it count as a finished review?", right: "No, only a session run with Start session counts", wrong: ["Yes, every closed session counts", "Yes, if it had notes", "Only on a Monday"], why: "A session run with Start session counts as a finished review. One closed with Done does not." },
    ],
  },
  {
    ...base,
    id: "wc-goals",
    track: "client",
    dimension: "operations",
    title: "Goals, reviews and your rhythm",
    minutes: 7,
    summary: "Breaking year goals down, reviewing your week and keeping an Operating Rhythm.",
    sources: ["goal-ladder", "weekly-review", "operating-rhythm"],
    sections: [
      {
        heading: "The Goal Ladder",
        text: "Your year goals come from your Business, Marketing and Sales Plans, so an empty ladder means those plans need building. Under a year goal, add quarter goals, then month goals, then week goals. The sparkle button suggests three smaller goals, and nothing is saved until you press Add. Set each goal to Not started, In progress, Met or Slipped.",
      },
      {
        heading: "What goals change",
        text: "Goals do not change your 12 dimension scores or your 8 pillars. Your year goals show on Progress, and a year goal marked Slipped can shape your Next 3 Moves. You can remove quarter, month and week goals, but year goals belong to your plan and stay.",
      },
      {
        heading: "Weekly Review",
        steps: [
          "Open Weekly Review and choose Weekly or Monthly.",
          "Press the start button to see your numbers and your briefing.",
          "Answer the three questions, then press Next: my three tasks.",
          "Edit the tasks and due dates, and untick any you do not want.",
          "Press Finish my review.",
        ],
      },
      {
        heading: "Why finishing matters",
        text: "It takes about 10 minutes. Nothing goes on your task list until you press Finish my review. Your tasks then go into Backlog at high priority, with the due dates you chose. Finished reviews count toward your Internal Process & Culture pillar. It looks at the last 90 days, and three fills that part.",
      },
      {
        heading: "Operating Rhythm",
        text: "This card on Business Alignment holds your daily habits, weekly review and monthly check-in. Start with three to five, because a rhythm you keep beats a long list you do not. Your routines are your recurring tasks, so one added here shows there too. Three routines fills that part of your pillar, and what counts is how many you have set up, not how many you tick off.",
      },
    ],
    tryIt: { label: "Open Goal Ladder", href: "/planning/goals", task: "Find a year goal and press the sparkle button to see three smaller goals. Add one only if it fits.", question: "What is the one goal your business must reach this quarter, and what would this week's step be?" },
    questions: [
      { id: "wc5-1", q: "Your Goal Ladder is empty. Why?", right: "Your year goals come from your plans, so a plan needs building", wrong: ["Your AI key has expired", "You need a team member first", "The ladder fills in on the first of the year"], why: "Build your Business, Marketing or Sales Plan and its goals appear here." },
      { id: "wc5-2", q: "You mark a goal Met. Does your Sales dimension change?", right: "No, goals do not change your 12 dimensions or 8 pillars", wrong: ["Yes, it rises by five points", "Yes, but only on a Monday", "Only for quarter goals"], why: "Goals do not change your scores. They show on Progress, and a Slipped year goal can shape your Next 3 Moves." },
      { id: "wc5-3", q: "You finish a Weekly Review. Where do your three tasks go?", right: "To Backlog at high priority, with the due dates you chose", wrong: ["To Today at low priority", "To Waiting", "To your calendar only"], why: "They go into your Backlog list on Tasks at high priority." },
      { id: "wc5-4", q: "How many finished reviews in the last 90 days fill that part of your pillar?", right: "Three", wrong: ["One", "Twelve", "Ninety"], why: "It looks at reviews finished in the last 90 days, and three fills that part." },
      { id: "wc5-5", q: "Is a routine on Operating Rhythm different from a recurring task?", right: "No, your routines are your recurring tasks", wrong: ["Yes, they never appear on Tasks", "Yes, routines are for team members only", "Yes, routines are monthly only"], why: "One added on Operating Rhythm shows in Recurring Tasks too." },
    ],
  },
  {
    ...base,
    id: "wc-marketing",
    track: "client",
    dimension: "operations",
    title: "Your content and email marketing",
    minutes: 9,
    summary: "Writing posts, building a campaign, sending a broadcast and resending one email.",
    sources: ["content-calendar", "campaigns", "broadcasts", "resend-a-single-email"],
    sections: [
      {
        heading: "Content Calendar",
        text: "Press Create content, press your platforms, type a few words under Draft with AI and press Draft. Read the Caption box, change anything you like, then copy it and paste it into your social app. The Suite does not post to social accounts for you. Copy your caption before you close the panel, and fill in your Marketing Plan first so your drafts sound more like you.",
      },
      {
        heading: "Campaign or broadcast?",
        text: "A campaign is a series that each person moves through on their own timing. A broadcast is one email to a group, sent once. Both go out from you, through your own Resend account and domain, so Email sending must be set up first.",
      },
      {
        heading: "Building a campaign",
        steps: [
          "Type a name in New campaign name and press the plus button.",
          "Press Add email, fill in Send on day, Subject and your text, then press Save.",
          "Choose your Daily send time.",
          "Press Preview, or the send icon for a test to your own inbox.",
          "Press Turn on when the emails are ready.",
          "Add people on the People tab, or have a form or booking calendar start the campaign.",
        ],
      },
      {
        heading: "Sending a broadcast",
        steps: [
          "On the Broadcasts tab, type a name in New blank broadcast and press the plus button.",
          "Under Who gets it, press your tags, add skips or names if you need them, then press Save.",
          "Write your Subject and text, press Preview, then Send me a test.",
          "Pick a Date and Time and press Schedule, or press Send now.",
        ],
      },
      {
        heading: "Before and after you send",
        text: "The broadcast list is fixed the moment sending starts, so check the people count first. Press Unschedule to make it a draft again. Press Stop sending while it is going out, though anyone already emailed stays emailed. Unsubscribed contacts are always left out.",
      },
      {
        heading: "Resending one email",
        text: "Someone missed an email or joined late? Resend sends one email again to one person and changes nobody's schedule. In a campaign, use the resend icon on the People tab. In a sent broadcast, type a name under Resend to one person.",
      },
      {
        heading: "How it counts",
        text: "Each campaign you have turned on counts toward your Communication pillar, and pausing one takes it out of that count. Broadcasts do not change your scores. Your assistant can write a campaign or broadcast, but it arrives paused or as a draft for you to turn on or send.",
      },
    ],
    tryIt: { label: "Open Campaigns & Broadcasts", href: "/sequences-manager", task: "See which campaigns are on and which are paused.", question: "What should a new lead hear from you in their first week, and what is the first email about?" },
    questions: [
      { id: "wc6-1", q: "Does the Suite post to your social accounts?", right: "No, you copy the caption and paste it into each app", wrong: ["Yes, on the date you pick", "Yes, once you press Draft", "Only on Facebook"], why: "The Suite does not post to social accounts for you." },
      { id: "wc6-2", q: "You want one announcement to go to your whole list once. What do you use?", right: "A broadcast", wrong: ["A campaign", "A Quick Win", "A form"], why: "A broadcast is one email to a group, sent once. A campaign is a series on each person's own timing." },
      { id: "wc6-3", q: "Your assistant wrote you a campaign. What state does it arrive in?", right: "Paused, with nobody in it, for you to turn on", wrong: ["On, and sending to your whole list", "Scheduled for tomorrow", "Sent to you as a PDF"], why: "It waits behind Approve, arrives paused with nobody in it, and you turn it on yourself." },
      { id: "wc6-4", q: "You press Stop sending partway through a broadcast. What about people already emailed?", right: "They stay emailed", wrong: ["The email is recalled", "They get an apology", "They are unsubscribed"], why: "Stop sending halts what is left. Anyone already emailed stays emailed." },
      { id: "wc6-5", q: "You resend one campaign email to someone. Does it move them along the campaign?", right: "No, nobody's schedule changes", wrong: ["Yes, to the next email", "Yes, back to the start", "It pauses them"], why: "Resending sends one email again and changes nobody's schedule." },
      { id: "wc6-6", q: "You pause a campaign. What does that do to your Communication pillar?", right: "It takes that campaign out of the count", wrong: ["Nothing, paused campaigns still count", "It doubles the count", "It lowers your Finance dimension"], why: "Each campaign you have turned on counts. Pausing one takes it out." },
    ],
  },
  {
    ...base,
    id: "wc-clients",
    track: "client",
    dimension: "operations",
    title: "Looking after your clients",
    minutes: 8,
    summary: "Client Portals, Client Care and collecting testimonials.",
    sources: ["client-portals", "client-care", "testimonials"],
    sections: [
      {
        heading: "Client Portals",
        text: "Give each client a private page in your name and logo, with their sessions left, bookings, invoices, shared session notes, homework, goals, files and messages. There is no password. The private link is the key.",
      },
      {
        heading: "Setting up a portal",
        steps: [
          "Under Add a client, type a name or email and press Open.",
          "Press the Create button for their portal.",
          "Add a package, homework, goals or files.",
          "Press See what they see to check it.",
          "Press Email them the link, or Copy link and send it yourself.",
        ],
      },
      {
        heading: "Sessions and notes",
        text: "A session is used when you mark their booking Attended in Calendars. Use the minus and plus buttons to adjust it by hand. Clients see only the LC Volant notes you choose to share. If a client loses their link, they can get it at lccommandsuite.com/portal, or you can press New link, which stops the old one working.",
      },
      {
        heading: "Client Care",
        text: "Four pieces keep you close to your clients: a 30-day check-in, a quarterly pulse, an exit survey and a task when a client goes quiet. Everything is written and switched off until you turn it on. Tag your clients client or customer in Contacts. Payments through the Suite add customer on their own. Press Read or edit the email so it sounds like you, then turn on each piece you want.",
      },
      {
        heading: "Quiet clients and leaving clients",
        text: "Quiet means no bookings, payments, emails or notes for 2 weeks. You get a task to reach out personally, and nothing is emailed on its own. When someone stops working with you, tag them former-client to send the exit survey. Each email piece you switch on counts as a campaign that is turned on, so it counts toward your Communication pillar.",
      },
      {
        heading: "Testimonials",
        text: "Press Request a review, write your note and press Create link. The Suite does not email the request for you, so press Copy message + link and send it yourself. When a review comes in it is Pending until you press Approve, Feature or Hide. Only reviews you approve or feature are used. The number of testimonials feeds your Referral Process pillar, which reaches full marks for that part at five.",
      },
    ],
    tryIt: { label: "Open Client Care", href: "/client-care", task: "Press Read or edit the email on the 30-day check-in and see how it sounds.", question: "Which client would value a personal note from you this week, and what would you say?" },
    questions: [
      { id: "wc7-1", q: "How does a client sign in to their portal?", right: "There is no password, because the private link is the key", wrong: ["With their own Suite login", "With a code sent by text", "With your password"], why: "There is no password. A lost link can be sent again from lccommandsuite.com/portal." },
      { id: "wc7-2", q: "How does a session get used in a portal?", right: "You mark their booking Attended in Calendars", wrong: ["The client ticks it off", "It is used on the booking date, whatever happens", "Your assistant uses it each month"], why: "One is used when you mark their booking Attended. You can adjust it with the minus and plus buttons." },
      { id: "wc7-3", q: "A client has had no bookings, payments, emails or notes for 2 weeks. What happens?", right: "You get a task to reach out personally", wrong: ["They are emailed automatically", "Their portal closes", "They are tagged former-client"], why: "Nothing is emailed on its own. You can start the 3 quiet-client notes yourself." },
      { id: "wc7-4", q: "How do you send someone the exit survey?", right: "Tag them former-client", wrong: ["Delete their contact", "Close their portal", "Press Send on the bell"], why: "Tagging someone former-client sends a warm thank-you with a short survey, when that piece is on." },
      { id: "wc7-5", q: "Does the Suite email your testimonial requests?", right: "No, you get a link and message to send yourself", wrong: ["Yes, to every client each month", "Yes, once you press Create link", "Only for featured reviews"], why: "Nothing is sent from Testimonials. Press Copy message + link and send it yourself." },
    ],
  },
  {
    ...base,
    id: "wc-team",
    track: "client",
    title: "Your team and your time away",
    minutes: 7,
    summary: "Inviting people, choosing roles, setting a last day and taking time off with cover in place.",
    sources: ["workspace-and-team", "out-of-office"],
    sections: [
      {
        heading: "Inviting someone",
        steps: [
          "Open Settings, then Workspace. Under Team Members, press Add Member.",
          "Enter their email, choose Admin, Editor or Viewer, and press Send Invitation.",
          "Use Edit access on an Editor or Viewer if you want to narrow what they can reach.",
        ],
      },
      {
        heading: "The three roles",
        text: "An Admin runs the account day to day and manages the team, but has no billing, connected accounts or account deletion. An Editor works on tasks, plans, content, finance and sales activity. A Viewer sees what an Editor sees and cannot change anything.",
      },
      {
        heading: "Access for a limited time",
        text: "For a contractor, advisor or reviewer, set Access ends on when you invite them, or use Set last day on their card. Their login works through that day, in your time zone, and stops after it. A reminder lands two days before. The invitation link works once and expires in 7 days, so press Send invitation on their card to send it again.",
      },
      {
        heading: "AI limits and activity",
        text: "Team members run AI on your key. Only you, the owner, can set a monthly limit for each person. When someone reaches it, their AI stops until the next month. The Activity tab shows who did what, and only you and your admins can see it.",
      },
      {
        heading: "Out of office",
        text: "Open Settings, then Out of office. Pick your First day away and Last day away, write a Note to clients, tick what you want the Suite to do and press Set my away dates. It can close your booking pages, answer portal messages and pause your reminder emails.",
      },
      {
        heading: "What keeps going",
        text: "Campaigns, event emails, booking reminders and Client Care keep running. Each client gets your portal note once per trip, and you still get their message. Your Gmail or Outlook inbox needs its own vacation responder. Home early? Press I'm back (turn off).",
      },
    ],
    tryIt: { label: "Open Workspace", href: "/settings?tab=workspace", task: "Find Team Members and read the Role Permissions box.", question: "What is the first job in your business you would hand to someone else, and which role would they need?" },
    questions: [
      { id: "wc8-1", q: "You want someone to see everything an Editor sees but change nothing. Which role fits?", right: "Viewer", wrong: ["Admin", "Editor", "Owner"], why: "A Viewer sees what an Editor sees and cannot change anything." },
      { id: "wc8-2", q: "An advisor needs access until the end of the month only. What do you set?", right: "Access ends on, or Set last day on their card", wrong: ["A reminder to delete them", "A monthly AI limit", "Out of office dates"], why: "Their login works through that day and stops after it." },
      { id: "wc8-3", q: "A team member's invitation link has expired. What do you do?", right: "Press Send invitation on their card", wrong: ["Delete the workspace", "Give them your password", "Ask them to sign up as a new client"], why: "The link works once and expires in 7 days. Send invitation sends it again." },
      { id: "wc8-4", q: "You are away next week. Do your campaigns stop?", right: "No, campaigns, event emails, booking reminders and Client Care keep running", wrong: ["Yes, everything pauses", "Yes, campaigns pause for the whole month", "Only broadcasts keep running"], why: "Everything your clients signed up for keeps running." },
      { id: "wc8-5", q: "Will Out of office answer email sent straight to your Gmail or Outlook?", right: "No, your inbox needs its own vacation responder", wrong: ["Yes, automatically", "Yes, if you tick Answer portal messages", "Only for Gmail"], why: "The Suite cannot answer email sent straight to your inbox." },
    ],
  },
  {
    ...base,
    id: "wt-books",
    track: "team-ops",
    dimension: "finance",
    title: "Keeping the books current",
    minutes: 8,
    summary: "Entering income, expenses and bills on an account you help run.",
    sources: ["finance-center", "income", "expenses", "bills-cash-calendar"],
    sections: [
      {
        heading: "One set of records",
        text: "Everything you record goes into one set of records, and every Finance page reads from it, so never enter the same thing on two pages. You need the Finance area to open these pages. The Bookkeeper preset sees Finance only.",
      },
      {
        heading: "Income",
        text: "Press Income Tracker, then Add income. Fill in Amount, Source / category and Date, and add From. Pick from the suggested categories so one source does not split into two spellings. Before adding a payment, check Recent income, because payment link payments on a connected Stripe add themselves.",
      },
      {
        heading: "Expenses",
        text: "Press Expense Manager, then Add expense. Fill in Amount, Category and Date, add Paid to, then choose One-time or Recurring. Always choose a category. An expense with none triggers a warning on Tax Preparation and in the bell.",
      },
      {
        heading: "Linking an expense to a bill",
        text: "If a one-time expense matches an upcoming bill, a box offers to link them. Press Yes, link them so it is not counted twice. Nothing new is recorded, and the bill moves to its next date.",
      },
      {
        heading: "Bills",
        text: "On Bills & Cash Calendar, press Paid when a bill is paid. That records the expense dated today and moves the bill on. Auto-renewing bills are not recorded for you, because the page cannot see the bank. A recurring expense added on the Expenses page appears here by itself, so do not add it twice.",
      },
      {
        heading: "Correcting mistakes",
        text: "Use the pencil to fix an entry. Money that came from Stripe keeps its amount and date. On income, Delete happens right away with no second check.",
      },
    ],
    tryIt: { label: "Open Finance", href: "/finance", task: "Read the live line on each card and find one that asks for a look.", question: "Which money record in this business is most often late or missing, and what would keep it current?" },
    questions: [
      { id: "wt1-1", q: "A bill was paid. How do you record it?", right: "Press Paid on its row, which records the expense", wrong: ["Add an expense and press Paid as well", "Delete the bill", "Wait for it to record itself"], why: "Paid records the expense and moves the bill to its next date, so one press does both." },
      { id: "wt1-2", q: "A box asks to link a new expense to a bill. What should you press?", right: "Yes, link them, if it is that bill", wrong: ["Add a second expense", "Close the page", "Delete the bill"], why: "Linking stops it being counted twice. Nothing new is recorded, and the bill moves on." },
      { id: "wt1-3", q: "You add a recurring expense. Do you also add it on Bills & Cash Calendar?", right: "No, it appears there by itself", wrong: ["Yes, always", "Yes, on the first of each month", "No, because recurring expenses never reach the calendar"], why: "A recurring expense added on Expenses appears on the calendar by itself." },
      { id: "wt1-4", q: "You try to change the amount on a Stripe entry. What is true?", right: "Money from Stripe keeps its amount and date", wrong: ["You can change anything on it", "It cannot be seen by team members", "The change goes back to Stripe"], why: "You can edit other details with the pencil, but Stripe money keeps its amount and date." },
      { id: "wt1-5", q: "Why pick a suggested category instead of typing your own?", right: "So one source does not split into two spellings", wrong: ["Typed categories are not allowed", "Suggested ones are tax deductible", "So the owner gets an email"], why: "Software and software would otherwise split the reports." },
    ],
  },
  {
    ...base,
    id: "wt-email",
    track: "team-ops",
    dimension: "operations",
    title: "Building and sending email",
    minutes: 8,
    summary: "Campaigns, broadcasts and fixing a missed email for the account owner.",
    sources: ["campaigns", "broadcasts", "resend-a-single-email"],
    sections: [
      {
        heading: "Check before you build",
        text: "You need the Campaigns area, and Email sending must be set up before anything goes out. If it is not, a note on the page tells you. A campaign is a series each person moves through on their own timing. A broadcast is one email to a group, sent once.",
      },
      {
        heading: "Building a campaign",
        steps: [
          "Open Campaigns & Broadcasts, type a name in New campaign name and press the plus button.",
          "Press Add email, fill in Send on day, Subject and your text, then press Save.",
          "Type {{first_name}} to fill in each person's name. The sign-off and footer are added for you.",
          "Choose the Daily send time. Each email goes at that hour in the person's own time zone.",
          "Press Preview and send a test to your own inbox with the send icon.",
          "Press Turn on when the emails are ready.",
        ],
      },
      {
        heading: "Keeping the right people out",
        text: "On a campaign, Skip anyone tagged keeps people out, and anyone who picks up that tag later is taken out too. On a broadcast, Skip anyone with these tags leaves people out even if they match your other tags, and Skip anyone still receiving stops anyone getting two things at once.",
      },
      {
        heading: "Stopping things",
        text: "Pause whole campaign stops everything until it is turned back on. To stop one person, use the pause or Stop for good buttons on the People tab. A scheduled broadcast goes back to a draft with Unschedule. Stop sending works only while a broadcast is going out.",
      },
      {
        heading: "After a broadcast",
        text: "An open broadcast shows how many were sent, waiting, failed and skipped. The list is fixed the moment sending starts. The failed list has a Resend button beside each address that failed.",
      },
      {
        heading: "Fixing one missed email",
        text: "In a campaign, press the resend icon on the People tab, or open Who got this email on the Emails tab. In a sent broadcast, type a name under Resend to one person. Nobody's schedule changes. The person-plus icon sends an email to any address without adding them to the campaign. An unsubscribed person cannot be emailed.",
      },
    ],
    tryIt: { label: "Open Campaigns & Broadcasts", href: "/sequences-manager", task: "Open a campaign and find its People tab and its Emails tab.", question: "Which email in this business gets missed or goes out late most often, and how could a campaign fix that?" },
    questions: [
      { id: "wt2-1", q: "A campaign email is due at 9 AM. Whose 9 AM is it?", right: "The hour chosen, in each person's own time zone", wrong: ["The account owner's time zone", "Your time zone", "Mountain Time, always"], why: "Each email goes out at the hour you choose in that person's own time zone." },
      { id: "wt2-2", q: "What does typing {{first_name}} do?", right: "It fills in each person's name", wrong: ["It signs the email with your name", "It adds the owner's name to the subject only", "It leaves a blank for you to fill in"], why: "It fills in each person's name. The sign-off and footer are added for you." },
      { id: "wt2-3", q: "One person must stop getting a campaign, but everyone else should carry on. What do you use?", right: "The pause or Stop for good buttons beside them on the People tab", wrong: ["Pause whole campaign", "Delete the campaign", "Retire their tag"], why: "Pause whole campaign stops everyone. The People tab buttons stop one person." },
      { id: "wt2-4", q: "A new tag was added to your broadcast list after sending started. Are those people emailed?", right: "No, the list is fixed the moment sending starts", wrong: ["Yes, right away", "Yes, the next morning", "Only if they joined a form"], why: "The list is fixed when sending starts, so check the people count first." },
      { id: "wt2-5", q: "Your resend to one person was refused. What is the likely reason?", right: "That person has unsubscribed", wrong: ["The campaign is on", "You used the person-plus icon", "The email was too long"], why: "An unsubscribed person cannot be emailed." },
    ],
  },
  {
    ...base,
    id: "wt-events",
    track: "team-ops",
    title: "Running events and landing pages",
    minutes: 8,
    summary: "Live events, challenges, invite lists and the pages that fill them.",
    sources: ["events", "landing-pages", "invite-tracker"],
    sections: [
      {
        heading: "Setting up an event",
        steps: [
          "Type a name under New event, choose Live event or Challenge, and press Create.",
          "Fill in The page, then your date, time and join link, or your challenge days, and press Save.",
          "For a challenge, write Each day and press Save the days.",
          "Press Open for sign-ups, then Copy sign-up link and share it.",
        ],
      },
      {
        heading: "What goes out",
        text: "A confirmation with add-to-calendar links, then reminders the day before and one hour before. They come from the account's own address, so Email sending must be set up. If you leave Day 1 of a challenge empty, each person starts the day after they join. Your assistant can draft an event but never opens sign-ups.",
      },
      {
        heading: "After a live event",
        text: "Press Attended or Missed beside each person, and each adds its own tag. Add your Replay link and press Email the replay to everyone. A Follow-up campaign starts when the replay goes out, or when a challenge ends. If you set hours on the replay, people get a reminder about 12 hours before it closes.",
      },
      {
        heading: "Building a landing page",
        steps: [
          "Press a template: Opt-in, Webinar or event, Sales page or Book a call.",
          "Under Basics, choose the form, event, offer or booking page it uses.",
          "Press Draft the words or type your own, and press Use on the parts you want.",
          "Set your Look, add testimonials if you like, then press Save.",
          "Press Preview, then Publish. Back on All landing pages, press Copy beside the link.",
        ],
      },
      {
        heading: "Landing page details",
        text: "Each template needs its piece, and a note tells you if one is missing. Draft the words never makes up results or testimonials. Unpublish takes the page down until you publish again. Archive also takes it offline, and Restore as draft brings it back. Press Duplicate to start from a page that works.",
      },
      {
        heading: "Invite Tracker",
        text: "Build the invite first in Campaigns & Broadcasts: one email with a button to the sign-up form. Press New invite list, fill in the event name and invite tag, then choose your Sign-up form and Invite campaign. Link a sign-up form, or registrations cannot be tracked. If the invite campaign is off, invites wait until it is on. Removing someone takes off the invite tag, and they stay in Contacts.",
      },
    ],
    tryIt: { label: "Open Events", href: "/events", task: "Open an event or look at New event, and find where the join link goes.", question: "What is the next event this business should run, and who most needs to be invited?" },
    questions: [
      { id: "wt3-1", q: "Your assistant drafted an event. Who opens sign-ups?", right: "A person presses Open for sign-ups", wrong: ["Your assistant, on Approve", "It opens by itself on the event date", "Support"], why: "Your assistant never opens sign-ups. You press Open for sign-ups yourself." },
      { id: "wt3-2", q: "When do event reminders go out?", right: "The day before and one hour before", wrong: ["Only one week before", "Only when you press Send", "Every day for a week"], why: "A confirmation goes first, then reminders the day before and one hour before." },
      { id: "wt3-3", q: "A landing page says something is missing. What do you do?", right: "Choose its form, event, offer or booking page under Basics", wrong: ["Add more testimonials", "Press Unpublish", "Ask your assistant to publish it"], why: "Each template needs its piece, chosen under Basics." },
      { id: "wt3-4", q: "Will Draft the words invent a testimonial?", right: "No, it never makes up results or testimonials", wrong: ["Yes, if you press Use all", "Yes, for Sales pages", "Only for webinars"], why: "It writes from your form, event, offer or booking page and your notes, and never makes up results or testimonials." },
      { id: "wt3-5", q: "Invites have not gone out from your invite list. What do you check first?", right: "Whether the invite campaign is turned on", wrong: ["Whether the landing page is archived", "Whether Stripe is connected", "Whether the list has a seat limit"], why: "If your invite campaign is off, invites wait until you turn it on." },
      { id: "wt3-6", q: "You remove someone from an invite list. Are they deleted?", right: "No, the invite tag comes off and they stay in Contacts", wrong: ["Yes, from Contacts", "Yes, and they are unsubscribed", "They are moved to Backlog"], why: "Removing someone only takes off the invite tag." },
    ],
  },
  {
    ...base,
    id: "wt-clients",
    track: "team-ops",
    dimension: "operations",
    title: "Supporting the owner's clients",
    minutes: 7,
    summary: "Keeping portals current, watching Client Care and handling reviews.",
    sources: ["client-portals", "client-care", "testimonials"],
    sections: [
      {
        heading: "Keeping a portal current",
        text: "You need the Contacts area. Open a client's portal to add a package, homework, goals or files. Press See what they see to check your work before you share it. Sections with nothing in them stay out of sight on their own.",
      },
      {
        heading: "Sessions",
        text: "Add a package with its number of sessions and an optional Use by date. A session is used when a booking is marked Attended in Calendars, and the minus and plus buttons adjust it by hand.",
      },
      {
        heading: "When a client loses their link",
        text: "They can go to lccommandsuite.com/portal and enter their email to get their private link. New link also works, but the old one then stops working, so email them the new one.",
      },
      {
        heading: "Messages and notes",
        text: "You and the client can write to each other in the portal, and each side gets an email. Only LC Volant notes someone chooses to share show there. Private notes and drafts never do.",
      },
      {
        heading: "Client Care",
        text: "Tag people client or customer in Contacts so the check-ins can reach them. Someone gets each email once, and the quarterly pulse once a quarter. Unsubscribed contacts are always skipped, and former clients never get the check-ins. When a quiet-client task lands, reach out personally. Nothing is emailed on its own.",
      },
      {
        heading: "Testimonials",
        text: "When a review comes in it is Pending. Press Approve, Feature or Hide. Clients must tick the box saying it may be shared. Add one I received saves praise that came another way, and you tick the box only if they said it can be shared. On an approved review, Make a post opens Create content with the quote and their name in the caption.",
      },
    ],
    tryIt: { label: "Open Client Portals", href: "/client-portals", task: "Open a portal if you have one and press See what they see.", question: "What would make a client of this business feel most looked after this month?" },
    questions: [
      { id: "wt4-1", q: "You press New link on a client's portal. What happens to the old link?", right: "It stops working, so email them the new one", wrong: ["Both links work", "It keeps working for 7 days", "The portal is deleted"], why: "The old link stops working when you press New link." },
      { id: "wt4-2", q: "Which session notes can a client see in their portal?", right: "Only LC Volant notes someone chooses to share", wrong: ["Every note and draft", "All notes older than a week", "None, portals have no notes"], why: "Private notes and drafts never show." },
      { id: "wt4-3", q: "Why might a client not get the 30-day check-in?", right: "They are not tagged client or customer in Contacts", wrong: ["They have a portal", "They paid by invoice", "They booked a call"], why: "Tag your clients client or customer so Client Care can reach them. Payments through the Suite add customer on their own." },
      { id: "wt4-4", q: "A quiet-client task lands on your list. What is the right move?", right: "Reach out personally", wrong: ["Wait for the Suite to email them", "Tag them former-client", "Close their portal"], why: "You get a task to reach out personally, and nothing is emailed on its own." },
      { id: "wt4-5", q: "Someone praised the owner in an email, but you do not know if it can be shared. What do you do when you save it?", right: "Leave the sharing box unticked until they say yes", wrong: ["Tick the box anyway", "Make a post straight away", "Feature it"], why: "With Add one I received, tick the box only if they said you can share it." },
    ],
  },
  {
    ...base,
    id: "wt-sops",
    track: "team-ops",
    dimension: "systems",
    title: "Reading the pillars and building SOPs",
    minutes: 7,
    summary: "What the 8 pillars show, and how a template becomes an SOP in use.",
    sources: ["operations", "sop-template-library"],
    sections: [
      {
        heading: "The 8 pillars",
        text: "Customer Acquisition, Sales Journey, Onboarding, Support / Customer Service, Communication, Fulfillment, Internal Process & Culture, and Referral Process. The Suite scores each one from 0 to 100, and nobody can set a pillar score by hand. Each card shows What your score is built from.",
      },
      {
        heading: "Using a pillar card",
        text: "A pillar showing Not scored yet needs some data, and its Go deeper questions are the fastest way in. A pillar at 40 or below raises an alert on the bell. Notes do not change a score. Generate insights tells you where to focus next, and the pillar scores work without pressing it.",
      },
      {
        heading: "Fifty templates are already there",
        text: "Your Playbook & SOPs holds 50 ready-made SOPs across the 8 pillars, as drafts. Start with the process you explain most often, not all fifty. Drafts do not change scores.",
      },
      {
        heading: "From draft to in use",
        steps: [
          "Press a card to read it as a checklist.",
          "Press Edit to change the wording and fill in the [bracketed placeholders], then press Save SOP.",
          "Press Approve to put it in use.",
        ],
      },
      {
        heading: "How an SOP counts",
        text: "Once approved, an SOP counts as in use, which feeds the Systems dimension and the matching pillars. An archived SOP stops counting. For Onboarding, Support, Communication and Fulfillment, an SOP in that area helps the score. Editing an approved SOP shows Edited since approved until it is approved again.",
      },
      {
        heading: "Handy details",
        text: "Ticks are saved on the SOP, so everyone running it sees the same list, and ticking never counts as an edit. Have your assistant work on this SOP puts its result in the editor, and nothing saves until you press Save SOP. Make a copy adapts one for a different situation. A deleted template can be added back from Template library.",
      },
    ],
    tryIt: { label: "Open Playbook & SOPs", href: "/operations/sops", task: "Find a template draft for the process you explain most often.", question: "Which process in this business do you explain most often, and which SOP would save the most time?" },
    questions: [
      { id: "wt5-1", q: "A pillar shows Not scored yet. What is the fastest way in?", right: "Answer its Go deeper questions", wrong: ["Type a score on the card", "Press Generate insights", "Add a note"], why: "A pillar needs some data, and Go deeper is the fastest way in. Notes do not change a score." },
      { id: "wt5-2", q: "Do the 50 SOP templates count toward scores as soon as they are in your account?", right: "No, a template counts only once it is approved", wrong: ["Yes, all fifty count", "Yes, but only the first ten", "No, templates can never count"], why: "Drafts do not change scores. Press Approve to put one in use." },
      { id: "wt5-3", q: "You edit an approved SOP. What does it show?", right: "Edited since approved, until it is approved again", wrong: ["Draft forever", "Archived", "Nothing changes on the card"], why: "Editing an approved SOP shows Edited since approved." },
      { id: "wt5-4", q: "You tick steps on an SOP while you run it. Does that count as an edit?", right: "No, ticking never counts as an edit", wrong: ["Yes, it must be approved again", "Yes, and it archives the SOP", "Only on the first run"], why: "Ticks are saved on the SOP so everyone sees the same list. Ticking never counts as an edit." },
      { id: "wt5-5", q: "What does archiving an SOP do to its score credit?", right: "It stops counting", wrong: ["It counts double", "It keeps counting forever", "It lowers the pillar to zero"], why: "An archived SOP stops counting." },
    ],
  },
  {
    ...base,
    id: "ws-qualify",
    track: "team-sales",
    title: "Qualifying prospects",
    minutes: 8,
    summary: "Scoring a person or a list against your Ideal Client Profile before you reach out.",
    sources: ["prospect-qualifier"],
    sections: [
      {
        heading: "Start with an Ideal Client Profile",
        text: "Every score is measured against one of these. Open the Ideal Client Profiles tab, fill in who you serve, or press Draft it for me and read it over. Reword the levels to fit your market, mark This is my ideal client on one, and press Save profile. Keep one profile for each offer, because each has a different ideal client.",
      },
      {
        heading: "Scoring one person",
        steps: [
          "Open Qualify a prospect and pick the profile under Score against.",
          "Open their profile, select everything on the page, copy it and paste the text in. A link will not work, because the platforms block it.",
          "Press Score this prospect.",
          "Read the priority, the fit, their level, the gap and the warm DM angle.",
          "Choose a pipeline and press Add to pipeline if you want to reach out.",
        ],
      },
      {
        heading: "What the priorities mean",
        text: "High: send the warm DM this week. Medium: engage with a few of their posts first, then message later. Low: follow them and watch. Skip: move on to the next profile.",
      },
      {
        heading: "Scoring a whole list",
        text: "The Audience Qualifier takes a spreadsheet or pasted cells, with column headings in the first row. Up to 1,000 people are scored per list, so keep the page open while it runs. It uses only what the list holds, because it cannot see their posts. Use a list score to see who to look at first, then do the full score on that person's pipeline card.",
      },
      {
        heading: "Adding a scored list to a pipeline",
        text: "Everyone scored High who is not already on a pipeline starts ticked. Nobody goes on the same pipeline twice. High priority starts in To reach out, and Medium and Low start in Nurture. If the pipeline does not have that stage, they go to its first open stage.",
      },
      {
        heading: "What it does not do",
        text: "Scoring needs the account's AI key and the Outreach area. It does not change your scores or your plans, and nobody goes on a pipeline until you press the add button.",
      },
    ],
    tryIt: { label: "Open Prospect Qualifier", href: "/qualifier", task: "Open the Ideal Client Profiles tab and read the profile marked as the ideal client.", question: "Who is the best-fit client for this business, and what is the clearest sign that someone is not a fit?" },
    questions: [
      { id: "ws1-1", q: "You paste a prospect's profile link and it will not score. Why?", right: "The Suite cannot open a profile link, so you paste the page text", wrong: ["The link is too long", "The person is already a client", "You need a Won deal first"], why: "The platforms block it. Open the profile, select everything, copy it and paste it in." },
      { id: "ws1-2", q: "A prospect scores Medium. What should you do?", right: "Engage with a few of their posts first, then message later", wrong: ["Send the warm DM today", "Move on to the next profile", "Add them to a broadcast"], why: "High means send the warm DM this week. Medium means engage first." },
      { id: "ws1-3", q: "Why does a list score read less deeply than a single score?", right: "It uses only what the list holds, because it cannot see their posts", wrong: ["It uses a smaller AI key", "It only scores the first ten people", "It skips anyone with a title"], why: "The score uses what the list holds, such as title, headline and company." },
      { id: "ws1-4", q: "You add a scored list to a pipeline. Where does a High priority person start?", right: "In To reach out", wrong: ["In Nurture", "In Booked", "In Asked to stop"], why: "High starts in To reach out. Medium and Low start in Nurture." },
      { id: "ws1-5", q: "How many Ideal Client Profiles should you keep?", right: "One for each offer", wrong: ["One for each prospect", "Only one for the whole account", "One for each team member"], why: "Each offer has a different ideal client." },
    ],
  },
  {
    ...base,
    id: "ws-cold-email",
    track: "team-sales",
    title: "Running a cold email pipeline",
    minutes: 7,
    summary: "The ready-made stages, updating cards in bulk and honoring every stop request.",
    sources: ["cold-email-stages-and-updates"],
    sections: [
      {
        heading: "Setting one up",
        steps: [
          "On Outreach Pipelines, press New pipeline, give it a name, choose Cold email stages and press Create pipeline.",
          "Open Add people faster and add your list under Upload a list.",
          "Send your emails from the Cold email sender or your own cold-email tool.",
          "Back in Add people faster, find Update from your cold-email tool and paste the addresses.",
          "Under What happened, choose what happened to those people, and press Update their cards.",
        ],
      },
      {
        heading: "How updates work",
        text: "One update covers every pipeline a person is on, so paste each address once. Cards only move forward, so someone already further along stays where they are. The note after you update tells you how many were further along and how many addresses are not on any pipeline.",
      },
      {
        heading: "Follow-up tasks",
        text: "Stages that are only waiting make no follow-up tasks, so a big upload does not flood your Tasks. A reply makes one.",
      },
      {
        heading: "Asked to stop",
        text: "Choose Asked to stop as soon as someone asks. It moves their card to the stop stage and marks them Do Not Contact in Contacts, even if they had no card. They are unsubscribed, tagged and taken out of your email campaigns. Bounced moves the card to the same stage, but it does not mark the person Do Not Contact.",
      },
      {
        heading: "The Cold email sender",
        text: "On a Cold email pipeline, open Cold email sender, add a connected Google mailbox, write your own emails, and add your business name and postal address. It stays off until everything in [brackets] is filled in. Each mailbox starts at 5 a day and grows to its cap, on weekdays inside your send window. Replies go to your own inbox.",
      },
      {
        heading: "Protect your main domain",
        text: "Send from a separate domain, not your main one, to protect your everyday email. With Microsoft 365 connected, replies and stop requests are picked up on their own. Without it, paste them under Update from your cold-email tool.",
      },
    ],
    tryIt: { label: "Open Outreach Pipelines", href: "/dm-pipeline", task: "Open Add people faster and find Update from your cold-email tool.", question: "Who in this business's market would welcome a cold email, and what would make them reply?" },
    questions: [
      { id: "ws2-1", q: "A card did not move when you updated. Why?", right: "Cards only move forward, and that person was already further along", wrong: ["The pipeline was full", "The email was too old", "You must update each pipeline separately"], why: "The note after you update says how many were already further along." },
      { id: "ws2-2", q: "Someone asks you to stop emailing them. What do you choose?", right: "Asked to stop, as soon as they ask", wrong: ["Bounced", "They replied", "Nothing, and wait for the sequence to end"], why: "Asked to stop marks them Do Not Contact, so the Suite never emails them either." },
      { id: "ws2-3", q: "Is Bounced the same as Asked to stop?", right: "No, Bounced does not mark the person Do Not Contact", wrong: ["Yes, they do exactly the same thing", "Yes, but Bounced also deletes them", "No, Bounced sends them an apology"], why: "Both use the same stage, but only Asked to stop marks Do Not Contact." },
      { id: "ws2-4", q: "A person is on three pipelines. How many times do you paste their address?", right: "Once, because one update covers every pipeline they are on", wrong: ["Three times", "Once a day", "Twice, to be safe"], why: "One update covers every pipeline a person is on." },
      { id: "ws2-5", q: "Which domain should cold email go out from?", right: "A separate domain, not your main one", wrong: ["Your main domain", "lccommandsuite.com", "A client's domain"], why: "A separate domain protects your everyday email." },
    ],
  },
  {
    ...base,
    id: "ws-offers",
    track: "team-sales",
    title: "Offers, payment links and paid calls",
    minutes: 7,
    summary: "Finding the right offer, sharing how to pay and knowing what only an admin can do.",
    sources: ["offers-packages", "payment-links-on-offers", "paid-and-deposit-booking"],
    sections: [
      {
        heading: "Offers & Packages",
        text: "This is one place for everything the business sells: price, what is included, who it is for and the checkout link. You need the Pipeline, Offers & Sales Plan area. Deals in the Pipeline point to these offers, and choosing an offer on a deal fills in the deal value for you.",
      },
      {
        heading: "Finding an offer",
        text: "The page opens on Active, so a Draft or Retired offer sits under its own button or All. The search box finds an offer by name, price or what is included.",
      },
      {
        heading: "Who manages payment links",
        text: "Only the account owner or a team admin can create, remake or turn off a link. The box stays hidden for everyone else. Links are made on the account's own Stripe, and payments go straight there.",
      },
      {
        heading: "How the link charges",
        text: "The link follows How it's paid on the offer. One-time is paid in full. Monthly charges every month until cancelled. Payment plan splits the price into 2 to 24 monthly payments and stops by itself after the last one.",
      },
      {
        heading: "If the price changes",
        text: "A link does not follow a price change. Ask the owner or an admin to press Remake, and the old link stops working, so share the new one. A TEST label means the Stripe connection is in test mode and no real money moves.",
      },
      {
        heading: "Paid and deposit calls",
        text: "A calendar can ask for the full price or a deposit before the time is theirs. The booking is confirmed once they have paid, and their time is held for 30 minutes while they pay. A paid booking that moves to a new time keeps its payment. The Suite does not refund cancellations, and any refund is made in the account's own Stripe.",
      },
    ],
    tryIt: { label: "Open Offers & Packages", href: "/sales/offers", task: "Press Active, Draft, Retired and All to see each group.", question: "Which offer do you talk about most, and how would you describe its transformation in one sentence?" },
    questions: [
      { id: "ws3-1", q: "You cannot see the Payment link box on an offer. Why?", right: "Only the account owner or a team admin can manage payment links", wrong: ["The offer is too expensive", "Your AI key is missing", "Offers have no links"], why: "The box stays hidden for everyone else." },
      { id: "ws3-2", q: "An offer you need is missing from the page. Where do you look?", right: "Under Draft, Retired or All, because the page opens on Active", wrong: ["In the Tag Library", "In Sales Activities", "It has been deleted"], why: "The page opens on Active, so check the other buttons." },
      { id: "ws3-3", q: "An offer's price went up. Is the old payment link still right?", right: "No, it needs Remake, and the old link then stops working", wrong: ["Yes, it updates by itself", "Yes, the buyer pays the difference later", "Only if the offer is Active"], why: "A link does not follow a price change. Press Remake." },
      { id: "ws3-4", q: "A prospect is partway through paying for a call. What happens to their time?", right: "It is held for 30 minutes while they pay", wrong: ["It is given away at once", "It is held for 7 days", "It is confirmed before they pay"], why: "An unpaid hold is released and the time goes back on the calendar." },
      { id: "ws3-5", q: "You see a TEST label beside Payment link. What does it mean?", right: "Stripe is in test mode, so no real money moves", wrong: ["The buyer gets a discount", "The offer is a draft", "The link has expired"], why: "A TEST label means the Stripe connection is in test mode." },
    ],
  },
  {
    ...base,
    id: "w-exam",
    track: "core",
    kind: "exam",
    title: "Working Knowledge exam",
    minutes: 12,
    summary: "Ten questions on real situations. Pass with 80% to earn your Working Knowledge certificate.",
    sources: ["morning-brief", "quick-wins", "recurring-tasks", "time", "import-contacts", "sales-activities", "scripts-templates", "have-my-assistant-work-on-this", "lc-plume", "logins-passwords"],
    sections: [
      {
        heading: "How the exam works",
        text: "The exam covers the core Working Knowledge lessons. Answer every question, then press Check my answers. You need 80% to pass. It shows which questions you missed without giving the answers, so go back to the lessons and try again. Retakes are unlimited.",
      },
    ],
    questions: [
      { id: "wx-1", q: "You tick a task done on your Morning Brief. Does it count?", right: "Yes, it counts toward task follow-through", wrong: ["No, only ticks on Tasks count", "No, the Morning Brief is read-only", "Only if your assistant approves it"], why: "" },
      { id: "wx-2", q: "A Send win says you cannot press Send it, though the email is written. What should you check?", right: "That the person is picked, every [bracketed] part is filled in and they have not unsubscribed", wrong: ["That your Weekly Review is finished", "That two-factor is on", "That the win has a new title"], why: "" },
      { id: "wx-3", q: "You stop doing a routine but it is still set up. How does your pillar treat it?", right: "It still counts, because it looks at routines set up, not ticks", wrong: ["It drops out after one missed day", "It lowers your score each day", "It deletes itself after a month"], why: "" },
      { id: "wx-4", q: "You want an invoice-ready record of one week's hours for a client. What do you do first?", right: "Choose the week and the Only my time box, then press Download CSV", wrong: ["Ask your assistant to run the timer", "Change your rate first", "Export your Tasks"], why: "" },
      { id: "wx-5", q: "A colleague has an Excel file of 3,000 contacts. How do you bring it in?", right: "Save it as a CSV or paste the cells, check the columns and confirm they agreed to hear from you", wrong: ["Upload the Excel file as it is", "Email it to support", "Add them through a broadcast"], why: "" },
      { id: "wx-6", q: "A deal closed. Which outcome should you set on the activity, and why?", right: "Won, because Won and Lost set your win rate", wrong: ["Connected, because every outcome counts the same", "Booked, because it ends the deal", "No answer, so it stays open"], why: "" },
      { id: "wx-7", q: "You want a script for DMs in your own words. What is the right order?", right: "Save it to My Library, edit it, and approve it if it is marked Draft", wrong: ["Edit it in the Starter Library and send it", "Copy it into Tasks", "Ask support to approve it"], why: "" },
      { id: "wx-8", q: "You press Have my assistant work on this. What goes ahead without your Approve?", right: "Only its report, saved as a note on the item", wrong: ["Every email it writes", "Any change to your tasks", "Starting people on a campaign"], why: "" },
      { id: "wx-9", q: "An agreement is out for signature and the date in it is wrong. What is the right fix?", right: "Void it, make a copy, fix the copy and send that", wrong: ["Edit the date and press Resend", "Delete it from your list", "Ask the signer to change it"], why: "" },
      { id: "wx-10", q: "Which of these belongs in your logins vault?", right: "The password for a software tool you use", wrong: ["A bank card number", "A government ID number", "A client's session notes"], why: "" },
    ],
  },
];
