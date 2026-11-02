// LCCS Academy: the shapes shared by the lessons, the API and the pages. No answers ever leave the server: the pages
// only see LessonForLearner.
import type { DimensionKey } from "../scoring/dimensionModel";

export const LEVELS = [
  { key: "foundations", title: "Foundations", blurb: "What the Suite is, how to find your way around it and how to use it every day." },
  { key: "working", title: "Working Knowledge", blurb: "Doing the real work of your role in the Suite, start to finish, on your own." },
  { key: "advanced", title: "Advanced", blurb: "Connecting the parts: how one page feeds another, and how to read what your scores are saying." },
  { key: "expert", title: "Expert", blurb: "Solving unusual situations, teaching someone else and passing the final exam." },
] as const;
export type LevelKey = (typeof LEVELS)[number]["key"];

// core is taken by everyone; each person then takes one of the other three.
export type LessonTrack = "core" | "client" | "team-ops" | "team-sales";
export type LearnerTrack = Exclude<LessonTrack, "core">;
export const TRACK_LABELS: Record<LearnerTrack, string> = {
  client: "Client path",
  "team-ops": "Team path: operations",
  "team-sales": "Team path: sales",
};

export interface LessonSection {
  heading: string;
  text?: string;
  steps?: string[];
  tips?: string[]; // shown as a short list after the steps
  image?: { src: string; alt: string; caption?: string }; // a screenshot in /public/academy, sample data only
}

export interface Question {
  id: string;
  q: string;
  right: string;
  wrong: [string, string, string];
  why: string; // shown after a miss on a lesson quiz
}

export interface Lesson {
  id: string;
  level: LevelKey;
  track: LessonTrack;
  kind: "lesson" | "exam";
  title: string;
  minutes: number;
  summary: string;
  sections: LessonSection[];
  tryIt?: { label: string; href: string; task: string; question: string };
  dimension?: DimensionKey; // the health score this lesson's work counts toward, where one applies
  questions: Question[];
  // What this lesson was written from. If any of these change, npm test fails until the lesson is reviewed.
  sources: string[]; // User Guide entry ids
  files?: string[]; // repo paths, for team lessons that have no User Guide entry
}

export type LessonState = "locked" | "open" | "passed";

export interface LessonCard {
  id: string;
  title: string;
  minutes: number;
  summary: string;
  kind: "lesson" | "exam";
  track: LessonTrack;
  state: LessonState;
  bestScore: number | null;
  attempts: number;
  hasTryIt: boolean;
  answered: boolean;
  countsToward: string | null;
  review?: ReviewState;
}

export interface LevelView {
  key: LevelKey;
  title: string;
  blurb: string;
  lessons: LessonCard[];
  passed: number;
  certificate: boolean;
}

export type ReviewStatus = "draft" | "approved" | "changes" | "edited";
export interface ReviewState {
  status: ReviewStatus;
  note: string | null;
}

// A feature a lesson covers: the page itself (null when this person cannot open it) and its User Guide entry.
export interface LessonLink {
  name: string;
  where: string;
  href: string | null;
  guide: string;
}

export interface QuestionForLearner {
  id: string;
  q: string;
  options: { id: string; text: string }[];
}

export interface LessonForLearner extends Omit<Lesson, "questions" | "sources" | "files" | "tryIt" | "dimension"> {
  questions: QuestionForLearner[];
  tryIt: { label: string; href: string | null; task: string; question: string } | null; // href is null when this person cannot open that page
  answer: string | null;
  countsToward: string | null;
  links: LessonLink[];
  state: LessonState;
  bestScore: number | null;
  attempts: number;
  nextId: string | null;
  review?: ReviewState;
}

export interface QuizResult {
  score: number;
  passed: boolean;
  missed: string[];
  results: { id: string; correct: boolean; why: string | null }[];
}

export const PASS_MARK = 80;

// Wings: the reward for doing the work. Worked out from progress, never stored.
export const WINGS = { lesson: 1, answer: 1, exam: 5 };
