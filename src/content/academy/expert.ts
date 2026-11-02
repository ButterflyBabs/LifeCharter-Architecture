import type { Lesson } from "@/lib/academy/types";

// Expert: written from the User Guide entries named in each lesson's sources. Change the app and the matching lesson
// must change too: see "Update et al" in CLAUDE.md. The first answer in each question is held in `right`; the page
// shuffles the order.
const base = { level: "expert" as const, kind: "lesson" as const };

export const EXPERT: Lesson[] = [
  {
    ...base,
    id: "e-solve",
    track: "core",
    title: "When something looks wrong",
    minutes: 7,
    summary: "A clear order for solving a problem: refresh, search, ask, then report it well.",
    sources: ["newer-version-notice", "help-and-qa", "contact-support-and-whats-new", "suggestions-light-bulb"],
    sections: [
      {
        heading: "Start with the page itself",
        text: "If a menu or page looks out of date, refresh your browser. When the Suite is updated while a page is open, a bar says A newer version of the Suite is ready. Finish and save anything you are typing, then press Refresh now. Later hides the bar, and it comes back at the next check. This does not change your scores or your data.",
      },
      {
        heading: "Then look it up",
        text: "Search Help & Q&A. The Help group in the left menu also has short guides to each health card. On Contact Support, check Recently answered, because your answer may already be there. Read What's new to see if something changed.",
      },
      {
        heading: "Then ask a person",
        text: "Send a request on Contact Support and read any suggested answers under While you wait, these might answer it. The more detail you put in, the faster the team can help. Follow it under My requests. The Office Hours card offers live help on Zoom.",
      },
      {
        heading: "Reporting from any page",
        steps: [
          "Press the light bulb in the top bar.",
          "Choose Something's not working, I have a suggestion or General feedback.",
          "Add a short title and say what you were doing and what you expected.",
          "For a glitch, leave the box ticked if you want a support ticket so the team follows up with you directly.",
          "Press Send.",
        ],
      },
      {
        heading: "Who sees what you send",
        text: "A glitch you report is seen only by your account, your team and the LifeCharter team. Suggestions and general feedback can be seen by everyone with a Command Suite login, so leave out private details. Fixes are listed under What's new.",
      },
    ],
    tryIt: { label: "Open Contact Support", href: "/help/contact", task: "Read Recently answered and find one answer you did not know.", question: "What is the one thing in your business's use of the Suite that still confuses you or your team?" },
    questions: [
      { id: "e1-1", q: "A bar says a newer version is ready while you are typing a long note. What do you do?", right: "Finish and save what you are typing, then press Refresh now", wrong: ["Press Refresh now straight away", "Sign out and back in", "Ignore it, because it will not return"], why: "Save your work first. If you are not ready, Later hides the bar until the next check." },
      { id: "e1-2", q: "You have a question about a feature. What should you check before sending a request?", right: "Recently answered on Contact Support", wrong: ["The Tag Library", "Your Pipeline", "Your Weekly View"], why: "Your answer may already be there." },
      { id: "e1-3", q: "You want to share an idea that mentions a client's name. Why be careful?", right: "Suggestions can be seen by everyone with a Command Suite login", wrong: ["Suggestions are sent to that client", "Suggestions go on your public website", "Names lower your score"], why: "Leave out private details. A glitch report is the one seen only by your account, your team and LifeCharter." },
      { id: "e1-4", q: "What makes a glitch report faster to fix?", right: "Saying what you were doing and what you expected", wrong: ["Marking it urgent three times", "Sending it to every teammate", "Keeping it to one word"], why: "That detail helps the team find a glitch faster." },
      { id: "e1-5", q: "Will you hear about the fix for a glitch?", right: "Fixes are listed under What's new, and a support ticket gets a direct follow-up", wrong: ["No, fixes are never announced", "Only through a broadcast", "Only if you reinstall the app"], why: "Leave the box ticked for a support ticket if you want the team to follow up with you." },
    ],
  },
  {
    ...base,
    id: "e-teach",
    track: "core",
    title: "Teaching someone else the Suite",
    minutes: 7,
    summary: "The maps, words and guides to use when you show the Suite to a new client or teammate.",
    sources: ["welcome-overview", "glossary", "starter-guide", "first-30-days", "help-and-qa"],
    sections: [
      {
        heading: "Start with the big picture",
        text: "The Welcome Overview is a 16-page picture tour with a map of the whole Suite and ten area maps. Each area page has What it is, Where to find it and Start here. It is a map, not a to-do list, so nobody has to read it all.",
      },
      {
        heading: "Then the daily path",
        text: "The Starter Guide is the day-by-day checklist, and each step says where to click and how you will know it worked. If someone skips a step, nothing breaks. Their assistant simply knows a little less until they come back to it. First 30 Days is different: it ticks itself off from real data.",
      },
      {
        heading: "Explain the words",
        text: "The Glossary holds the Suite's own words, plus business, sales and marketing terms. A word with a dotted underline shows a one-line meaning when you hover over it or tap it. Many terms list the pages where the word appears. It stays open while someone finishes their three assessments.",
      },
      {
        heading: "Show the journey",
        text: "Four Client Journey Maps show how the Suite works from the first hello onward. Press Getting Started in Help & Q&A and open the question about the whole client journey. Gold dots are what you do, teal dots are what the Suite does automatically, and ivory dots are what the team does.",
      },
      {
        heading: "Keep your own answers",
        text: "Press Add your own Q&A at the bottom of Help & Q&A to save an answer you give often. It belongs to your account, and Travel Partner can answer from it too.",
      },
      {
        heading: "Who cannot see these",
        text: "A team member set to Show only the areas above does not see the Welcome Overview, the Glossary or the Starter Guide. If a teammate cannot find one, that may be why.",
      },
    ],
    tryIt: { label: "Open the Glossary", href: "/glossary", task: "Search for a word you use often and see which pages it lists.", question: "What is the one idea about your business that you would teach a new person first, and which page shows it best?" },
    questions: [
      { id: "e2-1", q: "A new client wants to see how the whole Suite fits together. What do you show them?", right: "The Welcome Overview", wrong: ["The Tag Library", "Their Pipeline", "Daily Compass"], why: "The Welcome Overview shows the whole Suite. The Starter Guide is the day-by-day checklist." },
      { id: "e2-2", q: "A client skipped a Starter Guide step and is worried. What do you tell them?", right: "Nothing breaks, and their assistant just knows a little less until they return to it", wrong: ["Their account locks until it is done", "Their scores drop", "They must start the guide again"], why: "It is a path, not a deadline." },
      { id: "e2-3", q: "What does a dotted underline on a word mean?", right: "That word is in the Glossary, so hover or tap for a quick meaning", wrong: ["The word is spelled wrong", "The page is out of date", "It is a link to pay"], why: "A word with a dotted underline shows a one-line meaning." },
      { id: "e2-4", q: "On a Client Journey Map, what does a teal dot show?", right: "What the Suite does automatically", wrong: ["What you do", "What the team does", "What costs extra"], why: "Gold dots are what you do, and ivory dots are what the team does." },
      { id: "e2-5", q: "You explain the same thing every week. Where can you keep the answer so Travel Partner can use it?", right: "Add your own Q&A in Help & Q&A", wrong: ["In a reminder", "In the Tag Library", "In your Morning Brief"], why: "Your own Q&A entries belong to your account, and Travel Partner can answer from them." },
    ],
  },
  {
    ...base,
    id: "e-trust",
    track: "core",
    title: "Answering questions about privacy",
    minutes: 6,
    summary: "What support can see, where the legal pages are and who controls the account's data.",
    sources: ["who-has-opened-my-account", "privacy-terms-and-your-agreement", "data-privacy"],
    sections: [
      {
        heading: "What support can see",
        text: "LifeCharter support can open an account read-only to help with a request. Support can look, but cannot change, send or delete anything. Support cannot see the inbox, calendar, connected accounts, logins vault or billing.",
      },
      {
        heading: "Who has opened my account",
        text: "At the bottom of Settings > Security, the account owner sees each time this happened, with the date and time, for the 20 most recent times. The list does not say why. If a date is a surprise, open Help, then Contact Support.",
      },
      {
        heading: "The legal pages",
        text: "These pages are public, so nobody needs to sign in: the Privacy Policy, the Terms of Sale & Service Agreement, the Year-1 Commitment Acknowledgment and the Community Guidelines & Terms of Use. The Community Guidelines are for The LifeCharter Collective. Questions about an agreement go through Help > Contact Support.",
      },
      {
        heading: "Who controls the data",
        text: "Settings > Data & Privacy is for the account owner only. The owner can download a full account backup, a written document of plans, goals and reviews, or this year's ledger. A backup never includes passwords, API keys or private links.",
      },
      {
        heading: "If someone asks to close an account",
        text: "Pressing Delete sends a request to the support team, and nothing is removed until they confirm by email. Download a backup first to keep the data.",
      },
    ],
    tryIt: { label: "Open the Privacy Policy", href: "/legal/privacy-policy", task: "Find what it says about what is collected and how it is used.", question: "What would your own clients want to know about how you protect their information?" },
    questions: [
      { id: "e3-1", q: "A client asks if support can send email from their account. What is true?", right: "No, support can look but cannot change, send or delete anything", wrong: ["Yes, with one click", "Yes, during Office Hours", "Yes, if they are an Admin"], why: "Support opens an account read-only to help with a request." },
      { id: "e3-2", q: "Which of these can support never see?", right: "The logins vault", wrong: ["Help articles", "What's new", "The Glossary"], why: "Support cannot see the inbox, calendar, connected accounts, logins vault or billing." },
      { id: "e3-3", q: "The owner sees a date on Who has opened my account that surprises them. What should they do?", right: "Open Help, then Contact Support", wrong: ["Delete the account", "Change the date", "Wait for it to clear"], why: "The list shows the date and time only, so ask the team." },
      { id: "e3-4", q: "Does an account backup include passwords?", right: "No, it never includes passwords, API keys or private links", wrong: ["Yes, all of them", "Only passwords", "Only API keys"], why: "Uploaded files also stay in the Suite." },
      { id: "e3-5", q: "An owner presses Delete under Danger Zone. Is the account gone right away?", right: "No, it sends a request, and nothing is removed until it is confirmed by email", wrong: ["Yes, at once", "Yes, at midnight", "Yes, but it can be restored for a year"], why: "The support team confirms by email before anything is removed." },
    ],
  },
  {
    ...base,
    id: "e-own-tools",
    track: "core",
    title: "Accountability and pages of your own",
    minutes: 7,
    summary: "Working with an accountability partner, and building a page the Suite does not have.",
    sources: ["accountability-partner", "my-pages"],
    sections: [
      {
        heading: "An accountability partner",
        text: "Press Invite an accountability partner, add their name and email, and press Send invitation. You can have up to three at a time. A partner does not need a Command Suite account: someone outside the Suite gets a private link by email. Your partner sees only what you add here, nothing else in your account.",
      },
      {
        heading: "Commitments and agreement",
        text: "On Commitments, add a task, milestone, project, deadline or habit, or share one of your tasks. A shared task stays linked, so marking it Done also finishes the task. On Our agreement, each of you writes how you want to be held accountable, the tone you respond to best and what happens if something slips.",
      },
      {
        heading: "Staying in touch",
        text: "Come back each week for the Check-in, and celebrate under Wins. Encouragement lets you send a message, and Ask for support tells your partner you are stuck. You get a friendly reminder the day before something is due. Pause stops reminders until you press Resume. End closes the partnership and makes it read-only for you both.",
      },
      {
        heading: "When the Suite has no page for it",
        text: "Ask your assistant to make a page, for example a page called Podcast Launch with a checklist and a guest tracker. Check the preview and press Approve. It appears under MY PAGES in the left menu, a section that shows once you have one page. Your changes by hand save by themselves.",
      },
      {
        heading: "A page is a snapshot",
        text: "A page built from your scores or income is a snapshot, not a live link. It does not update by itself, so ask your assistant to refresh it when you want the latest figures. Each refresh is a preview you approve.",
      },
      {
        heading: "Sharing a page",
        text: "Your team sees your pages only if you give them access. You can open all of My Pages to a team member, or give them one page at a time to view or edit.",
      },
    ],
    tryIt: { label: "Open Accountability Partner", href: "/accountability", task: "Read what you can add under Commitments before you invite anyone.", question: "What promise about your business would you make to someone else this month, and who would hold you to it?" },
    questions: [
      { id: "e4-1", q: "Does your accountability partner need a Command Suite account?", right: "No, someone outside the Suite gets a private link by email", wrong: ["Yes, a paid one", "Yes, on your team", "No, but they need your login"], why: "They have nothing to sign up for." },
      { id: "e4-2", q: "Can your partner see your business numbers?", right: "No, they see only the commitments you add here", wrong: ["Yes, all of them", "Yes, your scores only", "Only your income"], why: "Your partner sees only what you add here." },
      { id: "e4-3", q: "You share a task as a commitment and mark it Done. What happens to the task?", right: "It finishes too, because the two stay linked", wrong: ["Nothing", "It is deleted", "It moves to Waiting"], why: "A shared task stays linked, so it counts as usual toward follow-through." },
      { id: "e4-4", q: "You want a break from a partnership, but plan to come back. What do you press?", right: "Pause", wrong: ["End", "Delete", "Decline"], why: "End closes the partnership and makes it read-only." },
      { id: "e4-5", q: "A page your assistant built shows last month's income. Why?", right: "A page is a snapshot, so ask your assistant to refresh it", wrong: ["Your income was deleted", "The page is broken", "Finance is offline"], why: "Pages do not update by themselves." },
      { id: "e4-6", q: "MY PAGES is not in your left menu. Why?", right: "The section shows once you have at least one page", wrong: ["Your plan does not include it", "It is for team members only", "It opens after day 30"], why: "Ask your assistant to make your first one." },
    ],
  },
  {
    ...base,
    id: "e-collective",
    track: "core",
    title: "Using The Collective well",
    minutes: 8,
    summary: "Finding your way around the community, its channels, live calls and replays.",
    sources: ["the-collective", "collective-channels-and-posts", "coaching-calls-and-replays", "collective-events-and-calls", "collective-on-your-phone"],
    sections: [
      {
        heading: "A separate space",
        text: "The Collective lives at collective.lccommandsuite.com, with its own look, menu and sign-in. Use the same email and password. Nothing from your Command Suite is shared with the community. The Command Suite button in its menu takes you back.",
      },
      {
        heading: "Why it may be missing",
        text: "It appears in your left menu once your assessments are finished. A team member whose access is limited to their own areas does not see it in the menu.",
      },
      {
        heading: "Channels",
        text: "Channels hold conversations on one topic. If you see Join channel, press it before you post. Some conversations, like announcements, are only for updates from the hosts. Press the three dots on a post to edit, delete or report it. When you report something, the person is not told who reported them.",
      },
      {
        heading: "Safety",
        text: "New and edited posts and replies are checked automatically. Anything flagged goes to an admin, and clearly harmful content is hidden until an admin has looked at it. Private messages are never scanned.",
      },
      {
        heading: "Coaching calls",
        text: "The Coaching calls card on Executive Home and Daily Compass shows this week and next week. Press Zoom on a call, and it changes to Join now 10 minutes before the start. An empty card means no calls are left that week, so try Next week. You do not need to attend them all.",
      },
      {
        heading: "Events and replays",
        text: "In the Collective's Events, choose Upcoming, Calendar or Past & replays. Going gets you a reminder about an hour before each session, and Maybe does not. Going on a series covers every session. A replay shows once it has been added, so a very recent call may not have one yet. You see events for the whole Collective and for channels you can open.",
      },
      {
        heading: "On your phone",
        text: "Open the Collective in Safari or Chrome, press Me, and follow Put the Collective on your phone. If you opened the link inside Instagram or Facebook, choose Open in browser first. On iPhone, push notifications only work once you open the Collective from its home screen icon.",
      },
    ],
    tryIt: { label: "Open The Collective", href: "/community", task: "Find Your Next Session and one channel you belong to.", question: "What question about your business would you most like to ask people doing the same work?" },
    questions: [
      { id: "e5-1", q: "The Collective asks you to sign in again. Why?", right: "It has its own address, so it keeps its own sign-in", wrong: ["Your password expired", "Your account was closed", "You need a new login"], why: "Use the same email and password." },
      { id: "e5-2", q: "Can other members see your business data?", right: "No, nothing from your Command Suite is shared with the community", wrong: ["Yes, your scores", "Yes, your income", "Only your team can"], why: "The Collective is a separate space." },
      { id: "e5-3", q: "You cannot post in a channel. What do you try first?", right: "Press Join channel if you see it", wrong: ["Change your password", "Connect Stripe", "Turn on Collective Plus"], why: "Some conversations, like announcements, are only for updates from the hosts." },
      { id: "e5-4", q: "When does Zoom on the Coaching calls card change to Join now?", right: "10 minutes before the start", wrong: ["One hour before", "24 hours before", "Only after the call starts"], why: "A call turns active 10 minutes before it starts." },
      { id: "e5-5", q: "You press Maybe on a session. Do you get the reminder?", right: "No, only Going gets a reminder", wrong: ["Yes, the same as Going", "Yes, by text", "Yes, a day before"], why: "Going gets you a reminder about an hour before each session." },
      { id: "e5-6", q: "A call from this morning has no replay yet. Why?", right: "A replay shows once it has been added", wrong: ["Replays are for Plus only", "Calls are not recorded", "It was deleted"], why: "A very recent call may not have one yet." },
    ],
  },
  {
    ...base,
    id: "e-people",
    track: "core",
    title: "People, privacy and your Collective profile",
    minutes: 6,
    summary: "Messages, the member directory, blocking and reporting, and your own profile choices.",
    sources: ["collective-messages", "collective-members-directory", "collective-profile-and-notifications"],
    sections: [
      {
        heading: "Messages",
        text: "Press New and choose one person, or two or more for a group. You can also press Message on any member's profile. New messages show as a count on Messages, not in your Notifications list. If a message cannot be sent, the member may not be accepting messages from you.",
      },
      {
        heading: "Groups",
        text: "Anyone in a group can rename it or use Add people. Whoever started it can remove people. Press Leave this group to leave.",
      },
      {
        heading: "The directory",
        text: "Search by name, focus or location, and use the Everyone list to narrow it to one of your channels. If you cannot find someone, they may have chosen not to show, or you may have blocked them.",
      },
      {
        heading: "Block and report",
        text: "Block means you do not see their posts or replies, you cannot message each other, and their tags and replies do not notify you. They are not told, and you can press Unblock anytime. To report a message, press the flag, choose what is wrong and press Send report.",
      },
      {
        heading: "Your Collective profile",
        text: "This is separate from your Suite settings. Under Privacy, choose whether you show in the directory and can be messaged. Under Per channel, set each channel to Everything, Announcements only or Muted. Press Save changes. Your phone number is private, and only admins can see it.",
      },
      {
        heading: "Deleting a Collective account",
        text: "Delete my account cannot be undone. If your login also has Command Suite, you see Request received and the LifeCharter team finishes the deletion. Any Collective Plus subscription is cancelled the moment you ask.",
      },
    ],
    tryIt: { label: "Open your Collective profile", href: "/community/profile", task: "Find Privacy and Per channel, and set them the way you want.", question: "Who in the Collective could help your business most, and what would you ask them?" },
    questions: [
      { id: "e6-1", q: "Where do new messages show?", right: "As a count on Messages, not in your Notifications list", wrong: ["Only by email", "In your Tasks", "In your bell in the Suite"], why: "Your Notifications page lists announcements, replies, tags, event reminders and journal nudges." },
      { id: "e6-2", q: "You block a member. Are they told?", right: "No, and you can press Unblock anytime", wrong: ["Yes, by email", "Yes, on their profile", "Only if they message you"], why: "They are not told." },
      { id: "e6-3", q: "You want to stay out of the member directory. What do you do?", right: "Turn off Show me in the member directory in your profile, then press Save changes", wrong: ["Delete your account", "Leave every channel", "Ask each member"], why: "Your choice stays under Privacy in your Collective profile." },
      { id: "e6-4", q: "Who can see your phone number in the Collective?", right: "Only admins", wrong: ["Every member", "Your channels", "Your Plus coach"], why: "Your phone number is private." },
      { id: "e6-5", q: "A channel is too noisy. How do you quiet it without leaving?", right: "Set it to Announcements only or Muted under Per channel", wrong: ["Block the channel", "Report the channel", "Delete your posts"], why: "Each channel can be set to Everything, Announcements only or Muted." },
    ],
  },
  {
    ...base,
    id: "e-journal",
    track: "core",
    title: "Your journal, Plus and the Library",
    minutes: 7,
    summary: "What stays private, what can be shared, and when you already have every Plus feature.",
    sources: ["my-alignment-journal", "collective-plus", "lifecharter-library"],
    sections: [
      {
        heading: "One week in your journal",
        text: "Each week has one intention, any number of wins and one reflection. Press Set my intention, press Capture a win when something moves forward, and press Reflect on my week to rate how aligned it felt, 1 to 5.",
      },
      {
        heading: "What stays private",
        text: "Only you see your journal. If you share an entry, the Collective sees the headline and any note you wrote for them. Only intentions and wins can be shared. A reflection cannot.",
      },
      {
        heading: "Check the switch",
        text: "Wins start with sharing on and intentions start with it off, and the journal remembers your last choice, so check the switch before you save.",
      },
      {
        heading: "Journal labels are not dimensions",
        text: "The 12 areas of life you can tag are journal labels, not your 12 Business Dimensions. Your journal does not change your scores.",
      },
      {
        heading: "Do you need Plus?",
        text: "Not if your own AI key is connected in the Suite. The page then says Included with your Command Suite, and everything runs on your key. If it offers you Plus instead, connect your AI key first. Otherwise Plus runs as Mariposa on a monthly allowance that resets on the 1st. Mariposa never posts or sends anything for you.",
      },
      {
        heading: "What needs Plus or your own key",
        text: "The 90-day focus, Sunday week in review, Monthly report, journal Export and Ask the Library. Posting, conversations, messages, events and your journal stay in your membership without it. Turning off journal reminders also stops the Sunday review.",
      },
      {
        heading: "The LifeCharter Library",
        text: "Templates, worksheets, recordings and tools, grouped by category. Ask the Library answers from items you can see and lists the items it used under From. The Library shows in the menu once there is something in it.",
      },
    ],
    tryIt: { label: "Open My Journal", href: "/community/journal", task: "Find This week, and check whether sharing is on or off before you save anything.", question: "What is your intention for your business this week, in one line?" },
    questions: [
      { id: "e7-1", q: "Can you share a reflection with the Collective?", right: "No, only intentions and wins can be shared", wrong: ["Yes, with one switch", "Yes, on Sundays", "Only with Plus"], why: "Intentions go to This Week's Intention and wins go to the Wins conversation." },
      { id: "e7-2", q: "You share a win. What does the Collective see?", right: "The headline and any note you wrote for them", wrong: ["Your whole journal", "Your alignment rating", "Your reflection"], why: "Your private journal is never shared." },
      { id: "e7-3", q: "Why check the sharing switch before saving?", right: "The journal remembers your last choice", wrong: ["It resets your score", "It deletes the entry", "It emails your team"], why: "Wins start with sharing on and intentions start with it off, then it remembers." },
      { id: "e7-4", q: "A client with their own AI key connected asks if they should buy Plus. What is right?", right: "They already have every Plus feature on their own key", wrong: ["They must buy it", "Plus replaces their key", "Plus is required for posting"], why: "The page says Included with your Command Suite." },
      { id: "e7-5", q: "Your Mariposa allowance runs out. What happens?", right: "You see a note, it resets on the 1st, and the rest of the Collective keeps working", wrong: ["Your journal is locked", "You are charged more", "The Collective closes for you"], why: "Only the Mariposa features wait for the reset." },
      { id: "e7-6", q: "Are the 12 areas you tag in your journal your 12 Business Dimensions?", right: "No, they are journal labels", wrong: ["Yes, they are the same", "Yes, and they change your score", "Only with Plus"], why: "Your journal does not change your scores." },
    ],
  },
  {
    ...base,
    id: "ec-assessments",
    track: "client",
    title: "Getting the most from your assessments",
    minutes: 8,
    summary: "Going back into Brain, Soul and Profit, what stays private and bringing in your Command Shift work.",
    sources: ["brain-profile", "soul-profile", "profit-profile", "command-shift-answers"],
    sections: [
      {
        heading: "What each one feeds",
        text: "Brain feeds most of your 12 dimensions and all 8 pillars. Soul feeds your Leadership, Vision, Client Experience and Sustainability dimensions and your Communication pillar. Profit feeds most of your 12 dimensions and your 8 pillars.",
      },
      {
        heading: "Answer as it is today",
        text: "Rate the business as it is now, not as you hope it will be. Honest answers give you scores you can use. No Brain or Soul question stops you moving on, but fuller answers make your scores and guidance better.",
      },
      {
        heading: "Fill this section with my AI",
        text: "This gives you a ready-made prompt to copy into the AI you already use. You paste the reply back, review every answer and choose what to keep. This does not use your AI key. On Brain and Soul, pressing Complete does, because the Suite reads your answers to score them.",
      },
      {
        heading: "Private questions",
        text: "50 Soul questions carry a Private mark, many of them about your story. Those answers are saved to your account, and the Suite's AI does not read them for your scores, plans, written profile or assistant. They are left out of the Fill prompt unless you tick Include private questions.",
      },
      {
        heading: "Saved on this device",
        text: "On Brain, check the note beside the save icon. If it says Saved on this device, keep the page open until it says Saved to your account.",
      },
      {
        heading: "Changing answers later",
        text: "If you change Profit answers, go to the last question and press Complete Assessment again so your scores update. Your Check-in Rhythm suggests a Profit re-read every quarter. Press Retake there, or Review your answers on the card.",
      },
      {
        heading: "Your Command Shift work",
        text: "If you did the 21-Day Challenge, press Bring in my Command Shift work. Empty Marketing Plan sections for positioning, core offer and brand voice start from what you wrote, and nothing you already wrote is replaced. An edit on Your Command Shift saves there only, so change the plan on the Marketing Plan page.",
      },
    ],
    tryIt: { label: "Open Alignment Profile", href: "/assessments", task: "Find the Profit Profile card and see when it is next due.", question: "What has changed in your business that your assessment answers do not show yet?" },
    questions: [
      { id: "ec1-1", q: "You changed some Profit answers, but your scores did not move. What did you miss?", right: "Pressing Complete Assessment on the last question again", wrong: ["Asking support to rescore", "Retaking Brain", "Waiting a quarter"], why: "If you change answers later, press Complete Assessment again so your scores update." },
      { id: "ec1-2", q: "Does Fill this section with my AI use your AI key?", right: "No, you copy the prompt into the AI you already use", wrong: ["Yes, for every section", "Yes, and it saves answers straight away", "It uses LifeCharter's key"], why: "You paste the reply back and review every answer." },
      { id: "ec1-3", q: "Does the Suite's AI read Private Soul answers for your assistant?", right: "No, they are left out", wrong: ["Yes, always", "Yes, after a year", "Only for your scores"], why: "Private answers are not read for your scores, plans, written profile or assistant." },
      { id: "ec1-4", q: "The save note on Brain says Saved on this device. What should you do?", right: "Keep the page open until it says Saved to your account", wrong: ["Close the page", "Clear your browser", "Press Complete right away"], why: "Saved to your account is what you want to see." },
      { id: "ec1-5", q: "Will bringing in your Command Shift work overwrite your Marketing Plan?", right: "No, it only fills sections that are empty", wrong: ["Yes, every section", "Yes, the Foundational ones", "Only if you press it twice"], why: "It is safe to press again, because it only adds what is missing." },
    ],
  },
  {
    ...base,
    id: "ec-support-calls",
    track: "client",
    title: "Your calls and your Website Review",
    minutes: 6,
    summary: "The calls open to you, how to book extra support and getting your website reviewed.",
    sources: ["your-welcome-emails-and-calls", "calls-with-the-lifecharter-team", "website-review"],
    sections: [
      {
        heading: "Your first calls",
        text: "Your New Client Welcome Call is 30 minutes one-on-one with Babs on Zoom. Once you book it, you are invited to the next New Client Launch Call, a live group session for clients in their first 30 days. Every Command Suite client is welcome at any Launch Call, so if your date does not work you can join the next one.",
      },
      {
        heading: "Your Next Chapter Call",
        text: "Once you finish all three assessments, you are invited to a 30-minute one-on-one with Babs. It goes through what your results show and what to do first. Use the button in your invitation, or if no time fits, reply to the email.",
      },
      {
        heading: "When you need extra support",
        text: "A Client Check-In Call is 30 minutes one-on-one with Babs on Zoom. Book at lccommandsuite.com/book/client-check-in-call. You can book up to 30 days ahead, and it needs 24 hours' notice. A Welcome Call needs 12 hours' notice.",
      },
      {
        heading: "Cannot find an email?",
        text: "Check Other, Promotions and Spam, or write to support@lccommandsuite.com. You can reply to any welcome email with a question. One that no longer applies to you may be skipped.",
      },
      {
        heading: "Your Website Review",
        text: "The LifeCharter team reads your website against the positioning, voice and offer you are building, then gives you the five changes that matter most. Type your address and press Save. You get an email when it is ready, and it appears on the page.",
      },
      {
        heading: "Changing your website",
        text: "Your plan includes a set number of reviews. Added the wrong website? Press Take this website off my list, which works until the Review has been delivered. A delivered Review stays on your list.",
      },
    ],
    tryIt: { label: "Open Website Review", href: "/website-review", task: "Check whether your website address is in.", question: "What should a stranger understand about your business within ten seconds of landing on your website?" },
    questions: [
      { id: "ec2-1", q: "Your Launch Call date does not work. What can you do?", right: "Join the next one, because every client is welcome at any Launch Call", wrong: ["Nothing, it is one time only", "Book a new account", "Ask for a recording only"], why: "If your date does not work you can join the next one." },
      { id: "ec2-2", q: "When are you invited to a Next Chapter Call?", right: "Once you finish all three assessments", wrong: ["On day one", "After 90 days", "After your first payment"], why: "The call goes through what your results show and what to do first." },
      { id: "ec2-3", q: "How much notice does a Client Check-In Call need?", right: "24 hours", wrong: ["12 hours", "One hour", "7 days"], why: "A Welcome Call needs 12 hours. A Check-In Call needs 24." },
      { id: "ec2-4", q: "You added the wrong website, and the Review is still being written. What do you press?", right: "Take this website off my list", wrong: ["Delete account", "Add website twice", "Nothing can be done"], why: "It frees up the place and works until the Review has been delivered." },
      { id: "ec2-5", q: "Who writes your Website Review?", right: "The LifeCharter team", wrong: ["Your AI assistant", "Your clients", "An outside agency you hire"], why: "There is no AI button on this page, because the team writes your Review." },
    ],
  },
  {
    ...base,
    id: "ec-billing",
    track: "client",
    title: "Your plan and a failed payment",
    minutes: 5,
    summary: "Changing your plan, fixing a card and knowing who can do what.",
    sources: ["billing-and-plan", "if-a-payment-fails"],
    sections: [
      {
        heading: "Billing is owner only",
        text: "Your team cannot see Settings > Billing, and that is right. Check your plan and renewal date under Current plan. Press Manage billing to open Stripe's billing page, where you can update your card, open your invoices or choose a different plan.",
      },
      {
        heading: "What your plan sets",
        text: "Your plan sets how many workspaces, team seats, email accounts and integrations you can have, and your AI limits. See what you have used on Settings > Workspace and Settings > Integrations.",
      },
      {
        heading: "Changing plans",
        text: "When you move up, your card on file is charged the prorated difference and you get an email confirming your new plan, followed by one short check-in email. When you move down, the unused part of your current period is credited, and no emails are sent.",
      },
      {
        heading: "Cancelling",
        text: "Cancelling is not available in Manage billing. Please contact support.",
      },
      {
        heading: "If a payment fails",
        steps: [
          "Look in the bell for Your last payment didn't go through.",
          "Open Settings, choose Billing and press Manage billing.",
          "Update your card on the billing page that opens.",
          "Come back to the Suite. The alert clears once a payment goes through.",
        ],
      },
      {
        heading: "If the alert stays",
        text: "If you updated your card and it is still there, open Help, then Contact Support.",
      },
    ],
    tryIt: { label: "Open Billing", href: "/settings?tab=billing", task: "Read your Current plan and renewal date.", question: "What in your business is close to outgrowing your current setup: team seats, email accounts or something else?" },
    questions: [
      { id: "ec3-1", q: "Your bell says your last payment did not go through. What do you do?", right: "Press Manage billing in Settings > Billing and update your card", wrong: ["Wait, because it clears by itself", "Have a team member fix it", "Open a new account"], why: "The alert clears once a payment goes through." },
      { id: "ec3-2", q: "Can a team member update the card?", right: "No, only the account owner can", wrong: ["Yes, any Admin", "Yes, any Editor", "Only a Bookkeeper"], why: "Billing is closed to team members." },
      { id: "ec3-3", q: "What happens when you move up a plan?", right: "Your card is charged the prorated difference and you get a confirming email", wrong: ["The full year is charged", "Nothing until next year", "You lose your data"], why: "Moving down credits the unused part of your current period." },
      { id: "ec3-4", q: "You want to cancel. Where do you go?", right: "Contact support, because it is not in Manage billing", wrong: ["Press Cancel in Manage billing", "Delete your workspace", "Remove your card"], why: "Cancelling is not available in Manage billing." },
    ],
  },
  {
    ...base,
    id: "ec-canada",
    track: "client",
    title: "Two currencies and Canadian sales tax",
    minutes: 9,
    summary: "How USD and CAD stay apart, and how GST/HST, QST, PST and RST work in the Suite.",
    sources: ["currency-usd-and-cad", "gst-hst", "provincial-sales-tax-qst-pst-rst"],
    sections: [
      {
        heading: "Two currencies, always separate",
        text: "Pick your main currency in Settings > Integrations. New items start in it, and the USD/CAD picker switches any single item. The Suite never adds the two together or converts one into the other. Look for Kept separate under a total. Changing your main currency never changes anything you already entered.",
      },
      {
        heading: "How it reaches your score",
        text: "Your Finance dimension counts income and expenses in your main currency only. Amounts in your other currency stay out of that score.",
      },
      {
        heading: "Stripe and Canadian dollars",
        text: "Stripe charges in the item's own currency. To be paid in Canadian dollars without conversion, connect a Canadian Stripe account. A US Stripe account can charge in CAD, but Stripe converts it to US dollars and charges a conversion fee.",
      },
      {
        heading: "Turning on GST/HST",
        steps: [
          "Open Settings, press Integrations and find Canadian sales tax. It shows when your main currency is Canadian dollars.",
          "Tick My business is registered for GST/HST, add your number, province and how often you file, and press Save sales tax settings.",
          "If you made payment links before, press Remake on each offer so they charge the tax.",
          "Add the GST/HST you paid when you enter expenses, using the GST/HST box.",
        ],
      },
      {
        heading: "At return time",
        text: "Open Sales tax under Finance, pick the period, check any sales under Check these sales, and press Download for my accountant (CSV). Only Canadian-dollar entries are counted. The Suite does not file your return. You or your accountant file with the CRA.",
      },
      {
        heading: "Provincial sales tax",
        text: "Each of QST, PST and RST has its own number, filing schedule and return section, and tax is added only for customers in a province you are registered in. QST is added for Quebec customers on everything that has GST. BC, Saskatchewan and Manitoba tax is added only where you tick Provincial sales tax applies. The Suite never decides whether PST applies, so ask your tax professional.",
      },
      {
        heading: "Alerts and claim-backs",
        text: "If your main currency is Canadian dollars and you are not registered, you get an alert as your sales near the $30,000 GST/HST registration line, and again if you pass it. That alert is for GST/HST only. The claim-back box is for QST only. PST and RST you paid are treated as part of the cost.",
      },
    ],
    tryIt: { label: "Open Sales tax", href: "/finance/gst-hst", task: "If your account uses Canadian dollars, find your current period. If not, read Currency in Settings > Integrations.", question: "Where are your customers, and what question should you take to your tax professional?" },
    questions: [
      { id: "ec4-1", q: "Does the Suite convert USD into CAD in a total?", right: "No, the two are kept separate and never added together", wrong: ["Yes, at today's rate", "Yes, once a month", "Only on the Finance Center"], why: "There are no exchange rates. Look for Kept separate under a total." },
      { id: "ec4-2", q: "You earn in both currencies. Which counts toward your Finance dimension?", right: "Your main currency only", wrong: ["Both, added together", "Whichever is larger", "Neither"], why: "Amounts in your other currency stay out of that score." },
      { id: "ec4-3", q: "You registered for GST/HST after making payment links. What must you do?", right: "Press Remake on each offer so they charge the tax", wrong: ["Nothing, they update", "Delete your offers", "Tell each buyer by email"], why: "A link made before you turned tax on adds none." },
      { id: "ec4-4", q: "Does the Suite file your GST/HST return?", right: "No, you or your accountant file with the CRA", wrong: ["Yes, each quarter", "Yes, on Approve", "Yes, through Stripe"], why: "It works out the numbers from what you recorded." },
      { id: "ec4-5", q: "Does PST apply to what you sell in BC?", right: "The Suite never decides, so ask your tax professional", wrong: ["Yes, always", "No, never", "Your assistant decides"], why: "BC, Saskatchewan and Manitoba tax is added only where you tick it." },
      { id: "ec4-6", q: "Will the Suite warn you about provincial registration?", right: "No, the $30,000 alert is for GST/HST only", wrong: ["Yes, at $30,000", "Yes, for every province", "Yes, through the bell at $10,000"], why: "Ask your tax professional about the rules in your province." },
    ],
  },
  {
    ...base,
    id: "ec-year-end",
    track: "client",
    title: "Contractor totals and your partner links",
    minutes: 6,
    summary: "Getting 1099 totals ready for your accountant, and sharing LifeCharter as an affiliate.",
    sources: ["1099-contractor-totals", "your-own-lifecharter-affiliate-links"],
    sections: [
      {
        heading: "1099 contractor totals",
        text: "This page lists everyone you paid in a year, from the Paid to name on your expenses. It is built for US businesses, because a 1099 is a US form. Pick the year, then tick Contractor beside each person or business you paid for work who is not your employee.",
      },
      {
        heading: "Ticks that matter",
        text: "Tick W-9 on file once you have their form, and Only by card / PayPal if you never paid them any other way. Likely needed means that contractor is ticked, was not paid only by card or PayPal, and reached the reporting amount shown for that year. It is a guide to bring to your accountant, not tax advice.",
      },
      {
        heading: "When someone is missing",
        text: "Expenses with no Paid to name are not on the list. The box at the top shows their total, so add the name on the Expenses page. The page counts US-dollar payments only, so someone paid only in Canadian dollars is left off. The same payee counts as one person even if you typed the name a little differently.",
      },
      {
        heading: "The forms themselves",
        text: "The Suite does not file the 1099. The page gives you the totals and Download for my accountant. You or your accountant prepare and file the forms.",
      },
      {
        heading: "My partnerships",
        text: "If your login email is set up as an affiliate, Affiliates shows a My partnerships tab. Press Copy link beside a LifeCharter product link, and a sale through your link is credited to you. Your report at the bottom of the tab shows your numbers month by month. If you expected the tab and do not see it, ask LifeCharter support.",
      },
      {
        heading: "Two different things",
        text: "This tab is for links you share as someone else's affiliate. The other tabs are for your own program and the people who promote you. These links sit with LifeCharter, so they do not count as affiliates in your own program. Each link shows the date it runs until, and Paused means it is not active right now.",
      },
    ],
    tryIt: { label: "Open 1099 contractor totals", href: "/finance/1099", task: "Pick last year or this year and look for the box showing expenses with no Paid to name.", question: "Who do you pay for work in your business, and who still needs to send you paperwork?" },
    questions: [
      { id: "ec5-1", q: "Someone you paid is missing from the 1099 page. What do you check first?", right: "That the expense has a Paid to name", wrong: ["That they have a tag", "That Stripe is connected", "That they are on your team"], why: "The page lists expenses with a Paid to name." },
      { id: "ec5-2", q: "Does the Suite file your 1099s?", right: "No, you or your accountant prepare and file them", wrong: ["Yes, each January", "Yes, on Approve", "Yes, through Stripe"], why: "The page gives you the totals and the download." },
      { id: "ec5-3", q: "A contractor shows Likely needed. What does it mean?", right: "It is a guide to bring to your accountant", wrong: ["The form was filed", "You owe a penalty", "They must be fired"], why: "It is not tax advice." },
      { id: "ec5-4", q: "You paid someone only in Canadian dollars. Are they on the 1099 page?", right: "No, it counts US-dollar payments only", wrong: ["Yes, converted", "Yes, in a separate list", "Only if ticked"], why: "A 1099 is a US form." },
      { id: "ec5-5", q: "Do your LifeCharter partner links count as affiliates in your own program?", right: "No, they sit with LifeCharter", wrong: ["Yes, each one counts", "Yes, in your Referral Process pillar", "Only if paid"], why: "They do not change your scores." },
    ],
  },
  {
    ...base,
    id: "et-new-client",
    track: "team-ops",
    title: "Helping a new client arrive",
    minutes: 6,
    summary: "What a new client receives, in what order, and how to answer when something does not arrive.",
    sources: ["your-welcome-emails-and-calls", "calls-with-the-lifecharter-team", "welcome-overview"],
    sections: [
      {
        heading: "You do not get these emails",
        text: "Team members do not get the welcome emails, so it helps to know what a new client sees. They come to the email address on the client's account.",
      },
      {
        heading: "The order",
        steps: [
          "The setup email, Your first hour in Command Suite, step by step, comes shortly after the account opens.",
          "It leads them to sign in, open the Starter Guide, connect their AI and begin their assessments.",
          "They book the one-on-one Welcome Call, then add the Launch Call invitation to their calendar.",
          "After all three assessments, the Next Chapter Call invitation arrives.",
        ],
      },
      {
        heading: "More over two weeks",
        text: "More emails follow over the first two weeks, covering their tool connection and website, The Collective, the Website Alignment Review and what is next. One that no longer applies may be skipped. The Why your assessment answers matter email is skipped once the three assessments are done.",
      },
      {
        heading: "Launch Call timing",
        text: "A client books by the Wednesday before a Thursday call to join that one. Otherwise they join the next one, and it always comes after their Welcome Call. Any client is welcome at any Launch Call.",
      },
      {
        heading: "Booking links",
        text: "These are the team's calendars. A client books their Welcome Call after they sign, with the link in their email. Booking opens up to 30 days ahead. A Welcome Call needs 12 hours' notice and a Check-In Call needs 24 hours'. Reschedule or cancel is offered after booking.",
      },
      {
        heading: "When an email is missing",
        text: "Ask them to check Other, Promotions and Spam, or write to support@lccommandsuite.com. For a picture of what is ahead, point them to the Welcome Overview, which stays open while they finish their three assessments.",
      },
    ],
    tryIt: { label: "Open the Welcome Overview", href: "/handouts/client-welcome-overview.pdf", task: "Look at the big-picture map and one area page.", question: "What do new clients of this business most often ask in their first week?" },
    questions: [
      { id: "et1-1", q: "A new client asks what to do first. Which email should they look for?", right: "Your first hour in Command Suite, step by step", wrong: ["Their first invoice", "The Next Chapter Call invitation", "The exit survey"], why: "The setup email comes first, shortly after the account opens." },
      { id: "et1-2", q: "A client books on the Thursday of a Launch Call week. Which Launch Call do they join?", right: "The next one", wrong: ["That day's call", "None, they missed it", "One from last month"], why: "They need to book by the Wednesday before a Thursday call." },
      { id: "et1-3", q: "A client did not get the Why your assessment answers matter email, and their assessments are done. Is something wrong?", right: "No, it is skipped once the three assessments are done", wrong: ["Yes, resend it", "Yes, email sending failed", "Yes, they are locked"], why: "An email that no longer applies may be skipped." },
      { id: "et1-4", q: "A client cannot find their setup email. What do you suggest?", right: "Check Other, Promotions and Spam, or write to support", wrong: ["Open a new account", "Wait a month", "Reset their scores"], why: "Support is at support@lccommandsuite.com." },
    ],
  },
  {
    ...base,
    id: "et-money-edge",
    track: "team-ops",
    title: "Unusual money questions",
    minutes: 7,
    summary: "Canadian entries, sales tax boxes and contractor totals, and what only the owner or an accountant can do.",
    sources: ["currency-usd-and-cad", "gst-hst", "provincial-sales-tax-qst-pst-rst", "1099-contractor-totals"],
    sections: [
      {
        heading: "What only the owner can do",
        text: "Team members do not see Settings > Integrations, so only the account owner can change the main currency or turn on sales tax. You need the Finance area to see the reports.",
      },
      {
        heading: "Entering the other currency",
        text: "Use the USD/CAD picker next to an amount. The Suite never adds the two together or converts them, and Kept separate under a total is your other currency.",
      },
      {
        heading: "Entering tax paid",
        text: "On a registered account, add the GST/HST paid in the GST/HST box when you enter an expense. A Quebec registrant can record QST paid. PST and RST paid are treated as part of the cost, so there is nothing to claim back here.",
      },
      {
        heading: "Preparing a return",
        text: "Open Sales tax under Finance and use the arrows to pick the period. Check any sales under Check these sales, then press Download for my accountant (CSV). Each provincial registration has its own section and period. The dates shown are the GST/HST dates, and a province's own dates can differ.",
      },
      {
        heading: "1099 totals",
        text: "Tick Contractor, W-9 on file and Only by card / PayPal where they fit, then press Download for my accountant. Add a missing Paid to name on the Expenses page. The page counts US-dollar payments only.",
      },
      {
        heading: "Where you stop",
        text: "The Suite does not file anything, and these pages are not tax advice. Adjustments, instalments and anything unusual are for the accountant.",
      },
    ],
    tryIt: { label: "Open 1099 contractor totals", href: "/finance/1099", task: "Use Show only contractors and see what is ticked.", question: "Which money question in this business should always go to the accountant, not to you?" },
    questions: [
      { id: "et2-1", q: "An owner asks you to turn on GST/HST. Can you?", right: "No, only the owner can, in Settings > Integrations", wrong: ["Yes, in Finance", "Yes, in Contacts", "Yes, with your assistant"], why: "Team members do not see Settings > Integrations." },
      { id: "et2-2", q: "You enter PST paid on an expense. Can it be claimed back here?", right: "No, PST and RST paid are treated as part of the cost", wrong: ["Yes, in the claim-back box", "Yes, in the QST box", "Yes, on the 1099 page"], why: "The claim-back box is for QST only." },
      { id: "et2-3", q: "The file by date shows on a provincial return. Is it certain?", right: "No, those are GST/HST dates, so a province's own can differ", wrong: ["Yes, always", "Yes, for BC only", "It is a billing date"], why: "Confirm them with a tax professional." },
      { id: "et2-4", q: "Someone paid by check is missing from the 1099 page, and their expense has no Paid to name. What do you do?", right: "Add the name on the Expenses page", wrong: ["Tick Contractor on a blank line", "Delete the expense", "Add them as a team member"], why: "Expenses with no Paid to name are not on the list." },
      { id: "et2-5", q: "An unusual instalment question comes up. Who handles it?", right: "The accountant", wrong: ["You, from memory", "Your assistant, on Approve", "The Collective"], why: "Adjustments, instalments and anything unusual are for your accountant." },
    ],
  },
  {
    ...base,
    id: "et-mentor",
    track: "team-ops",
    title: "Helping a new teammate",
    minutes: 6,
    summary: "Getting someone signed in, and working out why they cannot see or do something.",
    sources: ["accepting-a-team-invitation", "team-access-limits", "glossary", "starter-guide"],
    sections: [
      {
        heading: "Getting in",
        text: "The email is called You're invited to join, followed by the team's name. If they already have a LifeCharter login with this email, the button says Sign in to Command Suite, so they use their usual password. If it never arrived, ask the person who invited them to press Send invitation again, or to copy the link and send it.",
      },
      {
        heading: "Why something is missing",
        text: "The owner or an Admin chooses each area: No access, View or Edit, often from a preset such as Virtual assistant, Bookkeeper, Sales, Content, Viewer, or Support & client care. Changes apply the next time they open a page.",
      },
      {
        heading: "Show only the areas above",
        text: "With this on, everything else closes and leaves their menu, including Executive Home and the assistant. Settings and Help stay open. They also will not see the Glossary or Starter Guide.",
      },
      {
        heading: "Only their own",
        text: "With Tasks and Reminders set to only their own, they see only what is theirs. The reminders they make are emailed to them and stay off the owner's list and bell.",
      },
      {
        heading: "Cannot delete",
        text: "They can add, edit and update, but a delete is refused and they are asked to come to the owner.",
      },
      {
        heading: "Closed to everyone",
        text: "Billing, API keys, connected accounts and other members' details stay closed, whatever is chosen. Edit access is there for Editors and Viewers only, because an Admin has what the Admin role allows.",
      },
    ],
    tryIt: { label: "Open the Glossary", href: "/glossary", task: "Find one Suite word a new teammate would not know.", question: "What would a new teammate in this business need to learn in their first week?" },
    questions: [
      { id: "et3-1", q: "A new teammate's button says Sign in to Command Suite, not Set your password. Why?", right: "They already have a LifeCharter login with this email", wrong: ["Their invitation failed", "They were removed", "They need a new email"], why: "They use their usual password." },
      { id: "et3-2", q: "A teammate's Executive Home is gone. What is the likely reason?", right: "They are set to Show only the areas above", wrong: ["The page was deleted", "Their password expired", "It moved to Settings"], why: "Everything else closes and leaves their menu. Settings and Help stay open." },
      { id: "et3-3", q: "A teammate's delete is refused. What should they do?", right: "Come to the owner", wrong: ["Keep trying", "Ask support to delete it", "Use another login"], why: "With that limit, a delete is refused and they are asked to come to the owner." },
      { id: "et3-4", q: "An owner cannot find Edit access on an Admin's card. Why?", right: "It is there for Editors and Viewers only", wrong: ["The Admin must be removed", "It is a glitch", "It needs a higher plan"], why: "An Admin has what the Admin role allows." },
      { id: "et3-5", q: "A teammate made a reminder while limited to only their own. Who gets it?", right: "They do, and it stays off the owner's list and bell", wrong: ["The owner", "Everyone", "Nobody"], why: "The reminders they make are emailed to them." },
    ],
  },
  {
    ...base,
    id: "es-questions",
    track: "team-sales",
    title: "Answering a prospect's hard questions",
    minutes: 6,
    summary: "True answers on data, AI and what is included, and how to say I will find out.",
    sources: ["privacy-terms-and-your-agreement", "who-has-opened-my-account", "ai-assistant-setup-and-your-key", "website-review", "the-collective", "connect-stripe"],
    sections: [
      {
        heading: "Who can see my business?",
        text: "LifeCharter support can open an account only in a read-only view, to help with a support request. Support can look, but cannot change, send or delete anything. The owner can see each time it happened.",
      },
      {
        heading: "Is my data in the community?",
        text: "No. The Collective is a separate space, and nothing from the Command Suite is shared with the community.",
      },
      {
        heading: "Do I need my own AI?",
        text: "The Suite uses an API key from the AI company the client chooses. An API key is not a ChatGPT or Claude login, and those logins will not work. The company charges the client's own account for what they use, and LifeCharter receives none of that charge.",
      },
      {
        heading: "Does the Suite hold my money?",
        text: "No. Payment links, invoices and booking payments are made on the client's own Stripe account, so the money goes straight to them.",
      },
      {
        heading: "What about my website?",
        text: "The Website Alignment Review is included with Command Suite. The team reads the website against the positioning, voice and offer being built, then gives the five changes that matter most. The plan sets how many reviews are included.",
      },
      {
        heading: "Where are the terms?",
        text: "The legal pages are public, so you can send the link: lccommandsuite.com/legal/privacy-policy, /legal/terms-of-sale and /legal/year-1-agreement. Questions about an agreement go through Help > Contact Support. Answer only from what you know, and if you are not sure, say you will find out.",
      },
    ],
    tryIt: { label: "Open the Privacy Policy", href: "/legal/privacy-policy", task: "Find what it says about Google data.", question: "What is the hardest question prospects of this business ask, and what is the true answer?" },
    questions: [
      { id: "es1-1", q: "A prospect asks if LifeCharter staff can change their data. What is true?", right: "No, support can look in a read-only view to help with a request", wrong: ["Yes, anytime", "Yes, if they pay extra", "Nobody can ever look"], why: "Support can look, but cannot change, send or delete anything." },
      { id: "es1-2", q: "A prospect asks if a ChatGPT subscription login will work in the Suite. What is true?", right: "No, it needs an API key", wrong: ["Yes, any login works", "Yes, for ChatGPT Plus", "No, LifeCharter supplies all AI"], why: "An API key is different from a subscription login." },
      { id: "es1-3", q: "Who charges for AI use?", right: "The AI company, on the client's own account", wrong: ["LifeCharter, on each invoice", "Stripe", "Nobody"], why: "LifeCharter receives none of that charge." },
      { id: "es1-4", q: "Do payments go through LifeCharter?", right: "No, they go straight to the client's own Stripe account", wrong: ["Yes, then monthly", "Yes, minus a share", "Only for invoices"], why: "Everything is made on their own Stripe account." },
      { id: "es1-5", q: "A prospect wants to read the terms before a call. What do you do?", right: "Send the public page, because no sign-in is needed", wrong: ["Say they are private", "Paste them from memory", "Ask them to sign up first"], why: "These pages are public." },
    ],
  },
  {
    ...base,
    id: "es-canada",
    track: "team-sales",
    title: "Selling to Canadian buyers",
    minutes: 6,
    summary: "How currency and sales tax show up on offers, links, bookings and invoices.",
    sources: ["currency-usd-and-cad", "gst-hst", "provincial-sales-tax-qst-pst-rst", "payment-links-on-offers"],
    sections: [
      {
        heading: "Each item has its own currency",
        text: "An account has a main currency, US or Canadian dollars, and any single item can use the other with the USD/CAD picker. Stripe charges in the item's own currency, so a CAD offer charges in CAD. There are no exchange rates in the Suite, and other currencies are not available.",
      },
      {
        heading: "A CAD offer on a US Stripe account",
        text: "A US Stripe account can charge in CAD, but Stripe converts it to US dollars and charges a conversion fee. To be paid in Canadian dollars without conversion, the seller connects a Canadian Stripe account.",
      },
      {
        heading: "Tax on a payment link",
        text: "A buyer pays tax through a link only if the seller collects GST/HST or a provincial sales tax. The link then opens a short page where the buyer picks their province, or Outside Canada, and sees the tax before paying. A link made before tax was turned on adds none, so it needs Remake.",
      },
      {
        heading: "Which rate",
        text: "The rate is for where the customer is: 13% HST in Ontario, 14% in Nova Scotia, 15% in New Brunswick, Newfoundland and Labrador and Prince Edward Island, and 5% GST elsewhere in Canada. Customers outside Canada are not charged.",
      },
      {
        heading: "On an invoice",
        text: "The province comes from the contact's address and can be changed in Customer is in. Each tax shows as its own line on invoices, pay pages and bookings.",
      },
      {
        heading: "What you do not answer",
        text: "Whether a buyer or seller should register, or whether PST applies to what is sold, is for their tax professional. The Suite never decides that for them, and neither do you.",
      },
    ],
    tryIt: { label: "Open Offers & Packages", href: "/sales/offers", task: "Find which currency an offer uses.", question: "Which buyers outside your home country does this business serve, and what do they need to know before paying?" },
    questions: [
      { id: "es2-1", q: "A CAD offer is sold on a US Stripe account. What happens?", right: "Stripe converts it to US dollars and charges a conversion fee", wrong: ["Nothing different happens", "The sale fails", "The Suite pays the fee"], why: "A Canadian Stripe account avoids the conversion." },
      { id: "es2-2", q: "A buyer in Ontario pays through a link on a registered account. Which rate applies?", right: "13% HST", wrong: ["5% GST", "15% HST", "No tax"], why: "The rate follows where the customer is." },
      { id: "es2-3", q: "A customer outside Canada pays. Are they charged GST/HST?", right: "No", wrong: ["Yes, 5%", "Yes, 13%", "Only on invoices"], why: "Customers outside Canada are not charged." },
      { id: "es2-4", q: "A payment link was made before tax was turned on. What is the fix?", right: "It needs Remake", wrong: ["Add the tax by hand at checkout", "It updates overnight", "Send a second link for the tax"], why: "A link made before you turned tax on adds none." },
      { id: "es2-5", q: "A prospect asks if they must charge PST. What do you say?", right: "That is a question for their tax professional", wrong: ["Yes", "No", "Ask the assistant to decide"], why: "The Suite never decides that for you." },
    ],
  },
  {
    ...base,
    id: "es-handoff",
    track: "team-sales",
    title: "Handing over a new client",
    minutes: 5,
    summary: "What happens after someone says yes, so what you promise matches what arrives.",
    sources: ["calls-with-the-lifecharter-team", "your-welcome-emails-and-calls", "first-30-days", "starter-guide"],
    sections: [
      {
        heading: "After they sign",
        text: "The Welcome Call link comes in the email they get after they sign, with their name and email filled in. It is a 30-minute one-on-one with Babs on Zoom, and it needs 12 hours' notice.",
      },
      {
        heading: "The setup email",
        text: "Their setup email, Your first hour in Command Suite, step by step, comes shortly after the account opens. It leads them to sign in, open the Starter Guide, connect their AI and begin their assessments.",
      },
      {
        heading: "The first calls",
        text: "After booking the Welcome Call, they are invited to the next New Client Launch Call, every other Thursday at 1:00 PM Mountain for 90 minutes on Zoom. After all three assessments, they are invited to a Next Chapter Call on what their results show.",
      },
      {
        heading: "Set honest expectations",
        text: "Day 1 of the Starter Guide is about 6 to 10 hours, in as many sittings as they like, because it holds the three assessments. Most other days are under an hour. It is a path, not a deadline.",
      },
      {
        heading: "First 30 Days",
        text: "It has 23 steps that tick themselves off from the client's own data, and nothing closes after day 30.",
      },
      {
        heading: "If they need more",
        text: "A Client Check-In Call is a 30-minute one-on-one with Babs for extra support, at lccommandsuite.com/book/client-check-in-call. It needs 24 hours' notice.",
      },
    ],
    tryIt: { label: "Open the Starter Guide", href: "/starter-guide.html", task: "Find the table of your thirty days at a glance.", question: "What does a new client of this business need to hear from you right after they say yes?" },
    questions: [
      { id: "es3-1", q: "A new client asks when they book their Welcome Call. What do you say?", right: "After they sign, with the link in their email", wrong: ["Before they speak to anyone", "After day 30", "After the Next Chapter Call"], why: "The link is in the email they get, with their name and email filled in." },
      { id: "es3-2", q: "A new client asks how long Day 1 takes. What is honest?", right: "About 6 to 10 hours, in as many sittings as they like", wrong: ["About 15 minutes", "One sitting of an hour", "A full week without a break"], why: "Day 1 holds the three assessments. Most other days are under an hour." },
      { id: "es3-3", q: "What comes after finishing all three assessments?", right: "An invitation to a Next Chapter Call", wrong: ["A refund offer", "A new agreement", "A Launch Call cancellation"], why: "The call goes through what the results show and what to do first." },
      { id: "es3-4", q: "What happens after day 30 of First 30 Days?", right: "Nothing closes", wrong: ["The account locks", "Unfinished steps are deleted", "They must buy more days"], why: "The day count stops, and the steps stay to finish." },
    ],
  },
  {
    ...base,
    id: "e-final",
    track: "core",
    kind: "exam",
    title: "Final exam",
    minutes: 25,
    summary: "Twenty questions on real situations from all four levels. Pass with 80% to earn your Expert certificate.",
    sources: ["how-your-scores-work", "tasks", "pipeline", "waiting-for-my-approval", "import-contacts", "tag-library", "email-sending-setup", "bills-cash-calendar", "payment-links-on-offers", "lc-plume", "operations", "go-deeper-questionnaires", "payments-invoices", "what-the-suite-does-on-its-own", "the-collective", "my-alignment-journal", "welcome-overview", "who-has-opened-my-account", "newer-version-notice", "dimension-detail"],
    sections: [
      {
        heading: "How the final exam works",
        text: "The exam covers all four levels. Answer every question, then press Check my answers. You need 80% to pass. It shows which questions you missed without giving the answers, so go back to the lessons and try again. Retakes are unlimited.",
      },
    ],
    questions: [
      { id: "ex-1", q: "A client asks whether AI decided their overall score. What do you tell them?", right: "No, AI only reads written Brain and Soul answers, and fixed weights do the rest", wrong: ["Yes, AI sets every score", "Yes, and they can argue with it in chat", "No, the team types it in"], why: "" },
      { id: "ex-2", q: "A client is afraid their tasks with no date are hurting their score. What is true?", right: "Tasks with no date never count against them", wrong: ["Each one lowers the score", "They count as overdue after a week", "They are deleted at month end"], why: "" },
      { id: "ex-3", q: "You move a task to Waiting with a Check back date. What happens on that day?", right: "It returns to Today with a Time to check chip", wrong: ["It is deleted", "It emails the person", "It moves to Done"], why: "" },
      { id: "ex-4", q: "A deal is worth $2,000 at 25% odds. What does it add to Weighted by probability?", right: "$500", wrong: ["$2,000", "$25", "$2,500"], why: "" },
      { id: "ex-5", q: "A client typed I approve in the chat, and nothing happened. What is the fix?", right: "Press the Approve button on the card", wrong: ["Type it again in capitals", "Restart the assistant", "Ask support to approve it"], why: "" },
      { id: "ex-6", q: "A client imports 400 people and worries they were emailed. What is true?", right: "Importing does not email anyone or start a campaign", wrong: ["They each got a welcome email", "Only the first 100 were emailed", "They are in every campaign"], why: "" },
      { id: "ex-7", q: "A tag keeps coming back after you rename it. Where do you look?", right: "On the form, calendar or pipeline still adding the old name", wrong: ["In Billing", "In the Glossary", "In Weekly View"], why: "" },
      { id: "ex-8", q: "A client connected Google and asks why campaigns will not send. What is missing?", right: "The Email sending setup with their own Resend account", wrong: ["A second Google account", "A team member", "A Stripe connection"], why: "" },
      { id: "ex-9", q: "An autopay bill shows overdue, though the money left the bank. What do you do?", right: "Press Paid, because the page cannot see the bank", wrong: ["Add a second bill", "Delete the bill", "Wait for it to clear"], why: "" },
      { id: "ex-10", q: "An offer's price changed, and buyers are paying the old price. What was missed?", right: "Remake on the payment link", wrong: ["A new tag", "A new campaign", "Turning on Stripe sync"], why: "" },
      { id: "ex-11", q: "A signer has an agreement with the wrong start date. What is the right fix?", right: "Void it, make a copy, fix the copy and send that", wrong: ["Edit it in place", "Delete it from the list", "Ask them to initial a change"], why: "" },
      { id: "ex-12", q: "A score has a clock mark, and a colleague says it no longer counts. What is true?", right: "It still counts, and the mark is a nudge to refresh it", wrong: ["It counts as zero", "It has been removed", "It counts double"], why: "" },
      { id: "ex-13", q: "A client's Operations score is not the average of their pillars. How do you explain it?", right: "The pillar average is one part, alongside Profit, Brain and Quick Pulse", wrong: ["It is a glitch", "Pillars do not feed it", "Only the top pillar counts"], why: "" },
      { id: "ex-14", q: "A client wrote long Go deeper answers, and the score did not move. What do you tell them?", right: "Choice answers move the score, and open-text answers shape AI insights", wrong: ["Write longer answers", "Retake Soul", "Ask support to score them"], why: "" },
      { id: "ex-15", q: "A client paid an invoice, and their open deal for that offer is still open a minute later. What should you expect?", right: "It moves to Won on its own", wrong: ["It must be deleted", "It moves to Lost", "It stays until year end"], why: "" },
      { id: "ex-16", q: "A client fears the Suite is emailing people behind their back. What is true?", right: "Nothing goes to clients unless they turned it on or scheduled it", wrong: ["It sends a monthly newsletter", "Support sends on their behalf", "It emails all new contacts"], why: "" },
      { id: "ex-17", q: "A member asks if the community can see their income. What is true?", right: "No, nothing from the Command Suite is shared with the community", wrong: ["Yes, on their profile", "Yes, in the directory", "Only with Plus"], why: "" },
      { id: "ex-18", q: "A member wants to share their weekly reflection. What do you tell them?", right: "Only intentions and wins can be shared", wrong: ["Turn on Plus first", "Post it from the Suite", "Any entry can be shared"], why: "" },
      { id: "ex-19", q: "You are showing the whole Suite to someone new. Which do you open first?", right: "The Welcome Overview", wrong: ["Payments & Invoices", "The Tag Library", "Time"], why: "" },
      { id: "ex-20", q: "An owner sees support opened their account last Tuesday and is alarmed. What is true?", right: "It was read-only, and they can ask about it through Contact Support", wrong: ["Support changed their data", "Their password was stolen", "The list is always wrong"], why: "" },
    ],
  },
];
