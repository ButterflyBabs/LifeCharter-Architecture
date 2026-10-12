"use client";

import { useCallback, useEffect, useState } from "react";
import type { Reminder } from "@/lib/reminders";

// Shared by the Reminders page and the Executive Home / Daily Compass cards. Changes made in one place show in the
// others straight away (a window event), and the list refreshes every minute so a reminder turns "due" on its own.
const CHANGED = "reminders-changed";

export function useReminders() {
  const [items, setItems] = useState<Reminder[] | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/reminders", { cache: "no-store" });
      const d = await r.json().catch(() => ({}));
      setItems(d.reminders ?? []);
    } catch {
      setItems((cur) => cur ?? []);
    }
  }, []);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 60_000);
    const onChange = () => void load();
    window.addEventListener(CHANGED, onChange);
    return () => {
      clearInterval(t);
      window.removeEventListener(CHANGED, onChange);
    };
  }, [load]);

  const call = useCallback(
    async (method: "POST" | "PATCH" | "DELETE", body: Record<string, unknown>) => {
      setError("");
      const r = await fetch("/api/reminders", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError(d.error || "That didn't save. Try again.");
        return false;
      }
      window.dispatchEvent(new Event(CHANGED));
      await load();
      return true;
    },
    [load]
  );

  return {
    items,
    error,
    refresh: load,
    add: (title: string, remindAt: string, notes?: string) => call("POST", { title, remindAt, notes }),
    setDone: (id: string, done: boolean) => call("PATCH", { id, done }),
    snooze: (id: string, minutes: number) => call("PATCH", { id, snoozeMinutes: minutes }),
    update: (id: string, patch: { title?: string; notes?: string; remindAt?: string }) => call("PATCH", { id, ...patch }),
    remove: (id: string) => call("DELETE", { id }),
  };
}

// The quick times offered next to the "when" picker, as ISO strings (the browser's own time zone).
export function quickTimes(now = new Date()): { label: string; iso: string }[] {
  const at = (d: Date) => d.toISOString();
  const plus = (h: number) => new Date(now.getTime() + h * 3_600_000);
  const tomorrow9 = new Date(now);
  tomorrow9.setDate(tomorrow9.getDate() + 1);
  tomorrow9.setHours(9, 0, 0, 0);
  const nextMonday = new Date(now);
  nextMonday.setDate(nextMonday.getDate() + ((8 - nextMonday.getDay()) % 7 || 7));
  nextMonday.setHours(9, 0, 0, 0);
  const out = [
    { label: "In 1 hour", iso: at(plus(1)) },
    { label: "In 3 hours", iso: at(plus(3)) },
    { label: "Tomorrow 9 am", iso: at(tomorrow9) },
    { label: "In 24 hours", iso: at(plus(24)) },
    { label: "Next Monday 9 am", iso: at(nextMonday) },
  ];
  return out;
}

// <input type="datetime-local"> value for a Date in the browser's zone.
export function localInputValue(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
