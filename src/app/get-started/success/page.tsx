"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function GetStartedSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      setErrorMsg("Missing checkout session — if you just paid, contact us and we'll get you set up.");
      return;
    }
    fetch(`/api/stripe/starter-checkout/confirm?session_id=${encodeURIComponent(sessionId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.redirectUrl) throw new Error(data.error || "Could not finish setting up your account");
        window.location.href = data.redirectUrl;
      })
      .catch((err) => {
        setStatus("error");
        setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
      });
  }, [sessionId]);

  return (
    <main className="min-h-screen bg-[#141826] text-[#F3EEE4] flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        {status === "loading" ? (
          <>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c9a227]">
              Payment received
            </p>
            <h1 className="mt-3 text-2xl font-semibold text-[#F8F5F0]">Setting up your account…</h1>
            <p className="mt-3 text-sm text-[#b8a898]">
              This takes just a moment — you&apos;ll be redirected automatically.
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
    </main>
  );
}
