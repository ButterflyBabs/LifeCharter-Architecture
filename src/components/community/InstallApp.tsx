"use client";

// "Put the Collective on your phone" — works out the member's phone and
// browser and shows the one right way to install: a real Install button on
// Android/desktop Chrome, Share → Add to Home Screen steps on iPhone (Safari
// and Chrome place the Share button differently), and an "open in your
// browser first" note inside Instagram/Facebook, which can't install apps.
import { useEffect, useState } from "react";
import { Check, Download, MoreVertical, Share, Smartphone, X } from "lucide-react";
import { Button, Card } from "./ui";
import { useIsNativeApp } from "@/lib/community/native";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

declare global {
  interface Window {
    __cmInstallPrompt?: InstallPromptEvent | null;
  }
}

// Chrome fires this once, early — capture it before any component mounts.
if (typeof window !== "undefined" && !("__cmInstallPromptHooked" in window)) {
  (window as unknown as Record<string, boolean>).__cmInstallPromptHooked = true;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    window.__cmInstallPrompt = e as InstallPromptEvent;
    window.dispatchEvent(new Event("cm-install-ready"));
  });
  window.addEventListener("appinstalled", () => {
    window.__cmInstallPrompt = null;
    window.dispatchEvent(new Event("cm-install-ready"));
  });
}

type Platform = "installed" | "prompt" | "ios-safari" | "ios-chrome" | "ios-other" | "in-app" | "android-manual" | "desktop";

function detect(): Platform {
  const ua = navigator.userAgent;
  const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
  if (standalone) return "installed";
  if (/FBAN|FBAV|Instagram|LinkedInApp|Line\//i.test(ua)) return "in-app";
  if (window.__cmInstallPrompt) return "prompt";
  if (/Android/i.test(ua)) return "android-manual";
  // iPadOS reports itself as a Mac, so a touch-capable "Mac" is an iPad.
  const ios = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (ios) {
    if (/CriOS/i.test(ua)) return "ios-chrome";
    if (/FxiOS|EdgiOS/i.test(ua)) return "ios-other";
    return "ios-safari";
  }
  return "desktop";
}

export function useInstallPlatform() {
  const [platform, setPlatform] = useState<Platform | null>(null);
  useEffect(() => {
    const update = () => setPlatform(detect());
    update();
    window.addEventListener("cm-install-ready", update);
    return () => window.removeEventListener("cm-install-ready", update);
  }, []);
  return platform;
}

function Steps({ children }: { children: React.ReactNode }) {
  return <ol className="ml-5 mt-2 list-decimal space-y-1.5 text-[14.5px] leading-relaxed text-[var(--cm-body)]">{children}</ol>;
}

export function InstallInstructions({ platform }: { platform: Platform }) {
  const [busy, setBusy] = useState(false);

  if (platform === "installed") {
    return (
      <p className="flex items-center gap-2 text-[14.5px] text-emerald-700">
        <Check className="h-4 w-4" /> You&rsquo;re using the Collective app on this device.
      </p>
    );
  }
  if (platform === "prompt") {
    return (
      <div>
        <p className="text-[14.5px] text-[var(--cm-body)]">Add the Collective to your home screen — it opens like any other app.</p>
        <Button
          variant="gold"
          className="mt-3"
          disabled={busy}
          onClick={async () => {
            const p = window.__cmInstallPrompt;
            if (!p) return;
            setBusy(true);
            await p.prompt();
            await p.userChoice.catch(() => null);
            window.__cmInstallPrompt = null;
            window.dispatchEvent(new Event("cm-install-ready"));
            setBusy(false);
          }}
        >
          <Download className="h-4 w-4" /> Install the Collective
        </Button>
      </div>
    );
  }
  if (platform === "ios-safari") {
    return (
      <Steps>
        <li>
          Tap the <strong>Share</strong> button <Share className="inline h-4 w-4 align-[-2px] text-[var(--cm-link)]" /> at the bottom of Safari.
        </li>
        <li>
          Scroll down and tap <strong>Add to Home Screen</strong>, then <strong>Add</strong>.
        </li>
        <li>Open the Collective from the new icon on your home screen, then turn on notifications in your profile.</li>
      </Steps>
    );
  }
  if (platform === "ios-chrome") {
    return (
      <Steps>
        <li>
          Tap the <strong>Share</strong> button <Share className="inline h-4 w-4 align-[-2px] text-[var(--cm-link)]" /> in Chrome&rsquo;s address bar, at the top right.
        </li>
        <li>
          Tap <strong>Add to Home Screen</strong>, then <strong>Add</strong>. (If you don&rsquo;t see it, tap <strong>More</strong> or scroll the list.)
        </li>
        <li>Open the Collective from the new icon on your home screen, then turn on notifications in your profile.</li>
      </Steps>
    );
  }
  if (platform === "ios-other") {
    return (
      <Steps>
        <li>
          Tap your browser&rsquo;s <strong>Share</strong> button <Share className="inline h-4 w-4 align-[-2px] text-[var(--cm-link)]" />.
        </li>
        <li>
          Tap <strong>Add to Home Screen</strong>, then <strong>Add</strong>.
        </li>
        <li>Open the Collective from the new icon on your home screen.</li>
      </Steps>
    );
  }
  if (platform === "in-app") {
    return (
      <p className="text-[14.5px] leading-relaxed text-[var(--cm-body)]">
        You&rsquo;re viewing this inside another app, which can&rsquo;t install the Collective. Tap the <strong>⋯</strong> menu and choose{" "}
        <strong>Open in browser</strong> (Safari or Chrome), then come back to this page.
      </p>
    );
  }
  if (platform === "android-manual") {
    return (
      <Steps>
        <li>
          Tap Chrome&rsquo;s menu <MoreVertical className="inline h-4 w-4 align-[-2px]" /> at the top right.
        </li>
        <li>
          Tap <strong>Install app</strong> (on some phones: <strong>Add to Home screen</strong>).
        </li>
        <li>Open the Collective from the new icon, then turn on notifications in your profile.</li>
      </Steps>
    );
  }
  return (
    <p className="text-[14.5px] leading-relaxed text-[var(--cm-body)]">
      On your phone, open <strong>lccommandsuite.com/community</strong> in Safari or Chrome and come back to this page — it will show the steps for
      your phone.
    </p>
  );
}

// Full card for the profile page.
export function InstallAppCard() {
  const platform = useInstallPlatform();
  const native = useIsNativeApp();
  if (native) return null;
  return (
    <Card className="p-5">
      <div id="app" className="scroll-mt-20" />
      <h2 className="flex items-center gap-2 font-editorial text-[22px] font-semibold text-[var(--cm-ink)]">
        <Smartphone className="h-5 w-5 text-[var(--cm-gold-text)]" /> Put the Collective on your phone
      </h2>
      <div className="mt-2">{platform && <InstallInstructions platform={platform} />}</div>
    </Card>
  );
}

// Slim, dismissable banner for the home screen on phones that haven't installed yet.
export function InstallBanner() {
  const platform = useInstallPlatform();
  const native = useIsNativeApp();
  const [hidden, setHidden] = useState(true);
  useEffect(() => {
    try {
      setHidden(localStorage.getItem("cm-install-banner-dismissed") === "1");
    } catch {
      setHidden(false);
    }
  }, []);
  if (hidden || !platform || platform === "installed" || platform === "desktop" || native) return null;
  return (
    <Card className="relative border-[#E9D7A9] bg-gradient-to-br from-[var(--cm-fill)] to-[var(--cm-gold-soft)] p-4 pr-10">
      <button
        onClick={() => {
          setHidden(true);
          try {
            localStorage.setItem("cm-install-banner-dismissed", "1");
          } catch {
            /* private mode — just hide for now */
          }
        }}
        aria-label="Dismiss"
        className="absolute right-2 top-2 rounded-lg p-1.5 text-[var(--cm-muted)] hover:bg-black/5"
      >
        <X className="h-4 w-4" />
      </button>
      <p className="flex items-center gap-2 font-editorial text-[19px] font-semibold text-[var(--cm-ink)]">
        <Smartphone className="h-5 w-5 text-[var(--cm-gold-text)]" /> Put the Collective on your phone
      </p>
      <InstallInstructions platform={platform} />
    </Card>
  );
}
