"use client";

// After the Collective moved to its own address, a phone or browser that had notifications on needs to switch
// them on once more here (web push belongs to the address it was set up on). This quiet card offers the one
// tap, only to devices that had notifications before and have not yet renewed them. Inside the iPhone app,
// Apple push is separate and untouched.
import { useEffect, useState } from "react";
import { BellRing, X } from "lucide-react";
import { useCommunity } from "@/lib/community/context";
import { isNativeApp } from "@/lib/community/native";
import { pushNeedsRenewal, subscribeWebPush } from "./PushToggle";
import { Button } from "./ui";

const DISMISS_KEY = "cm-push-moved-dismissed";

export function PushMovedNotice() {
  const { supabase, userId } = useCommunity();
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!userId || isNativeApp()) return;
    try {
      if (localStorage.getItem(DISMISS_KEY)) return;
    } catch {
      /* private mode: just show it */
    }
    void pushNeedsRenewal(supabase, userId).then(setShow).catch(() => undefined);
  }, [supabase, userId]);

  if (!show || !userId) return null;
  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
    setShow(false);
  };
  return (
    <div role="status" className="mb-5 flex items-start gap-3 rounded-2xl border border-[#E9D7A9] bg-[var(--cm-gold-soft)] px-4 py-3 text-[14px] text-[var(--cm-ink)]">
      <BellRing className="mt-0.5 h-4 w-4 shrink-0 text-[var(--cm-gold-text)]" />
      <p className="flex-1 leading-relaxed">
        The Collective has a new address, so notifications on this device need switching on once more.{" "}
        <Button
          size="sm"
          variant="navy"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              const result = await subscribeWebPush(supabase, userId);
              if (result === "on") setShow(false);
            } finally {
              setBusy(false);
            }
          }}
        >
          Turn on
        </Button>
      </p>
      <button onClick={dismiss} aria-label="Dismiss" className="rounded-lg p-1 text-[var(--cm-muted)] hover:bg-black/5">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
