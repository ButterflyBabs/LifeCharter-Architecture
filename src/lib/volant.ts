// LC Volant: a transcript from any app or device becomes a templated report, and each action item can be approved
// into Tasks. Pure helpers and the 21 approved templates (approved by Babs 2026-10-17 on the review page); no database
// or network here, so the cleaning and prompt rules can be tested.

export const VOLANT_NAME = "LC Volant";
/** Babs only until she approves it on the preview (2026-10-17); flip to true to open LC Volant to every account. */
export const VOLANT_OPEN_TO_ALL = false;
export const VOLANT_MAX_TRANSCRIPT = 200000; // stored
export const VOLANT_MAX_PROMPT = 60000; // sent to the AI: about 10,000 words, past an hour of talk

export type SectionKind = "text" | "actions" | "private" | "draft";
export interface TemplateSection { title: string; guide: string; kind: SectionKind }
export interface VolantTemplate {
  key: string;
  name: string;
  purpose: string;
  savedOn: string;
  withContact: boolean;
  rules?: string;
  sections: TemplateSection[];
}

export const VOLANT_TEMPLATES: VolantTemplate[] = [
  {
    key: "coaching-sessions",
    name: "Coaching Sessions",
    purpose: "A one-to-one coaching session with a client.",
    savedOn: "The client's contact record",
    withContact: true,
    sections: [
      { title: "Session snapshot", guide: "Client, date, length, and the focus they brought to the session.", kind: "text" },
      { title: "Since last time", guide: "Wins, progress on last session's commitments, and anything that changed.", kind: "text" },
      { title: "What came up", guide: "The main challenge or question explored, in the client's own words where possible.", kind: "text" },
      { title: "Insights and breakthroughs", guide: "The shifts, realizations or reframes that landed for the client.", kind: "text" },
      { title: "Decisions made", guide: "Anything the client decided during the session.", kind: "text" },
      { title: "Commitments", guide: "What the client and the coach each agreed to do, with who and by when. Each one gets its own Approve to send it to Tasks.", kind: "actions" },
      { title: "Coach's private notes", guide: "Observations, patterns and things to watch next time. Visible to the coach only, never in anything shared with the client.", kind: "private" },
      { title: "Next session focus", guide: "What to open with next time, and the next session date if one was set.", kind: "text" },
      { title: "Recap for the client (draft)", guide: "A short, warm recap email the coach can edit and send. Draft only, never sent automatically.", kind: "draft" },
    ],
  },
  {
    key: "mastermind-sessions",
    name: "Mastermind Sessions",
    purpose: "A peer mastermind meeting with hot seats and shared accountability.",
    savedOn: "The mastermind group, plus each member who had a hot seat",
    withContact: false,
    sections: [
      { title: "Session snapshot", guide: "Date, theme, who attended and who was absent.", kind: "text" },
      { title: "Accountability check-in", guide: "Each member's progress on what they committed to last time: done, in progress or not started.", kind: "text" },
      { title: "Hot seats", guide: "For each member in the hot seat: the challenge they brought, the group's best input, and what they chose to do with it.", kind: "text" },
      { title: "Shared insights", guide: "Themes, lessons and patterns that came up across the group.", kind: "text" },
      { title: "Resources mentioned", guide: "Books, tools, people, links and templates anyone recommended.", kind: "text" },
      { title: "Member commitments", guide: "What each member commits to before the next session, with due dates. Each one gets its own Approve to send it to Tasks.", kind: "actions" },
      { title: "Next session", guide: "Date, theme and who is in the hot seat next.", kind: "text" },
    ],
  },
  {
    key: "group-coaching-sessions",
    name: "Group Coaching Sessions",
    purpose: "A coach-led group session with teaching, Q&A and practice.",
    savedOn: "The group or program, plus any participant flagged for follow-up",
    withContact: false,
    sections: [
      { title: "Session snapshot", guide: "Date, program or group name, topic, and how many attended.", kind: "text" },
      { title: "Teaching points", guide: "The key ideas, frameworks or steps the coach taught.", kind: "text" },
      { title: "Questions and answers", guide: "Each question asked and the answer given, kept short.", kind: "text" },
      { title: "Participant breakthroughs", guide: "Shares and shifts participants spoke about, by first name only if they shared openly.", kind: "text" },
      { title: "Common themes", guide: "Struggles or patterns several people raised, to shape future sessions.", kind: "text" },
      { title: "Practice for the group", guide: "Homework, practice or prompts given to everyone before the next session.", kind: "text" },
      { title: "Individual follow-ups", guide: "Participants who may need a personal check-in, and why. Each one gets its own Approve to send it to Tasks.", kind: "actions" },
      { title: "Recap for participants (draft)", guide: "A shareable recap with no private details, ready to edit and send. Draft only.", kind: "draft" },
    ],
  },
  {
    key: "team-meetings",
    name: "Team Meetings",
    purpose: "An internal meeting with your team or contractors.",
    savedOn: "Session Notes for the account (no contact record)",
    withContact: true,
    sections: [
      { title: "Meeting snapshot", guide: "Date, meeting type and who attended.", kind: "text" },
      { title: "Summary", guide: "Three to six sentences on what the meeting covered.", kind: "text" },
      { title: "Wins", guide: "Results, progress and good news worth naming.", kind: "text" },
      { title: "Decisions", guide: "Everything decided, so nobody has to remember it.", kind: "text" },
      { title: "Hot topics and blockers", guide: "Problems, risks and anything stuck that needs attention.", kind: "text" },
      { title: "Action items", guide: "Each to-do with an owner and due date. Each one gets its own Approve to send it to Tasks, assigned to that team member where they have an account.", kind: "actions" },
      { title: "Parking lot", guide: "Ideas and questions raised that were set aside for later.", kind: "text" },
    ],
  },
  {
    key: "consultations",
    name: "Consultations",
    purpose: "A consultation or discovery call with a prospective client.",
    savedOn: "The prospect's contact record",
    withContact: true,
    sections: [
      { title: "Prospect snapshot", guide: "Who they are, their business or life stage, and how they found you.", kind: "text" },
      { title: "What they want", guide: "Their goals and the outcome they are hoping for, in their own words.", kind: "text" },
      { title: "What's in the way", guide: "Challenges and pain points, in their own words.", kind: "text" },
      { title: "What they've tried", guide: "Past approaches, programs or support, and how those went.", kind: "text" },
      { title: "Fit", guide: "How well their needs match what you offer, and any concerns on either side.", kind: "text" },
      { title: "Questions and objections", guide: "Anything they asked or hesitated about, and how it was answered.", kind: "text" },
      { title: "Offer and next step", guide: "What was offered or discussed, and the next step you both agreed on.", kind: "text" },
      { title: "Follow-up actions", guide: "What you need to do and when. Each one gets its own Approve to send it to Tasks.", kind: "actions" },
      { title: "Follow-up email (draft)", guide: "A personal follow-up the owner can edit and send. Draft only, never sent automatically.", kind: "draft" },
    ],
  },
  {
    key: "brain-dumps",
    name: "Brain Dumps",
    purpose: "A solo voice memo or ramble to get everything out of your head.",
    savedOn: "Session Notes for the account (no contact record)",
    withContact: true,
    sections: [
      { title: "Ideas", guide: "Every idea captured, grouped by theme.", kind: "text" },
      { title: "To-dos", guide: "Anything that sounded like something to do. Each one gets its own Approve to send it to Tasks.", kind: "actions" },
      { title: "Decisions to make", guide: "Open choices you mentioned, with the options you named.", kind: "text" },
      { title: "Questions to explore", guide: "Things you wondered about or want to look into.", kind: "text" },
      { title: "What's weighing on you", guide: "Worries or blockers you named, written gently and without judgment.", kind: "text" },
      { title: "Top three", guide: "The three things that look most important to act on first, and why.", kind: "text" },
    ],
  },
  {
    key: "conferences",
    name: "Conferences",
    purpose: "Notes from a conference you attended, so the learning and the connections turn into action.",
    savedOn: "Session Notes for the account, with each person met linked to their contact record",
    withContact: true,
    sections: [
      { title: "Event snapshot", guide: "Conference name, dates, location or platform, and the sessions you attended.", kind: "text" },
      { title: "Key takeaways by session", guide: "For each session: speaker, title, and the two or three ideas that mattered most.", kind: "text" },
      { title: "Ideas for my business", guide: "What you want to try, change or build because of what you heard.", kind: "text" },
      { title: "People I met", guide: "Name, who they are, what you talked about, and how to follow up.", kind: "text" },
      { title: "Opportunities", guide: "Speaking, partnership, collaboration, referral or client opportunities that came up.", kind: "text" },
      { title: "Resources mentioned", guide: "Books, tools, links and programs worth looking up.", kind: "text" },
      { title: "Content ideas", guide: "Posts, emails or talks you could create from what you learned.", kind: "text" },
      { title: "Follow-up actions", guide: "Each follow-up with a due date. Each one gets its own Approve to send it to Tasks.", kind: "actions" },
    ],
  },
  {
    key: "workshops",
    name: "Workshops I Lead",
    purpose: "A workshop you led, captured so you can follow up, improve it and gather results.",
    savedOn: "The workshop or program, plus each participant flagged for follow-up",
    withContact: false,
    sections: [
      { title: "Workshop snapshot", guide: "Title, date, format (in person or virtual), length and number of participants.", kind: "text" },
      { title: "Content delivered", guide: "The main teaching points, frameworks and exercises, in the order they ran.", kind: "text" },
      { title: "What participants created", guide: "Results from the exercises, such as plans, decisions or insights people shared.", kind: "text" },
      { title: "Questions and answers", guide: "Each question asked and the answer given, kept short.", kind: "text" },
      { title: "Feedback and quotes", guide: "What participants said about the workshop. Quotes are marked as possible testimonials, to be used only with their permission.", kind: "text" },
      { title: "What worked and what to change", guide: "Timing, exercises and moments that landed or fell flat, for next time.", kind: "text" },
      { title: "Interested in next steps", guide: "Participants who asked about working together or about a next offer, and what they asked.", kind: "text" },
      { title: "Follow-up actions", guide: "Each follow-up with a due date. Each one gets its own Approve to send it to Tasks.", kind: "actions" },
      { title: "Recap for participants (draft)", guide: "A shareable recap with key takeaways and next steps, ready to edit and send. Draft only.", kind: "draft" },
    ],
  },
  {
    key: "workshops-attended",
    name: "Workshops I Attend",
    purpose: "A workshop or training you took part in, so what you learned turns into action.",
    savedOn: "Session Notes for the account, with the facilitator and anyone you met linked to their contact records",
    withContact: true,
    sections: [
      { title: "Workshop snapshot", guide: "Title, facilitator, host, date, and format (in person or virtual).", kind: "text" },
      { title: "Why I attended", guide: "What you hoped to learn or solve by going.", kind: "text" },
      { title: "Key lessons", guide: "The main ideas, frameworks and steps taught, in your own words.", kind: "text" },
      { title: "My work from the exercises", guide: "What you wrote, decided or realized during the exercises.", kind: "text" },
      { title: "How I'll use this", guide: "Where this applies in your business or life, and what you will change.", kind: "text" },
      { title: "People I connected with", guide: "The facilitator and other attendees worth staying in touch with, and how to follow up.", kind: "text" },
      { title: "Resources and offers", guide: "Materials, tools, links and any next-step offers the facilitator mentioned.", kind: "text" },
      { title: "Questions still open", guide: "Anything you didn't get answered or want to look into further.", kind: "text" },
      { title: "Follow-up actions", guide: "Each follow-up with a due date. Each one gets its own Approve to send it to Tasks.", kind: "actions" },
    ],
  },
  {
    key: "speaking-engagement-planning",
    name: "Speaking Engagement Planning",
    purpose: "A planning call with an event host or organizer about a talk you will give.",
    savedOn: "The host's or organizer's contact record",
    withContact: true,
    sections: [
      { title: "Engagement snapshot", guide: "Event name, host, date, time and time zone, in person or virtual, and the location.", kind: "text" },
      { title: "Audience", guide: "Who will be there, how many, what they care about, and what the host wants them to leave with.", kind: "text" },
      { title: "Topic and title", guide: "The talk's topic, working title and key messages agreed with the host.", kind: "text" },
      { title: "Format", guide: "Keynote, panel, workshop or fireside chat, plus length, Q&A and running order.", kind: "text" },
      { title: "Logistics and access", guide: "Travel, lodging, venue and stage access, accommodations, AV and tech needs, the slide deadline and the rehearsal time.", kind: "text" },
      { title: "Fee and terms", guide: "Fee, expenses, contract, deposit, recording rights, book or product sales, and any offer to the audience.", kind: "text" },
      { title: "Promotion", guide: "Bio, headshot, links and promo copy the host needs, and how you will promote the event too.", kind: "text" },
      { title: "Key dates", guide: "Every deadline mentioned, in date order.", kind: "text" },
      { title: "Open questions", guide: "Anything still to confirm, and who will confirm it.", kind: "text" },
      { title: "Action items", guide: "Each task with an owner and due date. Each one gets its own Approve to send it to Tasks.", kind: "actions" },
    ],
  },
  {
    key: "retreat-planning",
    name: "Retreat Planning",
    purpose: "A planning conversation for a retreat you are hosting.",
    savedOn: "Session Notes for the account, linked to the retreat's project if there is one",
    withContact: false,
    sections: [
      { title: "Retreat snapshot", guide: "Retreat name, dates, location or venue, and capacity.", kind: "text" },
      { title: "Vision and outcomes", guide: "What the retreat is for and what attendees should leave with.", kind: "text" },
      { title: "Ideal attendee", guide: "Who it is for, who it is not for, and how they will be invited.", kind: "text" },
      { title: "Agenda ideas", guide: "Sessions, activities and rest time, sorted by day where possible.", kind: "text" },
      { title: "Venue and logistics", guide: "Lodging, meals and dietary needs, transport, accessibility, and supplies.", kind: "text" },
      { title: "Budget and pricing", guide: "Expected costs, ticket price or tiers, deposits, payment plans, and the break-even point if it was discussed.", kind: "text" },
      { title: "Team and vendors", guide: "Co-facilitators, speakers, caterers, photographers and others, with what each one handles.", kind: "text" },
      { title: "Marketing and enrollment", guide: "Launch date, early-bird deadline, channels, and the enrollment goal.", kind: "text" },
      { title: "Risks and open questions", guide: "What could go wrong, what is undecided, and who will find out.", kind: "text" },
      { title: "Action items", guide: "Each task with an owner and due date. Each one gets its own Approve to send it to Tasks or to the retreat's project.", kind: "actions" },
    ],
  },
  {
    key: "client-kickoff",
    name: "Client Kickoff Calls",
    purpose: "The first call with a new client, to set goals, expectations and the first steps.",
    savedOn: "The client's contact record",
    withContact: true,
    sections: [
      { title: "Client snapshot", guide: "Who they are, their business or situation, what they signed up for, and the start date.", kind: "text" },
      { title: "Goals", guide: "What they want to achieve, and how they will know it worked.", kind: "text" },
      { title: "Starting point", guide: "Where things stand today: numbers, systems, habits or challenges they described.", kind: "text" },
      { title: "What we need from them", guide: "Logins, documents, assessments or decisions the client still owes, with dates.", kind: "text" },
      { title: "How we'll work together", guide: "Meeting rhythm, how to reach you, response times, and the tools you will use.", kind: "text" },
      { title: "First 30 days", guide: "The first milestones and what each side does to reach them.", kind: "text" },
      { title: "Concerns or hopes", guide: "Worries, past experiences or hopes the client shared that you should keep in mind.", kind: "text" },
      { title: "Action items", guide: "Each task with an owner and due date. Each one gets its own Approve to send it to Tasks.", kind: "actions" },
      { title: "Welcome recap (draft)", guide: "A warm recap of what was agreed and what happens next, ready to edit and send. Draft only.", kind: "draft" },
    ],
  },
  {
    key: "strategy-planning",
    name: "Strategy & Planning Sessions",
    purpose: "A planning session such as quarterly planning or a CEO day, alone or with your team or coach.",
    savedOn: "Session Notes for the account, linked to a project if one is chosen",
    withContact: false,
    sections: [
      { title: "Session snapshot", guide: "Date, who took part, and the period being planned (for example, next quarter).", kind: "text" },
      { title: "Looking back", guide: "What worked, what didn't, and the results from the last period.", kind: "text" },
      { title: "Goals", guide: "The goals set for this period, each stated so you can tell when it is met.", kind: "text" },
      { title: "Priorities", guide: "The few things that matter most, in order.", kind: "text" },
      { title: "Numbers to watch", guide: "The measures that show whether you are on track, with targets.", kind: "text" },
      { title: "Stop, start, continue", guide: "What to stop doing, start doing and keep doing.", kind: "text" },
      { title: "Risks and resources", guide: "What could get in the way, and the time, money or help each goal needs.", kind: "text" },
      { title: "90-day plan", guide: "Milestones by month or week.", kind: "text" },
      { title: "Action items", guide: "Each task with an owner and due date. Each one gets its own Approve to send it to Tasks or to a project.", kind: "actions" },
    ],
  },
  {
    key: "podcasts-interviews",
    name: "Podcasts & Interviews",
    purpose: "A podcast episode or interview, whether you hosted it or were the guest.",
    savedOn: "Session Notes for the account, with the host or guest linked to their contact record",
    withContact: true,
    sections: [
      { title: "Episode snapshot", guide: "Show name, episode title, host or guest, recording date, and whether you hosted or were the guest.", kind: "text" },
      { title: "Summary", guide: "A short description of the conversation, usable as the episode description.", kind: "text" },
      { title: "Show notes", guide: "Topics covered in order, with timestamps where the file has them.", kind: "text" },
      { title: "Best quotes", guide: "Quotable lines, with who said each one and the timestamp.", kind: "text" },
      { title: "Clip moments", guide: "Short moments that would make good video or audio clips, with start and end times.", kind: "text" },
      { title: "Links and resources", guide: "Books, websites, offers and people mentioned.", kind: "text" },
      { title: "Content ideas", guide: "Posts, emails and blog topics this episode could become.", kind: "text" },
      { title: "Follow-up actions", guide: "Thank-yous, links to send, promotion dates and other tasks. Each one gets its own Approve to send it to Tasks.", kind: "actions" },
    ],
  },
  {
    key: "webinars-masterclasses",
    name: "Webinars & MasterClasses",
    purpose: "A webinar or MasterClass you hosted, focused on attendees, the offer and follow-up.",
    savedOn: "Session Notes for the account, with flagged attendees linked to their contact records",
    withContact: true,
    sections: [
      { title: "Event snapshot", guide: "Title, date, registrations, live attendance and how long people stayed, if known.", kind: "text" },
      { title: "Content delivered", guide: "The main teaching points in the order they ran.", kind: "text" },
      { title: "Questions asked", guide: "Each question from chat or Q&A, who asked it and the answer given.", kind: "text" },
      { title: "The offer", guide: "What was offered, how it was presented, and how people responded in chat or out loud.", kind: "text" },
      { title: "Hot leads", guide: "Attendees who showed strong interest, asked about the offer or said they were ready, and why.", kind: "text" },
      { title: "What worked and what to change", guide: "Timing, content and moments to keep or fix next time.", kind: "text" },
      { title: "Follow-up actions", guide: "Replays, emails, DMs and calls to make, each with a due date. Each one gets its own Approve to send it to Tasks.", kind: "actions" },
      { title: "Attendee recap (draft)", guide: "A recap email with key takeaways and the next step, ready to edit and send. Draft only.", kind: "draft" },
    ],
  },
  {
    key: "partnership-calls",
    name: "Partnership & Collaboration Calls",
    purpose: "A call about a joint venture, affiliate deal, co-hosted event or other collaboration.",
    savedOn: "The partner's contact record",
    withContact: true,
    sections: [
      { title: "Partner snapshot", guide: "Who they are, their business, their audience, and how you connected.", kind: "text" },
      { title: "The idea", guide: "What the collaboration is, in a sentence or two.", kind: "text" },
      { title: "What each side brings", guide: "Audience, skills, content, money or time from each side.", kind: "text" },
      { title: "Terms discussed", guide: "Revenue share, commissions, costs, ownership of content or leads, and timeline.", kind: "text" },
      { title: "Fit and concerns", guide: "How well your values, audiences and offers match, and any hesitations.", kind: "text" },
      { title: "Decisions and next steps", guide: "What was agreed and what happens next.", kind: "text" },
      { title: "Action items", guide: "Each task with an owner and due date. Each one gets its own Approve to send it to Tasks.", kind: "actions" },
      { title: "Follow-up email (draft)", guide: "A summary of what was discussed and agreed, ready to edit and send. Draft only.", kind: "draft" },
    ],
  },
  {
    key: "vendor-contractor-calls",
    name: "Vendor & Contractor Calls",
    purpose: "A call with a vendor, freelancer or contractor about work they will do for you.",
    savedOn: "The vendor's contact record",
    withContact: true,
    sections: [
      { title: "Vendor snapshot", guide: "Who they are, what they do, and the project this call is about.", kind: "text" },
      { title: "Scope", guide: "Exactly what they will deliver, and what is not included.", kind: "text" },
      { title: "Price and payment", guide: "Quote, payment schedule, deposit and how they invoice.", kind: "text" },
      { title: "Timeline", guide: "Start date, milestones and final deadline.", kind: "text" },
      { title: "Who owns what", guide: "What you must provide, what they handle, and who approves the work.", kind: "text" },
      { title: "Terms and risks", guide: "Contract, revisions, ownership of the work, cancellation and anything that felt unclear.", kind: "text" },
      { title: "Decision", guide: "Hired, not hired or still deciding, and why.", kind: "text" },
      { title: "Action items", guide: "Each task with an owner and due date. Each one gets its own Approve to send it to Tasks.", kind: "actions" },
    ],
  },
  {
    key: "client-success-interviews",
    name: "Client Success Interviews",
    purpose: "An interview with a client about their results, for case studies and testimonials.",
    savedOn: "The client's contact record",
    withContact: true,
    sections: [
      { title: "Client snapshot", guide: "Who they are, what they worked on with you, and for how long.", kind: "text" },
      { title: "Before", guide: "Where they were before working with you, in their own words.", kind: "text" },
      { title: "The turning point", guide: "What made them decide to start, and what shifted along the way.", kind: "text" },
      { title: "Results", guide: "Changes they described, with numbers where they gave them.", kind: "text" },
      { title: "After", guide: "Where they are now and how life or business feels different.", kind: "text" },
      { title: "Testimonial quotes", guide: "Their strongest lines, word for word. Marked as needing their written permission before any public use.", kind: "text" },
      { title: "Case study draft", guide: "A short before, turning point, results and after story, ready to edit. Draft only, and for use only with their permission.", kind: "text" },
      { title: "Action items", guide: "Ask for permission, send a thank-you, request a photo and so on. Each one gets its own Approve to send it to Tasks.", kind: "actions" },
    ],
  },
  {
    key: "hiring-interviews",
    name: "Hiring Interviews",
    purpose: "An interview with a candidate for a job or contract role.",
    savedOn: "The candidate's contact record",
    withContact: true,
    rules: "The AI leaves out anything about age, race, religion, disability, health, pregnancy, family plans, national origin or other personal traits that must not affect a hiring decision, even if it came up.",
    sections: [
      { title: "Candidate snapshot", guide: "Name, role applied for, interview date and who interviewed.", kind: "text" },
      { title: "Answers by question", guide: "Each question asked and a fair summary of the answer.", kind: "text" },
      { title: "Skills and experience", guide: "Evidence of the skills the role needs, from what they said.", kind: "text" },
      { title: "Strengths", guide: "What stood out in their favor, based only on job-related evidence.", kind: "text" },
      { title: "Concerns", guide: "Gaps or questions about fit for the role, based only on job-related evidence.", kind: "text" },
      { title: "Their questions", guide: "What the candidate asked about the role or business.", kind: "text" },
      { title: "Next step", guide: "Move forward, hold or decline, and why.", kind: "text" },
      { title: "Action items", guide: "References, second interview, offer or decline email. Each one gets its own Approve to send it to Tasks.", kind: "actions" },
    ],
  },
  {
    key: "networking-chats",
    name: "Networking & Coffee Chats",
    purpose: "A relaxed get-to-know-you conversation with a new connection.",
    savedOn: "The person's contact record",
    withContact: true,
    sections: [
      { title: "Who they are", guide: "Name, what they do, and how you met.", kind: "text" },
      { title: "Common ground", guide: "Shared interests, values, people or experiences.", kind: "text" },
      { title: "What they need", guide: "Challenges, goals or help they mentioned.", kind: "text" },
      { title: "How we could help each other", guide: "Introductions, referrals, collaborations or resources either of you could offer.", kind: "text" },
      { title: "Personal details to remember", guide: "Things they shared that are worth remembering next time, such as a family event or a launch date.", kind: "text" },
      { title: "Follow-up", guide: "What you said you would do, and when to reconnect. Each one gets its own Approve to send it to Tasks.", kind: "actions" },
    ],
  },
  {
    key: "advisor-investor-meetings",
    name: "Advisor & Investor Meetings",
    purpose: "A meeting with an advisor, mentor, board member or potential investor.",
    savedOn: "The advisor's or investor's contact record",
    withContact: true,
    sections: [
      { title: "Meeting snapshot", guide: "Who attended, their role, the date and the purpose of the meeting.", kind: "text" },
      { title: "What we shared", guide: "Updates, numbers or plans presented.", kind: "text" },
      { title: "Their questions", guide: "Every question asked, and the answer given or still owed.", kind: "text" },
      { title: "Advice and feedback", guide: "Recommendations, warnings and encouragement they offered.", kind: "text" },
      { title: "Concerns raised", guide: "Risks or doubts they named, and how you responded.", kind: "text" },
      { title: "Commitments", guide: "What each side committed to, such as introductions, documents, decisions or funding steps.", kind: "text" },
      { title: "Follow-up actions", guide: "Each follow-up with a due date. Each one gets its own Approve to send it to Tasks.", kind: "actions" },
      { title: "Thank-you and update (draft)", guide: "A thank-you note with any promised follow-ups, ready to edit and send. Draft only.", kind: "draft" },
    ],
  }

];

export const templateByKey = (key: string) => VOLANT_TEMPLATES.find((t) => t.key === key) ?? null;

export interface ReportSection { title: string; content: string; kind: SectionKind }
export interface ActionItem {
  id: string;
  text: string;
  owner: string;
  due: string;
  task_id: number | null;
  /** Set when the owner turned this item into a reminder or a calendar event (each item can be all three). */
  reminder?: { id: string; at: string } | null;
  event?: { id: string; at: string; provider: string } | null;
  /** Added by hand on the report, not by the AI. */
  added?: boolean;
}
export interface VolantReport { sections: ReportSection[]; action_items: ActionItem[]; made_at: string; clipped: boolean }

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const s = (v: unknown, n: number) => (typeof v === "string" ? v.slice(0, n) : "");
const isDate = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v);

/** A Zoom / Teams caption file (.vtt or .srt) is mostly timestamps; keep the words and the speaker names. */
export function cleanCaptionFile(name: string, text: string): string {
  if (!/\.(vtt|srt)$/i.test(name)) return text;
  return text
    .split(/\r?\n/)
    .filter((l) => l.trim() && !/^WEBVTT/i.test(l) && !/^\d+$/.test(l.trim()) && !/-->/.test(l) && !/^NOTE\b/i.test(l))
    .join("\n");
}

/** Pull the words out of a Word document's main XML (paragraphs become new lines). */
export function docxXmlToText(xml: string): string {
  return xml
    .replace(/<w:tab\/>/g, "\t")
    .replace(/<w:br\/>/g, "\n")
    .replace(/<\/w:p>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** The name the account uses for a template (their own when they renamed it). */
export function templateName(t: VolantTemplate, names: Record<string, string> | null | undefined): string {
  const own = names?.[t.key];
  return typeof own === "string" && own.trim() ? own.trim() : t.name;
}

/** The two messages for the AI. Only what was said; JSON back in the template's own section order. */
export function buildPrompt(t: VolantTemplate, o: { title: string; date: string; contactName: string; transcript: string }) {
  const clipped = o.transcript.length > VOLANT_MAX_PROMPT;
  const text = clipped ? o.transcript.slice(0, VOLANT_MAX_PROMPT) : o.transcript;
  const textSections = t.sections.filter((x) => x.kind !== "actions");
  const act = t.sections.find((x) => x.kind === "actions");
  const system =
    `You write a ${t.name} report from a transcript, for a small business owner or coach. The report is for: ${t.purpose} ` +
    `Use ONLY what is in the transcript; never invent names, numbers, dates, quotes or decisions. If a section has nothing in the transcript, write "Nothing on this came up." ` +
    `Write plainly and warmly, in short sentences. Use "- " at the start of a line for a list. No markdown headings, bold or tables. ` +
    `Quotes are word for word and say who said them. ` +
    (t.rules ? `${t.rules} ` : "") +
    `Owners are first names as spoken; leave "" if no owner was named. Dates only when a date or weekday was spoken, as YYYY-MM-DD resolved from the session date, otherwise "". ` +
    `Respond ONLY as strict JSON: {"sections": [{"title": "", "content": ""}], "action_items": [{"text": "start with a verb", "owner": "", "due": ""}]}. ` +
    `"sections" has exactly these titles, in this order, each with what to write:\n` +
    textSections.map((x, i) => `${i + 1}. ${x.title}: ${x.guide}`).join("\n") +
    (act ? `\n"action_items" is the "${act.title}" list: ${act.guide.replace(/ Each one gets its own Approve[^.]*\./, "")}` : "");
  const user =
    `Session: ${o.title || t.name} on ${o.date}.${o.contactName ? ` With: ${o.contactName}.` : ""}\n\n` +
    `TRANSCRIPT${clipped ? " (the first part; it was long)" : ""}:\n${text}`;
  return { system, user, clipped };
}

/** Turn the model's JSON into a safe report in the template's order (never trusts shape or length). */
export function cleanReport(raw: unknown, t: VolantTemplate, clipped: boolean, madeAt = new Date().toISOString()): VolantReport {
  const r = (raw ?? {}) as Record<string, unknown>;
  const got = Array.isArray(r.sections) ? (r.sections as unknown[]) : [];
  const byTitle = new Map<string, string>();
  for (const g of got) {
    const x = (g ?? {}) as Record<string, unknown>;
    const title = s(x.title, 200).trim().toLowerCase();
    if (title) byTitle.set(title, s(x.content, 8000).trim());
  }
  const textSections = t.sections.filter((x) => x.kind !== "actions");
  const sections: ReportSection[] = textSections.map((x, i) => {
    const fromTitle = byTitle.get(x.title.toLowerCase());
    const fromOrder = (got[i] as Record<string, unknown> | undefined)?.content;
    return { title: x.title, kind: x.kind, content: fromTitle ?? s(fromOrder, 8000).trim() };
  });
  const items = Array.isArray(r.action_items) ? (r.action_items as unknown[]).slice(0, 40) : [];
  const action_items: ActionItem[] = items
    .map((it) => {
      const i = (it ?? {}) as Record<string, unknown>;
      const due = s(i.due, 10);
      return { id: uid(), text: s(i.text, 400).trim(), owner: s(i.owner, 60).trim(), due: isDate(due) ? due : "", task_id: null };
    })
    .filter((i) => i.text);
  return { sections, action_items, made_at: madeAt, clipped };
}

/** A new action item typed in by hand on the report. */
export function newItem(v: unknown): ActionItem | null {
  const e = cleanItemEdit(v);
  return e.text ? { id: uid(), ...e, task_id: null, reminder: null, event: null, added: true } : null;
}

/** Clean an action item edited in the browser. */
export function cleanItemEdit(v: unknown): Pick<ActionItem, "text" | "owner" | "due"> {
  const r = (v ?? {}) as Record<string, unknown>;
  const due = s(r.due, 10);
  return { text: s(r.text, 400).trim(), owner: s(r.owner, 60).trim(), due: isDate(due) ? due : "" };
}

/** Plain text of a report, for Copy. */
export function reportToText(title: string, date: string, report: VolantReport, actionTitle: string): string {
  const lines = [title, date, ""];
  for (const sec of report.sections) {
    if (sec.kind === "private") continue;
    lines.push(sec.title, sec.content || "Nothing on this came up.", "");
  }
  if (report.action_items.length) {
    lines.push(actionTitle);
    for (const a of report.action_items) lines.push(`- ${a.text}${a.owner ? ` [${a.owner}]` : ""}${a.due ? ` (due ${a.due})` : ""}`);
  }
  return lines.join("\n").trim();
}
