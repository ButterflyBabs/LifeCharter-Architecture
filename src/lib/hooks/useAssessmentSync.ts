"use client";

import { useEffect, useRef } from "react";

export interface SyncRow {
  questionId: string;
  questionText: string;
  section?: string;
  answerText: string;
  value?: unknown;
  sensitive?: boolean;
  score?: number | null;
  maxScore?: number | null;
}

// Sends an assessment's answers to the server as they're given, a few seconds
// after the last change, so the client's AI assistant can learn from every
// answer instead of only from a finished assessment. Only what changed is sent.
// `build` turns one answered question into a row (or null to skip it).
export function useAssessmentSync(
  type: "brain" | "soul" | "profit_architecture",
  answers: Record<string, string>,
  build: (questionId: string, answer: string) => SyncRow | null,
  delayMs = 4000
) {
  const synced = useRef<Record<string, string>>({});
  const buildRef = useRef(build);
  buildRef.current = build;

  useEffect(() => {
    const timer = setTimeout(() => {
      const changed: SyncRow[] = [];
      const removedIds: string[] = [];
      for (const [id, raw] of Object.entries(answers)) {
        const value = (raw ?? "").toString();
        if (value.trim() === "") continue;
        if (synced.current[id] === value) continue;
        const row = buildRef.current(id, value);
        if (row) changed.push(row);
      }
      for (const id of Object.keys(synced.current)) {
        if ((answers[id] ?? "").toString().trim() === "") removedIds.push(id);
      }
      if (changed.length === 0 && removedIds.length === 0) return;

      fetch("/api/assessments/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, partial: true, responses: changed, removedIds }),
        keepalive: true,
      })
        .then((r) => {
          if (!r.ok) return;
          for (const row of changed) synced.current[row.questionId] = row.answerText;
          for (const id of removedIds) delete synced.current[id];
        })
        .catch(() => {});
    }, delayMs);
    return () => clearTimeout(timer);
  }, [answers, type, delayMs]);
}
