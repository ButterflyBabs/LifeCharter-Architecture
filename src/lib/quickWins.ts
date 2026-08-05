// Quick Wins — 10 small, high-leverage actions seeded for every client on first
// load. After seeding they're stored rows the client can edit, reorder, delete,
// or add to (manually or via AI). Clicking one still creates a real task.
export interface QuickWinSeed {
  title: string;
  detail: string;
  emoji: string;
  priority: "high" | "medium" | "low";
}

export const QUICK_WIN_DEFAULTS: QuickWinSeed[] = [
  { title: "Send a testimonial request to your best client", detail: "One warm ask can become your next case study.", emoji: "💬", priority: "high" },
  { title: "Share a recent client win on social media", detail: "5-minute post — proof beats promises.", emoji: "📱", priority: "medium" },
  { title: "Reconnect with a past client who went quiet", detail: "A simple 'thinking of you' reopens doors.", emoji: "🤝", priority: "high" },
  { title: "Review your Domain Scores", detail: "2-minute check-in on where to focus.", emoji: "✅", priority: "low" },
  { title: "Follow up on your oldest open proposal", detail: "The deal you forgot is the one they're waiting on.", emoji: "📨", priority: "high" },
  { title: "Ask one happy client for a referral", detail: "Warm intros close faster than cold outreach.", emoji: "🌱", priority: "high" },
  { title: "Update one outdated page on your website", detail: "Fix the first thing prospects see.", emoji: "🖥️", priority: "medium" },
  { title: "Batch-schedule this week's social posts", detail: "Set it once, stay visible all week.", emoji: "📅", priority: "medium" },
  { title: "Send a thank-you note to a referral partner", detail: "Gratitude keeps the pipeline warm.", emoji: "💌", priority: "medium" },
  { title: "Block 30 minutes for your highest-value task", detail: "Protect the work that actually moves revenue.", emoji: "⏳", priority: "high" },
];
