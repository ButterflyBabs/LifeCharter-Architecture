import { parseCsv } from "@/lib/dmEmailList";

// A consultant's lead list (CSV or pasted from a sheet): headers can be worded many ways, in any order.
export const LEAD_COLUMNS = ["Name", "Business", "Email", "Phone", "LinkedIn", "Facebook", "Instagram", "Notes"];
export const LEADS_TEMPLATE_CSV = `${LEAD_COLUMNS.join(",")}\nDana Lee,Lee Coaching,dana@example.com,303-555-0100,linkedin.com/in/danalee,,@danalee,Met at the summit\n`;

const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");
const MATCH: Record<string, string[]> = {
  name: ["name", "fullname", "contact", "contactname", "prospect"],
  first: ["firstname", "first"],
  last: ["lastname", "last", "surname"],
  businessName: ["business", "businessname", "company", "companyname", "organization", "organisation"],
  email: ["email", "emailaddress", "mail"],
  phone: ["phone", "phonenumber", "mobile", "cell", "telephone"],
  linkedin: ["linkedin", "linkedinurl", "linkedinhandle"],
  facebook: ["facebook", "facebookurl", "facebookhandle", "fb"],
  instagram: ["instagram", "instagramhandle", "ig", "insta"],
  notes: ["notes", "note", "comments", "comment"],
};

export function mapLeads(table: string[][], max = 500): { rows: Record<string, string>[]; unreadable: boolean } {
  if (table.length < 2) return { rows: [], unreadable: true };
  const head = table[0].map(norm);
  const col = (key: string) => head.findIndex((h) => MATCH[key].includes(h));
  const idx = Object.fromEntries(Object.keys(MATCH).map((k) => [k, col(k)]));
  if (idx.name < 0 && idx.first < 0 && idx.email < 0) return { rows: [], unreadable: true };
  const rows = table.slice(1, max + 1).map((r) => {
    const get = (k: string) => (idx[k] >= 0 ? (r[idx[k]] ?? "").trim() : "");
    const name = get("name") || [get("first"), get("last")].filter(Boolean).join(" ") || get("email");
    return { name, businessName: get("businessName"), email: get("email"), phone: get("phone"), linkedin: get("linkedin"), facebook: get("facebook"), instagram: get("instagram"), notes: get("notes") };
  });
  return { rows: rows.filter((r) => r.name || r.email), unreadable: false };
}
export const readLeadsCsv = (text: string) => mapLeads(parseCsv(text));
