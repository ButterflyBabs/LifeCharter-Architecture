"use client";

// Landing page for emailed sign-in links (password reset). The token is only
// used when the person clicks the button — email security scanners that open
// every link in advance can't spend it — and it works in any browser or
// device, unlike a same-browser PKCE link.
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthShell, authButtonClass } from "@/components/login/auth-shell";

type OtpType = "recovery" | "magiclink" | "email";

function ConfirmInner() {
  const router = useRouter();
  const params = useSearchParams();
  const tokenHash = params.get("token_hash");
  const type = (params.get("type") ?? "recovery") as OtpType;
  const nextParam = params.get("next") ?? "/";
  // Only ever forward to a path on this site.
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/";
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(!tokenHash);

  async function confirm() {
    if (!tokenHash) return;
    setBusy(true);
    const { error } = await createClient().auth.verifyOtp({ token_hash: tokenHash, type });
    if (error) {
      setFailed(true);
      setBusy(false);
      return;
    }
    router.replace(next);
    router.refresh();
  }

  if (failed) {
    return (
      <AuthShell title="This link has expired" subtitle="Reset links are single-use and time-limited. Request a fresh one and we'll email it right over.">
        <a href="/forgot-password" className={authButtonClass + " block text-center no-underline"}>
          Request a new link
        </a>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={type === "recovery" ? "Reset your password" : "Continue signing in"}
      subtitle={type === "recovery" ? "Tap below to choose a new password for your LifeCharter account." : "Tap below to continue."}
    >
      <button onClick={confirm} disabled={busy} className={authButtonClass}>
        {busy ? "One moment…" : type === "recovery" ? "Set my new password" : "Continue"}
      </button>
    </AuthShell>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense>
      <ConfirmInner />
    </Suspense>
  );
}
