import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Sale & Service Agreement — LifeCharter Command Suite",
  description: "The Terms of Sale & Service Agreement governing LifeCharter Command Suite purchases.",
};

const H2 = "text-xl font-semibold text-[#F8F5F0] mt-10 mb-3";
const P = "text-[#b8a898] leading-relaxed mb-4";

export default function TermsOfSalePage() {
  return (
    <main className="min-h-screen bg-[#141826] text-[#F3EEE4]">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <a href="/" className="text-sm font-semibold text-[#E3C27C] hover:underline">
          &larr; Back to LifeCharter Command Suite
        </a>

        <p className="mt-8 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c9a227]">
          LifeCharter Command Suite
        </p>
        <h1 className="mt-2 text-3xl sm:text-4xl font-semibold text-[#F8F5F0]">
          Terms of Sale &amp; Service Agreement
        </h1>
        <p className="mt-3 text-sm text-[#b8a898]/70">Effective Date: October 1, 2026</p>

        <p className={`${P} mt-8`}>
          This Agreement is between Sacred Kaleidoscope Community LLC, doing business as LifeCharter Command Suite
          (&ldquo;Company,&rdquo; &ldquo;we,&rdquo; &ldquo;our,&rdquo; &ldquo;us&rdquo;) and the individual or
          business purchasing a LifeCharter Command Suite tier (&ldquo;Client,&rdquo; &ldquo;you&rdquo;).
        </p>

        <h2 className={H2}>1. Acceptance of Terms</h2>
        <p className={P}>
          By purchasing, registering for, or using LifeCharter Command Suite (the &ldquo;Suite&rdquo;), Client agrees
          to be bound by these Terms of Sale, the Year-1 Commitment Acknowledgment, and the Privacy Policy (together,
          the &ldquo;Agreement&rdquo;). If Client does not agree, Client may not purchase or use the Suite.
        </p>

        <h2 className={H2}>2. Description of Services</h2>
        <p className={P}>
          The Suite is a combined software platform and coaching program. Depending on Client&apos;s tier, it
          includes the LifeCharter Command Suite web application &mdash; a business command audit across 12 Business
          Dimensions and 8 Operational Pillars, planning tools, financial tracking, and AI-assisted daily operations
          &mdash; together with Architect-led coaching and community access (weekly community coaching, a weekly
          tech-support call, and a private community). Company offers three tiers, described below and at
          lccommandsuite.com.
        </p>
        <div className="my-6 overflow-x-auto rounded-2xl border border-[#F3EEE4]/12">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-[#1C2236]">
                <th className="px-4 py-3 font-semibold text-[#F8F5F0]">Tier</th>
                <th className="px-4 py-3 font-semibold text-[#F8F5F0]">Implementation Fee (one-time)</th>
                <th className="px-4 py-3 font-semibold text-[#F8F5F0]">Monthly Fee</th>
              </tr>
            </thead>
            <tbody className="text-[#b8a898]">
              <tr className="border-t border-[#F3EEE4]/10">
                <td className="px-4 py-3 font-semibold text-[#F8F5F0]">Starter</td>
                <td className="px-4 py-3">$2,497</td>
                <td className="px-4 py-3">$347/mo</td>
              </tr>
              <tr className="border-t border-[#F3EEE4]/10 bg-[#1C2236]/50">
                <td className="px-4 py-3 font-semibold text-[#F8F5F0]">Growth</td>
                <td className="px-4 py-3">$2,997</td>
                <td className="px-4 py-3">$497/mo</td>
              </tr>
              <tr className="border-t border-[#F3EEE4]/10">
                <td className="px-4 py-3 font-semibold text-[#F8F5F0]">VIP</td>
                <td className="px-4 py-3">$4,997</td>
                <td className="px-4 py-3">$997/mo</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2 className={H2}>3. Fees and Payment</h2>
        <p className={P}>
          3.1 Implementation Fee. Client pays the one-time Implementation Fee for the selected tier at the time of
          purchase. The Implementation Fee covers onboarding, initial setup of Client&apos;s workspace, and the start
          of the implementation period.
        </p>
        <p className={P}>
          3.2 Monthly Fee. Client&apos;s Monthly Fee begins approximately 30 days after the Implementation Fee is
          charged, once implementation is complete, and recurs monthly thereafter for the duration of this
          Agreement.
        </p>
        <p className={P}>
          3.3 Payment Method. Client authorizes Company to charge the payment method on file for the Implementation
          Fee and all recurring Monthly Fees until this Agreement ends in accordance with Section 4.
        </p>
        <p className={P}>
          3.4 Price Changes. Company may change Monthly Fees for future billing periods with at least 30 days&apos;
          notice. Price changes will not apply retroactively to fees already charged.
        </p>
        <p className={P}>
          3.5 LifeCharter Alumni Credit. A graduate of the LifeCharter Program who purchases a Command Suite tier within
          thirty (30) days of completing the LifeCharter Program receives a one-time credit of $500 toward the
          Implementation Fee. The credit has no cash value, cannot be combined with other discounts unless Company agrees,
          and does not change the non-refundable status of the Implementation Fee described in Section 5.
        </p>

        <h2 className={H2}>4. Year-1 Commitment</h2>
        <p className={P}>
          4.1 Term. By purchasing a tier, Client commits to twelve (12) consecutive months of Monthly Fee billing
          (the &ldquo;Year-1 Term&rdquo;), beginning on the date Client&apos;s first Monthly Fee is charged.
        </p>
        <p className={P}>
          4.2 Early Cancellation. If Client cancels before completing the Year-1 Term, Client will pay an early
          termination fee equal to the greater of (a) $500, or (b) fifty percent (50%) of the remaining Monthly Fees
          owed for the balance of the Year-1 Term, due immediately upon cancellation.
        </p>
        <p className={P}>
          4.3 After Year 1. Once the Year-1 Term is complete, this Agreement continues on a month-to-month basis
          until terminated in writing by either Client or Company, with at least forty-five (45) days&apos; advance
          notice (email to amilynne@amilynnecarroll.com is sufficient from Client&apos;s side).
        </p>

        <h2 className={H2}>5. Refund Policy</h2>
        <p className={P}>
          5.1 Implementation Fee. The Implementation Fee is non-refundable once implementation work has begun.
        </p>
        <p className={P}>
          5.2 Monthly Fees. Monthly Fees already charged are non-refundable. Client may cancel future Monthly Fee
          billing in accordance with Section 4.
        </p>

        <h2 className={H2}>6. Client Responsibilities</h2>
        <p className={P}>
          Client agrees to provide accurate information, use the Suite for lawful business purposes only, keep login
          credentials confidential, and participate in good faith in the implementation and coaching process.
        </p>

        <h2 className={H2}>7. Intellectual Property</h2>
        <p className={P}>
          The Suite, including its software, content, frameworks, and materials, is owned by Company and licensed
          &mdash; not sold &mdash; to Client for use during the term of this Agreement. Client retains all rights to
          Client&apos;s own business data entered into the Suite.
        </p>

        <h2 className={H2}>8. Confidentiality</h2>
        <p className={P}>
          Each party will keep confidential any non-public business information shared by the other party in
          connection with this Agreement, and will not disclose it except as needed to perform under this Agreement
          or as required by law.
        </p>

        <h2 className={H2}>9. Disclaimer of Warranties</h2>
        <p className={P}>
          The Suite and coaching services are provided &ldquo;as is.&rdquo; Company does not guarantee specific
          business results, revenue, or outcomes. Client&apos;s results depend on many factors outside Company&apos;s
          control, including Client&apos;s own effort and market conditions.
        </p>

        <h2 className={H2}>10. Limitation of Liability</h2>
        <p className={P}>
          To the maximum extent permitted by law, Company&apos;s total liability arising out of this Agreement will
          not exceed the amount Client paid to Company in the twelve (12) months preceding the claim. Company is not
          liable for indirect, incidental, or consequential damages.
        </p>

        <h2 className={H2}>11. Term and Termination</h2>
        <p className={P}>
          This Agreement begins on the date Client first purchases a tier and continues until terminated as
          described in Section 4. Company may suspend or terminate Client&apos;s access for material breach of this
          Agreement, including non-payment, after reasonable notice.
        </p>

        <h2 className={H2}>12. Governing Law</h2>
        <p className={P}>
          This Agreement is governed by the laws of the State of Colorado, without regard to conflict-of-law
          principles. Any dispute arising under this Agreement will be resolved in the state or federal courts
          located in Arapahoe County, Colorado.
        </p>

        <h2 className={H2}>13. Changes to These Terms</h2>
        <p className={P}>
          Company may update these Terms of Sale from time to time. Material changes will be communicated to active
          Clients by email. Continued use of the Suite after a change takes effect constitutes acceptance.
        </p>

        <h2 className={H2}>14. Contact and Notices</h2>
        <p className={P}>
          Questions about this Agreement can be sent to amilynne@amilynnecarroll.com. Formal legal notices under this
          Agreement should be sent to amilynne@amilynnecarroll.com, with a copy by mail to Sacred Kaleidoscope
          Community LLC, 5787 S Odessa St, Centennial, Colorado 80015.
        </p>

        <div className="mt-14 flex flex-wrap gap-6 border-t border-[#F3EEE4]/10 pt-6 text-sm">
          <a href="/legal/year-1-agreement" className="font-semibold text-[#E3C27C] hover:underline">
            Year-1 Commitment Acknowledgment &rarr;
          </a>
          <a href="/legal/privacy-policy" className="font-semibold text-[#E3C27C] hover:underline">
            Privacy Policy &rarr;
          </a>
        </div>
      </div>
    </main>
  );
}
