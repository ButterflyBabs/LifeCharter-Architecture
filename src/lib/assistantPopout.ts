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
