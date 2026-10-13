import type { Metadata } from "next";

// Where a sales-call checkout (a combined Command Suite checkout, the Website Alignment Build) sends the buyer
// afterwards. Public on purpose: the buyer is not signed in to anything, and the Sales Reference page they used
// to land on is for the team only.
export const metadata: Metadata = {
  title: "Thank you | LifeCharter Command Suite",
  robots: { index: false, follow: false },
};

export default function ThanksPage({ searchParams }: { searchParams: { status?: string } }) {
  const cancelled = searchParams.status === "cancelled";
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0F1A38] px-6 py-16">
      <div className="max-w-md text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c9a227]">{cancelled ? "No payment was taken" : "Payment received"}</p>
        <h1 className="mt-3 text-3xl font-semibold text-[#F8F5F0]">{cancelled ? "That checkout was closed" : "Thank you"}</h1>
        <p className="mt-4 text-sm leading-relaxed text-[#b8a898]">
          {cancelled
            ? "Nothing was charged. You can use the same link again whenever you are ready, or ask your LifeCharter contact to send you a new one."
            : "Your payment went through. Your LifeCharter team will be in touch with your next steps."}
        </p>
        <p className="mt-6 text-xs text-[#b8a898]/80">
          Questions? Write to <a className="underline" href="mailto:support@lccommandsuite.com">support@lccommandsuite.com</a>.
        </p>
      </div>
    </main>
  );
}
