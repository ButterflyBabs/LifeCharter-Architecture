"use client";

import { useEffect, useState } from "react";
import { BellRing } from "lucide-react";
import { useCommunity } from "@/lib/community/context";
import { enableNativePush, isNativeApp, nativePushState, useIsNativeApp, type NativePushState } from "@/lib/community/native";
import { COLLECTIVE_CUTOVER_ISO } from "@/lib/collective";
import { Button } from "./ui";

const VAPID = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

const uaOf = () => navigator.userAgent.slice(0, 200);

type PushDb = ReturnType<typeof useCommunity>["supabase"];

/**
 * Subscribes THIS browser/device for web push on the current address and saves it. Returns the resulting state.
 * Web push is tied to the address a subscription was made on, so after the Collective moved to its own address each
 * member has to switch it on once more here. When that happens, this device's older subscription (made on the old
 * address, before COLLECTIVE_CUTOVER_ISO, same browser) is retired so nobody gets every notification twice.
 */
export async function subscribeWebPush(supabase: PushDb, userId: string): Promise<"on" | "off" | "denied"> {
  if (!VAPID) return "off";
  const perm = await Notification.requestPermission();
  if (perm !== "granted") return perm === "denied" ? "denied" : "off";
  const reg = (await navigator.serviceWorker.getRegistration("/community-sw.js")) ?? (await navigator.serviceWorker.register("/community-sw.js"));
  await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(VAPID) });
  const json = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
  await supabase.from("cm_push_subscriptions").upsert(
    { user_id: userId, endpoint: json.endpoint, p256dh: json.keys.p256dh, auth: json.keys.auth, user_agent: uaOf() },
    { onConflict: "endpoint" }
  );
  if (COLLECTIVE_CUTOVER_ISO) {
    await supabase
      .from("cm_push_subscriptions")
      .delete()
      .eq("user_id", userId)
      .eq("user_agent", uaOf())
      .neq("endpoint", json.endpoint)
      .lt("created_at", COLLECTIVE_CUTOVER_ISO);
  }
  return "on";
}

/** Does this device have a web-push subscription from before the move that has not been re-made here yet? */
export async function pushNeedsRenewal(supabase: PushDb, userId: string): Promise<boolean> {
  if (!VAPID || !COLLECTIVE_CUTOVER_ISO) return false;
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return false;
  if (Notification.permission === "denied") return false;
  const reg = await navigator.serviceWorker.getRegistration("/community-sw.js");
  if (await reg?.pushManager.getSubscription()) return false;
  const { count } = await supabase
    .from("cm_push_subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("user_agent", uaOf())
    .lt("created_at", COLLECTIVE_CUTOVER_ISO);
  return (count ?? 0) > 0;
}

type State = "unsupported" | "needs-install" | "off" | "on" | "denied" | "not-configured";

// Turns on push for this device: Apple push inside the iPhone app, web push
// everywhere else.
export function PushToggle() {
  const native = useIsNativeApp();
  return native ? <NativePushToggle /> : <WebPushToggle />;
}

function NativePushToggle() {
  const [state, setState] = useState<NativePushState | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (isNativeApp()) void nativePushState().then(setState).catch(() => setState(null));
  }, []);
  if (!state) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[var(--cm-fill-2)] px-3.5 py-3">
      <span className="flex items-center gap-2 text-[14px] text-[var(--cm-ink)]">
        <BellRing className="h-4 w-4 text-[var(--cm-gold-text)]" />
        {state === "granted"
          ? "Notifications are on for this iPhone."
          : state === "denied"
            ? "Notifications are off. Turn them on in iPhone Settings → Collective → Notifications."
            : "Get notified on this iPhone."}
      </span>
      {state === "prompt" && (
        <Button
          size="sm"
          variant="navy"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setState(await enableNativePush().catch(() => "prompt" as const));
            setBusy(false);
          }}
        >
          Turn on
        </Button>
      )}
    </div>
  );
}

function WebPushToggle() {
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
      setState(await subscribeWebPush(supabase, userId));
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
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[var(--cm-fill-2)] px-3.5 py-3">
      <span className="flex items-center gap-2 text-[14px] text-[var(--cm-ink)]">
        <BellRing className="h-4 w-4 text-[var(--cm-gold-text)]" />
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
