// Keeps the LCCS Academy current with the app. Each lesson names what it was written from (User Guide entries, repo
// files). stamps.json holds a fingerprint of those sources from the last time the lesson was checked, and npm test
// fails when a source moves on without the lesson. Used by tests/academy.test.ts and scripts/academy-stamp.ts.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { Lesson } from "./types";
import type { GuideEntry } from "../userGuide/types";

export type Stamps = Record<string, { hash: string; reviewed: string }>;

export function sourceHash(lesson: Lesson, guide: GuideEntry[], root: string): string {
  const h = crypto.createHash("sha1");
  for (const id of [...lesson.sources].sort()) h.update(JSON.stringify(guide.find((e) => e.id === id) ?? null));
  for (const f of [...(lesson.files ?? [])].sort()) h.update(fs.readFileSync(path.join(root, f), "utf8"));
  return h.digest("hex").slice(0, 16);
}

/** Lessons whose sources changed since they were last checked. */
export const staleLessons = (lessons: Lesson[], guide: GuideEntry[], stamps: Stamps, root: string) =>
  lessons.filter((l) => stamps[l.id]?.hash !== sourceHash(l, guide, root));

/** User Guide entries no lesson teaches and no one has listed as still to write. */
export function uncoveredEntries(lessons: Lesson[], guide: GuideEntry[], planned: string[]): string[] {
  const covered = new Set(lessons.flatMap((l) => l.sources));
  return guide.filter((e) => !covered.has(e.id) && !planned.includes(e.id)).map((e) => e.id);
}
