// Projects start blank or from a template. A template is a list of tasks and milestones placed by "days from the
// anchor date" (the day of the event, or Day 1 of the challenge). Negative = before, positive = after.
export interface TemplateTask {
  title: string;
  day: number;
  priority?: "low" | "medium" | "high" | "critical";
  description?: string;
  span?: number; // days the work takes, for the timeline bar (default 1)
}
export interface ProjectTemplate {
  key: string;
  name: string;
  blurb: string;
  anchorLabel: string; // what the date field asks for
  goal: string;
  tasks: TemplateTask[];
  milestones: { title: string; day: number }[];
}

export const TEMPLATES: ProjectTemplate[] = [
  {
    key: "masterclass",
    name: "MasterClass",
    blurb: "A live workshop or webinar: promotion, registration, the event, the replay and follow-up.",
    anchorLabel: "MasterClass date",
    goal: "Fill the room, deliver a great MasterClass, and turn attendees into conversations.",
    tasks: [
      { title: "Pick the topic, the promise and the call to action", day: -35, priority: "high", span: 3 },
      { title: "Set up the registration page and the confirmation email", day: -30, priority: "high", span: 3 },
      { title: "Create the Zoom (or platform) event and test the link", day: -28 },
      { title: "Write the promotion emails (invite, reminder, last call)", day: -26, span: 3 },
      { title: "Write and schedule the social posts for the promotion", day: -24, span: 4 },
      { title: "Design the slides", day: -21, priority: "high", span: 5 },
      { title: "Send the invite email to your list", day: -20, priority: "high" },
      { title: "Personal invitations: message your warm contacts", day: -18, span: 5 },
      { title: "Ask partners and past clients to share the invitation", day: -14 },
      { title: "Send reminder email 1", day: -10 },
      { title: "Rehearse the MasterClass out loud and time it", day: -5, priority: "high", span: 2 },
      { title: "Prepare the offer and the next-step link", day: -4, priority: "high" },
      { title: "Tech check: audio, camera, screen share, chat, recording", day: -2, priority: "high" },
      { title: "Send the day-before reminder with the join link", day: -1 },
      { title: "Send the 1-hour reminder", day: 0 },
      { title: "Host the MasterClass", day: 0, priority: "critical" },
      { title: "Send the replay and thank-you email", day: 1, priority: "high" },
      { title: "Follow up personally with attendees who showed interest", day: 2, priority: "high", span: 5 },
      { title: "Follow up with registrants who did not attend", day: 3 },
      { title: "Review the numbers: registered, attended, booked, sold", day: 7, span: 2 },
    ],
    milestones: [
      { title: "Registration page live", day: -30 },
      { title: "Slides finished", day: -16 },
      { title: "MasterClass day", day: 0 },
      { title: "Follow-up complete", day: 7 },
    ],
  },
  {
    key: "masterclass-cycle",
    name: "MasterClass (repeating, four weeks)",
    blurb: "For a MasterClass you run again and again: reset from the last one, two weeks of filling the room, the event, then two weeks of follow-up.",
    anchorLabel: "MasterClass date",
    goal: "30 registered and 10 in the room; every attendee and no-show followed up within two weeks.",
    tasks: [
      { title: "Debrief the last MasterClass: what landed, questions asked, objections", day: -14, description: "Ten minutes, straight after the last session, while it is fresh." },
      { title: "Update the landing page to the new date and confirm the event platform shows it", day: -13, priority: "high" },
      { title: "Register a test person and confirm the confirmation email arrives", day: -13, priority: "high" },
      { title: "Update the dates in the invite, teaching, this-week and last-call emails; schedule them", day: -13, priority: "high", description: "In Campaigns & Broadcasts > Broadcasts. On each one, skip anyone still receiving the last session's follow-up series and anyone tagged as having attended it." },
      { title: "Update the social graphics, link-in-bio and short links", day: -13 },
      { title: "Send the invite email to your list (skip anyone already registered)", day: -13, priority: "high" },
      { title: "Update the slides from the debrief", day: -13, span: 3 },
      { title: "Personal invitations to your 20 warmest contacts", day: -12, priority: "high", span: 3 },
      { title: "Send the share kit to partners, affiliates and past clients", day: -10 },
      { title: "DMs, week 1: 25 a day across your platforms", day: -13, priority: "high", span: 6, description: "Log each one in your outreach pipeline." },
      { title: "Midpoint check: registrations against the goal of 30", day: -7, priority: "high", description: "If you are under 15, raise the DMs and personal invitations." },
      { title: "Send the teaching email", day: -7 },
      { title: "Send the \"this week\" email", day: -3 },
      { title: "Tech check and rehearse the offer", day: -2, priority: "high" },
      { title: "Posts: one a day, mostly giving value, the invitation about one in five", day: -13, span: 13 },
      { title: "Welcome DM to each new registrant", day: -13, priority: "high", span: 13, description: "The biggest lever for getting registrants into the room." },
      { title: "DMs, week 2: 25 a day across your platforms", day: -7, priority: "high", span: 7, description: "Log each one in your outreach pipeline." },
      { title: "Send the last-call email", day: -1 },
      { title: "Confirm the reminder emails went out; assign who runs chat and drops links", day: 0, priority: "high" },
      { title: "Host the MasterClass: room open 15 minutes early, recording and captions on", day: 0, priority: "critical", description: "One clear next step for everyone in the room." },
      { title: "Tag who attended and who did not in Contacts", day: 0, priority: "high" },
      { title: "Send the replay: one email for attendees, one for those who missed it, and start the follow-up series", day: 1, priority: "critical", description: "Say how long the replay stays up (72 hours creates urgency)." },
      { title: "Personal follow-up with the warmest attendees", day: 1, priority: "high", span: 3, description: "People who asked questions or stayed to the end." },
      { title: "Confirm the follow-up email series is running and anyone who books is removed", day: 2 },
      { title: "Ask attendees for a one-line testimonial", day: 2, priority: "low" },
      { title: "Take the replay down", day: 4 },
      { title: "Review the numbers: registered, attended, booked, sold, and which channel they came from", day: 7, priority: "high" },
      { title: "Close out: everyone who did not book returns to your general list", day: 14 },
    ],
    milestones: [
      { title: "Next date live everywhere", day: -13 },
      { title: "15 registered", day: -7 },
      { title: "30 registered", day: -1 },
      { title: "MasterClass day", day: 0 },
      { title: "Replay sent", day: 1 },
      { title: "Follow-up complete", day: 14 },
    ],
  },
  {
    key: "monthly-event",
    name: "Monthly event (repeating)",
    blurb: "For a workshop, incubator or open evening you hold every month: reset from the last one, three weeks of filling the room, the event, then three weeks of follow-up.",
    anchorLabel: "Event date",
    goal: "30 registered; every attendee and no-show followed up for three weeks, one offer a week.",
    tasks: [
      { title: "Debrief the last event: what landed, questions asked, objections", day: -27, description: "Ten minutes, the day after the last one, while it is fresh." },
      { title: "Update the registration page to the new date and confirm the event platform shows it", day: -27, priority: "high" },
      { title: "Register a test person and confirm the confirmation email arrives", day: -27, priority: "high" },
      { title: "Update the dates in the invite, teaching, this-week and last-call emails; schedule them", day: -26, priority: "high", description: "In Campaigns & Broadcasts > Broadcasts. On each one, skip anyone still receiving the last event's follow-up series and anyone already registered." },
      { title: "Update the social graphics, link-in-bio and short links", day: -26 },
      { title: "Update the slides from the debrief", day: -26, span: 5 },
      { title: "Send the invite email to your list", day: -21, priority: "high" },
      { title: "Personal invitations to your 20 warmest contacts", day: -21, priority: "high", span: 4 },
      { title: "Send the share kit to partners, affiliates and past clients", day: -20 },
      { title: "DMs, week 1: 25 a day across your platforms", day: -21, priority: "high", span: 7, description: "Log each one in your outreach pipeline." },
      { title: "Posts: one a day, mostly giving value, the invitation about one in five", day: -21, span: 21 },
      { title: "Welcome DM to each new registrant", day: -21, priority: "high", span: 21, description: "The biggest lever for getting registrants into the room." },
      { title: "Send the teaching email", day: -14 },
      { title: "DMs, week 2: 25 a day across your platforms", day: -14, priority: "high", span: 7, description: "Log each one in your outreach pipeline." },
      { title: "Midpoint check: registrations against the goal of 30", day: -10, priority: "high", description: "If you are under 15, raise the DMs and personal invitations." },
      { title: "DMs, week 3: 25 a day across your platforms", day: -7, priority: "high", span: 7, description: "Log each one in your outreach pipeline." },
      { title: "Send the \"this week\" email", day: -3 },
      { title: "Tech check and rehearse the offer", day: -2, priority: "high" },
      { title: "Send the last-call email", day: -1 },
      { title: "Confirm the reminder emails went out; assign who runs chat and drops links", day: 0, priority: "high" },
      { title: "Host the event: room open 15 minutes early, recording and captions on", day: 0, priority: "critical", description: "One clear next step for everyone in the room." },
      { title: "Tag who attended and who did not in Contacts", day: 0, priority: "high" },
      { title: "Send the replay: one email for attendees, one for those who missed it, and start the follow-up series", day: 1, priority: "critical", description: "Say how long the replay stays up (72 hours creates urgency)." },
      { title: "Personal follow-up with the warmest attendees", day: 1, priority: "high", span: 3, description: "People who asked questions or stayed to the end." },
      { title: "Confirm the follow-up email series is running and anyone who buys is removed", day: 2 },
      { title: "Ask attendees for a one-line testimonial", day: 2, priority: "low" },
      { title: "Take the replay down", day: 4 },
      { title: "Review the numbers: registered, attended, enrolled, and which channel they came from", day: 7, priority: "high" },
      { title: "Close out: the follow-up series has ended; everyone who did not enrol returns to your general list", day: 21 },
    ],
    milestones: [
      { title: "Next date live everywhere", day: -26 },
      { title: "15 registered", day: -10 },
      { title: "30 registered", day: -1 },
      { title: "Event day", day: 0 },
      { title: "Replay sent", day: 1 },
      { title: "Follow-up complete", day: 21 },
    ],
  },
  {
    key: "challenge21",
    name: "21-Day Challenge (Command Shift)",
    blurb: "A 21-day challenge: the build, the launch, the three weeks and the wrap-up with an offer.",
    anchorLabel: "Day 1 of the challenge",
    goal: "Run a 21-day challenge that builds momentum for the group and ends with qualified next steps.",
    tasks: [
      { title: "Decide the theme, the daily rhythm and the promise", day: -35, priority: "high", span: 3 },
      { title: "Outline the 21 daily prompts or lessons", day: -32, priority: "high", span: 6 },
      { title: "Create the challenge hub (group, page or app) and the sign-up form", day: -28, priority: "high", span: 3 },
      { title: "Write the welcome and onboarding emails", day: -25, span: 3 },
      { title: "Plan the live calls (kick-off, mid-point, finale)", day: -22 },
      { title: "Build the promotion plan and write the launch posts", day: -21, span: 5 },
      { title: "Open registration and send the invitation", day: -18, priority: "high" },
      { title: "Record or write Week 1 content", day: -14, priority: "high", span: 5 },
      { title: "Record or write Week 2 content", day: -9, span: 5 },
      { title: "Record or write Week 3 content", day: -4, span: 4 },
      { title: "Send the welcome email and open the hub", day: -2, priority: "high" },
      { title: "Kick-off live call and Day 1", day: 0, priority: "critical" },
      { title: "Week 1: post daily, reply to every participant, celebrate wins", day: 1, span: 6 },
      { title: "Week 1 check-in message", day: 6 },
      { title: "Mid-point live call (Day 11)", day: 10, priority: "high" },
      { title: "Week 2: post daily, reply, spotlight participants", day: 7, span: 7 },
      { title: "Week 3: post daily, reply, tease the finale", day: 14, span: 7 },
      { title: "Prepare the offer for challenge graduates", day: 15, priority: "high", span: 3 },
      { title: "Finale live call and the invitation to the next step (Day 21)", day: 20, priority: "critical" },
      { title: "Send certificates or thank-you messages", day: 21 },
      { title: "Personal follow-up with the most engaged participants", day: 22, priority: "high", span: 5 },
      { title: "Review results and write down what to change next time", day: 28, span: 2 },
    ],
    milestones: [
      { title: "Hub and sign-up live", day: -26 },
      { title: "Registration open", day: -18 },
      { title: "Day 1", day: 0 },
      { title: "Finale (Day 21)", day: 20 },
      { title: "Follow-up complete", day: 27 },
    ],
  },
];

export const templateByKey = (key: string | null | undefined) => TEMPLATES.find((t) => t.key === key) ?? null;

export const addDays = (isoDay: string, days: number): string => {
  const d = new Date(`${isoDay}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};
