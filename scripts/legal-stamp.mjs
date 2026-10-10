#!/usr/bin/env node
// Keeps the "Last updated" date on each legal page honest.
//   node scripts/legal-stamp.mjs          stamp: for each legal page whose text changed since its recorded hash,
//                                         set its "updated" date to today (Mountain time) and refresh the hash.
//   node scripts/legal-stamp.mjs --check  exit 1 (and say which page) if any legal page changed without a stamp.
import fs from "node:fs";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const datesFile = path.join(root, "src/lib/legalDates.ts");
const pageFile = (slug) => path.join(root, "src/app/legal", slug, "page.tsx");
const hashOf = (slug) => crypto.createHash("sha1").update(fs.readFileSync(pageFile(slug), "utf8")).digest("hex").slice(0, 16);
const today = new Intl.DateTimeFormat("en-US", { timeZone: "America/Denver", year: "numeric", month: "long", day: "numeric" }).format(new Date());

let src = fs.readFileSync(datesFile, "utf8");
const slugs = [...src.matchAll(/^\s*"([a-z0-9-]+)":\s*\{/gm)].map((m) => m[1]);
const check = process.argv.includes("--check");
const stale = [];
for (const slug of slugs) {
  const now = hashOf(slug);
  const re = new RegExp(`("${slug}":\\s*\\{[^}]*?hash:\\s*")([0-9a-f]*)(")`);
  const m = src.match(re);
  if (!m) throw new Error(`No entry for ${slug} in legalDates.ts`);
  if (m[2] === now) continue;
  stale.push(slug);
  if (check) continue;
  // A page that has never been stamped (empty hash) keeps its date; a changed page gets today's date.
  src = src.replace(re, `$1${now}$3`);
  if (m[2] !== "") src = src.replace(new RegExp(`("${slug}":\\s*\\{[^}]*?updated:\\s*")([^"]*)(")`), `$1${today}$3`);
}
if (check) {
  if (stale.length) {
    console.error(`These legal pages changed without a new "Last updated" date: ${stale.join(", ")}. Run: npm run legal:stamp`);
    process.exit(1);
  }
  console.log("Legal page dates are current.");
} else {
  fs.writeFileSync(datesFile, src);
  console.log(stale.length ? `Stamped ${stale.join(", ")} (${today}).` : "Nothing changed.");
}
