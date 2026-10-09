import { item } from "@/lib/scriptLibraryItem";
import type { LibraryItem } from "@/lib/scriptLibraryItem";

export const SALES_MORE: LibraryItem[] = [
  item("Sales", "sales", "script", "Pricing Conversation Script", "Use when a prospect is ready to hear what working with you costs and you want to share it clearly and calmly.", "pricing, fees, sales call", `
OPEN (1 min):
"Hi [Name], thanks for the time today. Now that we have talked about [their goal], would it help if I share how the investment works?"

SHARE (2 min):
"The option that fits what you described is [your offer]. It includes [what is included] over [timeframe]. The investment is [price]."
(Pause. Say nothing else. Let them respond first.)

CHECK (1 min):
"How does that sit with you compared with what you had in mind?"

LISTEN:
(Let them finish. Note any worry about cost, timing or fit.)

RESPOND:
"That makes sense. Here is what I can tell you about what the investment covers: [specific result or support]. If it helps, we can look at a payment option or a smaller starting point."

CLOSE (1 min):
"Would you like to move ahead with [your offer], or would it help to think it over? Either is fine. I can send the details in writing, or we can talk again on [date]."
`),

  item("Sales", "sales", "script", "Scope Change Conversation", "Use when a client asks for work beyond what was agreed and you need to talk about it openly and fairly.", "scope change, boundaries, client", `
OPEN (1 min):
"Hi [Name], thanks for making time. I would like to talk about the new request you sent on [date]."

NAME IT (1 min):
"When we started, we agreed on [original scope]. This new request adds [new work]. I want to make sure we handle it well."

ASK (2 min):
"Can you tell me more about what is behind this? What do you hope it will change for you?"
(Listen fully before offering anything.)

OPTIONS (2 min):
"There are three ways we could go. One, we keep the original scope and add this later. Two, we add it now, which changes the timeline to [new date] and the investment to [price]. Three, we swap it in for part of the current plan."

CLOSE (1 min):
"Which of those feels right to you? Once you decide, I will confirm it in writing today so we are both clear."
`),

  item("Sales", "sales", "script", "Upsell to an Existing Client", "Use when a current client has had a good result and may benefit from a next-step offer.", "upsell, existing client, next step", `
OPEN (1 min):
"Hi [Name], I wanted to check in. You have made real progress on [result], and I am glad to see it."

REFLECT (2 min):
"Looking back over [timeframe], what has changed the most for you? What still feels unfinished?"
(Listen for a need that your next offer can meet. Do not mention the offer yet.)

CONNECT (1 min):
"From what you just said, I think [your next offer] could help with [their stated need]. It includes [what is included]."

INVITE (1 min):
"Would you like to hear how it works? There is no pressure either way. You have already done good work, and it is fine to stay where you are."

CLOSE:
"If it sounds right, the investment is [price] and we could begin on [date]. I can send a short summary by email, or we can talk it through by phone or video. Whatever suits you."
`),

  item("Sales", "sales", "script", "Renewal Conversation", "Use when a client's engagement is coming to an end and you want to talk about continuing together.", "renewal, retention, client review", `
OPEN (1 min):
"Hi [Name], our agreement ends on [date], so I wanted to talk about what comes next. Is now a good time?"

REVIEW (3 min):
"Let's look back first. When we started, your goal was [goal]. Here is what has happened: [results]. What are you most proud of?"
(Listen. Write down their words and use them later.)

LOOK AHEAD (2 min):
"What do you want the next [timeframe] to look like? What is still in the way?"

OFFER (1 min):
"Based on that, I suggest we continue with [renewal offer]. It would include [what is included]. The investment is [price]."

CHECK (1 min):
"Does that feel like the right fit? If you would like changes, tell me and we will adjust."

CLOSE:
"If you want to continue, I will send the agreement by [date]. If you would rather pause, that is a fine choice too."
`),

  item("Sales", "sales", "script", "Partnership Discovery Call", "Use when you are exploring whether a joint venture or partnership with another business makes sense.", "partnership, joint venture, discovery", `
OPEN (2 min):
"Hi [Name], thank you for talking with me. I would like to learn about your work and see whether there is a good way for us to help each other's clients."

THEIR SIDE (5 min):
"Tell me about [their business]. Who do you serve, and what do they need that you do not currently offer?"
(Listen for gaps your work could fill.)

YOUR SIDE (3 min):
"I work with [your audience] to help them [your result]. Here is where I think our work overlaps: [overlap]."

EXPLORE (4 min):
"What would a good partnership look like to you? Think about who does what, how we would share the work, and how we would know it is going well."

CLOSE (1 min):
"Let's each think about this. I will send a short summary of our ideas by [date]. If it still feels right, we can try a small pilot of [pilot idea] before agreeing to anything bigger."
`),

  item("Sales", "sales", "script", "Speaking Engagement Inquiry Call", "Use when an organizer has asked about booking you to speak and you want to confirm the fit and the details.", "speaking, events, inquiry", `
OPEN (1 min):
"Hi [Name], thank you for reaching out about [event name]. I would love to learn more so I can tell you honestly whether I am the right speaker."

ASK ABOUT THE EVENT (4 min):
"Who will be in the room, and how many people? What do you want them to feel or do afterward? Is there a theme?"

ASK ABOUT THE DETAILS (3 min):
"What date and length are you planning? Will it be in person, online or both? What does the room or platform offer for sound, slides and access for everyone attending?"

SHARE (2 min):
"For an event like this I would suggest [talk title or format]. My fee for a session like this is [price], and it covers [what is included]."

CLOSE (1 min):
"If this fits, I can send a one-page outline and an agreement by [date]. What else would help your team decide?"
`),

  item("Sales", "sales", "script", "Proposal Follow-Up Call", "Use when you sent a proposal several days ago and want to check in without pressure.", "follow-up, proposal, check-in", `
OPEN (1 min):
"Hi [Name], it is [Your Name]. I sent the proposal for [project] on [date]. Do you have a few minutes to talk about it?"

ASK (2 min):
"Have you had a chance to look it over? What stood out to you?"
(Listen without defending anything.)

CLARIFY (3 min):
"Is anything unclear, or anything you would change? Sometimes a different timeline, a smaller scope or another way to pay makes it work."

CHECK THE PATH (2 min):
"Besides you, is anyone else involved in the decision? What would you need to feel confident saying yes?"

CLOSE (1 min):
"Thank you for being open with me. Shall we plan to decide by [date]? If the answer is no, that is fine, and I would still like to know what made it not the right fit."
`),

  item("Sales", "sales", "script", "10-Minute Lead Qualifying Call", "Use for a quick first call to learn whether a new lead is a good fit before booking a longer conversation.", "qualifying, lead, short call", `
OPEN (1 min):
"Hi [Name], thanks for booking this. We have about ten minutes. I would like to ask a few quick questions, and then we can decide together whether a longer call makes sense."

ASK (6 min):
1. "What made you reach out now?"
2. "What have you already tried?"
3. "What would a good result look like in [timeframe]?"
4. "Do you have a budget range in mind for this?"
5. "Who else is involved in the decision?"
(Take notes. Do not pitch.)

SUMMARISE (1 min):
"So you want [goal], you have tried [past efforts], and you hope to start by [date]. Did I get that right?"

CLOSE (2 min):
"Based on that, I think [your offer] could help. Would you like to book a longer call on [date], or would a written overview be easier? If I am not the right fit, I will say so and suggest someone who might be."
`),

  item("Sales", "sales", "script", "Group Program Enrollment Call", "Use when a person is interested in joining your group program and wants to know if it suits them.", "group program, enrollment, cohort", `
OPEN (1 min):
"Hi [Name], thank you for your interest in [program name]. I would like to learn about you and then explain how the group works."

LEARN (4 min):
"What brought you to this program? What do you want to be different by the end of it?"
"How do you like to learn: on your own, in conversation, or a mix?"

EXPLAIN (3 min):
"The program runs for [length] and starts on [date]. We meet [frequency] by [video or phone], and sessions are recorded with written notes, so you can catch up if you miss one. You will get [what is included]."

FIT (1 min):
"Based on what you told me, here is why I think it could suit you: [reason]. Here is one thing to consider: [honest limit]."

CLOSE (1 min):
"The investment is [price], and spaces close on [date]. Would you like to join, or take a day to think? I will hold your place until [date]."
`),

  item("Sales", "sales", "template", "Discount Request Response", "Use when a prospect or client asks for a lower price and you want to reply kindly while keeping your value clear.", "discount, pricing, reply", `
SUBJECT: Your question about the investment

Hi [Name],

Thank you for asking, and for being open about what you can manage.

I keep my pricing at [price] so that I can give each person [what is included] and do it well. Because of that, I do not change the fee for [offer].

Here is what I can do instead:

1. A payment plan: [number] payments of [price per payment].
2. A smaller starting option: [smaller offer] for [price].
3. A start date later in the year, if the timing is the concern.

If one of these suits you, reply and tell me which, and I will send the details. If none of them fit right now, that is completely fine. I would be glad to stay in touch and check back on [date].

Thank you again for considering this.

Warmly,
[Your Name]
`),

  item("Sales", "sales", "template", "Payment Plan Options Outline", "Use when a client wants to spread out the cost and you need a clear, written way to offer the choices.", "payment plan, terms, options", `
SUBJECT: Payment options for [offer]

Hi [Name],

Here are the ways you can pay for [offer]. Choose the one that suits you best.

OPTION 1: PAY IN FULL
One payment of [price] due on [date].
(Optional note: add any benefit, such as a bonus or a priority start.)

OPTION 2: TWO PAYMENTS
[price per payment] due on [date], and [price per payment] due on [date].

OPTION 3: MONTHLY PAYMENTS
[number] payments of [price per payment], the first due on [date] and the rest on the same day each month.

HOW IT WORKS
Payments are made by [payment method]. Work begins once the first payment is received. If a payment will be late, please tell me ahead of time and we will find a way forward together.

Please reply with the option you would like, and I will send the agreement and the first invoice.

Warmly,
[Your Name]
`),

  item("Sales", "sales", "script", "Pausing or Ending an Engagement Kindly", "Use when you or a client need to pause or close your work together and want to do it with respect.", "ending, pause, offboarding", `
OPEN (1 min):
"Hi [Name], thank you for making time. I would like to talk about how our work together is going and what might be best from here."

SHARE (2 min):
(If you are the one ending it:) "I have been thinking about whether [your offer] is still serving you. I do not think it is the right fit at this point, and I want to be honest with you about that."
(If they are ending it:) "I understand. Thank you for telling me directly."

ASK (2 min):
"Looking back, what has been most useful? Is there anything you wish had gone differently?"
(Listen without defending. Take notes.)

OFFER (2 min):
"Here are our choices: we pause until [date], we close things now, or we change the plan to [lighter option]. I can also suggest someone else who may be a better fit."

CLOSE (1 min):
"I will send a short summary of what we covered and any materials you need by [date]. The door stays open if you want to return."
`),

  item("Sales", "sales", "script", "Client Win-Back Call", "Use when a past client has been gone for a while and you would like to reconnect with no pressure.", "win-back, past client, reconnect", `
OPEN (1 min):
"Hi [Name], it is [Your Name]. We worked together on [project] back in [month and year]. I was thinking of you and wanted to say hello. Is this a good moment?"

CATCH UP (3 min):
"How have things been since then? What has changed for you or your business?"
(Listen. Let the conversation be about them.)

LEARN (2 min):
"Is there anything you are working on now that feels harder than it should be?"
"When we stopped working together, was there anything that did not work well for you? I would value your honest view."

SHARE (1 min):
"Since we last spoke, I have added [new offer or improvement]. It might help with [their need]."

CLOSE (1 min):
"Would you like me to send some details, or would it be better to simply stay in touch? Both are fine. I am glad we spoke."
`),

  item("Sales", "sales", "script", "Referral Partner Check-In", "Use when you want to thank someone who sends you referrals and strengthen the relationship.", "referral partner, check-in, relationships", `
OPEN (1 min):
"Hi [Name], thank you for making time. I wanted to call just to say thank you for sending [number] people my way this year. It means a lot."

THANK (1 min):
"One of the people you sent, [Referred Name], is now [result]. That is because of you."

ASK ABOUT THEM (4 min):
"How is your business going? What kinds of clients are you hoping to meet right now?"
(Take notes. Think about who you could introduce to them.)

CLARIFY (2 min):
"So that I send you the right people and describe your work well, how would you like me to introduce you? Is there anyone you would like me to avoid referring?"

SHARE (1 min):
"The clients I can help best at the moment are [ideal client]."

CLOSE (1 min):
"I will introduce you to [Name] by [date]. Thank you again. Let's check in again on [date]."
`),

  item("Sales", "sales", "template", "Testimonial Request Message", "Use after a successful project when you want a client to share their experience in their own words.", "testimonial, review, client feedback", `
SUBJECT: Would you share a few words?

Hi [Name],

It has been a pleasure working with you on [project]. I am so pleased with [specific result].

Would you be willing to share a few words about your experience? A short testimonial would help other people understand what it is like to work together.

If it helps, here are a few questions. Answer any or all of them:

1. What was going on before we started?
2. What changed after working together?
3. What would you say to someone thinking about [your offer]?

You can reply by email, send a voice note, or we can do a quick phone or video call and I will write it down for you to approve. Whatever is easiest.

Please tell me if I may use your name, your business name and a photo. If you would rather stay private, I will keep it anonymous.

Thank you,
[Your Name]
`),

  item("Sales", "sales", "script", "Discovery Sprint Pitch", "Use when a prospect is unsure about a big commitment and you want to offer a short, focused first project.", "workshop, sprint, pitch", `
OPEN (1 min):
"Hi [Name], from what you shared, [goal] is important, but a long commitment feels like a lot right now. Would it help if I suggested a smaller first step?"

DESCRIBE (3 min):
"I offer a [number]-day discovery sprint. In that time we will [activity one], [activity two] and [activity three]. At the end you will have [deliverable], a clear plan, and a good sense of what to do next."

BENEFITS (1 min):
"This lets you see how we work together, and you will have something useful whether or not we continue."

DETAILS (1 min):
"The sprint takes [hours] of your time. It begins on [date], and the investment is [price]. If you then choose to continue, I will apply [credit] toward the larger project."

CLOSE (1 min):
"How does that feel as a starting point? We can hold the sessions by video, phone or in writing, whichever suits you best."
`),

  item("Sales", "sales", "script", "Decision Call (Second Call)", "Use for the follow-up conversation where a prospect is ready to decide after a first call or proposal.", "second call, decision, closing", `
OPEN (1 min):
"Hi [Name], thank you for coming back to me. Last time we talked about [topic]. How have you been thinking about it since?"

REVIEW (2 min):
"Let me recap what I heard. You want [goal], the main obstacle is [obstacle], and you would like to start by [date]. Is that still true?"

QUESTIONS (3 min):
"What questions have come up? What is the one thing that would make this an easy yes, or an easy no?"
(Answer honestly. If you do not know, say so and promise to find out.)

CONFIRM THE OFFER (1 min):
"To be clear, [your offer] includes [what is included], starts on [date], and is [price]."

ASK (1 min):
"Would you like to go ahead?"
(Stay quiet and wait for their answer.)

CLOSE:
"If yes, I will send the agreement today. If you need more time, let's agree on a date: [date]. Either way, thank you for being thoughtful about this."
`),

  item("Sales", "sales", "script", "Intro Call for a Referred Lead", "Use for a first call with someone who was sent to you by a client, friend or partner.", "referral, intro call, warm lead", `
OPEN (1 min):
"Hi [Name], thank you for taking my call. [Referrer Name] spoke very highly of you and thought we should meet. I would like to learn about you first, with no pressure."

ACKNOWLEDGE (1 min):
"[Referrer Name] mentioned you are working on [topic]. Is that right? Tell me more in your own words."

ASK (5 min):
"What is going on in your work right now? What do you most want to change? What have you already tried?"
(Listen closely. Do not assume the referrer told you everything.)

SHARE (2 min):
"I worked with [Referrer Name] on [project], and we got [result]. For you, I would explore something like [your offer], but I want to make sure it truly fits."

CLOSE (1 min):
"Would you like to schedule a longer conversation on [date]? I can also send a short overview first. I will let [Referrer Name] know we connected, if that is all right with you."
`),
];
