// Quick Wins that do the work: six of the starting Quick Wins send a ready-made, personal email. The client picks the
// person, edits the words if they like, and sends. Bracketed [parts] are for the client to fill in and block sending until
// they are. A Quick Win is matched by its title, so one the client has reworded simply becomes a plain to-do again.

export type QuickWinKind = "testimonial" | "share_win" | "reconnect" | "proposal" | "referral" | "thank_you";

export interface QuickWinEmail {
  kind: QuickWinKind;
  title: string; // the starting Quick Win this belongs to
  who: string; // the person to pick, in plain words
  subject: string;
  body: string;
}

export const QUICK_WIN_EMAILS: QuickWinEmail[] = [
  {
    kind: "testimonial",
    title: "Send a testimonial request to your best client",
    who: "your best client",
    subject: "A small favor, {{first_name}}?",
    body:
      "Hi {{first_name}},\n\nWorking with you has been one of the highlights of my year, and I'm so glad about [the result they achieved].\n\n" +
      "Would you be willing to share a few sentences about your experience working with me? Even two or three lines about [what changed for them] would mean a lot, and it helps the next person decide whether I'm the right fit.\n\n" +
      "You can simply reply to this email with your thoughts and I'll take it from there. If you'd rather, tell me and I'll draft something for you to edit.\n\nThank you for trusting me,\n{{my_name}}",
  },
  {
    kind: "share_win",
    title: "Share a recent client win on social media",
    who: "the client whose win you want to share",
    subject: "Congratulations, {{first_name}}! May I share your win?",
    body:
      "Hi {{first_name}},\n\nI've been thinking about [their recent win], and I'm so proud of you for it. You did the work.\n\n" +
      "With your permission, I'd love to share it on social media so others can see what's possible. I can use your name, or keep it anonymous, whichever you prefer.\n\n" +
      "Just reply with a yes (and how you'd like to be named), and tell me if there's anything you'd like me to leave out.\n\nCelebrating you,\n{{my_name}}",
  },
  {
    kind: "reconnect",
    title: "Reconnect with a past client who went quiet",
    who: "a past client who went quiet",
    subject: "Thinking of you, {{first_name}}",
    body:
      "Hi {{first_name}},\n\nYou crossed my mind today, and I wanted to reach out. How are things going with [something they were working on]?\n\n" +
      "No agenda here. I'd simply love to hear how you're doing and what's on your plate right now. If there's anything I can help with, or if now is a good time to pick things back up, I'm happy to talk.\n\nWarmly,\n{{my_name}}",
  },
  {
    kind: "proposal",
    title: "Follow up on your oldest open proposal",
    who: "the person who has your oldest open proposal",
    subject: "Following up, {{first_name}}",
    body:
      "Hi {{first_name}},\n\nI wanted to check in on the proposal I sent for [the project or offer]. I know things get busy, so no pressure at all.\n\n" +
      "Do you have any questions I can answer, or anything you'd like me to adjust? If now isn't the right time, tell me and I'll check back with you whenever suits.\n\nIf you're ready, the next step is [the next step], and I'm glad to walk you through it.\n\nBest,\n{{my_name}}",
  },
  {
    kind: "referral",
    title: "Ask one happy client for a referral",
    who: "a happy client",
    subject: "Do you know someone I could help, {{first_name}}?",
    body:
      "Hi {{first_name}},\n\nI'm so glad our work together has made a difference for [what changed for them]. Thank you for being part of my work.\n\n" +
      "Is there one person in your world who is facing something similar, and who might welcome a conversation? An introduction by email is all it takes, and I'll take it from there with care.\n\n" +
      "The right fit for me is [who you help best]. And if no one comes to mind right now, that's completely fine.\n\nGratefully,\n{{my_name}}",
  },
  {
    kind: "thank_you",
    title: "Send a thank-you note to a referral partner",
    who: "your referral partner",
    subject: "Thank you, {{first_name}}",
    body:
      "Hi {{first_name}},\n\nI wanted to say thank you for [the introduction or referral you sent my way]. It means more than I can say, and it matters that you trusted me with someone you care about.\n\n" +
      "I'll keep you posted on how it goes, and please tell me if there's ever a way I can return the kindness.\n\nWith appreciation,\n{{my_name}}",
  },
];

const norm = (t: string) => t.trim().toLowerCase().replace(/\s+/g, " ");
const BY_TITLE = new Map(QUICK_WIN_EMAILS.map((e) => [norm(e.title), e]));
export const quickWinEmailFor = (title: string): QuickWinEmail | null => BY_TITLE.get(norm(title)) ?? null;

export const fillQuickWinText = (t: string, v: { first_name: string; my_name: string }) =>
  t.replace(/\{\{\s*first_name\s*\}\}/g, v.first_name || "there").replace(/\{\{\s*my_name\s*\}\}/g, v.my_name || "");

// Anything still in [square brackets] has not been filled in yet.
export const unfilledParts = (t: string): string[] => Array.from(t.matchAll(/\[([^\]\n]{2,120})\]/g)).map((m) => m[1]);
