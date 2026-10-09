import { item } from "@/lib/scriptLibraryItem";
import type { LibraryItem } from "@/lib/scriptLibraryItem";

export const ONBOARDING_MORE: LibraryItem[] = [
  item("Onboarding", "email", "template", "Contract Signed Confirmation", "Send the moment a client signs, so they know the agreement is safely on file and what happens next.", "contract, confirmation, new client", `
Subject: Your signed agreement is on file

Hi [First name],

Thank you for signing. I have received your agreement for [service name], and a copy is attached to this email so you have it for your records.

Here is what happens next:

1. You will receive a short welcome message with everything you need to get started.
2. I will send a link to book your first session.
3. If anything in the agreement needs a second look, reply here and we will sort it out together.

Your start date is [start date], and I am looking forward to getting going with you.

If you have any questions at all, just reply to this email. I read every message myself.

Warm regards,
[Your name]
[Business name]
`),

  item("Onboarding", "email", "template", "Payment Received Receipt Note", "Send after a payment lands to confirm the amount, what it covers and when the next one is due.", "payment, receipt, billing", `
Subject: Payment received, thank you

Hi [First name],

This is a quick note to confirm that I have received your payment of [price] for [service name], dated [payment date].

Here is a summary for your records:

Payment covers: [what the payment covers]
Reference number: [invoice number]
Next payment due: [next due date, or "none, you are paid in full"]

Your receipt is attached. If you need it made out to a different name or company, reply with the details and I will send a corrected copy.

Thank you for taking care of this so promptly. It makes the start of our work together very smooth.

Kind regards,
[Your name]
[Business name]
`),

  item("Onboarding", "email", "template", "How to Book Your Sessions", "Give new clients clear, simple steps for booking and managing their own session times.", "booking, scheduling, how-to", `
Subject: How to book your sessions

Hi [First name],

Here is how booking works, so you never have to wonder what to do next.

1. Open your booking link: [your booking link]
2. Choose the session type that matches what we have agreed: [session type].
3. Pick a day and time that suits you. The times shown are in your local time zone.
4. You will receive a confirmation email with a calendar invitation and the meeting details straight away.

If you need to move a session, use the link in your confirmation email. If none of the times shown work for you, reply to this email and I will find something that does.

I suggest booking your next two sessions now, while your calendar is in front of you.

Warm regards,
[Your name]
`),

  item("Onboarding", "email", "template", "What to Prepare Before Session One", "Help a new client arrive at the first session ready, calm and clear on what to bring.", "preparation, first session, checklist", `
Subject: Getting ready for our first session on [date]

Hi [First name],

Our first session is on [date] at [time]. There is nothing you need to study, but a little preparation will help us make the most of the time.

Please bring:

1. A short list of what you most want to change or achieve in the next [number] months.
2. Any documents or examples that show where things stand today, such as [relevant documents].
3. Two or three questions you would like answered.
4. A quiet spot, a notebook, and a few minutes beforehand to settle in.

The meeting details are here: [meeting link or address].

It is perfectly fine if your answers are rough. We will shape them together on the day.

If anything comes up before then, reply to this email and I will help.

See you soon,
[Your name]
`),

  item("Onboarding", "dm", "template", "Welcome Text Message", "A short, friendly text to send right after sign-up so a new client feels welcomed and knows you are reachable.", "welcome, text message, first contact", `
Hi [First name], it is [Your name] from [Business name]. I am so glad you have joined us. I have just sent a welcome email with your next steps, so please keep an eye on your inbox (and junk folder, just in case). If anything is unclear, a quick text here is fine. Talk soon.
`),

  item("Onboarding", "email", "template", "Client Portal or Shared Folder Invite", "Invite a client into your shared folder or portal and explain what lives there and how to get in.", "portal, shared folder, access", `
Subject: Your shared folder is ready

Hi [First name],

I have set up a shared space for our work together. You can open it here: [portal or folder link]

Inside you will find:

1. Agreements and invoices, kept in one place.
2. Session notes and recaps, added after each meeting.
3. Resources and worksheets for the work we are doing.
4. A place to upload anything you would like me to see.

To sign in, use this email address: [client email]. If you are asked to create a password, choose one that only you know, and please do not send it to me.

If the link does not open for you, reply and tell me what you see on screen. I will fix it quickly.

Warm regards,
[Your name]
`),

  item("Onboarding", "email", "template", "Communication Preferences and Response Times", "Agree how and when you will be in touch, and how quickly each of you can expect a reply.", "communication, expectations, response times", `
Subject: How we will stay in touch

Hi [First name],

So that we both know what to expect, here is how I usually communicate.

Best way to reach me: [email, phone or portal]
Replies: within [number] business days
My working hours: [days and hours] in [time zone]
Urgent matters: [how to flag something urgent]

I would also like to know what suits you. Please reply and tell me:

1. Which channel you prefer for quick questions.
2. The days and times you are usually easiest to reach.
3. Anything that makes communication easier for you, such as shorter messages, written summaries or a phone call instead of video.

I will make a note of your answers and follow them.

Kind regards,
[Your name]
`),

  item("Onboarding", "sales", "script", "Setting Goals Together Call Guide", "A call structure for agreeing clear, measurable goals with a new client in the first or second session.", "goals, planning, session guide", `
(Open warmly and confirm how much time you have.)

"Thank you for making the time, [First name]. Today we are going to decide what success looks like for you, so that everything we do has a clear purpose."

(Step 1, the big picture, about 10 minutes)
"If we looked back in [number] months and you were delighted, what would have changed?"

(Step 2, make it specific, about 10 minutes)
"How would we know it had happened? What would we see, count or feel?"

(Step 3, choose the priorities, about 10 minutes)
"If we could only achieve three of these, which would matter most?"

(Step 4, first steps, about 5 minutes)
"What is one small action you could take this week for each goal?"

(Close)
"I will write these up and send them today. Please read them and tell me if anything feels wrong. We will review them at every session."

(Note the goals, the measures and the dates in the client record.)
`),

  item("Onboarding", "email", "template", "Session Recap Email", "Send within a day of each session to confirm what was covered, what was decided and what happens next.", "recap, session notes, follow-up", `
Subject: Recap of our session on [date]

Hi [First name],

Thank you for today. Here is a short record of what we covered, so nothing gets lost.

What we discussed:
[Main topic one]
[Main topic two]

What we decided:
[Decision or agreement]

Your next steps, to complete by [date]:
1. [Action step one]
2. [Action step two]

My next steps:
1. [Your action step]

Our next session is on [date] at [time]. If anything in this recap does not match your memory of the conversation, reply and I will correct it.

Well done on the work you put in today.

Warm regards,
[Your name]
`),

  item("Onboarding", "sales", "script", "Mid-Point Review Call, Day 60", "A structured call about two months in to check progress, adjust the plan and keep momentum going.", "review call, day 60, progress", `
(Open: set the tone and the time.)

"Thanks for joining, [First name]. We are about halfway through, so today is for looking at what is working and what we should change. It should take about [number] minutes."

(Part 1, progress)
"Looking back at the goals we set, where do you feel you have moved forward most?"
(Share the measures you have tracked and name two clear wins.)

(Part 2, obstacles)
"What has been harder than you expected? What has gotten in the way?"

(Part 3, adjustments)
"Is there anything we should do more of, less of, or differently for the second half?"
(Offer one or two options and let the client choose.)

(Part 4, commitments)
"Which two priorities will we focus on until the end of our work together?"

(Close)
"I will send an updated plan today. Thank you for being so open."

(Record any changes to the goals, the schedule or the scope.)
`),

  item("Onboarding", "sales", "script", "End-of-Engagement Wrap-Up Call", "A closing call that reviews results, captures lessons and gently opens the conversation about what comes next.", "wrap-up, closing call, results", `
(Open: mark the occasion.)

"Welcome, [First name]. This is our final scheduled session, so I would like us to review everything you have achieved and decide what comes next."

(Part 1, results)
"Let us look at the goals you set on day one. What has changed?"
(Show the before and after, using the client's own words wherever you can.)

(Part 2, lessons)
"What has made the biggest difference to you? What would you tell someone starting out?"

(Part 3, what is still open)
"What would you like to keep working on, and how will you do that from here?"

(Part 4, next steps, no pressure)
"There are a few ways to continue: [option one], [option two], or simply carrying on independently. Which feels right?"

(Close)
"Thank you for trusting me with this. I will send a summary and your offboarding details today."

(Note the follow-up decision and send the offboarding email.)
`),

  item("Onboarding", "email", "template", "Offboarding and Next Steps Email", "Close out an engagement cleanly, with a summary, what the client keeps and how to stay in touch.", "offboarding, wrap-up, next steps", `
Subject: Wrapping up, and what happens next

Hi [First name],

It has been a pleasure working with you. As our engagement comes to a close on [end date], here is a short summary of what happens next.

What you keep:
1. All session recaps and resources in your shared folder, available until [date].
2. Your final plan: [link to plan].

What I will do:
1. Close your file and remove your access on [date].
2. Send a short check-in message in [number] weeks, to see how things are going.

If you would like to continue, work with me again or simply ask a question later, just reply to this email. The door is open.

Thank you again for your trust and effort.

Warm regards,
[Your name]
[Business name]
`),

  item("Onboarding", "email", "template", "Testimonial Request at the Right Moment", "Ask for feedback right after a clear win, when the client's results and enthusiasm are fresh.", "testimonial, feedback, social proof", `
Subject: Would you share a few words?

Hi [First name],

Congratulations on [specific result]. It has been wonderful to see how far you have come.

Would you be willing to share a few words about your experience? A testimonial helps other people decide whether we might be the right fit for them.

To make it easy, here are a few prompts. Answer any that feel right:

1. What was the situation before we started working together?
2. What changed?
3. What would you say to someone thinking about working with me?

You can reply to this email, or use this form: [feedback form link]. A few sentences is plenty.

Please tell me if I may use your name and photo, or if you would prefer to stay anonymous.

Thank you so much,
[Your name]
`),

  item("Onboarding", "email", "template", "Referral Ask at the End", "Invite a happy client to introduce someone who could benefit, without pressure.", "referral, introductions, end of engagement", `
Subject: Someone you know?

Hi [First name],

Thank you for being such a great person to work with. I am delighted with the progress you have made.

I only work with a small number of clients at a time, and most of them come through people they trust. If someone comes to mind who is facing a similar challenge, I would be glad to hear from them.

You could:

1. Forward them this email.
2. Share my booking link: [your booking link].
3. Send me their name and email, with their permission, and I will reach out gently.

There is no obligation at all. I simply wanted you to know the introduction would be welcome.

[Optional: describe any thank-you gesture here.]

With appreciation,
[Your name]
`),

  item("Onboarding", "email", "template", "Rescheduling and Cancellation Policy Reminder", "A friendly, clear reminder of how changes to booked sessions work, sent at the start or before a session.", "policy, rescheduling, cancellation", `
Subject: A quick reminder about changing a session

Hi [First name],

Life gets busy, and plans change. So that we both know what to expect, here is a short reminder of how rescheduling works.

1. To move a session, please give at least [number] hours of notice. Use the link in your confirmation email, or reply here.
2. Sessions moved with enough notice can be rebooked at no cost within [number] days.
3. Sessions cancelled with less notice, or missed, may be counted as used. This is explained in your agreement under [section name].
4. If something unexpected happens, please contact me. I will always try to be fair.

Your next session is on [date] at [time].

Thank you for helping me protect the time we have set aside for you.

Kind regards,
[Your name]
`),

  item("Onboarding", "email", "template", "Accessibility and Accommodation Check-In", "Ask new clients how they prefer to communicate and meet so every session works well for them.", "accessibility, preferences, inclusion", `
Subject: Making our sessions work well for you

Hi [First name],

Before we begin, I would like to make sure our sessions suit you. Everyone works differently, so please tell me whatever is helpful. You do not need to give reasons.

1. How do you prefer to meet? For example, video, phone call, in person or written messages.
2. Would you like materials sent in advance, in a particular format, such as large print, plain text or audio?
3. Do you need longer sessions, shorter sessions or built-in breaks?
4. Is there a time of day when you do your best thinking?
5. Is there anything else I should know to make meetings comfortable?

Reply in your own words, or call me if that is easier. I will keep your answers private and set everything up accordingly.

Warm regards,
[Your name]
`),

  item("Onboarding", "sales", "script", "Stalled Client Troubleshooting Call", "A supportive conversation for a client who has gone quiet or stopped making progress, to find the real blocker.", "stalled client, re-engage, check-in", `
(Open kindly. Do not start with what they have missed.)

"Hi [First name], thank you for making time. I wanted to check in, because I have noticed things have gone quiet. I am not here to judge, only to help."

(Listen first)
"How have the last few weeks been for you?"
(Pause. Let them answer fully before you respond.)

(Find the blocker)
"What has been getting in the way? Is it time, priorities, confidence, or something about how we are working together?"

(Reflect back)
"So what I am hearing is [summary]. Is that right?"

(Reset)
"What would make it easier to move forward? Would a smaller step, a different schedule or a shorter session help?"

(Agree one action)
"What is one small thing you can do before our next call?"

(Close)
"Thank you for being honest. I will send you a short summary and we will take it from there."

(Record the blocker and the agreed adjustment.)
`),

  item("Onboarding", "dm", "template", "Celebrating a First Win Message", "A quick message that marks a client's first real milestone and builds confidence.", "first win, celebration, encouragement", `
Hi [First name], I just saw that you [first win]. That is a real milestone, and it came from the effort you have put in. Please take a moment to enjoy it. I am proud of you, and I cannot wait to hear how it felt. Shall we build on it at our next session on [date]?
`),
];
