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

      // Send in batches. Browsers refuse a keepalive request whose body is over
      // 64 KB, and a long assessment (Brain answers can total 90 KB+) would
      // otherwise fail silently on every save. Each batch stays well under that,
      // and keepalive is only used when the batch is small enough to allow it.
      const MAX_BATCH_BYTES = 48_000;
      const batches: SyncRow[][] = [];
      let current: SyncRow[] = [];
      let currentBytes = 0;
      for (const row of changed) {
        const size = JSON.stringify(row).length;
        if (current.length > 0 && currentBytes + size > MAX_BATCH_BYTES) {
          batches.push(current);
          current = [];
          currentBytes = 0;
        }
        current.push(row);
        currentBytes += size;
      }
      if (current.length > 0 || batches.length === 0) batches.push(current);

      batches.forEach((batch, i) => {
        const body = JSON.stringify({
          type,
          partial: true,
          responses: batch,
          // Removals ride along with the first batch only.
          removedIds: i === 0 ? removedIds : [],
        });
        if (batch.length === 0 && (i !== 0 || removedIds.length === 0)) return;
        fetch("/api/assessments/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
          keepalive: body.length < 60_000,
        })
          .then((r) => {
            if (!r.ok) return;
            for (const row of batch) synced.current[row.questionId] = row.answerText;
            if (i === 0) for (const id of removedIds) delete synced.current[id];
          })
          .catch(() => {});
      });
    }, delayMs);
    return () => clearTimeout(timer);
  }, [answers, type, delayMs]);
}
