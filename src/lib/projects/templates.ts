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
