// The assistant sometimes tells a client it has "submitted" or "sent" something when it only prepared a card that
// still waits for their Approve button. Typing "I approve" in the chat does not run anything.
const DONE_CLAIM = /\b(i['’]?ve|i have|it has been|it['’]?s been|has been|have been|i)\s+(submitted|sent|filed|saved|created|scheduled)\b/i;

export const claimsDone = (reply: string): boolean => DONE_CLAIM.test(reply);

export const NOT_YET_SENT = (name: string): string =>
  `Nothing has been sent yet. Typing "I approve" in the chat does not send it: press the Approve button on the card that is waiting for you. — ${name}`;
