import type { AdRow } from "@/lib/metaAdsReport";

// Reads the file downloaded from Ads Manager (Ads tab > Export > Export table data > CSV). The column names change a little
// by account and language, so each field is found by what its header starts with.

function splitRows(text: string): string[][] {
  const first = text.split(/\r?\n/, 1)[0] ?? "";
  const delim = first.includes("\t") ? "\t" : first.split(";").length > first.split(",").length ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') q = false;
      else cell += ch;
    } else if (ch === '"') q = true;
    else if (ch === delim) { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      if (row.some((c) => c.trim())) rows.push(row);
      row = [];
    } else cell += ch;
  }
  row.push(cell);
  if (row.some((c) => c.trim())) rows.push(row);
  return rows;
}

const num = (s: string | undefined): number => {
  if (!s) return 0;
  const n = Number(s.replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

const FIELDS: Record<string, RegExp> = {
  adName: /^ad name$|^ad$/,
  campaign: /^campaign name$|^campaign$/,
  spend: /^amount spent/,
  impressions: /^impressions$/,
  reach: /^reach$/,
  linkClicks: /^link clicks$/,
  leads: /^leads(\b|$)/,
  results: /^results$/,
  resultType: /^result (type|indicator)$/,
  frequency: /^frequency$/,
  delivery: /^(ad )?delivery$/,
  start: /^reporting starts$/,
  end: /^reporting ends$/,
};

const isoDay = (s: string): string | null => {
  const m = s.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  const d = Date.parse(s);
  return Number.isNaN(d) ? null : new Date(d).toISOString().slice(0, 10);
};

export function parseAdsExport(text: string, fallback?: { start: string; end: string }): { rows: AdRow[]; problems: string[] } {
  const all = splitRows(text.replace(/^﻿/, ""));
  if (all.length < 2) return { rows: [], problems: ["I could not find any rows in that file."] };
  const head = all[0].map((h) => h.trim().toLowerCase());
  const col: Record<string, number> = {};
  for (const [k, re] of Object.entries(FIELDS)) {
    const i = head.findIndex((h) => re.test(h));
    if (i >= 0) col[k] = i;
  }
  const problems: string[] = [];
  if (col.adName == null) problems.push("There is no Ad name column. In Ads Manager, open the Ads tab (not Campaigns) and export again.");
  if (col.spend == null) problems.push("There is no Amount spent column. In Ads Manager use Columns > Performance and clicks, then export again.");
  if (col.leads == null && col.results == null) problems.push("There is no Results or Leads column. Use Columns > Performance and clicks, then export again.");
  if (problems.length) return { rows: [], problems };

  const rows: AdRow[] = [];
  for (const r of all.slice(1)) {
    const adName = (r[col.adName] ?? "").trim();
    if (!adName || /^(total|results from)/i.test(adName)) continue;
    const start = col.start != null ? isoDay(r[col.start] ?? "") : null;
    const end = col.end != null ? isoDay(r[col.end] ?? "") : null;
    const periodStart = start ?? fallback?.start;
    const periodEnd = end ?? fallback?.end;
    if (!periodStart || !periodEnd) {
      problems.push("The file has no reporting dates. Choose the start and end date of the period you exported.");
      return { rows: [], problems };
    }
    // "Results" is whatever the campaign was built to get; count it as leads unless the file says it is something else.
    let leads = col.leads != null ? num(r[col.leads]) : num(r[col.results]);
    if (col.leads == null && col.resultType != null) {
      const t = (r[col.resultType] ?? "").toLowerCase();
      if (t && !/lead|form|registration|signup|sign-up|conversion/.test(t)) leads = 0;
    }
    rows.push({
      adName,
      campaign: col.campaign != null ? (r[col.campaign] ?? "").trim() || null : null,
      periodStart,
      periodEnd,
      spend: num(r[col.spend]),
      impressions: Math.round(num(col.impressions != null ? r[col.impressions] : "")),
      reach: col.reach != null && (r[col.reach] ?? "").trim() ? Math.round(num(r[col.reach])) : null,
      linkClicks: Math.round(num(col.linkClicks != null ? r[col.linkClicks] : "")),
      leads: Math.round(leads),
      frequency: col.frequency != null && (r[col.frequency] ?? "").trim() ? num(r[col.frequency]) : null,
      delivery: col.delivery != null ? (r[col.delivery] ?? "").trim() || null : null,
    });
  }
  if (!rows.length) problems.push("I found the columns but no ads in the rows. Export from the Ads tab with the date range you want.");
  return { rows, problems };
}
