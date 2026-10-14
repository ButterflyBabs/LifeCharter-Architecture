// Turns text pasted from a spreadsheet, a group's member list or a notes file into people to add to an Outreach
// Pipeline. One person per line. Accepts, in any mix:
//   Jane Doe
//   Jane Doe https://facebook.com/jane.doe
//   Jane Doe, https://facebook.com/jane.doe, Founder at Acme
//   Jane Doe<TAB>https://facebook.com/jane.doe<TAB>Founder at Acme<TAB>Collective group
// A header row (Name, Profile link, Headline, Group) is skipped. Pure, shared by the page and the API.

export interface ListRow {
  name: string;
  profileUrl: string | null;
  notes: string | null;
}

const URL_RE = /(https?:\/\/[^\s,;|\t"']+)/i;
const HEADER_RE = /^\s*"?name"?\s*[\t,|;]/i;

function cleanName(s: string) {
  return s.replace(/^[\s"'\-–—•*\d.)]+/, "").replace(/[\s,;|:"'\-–—]+$/, "").replace(/\s+/g, " ").trim();
}

export function parseList(text: string, max = 200): { rows: ListRow[]; skipped: string[] } {
  const rows: ListRow[] = [];
  const skipped: string[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || HEADER_RE.test(line)) continue;
    if (rows.length >= max) {
      skipped.push(line.slice(0, 60));
      continue;
    }
    let name = "";
    let url: string | null = null;
    let notes: string | null = null;
    if (line.includes("\t")) {
      const c = line.split("\t").map((x) => x.trim());
      name = cleanName(c[0] || "");
      const u = c.find((x) => URL_RE.test(x));
      url = u ? (u.match(URL_RE) as RegExpMatchArray)[1] : null;
      const rest = c.slice(1).filter((x) => x && x !== u);
      notes = rest.join(" · ") || null;
    } else {
      const m = line.match(URL_RE);
      if (m) {
        url = m[1];
        const before = line.slice(0, m.index);
        const after = line.slice((m.index ?? 0) + m[1].length);
        name = cleanName(before.split(/[,|;]/)[0]);
        notes = after.replace(/^[\s,;|\-–—]+/, "").trim() || (before.includes(",") ? before.split(",").slice(1).join(",").trim() : "") || null;
      } else if (line.includes("|")) {
        const c = line.split("|").map((x) => x.trim());
        name = cleanName(c[0]);
        notes = c.slice(1).filter(Boolean).join(" · ") || null;
      } else if (line.includes(",")) {
        const c = line.split(",").map((x) => x.trim());
        name = cleanName(c[0]);
        notes = c.slice(1).filter(Boolean).join(", ") || null;
      } else {
        name = cleanName(line);
      }
    }
    if (!name || name.length < 2 || /^(https?:)/i.test(name)) {
      skipped.push(line.slice(0, 60));
      continue;
    }
    rows.push({ name: name.slice(0, 120), profileUrl: url ? url.slice(0, 500) : null, notes: notes ? notes.slice(0, 300) : null });
  }
  return { rows, skipped };
}

// The spreadsheet template people can download: the headers the Audience Qualifier and the paste box both read.
export const LIST_TEMPLATE_CSV =
  "Name,Profile link,Headline,Group\r\n" +
  "Jane Example,https://www.facebook.com/jane.example,Founder at Example Studio (the line under her name),LifeCharter Collective\r\n";
