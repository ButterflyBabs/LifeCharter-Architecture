// Client-safe PostStream constants (no server imports) — importable from both
// "use client" pages and the server-only postStream.ts client.
export const PLATFORMS = [
  "instagram",
  "youtube",
  "tiktok",
  "x",
  "bluesky",
  "linkedin",
  "facebook",
  "threads",
  "reddit",
  "pinterest",
] as const;
export type Platform = (typeof PLATFORMS)[number];

export const PLATFORM_LABELS: Record<string, string> = {
  instagram: "Instagram",
  youtube: "YouTube",
  tiktok: "TikTok",
  x: "X",
  bluesky: "Bluesky",
  linkedin: "LinkedIn",
  facebook: "Facebook",
  threads: "Threads",
  reddit: "Reddit",
  pinterest: "Pinterest",
};
