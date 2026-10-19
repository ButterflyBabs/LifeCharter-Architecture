import type { Metadata } from "next";
import { LEGAL_PAGES } from "@/lib/legalDates";

export const metadata: Metadata = {
  title: "Text Messaging Terms — LifeCharter Command Suite",
  description: "How text message reminders work in LifeCharter Command Suite: who sends them, how often, what they cost, and how to stop them.",
};

const EFFECTIVE = LEGAL_PAGES["text-messaging-terms"].effective;
const UPDATED = LEGAL_PAGES["text-messaging-terms"].updated;

const H2 = "font-editorial text-[26px] font-semibold leading-tight text-[#1F2B3A] mt-10 mb-3";
const P = "text-[16px] text-[#2E3A46] leading-relaxed mb-4";

export default function TextMessagingTermsPage() {
  return (
    <main className="min-h-screen bg-[#FAF8F3] font-ui text-[#1F2B3A]">
      <div className="mx-auto max-w-3xl px-5 py-12 sm:px-6 sm:py-16">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#A8873F]">LifeCharter Command Suite</p>
        <h1 className="mt-2 font-editorial text-[40px] font-semibold leading-[1.1] sm:text-[48px]">Text Messaging Terms</h1>
        <p className="mt-2 text-[14px] text-[#7F8894]">Effective {EFFECTIVE} · Last updated {UPDATED}</p>

        <p className={`${P} mt-8 text-[17px]`}>
          LifeCharter Command Suite is business software made by Sacred Kaleidoscope Community LLC, doing business as LifeCharter
          (&ldquo;LifeCharter,&rdquo; &ldquo;we&rdquo;). Businesses that use it, including LifeCharter itself, can offer appointment
          reminder text messages to the people who book with them. These terms explain how those texts work. They are separate from, and
          in addition to, our <a className="text-[#A8873F] underline" href="/legal/privacy-policy">Privacy Policy</a>.
        </p>

        <h2 className={H2}>What the texts are</h2>
        <p className={P}>
          Appointment reminders and replies to your own questions about a booking you made. You get a reminder the day before and
          another about an hour before your appointment. A text we send is never advertising or a sales message.
        </p>

        <h2 className={H2}>How you agree</h2>
        <p className={P}>
          You agree by ticking an unticked box on the business&rsquo;s online booking page, next to your phone number. The box says:
          &ldquo;Text me reminders about this booking from [business name]. Up to 2 texts per booking. Msg &amp; data rates may apply.
          Reply STOP to opt out, HELP for help.&rdquo; Agreeing to texts is optional and is never a condition of booking or buying
          anything. If you do not tick the box, you get no texts.
        </p>

        <h2 className={H2}>How often</h2>
        <p className={P}>Up to 2 reminder texts for each booking, plus replies when you text the business a question.</p>

        <h2 className={H2}>Cost</h2>
        <p className={P}>
          We do not charge you for these texts. Message and data rates from your mobile carrier may apply, depending on your plan.
        </p>

        <h2 className={H2}>Stop, restart and help</h2>
        <p className={P}>
          Reply <strong>STOP</strong> to any text at any time and you will get one message confirming that you are unsubscribed, then no
          more texts. Reply <strong>START</strong> to turn them back on. Reply <strong>HELP</strong> for help.
        </p>

        <h2 className={H2}>Customer care</h2>
        <p className={P}>
          For help with your texts, email <a className="text-[#A8873F] underline" href="mailto:support@lccommandsuite.com">support@lccommandsuite.com</a>.
          We answer within 24 hours on business days, Monday to Friday, 9am to 5pm Mountain Time. You can also write to Sacred
          Kaleidoscope Community LLC, 5787 S Odessa Street, Centennial, CO 80015.
        </p>

        <h2 className={H2}>Your phone number and privacy</h2>
        <p className={P}>
          We use your mobile number only to send the texts described above and to answer you. We do not sell, rent or share mobile
          numbers or text-message consent with third parties or affiliates for their marketing or promotional purposes. We share
          information only with the service providers that deliver the texts for us, as described in our Privacy Policy.
        </p>

        <h2 className={H2}>Good to know</h2>
        <p className={P}>
          Texts are sent to US mobile numbers. Carriers are not liable for delayed or undelivered messages, and delivery is not
          guaranteed. You are responsible for telling us if your phone number changes. We may update these terms; the date above shows
          the latest version.
        </p>
      </div>
    </main>
  );
}
