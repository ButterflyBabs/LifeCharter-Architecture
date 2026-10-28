// Babs is copied on every email that goes to or comes from Marcello (and from any Call to Close consultant, whose address is added here when they are set up) through the Suite (her rule, 2026-10-27).
// A hidden copy (bcc) goes out with the message, and replies are addressed to the sender AND Babs so she sees the answers too.
export const BABS_COPY = "amilynne@amilynnecarroll.com";
export const COPIED_PEOPLE = ["marcello@amilynnecarroll.com"];

export function involvesCopied(...addrs: (string | string[] | null | undefined)[]): boolean {
  return addrs.flat().some((a) => typeof a === "string" && COPIED_PEOPLE.some((p) => a.toLowerCase().includes(p)));
}

/** reply_to as Resend wants it: one address, or a list when Babs is added alongside. */
export function replyWithBabs(replyTo: string | undefined, active: boolean): string | string[] | undefined {
  if (!replyTo || !active) return replyTo;
  const list = replyTo.split(",").map((x) => x.trim()).filter(Boolean);
  if (!list.some((x) => x.toLowerCase() === BABS_COPY)) list.push(BABS_COPY);
  return list;
}
