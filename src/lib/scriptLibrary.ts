// The starter library: a shared, read-only set of generic scripts & templates
// every account can browse, fill in and copy. Nothing here is specific to any
// one business. "Save to my library" copies an item into the client's own
// scripts_templates rows (scoped to their plan), where they can edit it freely —
// what they save is never visible to another account.
//
// Convention: [Brackets] are fields to fill in. (Parentheses) are stage
// directions — a pause, a question to listen to — and are never fields.

export type LibraryChannel = "sales" | "email" | "dm" | "objection" | "social";

export interface LibraryItem {
  id: string;
  title: string;
  description: string;
  itemType: "script" | "template";
  category: string;
  channel: LibraryChannel;
  tags: string[];
  content: string;
}

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

function item(
  category: string,
  channel: LibraryChannel,
  itemType: "script" | "template",
  title: string,
  description: string,
  tags: string,
  content: string
): LibraryItem {
  return {
    id: `lib-${slug(category)}-${slug(title)}`,
    title,
    description,
    itemType,
    category,
    channel,
    tags: tags.split(",").map((t) => t.trim()),
    content: content.trim(),
  };
}

export const SCRIPT_LIBRARY: LibraryItem[] = [
  /* ───────────── SALES ───────────── */
  item("Sales", "sales", "script", "Discovery Call Script", "A 30-minute call that finds the real problem before you pitch.", "discovery, call, qualify", `
OPEN (2 min):
"Hi [Name], thanks for making time. Before we dive in, here's how I'd like to use our 30 minutes: I'll ask a few questions about where you are and where you want to be, and then I'll tell you honestly whether I can help. Sound good?"

UNDERSTAND (10 min):
"What made you book this call now?"
(Listen. Don't fix yet.)
"What have you already tried?"
"What's it costing you — in time, money or stress — to leave this as it is?"

VISION (5 min):
"If we were talking six months from now and this was solved, what would be different?"

FIT (5 min):
"Based on what you've told me, here's how [Your Business] would approach [their goal]: [one-sentence approach]."

NEXT STEP (5 min):
"Does that sound like what you're looking for? If so, the next step is [next step]. Would you like to move forward?"`),

  item("Sales", "sales", "script", "Consultation Booking Call", "Turn an inquiry into a booked consultation.", "booking, inquiry, consultation", `
"Hi [Name], this is [Your Name] with [Your Business]. You reached out about [what they asked about] — is now a good moment for two minutes?"
(If not: "No problem — when's better today or tomorrow?")

"Great. Tell me a little about what's going on with [topic]."
(Listen for the main problem and the urgency.)

"Thank you for sharing that. The best next step is a [length]-minute consultation where we look at [what you'll cover] and decide together if it makes sense to work together. I have [Day/Time] or [Day/Time] — which works better?"

(Confirm.) "Perfect. I'll send a calendar invite to [email] right now. If anything changes, just reply to it. Talk soon, [Name]."`),

  item("Sales", "sales", "script", "Sales Call Opening & Agenda", "The first two minutes: set the tone and the agenda.", "opening, agenda, rapport", `
"Hi [Name], I'm [Your Name] — really glad we could connect. How's your [day/week] going so far?"
(Listen, respond genuinely to one thing they say.)

"Here's what I'd suggest for our time today: first I'll ask you some questions so I understand your situation; then I'll share what I do and whether it fits; and if it does, we'll talk about next steps. If it doesn't, I'll tell you that plainly. Is that okay with you?"

"Before we start — is there anything specific you want to be sure we cover?"`),

  item("Sales", "sales", "template", "Needs-Discovery Question Bank", "Questions to pick from — never all at once.", "questions, discovery", `
SITUATION
• Tell me about your business/role and what a typical week looks like.
• What are you working on right now around [topic]?

PROBLEM
• What's the biggest thing standing in the way of [goal]?
• How long has this been an issue?
• What have you tried so far, and what happened?

IMPACT
• What does this cost you each month — in money, time or energy?
• If nothing changes in the next 6–12 months, what happens?

DECISION
• Who else is involved in a decision like this?
• What would need to be true for you to say yes today?
• What's your timeline for getting this handled?

VISION
• What would success look like for you, specifically?`),

  item("Sales", "sales", "script", "Proposal Presentation Call", "Walk through a proposal so the decision is easy.", "proposal, presentation", `
"[Name], thanks for meeting again. I'd like to recap what I heard, walk through what I'm proposing, and then answer your questions."

RECAP:
"You told me [their main problem], you want [their goal] by [timeframe], and the cost of waiting is [impact]. Did I get that right?"
(Let them correct you.)

PROPOSAL:
"To get you there, here's what I recommend: [core solution]. It includes [deliverable 1], [deliverable 2] and [deliverable 3]. We'd start on [start date], and you'd see [first result] by [date]."

INVESTMENT:
"The investment is [price], [payment options]."
(Stop talking. Let them respond.)

"What questions come up as you look at this?"`),

  item("Sales", "sales", "script", "Warm Lead Reactivation Call", "Reconnect with someone who went quiet after showing interest.", "reactivation, warm lead", `
"Hi [Name], it's [Your Name] from [Your Business]. We spoke back in [month] about [topic]. I don't want to interrupt — do you have two minutes?"

"I was reviewing my notes and remembered you were looking to [their goal]. I wanted to ask: is that still on your radar, or did priorities shift?"
(If still relevant:) "Great — what's changed since we last talked?"
(If not:) "Completely understandable. Would it be okay if I checked back in [timeframe]?"

"Either way, thanks for being straight with me."`),

  item("Sales", "sales", "script", "Referral Ask Call", "Ask a happy client for an introduction — without awkwardness.", "referral, client", `
"Hi [Name], I'm calling because I've loved working with you on [project/result]. How are you feeling about it now?"
(Let them tell you the good news.)

"That means a lot. I'd like to ask a favor. My business grows mostly through people like you. Who do you know — a colleague, friend or another business owner — who's dealing with [problem you solve]?"
(Pause. Wait.)

"Would you be comfortable introducing us? I can make it easy: I'll write a short note you can forward, or you can just tell me their name and I'll mention you. Whatever feels best."`),

  /* ───────────── PROSPECTING ───────────── */
  item("Prospecting", "dm", "template", "LinkedIn Cold Outreach", "A short first message that earns a reply.", "linkedin, cold, outreach", `
Hi [Name],

I noticed [specific thing about their work or a recent post] — [genuine one-line reaction].

I help [type of client] with [result you deliver], and I thought what you're doing at [their company] might be a fit for a quick conversation. No pitch — I'd just like to hear how you're handling [problem].

Would it be okay if I shared [helpful resource] with you?

[Your Name]`),

  item("Prospecting", "email", "template", "Cold Email — Problem First", "Lead with their problem, not your résumé.", "cold email, prospecting", `
Subject: [Their problem] at [Their Company]?

Hi [Name],

Most [their role]s I talk to are dealing with [specific problem]. It usually shows up as [symptom 1] and [symptom 2].

At [Your Business], we help [type of client] [result] — for example, [brief proof: client, result, timeframe].

Would a 15-minute call on [Day] or [Day] make sense to see if we could do the same for [Their Company]?

Best,
[Your Name]
[Phone] · [Website]`),

  item("Prospecting", "dm", "template", "Instagram DM Warm-Up", "Start a real conversation before you ever sell.", "instagram, dm, warm-up", `
(Step 1 — after engaging with two of their posts)
Hey [Name]! Your [post/reel about topic] really stuck with me — [specific detail you liked]. 🙌

(Step 2 — after they reply)
That's so cool. What made you get into [their field/topic]?

(Step 3 — a few messages in)
I love how you think about [topic]. I actually work with [type of person] on [what you help with] — if it's ever useful I'm happy to share how. No pressure at all!`),

  item("Prospecting", "email", "template", "Networking Event Follow-Up", "Send within 24 hours of meeting someone.", "networking, event, follow-up", `
Subject: Great meeting you at [Event]

Hi [Name],

It was great talking with you at [Event] — I especially enjoyed hearing about [specific thing they said].

You mentioned [challenge or goal]. I thought of [helpful article/person/resource] — [link or intro].

I'd love to continue the conversation. Would you be open to a 20-minute coffee or call the week of [date]?

Warmly,
[Your Name]`),

  item("Prospecting", "email", "template", "Referral Partner Introduction", "Propose a mutually beneficial partnership.", "partnership, referral partner", `
Subject: An idea for [Their Business] + [Your Business]

Hi [Name],

I've admired [Their Business] for a while — especially [specific thing]. We serve the same kind of people: [shared audience], though at a different stage: you help with [their focus] and I help with [your focus].

I'd like to explore whether we could refer to each other. When your clients need [what you do], I'd be honored to take great care of them, and I'd gladly do the same for [what they do].

Could we chat for 15 minutes on [Day/Time]?

[Your Name]`),

  item("Prospecting", "sales", "script", "Cold Call Voicemail", "Under 25 seconds. Give a reason to call back.", "voicemail, cold call", `
"Hi [Name], this is [Your Name] with [Your Business]. I help [type of client] [result], and I had an idea specifically about [something about their business]. I'll send you a short email with the details — the subject line is [subject]. You can reach me at [phone number]. Again, that's [Your Name], [phone number]. Have a great day."`),

  item("Prospecting", "sales", "script", "Cold Call Opener", "The first 20 seconds — permission-based and human.", "cold call, opener", `
"Hi [Name], this is [Your Name] with [Your Business]. I know I'm calling out of the blue — do you have 30 seconds so I can tell you why, and then you can tell me whether it makes sense to keep talking?"
(If yes:)
"I work with [type of client] who are struggling with [problem]. I noticed [specific observation about them]. Is that something you're dealing with, or am I off base?"
(Listen. Ask one follow-up question. Then:)
"It sounds like it could be worth a longer conversation. Would [Day] at [Time] work for 15 minutes?"`),

  /* ───────────── OBJECTIONS ───────────── */
  item("Objections", "objection", "script", "\"It's too expensive\"", "Reframe cost as investment without getting defensive.", "price, cost", `
"I hear you, [Name] — and I want to make sure this makes sense for you. Can I ask: when you say it's too expensive, is it that the amount is more than you planned for, or that you're not yet sure it will pay off?"
(Listen — the answer tells you which path to take.)

IF BUDGET:
"Thank you for being open. Let's look at what's possible: [payment plan / smaller starting package]. Would either of those work?"

IF VALUE:
"That's fair. You told me [their problem] costs you about [amount/impact] each [period]. If this gets you [result], it pays for itself in [timeframe]. Does that match how you see it?"`),

  item("Objections", "objection", "script", "\"I need to think about it\"", "Find out what's really behind the pause.", "stall, think about it", `
"Of course — this is an important decision and you should feel sure. So I can be helpful: what specifically would you like to think through?"
(Pause. Let them answer.)

"Is it more about [price], [timing] or whether it will work for you?"

"Thank you — that's really useful. [Address the one they name.] If that's resolved, is there anything else that would hold you back from saying yes?"
(If none:) "Then would it help to pick a time to talk again — say [Day] — so you're not left wondering?"`),

  item("Objections", "objection", "script", "\"Now isn't the right time\"", "Respect timing while testing whether it's true.", "timing, later", `
"That makes sense. Help me understand — what's going on right now that makes the timing tough?"
(Listen.)

"If timing weren't a factor, would this be something you'd want to do?"
(If yes:) "Then let's figure out what needs to happen for the timing to work. What would be different in [month]?"

"Here's what I've seen: waiting usually means [cost of delay — a specific consequence]. Could we start with [smaller first step] now, so you're not starting from zero later?"`),

  item("Objections", "objection", "script", "\"I need to talk to my partner\"", "Include the decision-maker instead of losing momentum.", "partner, decision maker", `
"Absolutely — a decision like this should be shared. What do you think [Partner's Name] will want to know?"
(Listen and note their concerns.)

"Would it help if I joined a short call with both of you so I can answer questions directly? I have [Day/Time] or [Day/Time]."

(If they prefer to talk alone:) "Then I'll send a one-page summary you can share. When shall we connect again — [Day]?"`),

  item("Objections", "objection", "script", "\"I've tried this before and it didn't work\"", "Acknowledge the history, then show what's different.", "skeptic, past experience", `
"Thank you for telling me that — it's important. What happened when you tried it?"
(Listen fully. Do not defend.)

"That makes sense why you'd be cautious. What I hear is that [restate what went wrong]."

"Here's how we handle that differently: [specific difference 1] and [specific difference 2]. And to make sure it works for you, we [guarantee / milestone / check-in]. Does that address what went wrong last time?"`),

  item("Objections", "objection", "script", "\"Send me more information\"", "Turn a polite brush-off into a real next step.", "brush-off, information", `
"Happy to. So I send you the right thing rather than a pile of pages — what would you most like to know?"
(Listen.)

"Great, I'll send [specific item] today. After you've had a chance to look, would it be useful to spend ten minutes on the phone to go through it? How about [Day] at [Time]?"

(If they refuse a date:) "No problem. I'll follow up on [Day] to see if you had questions."`),

  item("Objections", "objection", "script", "\"I don't have the budget\"", "Explore real constraints and options.", "budget, cash flow", `
"I appreciate your honesty. Let me ask so I understand: is the budget not there at all this quarter, or is it a matter of what's available right now?"

(If it's timing:) "Would splitting it into [payments] or starting with [smaller option] make it workable?"

(If truly not there:) "Then I don't want to push something that strains you. Can I check back in [timeframe] once things are steadier? In the meantime, I'll send you [free resource] that can help you move toward [goal]."`),

  /* ───────────── ONBOARDING ───────────── */
  item("Onboarding", "email", "template", "Welcome Email — New Client", "Sets the tone and the next steps within an hour of signing.", "welcome, new client", `
Subject: Welcome to [Your Business], [Name]!

Hi [Name],

I'm thrilled you've decided to work with me. You made a great decision, and I'm looking forward to helping you [their goal].

Here's what happens next:
1. [First step — e.g. complete the intake form: link]
2. [Second step — e.g. book your kickoff call: link]
3. [Third step — e.g. gather the following materials: list]

If you have any questions before then, reply to this email or call me at [phone].

I'm glad you're here,
[Your Name]`),

  item("Onboarding", "sales", "script", "Kickoff Call Agenda", "A 45-minute kickoff that gets everyone aligned.", "kickoff, agenda", `
1. WELCOME (5 min) — "Thank you for choosing [Your Business]. Today we make sure we're aligned on goals, process and expectations."

2. THEIR GOALS (10 min)
"In your own words, what does success look like at the end of [engagement length]?"
"What would make you say 'this was worth it'?"

3. HOW WE'LL WORK (10 min)
Walk through: [process], [timeline], [communication channels], [meeting rhythm].

4. WHAT I NEED FROM YOU (10 min)
[Access, materials, decisions, response times.]

5. FIRST 30 DAYS (5 min)
Review the milestones and the first three actions.

6. QUESTIONS & NEXT STEPS (5 min)
"What questions do you have? I'll send a written recap by [time]."`),

  item("Onboarding", "email", "template", "Intake Questionnaire Request", "Ask for the information you need in one tidy message.", "intake, questionnaire", `
Subject: A few questions before we begin

Hi [Name],

So I can hit the ground running, please take about [10–15] minutes to complete this short intake: [link].

It covers:
• Your current situation with [topic]
• Your top three goals for [engagement]
• Anything you've tried already
• Anything you'd like me to know that isn't obvious

Please complete it by [date] so I can prepare for our [kickoff/session] on [date].

Thank you!
[Your Name]`),

  item("Onboarding", "email", "template", "First-Week Check-In", "Catch confusion early, while it's easy to fix.", "check-in, first week", `
Subject: How's your first week going?

Hi [Name],

Just a quick check-in. How are things going so far with [service/product]?

• Is there anything that's unclear?
• Have you been able to [first key action]?
• Is there anything I could do to make this easier?

If a quick call would help, grab a time here: [link]. Otherwise, just reply with a line or two.

[Your Name]`),

  item("Onboarding", "email", "template", "Expectations & Boundaries", "Prevent scope creep and missed messages, kindly.", "expectations, boundaries, policies", `
Subject: How we'll work together

Hi [Name],

So we both have a smooth experience, here's how I work:

COMMUNICATION — I respond to messages within [timeframe] on [business days]. For urgent things, [how to reach you].
SESSIONS — [length and rhythm]. If you need to reschedule, please give [notice period].
WHAT'S INCLUDED — [scope]. Anything beyond that, I'll let you know before it affects your invoice.
PAYMENT — [terms].

If any of this doesn't feel right, tell me now and we'll adjust. Thanks for being a wonderful client!

[Your Name]`),

  item("Onboarding", "email", "template", "Tool & Access Instructions", "Walk a new client through logins and platforms.", "access, setup, tools", `
Subject: Getting you set up with [Tool/Platform]

Hi [Name],

Here's how to get access to everything:

1. [Tool] — go to [link] and sign in with [email]. You'll receive an invitation from [sender]; it may land in spam.
2. [Second tool] — [steps].
3. [Shared folder] — [link]. Please add your [documents] here.

If anything doesn't work, reply with a screenshot and I'll sort it out quickly. I can also do a 10-minute screen share on [days].

[Your Name]`),

  item("Onboarding", "sales", "script", "30-Day Review Call", "Celebrate progress and reset the plan.", "review, 30 day, progress", `
"[Name], we're a month in — I'd like to look at how it's going and make sure the next 30 days serve you even better."

WINS: "What's gone well so far? What's a win you're proud of?"
(Add the wins you've noticed: [win 1], [win 2].)

CHALLENGES: "What's been harder than expected? Is there anything I should be doing differently?"

PROGRESS: "Against your goal of [goal], we're at [status]."

NEXT 30 DAYS: "Here's what I recommend we focus on: [priority 1], [priority 2]. Does that feel right?"

"Is there anyone else you know who'd benefit from this? I'd love to help them too."`),

  /* ───────────── FOLLOW-UP ───────────── */
  item("Follow-up", "email", "template", "After No Response — Gentle Nudge", "A kind, no-pressure follow-up.", "no response, nudge", `
Subject: Re: [Original subject]

Hi [Name],

I wanted to circle back on my previous message about [topic]. I know things get busy, and this may not be the right timing — that's completely okay.

If it's still of interest, I'm happy to [next step]. If not, just let me know and I won't take up more of your time.

Wishing you a great [week/month],
[Your Name]`),

  item("Follow-up", "email", "template", "After a Discovery Call", "Recap within a few hours, with one clear next step.", "recap, discovery, follow-up", `
Subject: Great talking today, [Name]

Hi [Name],

Thank you for your time today. Here's what I took away:

• Your goal: [goal]
• The main obstacle: [obstacle]
• What success looks like: [outcome]

As we discussed, the next step is [next step]. [I'll send X by DATE / Please book here: link].

If I missed anything, reply and I'll adjust.

Talk soon,
[Your Name]`),

  item("Follow-up", "email", "template", "Proposal Follow-Up", "Follow up 2–3 days after sending a proposal.", "proposal, follow-up", `
Subject: Your proposal for [Project]

Hi [Name],

I wanted to check in on the proposal I sent on [date]. Have you had a chance to look through it?

I'm happy to go over any part of it or adjust anything that doesn't feel right — [pricing, scope, timeline].

If it helps, we could take 15 minutes on [Day] to walk through it together.

Best,
[Your Name]`),

  item("Follow-up", "email", "template", "After a Webinar or Event", "Follow up with attendees and no-shows.", "webinar, event, attendees", `
Subject: Thanks for joining — here's [replay/resource]

Hi [Name],

Thank you for joining [Event] on [date]! [Or: Sorry we missed you at [Event].]

Here's the [replay / slides / resource]: [link].

The three key takeaways were:
1. [Takeaway 1]
2. [Takeaway 2]
3. [Takeaway 3]

If you'd like help applying this to your situation, you can book a free [length]-minute call here: [link].

[Your Name]`),

  item("Follow-up", "email", "template", "Missed Appointment", "Reschedule without guilt.", "no-show, reschedule", `
Subject: We missed you today

Hi [Name],

We had a [call/appointment] scheduled for [time] and I didn't see you. No worries — things happen!

If you'd still like to connect, here's a link to reschedule: [link]. If your priorities have changed, just let me know and I'll follow up another time.

[Your Name]`),

  item("Follow-up", "email", "template", "Gentle Payment Reminder", "A courteous nudge for an overdue invoice.", "invoice, payment, reminder", `
Subject: Friendly reminder — Invoice [#]

Hi [Name],

I hope you're doing well. This is a friendly reminder that invoice [#] for [amount], due [date], hasn't been paid yet. I've attached it again, and you can pay here: [payment link].

If you've already sent it, thank you — please disregard this note. If there's a problem, tell me and we'll work something out.

Thanks so much,
[Your Name]`),

  item("Follow-up", "email", "template", "The Breakup Email", "The final message that often gets the reply.", "breakup, last attempt", `
Subject: Should I close your file?

Hi [Name],

I've reached out a few times about [topic] and haven't heard back, so I'll assume the timing isn't right or your priorities have changed.

I'm going to close your file for now so I don't keep cluttering your inbox. If [problem] becomes a priority again, just reply to this email and we'll pick it up.

Wishing you all the best,
[Your Name]`),

  /* ───────────── CONTENT ───────────── */
  item("Content", "social", "template", "Story Post — Lesson Learned", "A personal story that leads to a useful point.", "story, instagram, linkedin", `
[Hook — one line that creates curiosity: "I almost quit [thing] in [year]."]

Here's what happened: [2–3 sentences describing the situation and the low point].

Then I realized [insight].

Since then, I've [what you changed] — and [result].

If you're in the same place, try this: [one practical takeaway].

What's a lesson that took you longer than it should have? 👇`),

  item("Content", "social", "template", "Educational Carousel Outline", "Slide-by-slide structure for a how-to carousel.", "carousel, educational", `
SLIDE 1 (hook): [Number] mistakes that keep [audience] from [result]
SLIDE 2: The problem — why [topic] feels harder than it should
SLIDE 3: Mistake 1 — [name it] + [one-line fix]
SLIDE 4: Mistake 2 — [name it] + [one-line fix]
SLIDE 5: Mistake 3 — [name it] + [one-line fix]
SLIDE 6: What to do instead — [simple framework in 3 steps]
SLIDE 7 (CTA): Save this for later. Want help with [topic]? [Comment a word / DM / link in bio]

CAPTION: [One-sentence summary]. Which of these have you run into? Tell me below.`),

  item("Content", "social", "template", "Testimonial Post", "Show proof without bragging.", "testimonial, proof", `
"[Direct quote from client — one or two sentences about the result.]"
— [Client name/first name], [role or business]

When [Client] came to me, they were [starting situation]. Together we [what you did].

Now they [result — with a number or a specific change if possible].

That's why I do what I do. If you'd like a result like this, [call to action: DM me / book a call / link in bio].`),

  item("Content", "social", "template", "Launch Announcement Post", "Announce an offer, product or event.", "launch, announcement", `
🎉 It's here: [Offer Name]!

For [who it's for] who want [result], I created [what it is].

Inside you'll get:
✓ [Benefit 1]
✓ [Benefit 2]
✓ [Benefit 3]

[Price / how long / how many spots] — enrollment closes [date].

👉 [Link or how to join]

Questions? Drop them in the comments and I'll answer every one.`),

  item("Content", "social", "template", "Behind-the-Scenes Post", "Build trust by showing how the work gets done.", "behind the scenes, authenticity", `
A peek behind the curtain 👀

Today I'm working on [project/task]. Here's what that actually looks like: [honest description — the mess, the process, the decisions].

One thing most people don't realize about [your field]: [insight].

What would you like to see more of behind the scenes? Tell me and I'll share it.`),

  item("Content", "email", "template", "Weekly Newsletter", "A simple, repeatable structure for a value-first email.", "newsletter, email list", `
Subject: [Curiosity-driven subject or the week's key idea]

Hi [Name],

THIS WEEK'S IDEA
[Two or three short paragraphs on one useful idea, story or lesson.]

ONE THING TO TRY
[A specific action they can take in five minutes.]

WORTH A LOOK
[A resource, article or tool you recommend, and why.]

FROM ME
[A short update on what you're working on, or an invitation: link to book, join or reply.]

Until next week,
[Your Name]

P.S. [Optional: one personal note or a low-pressure offer.]`),

  item("Content", "social", "script", "30-Second Video Script", "For Reels, Shorts and TikTok.", "video, reel, short form", `
HOOK (0–3 sec): "If you're [audience] and you keep [struggle], watch this."

PROBLEM (3–10 sec): "Most people [common mistake], and it costs them [consequence]."

SOLUTION (10–25 sec): "Instead, do this: [step 1], [step 2], [step 3]."

CTA (25–30 sec): "Follow for more [topic] tips — and comment [word] if you want [freebie]."

(On screen: big text for the hook, a caption for each step, your face in the first two seconds.)`),

  /* ───────────── NURTURE ───────────── */
  item("Nurture", "email", "template", "Monthly Client Check-In", "Stay top-of-mind with existing clients.", "check-in, retention", `
Subject: Checking in, [Name]

Hi [Name],

It's been a little while, so I wanted to see how things are going with [their goal/project].

• What's going well?
• What's been challenging lately?
• Is there anything I could help with?

Even a one-line reply helps me know how to be useful. And if you'd like to talk it through, my calendar is here: [link].

Rooting for you,
[Your Name]`),

  item("Nurture", "email", "template", "Milestone or Birthday Note", "Celebrate something personal — it's remembered.", "birthday, milestone, personal", `
Subject: Happy [birthday / anniversary], [Name]!

Hi [Name],

I wanted to send you a quick note to say [happy birthday / congratulations on your milestone]. [One personal, specific line — what you appreciate about them or what they've achieved.]

Thank you for being part of [Your Business]. I hope [the day/year] is full of [something meaningful].

Warmly,
[Your Name]`),

  item("Nurture", "email", "template", "Value-Share Email", "Give something useful with no ask.", "value, resource, nurture", `
Subject: Thought of you — [topic]

Hi [Name],

I came across [article / tool / idea] and thought of you because you mentioned [their goal or challenge].

The part I found most useful: [one sentence].

Here's the link: [link]

No need to reply — just wanted you to have it. And if you'd like to talk about how this applies to [their situation], I'm happy to.

[Your Name]`),

  item("Nurture", "email", "template", "Re-Engagement Email", "Wake up a quiet subscriber or past client.", "re-engagement, win-back", `
Subject: Still interested in [topic]?

Hi [Name],

It's been a while since we connected, and I wanted to check whether [topic] is still something you care about.

A lot has changed at [Your Business]: [update 1] and [update 2].

If it's helpful, here's [best resource or offer]: [link].

If you'd rather not hear from me, you can [unsubscribe/opt out here]. No hard feelings!

[Your Name]`),

  item("Nurture", "email", "template", "Feedback & Testimonial Request", "Ask when the win is fresh.", "testimonial request, feedback", `
Subject: Would you share your experience?

Hi [Name],

Congratulations on [result]! It's been a pleasure working with you.

Would you be willing to answer three quick questions? Your answers help me improve and help others decide if working with me is right for them.

1. What was going on before we started?
2. What changed after working together?
3. What would you tell someone considering it?

You can reply here or [record a short video / use this form: link]. Thank you so much!

[Your Name]`),

  item("Nurture", "email", "template", "Client Anniversary Email", "Mark a year together and open the next chapter.", "anniversary, loyalty", `
Subject: One year together, [Name]

Hi [Name],

It's been a year since we started working together. I looked back at where you began — [starting point] — and where you are now: [progress]. That's real growth, and you did it.

Thank you for trusting me with [their business/goal].

As we head into the next year, I'd like to talk about what's next for you: [possible new goal or offer]. Do you have 20 minutes on [Day]?

With gratitude,
[Your Name]`),

  item("Nurture", "email", "template", "Cold-Lead Nurture — Email 1 (Educate)", "The first message in a value-first sequence.", "sequence, lead nurture", `
Subject: The [number] things I wish [audience] knew about [topic]

Hi [Name],

Thanks for [downloading / signing up for] [lead magnet]. Since you're interested in [topic], I want to share what I see most often:

1. [Insight 1 — one sentence + why it matters]
2. [Insight 2]
3. [Insight 3]

Over the next few days, I'll share [what's coming: stories, case studies, a step-by-step]. In the meantime, what's your biggest question about [topic]? Reply and I'll answer personally.

[Your Name]`),

  /* ───────────── CLOSING ───────────── */
  item("Closing", "sales", "script", "Trial Close Questions", "Check the temperature before you ask for the sale.", "trial close, temperature", `
Use these during the conversation, not just at the end:

• "How does that sound so far?"
• "Is this what you were hoping to find?"
• "On a scale of 1–10, how well does this fit what you need?" (If below 8: "What would make it a 10?")
• "Can you picture yourself using/doing this?"
• "What would need to happen for you to feel ready to move forward?"

Then: "It sounds like this is a strong fit. Shall we get you started?"`),

  item("Closing", "sales", "script", "Assumptive Close", "Move naturally to logistics once they've said yes in spirit.", "assumptive, close", `
"Great — it sounds like we're on the same page about [goal] and how we'll get there."

"Here's how we'll start: [first step]. I have [Day] or [Day] available for [kickoff/first session]. Which works better for you?"

(Once they choose:) "Perfect. I'll send you the agreement and [payment link] right after this call. You'll receive [welcome email] within the hour. Is [email] the best address?"`),

  item("Closing", "sales", "script", "Real-Deadline Close", "Create urgency only when it's genuine.", "urgency, deadline", `
Only use if the deadline is real.

"[Name], I want to be transparent: [the reason for the deadline — limited spots / a price change on DATE / a cohort that starts on DATE]. If you'd like to be part of [program], I need to hear from you by [date/time]."

"Is there anything that would prevent you from deciding by then?"
(Resolve any concerns.)

"Shall I reserve your spot?"`),

  item("Closing", "email", "template", "Next Steps After a Yes", "Confirm the deal and reduce buyer's remorse.", "confirmation, next steps", `
Subject: Welcome aboard, [Name]! Here's what's next

Hi [Name],

I'm so happy you said yes! Here's what happens now:

1. Sign the agreement: [link]
2. Complete payment: [link] — [amount / terms]
3. Book your kickoff: [link]

Once those are done, you'll get [welcome materials] and we'll start on [date].

If you have any questions at all, call or text me at [phone].

I can't wait to get started,
[Your Name]`),

  item("Closing", "dm", "template", "Yes! Celebration Text", "A warm personal note right after they commit.", "text, celebration, confirmation", `
Hi [Name]! It's [Your Name]. I just wanted to say thank you for trusting me with [project/goal]. I'm really excited to work with you! 🎉 You'll get an email from me in a few minutes with next steps. Text me anytime if you have questions.`),

  item("Closing", "email", "template", "Graceful \"No\" Response", "Leave the door open when they decline.", "decline, no, relationship", `
Subject: Thank you, [Name]

Hi [Name],

Thank you for letting me know, and for the time you spent considering it. I appreciate your honesty.

If your situation changes or you'd like to revisit [topic], my door is always open. In the meantime, here's [helpful resource] that might be useful.

I'd love to stay in touch — would it be okay if I checked in around [month]?

Wishing you every success,
[Your Name]`),

  item("Closing", "sales", "script", "Contract & Payment Close", "Walk through the agreement so signing feels safe.", "contract, agreement, payment", `
"Thank you for choosing to work together. To make it official, I'll walk you through the agreement — it takes about five minutes."

"Here's what's covered: [scope], [timeline], [investment and payment schedule], and [cancellation/refund terms]."

"What questions do you have about anything I mentioned?"
(Answer clearly.)

"If you're comfortable, I'll send the agreement now. You can sign electronically here: [link]. Once it's signed and [payment] is received, we're officially on. When would you like to start?"`),
];

export const LIBRARY_BY_ID: Record<string, LibraryItem> = Object.fromEntries(SCRIPT_LIBRARY.map((l) => [l.id, l]));

// Pulls the [fields] out of a script, in order of first appearance, without
// repeats. (Stage directions are written in parentheses, so they aren't fields.)
export function extractFields(content: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const m of Array.from(content.matchAll(/\[([^\[\]\n]{1,60})\]/g))) {
    const label = m[1].trim();
    if (!label || seen.has(label.toLowerCase())) continue;
    seen.add(label.toLowerCase());
    out.push(label);
  }
  return out;
}

// Swaps every filled-in field for its value; empty fields stay in [brackets].
export function fillFields(content: string, values: Record<string, string>): string {
  return content.replace(/\[([^\[\]\n]{1,60})\]/g, (whole, raw: string) => {
    const v = values[raw.trim().toLowerCase()];
    return v && v.trim() ? v.trim() : whole;
  });
}
