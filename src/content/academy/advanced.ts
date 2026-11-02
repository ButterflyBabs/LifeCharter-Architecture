import type { Lesson } from "@/lib/academy/types";

// Advanced: written from the User Guide entries named in each lesson's sources. Change the app and the matching lesson
// must change too: see "Update et al" in CLAUDE.md. The first answer in each question is held in `right`; the page
// shuffles the order.
const base = { level: "advanced" as const, kind: "lesson" as const };

export const ADVANCED: Lesson[] = [
  {
    ...base,
    id: "a-read-score",
    track: "core",
    title: "Reading what a score is saying",
    minutes: 8,
    summary: "How a dimension is built, what its marks mean and how to go from a number to the work behind it.",
    sources: ["how-your-scores-work", "dimension-detail"],
    sections: [
      {
        heading: "Every dimension has its own mix",
        text: "A dimension can draw on your Profit, Brain and Soul assessments, your latest Quick Pulse, live data from the Suite and how complete your plans are. Each one blends its inputs at set weights, and your overall score averages the dimensions that have a score.",
      },
      {
        heading: "Open the dimension",
        steps: [
          "On Executive Home, find 12 Business Dimensions and press a dimension card.",
          "Read each input and how much of the score it carries.",
          "Press an input to go where you can improve it.",
          "Scroll down to the lessons and press Show me how for one written for your business.",
          "Press Start the assessment to set milestones for this quarter.",
        ],
      },
      {
        heading: "Reading the marks",
        text: "A check mark means an input is current, a clock means it is getting stale, and an empty circle means it has no data yet. A dash means no data, and its weight spreads across the other inputs until it has some. Partial means some inputs are still pending, so the score uses what is there and firms up as the rest comes in.",
      },
      {
        heading: "Stale does not mean lower",
        text: "After 90 days an assessment input is marked getting stale, and after 14 days a Quick Pulse is too. It still counts. The mark is a nudge to refresh it.",
      },
      {
        heading: "What moves the number",
        text: "Improve any input and the score follows. Reading lessons and setting milestones do not change the score themselves. A score under 60 shows Learn how to lift this on Executive Home and takes you straight to the lessons.",
      },
      {
        heading: "Where milestones go",
        text: "Answer four short questions and press Propose my milestones. Nothing is added until you choose them and press the Add button. They become quarter goals on your Goal Ladder, and they are saved under your plan, so build your Business Plan first.",
      },
    ],
    tryIt: { label: "Open a dimension", href: "/dimensions/marketing", task: "Read the inputs and find the one carrying the largest share of this score. Look for any clock or empty circle.", question: "Which input behind one of your scores could you improve this month, and what would you do?" },
    questions: [
      { id: "a1-1", q: "An input on a dimension shows a dash. What does that do to the score?", right: "Nothing is counted as zero, and its weight spreads across the other inputs", wrong: ["The whole dimension drops to zero", "The Suite estimates a number for it", "The dimension stops showing"], why: "A dash means no data yet. Its weight spreads across the other inputs until it has some." },
      { id: "a1-2", q: "An assessment input shows a clock. What does it mean?", right: "It is getting stale, and it still counts", wrong: ["It no longer counts", "It is being scored right now", "It has no data yet"], why: "A clock is a nudge to refresh it. A stale input still counts." },
      { id: "a1-3", q: "You read every lesson on a dimension page and set milestones. What happens to the score?", right: "Nothing, until the work improves an input", wrong: ["It rises by five points", "It moves up one phase", "It resets to your baseline"], why: "Reading lessons and setting milestones do not change the score themselves. Improve an input and the score follows." },
      { id: "a1-4", q: "You want to work on an input that is holding a score down. What is the quickest way there?", right: "Press that input on the dimension page", wrong: ["Type a new number into it", "Open Settings", "Ask support to change it"], why: "Pressing an input takes you where you can improve it." },
      { id: "a1-5", q: "You add milestones from a dimension page. Where do they go?", right: "They become quarter goals on your Goal Ladder", wrong: ["They go to Backlog with no date", "They become reminders", "They stay on that page only"], why: "Milestones become quarter goals, and you can tick a box to put each first step on your Tasks." },
    ],
  },
  {
    ...base,
    id: "a-keep-current",
    track: "core",
    title: "Keeping your scores current",
    minutes: 7,
    summary: "The Check-in Rhythm, Quick Pulse and reading how far you have come on Progress.",
    sources: ["alignment-profile", "quick-pulse-check-in", "progress"],
    sections: [
      {
        heading: "The suggested rhythm",
        text: "Quick Pulse monthly, Profit quarterly, Brain twice a year and Soul once a year. Your Check-in Rhythm on Alignment Profile shows when you last took each one, when it is next due and whether it is Not started, Due now, Due soon or Up to date.",
      },
      {
        heading: "Quick Pulse",
        text: "There are 18 questions, six each on Brain, Soul and Profit, and it takes about five minutes. It opens once your three assessments are finished. Your answers feed your 12 dimensions and 8 pillars. Your place is saved in the browser you are using, and it only reaches your account when you press Complete Check-in.",
      },
      {
        heading: "Three Steps Forward",
        text: "These come from a set list chosen by your lowest score and what changed since last time, not from AI. If nothing dropped, you see fewer steps.",
      },
      {
        heading: "Your written profile",
        text: "Write my profile has your assistant write a portrait of you and your business from your Brain, Soul and Profit answers. Private answers are never included. It does not change a score, but your assistant uses it.",
      },
      {
        heading: "If answers still need scoring",
        text: "If Brain or Soul was finished with no AI key connected, a card on Alignment Profile says those answers still need scoring. Add the key, come back and press Score my answers.",
      },
      {
        heading: "Reading Progress",
        text: "Progress shows your overall score and each dimension then and now. Your baseline stays fixed, so you always measure against where you started. The trend line grows when you complete a Quick Pulse Check-in. A dimension marked new had no score when your baseline was set. Plan execution counts your year goals only. Progress itself does not change your scores.",
      },
    ],
    tryIt: { label: "Open Alignment Profile", href: "/assessments", task: "Find Your Check-in Rhythm and see which assessment is due next.", question: "What has changed most in your business since your last check-in, and which score should show it?" },
    questions: [
      { id: "a2-1", q: "How often is Quick Pulse suggested?", right: "Monthly", wrong: ["Daily", "Quarterly", "Once a year"], why: "The rhythm is Quick Pulse monthly, Profit quarterly, Brain twice a year and Soul once a year." },
      { id: "a2-2", q: "You stop a Quick Pulse halfway and open it on another device. What happens?", right: "Your place is not there, because it is saved in the first browser", wrong: ["It picks up where you left off", "Your answers are already on your account", "It counts as complete"], why: "Your place is saved in the browser you are using. It reaches your account only when you press Complete Check-in." },
      { id: "a2-3", q: "Your trend line on Progress has not moved in months. What keeps it growing?", right: "Completing a Quick Pulse Check-in", wrong: ["Pressing Read my progress", "Opening the page each week", "Changing your baseline"], why: "Each check-in adds a dated point to your score trend." },
      { id: "a2-4", q: "A dimension on Progress says new. Why?", right: "It had no score when your baseline was set", wrong: ["It was added to the Suite this month", "It rose by more than ten points", "Your assessment expired"], why: "With no score at your baseline, there is nothing to compare it with yet." },
      { id: "a2-5", q: "Do your week goals count in Plan execution?", right: "No, it counts your year goals", wrong: ["Yes, all goals count", "Only those marked Met", "Only week goals count"], why: "Plan execution counts year goals. The Goal Ladder shows the steps under them." },
      { id: "a2-6", q: "A card says your Soul answers still need scoring. What do you do?", right: "Add your AI key, then press Score my answers", wrong: ["Retake the Soul assessment", "Ask support to score them", "Wait for the next Quick Pulse"], why: "Answers finished with no key wait for it. Score my answers then scores them." },
    ],
  },
  {
    ...base,
    id: "a-pillars",
    track: "core",
    dimension: "operations",
    title: "What moves each pillar",
    minutes: 9,
    summary: "How daily work feeds the 8 pillars, and how the pillars feed your Operations dimension.",
    sources: ["operations", "go-deeper-questionnaires", "how-your-scores-work", "pipeline", "campaigns", "testimonials", "weekly-review"],
    sections: [
      {
        heading: "From pillars to Operations",
        text: "Each pillar is scored from your Brain and Profit answers, your Quick Pulse check-ins, your activity in the Suite and that pillar's Go deeper answers. The average of the eight is one part of your Operations dimension. That is why your Operations score can differ from your pillar average: it also includes your Profit answers, Brain answers and Quick Pulse check-in.",
      },
      {
        heading: "Work that feeds a pillar",
        steps: [
          "Sales Journey: open deals with a Next step filled in.",
          "Communication: each campaign you have turned on. Pausing one takes it out of the count.",
          "Referral Process: the number of testimonials you have, with full marks for that part at five.",
          "Internal Process & Culture: finished work, plus reviews finished in the last 90 days, where three fills that part.",
        ],
      },
      {
        heading: "Task follow-through",
        text: "This part looks at work finished in the last 60 days, open tasks past their due date and tasks due in the next 14 days. It needs at least three of those to count, and tasks with no date never count against you.",
      },
      {
        heading: "Go deeper",
        text: "Each pillar has five or six questions about how that part of your business runs today. Answer what you can and skip what does not apply, then press Save answers. You can change them later.",
      },
      {
        heading: "What Go deeper scores",
        text: "Choice answers each carry a score, and the pillar's Go deeper score is their average. The channel and asking questions score on how many you pick. Open-text answers are not scored. They shape your AI insights.",
      },
      {
        heading: "Choosing where to focus",
        text: "Press Generate insights for a headline and a high, medium or low priority for the pillars that need you. Your last set stays on the page until you press Refresh. The pillar scores work without it.",
      },
    ],
    tryIt: { label: "Open Operations", href: "/operations", task: "Find your lowest pillar and read What your score is built from.", question: "Which pillar is holding your business back most, and what one piece of work would lift it?" },
    questions: [
      { id: "a3-1", q: "Why can your Operations score differ from the average of your pillars?", right: "It also includes your Profit answers, Brain answers and Quick Pulse check-in", wrong: ["It is a mistake to report", "It only counts your four highest pillars", "It is typed in by your coach"], why: "The pillar average is one part of the Operations dimension." },
      { id: "a3-2", q: "You wrote a long answer in Go deeper, and the pillar score did not change. Why?", right: "Open-text answers are not scored, only choice answers", wrong: ["The answer was too long", "You must wait a month", "Go deeper never affects a score"], why: "Open-text answers shape your AI insights. Choice answers move the score." },
      { id: "a3-3", q: "Which work feeds your Sales Journey pillar?", right: "Open deals with a Next step filled in", wrong: ["Testimonials you approved", "Campaigns you turned on", "Reviews you finished"], why: "A Next step on each open deal is what your Sales Journey pillar reads." },
      { id: "a3-4", q: "You pause a campaign. Which pillar notices?", right: "Communication", wrong: ["Fulfillment", "Sales Journey", "Onboarding"], why: "Each campaign you have turned on counts toward Communication. Pausing takes it out." },
      { id: "a3-5", q: "How does a task with no due date affect task follow-through?", right: "It never counts against you", wrong: ["It counts as overdue after 14 days", "It lowers the pillar each week", "It counts double when finished"], why: "Tasks with no date never count against you." },
      { id: "a3-6", q: "For Where do new clients come from today, what scores higher?", right: "More than one channel", wrong: ["Only one channel", "A long typed answer", "Skipping the question"], why: "That question scores on how many channels you pick." },
    ],
  },
  {
    ...base,
    id: "a-lead-to-client",
    track: "core",
    title: "From first contact to paying client",
    minutes: 9,
    summary: "Following one person from a form or booking through a deal, a payment and your Finance records.",
    sources: ["forms", "calendars-and-booking-pages", "pipeline", "payments-invoices", "client-care"],
    sections: [
      {
        heading: "One person, many pages",
        text: "The pages of the Suite hand work to each other. Follow one person and you can see where each piece of information comes from, and where to look when something seems missing.",
      },
      {
        heading: "They arrive",
        text: "A form saves the person as a contact, tags them and can start one of your campaigns. A booking puts the person in Contacts. New people from either count toward your Customer Acquisition pillar.",
      },
      {
        heading: "A deal opens",
        text: "Deals appear on the Pipeline on their own in two cases: a calendar set to Add each booking to the Pipeline as a deal, and a card moved to a Booked stage in Outreach Pipelines. Adding an email to a deal saves that person to Contacts, so you never enter them twice.",
      },
      {
        heading: "The call happens",
        text: "After the meeting, press Attended or No-show on the Bookings tab. If they cancel or do not show, the deal moves to Lost. If they book again it reopens. Calls and follow-ups you log on a deal also show in Sales Activities.",
      },
      {
        heading: "They pay",
        text: "A payment through the Suite does the rest on its own. It appears on Payments & Invoices, the person gets the customer tag and a tag for the offer, it goes on their timeline, and their open deal moves to Won unless that deal is for a different offer.",
      },
      {
        heading: "The money and the care",
        text: "The Stripe sync then puts the income, Stripe's fees and any affiliate credit in your Finance Center. The customer tag also lets Client Care find them, once its pieces are switched on: the 30-day check-in goes out 30 days after someone becomes a client.",
      },
    ],
    tryIt: { label: "Open Pipeline", href: "/sales/pipeline", task: "Open a deal and trace it back: find the person's contact record and their timeline.", question: "Where does a new client most often get stuck between first contact and paying you, and what would move them along?" },
    questions: [
      { id: "a4-1", q: "In which two cases does a deal appear on the Pipeline on its own?", right: "A calendar set to add bookings as deals, and a card moved to a Booked stage", wrong: ["A form submission and a broadcast", "A new tag and a new contact", "An opened email and a clicked link"], why: "Those are the two cases. Other deals you add yourself." },
      { id: "a4-2", q: "Someone with a booking deal cancels, then books again. What happens to the deal?", right: "It moved to Lost, and it reopens", wrong: ["It stays Lost for good", "A second deal is made", "It moves to Won"], why: "A cancel or no-show moves the deal to Lost. If they book again it reopens." },
      { id: "a4-3", q: "A client pays an invoice. Which of these happens on its own?", right: "They get the customer tag and their open deal moves to Won", wrong: ["They are added to every campaign", "A testimonial request is sent", "Their portal is created"], why: "The payment updates the contact, the timeline and the open deal, unless that deal is for a different offer." },
      { id: "a4-4", q: "An open deal is for a different offer from the one the person bought. What happens to it?", right: "It does not move to Won", wrong: ["It moves to Won anyway", "It is deleted", "It moves to Lost"], why: "The open deal moves to Won unless it is for a different offer." },
      { id: "a4-5", q: "A paid invoice does not show in your Finance Center yet. How does it get there?", right: "Through the Stripe sync", wrong: ["You must always type it in", "Through Client Care", "Through the Tag Library"], why: "Paid amounts reach your Finance ledger through the Stripe sync, and income can then feed your Finance dimension." },
    ],
  },
  {
    ...base,
    id: "a-on-its-own",
    track: "core",
    title: "What runs without you, and who to ask",
    minutes: 6,
    summary: "The jobs the Suite does on its own, how to trace a missing email and using your AI Business Guide.",
    sources: ["what-the-suite-does-on-its-own", "ai-business-guide"],
    sections: [
      {
        heading: "What it sends",
        text: "Scheduled broadcasts, the emails in your campaign series, reminders for booked meetings and events, and nudges to anyone who has not yet signed a document in LC Plume. Nothing goes to your clients unless you turned it on or scheduled it.",
      },
      {
        heading: "What it reminds you of",
        text: "Timed tasks and reminders you typed in, if you have email reminders on, and the once-a-day email about what needs your attention.",
      },
      {
        heading: "What it keeps up to date",
        text: "Sales from your connected Stripe account come into your records each morning, and connected calendars are checked regularly. All of this runs whether or not you are signed in.",
      },
      {
        heading: "When something goes quiet",
        text: "If a connected calendar stops working, you get a bell alert and an email with a link to reconnect it. If you did not get an email you expected, check Settings > Notifications and Settings > Out of office. Emails to your own contacts depend on your email sending setup.",
      },
      {
        heading: "Your AI Business Guide",
        text: "This card on Business Alignment greets you with your score and phase and lists your next moves as Suggested Focus. It is the same assistant as on Executive Home, with the same conversation. Ask one clear question, such as what to focus on this week. Anything it prepares waits behind Approve.",
      },
      {
        heading: "Better answers",
        text: "It reads your assessments, so more complete answers give you better guidance. Treat what it says as guidance. The final decisions are yours. It does not change your scores.",
      },
    ],
    tryIt: { label: "Open Business Alignment", href: "/business-alignment", task: "Find the AI Business Guide card and read your Suggested Focus.", question: "What one clear question would you ask about your business this week?" },
    questions: [
      { id: "a5-1", q: "Do you have to leave the Suite open for scheduled emails to go out?", right: "No, these jobs run whether or not you are signed in", wrong: ["Yes, on one device", "Yes, until the email is sent", "Only for broadcasts"], why: "These all run on their own." },
      { id: "a5-2", q: "Could the Suite email a client something you never set up?", right: "No, nothing goes to clients unless you turned it on or scheduled it", wrong: ["Yes, a monthly newsletter", "Yes, after every booking change you did not set", "Yes, if your score drops"], why: "Nothing goes to your clients unless you turned it on or scheduled it." },
      { id: "a5-3", q: "You did not get a reminder email you expected. Where do you check first?", right: "Settings > Notifications and Settings > Out of office", wrong: ["The Tag Library", "Business Alignment", "Your Pipeline"], why: "Those two settings control your reminder emails." },
      { id: "a5-4", q: "A connected calendar stops working. How do you find out?", right: "A bell alert and an email with a link to reconnect", wrong: ["You will not, unless you check", "Support calls you", "Your overall score drops"], why: "The Suite checks calendars regularly and tells you." },
      { id: "a5-5", q: "Is the AI Business Guide a different assistant from the one on Executive Home?", right: "No, it is the same assistant and the same conversation", wrong: ["Yes, it has its own memory", "Yes, it only knows your scores", "Yes, it can change things without Approve"], why: "It is the same assistant with the same memory of your recent conversation." },
    ],
  },
  {
    ...base,
    id: "ac-money-map",
    track: "client",
    dimension: "finance",
    title: "How your money pages connect",
    minutes: 9,
    summary: "Income goals, budgets and cash in the bank, and why you see more than one financial number.",
    sources: ["budget-planner", "cash-flow-dashboard", "finance-center"],
    sections: [
      {
        heading: "Three numbers, three meanings",
        text: "Financial health is worked out from your numbers, blending your profit margin with how spending tracks to budget. The Health Assessment score is your assistant's own grade from Run my assessment. Your Finance dimension is one of your 12 dimensions. They can differ, and neither of the first two is your Finance dimension score.",
      },
      {
        heading: "What feeds your Finance dimension",
        text: "Income and expenses you record, your Monthly income target and Cash in the bank. Your monthly income goal, or this month's own goal, is the target it measures income against.",
      },
      {
        heading: "What budgets do",
        text: "Your expense budgets do not change your Finance dimension. They feed the separate Financial health number and your budget lines.",
      },
      {
        heading: "Cash in the bank",
        text: "On the Cash Flow Dashboard, type what your business has in its accounts and press Set. Your Finance dimension uses it to work out how many months of expenses you have covered. Update it when it changes. The date under the box shows when you last did.",
      },
      {
        heading: "Setting your goals",
        text: "On Budget Planner, type a Weekly, Monthly or Yearly goal and press Set. Leave Weekly or Yearly blank and they are worked out from your monthly goal. If you are growing, give each of the next 12 months its own goal. A month left blank uses your monthly goal.",
      },
      {
        heading: "Spent, still due and left",
        text: "Each category shows spent against its monthly budget. When bills in that category are still due this month, a line adds what is due and what is left. That is how Bills & Cash Calendar reaches your budget.",
      },
      {
        heading: "Suggest a budget",
        text: "Your assistant builds a monthly budget from what you spent over about the last three months. Nothing is saved until you press Use this budget. It sets a budget for each category it lists, and your other budgets stay as they are.",
      },
    ],
    tryIt: { label: "Open Budget Planner", href: "/finance/budget", task: "Check whether a monthly income goal is set, and see what is still due this month.", question: "What monthly income goal fits your business now, and how many months of expenses do you want covered?" },
    questions: [
      { id: "ac1-1", q: "Your Financial health number and Health Assessment score differ. Is something wrong?", right: "No, one is worked out from your numbers and the other is your assistant's grade", wrong: ["Yes, report it to support", "Yes, your records were counted twice", "Yes, your AI key has expired"], why: "They can differ, and neither one is your Finance dimension score." },
      { id: "ac1-2", q: "You lower your expense budgets. Does your Finance dimension change from that?", right: "No, budgets feed Financial health and your budget lines", wrong: ["Yes, it rises straight away", "Yes, it falls straight away", "Only in December"], why: "Your expense budgets do not change that dimension." },
      { id: "ac1-3", q: "What does your Finance dimension use Cash in the bank for?", right: "To work out how many months of expenses you have covered", wrong: ["To pay your bills", "To set your tax rate", "To connect your bank"], why: "It uses the figure you type to work that out, so update it when it changes." },
      { id: "ac1-4", q: "You leave one month blank under Month-by-month income goals. What is used for that month?", right: "Your monthly goal", wrong: ["Zero", "Last year's income", "The highest month"], why: "A month left blank under Month-by-month uses your monthly goal." },
      { id: "ac1-5", q: "Does Use this budget replace your whole budget?", right: "No, it sets only the categories it lists", wrong: ["Yes, everything is replaced", "Yes, including your income goals", "It only saves a copy"], why: "Other category budgets and your overall budget stay as they are." },
    ],
  },
  {
    ...base,
    id: "ac-forecast",
    track: "client",
    title: "Looking ahead and looking back",
    minutes: 9,
    summary: "Forecasting from your own numbers, sharing a finished plan and your Year in Review.",
    sources: ["forecasting", "print-or-share-a-plan", "year-in-review"],
    sections: [
      {
        heading: "Where the forecast comes from",
        text: "Your starting point is your average monthly income, using your three most recent months. Growth is applied each month, your expected pipeline closings are added, and your expense ratio is taken off. You see Conservative, Expected and Optimistic, 1 to 24 months ahead.",
      },
      {
        heading: "Setting assumptions",
        text: "Set Horizon (months), Growth %/mo, Pipeline close % and Expense %, then press Recalculate. Leave Expense % at 0 and it is worked out from your own income and expenses. When your Pipeline has open deals, the close rate comes from each deal's own probability, so there is nothing to type.",
      },
      {
        heading: "How one number reaches your score",
        text: "Your forecast does not change your scores. But if you press Use as my income goals, the monthly goal becomes the target your Finance dimension measures income against. The numbers need no AI, and a suggested goal is not saved until you press that button.",
      },
      {
        heading: "Showing your revenue plan",
        text: "With no income recorded, the page shows your own income goals as a plan, revenue only. Once you record income, it switches to projections.",
      },
      {
        heading: "Sharing a finished plan",
        text: "Print / Share turns a plan into a branded PDF or Word document. It is locked until every section has text and is marked Complete, Optional ones too. Each plan unlocks on its own. Changing a section's text locks it again until you mark it, and files do not update on their own, so download a fresh copy after a change.",
      },
      {
        heading: "Your Year in Review",
        text: "Your year on one page, built from what is already in your Suite. If a number looks off, fix it on its own page. Tag contacts client or customer so they count as new customers. Make a share link creates a private page for that year, and anyone with the link can see it. Money stays hidden unless you tick the box, and Stop sharing ends the link at once.",
      },
    ],
    tryIt: { label: "Open Forecasting", href: "/planning/forecast", task: "Set a Horizon, press Recalculate and press a scenario to see it month by month.", question: "What would have to be true for your Optimistic scenario to happen?" },
    questions: [
      { id: "ac2-1", q: "What is the forecast's starting point?", right: "Your average monthly income over your three most recent months", wrong: ["Last year's total", "Your income goal only", "A number you type in"], why: "Growth, pipeline closings and your expense ratio are applied from there." },
      { id: "ac2-2", q: "You cannot change Pipeline close %. Why?", right: "Your Pipeline has open deals, so each deal's own probability is used", wrong: ["Your AI key is missing", "The horizon is too long", "Only the owner's coach can change it"], why: "With open deals, there is nothing to type." },
      { id: "ac2-3", q: "Which forecast action can change what your Finance dimension measures against?", right: "Pressing Use as my income goals", wrong: ["Pressing Recalculate", "Pressing a scenario", "Writing the Forecast Plan"], why: "The monthly goal then becomes the target your Finance dimension measures income against." },
      { id: "ac2-4", q: "Print / Share is locked on your Sales Plan. What do you need?", right: "Every section of that plan with text and marked Complete", wrong: ["Your Business Plan finished first", "Only the Foundational sections complete", "A paid upgrade"], why: "Each plan unlocks on its own, but every section counts, Optional ones too." },
      { id: "ac2-5", q: "You changed your plan after downloading the PDF. Does the file update?", right: "No, download a fresh copy", wrong: ["Yes, it updates overnight", "Yes, if it was sent by email", "Only Word files update"], why: "Files do not update on their own." },
      { id: "ac2-6", q: "You share your Year in Review. Who sees your money?", right: "Nobody, unless you tick Show income, expenses and net", wrong: ["Anyone with the link, always", "Only your clients", "Only people with a Suite login"], why: "Money stays hidden unless you tick the box." },
    ],
  },
  {
    ...base,
    id: "ac-segments",
    track: "client",
    title: "Seeing each part of your business",
    minutes: 7,
    summary: "Business Segments, how a segment earns its own score and how to read which part is working.",
    sources: ["business-segments", "revenue-by-segment", "cash-flow-dashboard"],
    sections: [
      {
        heading: "What a segment is",
        text: "Your businesses or brands, and the segments inside each, such as a product line, service, program or audience. Press Add your business or brand, then + Add a segment or offering for each thing you want to track.",
      },
      {
        heading: "How a segment gets a score",
        text: "Each segment starts from your business-wide score for every dimension, then moves with what is tagged to it: Finance from its income and expenses, Sales from its sales activity, and any dimension from its plan goals and tasks. You do not rate anything.",
      },
      {
        heading: "What segment scores do not change",
        text: "Segment scores do not change your overall score or your business-wide dimension scores. A segment showing the same score as your business has too little tagged to it yet.",
      },
      {
        heading: "Tagging faster",
        text: "Press Suggest tags with your assistant, untick or change anything that is wrong, and press Apply. Nothing is tagged until then, and existing tags are never overwritten. You can leave general overhead untagged.",
      },
      {
        heading: "Profit by segment",
        text: "On the Cash Flow Dashboard, Profit by business segment shows income, expenses and net for the year, and the top earner gets a Most profitable label. Read my segments compares your segments and says where to put your attention.",
      },
      {
        heading: "Revenue by segment is typed by hand",
        text: "View revenue by segment compares what you type against a target. It is separate from your Finance Center. Its numbers do not come from Income or Stripe, and they do not go there. There is no edit or delete, and each Save adds to that month, so check before you press Save. To move a segment's score, tag income and expenses in Finance.",
      },
    ],
    tryIt: { label: "Open Business Segments", href: "/segments", task: "Look at a segment card, or think through which segments you would add first.", question: "Which part of your business earns the most for the effort it takes, and how would you know for sure?" },
    questions: [
      { id: "ac3-1", q: "Your segment shows the same score as your business. Why?", right: "Not enough is tagged to it yet", wrong: ["Segments always match", "You need to rate it yourself", "It has been deleted"], why: "Tag tasks, goals, income or sales activity to it, and it will be scored on its own activity." },
      { id: "ac3-2", q: "A segment's Sales score rises. What happens to your business-wide Sales dimension?", right: "Nothing, segment scores do not change it", wrong: ["It rises by the same amount", "It is replaced by the segment's score", "It falls"], why: "Segment scores do not change your overall score or business-wide dimension scores." },
      { id: "ac3-3", q: "You delete a segment. What happens to the income tagged to it?", right: "It stays, just untagged", wrong: ["It is deleted", "It moves to another segment", "It is refunded"], why: "Its scores go with it, but income, expenses and tasks tagged to it stay." },
      { id: "ac3-4", q: "You want to move a segment's score. Which works?", right: "Tag income and expenses to it in Finance", wrong: ["Record revenue on View revenue by segment", "Rename the segment", "Type a score on its card"], why: "Revenue by segment does not change your scores." },
      { id: "ac3-5", q: "You typed a wrong number on View revenue by segment. How do you fix it?", right: "You cannot edit it there, and each Save adds to that month", wrong: ["Press the pencil", "Press the trash can", "Change it in Income"], why: "There is no edit or delete on that page, so check the numbers before you press Save." },
    ],
  },
  {
    ...base,
    id: "ac-tax-tools",
    track: "client",
    title: "Tax planning and your tool costs",
    minutes: 7,
    summary: "How your expenses feed Tax Preparation, Bills and the Tech Stack Optimizer.",
    sources: ["tax-preparation", "tech-stack-optimizer"],
    sections: [
      {
        heading: "An estimate, not advice",
        text: "Tax Preparation is a planning estimate of what to set aside, from your own income and expenses. It is not tax advice. The rate starts at 25% until you change it, so ask your tax professional what rate suits you.",
      },
      {
        heading: "Clean up first",
        text: "A yellow box counts expenses with no category and links to Expenses. Deal with those first. To give an old expense a category, open Expenses and press the pencil on it.",
      },
      {
        heading: "What the numbers mean",
        text: "Deductible expenses is every expense you recorded this year, except taxes you already paid. The page does not decide what is deductible. Your tax professional does. The per-quarter amount is your set-aside divided by four.",
      },
      {
        heading: "Recording a tax payment",
        text: "Use a category such as Taxes when you record a tax payment, and the page keeps those out of the expense total. Taxes paid show on their own line, and the set-aside is not reduced by them.",
      },
      {
        heading: "Add quarterly payment",
        text: "This adds a high-priority task with the amount and due date, and puts an Estimated tax payment on your Bills & Cash Calendar once, so your budget sees it coming. Press it once per payment, because each press adds another task.",
      },
      {
        heading: "Your tech stack",
        text: "The Tech Stack Optimizer finds the software and subscriptions in your expenses and totals them. Add a Paid to name on your software expenses, because tools are grouped by that name. The monthly amount is an estimate: this year's spend divided by the months so far, so a tool paid once a year looks spread out.",
      },
      {
        heading: "From tool to bill",
        text: "Press Add to Bills to put a tool on your Bills & Cash Calendar, then check the amount and date on the Bills page. The bill starts from the estimated monthly cost and the first of next month. Optimize with AI only gives suggestions and changes nothing.",
      },
    ],
    tryIt: { label: "Open Tax Preparation", href: "/finance/tax", task: "Look for a yellow box about uncategorized expenses and read your Set aside figure.", question: "How much would you like set aside for tax by the end of this quarter, and where will it live?" },
    questions: [
      { id: "ac4-1", q: "Does Tax Preparation decide what you can deduct?", right: "No, your tax professional decides what really counts", wrong: ["Yes, for US businesses", "Yes, your assistant decides", "Yes, after you export the year"], why: "Deductible expenses is every expense recorded, except taxes paid. It is a starting point." },
      { id: "ac4-2", q: "You paid a tax bill. Does the set-aside drop?", right: "No, taxes paid show on their own line", wrong: ["Yes, by the same amount", "Yes, to zero", "It doubles"], why: "The set-aside is not reduced by them." },
      { id: "ac4-3", q: "You press Add quarterly payment three times. What do you get?", right: "One Bills entry and three tasks", wrong: ["Three Bills entries and one task", "One task only", "A warning and nothing else"], why: "The Bills entry is added only once, but each press adds another task." },
      { id: "ac4-4", q: "One vendor shows as three lines in your Tech Stack. What fixes it?", right: "Using the same Paid to name on those expenses", wrong: ["Deleting two of the expenses", "Pressing Optimize with AI", "Changing your tax rate"], why: "Tools are grouped by the Paid to name, so one vendor shows as one line." },
      { id: "ac4-5", q: "Your yearly tool shows a small monthly cost. Why?", right: "The monthly amount spreads this year's spend across the months so far", wrong: ["The vendor lowered the price", "The Suite picked a discount", "It only counts one payment in twelve"], why: "It is an estimate, so a tool paid once a year looks spread out." },
    ],
  },
  {
    ...base,
    id: "ac-legal",
    track: "client",
    dimension: "legal",
    title: "Your compliance checklist and your Legal score",
    minutes: 6,
    summary: "How 31 checklist items feed your Legal dimension, and how to keep renewals in sight.",
    sources: ["legal-compliance"],
    sections: [
      {
        heading: "One checklist",
        text: "Legal & Compliance holds 31 items in 8 groups for contracts, insurance, licenses and filings. It is a general guide for small businesses, not legal advice, so check anything you are unsure of with your attorney or accountant.",
      },
      {
        heading: "How it feeds your score",
        text: "Your checklist feeds your Legal dimension, alongside your Profit answers on Legal. Done counts in full, In progress counts half and Doesn't apply is left out. The percent at the top is how much of what applies to you is done.",
      },
      {
        heading: "Working the list",
        steps: [
          "Press What applies to my business? if you would like your assistant's suggestions.",
          "Press an item, then add the date, a link to the document and any notes.",
          "Set the status: Not started, In progress, Done or Doesn't apply.",
          "To add your own, type it in Add your own item and press Add.",
        ],
      },
      {
        heading: "Suggestions stay suggestions",
        text: "Items your assistant sees as important show Priority for you with a short reason. Items that likely do not apply offer Likely doesn't apply · mark it. You accept each one yourself.",
      },
      {
        heading: "Keeping renewals in sight",
        text: "Items with a date in the next 45 days, or overdue, show in a card at the top. You also get a notification when one is within 14 days or overdue. Save the link to each document here so you can find it fast at renewal time.",
      },
      {
        heading: "More than one business",
        text: "A business you choose at the top starts with its own empty checklist. Your overall Legal figure averages the checklists you have started, and each business's own score uses its own checklist.",
      },
    ],
    tryIt: { label: "Open Legal & Compliance", href: "/compliance", task: "Find one item that does not apply to you and one that needs a date.", question: "Which contract, license or insurance policy would hurt your business most if it lapsed, and when does it renew?" },
    questions: [
      { id: "ac5-1", q: "How does an item marked In progress count?", right: "As half", wrong: ["In full", "Not at all", "As a quarter"], why: "Done counts in full, In progress counts half and Doesn't apply is left out." },
      { id: "ac5-2", q: "An item truly does not apply to your business. What should you do?", right: "Mark it Doesn't apply so it stops counting against you", wrong: ["Mark it Done", "Delete your checklist", "Leave it Not started"], why: "Doesn't apply is left out of the count." },
      { id: "ac5-3", q: "Your assistant says an item likely does not apply. What happens to it?", right: "Nothing, until you accept the suggestion yourself", wrong: ["It is marked straight away", "It is deleted", "Your Legal score rises"], why: "These are suggestions only, and you accept each one yourself." },
      { id: "ac5-4", q: "When do you get a notification about a dated item?", right: "When it is within 14 days or overdue", wrong: ["Every day of the year", "Only after it expires", "Never"], why: "The card at the top looks 45 days ahead, and the notification comes at 14 days or overdue." },
      { id: "ac5-5", q: "Is the checklist legal advice?", right: "No, check with your attorney or accountant when unsure", wrong: ["Yes, for every state", "Yes, once your assistant reviews it", "Yes, if all items are Done"], why: "It is a general guide to keep you organized." },
    ],
  },
  {
    ...base,
    id: "ac-programs",
    track: "client",
    title: "Courses, memberships and moving your buyers",
    minutes: 8,
    summary: "How a program connects to your offers, portals and Stripe, and how to bring sales in from another platform.",
    sources: ["courses-memberships", "bring-your-buyers-over"],
    sections: [
      {
        heading: "Three kinds of program",
        text: "A Self-paced course starts any time, and each lesson can open a set number of days after someone joins. A Membership gives ongoing access to a growing library. A Group program has dated lessons, sessions with join links, group homework and shared LC Volant group notes.",
      },
      {
        heading: "Building one",
        steps: [
          "Under Make a new, choose the kind, type a Name and press Create.",
          "Fill in the details, choose an offer under Sold as if you sell it, and press Save details.",
          "Add your lessons under Lessons, with a module, text, video, link or file.",
          "Under Members, find a person, tick the email box if you want, and press Add.",
        ],
      },
      {
        heading: "How the pages connect",
        text: "Choose an offer under Sold as and buyers join on their own. Members use the program inside their own client portal, so a member needs their portal link. Use Email link beside their name.",
      },
      {
        heading: "When access ends",
        text: "When a membership payment is cancelled, access ends on its own. A finished payment plan does not end access. Archive hides a program from members, and you can turn it back on later.",
      },
      {
        heading: "Bringing your buyers over",
        text: "Still selling on another platform? Connect Payhip, Kajabi, Teachable or Thinkific, or any platform through Zapier or Make. Copy your address into the platform, press Send a test sale to check it, then choose what happens for each product. No money moves on a test sale.",
      },
      {
        heading: "What each sale does",
        text: "Every buyer is tagged customer, with tags for the platform and the product. For each product you can add extra tags, start a campaign, give a seat in a Suite course and record the sale as income. Keep your address private, because anyone with it can send sales to your account.",
      },
      {
        heading: "Refunds and cancellations",
        text: "After a refund, the income comes back out, the buyer gets a refunded tag and they lose the seat. When a subscription is cancelled, they get a cancelled tag and the matching Suite membership ends.",
      },
    ],
    tryIt: { label: "Open Courses & Memberships", href: "/programs", task: "Look at the three choices under Make a new.", question: "What do you teach over and over that could become a course or membership?" },
    questions: [
      { id: "ac6-1", q: "How do you make buyers join a course on their own?", right: "Choose an offer under Sold as", wrong: ["Add a tag to the course", "Turn on a campaign", "Share your Suite login"], why: "Choose an offer under Sold as and buyers join on their own." },
      { id: "ac6-2", q: "Where do members see their course?", right: "In their own client portal", wrong: ["On your Executive Home", "In a separate app", "In Contacts"], why: "A member needs their portal link, so use Email link beside their name." },
      { id: "ac6-3", q: "A member finishes a payment plan on a membership. What happens to access?", right: "It carries on", wrong: ["It ends that day", "It ends in 30 days", "It moves to the waitlist"], why: "A finished payment plan does not end access. A cancelled membership payment does." },
      { id: "ac6-4", q: "A product is missing under Products on Bring your buyers over. Why?", right: "It shows after its first sale or test sale", wrong: ["The platform is not supported", "It needs an AI key", "Your plan does not include it"], why: "Press Send a test sale to bring a product in." },
      { id: "ac6-5", q: "A buyer on your other platform gets a refund. What happens in the Suite?", right: "The income comes back out, they get a refunded tag and lose the seat", wrong: ["Nothing changes", "They are deleted from Contacts", "Their seat stays until the year ends"], why: "The refund reaches your records and the matching Suite course on its own." },
      { id: "ac6-6", q: "Why keep your platform address private?", right: "Anyone with it can send sales to your account", wrong: ["It shows your password", "It charges you each time it is used", "It expires when shared"], why: "Keep your address private." },
    ],
  },
  {
    ...base,
    id: "ac-leads",
    track: "client",
    title: "Knowing what brings people in",
    minutes: 8,
    summary: "Short Links, Meta lead ads and reading your weekly ad report against your own contacts.",
    sources: ["short-links", "meta-lead-ads", "meta-ads-weekly-report"],
    sections: [
      {
        heading: "Short Links",
        text: "Turn a long address into a short link for a bio, a slide or a text message. Every click is counted, and each link has a QR code. Press View clicks to see the last 30 days and where clicks came from. Give each place its own link and you can see which one brings people in.",
      },
      {
        heading: "Change it without resharing",
        text: "Press Edit and change Where it should go, and the short link stays the same. If you delete a link, anyone who has it lands on a not found page, so turn it off instead if you may want it back.",
      },
      {
        heading: "Meta lead ads",
        text: "Every Facebook or Instagram lead form can flow straight into your Suite through your own private address and your own free Make account. Each lead gets the tag lead-meta-ad plus a tag with that ad's own name, and can get a card in the pipeline you pick. You need to be an admin of the Facebook Page your ads run from.",
      },
      {
        heading: "Testing and backup",
        text: "Test with Meta's Lead Ads Testing Tool. Test leads show in Latest leads with the status test and never become contacts. Turn your Make scenario on so it reads Active. If Make is ever down, download your leads from Meta's Leads Center and use Upload leads from a file. Keep your address private, because anyone who has it can add contacts to your account.",
      },
      {
        heading: "The weekly ad report",
        text: "Export your Ads tab from Ads Manager as a .csv and add it on Meta Lead Ads. Each ad gets a verdict: Give it more, Keep going, Watch, Pause or Stop, with its reason in plain words. The verdicts come from fixed rules and your own answers, not AI.",
      },
      {
        heading: "Your yardstick",
        text: "Your yardstick is the cost per lead each ad is measured against. It comes from your target, your break-even, or the campaign's own average until you set one. The Guided questions set it, so answer them. Judge trends over a week or more, because Meta can still adjust the last few days.",
      },
      {
        heading: "After the click",
        text: "The report follows people into your own contacts, showing who registered, showed up, booked and became a client, with the ad spend for each step. It does not change your scores. It helps you decide where your ad money goes.",
      },
    ],
    tryIt: { label: "Open Short Links", href: "/short-links", task: "Press New short link and read what it asks for. You do not need to save one.", question: "Where do your best clients first hear about you, and how could you measure it?" },
    questions: [
      { id: "ac7-1", q: "You printed a short link on a flyer, and the page behind it moved. What do you do?", right: "Press Edit and change Where it should go", wrong: ["Reprint the flyer", "Delete the link", "Make a QR code"], why: "The short link stays the same, so what you shared still works." },
      { id: "ac7-2", q: "You may want a link back later. Should you delete it?", right: "No, turn it off instead", wrong: ["Yes, it can be restored for 30 days", "Yes, it redirects to your home page", "Yes, QR codes keep working"], why: "If you delete a link, anyone who has it lands on a not found page." },
      { id: "ac7-3", q: "A Meta test lead shows in Latest leads. Is it in Contacts?", right: "No, test leads never become contacts", wrong: ["Yes, with a test tag", "Yes, after a day", "Only if a pipeline is chosen"], why: "Meta's test leads show with the status test and never become contacts." },
      { id: "ac7-4", q: "Make is down and leads are waiting. What is the backup?", right: "Download them from Meta's Leads Center and use Upload leads from a file", wrong: ["Type each one into a broadcast", "Wait, because they are lost", "Press Sync now on Stripe"], why: "That is the backup for when Make is down." },
      { id: "ac7-5", q: "What is each ad's verdict judged against?", right: "Your yardstick, a cost per lead", wrong: ["Your overall score", "Other clients' ads", "An AI opinion"], why: "It comes from your target, your break-even, or the campaign's own average." },
      { id: "ac7-6", q: "Where do the numbers after the click come from?", right: "Your own contacts in the Suite", wrong: ["Meta's estimates", "Your Weekly View", "A survey of your leads"], why: "They show who registered, showed up, booked and became a client." },
    ],
  },
  {
    ...base,
    id: "ac-affiliates",
    track: "client",
    dimension: "operations",
    title: "Running an affiliate program",
    minutes: 8,
    summary: "How a tracked link becomes a sale, a commission and an expense in Finance.",
    sources: ["affiliates"],
    sections: [
      {
        heading: "Setting up",
        steps: [
          "On Commission rates, set the % for each offer.",
          "On My affiliates, press Add an affiliate, fill in their name and link code, and press Add affiliate.",
          "Press their name, then add a link for each product under Product links.",
          "Copy their link and their private dashboard link, and send both to them.",
        ],
      },
      {
        heading: "How a sale gets credited",
        text: "A visitor is remembered for 365 days, and sign-ups and bookings from your Suite forms and calendars are credited to the affiliate. When someone buys through your connected Stripe and is already in your Contacts, matched by email, the sale is credited to the affiliate who referred them. Each charge counts once. Press Add sale for anything sold elsewhere.",
      },
      {
        heading: "From sale to Finance",
        text: "A sale with no commission rate waits as Needs a %. Once it has a rate it moves to Owed. When you pay, set the sale to Paid, and the commission goes into Finance as an Affiliate Commissions expense.",
      },
      {
        heading: "Waiting out refunds",
        text: "Set a number of days under Pay commission this many days after the payment, so a refund window passes before you pay. A full refund before the payable date, on a sale you have not paid, marks the sale Void by itself. Any other refund shows Refund to review, and you press Done once you have decided.",
      },
      {
        heading: "Keeping things tidy",
        text: "Every product link lasts 365 days, and Renew 365 days adds another year. Remove affiliate stops their link and deletes their history, so set their Status to Paused if you want to keep it. Their private dashboard opens with no login. New link replaces it, and the old one stops working.",
      },
      {
        heading: "How it counts",
        text: "How many affiliates you have and how many people they refer both feed your Referral Process pillar, which counts toward your Operations dimension. Programs I promote is separate: it keeps the programs you belong to, and earnings you mark Paid are added to Finance as income.",
      },
    ],
    tryIt: { label: "Open Affiliates", href: "/affiliates", task: "Open Commission rates and see what is set for your main offer.", question: "Who already sends you clients, and what would make it worth their while to keep doing it?" },
    questions: [
      { id: "ac8-1", q: "A sale says Needs a %. What do you do?", right: "Type the % on the sale, or set a rate for that offer", wrong: ["Delete the sale", "Mark it Paid", "Wait for the refund window"], why: "Once it has a rate it moves to Owed." },
      { id: "ac8-2", q: "You mark a commission Paid. Where does it show?", right: "In Finance as an Affiliate Commissions expense", wrong: ["In Finance as income", "Only on the affiliate's page", "On your Pipeline"], why: "Mark a sale Paid and the commission goes into Finance as an expense." },
      { id: "ac8-3", q: "A customer gets a full refund before the payable date, on an unpaid sale. What happens?", right: "The sale is marked Void by itself", wrong: ["The affiliate is removed", "The commission is still owed", "You must void it by hand"], why: "Any other refund shows Refund to review for you to decide." },
      { id: "ac8-4", q: "You want to stop working with an affiliate but keep their history. What do you do?", right: "Set their Status to Paused", wrong: ["Press Remove affiliate", "Delete their links", "Archive their contact"], why: "Remove affiliate stops their link and deletes their history." },
      { id: "ac8-5", q: "Why set a number of days before commissions are payable?", right: "So a refund window passes before you pay", wrong: ["To earn interest", "So Stripe can take its fee", "To lower your tax rate"], why: "The payable date gives refunds time to come through first." },
    ],
  },
  {
    ...base,
    id: "at-legal",
    track: "team-ops",
    dimension: "legal",
    title: "Keeping the compliance checklist",
    minutes: 6,
    summary: "How your updates feed the Legal dimension, and how to keep renewals from slipping.",
    sources: ["legal-compliance"],
    sections: [
      {
        heading: "What you keep up to date",
        text: "Legal & Compliance is one checklist for contracts, insurance, licenses and filings. You need the Legal & Compliance area. Each item holds a status, a link to the document, notes and, where it renews or comes due, a date.",
      },
      {
        heading: "How your updates count",
        text: "The checklist feeds the Legal dimension, alongside the Profit answers on Legal. Done counts in full, In progress counts half and Doesn't apply is left out. Mark what truly does not apply as Doesn't apply so it stops counting against the account.",
      },
      {
        heading: "Dates and reminders",
        text: "The date box shows on items that renew or come due, and on items you add yourself. Items with a date in the next 45 days, or overdue, show in a card at the top. A notification comes when one is within 14 days or overdue.",
      },
      {
        heading: "Your assistant's suggestions",
        text: "What applies to my business? marks what matters most and what likely does not apply. These are suggestions only, and each one is accepted by hand. Press Check again for a fresh look.",
      },
      {
        heading: "Each business has its own list",
        text: "If the account runs more than one business, a business chosen at the top keeps its own checklist, which starts empty. Check which one you are in before you update an item. The checklist is not legal advice, so anything unclear goes to the attorney or accountant.",
      },
    ],
    tryIt: { label: "Open Legal & Compliance", href: "/compliance", task: "Check the Coming up card at the top, if it shows, and open one item.", question: "Which renewal in this business is easiest to miss, and who should know before it is due?" },
    questions: [
      { id: "at1-1", q: "An insurance renewal is being worked on but is not finished. Which status is honest?", right: "In progress, which counts as half", wrong: ["Done", "Doesn't apply", "Not started, so it counts in full"], why: "Done counts in full, In progress counts half." },
      { id: "at1-2", q: "An item has no date box. Why?", right: "The box shows only on items that renew or come due, and on items you add", wrong: ["You lack access", "The item is broken", "It was marked Done"], why: "Only those items carry a date." },
      { id: "at1-3", q: "How far ahead does the Coming up card look?", right: "45 days", wrong: ["7 days", "14 days", "One year"], why: "Items within 45 days, or overdue, show in the card. Notifications come at 14 days or overdue." },
      { id: "at1-4", q: "You chose one business at the top and the checklist looks empty. Why?", right: "Each business starts with its own empty checklist", wrong: ["Your work was deleted", "You lost access", "The checklist resets each year"], why: "A chosen business keeps its own checklist." },
    ],
  },
  {
    ...base,
    id: "at-programs",
    track: "team-ops",
    title: "Supporting courses and memberships",
    minutes: 7,
    summary: "How programs connect to portals, offers and members, and what to check when someone cannot get in.",
    sources: ["courses-memberships", "client-portals"],
    sections: [
      {
        heading: "Programs live in the portal",
        text: "Members use a course, membership or group program inside their own client portal. A member needs their portal link, so use Email link beside their name. A lost link can be requested at lccommandsuite.com/portal.",
      },
      {
        heading: "Adding lessons",
        text: "Add lessons under Lessons, with a module, text, video, link or file. On a self-paced course, set Opens after to release a lesson that many days after someone joins, so a lesson a member cannot see yet may simply not have opened.",
      },
      {
        heading: "How members arrive",
        text: "If an offer is chosen under Sold as, buyers join on their own. You can also add someone under Members, and tick the email box if you want them told.",
      },
      {
        heading: "When access changes",
        text: "When a membership payment is cancelled, access ends on its own. A finished payment plan does not end access. Archive hides a program from members until it is turned back on.",
      },
      {
        heading: "Group programs",
        text: "A group has dated lessons, sessions with join links, group homework each member ticks off, and shared LC Volant group notes. Private notes and drafts never show. Members post and reply showing first names only, and as host you can post, reply, pin or delete, or turn the conversation off.",
      },
      {
        heading: "Your assistant",
        text: "Your chat assistant can draft a course, add lessons and add a member, all behind Approve. It never emails your members.",
      },
    ],
    tryIt: { label: "Open Courses & Memberships", href: "/programs", task: "Open a program if you have one and find Lessons and Members.", question: "What question do this business's members or clients ask most, and where should the answer live?" },
    questions: [
      { id: "at2-1", q: "A member says a lesson is missing from a self-paced course. What do you check first?", right: "Its Opens after setting", wrong: ["Their tags", "Your billing", "Your Daily Compass"], why: "A lesson can open a set number of days after someone joins." },
      { id: "at2-2", q: "A new member cannot find the course. What do they need?", right: "Their portal link, sent with Email link beside their name", wrong: ["A Suite login", "An app download", "The owner's password"], why: "Members use programs inside their own client portal." },
      { id: "at2-3", q: "What happens when a membership payment is cancelled?", right: "Access ends on its own", wrong: ["Access lasts a year", "You must remove them by hand", "They get a free month"], why: "Access ends on its own. A finished payment plan does not end access." },
      { id: "at2-4", q: "Your assistant added a member. Were they emailed?", right: "No, it never emails your members", wrong: ["Yes, right away", "Yes, on Approve", "Only for group programs"], why: "It works behind Approve and never emails members." },
      { id: "at2-5", q: "What do other members see of someone in a group conversation?", right: "First names only", wrong: ["Full name and email", "Their payment status", "Their private notes"], why: "Members post and reply, showing first names only." },
    ],
  },
  {
    ...base,
    id: "at-tracking",
    track: "team-ops",
    title: "Tracking what your pages bring in",
    minutes: 6,
    summary: "How links, landing pages and forms connect, and how to read the numbers on each.",
    sources: ["short-links", "landing-pages", "links-forms"],
    sections: [
      {
        heading: "One path",
        text: "A short link can point at a landing page, a landing page runs on a form, event, offer or booking page, and Links & Forms lists what you have made so you can find it fast.",
      },
      {
        heading: "Reading a landing page",
        text: "Each page shows visits, what it counts and your rate, for the last 30 days and all time. It counts sign-ups, registrations, Buy clicks or bookings, depending on the template. Sign-ups on an Opt-in page get that form's tags and campaign.",
      },
      {
        heading: "Reading a short link",
        text: "Press View clicks to see the last 30 days and where clicks came from. The total on the card is always exact. A row on Links & Forms shows where a short link goes and how many clicks it has.",
      },
      {
        heading: "Changing things safely",
        text: "Edit a short link's Where it should go and the link stays the same. Do not delete a link people may still use, because they land on a not found page. Turn it off instead. Unpublish takes a landing page down until you publish again.",
      },
      {
        heading: "Finding the fault",
        text: "A form's row on Links & Forms shows its tags and which campaign it starts. Off beside a form or booking page means it is turned off. An offer with no link yet is named under the offers list. To fix any of these, change it where it lives.",
      },
      {
        heading: "Domains",
        text: "Until Your short-link domain is set up, links use lccommandsuite.com/l/. With a verified short-link domain, a landing page also opens on your own domain. DNS changes can take a few minutes to a few hours.",
      },
    ],
    tryIt: { label: "Open Links & Forms", href: "/links-directory", task: "Search for a form and read its tags and campaign.", question: "Which link does this business share most, and do you know how many people it brings in?" },
    questions: [
      { id: "at3-1", q: "Which number shows how well a landing page turns visits into action?", right: "Its rate", wrong: ["Its clicks on Short Links only", "Its template name", "Its QR code"], why: "Each page shows visits, what it counts and your rate." },
      { id: "at3-2", q: "Sign-ups on an Opt-in page get which tags and campaign?", right: "The tags and campaign of the form it uses", wrong: ["None", "Every tag in the account", "The owner's default campaign"], why: "Opt-in uses a form, and sign-ups get that form's tags and campaign." },
      { id: "at3-3", q: "Links & Forms shows off beside a form. What does it mean?", right: "That form is turned off in the account", wrong: ["It has no submissions", "It is private", "It has an error"], why: "Off means that form or booking page is turned off." },
      { id: "at3-4", q: "A person clicks a short link you deleted. What do they see?", right: "A not found page", wrong: ["Your home page", "The old page", "A sign-in page"], why: "Turn a link off instead if you may want it back." },
      { id: "at3-5", q: "A new short-link domain is not working yet. What might be the reason?", right: "DNS changes can take a few minutes to a few hours", wrong: ["Domains only work on Mondays", "Your AI key is missing", "Short links need a form"], why: "Add the record at your domain provider and allow time for it." },
    ],
  },
  {
    ...base,
    id: "as-numbers",
    track: "team-sales",
    dimension: "sales",
    title: "How your sales numbers connect",
    minutes: 8,
    summary: "From Sales Plan targets to weekly goals, deals, win rate and the forecast.",
    sources: ["sales-plan", "sales-activities", "pipeline", "weekly-view", "forecasting"],
    sections: [
      {
        heading: "Targets start in the Sales Plan",
        text: "Press Suggest my targets and your assistant works backwards from the Sales Plan, income goals and pipeline. Press Use as my weekly goals to save them. They become your weekly goals in Sales Activities, and they show in your Weekly View.",
      },
      {
        heading: "What a target does not do",
        text: "Weekly targets and goal statuses do not change your 12 dimensions. The Sales Plan feeds the Sales dimension through how many of its four Foundational sections have text in them.",
      },
      {
        heading: "Your activity feeds your scores",
        text: "Activities dated in the last 30 days count toward your Sales dimension and your Customer Acquisition pillar. Calls and follow-ups you log on a deal are sales activities and also show in Sales Activities, so log them once.",
      },
      {
        heading: "Win rate",
        text: "Won and Lost outcomes set your win rate, which counts toward your Sales dimension and Sales Journey pillar. Conversion is a different tile: won activities divided by contacted ones.",
      },
      {
        heading: "The four Pipeline tiles",
        text: "Open pipeline is the value of your open deals. Weighted by probability is what you can expect to close. Won this month is what you closed this month. Deals to move today counts deals that are due, overdue or stuck.",
      },
      {
        heading: "Honest odds reach the forecast",
        text: "Forecasting uses each deal's own value and probability, so honest odds make an honest forecast. Any deal can have its own odds: untick Use the stage's default.",
      },
      {
        heading: "Your read",
        text: "On Sales Activities, press Report, then AI summary. Your assistant reads your activity against the Sales Plan, weekly targets and pipeline and writes what is working, where the gaps are and your best next move.",
      },
    ],
    tryIt: { label: "Open Sales Activities", href: "/daily-compass/sales-activities", task: "Compare This week vs. goals with what you did this week.", question: "Which sales number would tell you most about this week, and what would you change if it were low?" },
    questions: [
      { id: "as1-1", q: "You press Use as my weekly goals. Where do those targets appear?", right: "As your goals in Sales Activities, and in your Weekly View", wrong: ["Only on the Sales Plan", "On your Pipeline columns", "On your Goal Ladder"], why: "They become your weekly goals in Sales Activities and show in your Weekly View." },
      { id: "as1-2", q: "You hit every weekly target. Do the targets themselves change your Sales dimension?", right: "No, targets do not change your dimensions, but the activity you logged counts", wrong: ["Yes, each target adds five points", "No, and the activity does not count either", "Yes, it sets your win rate"], why: "Targets are goals. Activities dated in the last 30 days are what count." },
      { id: "as1-3", q: "You log a call on a deal. Should you log it again in Sales Activities?", right: "No, it already shows there", wrong: ["Yes, or it will not count", "Yes, for your win rate", "Only if it was Won"], why: "Calls and follow-ups logged on a deal also show in Sales Activities." },
      { id: "as1-4", q: "Why do honest odds on a deal matter beyond the Pipeline?", right: "Forecasting uses each deal's own value and probability", wrong: ["They set the price of the offer", "They change the client's invoice", "They lift your Legal score"], why: "Honest odds make Weighted by probability and the forecast honest." },
      { id: "as1-5", q: "What does Deals to move today count?", right: "Deals that are due, overdue or stuck", wrong: ["Deals won today", "Every open deal", "Deals with no value"], why: "Stuck means no movement for 14 days." },
    ],
  },
  {
    ...base,
    id: "as-meta",
    track: "team-sales",
    title: "Reading your ad leads",
    minutes: 7,
    summary: "How a Meta lead reaches a pipeline, and what the weekly report says to do.",
    sources: ["meta-lead-ads", "meta-ads-weekly-report"],
    sections: [
      {
        heading: "How a lead arrives",
        text: "A Facebook or Instagram lead form passes through a private address and a Make account into the Suite. Each lead becomes a contact with the tag lead-meta-ad plus a tag with that ad's own name, and can get a card in the chosen pipeline. You need the Outreach area.",
      },
      {
        heading: "Check Latest leads",
        text: "Latest leads shows each lead arrive. Meta's test leads show the status test and never become contacts. A LinkedIn Lead Gen Form can arrive the same way on its own address, tagged lead-linkedin-form plus the form's own tag.",
      },
      {
        heading: "How the report is built",
        text: "Export the Ads tab from Ads Manager as a .csv and add it under Add this week's numbers. The report rebuilds every time you add an export. On Mondays you get a reminder that says your report is ready or asks for a new export.",
      },
      {
        heading: "Verdicts",
        text: "Each ad shows spend, seen, link clicks, click rate, leads, cost per lead, share of leads and a verdict: Give it more, Keep going, Watch, Pause or Stop. The reason is beside it in plain words, judged against your yardstick. No AI is used.",
      },
      {
        heading: "Your yardstick",
        text: "Thirteen Guided questions set it, such as your goal, what a client is worth and your budget. It comes from your target, your break-even, or the campaign's own average until you set one. Judge trends over a week or more.",
      },
      {
        heading: "What to do with it",
        text: "Numbers after the click come from your own contacts: who registered, showed up, booked and became a client. If cost per lead stays the same shows what the same daily spending would cost and bring in over a week, a month and a quarter. The report does not change your scores.",
      },
    ],
    tryIt: { label: "Open Meta Lead Ads", href: "/meta-leads", task: "Find Latest leads and each ad's verdict, if this account runs ads.", question: "What is a new client worth to this business, and how much would you pay for a lead?" },
    questions: [
      { id: "as2-1", q: "Which tags does a Meta lead get?", right: "lead-meta-ad, plus a tag with that ad's own name", wrong: ["customer", "lead-linkedin-form", "None"], why: "Those two tags tell you it came from a Meta ad and which one." },
      { id: "as2-2", q: "An ad shows a verdict of Pause. Where do you find out why?", right: "Beside it, in plain words", wrong: ["In your assistant's chat only", "From Meta support", "It has no reason"], why: "Each ad's reason is written in plain words beside it." },
      { id: "as2-3", q: "Is AI choosing the verdicts?", right: "No, they come from fixed rules and your own answers", wrong: ["Yes, on the owner's key", "Yes, Meta's AI", "Only for Stop"], why: "This report does not use AI." },
      { id: "as2-4", q: "An ad looked weak over the last two days. What should you remember?", right: "Judge trends over a week or more, because Meta can still adjust the last few days", wrong: ["Stop it at once", "Double the budget", "Delete the export"], why: "A week or more gives a truer read." },
      { id: "as2-5", q: "You add a new export. What happens to the report?", right: "It rebuilds", wrong: ["It keeps last week's numbers", "It is emailed to clients", "It changes your scores"], why: "The report rebuilds every time you add an export." },
    ],
  },
  {
    ...base,
    id: "as-affiliates",
    track: "team-sales",
    dimension: "operations",
    title: "Working with affiliates",
    minutes: 7,
    summary: "Recruiting partners, tracking what they send and keeping sales and commissions straight.",
    sources: ["affiliates"],
    sections: [
      {
        heading: "Recruiting",
        text: "The Recruiting tab is a board for people you would like as affiliates, and it needs the Outreach area. Each card has a Prospect Qualifier section. Move someone to Active affiliate and they are added to My affiliates with their own link.",
      },
      {
        heading: "Getting them started",
        text: "Press their name to open their page. Under Product links, add a link for each product you want them to share. Copy their link and their private dashboard link, and send both to them. The dashboard opens with no login and shows their monthly report.",
      },
      {
        heading: "How credit works",
        text: "A visitor is remembered for 365 days. Sign-ups and bookings from Suite forms and calendars are credited to the affiliate. A buyer through connected Stripe who is already in Contacts, matched by email, is credited to the affiliate who referred them.",
      },
      {
        heading: "Reading a sale",
        text: "Each sale shows the amount, the %, the commission, the payable date and the status. Needs a % means no rate yet. You can set a different % for one affiliate on their page. A note beside a name tells you when a sale or refund needs your review.",
      },
      {
        heading: "Keeping links alive",
        text: "Every product link lasts 365 days. You and the affiliate get an email before it ends, and Renew 365 days adds another year. New link replaces a private dashboard link, and the old one stops working.",
      },
      {
        heading: "Why it matters",
        text: "How many affiliates the account has and how many people they refer both feed the Referral Process pillar, which counts toward the Operations dimension. Remove affiliate deletes their history, so set Status to Paused if you want to keep it.",
      },
    ],
    tryIt: { label: "Open Affiliates", href: "/affiliates", task: "Open Recruiting if you can, or My affiliates, and read one line.", question: "Who would make a great referral partner for this business, and why would they say yes?" },
    questions: [
      { id: "as3-1", q: "You move someone to Active affiliate on Recruiting. What happens?", right: "They are added to My affiliates with their own link", wrong: ["They are emailed a contract", "They get a Suite login", "They are added as a client"], why: "Moving a card to Active affiliate adds them with their own link." },
      { id: "as3-2", q: "Does an affiliate need a login to see their report?", right: "No, their private dashboard link opens with no login", wrong: ["Yes, a Suite login", "Yes, a Stripe login", "They cannot see a report"], why: "Press New link if it ever needs changing." },
      { id: "as3-3", q: "A buyer pays through connected Stripe. How is the affiliate credited?", right: "If the buyer is in Contacts, matched by email, the referrer gets the credit", wrong: ["By a code the buyer types", "Only if you press Add sale", "It is shared by every affiliate"], why: "Each charge counts once." },
      { id: "as3-4", q: "How long does a product link last?", right: "365 days, and Renew 365 days adds another year", wrong: ["30 days", "90 days", "Forever"], why: "You and the affiliate get an email before it ends." },
      { id: "as3-5", q: "Which pillar do affiliates feed?", right: "Referral Process", wrong: ["Fulfillment", "Onboarding", "Internal Process & Culture"], why: "It counts toward your Operations dimension." },
    ],
  },
  {
    ...base,
    id: "a-exam",
    track: "core",
    kind: "exam",
    title: "Advanced exam",
    minutes: 12,
    summary: "Ten questions on real situations. Pass with 80% to earn your Advanced certificate.",
    sources: ["how-your-scores-work", "dimension-detail", "quick-pulse-check-in", "progress", "alignment-profile", "go-deeper-questionnaires", "operations", "pipeline", "payments-invoices", "what-the-suite-does-on-its-own"],
    sections: [
      {
        heading: "How the exam works",
        text: "The exam covers the core Advanced lessons. Answer every question, then press Check my answers. You need 80% to pass. It shows which questions you missed without giving the answers, so go back to the lessons and try again. Retakes are unlimited.",
      },
    ],
    questions: [
      { id: "ax-1", q: "A colleague says a score must be wrong because an input is stale. What do you tell them?", right: "A stale input still counts, and the mark is a nudge to refresh it", wrong: ["Stale inputs count as zero", "Stale inputs are removed", "The dimension needs rebuilding"], why: "" },
      { id: "ax-2", q: "A dimension is low. What is the best first move?", right: "Open it, read its inputs and shares, and press the one to improve", wrong: ["Read all its lessons and wait", "Set milestones and wait", "Retake every assessment"], why: "" },
      { id: "ax-3", q: "How many dimensions need a score before your overall score appears?", right: "At least three", wrong: ["One", "Eight", "All twelve"], why: "" },
      { id: "ax-4", q: "You want to see how your business has moved since you started. Where do you look?", right: "Progress, against your fixed baseline", wrong: ["Daily Compass", "Quick Capture", "Your Morning Brief"], why: "" },
      { id: "ax-5", q: "Your business feels different this month. What is the quickest honest update?", right: "A Quick Pulse Check-in", wrong: ["A full Brain assessment", "A new Business Plan", "Editing a dimension score"], why: "" },
      { id: "ax-6", q: "You finish a Quick Pulse. Which of these does it add?", right: "A dated point on your score trend", wrong: ["A new baseline", "A new AI key", "A year goal"], why: "" },
      { id: "ax-7", q: "A pillar says Not scored yet. What usually brings it in?", right: "Its Go deeper questions", wrong: ["A note on the card", "Pressing Generate insights", "Typing a score"], why: "" },
      { id: "ax-8", q: "A deal has no movement for 14 days. What happens?", right: "It is marked and counts in Deals to move today", wrong: ["It is deleted", "It moves to Lost", "It moves to Won"], why: "" },
      { id: "ax-9", q: "A client paid through the Suite, and you did nothing. What has happened on its own?", right: "Their contact, timeline and matching open deal were updated", wrong: ["Nothing until you log it", "A broadcast went to your list", "Their deal was deleted"], why: "" },
      { id: "ax-10", q: "Which of these does the Suite do with nothing open, once it is set up?", right: "Bring Stripe sales into your records each morning", wrong: ["Post to your social accounts", "Send email nobody scheduled", "Change your scores by hand"], why: "" },
    ],
  },
];
