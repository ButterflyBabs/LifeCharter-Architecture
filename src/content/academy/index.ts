import type { Lesson } from "@/lib/academy/types";
import { FOUNDATIONS } from "./foundations";

// Every lesson, in writing order. Add each new level's file here. Server only: these carry the answers.
export const ACADEMY_LESSONS: Lesson[] = [...FOUNDATIONS];
export const academyLesson = (id: string) => ACADEMY_LESSONS.find((l) => l.id === id) ?? null;
