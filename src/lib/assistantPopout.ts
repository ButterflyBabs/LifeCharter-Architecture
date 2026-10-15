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

// A decision (Approve, Cancel, Undo) made on ANY screen is announced to every other place that shows the same
// cards: the assistant window, the full-size approvals page, a report card, even another tab. Each place ignores
// its own announcements.
const DECIDED_EVENT = "assistant-action-decided";
const CHANNEL = "assistant-actions";
export interface DecidedDetail { origin: string; card: { id: string; status: string; title?: string; summary?: string; [k: string]: unknown } }

export function announceDecision(detail: DecidedDetail) {
  try {
    window.dispatchEvent(new CustomEvent(DECIDED_EVENT, { detail }));
  } catch {
    /* nothing else is listening */
  }
  try {
    const bc = new BroadcastChannel(CHANNEL);
    bc.postMessage(detail);
    bc.close();
  } catch {
    /* this browser has no BroadcastChannel */
  }
}

export function onDecision(cb: (d: DecidedDetail) => void): () => void {
  const local = (e: Event) => cb((e as CustomEvent<DecidedDetail>).detail);
  window.addEventListener(DECIDED_EVENT, local);
  let bc: BroadcastChannel | null = null;
  try {
    bc = new BroadcastChannel(CHANNEL);
    bc.onmessage = (m) => cb(m.data as DecidedDetail);
  } catch {
    bc = null;
  }
  return () => {
    window.removeEventListener(DECIDED_EVENT, local);
    bc?.close();
  };
}

// "Open" buttons on cards and checklist steps open the item in ONE pop-up work window (the same window is reused),
// so the checklist stays where it is and the person can close the window and be right back on it.
export function openWorkWindow(href: string) {
  try {
    const w = Math.min(1200, Math.max(700, (window.screen?.availWidth ?? 1280) - 120));
    const h = Math.min(900, Math.max(560, (window.screen?.availHeight ?? 800) - 120));
    const win = window.open(href, "lc-work-window", `popup=yes,width=${w},height=${h},left=60,top=40,resizable=yes,scrollbars=yes`);
    if (win) win.focus();
    else window.open(href, "_blank", "noopener");
  } catch {
    window.location.href = href;
  }
}
