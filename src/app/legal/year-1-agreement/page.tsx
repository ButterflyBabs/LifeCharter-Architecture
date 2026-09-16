import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Year-1 Commitment Acknowledgment — LifeCharter Command Suite",
  description: "What you're agreeing to when you start your first year with LifeCharter Command Suite.",
};

export default function Year1AgreementPage() {
  return (
    <main className="min-h-screen bg-[#141826] text-[#F3EEE4]">
      <div className="mx-auto max-w-2xl px-6 py-16">
        <a href="/" className="text-sm font-semibold text-[#E3C27C] hover:underline">
          &larr; Back to LifeCharter Command Suite
        </a>

        <p className="mt-8 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c9a227]">
          LifeCharter Command Suite
        </p>
        <h1 className="mt-2 text-3xl sm:text-4xl font-semibold text-[#F8F5F0]">
          Year-1 Commitment Acknowledgment
        </h1>
        <p className="mt-3 text-sm text-[#b8a898]/70">Effective Date: October 1, 2026</p>

        <p className="mt-8 text-[#b8a898] leading-relaxed">
          Before you get started with LifeCharter Command Suite, please read and acknowledge the following. This is
          a short summary of Section 4 of our full{" "}
          <a href="/legal/terms-of-sale" className="font-semibold text-[#E3C27C] hover:underline">
            Terms of Sale &amp; Service Agreement
          </a>{" "}
          &mdash; both apply to your purchase, and if anything here and the full Terms of Sale ever conflict, the
          full Terms of Sale governs.
        </p>

        <ul className="mt-8 space-y-4 text-[#b8a898] leading-relaxed">
          <li className="flex gap-3">
            <span className="mt-1 text-[#c9a227]">&#9679;</span>
            <span>Your Implementation Fee is charged today and covers your onboarding and setup.</span>
          </li>
          <li className="flex gap-3">
            <span className="mt-1 text-[#c9a227]">&#9679;</span>
            <span>
              Your Monthly Fee begins about 30 days after your Implementation Fee, once your implementation is
              complete.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="mt-1 text-[#c9a227]">&#9679;</span>
            <span>
              Once your Monthly Fee begins, you&apos;re committing to 12 consecutive months of billing at your
              tier&apos;s rate &mdash; your &ldquo;Year-1 Term.&rdquo;
            </span>
          </li>
          <li className="flex gap-3">
            <span className="mt-1 text-[#c9a227]">&#9679;</span>
            <span>
              If you cancel before your Year-1 Term is complete, you&apos;ll pay an early-termination fee equal to
              whichever is greater: $500, or 50% of the remaining months&apos; fees owed for the rest of your Year-1
              Term.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="mt-1 text-[#c9a227]">&#9679;</span>
            <span>
              After your Year-1 Term, your plan continues month-to-month until either of us ends it in writing with
              45 days&apos; advance notice.
            </span>
          </li>
        </ul>

        <div className="mt-12 rounded-2xl border border-[#c9a227]/40 bg-[#1C2236] p-6">
          <label className="flex items-start gap-3 text-[#F8F5F0] font-medium">
            <input type="checkbox" className="mt-1" disabled />
            I have read and agree to this Year-1 Commitment.
          </label>
        </div>

        <p className="mt-10 text-sm text-[#b8a898]/70">
          Questions? Reach us at amilynne@amilynnecarroll.com.
        </p>
      </div>
    </main>
  );
}
