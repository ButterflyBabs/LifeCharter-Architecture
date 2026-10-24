// Cold email sent from connected Google mailboxes inside the Suite (never Resend). This file is the rules, with no database or network:
// the three-step series, the daily ramp, the send window, who is due next, how a reply or a bounce is told apart, and the footer.

export interface ColdStep {
  day: number; // days after Email 1 (0 for the first)
  subject: string;
  body: string;
}

export const DEFAULT_STEPS: ColdStep[] = [
  {
    day: 0,
    subject: "{{first_name}}, a quick question",
    body: `Hi {{first_name}},

I'm AmiLynne Carroll. I help founders and coaches get their business out of a dozen tabs and one tired mind. I'm writing because of your work{{at_company}}, and I have one question.

What is the one thing in your business that still runs through you and nobody else?

I ask because I teach a free, live, 60-minute session called From Hustle to Command. In it you map exactly that: where your business leans on you most, and a seven-day plan to start changing it. You build it in the room, on one of your own real business issues. The next one is {{next_session_date}} at noon Mountain, and everyone who joins live gets a free 2027 digital planner for founders.

If that sounds useful, you can save a seat here: {{personal_link}}

If I have reached you at a bad time or this is not for you, reply "no thanks" and I will not write again.

Head up - Wings out,

AmiLynne "Babs" Carroll
Alignment Architect, LifeCharter Command Suite`,
  },
  {
    day: 4,
    subject: "The pattern I hear most from founders",
    body: `Hi {{first_name}},

One short follow-up, then I will leave you be.

The pattern I hear most from founders and coaches is that the business is moving, but every decision, follow-up and detail still lands on one person. In the free session we name that pattern and map one real bottleneck, so you can see exactly where it gets stuck and what to do first.

The next session is {{next_session_date}} at noon Mountain, and everyone who joins live gets a free 2027 digital planner for founders. You can save a seat here: {{personal_link}}

If this is not for you, reply "no thanks".

Head up - Wings out,

AmiLynne "Babs" Carroll
Alignment Architect, LifeCharter Command Suite`,
  },
  {
    day: 9,
    subject: "Last note from me, {{first_name}}",
    body: `Hi {{first_name}},

This is my last note. If now is not the time, that is completely fine.

Two easy ways to take a next step if you want one:

1. Join the free session, From Hustle to Command (everyone who joins live gets a free 2027 digital planner for founders): {{personal_link}}
2. If you would rather talk it through one to one, book a 30-minute conversation with my colleague Marcello: {{booking_link}}

Either way, I am glad our paths crossed. Reply "no thanks" if you would rather not hear from me again.

Head up - Wings out,

AmiLynne "Babs" Carroll
Alignment Architect, LifeCharter Command Suite`,
  },
];

export const DEFAULT_FOOTER = "Sacred Kaleidoscope Community LLC, 5787 S Odessa St, Centennial, CO 80015";
export const BOOKING_LINK = "https://lccommandsuite.com/book/executive-consultation";

export function render(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{\s*([a-z_]+)\s*\}\}/gi, (_m, k: string) => vars[k.toLowerCase()] ?? "");
}

export function firstNameOf(name: string): string {
  const f = (name || "").trim().split(/\s+/)[0] || "";
  return f.replace(/[^A-Za-z\u00C0-\u024F'\u2019-]/g, "") || "there";
}

// How many emails one mailbox may send today, by how many days the series has been running. A new mailbox starts small and grows.
export function rampCap(daysRunning: number, cap: number): number {
  const step = daysRunning < 4 ? 5 : daysRunning < 8 ? 10 : daysRunning < 14 ? 20 : 30;
  return Math.max(0, Math.min(step, cap));
}

export function localParts(now: Date, tz: string): { hour: number; weekday: number; ymd: string } {
  const f = new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", hour12: false, weekday: "short", year: "numeric", month: "2-digit", day: "2-digit" });
  const p = Object.fromEntries(f.formatToParts(now).map((x) => [x.type, x.value]));
  const wd = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(p.weekday);
  return { hour: Number(p.hour) % 24, weekday: wd, ymd: `${p.year}-${p.month}-${p.day}` };
}

export function inSendWindow(now: Date, tz: string, startHour: number, endHour: number, weekdaysOnly: boolean): boolean {
  const { hour, weekday } = localParts(now, tz);
  if (weekdaysOnly && (weekday === 0 || weekday === 6)) return false;
  return hour >= startHour && hour < endHour;
}

export function daysBetween(fromYmd: string | null, toYmd: string): number {
  if (!fromYmd) return 0;
  return Math.max(0, Math.round((Date.parse(toYmd + "T00:00:00Z") - Date.parse(fromYmd + "T00:00:00Z")) / 86400000));
}

// Which step goes to this person next, or null (finished, or not yet time). Each step waits for the gap the series sets after the one before.
export function dueStep(sent: { step: number; sentAt: Date }[], steps: ColdStep[], now: Date): number | null {
  if (!steps.length) return null;
  if (!sent.length) return 0;
  const last = sent.reduce((a, b) => (b.step > a.step ? b : a));
  const next = last.step + 1;
  if (next >= steps.length) return null;
  const gapDays = Math.max(1, steps[next].day - steps[last.step].day);
  return now.getTime() >= last.sentAt.getTime() + gapDays * 86400000 ? next : null;
}

export const STOP_RE = /\b(unsubscribe|remove me|take me off|stop (emailing|sending|contacting|writing)|do not (contact|email|write)|don'?t (contact|email|write)|no thanks|no thank you|not interested|opt[- ]?out)\b/i;
const AUTO_RE = /^(automatic reply|auto[- ]?reply|autoreply|out of (the )?office|vacation)/i;
const BOUNCE_FROM_RE = /(mailer-daemon|postmaster)@/i;
const EMAIL_IN_TEXT = /[^\s<>(),;:"'[\]]+@[^\s<>(),;:"'[\]]+\.[a-z]{2,}/gi;

export type Classified = { kind: "bounce"; addresses: string[] } | { kind: "stop" } | { kind: "reply" } | { kind: "auto" };

export function classifyMessage(m: { fromEmail: string; subject: string; preview: string }, ownEmail: string): Classified {
  const own = ownEmail.toLowerCase();
  if (BOUNCE_FROM_RE.test(m.fromEmail) || /^(delivery status notification|undeliverable|mail delivery (failed|subsystem))/i.test(m.subject)) {
    const addresses = Array.from(new Set(((m.subject + " " + m.preview).match(EMAIL_IN_TEXT) ?? []).map((a) => a.toLowerCase()).filter((a) => a !== own && !BOUNCE_FROM_RE.test(a))));
    return { kind: "bounce", addresses };
  }
  if (AUTO_RE.test(m.subject.trim())) return { kind: "auto" };
  // Only what the person wrote at the top counts, not the quoted copy of our own email below it.
  const top = (m.preview || "").split(/\bOn .{5,60} wrote:|^>|-----Original/m)[0];
  if (STOP_RE.test(m.subject) || STOP_RE.test(top)) return { kind: "stop" };
  return { kind: "reply" };
}

export function footer(address: string, unsubUrl: string): string {
  return `\n\n--\n${address}\nIf you would rather not hear from me, reply "no thanks" or unsubscribe here: ${unsubUrl}`;
}

export function listUnsubscribeHeaders(unsubApiUrl: string, replyTo: string): string[] {
  return [`List-Unsubscribe: <${unsubApiUrl}>, <mailto:${replyTo}?subject=unsubscribe>`, "List-Unsubscribe-Post: List-Unsubscribe=One-Click"];
}

export function varsFor(card: { name: string; notes: string | null; link_code: string | null }, nextSession: string): Record<string, string> {
  const company = (card.notes ?? "").split(" · ")[0]?.trim() ?? "";
  return {
    first_name: firstNameOf(card.name),
    company,
    at_company: company ? ` at ${company}` : "",
    personal_link: card.link_code ? `https://lccommandsuite.com/m/${card.link_code}` : "https://lccommandsuite.com/masterclass-signup",
    next_session_date: nextSession,
    booking_link: BOOKING_LINK,
  };
}
