"use client";

import { useEffect } from "react";
import "./InstallApp"; // hooks Chrome's install prompt at load time

// Registers the Collective's service worker so the app is installable and can
// receive push notifications. Harmless where service workers aren't supported.
export function PwaRegister() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/community-sw.js").catch(() => {});
  }, []);
  return null;
}
