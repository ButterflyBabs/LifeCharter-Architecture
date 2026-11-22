// Alignment Architect > Audit Results: every Mini Command Audit and Business Health Check a lead has finished, with the
// person's name and contact details. Pure (no database here), so the mapping and the CSV can be tested.

export type ResultKind = "mini" | "health";
export type Detail = { label: string; value: string };
export type ResultRow = {
  id: string;
  kind: ResultKind;
  createdAt: string;
  name: string;
  email: string;
  phone: string;
  business: string;
  /** One line: the score or the places to start. */
  headline: string;
  /** The lowest areas, as names. */
  lowest: string[];
  source: string;
  emailStatus: string;
  contactId: string | null;
  /** The full breakdown, shown when the row is opened. */
  details: Detail[];
};

type MiniRun = { id: string; first_name: string; email: string; profile: Record<string, string> | null; result: { depth?: string; start?: { name: string }[]; phases?: { name: string; build: number | null; health: number | null; band: string | null }[] } | null; attribution: Record<string, string> | null; email_status: string | null; contact_id: string | null; created_at: string };
type HealthRun = { id: string; first_name: string; email: string; phone: string | null; business_name: string | null; result: { overall?: number; grade?: { grade: string; label: string }; categories?: { name: string; pct: number; tier: { label: string } }[]; gaps?: { name: string; pct: number }[] } | null; attribution: Record<string, string> | null; email_status: string | null; contact_id: string | null; created_at: string };
export type ContactBits = { phone: string | null; company: string | null };

const utmSource = (a: Record<string, string> | null) => {
  if (!a) return "";
  return [a.utm_source, a.utm_medium, a.utm_campaign].filter(Boolean).join(" / ");
};

export function miniRow(r: MiniRun, contact?: ContactBits | null): ResultRow {
  const start = (r.result?.start ?? []).map((p) => p.name);
  const profile = r.profile ?? {};
  const details: Detail[] = [
    { label: "Where the business is", value: profile.stage || "—" },
    { label: "Yearly revenue", value: profile.revenue || "—" },
    { label: "Who works in it", value: profile.team || "—" },
    { label: "Questions answered", value: r.result?.depth === "full" ? "All 48" : "The first 24" },
    ...(r.result?.phases ?? []).map((p) => ({ label: p.name, value: `Built ${p.build == null ? "n/a" : `${p.build}%`} · Working ${p.band ?? "n/a"}` })),
  ];
  return {
    id: `mini-${r.id}`,
    kind: "mini",
    createdAt: r.created_at,
    name: r.first_name,
    email: r.email,
    phone: contact?.phone ?? "",
    business: contact?.company ?? "",
    headline: start.length ? `Start with ${start.join(" and ")}` : "Too few answers to rank the areas",
    lowest: start,
    source: utmSource(r.attribution),
    emailStatus: r.email_status ?? "",
    contactId: r.contact_id,
    details,
  };
}

export function healthRow(r: HealthRun): ResultRow {
  const res = r.result ?? {};
  const gaps = (res.gaps ?? []).map((g) => g.name);
  return {
    id: `health-${r.id}`,
    kind: "health",
    createdAt: r.created_at,
    name: r.first_name,
    email: r.email,
    phone: r.phone ?? "",
    business: r.business_name ?? "",
    headline: res.grade ? `${res.overall}% · Grade ${res.grade.grade} (${res.grade.label})` : `${res.overall ?? "?"}%`,
    lowest: gaps,
    source: utmSource(r.attribution),
    emailStatus: r.email_status ?? "",
    contactId: r.contact_id,
    details: (res.categories ?? []).map((c) => ({ label: c.name, value: `${c.pct}% · ${c.tier.label}` })),
  };
}

export const KIND_LABEL: Record<ResultKind, string> = { mini: "Mini Command Audit", health: "Business Health Check" };

/** Newest first. */
export const sortRows = (rows: ResultRow[]) => rows.slice().sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));

// A spreadsheet treats a cell that starts with = + - or @ as a formula, and a lead typed these cells, so neutralize them.
const cell = (v: string) => {
  const safe = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
  return `"${safe.replace(/"/g, '""')}"`;
};

export function toCsv(rows: ResultRow[]): string {
  const head = ["Date", "Audit", "Name", "Email", "Phone", "Business", "Result", "Lowest areas", "Source", "Details"];
  const lines = rows.map((r) =>
    [r.createdAt, KIND_LABEL[r.kind], r.name, r.email, r.phone, r.business, r.headline, r.lowest.join("; "), r.source, r.details.map((d) => `${d.label}: ${d.value}`).join(" | ")].map(cell).join(","),
  );
  return [head.map(cell).join(","), ...lines].join("\r\n");
}
