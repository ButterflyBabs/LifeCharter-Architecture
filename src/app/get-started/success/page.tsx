"use client";
import { trackEvent } from "@/lib/tracking";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

// useSearchParams() needs the real request URL, which doesn't exist during
// Next's static-shell prerender pass for a client component — force-dynamic
// alone doesn't skip that pass, only a Suspense boundary around the hook's
// usage does (confirmed the hard way: force-dynamic alone still failed the
// build with the same prerender error).
function GetStartedSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState<"loading" | "signing" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      setErrorMsg("Missing checkout session — if you just paid, contact us and we'll get you set up.");
      return;
    }
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let counted = false;
    // The account is created only after the client signs the Year-1 Operating Agreement (emailed right after payment).
    // So this asks every few seconds until their signature is in, then moves on by itself.
    const check = () => {
      fetch(`/api/stripe/starter-checkout/confirm?session_id=${encodeURIComponent(sessionId)}`)
        .then((r) => r.json())
        .then((data) => {
          if (stopped) return;
          // Same event id the Stripe webhook sends to the Conversions API, so Meta counts one purchase (once, when payment is confirmed).
          // The internal free test session never counts as a purchase in the ad pixel.
          if ((data.redirectUrl || data.state === "awaiting_signature") && !counted && !data.test) {
            counted = true;
            trackEvent("Purchase", { content_name: "command_suite_starter", currency: "USD" }, { eventID: sessionId });
          }
          if (data.state === "awaiting_signature") {
            setEmail(data.email || "");
            setStatus("signing");
            timer = setTimeout(check, 5000);
            return;
          }
          if (!data.redirectUrl) throw new Error(data.error || "Could not finish setting up your account");
          setTimeout(() => { window.location.href = data.redirectUrl; }, 300);
        })
        .catch((err) => {
          if (stopped) return;
          setStatus("error");
          setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
        });
    };
    check();
    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
    };
  }, [sessionId]);

  return (
    <div className="max-w-md text-center">
      {status === "loading" ? (
        <>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c9a227]">
            Payment received
          </p>
          <h1 className="mt-3 text-2xl font-semibold text-[#F8F5F0]">Getting your agreement ready…</h1>
          <p className="mt-3 text-sm text-[#b8a898]">
            This takes just a moment.
          </p>
        </>
      ) : status === "signing" ? (
        <>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c9a227]">
            Payment received. One last step
          </p>
          <h1 className="mt-3 text-2xl font-semibold text-[#F8F5F0]">Sign your agreement to open your account</h1>
          <p className="mt-3 text-sm text-[#b8a898]">
            We just emailed your Year-1 Operating Agreement{email ? <> to <span className="text-[#F8F5F0]">{email}</span></> : null}. It takes about two minutes to sign. Your Command Suite account opens the moment you sign.
          </p>
          <p className="mt-3 text-sm text-[#b8a898]">
            You can keep this page open and it will continue by itself. If you close it, we will email you a sign-in link as soon as you have signed.
          </p>
          <p className="mt-4 text-xs text-[#b8a898]/80">
            Can&apos;t find it? Check your spam or promotions folder for an email titled &ldquo;Please sign: LifeCharter Command Suite Year-1 Operating Agreement&rdquo; from signatures@lccommandsuite.com, or write to support@lccommandsuite.com.
          </p>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-semibold text-[#F8F5F0]">We hit a snag</h1>
          <p className="mt-3 text-sm text-[#b8a898]">{errorMsg}</p>
          <p className="mt-4 text-xs text-[#b8a898]/80">
            Your payment went through — this is just about getting your account linked up.
            Reach out and we&apos;ll take care of it directly.
          </p>
        </>
      )}
    </div>
  );
}

export default function GetStartedSuccessPage() {
  return (
    <main className="min-h-screen bg-[#141826] text-[#F3EEE4] flex items-center justify-center px-6">
      <Suspense
        fallback={
          <div className="max-w-md text-center">
            <h1 className="text-2xl font-semibold text-[#F8F5F0]">Getting your agreement ready…</h1>
          </div>
        }
      >
        <GetStartedSuccessContent />
      </Suspense>
    </main>
  );
}
