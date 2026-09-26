// Quick Pulse check-in question ids → the dimension label each one measures.
// The check-in page stores answers as { questionId: "1"–"5" }; scoring reads them by label.
export const PULSE_LABEL_BY_ID: Record<string, string> = {
  qpc_brain_01: "Systems Clarity",
  qpc_brain_02: "Decision Making",
  qpc_brain_03: "Team Capacity",
  qpc_brain_04: "Financial Visibility",
  qpc_brain_05: "Marketing Effectiveness",
  qpc_brain_06: "Operational Stress",
  qpc_soul_01: "Mission Connection",
  qpc_soul_02: "Energy Levels",
  qpc_soul_03: "Values Alignment",
  qpc_soul_04: "Inner Peace",
  qpc_soul_05: "Shadow Work",
  qpc_soul_06: "Joy & Fulfillment",
  qpc_profit_01: "Revenue Stability",
  qpc_profit_02: "Sales Confidence",
  qpc_profit_03: "Pricing Power",
  qpc_profit_04: "Client Quality",
  qpc_profit_05: "Growth Trajectory",
  qpc_profit_06: "Overall Health",
};
