// Categories and channels for Scripts & Templates. The shared starter library
// lives in scriptLibrary.ts; each client's own saved items are rows in
// scripts_templates, scoped to their plan.

export const SCRIPT_CATEGORIES = [
  "Sales",
  "Prospecting",
  "Objections",
  "Onboarding",
  "Follow-up",
  "Content",
  "Nurture",
  "Closing",
  "Training",
];

export const SCRIPT_CHANNELS = [
  { id: "sales", label: "Sales Calls" },
  { id: "email", label: "Emails" },
  { id: "dm", label: "DMs" },
  { id: "objection", label: "Objections" },
  { id: "social", label: "Social" },
];

// Where a script or template is used. Codes are stored; labels are shown.
export const SCRIPT_PLATFORMS = [
  { id: "IG", label: "Instagram" },
  { id: "FB", label: "Facebook" },
  { id: "LI", label: "LinkedIn" },
  { id: "YT", label: "YouTube" },
  { id: "Spotify", label: "Spotify" },
  { id: "Email", label: "Email" },
  { id: "DM", label: "DM" },
  { id: "TXT", label: "Text" },
];
export const PLATFORM_IDS = SCRIPT_PLATFORMS.map((p) => p.id);

// A starter-library item's platforms, from its channel.
export function platformsForChannel(channel: string): string[] {
  if (channel === "email") return ["Email"];
  if (channel === "dm") return ["DM"];
  if (channel === "social") return ["IG", "FB", "LI"];
  return [];
}
