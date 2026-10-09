import { item } from "@/lib/scriptLibraryItem";
import type { LibraryItem } from "@/lib/scriptLibraryItem";

export const FOLLOWUP_MORE: LibraryItem[] = [
  item("Follow-up", "email", "template", "Second Follow-Up After Silence", "Use when your first nudge went unanswered and you want to check in again without any pressure.", "second follow-up, silence, check-in", `
Subject: Still happy to help with [topic]

Hi [First name],

I wanted to follow up on my note from [date] about [topic]. I know inboxes fill up fast, so please do not worry if it slipped by.

If it is still on your radar, I can send over [what you offered] or find a short time to talk on [day] or [day]. If the timing is not right, just let me know and I will gladly step back.

Either way, I am glad we connected.

Warm regards,
[Your name]
`),

  item("Follow-up", "email", "template", "Third and Final Follow-Up", "Use as the last gentle message in a sequence so the person feels free to reply or to close the loop.", "final follow-up, closing the loop, sequence", `
Subject: Closing the loop on [topic]

Hi [First name],

This will be my last note about [topic], since I do not want to crowd your inbox. I have reached out a couple of times and understand that priorities shift.

If you would like to pick this up, reply with a quick yes and I will send [next step]. If now is not the moment, that is completely fine, and you are welcome to reach out whenever things change.

Thank you for your time, and I wish you well with [their goal or project].

Kind regards,
[Your name]
`),

  item("Follow-up", "email", "template", "After a Referral Introduction", "Use when someone has introduced you to a new contact and you want to take the next step promptly and graciously.", "referral, introduction, new contact", `
Subject: Nice to meet you, thanks to [Referrer name]

Hi [First name],

[Referrer name] kindly introduced us, and I wanted to say hello. They mentioned you are working on [their goal or challenge], and I would enjoy hearing more about it.

If it would be useful, I am happy to have a short call on [day] or [day], or to simply send a few ideas by email first. Whichever suits you best is fine with me.

If this is not the right time, no problem at all. It is good to know you.

Warm regards,
[Your name]
`),

  item("Follow-up", "email", "template", "After Sending an Invoice", "Use a day or two after an invoice goes out to confirm it arrived and make paying simple.", "invoice, payment, confirmation", `
Subject: Your invoice for [project or service]

Hi [First name],

I wanted to make sure invoice [invoice number] for [amount] reached you safely. It covers [what it is for] and is due on [due date].

You can pay by [payment method or link]. If you need a different format, a purchase order number added, or have any questions about the details, just reply and I will sort it out right away.

Thank you again for the opportunity to work together.

Warm regards,
[Your name]
`),

  item("Follow-up", "email", "template", "Overdue Invoice, Firm but Kind", "Use when an invoice is past due and you need a clear request that still protects the relationship.", "overdue invoice, payment, firm but kind", `
Subject: Invoice [invoice number] is now past due

Hi [First name],

I am following up on invoice [invoice number] for [amount], which was due on [due date] and has not yet been received. I know things can get missed, so I wanted to bring it to your attention.

Could you please arrange payment by [new date]? The payment link is here: [payment link]. If something is holding it up, or you would like to talk about a payment plan, please tell me and we will find a way forward.

Thank you for taking care of this.

Kind regards,
[Your name]
`),

  item("Follow-up", "email", "template", "After a Networking Coffee", "Use within a day of meeting someone for coffee to thank them and offer one simple way to stay in touch.", "networking, coffee, thank you", `
Subject: Great to meet you, [First name]

Hi [First name],

Thank you for the conversation over coffee on [day]. I really enjoyed hearing about [something they shared], and it gave me a fresh perspective on [topic].

As promised, here is [resource, article or introduction you mentioned]. If there is anyone in my network who would be helpful to you, I would be glad to make an introduction.

I would love to stay in touch. Shall we catch up again in [timeframe]? No pressure either way.

Warm regards,
[Your name]
`),

  item("Follow-up", "email", "template", "After a Free Training You Attended", "Use the day after someone attended your free training or MasterClass to thank them and offer a clear next step.", "free training, attendee, next step", `
Subject: Thank you for joining [training name]

Hi [First name],

Thank you for being part of [training name] on [date]. I hope the section on [key topic] gave you something useful to try this week.

If you would like to go deeper, the next step is [next step], and you can find it here: [link]. I am also happy to answer any questions you thought of afterwards, just reply to this email.

If it is not the right time, that is perfectly fine. I am glad you came.

Warm regards,
[Your name]
`),

  item("Follow-up", "email", "template", "Free Training Replay for Those Who Missed It", "Use to send the replay to registrants who could not attend live, with an easy invitation to watch and respond.", "replay, free training, registrants", `
Subject: Your replay of [training name] is ready

Hi [First name],

We missed you at [training name], but life gets busy, so I have saved a replay for you. You can watch it at your own pace here: [replay link]. It is available until [date].

If you only have a few minutes, start at [timestamp], where I cover [key topic]. When you have watched it, I would love to hear your thoughts or questions.

If this is no longer a priority, no worries at all.

Warm regards,
[Your name]
`),

  item("Follow-up", "email", "template", "After a Sales Call That Ended in Maybe", "Use after a conversation where the person was interested but unsure, to ask what would help them decide.", "maybe, decision, objections", `
Subject: Following up on our conversation

Hi [First name],

Thank you for speaking with me on [date]. It sounded like [their goal] matters a lot to you, and that you are still weighing a few things before deciding on [offer].

Is there anything I can clarify, such as [common question], [common question], or how the first month would look? I am glad to answer honestly, even if the answer helps you decide it is not a fit.

If you would like, we can talk again on [day]. Otherwise, take the time you need.

Warm regards,
[Your name]
`),

  item("Follow-up", "email", "template", "After a No, With Permission to Check Back", "Use to thank someone for a clear no and ask if they would welcome a future check-in.", "no, check back, permission", `
Subject: Thank you for being straightforward

Hi [First name],

Thank you for letting me know that [offer] is not the right fit for now. I really appreciate a clear answer, and I respect your decision.

Would it be all right if I checked in again around [month or timeframe] to see whether anything has changed? If you would rather I did not, just say so and I will not follow up.

I wish you every success with [their goal or project].

Kind regards,
[Your name]
`),

  item("Follow-up", "email", "template", "After a Proposal Expires", "Use when a proposal's valid-through date has passed and you want to offer to refresh it or let it go gracefully.", "proposal, expired, refresh offer", `
Subject: Your proposal for [project name]

Hi [First name],

The proposal I sent on [date] reached its end date on [expiry date]. I did not want it to simply fade away without checking in.

If you are still interested, I am happy to refresh it with updated timing and details so it reflects where things stand today. Just reply with a yes and I will send it over by [date].

If your plans have changed, that is completely fine. Thank you for considering working together.

Warm regards,
[Your name]
`),

  item("Follow-up", "email", "template", "Check-In Two Weeks After a Project Ends", "Use two weeks after delivery to see how things are going, gather feedback and keep the door open.", "project end, check-in, feedback", `
Subject: How is [project name] going?

Hi [First name],

It has been about two weeks since we wrapped up [project name], and I wanted to check in. How are things working so far, and is there anything that needs a small adjustment?

If you have a minute, I would also value honest feedback on what was most helpful and what I could do better: [feedback link].

When you are ready for a next step, or just a quick question, I am only an email away.

Warm regards,
[Your name]
`),

  item("Follow-up", "dm", "template", "Text After Leaving a Voicemail", "Use right after a voicemail to make it easy for the person to reply by text instead of calling back.", "text, voicemail, quick reply", `
Hi [First name], it is [Your name] from [Business name]. I just left you a voicemail about [reason for call]. No need to call back if texting is easier. Is there a good time this week for a quick chat, or would you rather I send the details here? Whatever suits you is fine.
`),

  item("Follow-up", "dm", "template", "Asking for a Decision Date", "Use to gently ask when someone expects to decide, so you can plan without pushing them.", "decision date, timeline, text", `
Hi [First name], thanks again for considering [offer]. I know decisions take time. Do you have a rough date in mind for when you might decide? That helps me hold space for you, and I am happy to check back on [date]. If the answer is no, that is fine too.
`),

  item("Follow-up", "dm", "template", "Message After Meeting on a Podcast or Panel", "Use within a day or two of sharing a podcast or panel with someone to turn the connection into a relationship.", "podcast, panel, new connection", `
Hi [First name], I really enjoyed sharing the [podcast or panel name] conversation with you. Your point about [something they said] stayed with me. I would love to continue the conversation over a short call sometime, if you are open to it. No pressure, and thank you again.
`),

  item("Follow-up", "dm", "template", "Thank-You Note After a Referral", "Use to thank someone promptly for referring a person to you, whether or not the referral becomes a client.", "referral, thank you, gratitude", `
Hi [First name], thank you so much for referring [Referred person] to me. It means a great deal that you thought of me. I will take good care of them and let you know how it goes. If I can ever return the favour, please tell me.
`),

  item("Follow-up", "sales", "script", "When a Client Goes Quiet Mid-Engagement", "Use as a call or voicemail script when an active client has stopped responding and you want to reconnect with care.", "client quiet, mid-project, check-in call", `
(Call, smile, keep your tone relaxed.)

Hi [First name], it is [Your name] from [Business name]. I am calling to check in on [project name]. I have not heard from you since [date], and I wanted to make sure everything is all right on your end.

(Pause for response.)

If now is a busy season, that is completely fine. We can pause or adjust the timeline. What would be most helpful for you right now?

(If voicemail:) Please call or text me at [phone] when you have a moment. I am happy to work around your schedule. Talk soon.
`),

  item("Follow-up", "sales", "script", "Follow-Up Call After Sending a Quote", "Use as a short call script a few days after sending a quote, to answer questions and ask for a clear next step.", "quote, follow-up call, next step", `
(Call, friendly and unhurried.)

Hi [First name], it is [Your name] from [Business name]. I sent over the quote for [project or service] on [date] and wanted to see whether you had a chance to look it over.

(Pause.)

Do you have any questions about the scope, the timing or the [amount]? I am happy to adjust where I can.

(Pause.)

What would you like the next step to be? We can go ahead, talk again on [date], or leave it here if it is not right for you. Any answer is fine.
`),
];
