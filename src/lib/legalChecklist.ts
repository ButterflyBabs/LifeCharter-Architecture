// The Legal & Compliance checklist: the standing items most small businesses
// need, grouped by area. A general guide, not legal advice. Each client marks
// their own status, renewal date and where the document lives; they can mark an
// item "doesn't apply" and add their own items. Browser-safe.

export interface LegalItem {
  key: string;
  group: string;
  title: string;
  help: string;
  renews?: boolean; // has a renewal / due date worth tracking
}

export const LEGAL_GROUPS = [
  "Structure & registration",
  "Contracts",
  "Insurance",
  "Licenses & permits",
  "Tax & filings",
  "Website & privacy",
  "Intellectual property",
  "Team & records",
] as const;

export const LEGAL_ITEMS: LegalItem[] = [
  { key: "entity", group: "Structure & registration", title: "Business entity formed (LLC, S-corp, etc.)", help: "Keeps business and personal liability separate." },
  { key: "ein", group: "Structure & registration", title: "EIN (federal tax ID) obtained", help: "Needed for a business bank account, payroll and most filings." },
  { key: "operating-agreement", group: "Structure & registration", title: "Operating agreement or bylaws signed", help: "Sets out ownership and how decisions are made, even for a one-person LLC." },
  { key: "annual-report", group: "Structure & registration", title: "State annual report filed", help: "Most states require it yearly to keep the entity in good standing.", renews: true },
  { key: "registered-agent", group: "Structure & registration", title: "Registered agent in place", help: "Receives legal notices for the business." },
  { key: "business-bank", group: "Structure & registration", title: "Separate business bank account", help: "Protects the entity and keeps the books clean." },
  { key: "client-agreement", group: "Contracts", title: "Client agreement / terms of service", help: "Scope, payment, cancellation and refund terms for every client." },
  { key: "contractor-agreements", group: "Contracts", title: "Contractor agreements (with IP assignment)", help: "Anyone you pay should sign one; it confirms you own what they make." },
  { key: "nda", group: "Contracts", title: "NDA template ready", help: "For partners or contractors who see confidential work." },
  { key: "affiliate-terms", group: "Contracts", title: "Affiliate / referral terms (if you pay referrals)", help: "How and when referral fees are earned and paid." },
  { key: "general-liability", group: "Insurance", title: "General liability insurance", help: "Covers claims of injury or property damage.", renews: true },
  { key: "professional-liability", group: "Insurance", title: "Professional liability (E&O) insurance", help: "Covers claims about your advice or services.", renews: true },
  { key: "cyber", group: "Insurance", title: "Cyber / data-breach coverage", help: "Worth having if you store client data or take payments online.", renews: true },
  { key: "business-license", group: "Licenses & permits", title: "Local business license", help: "City or county license where you operate.", renews: true },
  { key: "professional-license", group: "Licenses & permits", title: "Professional licenses / certifications current", help: "Any license your field requires.", renews: true },
  { key: "sales-tax", group: "Licenses & permits", title: "Sales tax permit (if you sell taxable goods or digital products)", help: "Depends on your state and what you sell.", renews: true },
  { key: "estimated-tax", group: "Tax & filings", title: "Quarterly estimated taxes scheduled", help: "Apr 15, Jun 15, Sep 15 and Jan 15 in the US. Add them to your Bills calendar.", renews: true },
  { key: "boi", group: "Tax & filings", title: "Beneficial ownership (BOI) report checked", help: "Confirm whether the current federal rules require a filing for your entity." },
  { key: "1099s", group: "Tax & filings", title: "1099s issued to contractors", help: "Due each January for contractors you paid $600+.", renews: true },
  { key: "bookkeeping", group: "Tax & filings", title: "Books kept monthly and reconciled", help: "Your Finance Center ledger counts." },
  { key: "privacy-policy", group: "Website & privacy", title: "Privacy policy on your website", help: "Required once you collect emails or use tracking." },
  { key: "terms-of-use", group: "Website & privacy", title: "Website terms of use", help: "Limits liability for your site and content." },
  { key: "disclaimers", group: "Website & privacy", title: "Disclaimers (results, earnings, medical/financial)", help: "Especially important for coaching and advice businesses." },
  { key: "email-consent", group: "Website & privacy", title: "Email marketing consent & unsubscribe", help: "CAN-SPAM/GDPR basics: permission, a real address, easy opt-out." },
  { key: "cookie-notice", group: "Website & privacy", title: "Cookie / tracking notice (if you run ads or analytics)", help: "Needed for visitors from some states and countries." },
  { key: "trademark", group: "Intellectual property", title: "Business name / logo trademark search or filing", help: "Protects your brand name from being claimed by someone else." },
  { key: "domain", group: "Intellectual property", title: "Domains owned by the business and set to auto-renew", help: "Losing a domain can take your site and email down.", renews: true },
  { key: "content-ownership", group: "Intellectual property", title: "Content and course materials marked ©", help: "And kept where you can prove when you made them." },
  { key: "worker-classification", group: "Team & records", title: "Workers classified correctly (employee vs contractor)", help: "Misclassification is one of the costliest small-business mistakes." },
  { key: "records", group: "Team & records", title: "Key documents stored in one safe place", help: "Formation papers, contracts, policies, insurance and licenses." },
  { key: "succession", group: "Team & records", title: "Access & succession plan", help: "Who can run things (passwords, accounts, bank) if you're unavailable." },
];

export type LegalStatus = "not_started" | "in_progress" | "done" | "na";

export interface LegalState {
  item_key: string;
  status: LegalStatus;
  due_date: string | null;
  notes: string | null;
  doc_link: string | null;
  custom_title: string | null;
  custom_group: string | null;
}

// Share of applicable items that are done (null when nothing's been touched).
export function legalCompletion(states: LegalState[]): number | null {
  if (!states.length) return null;
  const byKey = new Map(states.map((s) => [s.item_key, s]));
  const keys = [...LEGAL_ITEMS.map((i) => i.key), ...states.filter((s) => s.item_key.startsWith("custom:")).map((s) => s.item_key)];
  let applicable = 0;
  let done = 0;
  for (const k of keys) {
    const st = byKey.get(k)?.status ?? "not_started";
    if (st === "na") continue;
    applicable++;
    if (st === "done") done++;
    else if (st === "in_progress") done += 0.5;
  }
  return applicable ? Math.round((done / applicable) * 100) : null;
}
