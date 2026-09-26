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
];

export const SCRIPT_CHANNELS = [
  { id: "sales", label: "Sales Calls" },
  { id: "email", label: "Emails" },
  { id: "dm", label: "DMs" },
  { id: "objection", label: "Objections" },
  { id: "social", label: "Social" },
];
