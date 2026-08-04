// Shared vocabulary for Sales Activities.
export const ACTIVITY_TYPES = [
  { id: "call", label: "Call" },
  { id: "followup", label: "Follow-up" },
  { id: "email", label: "Email" },
  { id: "dm", label: "DM" },
  { id: "meeting", label: "Meeting" },
  { id: "demo", label: "Demo" },
  { id: "proposal", label: "Proposal" },
] as const;

export const ACTIVITY_TYPE_IDS = ACTIVITY_TYPES.map((t) => t.id);

export const OUTCOMES = [
  { id: "", label: "—" },
  { id: "connected", label: "Connected" },
  { id: "no_answer", label: "No answer" },
  { id: "booked", label: "Booked" },
  { id: "won", label: "Won" },
  { id: "lost", label: "Lost" },
  { id: "nurture", label: "Nurture" },
] as const;

export const OUTCOME_IDS = OUTCOMES.map((o) => o.id);

export const PRIORITIES = ["hot", "warm", "cold"] as const;

export function typeLabel(id: string): string {
  return ACTIVITY_TYPES.find((t) => t.id === id)?.label || id;
}
export function outcomeLabel(id: string): string {
  return OUTCOMES.find((o) => o.id === id)?.label || id;
}
