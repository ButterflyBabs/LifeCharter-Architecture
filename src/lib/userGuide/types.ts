// One entry in the Client User Guide. Every entry fills the same parts, in the same order on the page.
export const GUIDE_AREAS = [
  "Getting Started",
  "Daily Operations",
  "Clients & Sales",
  "Marketing",
  "Client Delivery",
  "Money",
  "Alignment & Systems",
  "Settings",
  "Help and everywhere",
] as const;
export type GuideArea = (typeof GUIDE_AREAS)[number];

// Exactly one of these three on every entry.
export type GuideAi = "AI-powered" | "Has an AI button" | "No AI";

export interface GuideSection {
  id: string;
  title: string;
  body: string;
  keywords: string[]; // its own search words, so a search lands on this part of the entry
}

export interface GuideEntry {
  id: string;
  name: string;
  area: GuideArea;
  where: string;
  href: string;
  what: string;
  ai: GuideAi;
  aiNote: string;
  steps: string[];
  health: string; // tied only to the 12 dimensions, 8 pillars, scores and plans
  tips: string[];
  questions: { q: string; a: string }[];
  related: string[]; // entry ids
  who: string;
  keywords: string[];
  sections?: GuideSection[];
  starter?: boolean; // on the starter list a new account sees
}
