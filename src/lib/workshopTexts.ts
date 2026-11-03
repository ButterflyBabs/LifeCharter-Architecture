// Text reminders for a live, multi-day workshop on the Events engine: the wording a person agrees to and the text they get each day. Pure.

/** The separate, unchecked agreement shown beside the optional mobile number. Never a condition of signing up. */
export function eventConsentText(brand: string, days: number): string {
  const n = Math.max(1, Math.round(days || 1));
  return `Yes, text me a reminder each day of this ${n === 1 ? "event" : "workshop"} (up to ${n} text${n === 1 ? "" : "s"}) from ${brand}. Msg & data rates may apply. Reply STOP to opt out, HELP for help.`;
}

/** The reminder sent on a day of the event. `time` is the start time in the person's own zone, such as "3:00 PM MST". */
export function eventTextBody(input: { brand: string; title: string; day: number; days: number; time: string; joinUrl: string | null }): string {
  const link = input.joinUrl ? ` Join: ${input.joinUrl}` : "";
  const part = input.days > 1 ? `Day ${input.day} of ${input.days}, ` : "";
  return `${input.brand}: ${input.title}, ${part}starts today at ${input.time}.${link} Reply STOP to opt out.`;
}
