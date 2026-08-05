// Starter Scripts & Templates seeded for every client on first load. After
// seeding they're editable rows; clients add their own or generate with AI.
export interface ScriptSeed {
  title: string;
  description: string;
  itemType: "script" | "template";
  category: string;
  channel: "sales" | "email" | "dm" | "objection" | "social";
  content: string;
  tags: string;
}

export const SCRIPT_CATEGORIES = [
  "Sales",
  "Prospecting",
  "Objections",
  "Onboarding",
  "Follow-up",
  "Content",
  "Nurture",
  "Closing",
];

export const SCRIPT_CHANNELS = [
  { id: "sales", label: "Sales Calls" },
  { id: "email", label: "Emails" },
  { id: "dm", label: "DMs" },
  { id: "objection", label: "Objections" },
  { id: "social", label: "Social" },
];

export const SCRIPTS_SEED: ScriptSeed[] = [
  {
    title: "Incubator to Circle Follow-up Call",
    description: "Complete call script for converting Incubator attendees to Circle members",
    itemType: "script",
    category: "Sales",
    channel: "sales",
    content: `OPENING:
"Hi [Name], it's [You] from LifeCharter. How are you doing since the Incubator?"

[Listen and acknowledge]

BRIDGE:
"I'm calling because I was thinking about our conversation during the workshop. You mentioned that [specific challenge] was really weighing on you."

PRESENT:
"The LifeCharter Circle is opening for new members, and I immediately thought of you. It's [price] a month. What questions do you have?"

CLOSE:
"Based on what you've shared, I really believe this is the right next step. Can I count you in?"`,
    tags: "incubator, circle, conversion",
  },
  {
    title: "LinkedIn DM — Cold Outreach",
    description: "Template for initial LinkedIn outreach to cold prospects",
    itemType: "template",
    category: "Prospecting",
    channel: "dm",
    content: `Hi [Name],

I came across your profile and noticed you're focused on [specific area]. I've been helping entrepreneurs in similar positions align their businesses with their true values—and I thought you might appreciate this perspective.

I host a free 90-minute workshop called the LifeCharter Incubator where we explore what alignment actually looks like in practice (not just theory).

Would you be open to learning more?

Best,
[You]`,
    tags: "linkedin, outreach, incubator",
  },
  {
    title: "Price Objection Handler",
    description: "Step-by-step response framework for price objections",
    itemType: "script",
    category: "Objections",
    channel: "objection",
    content: `PROSPECT: "That's more than I was expecting to spend."

RESPONSE:
"I completely understand. Investing in yourself and your business is a big decision. Can I ask—what were you hoping the investment would be?"

[Listen]

"Here's what I've found: when people focus only on the cost, they sometimes miss the cost of staying where they are. You mentioned [specific pain point]—how much is that costing you right now, financially and energetically?"

[Pause]

"The Circle isn't an expense—it's an investment in becoming the version of you who doesn't have [pain point] anymore. Does that feel worth exploring?"`,
    tags: "objection, price, sales",
  },
  {
    title: "Welcome Email — New Circle Member",
    description: "Email template for welcoming new members to the Circle",
    itemType: "template",
    category: "Onboarding",
    channel: "email",
    content: `Subject: Welcome to the Circle, [Name] 🦋

Dear [Name],

Welcome to the LifeCharter Circle! I'm so excited you've decided to join us on this journey of alignment and transformation.

Here's what happens next:

📅 Your first Alignment Call is scheduled for [Date] at [Time]
🔗 Join URL: [Zoom Link]
📚 Access your member portal: [Portal Link]
💬 Join our private community: [Community Link]

Before our call, please complete your LifeCharter Assessment (takes about 15 minutes). This helps us identify which domains need the most attention.

If you have any questions, simply reply to this email. I'm here to support you.

With alignment,
[You]

P.S. Mark your calendar for our weekly Circle gatherings.`,
    tags: "onboarding, email, circle",
  },
  {
    title: "Follow-up After No Response",
    description: "Gentle follow-up email for prospects who haven't responded",
    itemType: "template",
    category: "Follow-up",
    channel: "email",
    content: `Subject: Following up, [Name]

Hi [Name],

I wanted to circle back on my previous message about the LifeCharter Incubator. I know things get busy, and this might not be the right timing—and that's completely okay.

I also know that sometimes the people who need this work the most are the ones who feel too overwhelmed to even start. If that's you, I get it. I've been there.

If you're still interested, I'd love to have you join us. If not, no pressure at all. Just reply and let me know either way.

Wishing you alignment,
[You]`,
    tags: "follow-up, email, nurture",
  },
];
