"use client";

import { useEffect } from "react";

// Registers the Collective's service worker so the app is installable and can
// receive push notifications. Harmless where service workers aren't supported.
export function PwaRegister() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/community-sw.js").catch(() => {});
  }, []);
  return null;
}
