"use client";

import { useEffect, useState } from "react";

// Whether the AI assistant is "popped out": floating on every page instead of living on Executive Home.
// Remembered on this device.
const KEY = "assistant-popped-out";
const EVT = "assistant-popout-changed";

export function readPopped(): boolean {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function setPopped(value: boolean) {
  try {
    localStorage.setItem(KEY, value ? "1" : "0");
  } catch {
    /* not remembered */
  }
  window.dispatchEvent(new Event(EVT));
}

export function usePopped(): boolean {
  const [popped, setP] = useState(false);
  useEffect(() => {
    const sync = () => setP(readPopped());
    sync();
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return popped;
}

// "Have the assistant work on this": a button on a task or reminder opens the assistant (floating, on any page)
// and sends it that request. The text waits in sessionStorage so the panel can pick it up when it mounts.
const ASK_KEY = "assistant-pending-ask";
export const ASK_EVENT = "assistant-ask";

export function askAssistant(message: string, shown?: string) {
  try {
    sessionStorage.setItem(ASK_KEY, JSON.stringify({ message, shown }));
  } catch {
    /* the panel just opens */
  }
  setPopped(true);
  window.dispatchEvent(new Event(ASK_EVENT));
}

export function takePendingAsk(): { message: string; shown?: string } | null {
  try {
    const raw = sessionStorage.getItem(ASK_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(ASK_KEY);
    const v = JSON.parse(raw);
    return typeof v?.message === "string" && v.message ? { message: v.message, shown: typeof v.shown === "string" ? v.shown : undefined } : null;
  } catch {
    return null;
  }
}
