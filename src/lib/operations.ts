// The 8 operational pillars: a fixed framework. Each pillar is SCORED from the client's data
// (see src/lib/scoring/pillarModel.ts); only notes and "Go deeper" answers are stored per client.
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

// Pillars that are also planned in a strategic plan: link there instead of
// repeating the planning (audit Q1).
export const PILLAR_PLAN_LINK: Record<string, { href: string; plan: string; section: string }> = {
  acquisition: { href: "/marketing-plan", plan: "Marketing Plan", section: "Channels & Cadence" },
  "sales-journey": { href: "/sales", plan: "Sales Plan", section: "Pipeline & Sales Process" },
  referral: { href: "/sales", plan: "Sales Plan", section: "Referral Strategy" },
};
