// The 8 operational pillars — a fixed framework. Only status/notes are stored
// per client; the catalog (keys, names, descriptions) lives here.
export interface PillarDef {
  key: string;
  name: string;
  description: string;
}

export const OPERATIONS_PILLARS: PillarDef[] = [
  { key: "acquisition", name: "Customer Acquisition", description: "How new clients find and choose you" },
  { key: "sales-journey", name: "Sales Journey", description: "Turning interest into committed clients" },
  { key: "onboarding", name: "Onboarding", description: "Setting new clients up for success" },
  { key: "support", name: "Support / Customer Service", description: "Helping clients when they need it" },
  { key: "communication", name: "Communication", description: "Staying connected across the relationship" },
  { key: "fulfillment", name: "Fulfillment", description: "Delivering your product or service" },
  { key: "internal-culture", name: "Internal Process & Culture", description: "How the team works and grows" },
  { key: "referral", name: "Referral Process", description: "Turning happy clients into advocates" },
];

export const PILLAR_STATUSES = ["not_started", "in_progress", "needs_attention", "complete"] as const;
export type PillarStatus = (typeof PILLAR_STATUSES)[number];

export const STATUS_LABEL: Record<string, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  needs_attention: "Needs attention",
  complete: "Solid",
};
