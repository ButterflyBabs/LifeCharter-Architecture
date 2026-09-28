// Broadcasts — pieces shared by the screen and the server (no server imports).

export const OWNER_TZ = "America/Denver";
const BUILT_IN_SLOTS = new Set(["first_name", "greeting"]);

// {{slot}} names the owner must fill before sending ({{first_name}} and
// {{greeting}} are filled per person by the renderer).
export function slotsIn(...texts: (string | null | undefined)[]): string[] {
  const out = new Set<string>();
  for (const t of texts)
    (t || "").replace(/\{\{\s*([a-z0-9_]+)\s*\}\}/gi, (whole, k: string) => {
      if (!BUILT_IN_SLOTS.has(k.toLowerCase())) out.add(k.toLowerCase());
      return whole;
    });
  return Array.from(out);
}

export function fillSlots(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{\s*([a-z0-9_]+)\s*\}\}/gi, (whole, k: string) => {
    const v = vars[k.toLowerCase()];
    return typeof v === "string" && v.trim() ? v.trim() : whole;
  });
}

// Wall-clock date + time in a zone → the UTC instant.
export function zonedToUtc(date: string, time: string, tz: string): Date | null {
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const t = /^(\d{1,2}):(\d{2})$/.exec(time);
  if (!d || !t) return null;
  const want = Date.UTC(+d[1], +d[2] - 1, +d[3], +t[1], +t[2]);
  let guess = want;
  for (let i = 0; i < 3; i++) {
    const w = zonedParts(new Date(guess), tz);
    const seen = Date.UTC(+w.date.slice(0, 4), +w.date.slice(5, 7) - 1, +w.date.slice(8, 10), +w.time.slice(0, 2), +w.time.slice(3, 5));
    guess += want - seen;
  }
  return new Date(guess);
}

// A UTC instant → wall-clock date (YYYY-MM-DD) and time (HH:MM) in a zone.
export function zonedParts(at: Date, tz: string): { date: string; time: string } {
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(at);
  const g = (k: string) => p.find((x) => x.type === k)?.value ?? "00";
  return { date: `${g("year")}-${g("month")}-${g("day")}`, time: `${g("hour")}:${g("minute")}` };
}

export const addDays = (date: string, n: number) => {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
};

export interface BroadcastTemplate {
  key: string;
  name: string;
  description: string;
  brand: string;
  subject: string;
  preview: string;
  body: string;
  buttonLabel: string;
  buttonUrl: string;
  tags: string[];
  tagMatch: "any" | "all";
  skipPriorTemplate: boolean;
  slots: { key: string; label: string; placeholder: string }[];
  // Default send time: this many days after the session date, at this local time (owner's zone).
  schedule: { daysAfter: number; time: string; label: string };
}

export const MASTERCLASS_PRICING_URL = "https://lccommandsuite.com/get-started";
export const MASTERCLASS_CONSULT_URL = "https://lccommandsuite.com/schedule/masterclass";

// cs022 — MasterClass email 5: the replay follow-up.
export const BROADCAST_TEMPLATES: BroadcastTemplate[] = [
  {
    key: "masterclass-replay",
    name: "MasterClass replay follow-up",
    description: "The morning after each session, to everyone registered (whether or not they showed): the replay, the pricing page and the Executive Consultation link.",
    brand: "Command Shift MasterClass",
    subject: "Your MasterClass replay is here",
    preview: "The full replay, plus two open doors for whatever comes next.",
    body: `{{greeting}}

Thank you for making room for the Command Shift MasterClass. Whether you were with us live or life had other plans, this one is for you. The full replay is ready, and it's yours to watch at your own pace.

Here's my invitation: watch it with a notebook close by. Pause where something lands. The moment you catch yourself thinking "that's exactly where I am" is the moment worth writing down, because that is where your next shift begins.

When you're ready for what comes next, two doors are open:

- **See the LifeCharter Command Suite and pricing:** ${MASTERCLASS_PRICING_URL}
- **Book your Executive Consultation:** ${MASTERCLASS_CONSULT_URL}

The Executive Consultation is a focused conversation with Marcello about where your business stands today and what it needs so you can lead it from strength, not from overwhelm. Bring your questions. Bring your big ideas. He'll bring his full attention.

You have built something real. You deserve a business that gives you back the time, clarity and freedom you pour into it. I'm cheering for you, and I'd love to hear what landed. Just hit reply.`,
    buttonLabel: "Watch the replay",
    buttonUrl: "{{replay_url}}",
    tags: ["masterclass-registered"],
    tagMatch: "any",
    skipPriorTemplate: false,
    slots: [{ key: "replay_url", label: "Replay link (Vimeo)", placeholder: "https://vimeo.com/…" }],
    schedule: { daysAfter: 1, time: "09:00", label: "9am Mountain the morning after the session" },
  },
];

export const templateByKey = (key: string | null | undefined) => BROADCAST_TEMPLATES.find((t) => t.key === key) ?? null;
