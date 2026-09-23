"use client";

import { useEffect, useState } from "react";
import { BellRing } from "lucide-react";
import { useCommunity } from "@/lib/community/context";
import { Button } from "./ui";

const VAPID = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

type State = "unsupported" | "needs-install" | "off" | "on" | "denied" | "not-configured";

// Turns on web push for this device and stores the subscription.
export function PushToggle() {
  const { supabase, userId } = useCommunity();
  const [state, setState] = useState<State | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void (async () => {
      if (!VAPID) return setState("not-configured");
      const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
      const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone;
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) return setState(ios && !standalone ? "needs-install" : "unsupported");
      if (Notification.permission === "denied") return setState("denied");
      const reg = await navigator.serviceWorker.getRegistration("/community-sw.js");
      const sub = await reg?.pushManager.getSubscription();
      setState(sub ? "on" : "off");
    })();
  }, []);

  async function enable() {
    if (!VAPID || !userId) return;
    setBusy(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") return setState(perm === "denied" ? "denied" : "off");
      const reg = (await navigator.serviceWorker.getRegistration("/community-sw.js")) ?? (await navigator.serviceWorker.register("/community-sw.js"));
      await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(VAPID) });
      const json = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
      await supabase.from("cm_push_subscriptions").upsert(
        { user_id: userId, endpoint: json.endpoint, p256dh: json.keys.p256dh, auth: json.keys.auth, user_agent: navigator.userAgent.slice(0, 200) },
        { onConflict: "endpoint" }
      );
      setState("on");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    const reg = await navigator.serviceWorker.getRegistration("/community-sw.js");
    const sub = await reg?.pushManager.getSubscription();
    if (sub) {
      await supabase.from("cm_push_subscriptions").delete().eq("endpoint", sub.endpoint);
      await sub.unsubscribe();
    }
    setState("off");
    setBusy(false);
  }

  if (!state) return null;
  const note: Partial<Record<State, string>> = {
    unsupported: "This browser doesn't support push notifications.",
    "needs-install": "On iPhone, add the Collective to your Home Screen first (from Safari or Chrome — see below), then open it from that icon to turn on notifications.",
    denied: "Notifications are blocked for this site in your browser settings.",
    "not-configured": "Push notifications are coming soon.",
  };
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#F7F3EA] px-3.5 py-3">
      <span className="flex items-center gap-2 text-[14px] text-[#1F315B]">
        <BellRing className="h-4 w-4 text-[#A8873F]" />
        {state === "on" ? "Push is on for this device." : note[state] ?? "Get notified on this device."}
      </span>
      {state === "off" && (
        <Button size="sm" variant="navy" disabled={busy} onClick={enable}>
          Turn on
        </Button>
      )}
      {state === "on" && (
        <Button size="sm" variant="ghost" disabled={busy} onClick={disable}>
          Turn off
        </Button>
      )}
    </div>
  );
}
