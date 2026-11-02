import type { Lesson } from "@/lib/academy/types";
import { FOUNDATIONS } from "./foundations";
import { WORKING } from "./working";

// Every lesson, in writing order. Add each new level's file here. Server only: these carry the answers.
export const ACADEMY_LESSONS: Lesson[] = [...FOUNDATIONS, ...WORKING];
export const academyLesson = (id: string) => ACADEMY_LESSONS.find((l) => l.id === id) ?? null;
