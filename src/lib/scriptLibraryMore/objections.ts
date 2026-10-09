import { item } from "@/lib/scriptLibraryItem";
import type { LibraryItem } from "@/lib/scriptLibraryItem";

export const OBJECTIONS_MORE: LibraryItem[] = [
  item("Objections", "objection", "script", "I can do this myself", "Respects their capability while naming the real trade-off between doing it alone and doing it with support.", "diy, capability, support", `
ACKNOWLEDGE:
"I believe you. You clearly know your business, and plenty of people do this well on their own."
ASK:
"What have you already tried on [their goal], and what has it been like so far?"
(listen)
RESPOND:
"Thank you for sharing that. Here is what I see. You can absolutely do this yourself. The question is how long it will take and what it costs you in the meantime. What I offer is [your offer], which usually shortens the learning curve because you are not figuring out every step alone."
NEXT STEP:
"If you would like, I can show you the first two steps so you can try them on your own. If that is all you need, wonderful. Would that be helpful?"
`),

  item("Objections", "objection", "script", "I'm not sure it will work for my situation", "Takes their uniqueness seriously and checks fit before promising anything.", "fit, doubt, situation", `
ACKNOWLEDGE:
"That is a fair concern. Every business is different, and I would not want you to buy something that does not fit."
ASK:
"What is it about your situation that feels different or harder than most?"
(listen)
RESPOND:
"Thank you, that helps me. Based on what you have told me, [part that fits] looks like a good match for [your offer]. [Part that may not fit] is something I would want to be honest about. I cannot promise a result, but I can tell you where I think it would help and where it would not."
NEXT STEP:
"Would it be useful if I put that in writing, a short list of what fits and what does not, so you can decide with clear eyes?"
`),

  item("Objections", "objection", "script", "I already have someone", "Honors their current provider and finds out whether a gap exists without pushing them to switch.", "existing, provider, gap", `
ACKNOWLEDGE:
"That is great to hear. It is good that you have support, and I would never ask you to drop someone who is serving you well."
ASK:
"What is working best about that relationship, and is there anything you wish they did more of?"
(listen)
RESPOND:
"That makes sense. Some people find that what I do, [your offer], sits beside what they already have rather than replacing it. If there is a gap, I would be glad to help with that piece. If there is no gap, then you are in good hands and that is a good answer."
NEXT STEP:
"Would you like me to check back in [timeframe], in case your needs change? And if you would rather I did not, I completely understand."
`),

  item("Objections", "objection", "script", "I need approval from my team or board", "Supports a decision that is not theirs alone and helps them present it well.", "approval, team, decision", `
ACKNOWLEDGE:
"That makes complete sense. A decision like this should include the people it affects."
ASK:
"Who else will weigh in, and what do you think they will want to know most?"
(listen)
RESPOND:
"Thank you. I can make that easier for you. I can prepare a one page summary covering [what it includes], the expected outcome, the timeline and the [price], so you are not left explaining it alone. If it helps, I am also happy to join a short call and answer questions directly."
NEXT STEP:
"Shall I send that summary today? And when does your team usually decide, so I can check in at a respectful time? If the answer ends up being no, that is fine too."
`),

  item("Objections", "objection", "script", "I don't see the value yet", "Treats missing value as a gap in clarity, not a flaw in the prospect, and asks what would make it visible.", "value, clarity, outcome", `
ACKNOWLEDGE:
"Thank you for being direct. If I have not shown you the value, that is on me to make clearer."
ASK:
"When you picture this working well, what would be different in your business? What would you need to see to feel it was worth it?"
(listen)
RESPOND:
"That is helpful. If [what they described] is what matters most, then the part of [your offer] that speaks to it is [specific part]. If I cannot connect what I do to what you care about, then it may not be the right thing for you right now, and I would rather say so than push."
NEXT STEP:
"Would you like me to go through one concrete example of how this has worked for someone in a similar spot? If it still does not fit, we can leave it there with no hard feelings."
`),

  item("Objections", "objection", "script", "Your competitor is cheaper", "Compares honestly on what is included rather than attacking the alternative.", "competitor, comparison, price", `
ACKNOWLEDGE:
"Thank you for telling me. It is smart to compare, and I would do the same."
ASK:
"What does their option include, and what matters most to you in making this choice?"
(listen)
RESPOND:
"That is useful to know. I will be honest. If price is the main thing, their option may be the better choice for you. Where my work tends to differ is [your difference], and my fee of [price] reflects that. I would not want you to pay for something you do not need, and I would not want you to save money on something that leaves out what you do need."
NEXT STEP:
"Would a side by side list of what each option covers be helpful? Whatever you choose, I wish you well."
`),

  item("Objections", "objection", "script", "Can you give me a discount", "Answers a discount request honestly, with a clear boundary and a genuine alternative.", "discount, boundaries, options", `
ACKNOWLEDGE:
"Thank you for asking. It is a reasonable question, and I am glad you feel comfortable raising it."
ASK:
"Can you tell me a little about what is making the current number feel out of reach or out of line?"
(listen)
RESPOND:
"I appreciate that. My fee of [price] is set to match the work and the support involved, so I do not lower it casually. What I can do is look at the scope. We could change [what could be adjusted], or I could offer [payment option] if timing is the issue. I would rather adjust the offer than shortchange the work."
NEXT STEP:
"Would you like me to outline one of those versions so you can see what it looks like? And if the fit just is not there, that is okay."
`),

  item("Objections", "objection", "script", "I need more proof or results", "Welcomes the request for evidence and shares only what is true, including its limits.", "proof, results, trust", `
ACKNOWLEDGE:
"That is a wise thing to ask for. You should see evidence before you decide."
ASK:
"What kind of proof would be most convincing for you? A story from someone like you, numbers, or a chance to talk to a past client?"
(listen)
RESPOND:
"Thank you. Here is what I can honestly share: [real result or story]. I should also say that results depend on effort and circumstances, so I can show you what has happened for others, but I cannot promise it will be the same for you."
NEXT STEP:
"If you would like, I can send that example today and, with permission, introduce you to someone who has worked with me. Would that help? And if it does not, I understand."
`),

  item("Objections", "objection", "script", "I'm afraid of making the wrong choice", "Slows the moment down and helps them name the fear so they can choose from clarity.", "fear, decision, clarity", `
ACKNOWLEDGE:
"That feeling is very common, and it usually means you care about getting this right."
ASK:
"If you did make the wrong choice, what would that look like for you? What is the worst part of it?"
(listen)
RESPOND:
"Thank you for saying that out loud. Often the fear is smaller once it has a name. Here is how I think about it: [your offer] has a clear scope, and you can see what you are getting before you commit. I cannot remove all risk, but I can help you see it plainly. Waiting is also a choice, so it is worth weighing that too."
NEXT STEP:
"Would it help to write down what a good decision looks like for you, and check it against my offer together? If your answer is not yet, that is a fine answer."
`),

  item("Objections", "objection", "script", "I'm not ready to commit for that long", "Takes the length of commitment seriously and explores flexibility without pressure.", "commitment, length, flexibility", `
ACKNOWLEDGE:
"I understand. Committing for [length of agreement] is a real decision, and it is wise to think about it."
ASK:
"What is it about that length of time that concerns you most?"
(listen)
RESPOND:
"Thank you. Let me tell you why I set it up this way. [Reason the length exists]. That said, I want you to feel comfortable. Depending on your answer, there may be a shorter option, such as [shorter option], or a check in point where we both decide whether to continue."
NEXT STEP:
"Would you like me to lay out those choices in writing? You can take your time, and if none of them feel right, I respect that."
`),

  item("Objections", "objection", "script", "I want to start smaller", "Welcomes a smaller first step when it is genuinely useful, and is honest about what it does and does not cover.", "start small, scope, entry", `
ACKNOWLEDGE:
"That is a sensible way to go about it. Starting small lets you build trust at your own pace."
ASK:
"What would starting smaller look like for you? What would you want to get out of that first step?"
(listen)
RESPOND:
"Thank you. I can offer [smaller option] for [price]. It covers [what it covers] but not [what it leaves out], so I want you to know where the limits are. If that smaller step is enough for what you need right now, I would be glad to do it. If it would leave you short of your goal, I would tell you so."
NEXT STEP:
"Would you like me to send the details of the smaller option? You can decide later whether to go further, and no pressure either way."
`),

  item("Objections", "objection", "script", "I'm not sure I'm the right fit", "Turns self-doubt into a calm conversation about fit, with honesty on both sides.", "fit, self-doubt, readiness", `
ACKNOWLEDGE:
"Thank you for being honest about that. It takes some courage to say it."
ASK:
"What makes you wonder whether you are the right fit? What are you picturing?"
(listen)
RESPOND:
"I appreciate you telling me. Here is how I think about fit. [Your offer] works best for people who [honest description of a good fit]. From what you have shared, you [match or do not match] on those points. If you are on the edge, I would rather tell you that plainly than let you spend time and money on something that is a stretch."
NEXT STEP:
"Would it help to go through three quick questions together to see where you land? If it turns out not to be a fit, I will say so, and I might point you to a better option."
`),

  item("Objections", "objection", "script", "I'll get back to you", "Turns a vague promise into a clear, kind follow-up that leaves them free to say no.", "follow-up, silence, clarity", `
ACKNOWLEDGE:
"Of course. Take the time you need, there is no pressure from me."
ASK:
"So I can be useful, is there something specific you want to think through, or a question I could answer now?"
(listen)
RESPOND:
"Thank you. If there is anything unclear, I would rather clear it up now than leave you wondering. And I want to be honest about one thing. Sometimes a not now really means not for me, and that is completely fine. You will not offend me by saying so."
NEXT STEP:
"Would it be all right if I checked in on [date]? If I have not heard from you, I will send one short note and then leave the door open. Does that work?"
`),

  item("Objections", "objection", "script", "I don't trust online programs", "Acknowledges that distrust is earned and shows what is real, human and checkable.", "trust, online, reassurance", `
ACKNOWLEDGE:
"I understand, and honestly I am glad you are careful. A lot of online programs do not deliver what they promise."
ASK:
"What has made you wary? Was it something you experienced, or something you have heard about?"
(listen)
RESPOND:
"Thank you for telling me. That helps me know what to address. Here is what is real about my work: [real, checkable detail, such as live sessions, a named person, past client contact]. You can see exactly what is included before you pay, and you can ask me anything first. I cannot change your past experience, but I can be open about how this works."
NEXT STEP:
"Would you like to have a short call so you can see how I work before deciding? If you would rather not, I respect that."
`),

  item("Objections", "objection", "script", "Can I pay later", "Handles a request to delay payment with honesty about options and boundaries.", "payment, timing, options", `
ACKNOWLEDGE:
"Thank you for asking. Timing matters, and I would rather have this conversation openly."
ASK:
"Is it more a question of when the money is available, or a question of whether you are ready to commit yet?"
(listen)
RESPOND:
"That helps. If it is cash flow, I can offer [payment option], so you start now and pay over time. If it is more about not being sure yet, then I would suggest waiting until you are ready instead of starting with a hesitation. I do not begin work before [payment terms], but I would rather find a plan that works than lose the chance to work together."
NEXT STEP:
"Would you like me to write up the payment plan so you can see it clearly? If neither feels right, that is okay."
`),

  item("Objections", "objection", "script", "I've been burned before by a coach or consultant", "Responds with care to a past bad experience and lets them set the pace of trust.", "trust, past experience, care", `
ACKNOWLEDGE:
"I am sorry that happened. That kind of experience makes anyone cautious, and that caution makes sense."
ASK:
"If you are comfortable sharing, what went wrong? I want to understand what you would need to feel safe this time."
(listen)
RESPOND:
"Thank you for trusting me with that. I will not ask you to just believe me. What I can do is be clear about what you get, what I expect from you, and what I cannot promise. [Specific safeguard, such as written scope, a first session before committing, a clear way to stop]. You should be able to leave if it is not working."
NEXT STEP:
"Would you like to start with [low risk step] and see how it feels? And if you decide this is not right for you, I understand completely."
`),

  item("Objections", "objection", "script", "What if it doesn't work", "Answers the risk question with honesty about guarantees, effort and what happens if results fall short.", "risk, guarantee, honesty", `
ACKNOWLEDGE:
"That is exactly the right question to ask before you invest."
ASK:
"When you say it does not work, what would that look like for you? What result would you be hoping for?"
(listen)
RESPOND:
"Thank you. I want to give you a straight answer. I cannot guarantee a specific result, because it depends on many things, including your effort and your market. What I can promise is [what you do promise]. If it is not going as expected, we will look at it together early, and [your policy for when results fall short]. I would rather tell you now than have you disappointed later."
NEXT STEP:
"Would it help if we defined together what success looks like, in writing, before you decide? If you still feel unsure, that is a valid answer."
`),

  item("Objections", "objection", "script", "I don't have time to implement", "Treats the time constraint as real and explores whether a lighter version or delegation is possible.", "time, implementation, capacity", `
ACKNOWLEDGE:
"I hear you. Your plate is already full, and adding one more thing is not a small ask."
ASK:
"If you looked at a typical week, where could an hour or two realistically come from? Or is there someone on your team who could help?"
(listen)
RESPOND:
"Thank you, that is useful. Here is what I know. [Your offer] needs about [time commitment] each week, and I would be dishonest if I said it needed less. Where I can help is by keeping the steps small and by starting with the one that matters most. If even that amount of time is not there right now, then waiting may be the wiser choice."
NEXT STEP:
"Would you like me to map out a lighter version of the first month so you can see if it fits? If not, we can pick it up when your schedule opens."
`),
];
