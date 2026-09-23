"use client";

// The iPhone app (Capacitor) loads the live Collective. These helpers detect
// it and talk to the native side. Plugins are imported lazily so the website
// never downloads them.
import { useEffect, useState } from "react";

type CapWindow = Window & { Capacitor?: { isNativePlatform?: () => boolean } };

export function isNativeApp(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean((window as CapWindow).Capacitor?.isNativePlatform?.()) || /LifeCharterCollectiveApp/.test(navigator.userAgent);
}

// False during the first render (server + hydration), then the real answer.
export function useIsNativeApp(): boolean {
  const [native, setNative] = useState(false);
  useEffect(() => setNative(isNativeApp()), []);
  return native;
}

export async function haptic(style: "light" | "medium" = "light") {
  if (!isNativeApp()) return;
  try {
    const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
    await Haptics.impact({ style: style === "medium" ? ImpactStyle.Medium : ImpactStyle.Light });
  } catch {
    /* not available */
  }
}

export type NativePushState = "granted" | "denied" | "prompt";

export async function nativePushState(): Promise<NativePushState> {
  const { PushNotifications } = await import("@capacitor/push-notifications");
  const p = await PushNotifications.checkPermissions();
  return p.receive === "granted" ? "granted" : p.receive === "denied" ? "denied" : "prompt";
}

// Ask iOS for permission (first time) and register this phone for pushes.
export async function enableNativePush(): Promise<NativePushState> {
  const { PushNotifications } = await import("@capacitor/push-notifications");
  let p = await PushNotifications.checkPermissions();
  if (p.receive === "prompt" || p.receive === "prompt-with-rationale") p = await PushNotifications.requestPermissions();
  if (p.receive !== "granted") return p.receive === "denied" ? "denied" : "prompt";
  await PushNotifications.register();
  return "granted";
}
