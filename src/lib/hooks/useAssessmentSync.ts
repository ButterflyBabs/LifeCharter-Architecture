"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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

export interface AssessmentSyncState {
  /** idle = nothing sent yet; saving = a save is on its way; saved = the account has everything; error = the last save failed and is being retried. */
  status: "idle" | "saving" | "saved" | "error";
  /** Answers on this page the account does not have yet. */
  unsaved: number;
  /** When the account last confirmed a save. */
  lastSyncedAt: Date | null;
  /** Saves that failed in a row (0 once one succeeds). */
  failures: number;
}

// Sends an assessment's answers to the server as they're given, a few seconds
// after the last change, so the client's AI assistant can learn from every
// answer instead of only from a finished assessment. Only what changed is sent.
// `build` turns one answered question into a row (or null to skip it).
//
// A failed save is never silent (John Carter lost two assessments' worth of answers on 2026-10-15 to 10-21 when the
// account saves failed unseen and only the browser copy existed): the state says so for the page to show, the save is
// retried with a growing pause (5s, 10s, 20s ... up to a minute), and it is tried again when the browser comes back
// online, the tab is shown again, or the page is being closed.
export function useAssessmentSync(
  type: "brain" | "soul" | "profit_architecture",
  answers: Record<string, string>,
  build: (questionId: string, answer: string) => SyncRow | null,
  delayMs = 4000
): AssessmentSyncState {
  const synced = useRef<Record<string, string>>({});
  const buildRef = useRef(build);
  buildRef.current = build;
  const answersRef = useRef(answers);
  answersRef.current = answers;
  const inflight = useRef(false);
  const failures = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const alive = useRef(true);
  const [state, setState] = useState<AssessmentSyncState>({ status: "idle", unsaved: 0, lastSyncedAt: null, failures: 0 });

  const pending = useCallback(() => {
    const current = answersRef.current;
    const changed: SyncRow[] = [];
    const removedIds: string[] = [];
    for (const [id, raw] of Object.entries(current)) {
      const value = (raw ?? "").toString();
      if (value.trim() === "") continue;
      if (synced.current[id] === value) continue;
      const row = buildRef.current(id, value);
      if (row) changed.push(row);
    }
    for (const id of Object.keys(synced.current)) {
      if ((current[id] ?? "").toString().trim() === "") removedIds.push(id);
    }
    return { changed, removedIds };
  }, []);

  // `unloading` = the page is being hidden or closed: only then is a keepalive request used (it must outlive the page),
  // and only when the body is small. Browsers allow just 64 KiB of keepalive bodies in flight at once, in BYTES (an
  // answer with curly quotes or an emoji is 2 to 4 bytes a character), so an ordinary save must never use it: a long AI
  // answer set sent as several keepalive requests at once was refused by the browser before it left the page, silently,
  // which is how John Carter's later answers never reached his account (2026-10-21).
  const flush = useCallback(async (unloading = false) => {
    if (inflight.current) return;
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    const { changed, removedIds } = pending();
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

    inflight.current = true;
    if (alive.current) setState((s) => ({ ...s, status: "saving", unsaved: changed.length + removedIds.length }));

    // One batch at a time, so a failure shows which one and the ones that succeed are kept.
    const results: boolean[] = [];
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const body = JSON.stringify({
        type,
        partial: true,
        responses: batch,
        // Removals ride along with the first batch only.
        removedIds: i === 0 ? removedIds : [],
      });
      if (batch.length === 0 && (i !== 0 || removedIds.length === 0)) {
        results.push(true);
        continue;
      }
      try {
        const bytes = new TextEncoder().encode(body).length;
        const r = await fetch("/api/assessments/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
          keepalive: unloading && bytes < 30_000,
        });
        if (!r.ok) {
          results.push(false);
          continue;
        }
        for (const row of batch) synced.current[row.questionId] = row.answerText;
        if (i === 0) for (const id of removedIds) delete synced.current[id];
        results.push(true);
      } catch {
        results.push(false);
      }
    }
    inflight.current = false;
    if (!alive.current) return;

    const left = pending();
    const unsaved = left.changed.length + left.removedIds.length;
    if (results.every(Boolean) && unsaved === 0) {
      failures.current = 0;
      setState({ status: "saved", unsaved: 0, lastSyncedAt: new Date(), failures: 0 });
      return;
    }
    if (results.every(Boolean)) {
      // Everything sent went through, but the person kept typing meanwhile: send the rest soon.
      failures.current = 0;
      setState({ status: "saving", unsaved, lastSyncedAt: new Date(), failures: 0 });
      timer.current = setTimeout(() => void flush(), delayMs);
      return;
    }
    failures.current += 1;
    const pause = Math.min(60_000, 5_000 * 2 ** (failures.current - 1));
    setState((s) => ({ status: "error", unsaved, lastSyncedAt: s.lastSyncedAt, failures: failures.current }));
    timer.current = setTimeout(() => void flush(), pause);
  }, [type, delayMs, pending]);

  // A few seconds after the last change, send what changed.
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void flush(), delayMs);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [answers, delayMs, flush]);

  // Try again as soon as the browser is back online or the tab is shown again, and one last time as the page closes.
  useEffect(() => {
    const retry = () => void flush();
    const closing = () => void flush(true);
    // visibilitychange fires both when the tab is shown again and when it is hidden or closing: send either way.
    const onVisibility = () => void flush(document.visibilityState === "hidden");
    window.addEventListener("online", retry);
    window.addEventListener("pagehide", closing);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("online", retry);
      window.removeEventListener("pagehide", closing);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [flush]);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  return state;
}
