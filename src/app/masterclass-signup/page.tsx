import type { Metadata } from "next";
import { meetingSchedule, masterclassMeetingId, isZoomConfigured } from "@/lib/zoom";
import SignupForm from "./SignupForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Save your seat: The Command Shift MasterClass",
  description: "Free live MasterClass with AmiLynne 'Babs' Carroll: From Hustle to Command. 90 minutes, online.",
};

const LANDING = "https://commandsuite-landing-page.vercel.app/masterclass";

// Public page a MasterClass affiliate link sends people to. Shows the next session and registers them on Zoom.
export default async function MasterclassSignupPage() {
  let next: string | null = null;
  if (isZoomConfigured()) {
    try {
      next = (await meetingSchedule(masterclassMeetingId())).next?.start ?? null;
    } catch {
      next = null;
    }
  }
  const when = next
    ? new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "America/Denver" }).format(new Date(next)) +
      " at " +
      new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/Denver", timeZoneName: "short" }).format(new Date(next))
    : "Every other Thursday at 5:00 PM Mountain Time";
  return (
    <main className="mx-auto max-w-xl px-4 py-12">
      <p className="text-xs font-semibold uppercase tracking-widest text-[#a8812b]">Free live MasterClass · 90 minutes</p>
      <h1 className="mt-2 text-3xl font-bold leading-tight text-[#1a2b4a] dark:text-[#F8F5F0]">The Command Shift MasterClass: From Hustle to Command</h1>
      <p className="mt-3 text-[#1a2b4a] dark:text-[#F8F5F0]">Taught live by AmiLynne &lsquo;Babs&rsquo; Carroll, Alignment Architect. Free to attend, and a replay goes to everyone who registers.</p>
      <p className="mt-4 rounded-xl border-l-4 border-[#c9a227] bg-[#c9a227]/10 px-4 py-3 text-sm font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{next ? "Next session: " : ""}{when}</p>
      <SignupForm />
      <p className="mt-6 text-sm text-[#5a6472] dark:text-[#b8c2cf]">
        Want to see what we&apos;ll cover first? <a className="font-semibold text-[#2E7C83] underline" href={LANDING}>Read about the MasterClass</a>.
      </p>
    </main>
  );
}
