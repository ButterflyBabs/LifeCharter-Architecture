import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — LifeCharter Command Suite",
  description: "How LifeCharter Command Suite collects, uses, and protects your information.",
};

const H2 = "text-xl font-semibold text-[#F8F5F0] mt-10 mb-3";
const P = "text-[#b8a898] leading-relaxed mb-4";
const LI = "flex gap-3";
const DOT = "mt-1 text-[#c9a227]";

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[#141826] text-[#F3EEE4]">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <a href="/" className="text-sm font-semibold text-[#E3C27C] hover:underline">
          &larr; Back to LifeCharter Command Suite
        </a>

        <p className="mt-8 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c9a227]">
          LifeCharter Command Suite
        </p>
        <h1 className="mt-2 text-3xl sm:text-4xl font-semibold text-[#F8F5F0]">Privacy Policy</h1>
        <p className="mt-3 text-sm text-[#b8a898]/70">Effective Date: October 1, 2026</p>

        <p className={`${P} mt-8`}>
          This Privacy Policy explains how Sacred Kaleidoscope Community LLC, doing business as LifeCharter Command
          Suite (&ldquo;Company,&rdquo; &ldquo;we,&rdquo; &ldquo;us&rdquo;), collects, uses, and protects information
          when you visit our websites (including lccommandsuite.com and our MasterClass, Challenge, and assessment
          pages) or use the LifeCharter Command Suite platform.
        </p>

        <h2 className={H2}>1. Information We Collect</h2>
        <ul className="space-y-3 text-[#b8a898] leading-relaxed mb-4">
          <li className={LI}><span className={DOT}>&#9679;</span><span>Contact information you provide: name, email, phone number, and business details, submitted through registration, assessment, booking, or account forms.</span></li>
          <li className={LI}><span className={DOT}>&#9679;</span><span>Account and business data you enter into the Suite: your business information, planning data, financial data you choose to track, and content you create within the platform.</span></li>
          <li className={LI}><span className={DOT}>&#9679;</span><span>Payment information: processed directly by Stripe, our payment processor &mdash; we do not store your full card number.</span></li>
          <li className={LI}><span className={DOT}>&#9679;</span><span>Usage information: pages visited, features used, and similar analytics collected automatically, including through the Meta Pixel for ad measurement.</span></li>
          <li className={LI}><span className={DOT}>&#9679;</span><span>Communications: information from emails, calls, or messages you send us.</span></li>
        </ul>

        <h2 className={H2}>2. How We Use Information</h2>
        <p className={P}>We use the information we collect to:</p>
        <ul className="space-y-3 text-[#b8a898] leading-relaxed mb-4">
          <li className={LI}><span className={DOT}>&#9679;</span><span>Provide and improve the Suite and coaching services</span></li>
          <li className={LI}><span className={DOT}>&#9679;</span><span>Process payments and manage billing</span></li>
          <li className={LI}><span className={DOT}>&#9679;</span><span>Send confirmations, reminders, and program-related communications (MasterClass, Challenge, onboarding, coaching)</span></li>
          <li className={LI}><span className={DOT}>&#9679;</span><span>Personalize your experience within the Suite</span></li>
          <li className={LI}><span className={DOT}>&#9679;</span><span>Communicate with you about your account or our offerings</span></li>
          <li className={LI}><span className={DOT}>&#9679;</span><span>Measure and improve our marketing, including ad performance</span></li>
        </ul>

        <h2 className={H2}>3. How We Share Information</h2>
        <p className={P}>We do not sell your personal information. We share information with:</p>
        <ul className="space-y-3 text-[#b8a898] leading-relaxed mb-4">
          <li className={LI}><span className={DOT}>&#9679;</span><span>Service providers who help us operate the Suite, including Supabase (hosting/database), Stripe (payment processing), Global Control (CRM/communications), Vercel (hosting), and similar providers, each bound to use your information only to provide services to us.</span></li>
          <li className={LI}><span className={DOT}>&#9679;</span><span>As required by law, or to protect our rights, safety, or property.</span></li>
          <li className={LI}><span className={DOT}>&#9679;</span><span>With your consent, or at your direction.</span></li>
        </ul>

        <h2 className={H2}>4. Cookies and Tracking</h2>
        <p className={P}>
          Our websites use cookies and similar technologies, including the Meta Pixel, to understand how visitors use
          our site and to measure the performance of our advertising. You can control cookies through your browser
          settings.
        </p>

        <h2 className={H2}>5. Data Retention</h2>
        <p className={P}>
          We retain information for as long as needed to provide the Suite, fulfill the purposes described in this
          Policy, and comply with our legal obligations.
        </p>

        <h2 className={H2}>6. Your Choices</h2>
        <p className={P}>
          You can request to access, correct, or delete your personal information, or unsubscribe from marketing
          emails at any time, by contacting amilynne@amilynnecarroll.com.
        </p>

        <h2 className={H2}>7. Data Security</h2>
        <p className={P}>
          We use reasonable administrative, technical, and physical safeguards to protect your information. No
          method of transmission or storage is completely secure, and we cannot guarantee absolute security.
        </p>

        <h2 className={H2}>8. Children&apos;s Privacy</h2>
        <p className={P}>
          The Suite is not directed to children under 18, and we do not knowingly collect information from children.
        </p>

        <h2 className={H2}>9. Changes to This Policy</h2>
        <p className={P}>
          We may update this Privacy Policy from time to time. Material changes will be posted on this page with an
          updated effective date.
        </p>

        <h2 className={H2}>10. Contact Us</h2>
        <p className={P}>
          Questions about this Privacy Policy can be sent to amilynne@amilynnecarroll.com, or by mail to Sacred
          Kaleidoscope Community LLC, 5787 S Odessa St, Centennial, Colorado 80015.
        </p>

        <div className="mt-14 flex flex-wrap gap-6 border-t border-[#F3EEE4]/10 pt-6 text-sm">
          <a href="/legal/terms-of-sale" className="font-semibold text-[#E3C27C] hover:underline">
            Terms of Sale &rarr;
          </a>
          <a href="/legal/year-1-agreement" className="font-semibold text-[#E3C27C] hover:underline">
            Year-1 Commitment Acknowledgment &rarr;
          </a>
        </div>
      </div>
    </main>
  );
}
