// The Command Suite glossary: our own words, plus the business, sales and marketing terms the app uses. Each term has a
// one-line hint (shown when you hover or tap a dotted-underlined word anywhere in the app) and a fuller meaning (the
// Glossary page under Settings). To add or reword a term, edit this list; both places follow it.

export type GlossaryCategory = "Command Suite" | "Business" | "Sales" | "Marketing";
export interface GlossaryTerm {
  id: string;
  term: string;
  category: GlossaryCategory;
  short: string; // one line, shown on hover or tap
  long: string; // the Glossary page
  match?: string[]; // other spellings found in the app's words
  seen?: { label: string; href: string }[]; // where in the app the word is used
  sortAs?: string; // alphabetical position when it differs from the term (for example "Collective" for "The Collective")
}

export const GLOSSARY_CATEGORIES: GlossaryCategory[] = ["Command Suite", "Business", "Sales", "Marketing"];

export const GLOSSARY: GlossaryTerm[] = [
  // ---- Command Suite ----
  { id: "travel-partner", seen: [{ label: "Every page (the widget in the corner)", href: "/help/ai-guide" }], term: "Travel Partner", category: "Command Suite", short: "Your guide inside the app: ask it how anything works.", long: "The Ask widget at the bottom of the screen. Type a question about how something works and it answers from the Command Suite's own Help library, and can take you to the right page." },
  { id: "sidekick", seen: [{ label: "Settings \u2192 AI Assistant", href: "/settings?tab=ai" }], term: "Sidekick", category: "Command Suite", short: "The starting name of your AI assistant, until you name it.", long: "Your AI assistant. It starts out called Sidekick; you can rename it under Settings → AI Assistant. It reads your assessments and your business to help with plans, insights, captions and drafts, using your own AI key." },
  { id: "hope-seat", term: "Hope Seat", category: "Command Suite", short: "The live coaching call where one person's challenge is worked with the group.", long: "A live coaching session held as the Dimension Call on the second Tuesday of the month, 6pm Mountain. You bring a real challenge and the group helps you work through it. It is one of the weekly coaching calls included in your plan.", match: ["Hope Seat"] },
  { id: "alignment-architect", term: "Alignment Architect", category: "Command Suite", short: "AmiLynne's title: the person who designs alignment between your vision and how your business runs.", long: "AmiLynne \"Babs\" Carroll's role. An Alignment Architect helps a founder line up their vision, offers, systems and daily rhythm so the business runs on purpose." },
  { id: "true-north", seen: [{ label: "Business Plan", href: "/business-plan" }], term: "True North", category: "Command Suite", short: "One sentence naming your heading for this season.", long: "A single sentence that says where you are heading right now. Once it is written, every decision gets simpler: does this move me toward my True North or away from it?" },
  { id: "buried", term: "BURIED", category: "Command Suite", short: "Six signs a business leans too hard on its owner.", long: "A pattern check: Bottlenecked decisions, Unclear priorities, Recurring problems, Invisible numbers, Effort without acceleration, Direction lost. Most owners recognise two of them. They are clues about structure, not personality.", match: ["BURIED pattern"] },
  { id: "command-audit", term: "Command Audit", category: "Command Suite", short: "A 1 to 5 rating of every area of your business.", long: "You rate each area of your business from 1 to 5 and see the whole map at once. Your two lowest areas become your starting point.", match: ["Command Audit"] },
  { id: "command-center", term: "Command Center", category: "Command Suite", short: "One view of your mission, priorities and numbers.", long: "The place where your mission, True North, priorities and key numbers sit together, so you can see and lead the whole business from one screen." },
  { id: "command-shift", term: "Command Shift", category: "Command Suite", short: "The 21-day challenge that moves you from hustle to command.", long: "A free 21-day challenge: one aligned move a day, grouped in three phases (Truth and Clarity, Build the Engine, Live in Command)." },
  { id: "masterclass", term: "MasterClass", category: "Command Suite", short: "The free live 90-minute training, every other Thursday.", long: "A free live training, 90 minutes, where you work one real issue from your business and leave with a plan. Everyone who registers receives the replay." },
  { id: "incubator", term: "Incubator", category: "Command Suite", short: "The monthly LifeCharter Incubator event.", long: "A monthly live LifeCharter event. Register once on its page and the Suite sends the reminders and the replay." },
  { id: "collective", sortAs: "Collective", seen: [{ label: "The Collective", href: "/community" }], term: "The Collective", category: "Command Suite", short: "The community space: replays, channels and members.", long: "The LifeCharter community inside the app. Call replays, channels for each topic and your fellow members live here.", match: ["Collective"] },
  { id: "quick-wins", seen: [{ label: "Daily Compass", href: "/daily-compass" }, { label: "Morning Brief", href: "/morning-brief" }], term: "Quick Wins", category: "Command Suite", short: "Small, high-impact moves you can finish in minutes.", long: "A menu of small moves, such as asking a client for a testimonial. Tap one to add it to today's tasks, or to send its ready-made email, which is then logged as done.", match: ["Quick Win"] },
  { id: "domain-scores", seen: [{ label: "Business Alignment", href: "/business-alignment" }, { label: "Progress", href: "/progress" }], term: "Domain Scores", category: "Command Suite", short: "Your scores for each of the 12 areas of your business.", long: "The Suite scores your business across 12 domains (dimensions). Each score sits in one of four phases: Survival, Growth, Expansion or Legacy.", match: ["Domain Score", "domain scores"] },
  { id: "business-health-score", seen: [{ label: "Progress", href: "/progress" }, { label: "Executive Home", href: "/" }], term: "Business Health Score", category: "Command Suite", short: "One overall number for how your business is doing.", long: "Your overall score, built from your three assessments and then kept current by what you log (tasks, sales activity, finances). It uses the same four phases as each domain: Survival, Growth, Expansion, Legacy." },
  { id: "quick-pulse", seen: [{ label: "Assessments", href: "/assessments" }], term: "Quick Pulse", category: "Command Suite", short: "A short check-in that tracks your progress over time.", long: "A brief check-in on the Assessments page that you can repeat. It shows how your scores move as you work the Suite." },
  { id: "assessments", seen: [{ label: "Set up Suite", href: "/setup" }, { label: "Assessments", href: "/assessments" }], term: "Brain, Soul and Profit assessments", category: "Command Suite", short: "The three assessments that teach the Suite your business.", long: "Brain (your systems and operations, about 90 minutes), Soul (your identity, values and calling, about 60 minutes) and Profit (twelve business dimensions scored, about 45 minutes). Your assistant and your scores are built from your answers.", match: ["Brain Assessment", "Soul Assessment", "Profit Assessment"] },
  { id: "outreach-pipeline", seen: [{ label: "Clients & Sales \u2192 Outreach Pipelines", href: "/dm-pipeline" }], term: "Outreach Pipeline", category: "Command Suite", short: "Your board for reaching out to new people: DMs, emails, texts.", long: "A board of cards, one per person you are reaching out to, moved stage by stage as you message them. It is for prospecting. Your Pipeline is for people already in a sales conversation.", match: ["Outreach Pipelines"] },
  { id: "prospect-qualifier", seen: [{ label: "Clients & Sales \u2192 Prospect Qualifier", href: "/qualifier" }], term: "Prospect Qualifier", category: "Command Suite", short: "Scores a prospect against your Ideal Client Profile.", long: "Paste a prospect's profile, or upload a whole list, and it tells you their fit, their level, a warm DM angle and a priority, so you spend your outreach on the right people." },
  { id: "executive-consultation", term: "Executive Consultation", category: "Command Suite", short: "A one-on-one conversation about working together.", long: "A private consultation with AmiLynne about whether and how to work together, and what your next step should be." },
  { id: "pre-founder", term: "Pre-Founder", category: "Command Suite", short: "An early member who gives feedback in return for a full account.", long: "An early member with a full VIP Command Suite account who shares feedback as they use it, in exchange for a long introductory period before billing begins." },
  { id: "alignment-anchor", term: "Alignment Anchor", category: "Command Suite", short: "The Monday call: last week's wins, this week's goals.", long: "The weekly group call, Monday 10am Mountain. You review last week's wins and challenges and set this week's goals. If you only make one call a week, make this one." },
  { id: "founders-half-hour", term: "Founder's Half Hour", category: "Command Suite", short: "A free weekly call open to any founder.", long: "A free 30-minute call every Tuesday at 1pm Mountain, open to everyone. Bring a founder you know.", match: ["Founder’s Half Hour"] },
  { id: "office-hours", term: "Office Hours", category: "Command Suite", short: "The Thursday tech call: a demo, then your questions.", long: "Every Thursday at 11am Mountain. The first half is a demo of something in the Suite; the second half is open for your questions and challenges." },
  { id: "lc-beacon", term: "LC Beacon", category: "Command Suite", short: "The Suite's own tool for scheduling and posting social content.", long: "LifeCharter's social posting app. Connect your accounts, then write, schedule or post, and keep ideas and drafts in one place." },
  { id: "lc-spark", term: "LC Spark", category: "Command Suite", short: "The AI chat that talks with visitors and captures leads.", long: "An AI chat for your website and Instagram messages that answers visitors and captures them as leads in Contacts." },

  // ---- Business ----
  { id: "sop", seen: [{ label: "Operations \u2192 SOPs", href: "/operations/sops" }], term: "SOP", category: "Business", short: "Standard Operating Procedure: a written how-to for a repeatable task.", long: "A standard operating procedure: step-by-step instructions for something you do more than once, so anyone can do it the same way every time.", match: ["SOPs"] },
  { id: "cash-flow", seen: [{ label: "Finance", href: "/finance" }], term: "Cash flow", category: "Business", short: "Money coming in and going out, and when.", long: "The timing of the money moving through your business. A business can be profitable on paper and still be short of cash if payments arrive later than bills." },
  { id: "margin", seen: [{ label: "Finance", href: "/finance" }], term: "Margin", category: "Business", short: "What is left of each dollar of sales after costs.", long: "Revenue minus the cost of delivering it, shown as a percentage of revenue. A higher margin means each sale keeps more for the business." },
  { id: "runway", term: "Runway", category: "Business", short: "How many months you can operate on the money you have.", long: "The number of months the business can keep running at its current spending before the money runs out." },
  { id: "kpi", seen: [{ label: "Executive Home", href: "/" }], term: "KPI", category: "Business", short: "Key Performance Indicator: a number that shows how you are doing.", long: "A key performance indicator: one of the few numbers that tell you whether the business is on track, such as monthly revenue or new clients.", match: ["KPIs"] },
  { id: "scope", term: "Scope", category: "Business", short: "What is, and is not, included in a piece of work.", long: "The boundaries of a project or offer: exactly what you will deliver and what you will not. Clear scope protects your time and your client's expectations." },

  // ---- Sales ----
  { id: "pipeline", seen: [{ label: "Clients & Sales \u2192 Pipeline", href: "/sales/pipeline" }], term: "Pipeline", category: "Sales", short: "Everyone who is in a sales conversation with you, by stage.", long: "Your sales pipeline: opportunities moving from first conversation toward a yes. It is different from an Outreach Pipeline, which is for first reaching out." },
  { id: "lead", seen: [{ label: "Contacts", href: "/contacts" }], term: "Lead", category: "Sales", short: "A person who has shown interest.", long: "Someone who has raised a hand: filled in a form, registered, replied or asked a question. A lead has not decided to buy yet." },
  { id: "qualified-lead", seen: [{ label: "Prospect Qualifier", href: "/qualifier" }], term: "Qualified lead", category: "Sales", short: "A lead who fits who you serve and could buy.", long: "A lead who matches your Ideal Client Profile and has the need, the means and the interest to work with you." },
  { id: "icp", seen: [{ label: "Prospect Qualifier", href: "/qualifier" }], term: "ICP", category: "Sales", short: "Ideal Client Profile: a description of who you serve best.", long: "Your Ideal Client Profile: who you serve, what they struggle with, what they already have, what they are missing and your red flags. The Prospect Qualifier scores people against it.", match: ["Ideal Client Profile", "Ideal Client Profiles", "ICPs"] },
  { id: "discovery-call", term: "Discovery call", category: "Sales", short: "A first conversation to learn whether you are a fit.", long: "A first call where you listen: what they want, what is in the way, and whether and how you could help." },
  { id: "proposal", seen: [{ label: "Clients & Sales \u2192 Pipeline", href: "/sales/pipeline" }], term: "Proposal", category: "Sales", short: "A written offer of what you will do and for how much.", long: "A written offer after a conversation: the problem, what you will do, what it costs and the next step." },
  { id: "close-rate", term: "Close rate", category: "Sales", short: "Out of everyone you talk to, how many say yes.", long: "The percentage of qualified conversations that become paying clients. Improving it is often easier than finding more leads.", match: ["Conversion rate"] },

  // ---- Marketing ----
  { id: "lead-magnet", term: "Lead magnet", category: "Marketing", short: "A free gift that people sign up to receive.", long: "Something useful and free, such as a checklist or a training, offered in exchange for an email address." },
  { id: "funnel", seen: [{ label: "Marketing Plan", href: "/marketing-plan" }], term: "Funnel", category: "Marketing", short: "The steps that turn a stranger into a client.", long: "The path someone takes from first noticing you to becoming a client: for example an ad, a sign-up, a free training, a conversation, an offer." },
  { id: "cta", term: "CTA", category: "Marketing", short: "Call to action: the one thing you ask people to do next.", long: "A call to action: a clear, single next step, such as Save my seat or Book a call.", match: ["Call to action"] },
  { id: "conversion", term: "Conversion", category: "Marketing", short: "Someone taking the step you hoped for.", long: "A visitor doing the action you wanted, such as registering, booking or buying. The conversion rate is the share who do." },
  { id: "nurture-sequence", seen: [{ label: "Campaigns & Broadcasts", href: "/sequences-manager" }], term: "Nurture sequence", category: "Marketing", short: "A series of emails that builds trust over time.", long: "A short run of automatic emails that helps new people get to know you and decide, without you writing each one on the day.", match: ["Sequence", "Sequences"] },
  { id: "open-rate", seen: [{ label: "Campaigns & Broadcasts", href: "/sequences-manager" }], term: "Open rate", category: "Marketing", short: "The share of people who open your email.", long: "The percentage of recipients who open an email. It tells you how well your subject line and sender name are working." },
  { id: "brand-voice", seen: [{ label: "Marketing Plan", href: "/marketing-plan" }], term: "Brand voice", category: "Marketing", short: "How your business sounds in writing.", long: "The consistent personality in everything you write: your word choices, tone and what you never say." },
];

export const glossaryById = new Map(GLOSSARY.map((g) => [g.id, g]));

// Words to look for inside a piece of text (longest first so "Business Health Score" wins over "Health").
const PATTERNS: { re: RegExp; term: GlossaryTerm }[] = GLOSSARY.flatMap((g) => [g.term, ...(g.match ?? [])].map((w) => ({ w, g })))
  .sort((a, b) => b.w.length - a.w.length)
  .map(({ w, g }) => ({ re: new RegExp(`(?<![A-Za-z0-9])${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![A-Za-z0-9])`, "g"), term: g }));

// Split text into plain pieces and glossary words, first occurrence of each term only.
export function glossarySplit(text: string, only?: string[]): { text: string; term?: GlossaryTerm }[] {
  const hits: { start: number; end: number; term: GlossaryTerm }[] = [];
  const used = new Set<string>();
  for (const { re, term } of PATTERNS) {
    if (only && !only.includes(term.id)) continue;
    if (used.has(term.id)) continue;
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) {
      const s = m.index;
      const e = s + m[0].length;
      if (hits.some((h) => s < h.end && e > h.start)) continue;
      hits.push({ start: s, end: e, term });
      used.add(term.id);
      break;
    }
  }
  hits.sort((a, b) => a.start - b.start);
  const out: { text: string; term?: GlossaryTerm }[] = [];
  let at = 0;
  for (const h of hits) {
    if (h.start > at) out.push({ text: text.slice(at, h.start) });
    out.push({ text: text.slice(h.start, h.end), term: h.term });
    at = h.end;
  }
  if (at < text.length) out.push({ text: text.slice(at) });
  return out;
}
