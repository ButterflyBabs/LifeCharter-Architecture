"use client";

// Only does anything inside the iPhone app: keeps this phone registered for
// Apple push, opens the right page when a notification or a lccommandsuite.com
// link is tapped, and matches the status bar to light/dark mode.
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCommunity } from "@/lib/community/context";
import { isNativeApp } from "@/lib/community/native";

function inAppPath(href: string | undefined | null): string | null {
  if (!href) return null;
  try {
    const u = new URL(href, "https://lccommandsuite.com");
    if (u.hostname !== "lccommandsuite.com") return null;
    return u.pathname.startsWith("/community") || u.pathname.startsWith("/join") ? `${u.pathname}${u.search}${u.hash}` : null;
  } catch {
    return null;
  }
}

export function NativeBridge({ dark }: { dark: boolean }) {
  const { supabase, userId } = useCommunity();
  const router = useRouter();

  useEffect(() => {
    if (!isNativeApp() || !userId) return;
    const cleanups: (() => void)[] = [];
    void (async () => {
      const { PushNotifications } = await import("@capacitor/push-notifications");
      const { App } = await import("@capacitor/app");
      const reg = await PushNotifications.addListener("registration", async ({ value }) => {
        await supabase.from("cm_apns_devices").upsert({ token: value, user_id: userId, updated_at: new Date().toISOString() }, { onConflict: "token" });
      });
      const tap = await PushNotifications.addListener("pushNotificationActionPerformed", ({ notification }) => {
        const path = inAppPath((notification.data as { href?: string } | undefined)?.href);
        if (path) router.push(path);
      });
      const link = await App.addListener("appUrlOpen", ({ url }) => {
        const path = inAppPath(url);
        if (path) router.push(path);
      });
      cleanups.push(() => void reg.remove(), () => void tap.remove(), () => void link.remove());
      // Refresh the token each launch if they've already said yes.
      const perm = await PushNotifications.checkPermissions();
      if (perm.receive === "granted") await PushNotifications.register();
    })();
    return () => cleanups.forEach((c) => c());
  }, [supabase, userId, router]);

  useEffect(() => {
    if (!isNativeApp()) return;
    void import("@capacitor/status-bar")
      .then(({ StatusBar, Style }) => StatusBar.setStyle({ style: dark ? Style.Dark : Style.Light }))
      .catch(() => undefined);
  }, [dark]);

  return null;
}
