import { EMAIL_RE } from "@/lib/crm";

// Lead forms (Meta lead ads, LinkedIn Lead Gen Forms) arrive through Make or Zapier as JSON or a plain form. This turns whatever
// came into one shape, and says where it came from, without touching the database (so it can be tested on its own).

export type LeadSource = "meta" | "linkedin";

export interface LeadSourceConfig {
  source: LeadSource;
  label: string; // "Meta lead ad", "LinkedIn lead form"
  tag: string; // lead-meta-ad, lead-linkedin-form
  perFormTag: (formOrAd: string) => string | null;
  contactSource: string;
  platform: "FB" | "LI"; // pipeline card platform
  registersMasterclass: (house: boolean, masterclassFlag: boolean) => boolean;
}

// Exactly the same as slugTag in dmPipeline, so existing Meta ad tags do not change.
export const slug = (s: string, n: number) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, n).replace(/-$/, "");

export const LEAD_SOURCES: Record<LeadSource, LeadSourceConfig> = {
  meta: {
    source: "meta",
    label: "Meta lead ad",
    tag: "lead-meta-ad",
    perFormTag: (ad) => (ad ? `meta-ad-${slug(ad, 40)}` : null),
    contactSource: "meta-lead-ad",
    platform: "FB",
    // Babs's account registers every Meta lead ad person on the MasterClass Zoom meeting.
    registersMasterclass: (house) => house,
  },
  linkedin: {
    source: "linkedin",
    label: "LinkedIn lead form",
    tag: "lead-linkedin-form",
    perFormTag: (form) => (form ? `linkedin-form-${slug(form, 40)}` : null),
    contactSource: "linkedin-lead-form",
    platform: "LI",
    // A LinkedIn form is only for the MasterClass when the Make address says so (?masterclass=1), and only on Babs's account.
    registersMasterclass: (house, flag) => house && flag,
  },
};

const str = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : typeof v === "number" ? String(v) : "");

/** Flat fields, nested objects, or Meta's field_data list, all into lowercase_underscore keys. */
export function flattenLead(b: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  const put = (k: string, v: unknown) => {
    const val = Array.isArray(v) ? v.map((x) => str(x, 200)).filter(Boolean).join(", ") : str(v, 400);
    if (val) out[k.trim().toLowerCase().replace(/[\s-]+/g, "_")] = val;
  };
  for (const [k, v] of Object.entries(b)) {
    if (k === "field_data" && Array.isArray(v)) {
      for (const f of v as { name?: unknown; values?: unknown }[]) if (f && typeof f.name === "string") put(f.name, f.values);
    } else if (v && typeof v === "object" && !Array.isArray(v)) {
      for (const [k2, v2] of Object.entries(v as Record<string, unknown>)) put(k2, v2);
    } else put(k, v);
  }
  return out;
}

const SKIP = new Set(["email", "email_address", "emailaddress", "work_email", "full_name", "name", "first_name", "firstname", "last_name", "lastname", "ad_name", "ad", "ad_id", "form_name", "form", "phone_number"]);

export interface ParsedLead {
  email: string;
  first: string;
  last: string;
  ad: string;
  adId: string;
  form: string;
  phone: string;
  answers: Record<string, string>;
}

export function parseLead(raw: Record<string, unknown>): ParsedLead {
  const f = flattenLead(raw);
  const email = (f.email || f.email_address || f.emailaddress || f.work_email || "").toLowerCase();
  const full = f.full_name || f.name || "";
  const first = f.first_name || f.firstname || full.split(/\s+/)[0] || "";
  const last = f.last_name || f.lastname || (full.includes(" ") ? full.split(/\s+/).slice(1).join(" ") : "");
  return {
    email,
    first,
    last,
    ad: f.ad_name || f.ad || "",
    adId: f.ad_id || "",
    form: f.form_name || f.form || "",
    phone: f.phone_number || f.phone || "",
    answers: Object.fromEntries(Object.entries(f).filter(([k]) => !SKIP.has(k))),
  };
}

export const validLead = (p: ParsedLead): string | null => (!EMAIL_RE.test(p.email) ? "No valid email in the lead." : !p.first ? "No name in the lead." : null);

/** Meta's own "test lead" tool sends dummy addresses; those never go on Zoom or in a pipeline. */
export const isTestLead = (email: string): boolean => /@(meta|fb)\.com$/.test(email) || /^dummy|test@/.test(email);
