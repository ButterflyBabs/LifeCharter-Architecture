// The sales-reference call notes: what the script asks, and how the answers land on the
// prospect's contact card (a timeline note, custom fields, tags). Shared by the page and
// the save route so the labels on the card always match the form.

export const SALES_OUTCOMES = [
  { key: "closed", label: "Moving forward / checkout sent", tag: "sales-outcome-closed" },
  { key: "follow-up", label: "Wants to think, follow up", tag: "sales-outcome-follow-up" },
  { key: "not-now", label: "Not right now", tag: "sales-outcome-not-now" },
  { key: "not-a-fit", label: "Not a fit", tag: "sales-outcome-not-a-fit" },
] as const;
export type SalesOutcomeKey = (typeof SALES_OUTCOMES)[number]["key"];

export const SALES_TIERS = ["Starter", "Growth", "VIP"] as const;

// Every free-text answer: key, the label it carries on the card, and the custom field (if any)
// it is also kept in, so it can be searched, sorted and exported from Contacts.
export const SALES_NOTE_FIELDS: { key: string; label: string; custom?: string }[] = [
  { key: "stuck", label: "What stuck from the MasterClass" },
  { key: "typical", label: "A normal Tuesday: where the time goes" },
  { key: "putOff", label: "What they keep putting off" },
  { key: "tools", label: "Tools and logins today", custom: "sales_tools" },
  { key: "fellThrough", label: "What fell through the cracks" },
  { key: "yearOut", label: "A year from now if nothing changes" },
  { key: "pain", label: "Their pain, in their own words", custom: "sales_pain" },
  { key: "objectionNotes", label: "Objections and what you said" },
  { key: "nextStep", label: "Agreed next step", custom: "sales_next_step" },
  { key: "extra", label: "Anything else" },
];

export const SALES_CUSTOM_FIELDS: { key: string; label: string; type: "text" | "long_text" | "date" | "select"; options?: string[] }[] = [
  { key: "sales_call_date", label: "Sales call date", type: "date" },
  { key: "sales_call_by", label: "Sales call by", type: "text" },
  { key: "sales_outcome", label: "Sales call outcome", type: "select", options: SALES_OUTCOMES.map((o) => o.label) },
  { key: "sales_tier_fit", label: "Tier that fits", type: "select", options: [...SALES_TIERS] },
  { key: "sales_pain", label: "Their pain", type: "long_text" },
  { key: "sales_tools", label: "Tools they use today", type: "long_text" },
  { key: "sales_objections", label: "Objections raised", type: "long_text" },
  { key: "sales_next_step", label: "Sales next step", type: "text" },
  { key: "sales_follow_up_on", label: "Sales follow-up date", type: "date" },
];
