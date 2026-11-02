// Keeps the LCCS Academy honest after an app change.
//   npm run academy:check                    list the lessons whose sources changed, and any new User Guide entry
//   npm run academy:stamp -- <lesson ids>    record that these lessons were reviewed and match the app
// Stamp a lesson only after reading it against what changed and fixing its text and questions.
import fs from "node:fs";
import path from "node:path";
import { ACADEMY_LESSONS } from "../src/content/academy/index";
import { NOT_YET_IN_A_LESSON } from "../src/content/academy/coverage";
import { GUIDE_ENTRIES } from "../src/lib/userGuide/entries";
import { sourceHash, staleLessons, uncoveredEntries, type Stamps } from "../src/lib/academy/freshness";

const root = process.cwd();
const file = path.join(root, "src/content/academy/stamps.json");
const stamps: Stamps = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : {};
const args = process.argv.slice(2);

if (args[0] === "--check") {
  const stale = staleLessons(ACADEMY_LESSONS, GUIDE_ENTRIES, stamps, root);
  const missing = uncoveredEntries(ACADEMY_LESSONS, GUIDE_ENTRIES, NOT_YET_IN_A_LESSON);
  for (const l of stale) console.log(`Review ${l.id}: ${l.title} (written from ${[...l.sources, ...(l.files ?? [])].join(", ")})`);
  for (const id of missing) console.log(`New feature with no lesson: ${id}. Add it to a lesson, or to coverage.ts if a later level will teach it.`);
  if (stale.length || missing.length) process.exit(1);
  console.log("The Academy matches the app.");
} else {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Denver" }).format(new Date());
  if (!args.length) {
    console.error("Name the lessons you reviewed: npm run academy:stamp -- <lesson ids>");
    process.exit(1);
  }
  for (const id of args) {
    const lesson = ACADEMY_LESSONS.find((l) => l.id === id);
    if (!lesson) throw new Error(`No lesson called ${id}`);
    stamps[id] = { hash: sourceHash(lesson, GUIDE_ENTRIES, root), reviewed: today };
  }
  fs.writeFileSync(file, `${JSON.stringify(stamps, null, 2)}\n`);
  console.log(`Stamped ${args.join(", ")}.`);
}
