"use client";

import { useSearchParams } from "next/navigation";
import { ScheduleQuestionnaireForm } from "../ScheduleQuestionnaireForm";

const BOOKING_URL = "https://app.globalcontrol.io/appointment-booking/executive-consultation-lccs";

export function MasterclassScheduleClient() {
  const params = useSearchParams();
  const email = params.get("email") || "";
  const name = params.get("name") || "";

  return (
    <main className="min-h-screen bg-[#141826] text-[#F3EEE4]">
      <div className="mx-auto max-w-2xl px-6 py-16">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c9a227]">
          LifeCharter Command Suite
        </p>
        <h1 className="mt-3 text-3xl sm:text-4xl font-semibold text-[#F8F5F0]">
          Let&apos;s make sure this call is a fit
        </h1>
        <p className="mt-3 text-[#b8a898] max-w-xl">
          Three quick questions so Marcello can come prepared &mdash; then you&apos;ll pick a time
          that works for you.
        </p>

        <div className="mt-8 rounded-2xl border border-[#F3EEE4]/12 bg-[#1C2236] p-6">
          <ScheduleQuestionnaireForm
            source="masterclass"
            bookingUrl={BOOKING_URL}
            defaultFullName={name}
            defaultEmail={email}
          />
        </div>
      </div>
    </main>
  );
}
