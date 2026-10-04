// The one scale a client needs to learn: four phases on a 0-100 score. Used for the overall
// Business Health score, every one of the 12 domains, and the Quick Pulse result.
export type Phase = "Survival" | "Growth" | "Expansion" | "Legacy";

export function phaseFor(score: number): Phase {
  if (score <= 40) return "Survival";
  if (score <= 60) return "Growth";
  if (score <= 80) return "Expansion";
  return "Legacy";
}

export const PHASE_COLOR: Record<Phase, string> = {
  Survival: "#D83A34",
  Growth: "#c9a227",
  Expansion: "#2E7C83",
  Legacy: "#2f8f5b",
};
