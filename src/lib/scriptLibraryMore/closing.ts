import { item } from "@/lib/scriptLibraryItem";
import type { LibraryItem } from "@/lib/scriptLibraryItem";

export const CLOSING_MORE: LibraryItem[] = [
  item("Closing", "sales", "script", "Summary Close", "Use near the end of a conversation to recap what the person told you they want, then ask for a decision.", "summary, recap, close", `
RECAP:
"Let me play back what I heard, and you tell me if I have it right. You said [their main goal]. You said [their biggest obstacle] is what has been getting in the way. And you want to see [the result they described] by [timeframe]."
CONFIRM:
"Did I capture that accurately? Is there anything I missed?"
(pause and listen, then adjust the recap if they correct you)
CONNECT:
"Based on that, [your offer] is built for exactly this. It includes [key part one] and [key part two], and it is designed to get you to [the result they described]."
ASK:
"Does that feel like what you are looking for? If so, I would love to get you started. Would you like to begin with [start option]?"
(pause and listen)
CLOSE:
"Wonderful. Here is what happens next: [first next step]. If you have a question before then, ask me now or reach out any time."
`),

  item("Closing", "sales", "script", "Choice Close (Two Options)", "Use when someone is ready in principle and you want to help them pick the right way in, not whether to begin.", "choice, options, close", `
CHECK IN:
"It sounds like you are ready to move forward on this. Is that fair to say?"
(pause and listen)
OFFER TWO PATHS:
"There are two good ways to begin. Option one is [option one], which gives you [what it includes] for [price]. Option two is [option two], which adds [extra support] for [price]."
GUIDE:
"From what you have told me about [their situation], I lean toward [recommended option] because [honest reason]. But you know your schedule and your budget better than I do."
ASK:
"Which of those feels like the better fit for you right now?"
(pause and listen)
CLOSE:
"Great, [chosen option] it is. I will send the details today, and we can set your first session for [date]."
`),

  item("Closing", "sales", "script", "What Would Make This an Easy Yes", "Use when someone is interested but hesitating and you want to uncover the real gap without pushing.", "easy yes, hesitation, discovery", `
CHECK IN:
"I can tell you are interested, and I also sense a little hesitation. That is completely fine. May I ask you something?"
ASK:
"If you could change one thing about this, what would make it an easy yes for you?"
(pause and listen, and do not fill the silence)
CLARIFY:
"Thank you for being honest. So the main thing is [what they said]. Is that the only thing, or is there something else sitting behind it?"
(pause and listen)
RESPOND:
"Here is what I can do about that: [honest adjustment, answer, or option]. And if I cannot solve it, I will tell you so."
CLOSE:
"With that in place, does it feel like a yes? If you would like to think it over, that is fine too. When would you like to talk again?"
`),

  item("Closing", "sales", "script", "The Cost of Waiting Conversation", "Use to help someone weigh what staying where they are will honestly cost them, without fear or pressure.", "cost of waiting, honest, decision", `
CHECK IN:
"Can I share something that might help you think this through? There is no pressure in it. I just want you to see the whole picture."
ASK:
"You mentioned [their problem]. What has that been costing you over the past [timeframe], in time, money, energy, or opportunities?"
(pause and listen)
REFLECT:
"So if nothing changes, it sounds like in another [timeframe] you are still dealing with [their problem]. Did I hear that right?"
(pause and listen)
BALANCE:
"I also want to be fair. Waiting can be a perfectly good choice if the timing is wrong or something else has to come first. Only you can judge that."
ASK:
"What feels true for you? Is now the right time, or is there a better one?"
(pause and listen)
CLOSE:
"Thank you for thinking it through with me. Whatever you decide, I am glad we talked."
`),

  item("Closing", "sales", "script", "Pilot or Smaller-Start Close", "Use when the full offer feels like too big a step and a smaller first engagement would let them begin with confidence.", "pilot, small start, trial", `
CHECK IN:
"It sounds like the full [your offer] feels like a lot to commit to right now. Is that close?"
(pause and listen)
NORMALIZE:
"That makes sense. A bigger commitment deserves some trust first, and I would rather you start comfortably than feel stretched."
OFFER:
"Here is a smaller way in. We could begin with [pilot or smaller offer], which covers [what is included] over [timeframe] for [price]. You would get a real taste of how we work together and what changes."
CLARIFY:
"If it goes well, we can talk about [full offer]. If it is not the right fit, you will know, and there is no obligation to continue."
ASK:
"Would starting there feel more comfortable?"
(pause and listen)
CLOSE:
"Great. I will send over the details, and we can begin on [date]."
`),

  item("Closing", "sales", "script", "Silence After the Price", "Use right after stating the price so you can stay calm, give them room to think, and respond well to whatever comes.", "price, silence, pause", `
STATE THE PRICE:
"The investment for [your offer] is [price]. That includes [what is included]."
(then stop talking and give them a full ten seconds of quiet, which will feel long)
IF THEY ARE STILL QUIET:
"I will give you a moment to take that in. There is no rush."
(pause and listen)
CHECK IN:
"What is going through your mind?"
(pause and listen)
IF THEY RAISE A CONCERN:
"Thank you for saying so. Tell me more about that, so I understand what matters most to you."
(pause and listen, and answer honestly)
IF THEY ARE THINKING IT OVER:
"That is fair. What would help you decide: more information, a day to think, or a look at payment options?"
CLOSE:
"Whatever you need, I would rather you feel sure than rushed. What would you like to do next?"
`),

  item("Closing", "sales", "script", "Second-Call Close", "Use on a follow-up call after they have had time to consider, to resolve open questions and ask for the decision.", "second call, follow-up, decision", `
CHECK IN:
"Thank you for making time again. Since we last spoke, what have you been thinking about?"
(pause and listen)
ADDRESS:
"Let me answer the questions you raised. First, you asked about [question one]: [honest answer]. Second, you asked about [question two]: [honest answer]. Did that cover it?"
(pause and listen)
CONFIRM:
"Last time you told me you want [their goal]. Is that still the priority?"
(pause and listen)
ASK:
"Where are you at with the decision? Are you ready to move forward, still unsure, or leaning toward not now?"
(pause and listen)
CLOSE:
"Thank you for being straight with me. If it is a yes, here is the next step: [next step]. If it is not yet, tell me what you would need and when to check in, and I will respect that."
`),

  item("Closing", "sales", "script", "Renewal Close", "Use with an existing client near the end of their term to review results and invite them to continue.", "renewal, retention, review", `
CELEBRATE:
"We are coming to the end of our [length of engagement] together, and I want to start with what you have done. When we began, you wanted [original goal]. Now you have [specific result]. That is real progress."
(pause and listen to their reflection)
LOOK AHEAD:
"What do you want to build on next? What is still unfinished?"
(pause and listen)
OFFER:
"Based on that, I would suggest we continue with [renewal option], which includes [what is included] for [price]. It would focus on [their next goal]."
ASK:
"Would you like to continue, or would you prefer to take a break and see how it goes?"
(pause and listen)
CLOSE:
"Either answer is welcome. If you would like to continue, I will send the renewal details today so there is no gap. If not, I will help you with a smooth handoff."
`),

  item("Closing", "sales", "script", "Upgrade Close", "Use when a current client is hitting the limits of their package and a higher level would serve them better.", "upgrade, expansion, current client", `
CHECK IN:
"You have been doing great with [current package]. I noticed that you have also been asking for [what they keep needing]. Can I share an idea?"
(pause and listen)
CONNECT:
"Our [higher package] includes [added feature or support]. Based on what you have told me, it would help you [specific benefit] without adding more to your plate."
BE HONEST:
"I would only suggest this if it genuinely fits. If your current package is meeting your needs, there is no reason to change."
ASK:
"Does moving up feel like the right step for you right now?"
(pause and listen)
CLOSE:
"If yes, the difference is [price difference], and I can start the upgrade from [date] with no disruption. If you want to wait, that is fine, and we will keep going as we are."
`),

  item("Closing", "email", "template", "Asking for the Sale in an Email", "Use after a conversation or proposal when you want to clearly and kindly invite the person to say yes.", "ask, email, invite", `
Subject: Ready to begin, [First name]?

Hi [First name],

Thank you for the time you gave me on [date]. I enjoyed learning about [their situation].

You told me you want [their goal]. [Your offer] is designed to help with exactly that. It includes [key inclusion one] and [key inclusion two], for [price].

If you are ready to begin, here is the simple next step: [link or instruction]. We could start as early as [date].

If you have a question or need anything adjusted, just reply and I will get back to you.

Either way, I appreciate you considering this.

[Your name]
`),

  item("Closing", "email", "template", "Proposal Acceptance Email", "Use when someone says yes to a proposal, to confirm the details and move them straight to the next step.", "proposal, accepted, confirmation", `
Subject: Wonderful, let's get started

Hi [First name],

Thank you for saying yes. I am looking forward to working with you.

Here is what we agreed on:
Offer: [your offer]
Scope: [what is included]
Start date: [date]
Investment: [price]

To get started, please [next step] by [date]. Here is the link: [link].

Once that is done, I will send you [what happens next].

If anything above looks different from what you expected, tell me and I will fix it right away.

Thank you for your trust.

[Your name]
`),

  item("Closing", "email", "template", "I Need a Day Response and Follow-Up", "Use when someone asks for time to decide, to give them space and then check in at the time you agreed on.", "needs time, follow-up, decision", `
Subject: Take the time you need, [First name]

Hi [First name],

Of course, take the time you need. A good decision should not be rushed.

To make it easier, here is a quick summary: [your offer] includes [key inclusion], for [price], starting [date]. If anything is unclear, ask me and I will answer it plainly.

I will check in with you on [date] to hear what you have decided. If you are ready sooner, simply reply.

---

FOLLOW-UP (send on the agreed day):

Subject: Checking in as promised

Hi [First name],

You said you would think it over, so I wanted to check in. Where are you at? A yes, a no, or a not yet are all welcome answers.

[Your name]
`),

  item("Closing", "email", "template", "Contract Sent But Unsigned Follow-Up", "Use when a contract or agreement has gone out and has not been signed after a few days.", "contract, unsigned, follow-up", `
Subject: Your agreement, [First name]

Hi [First name],

I wanted to follow up on the agreement I sent on [date]. I know things get busy, so this is just a gentle nudge.

Is there anything in it you would like to talk through, or any part you would like changed? I am glad to adjust where I reasonably can.

When you are ready, you can review and sign here: [link]. To hold your start date of [date], I would need it by [date].

If your plans have changed, no problem at all. Just let me know so I can plan my calendar.

[Your name]
`),

  item("Closing", "email", "template", "Welcome Aboard After Payment", "Use immediately after payment to confirm it, welcome the new client, and make the first steps clear.", "welcome, onboarding, payment", `
Subject: Welcome aboard, [First name]

Hi [First name],

Your payment has come through, and I am delighted to have you with me. Thank you for your trust.

Here is what happens next:
1. [first step]: [link]
2. [second step]: [link]
3. [third step]

Your first [first session] is on [date]. If you need to change it, please let me know at least [notice period] ahead.

If any questions come up before then, reply to this email. I read every one.

I am looking forward to what we will build together.

[Your name]
`),

  item("Closing", "email", "template", "Respectful Close When the Answer Is Not Yet", "Use when someone says not now, to leave the door open, preserve the relationship, and set a gentle future check-in.", "not yet, respectful, nurture", `
Subject: Thank you, [First name]

Hi [First name],

Thank you for being honest with me about the timing. I would much rather you wait until it is right than begin before you are ready.

If it helps, here is a quick summary of what I offer: [your offer], which helps with [main result]. It is here whenever you want it.

I will check in around [month or date] to see how things are going. If you would rather I did not, just tell me and I will not.

In the meantime, if a question comes up or your plans change, you are welcome to reach out any time.

Wishing you all the best with [their current project].

[Your name]
`),

  item("Closing", "email", "template", "Founding-Member Close", "Use to invite early joiners into a new offer at a founding rate, only when the spot count and terms are real.", "founding member, early access, limited", `
Subject: Founding spots for [your offer]

Hi [First name],

I am opening [your offer] to a small founding group. I have [number] founding spots, and [number left] remain.

Founding members receive [real benefit one] and [real benefit two] at the founding rate of [price]. In return, I ask for honest feedback so that I can improve it. After these spots fill, the rate becomes [later price] and the founding benefits will not be offered again.

I am telling you because you said [their interest or goal]. If it is a fit, you can join here: [link] by [date].

If it is not the right time, no worries at all. I will keep you in the loop.

[Your name]
`),

  item("Closing", "dm", "template", "Decision-Date Check-In", "Use to follow up briefly on the date a prospect said they would decide, with no pressure.", "check-in, decision date, short", `
Hi [First name], you mentioned you would decide on [date], so I am checking in. Where are you at with [your offer]? A yes, a no, or a not yet are all fine with me. If you have questions, I am happy to answer them.
`),

  item("Closing", "dm", "template", "Limited Spots Heads-Up", "Use when you truly have a fixed number of places and want to let an interested person know without pressure.", "limited spots, heads-up, honest", `
Hi [First name], a quick heads-up since you showed interest in [your offer]. I take only [number] people at a time so I can give everyone real attention, and [number left] spots are left for the [start date] group. No pressure. Want the details?
`),
];
