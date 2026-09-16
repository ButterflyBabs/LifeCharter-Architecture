import type { Metadata } from "next";
import { ScheduleQuestionnaireForm } from "../ScheduleQuestionnaireForm";

export const metadata: Metadata = {
  title: "Schedule Your Executive Consultation — LifeCharter Command Suite",
  description: "A few quick questions, then pick a time with Marcello.",
};

const BOOKING_URL = "https://app.globalcontrol.io/appointment-booking/lccsexec-consultwebsite";

export default function ScheduleWebsitePage({
  searchParams,
}: {
  searchParams: { src?: string };
}) {
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
          Five quick questions so Marcello can come prepared to your Executive Consultation &mdash;
          then you&apos;ll pick a time that works for you.
        </p>

        <div className="mt-8 rounded-2xl border border-[#F3EEE4]/12 bg-[#1C2236] p-6">
          <ScheduleQuestionnaireForm source="website" bookingUrl={BOOKING_URL} sessionSource={searchParams.src} />
        </div>
      </div>
    </main>
  );
}
