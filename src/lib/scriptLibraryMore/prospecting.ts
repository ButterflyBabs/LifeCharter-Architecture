import { item } from "@/lib/scriptLibraryItem";
import type { LibraryItem } from "@/lib/scriptLibraryItem";

export const PROSPECTING_MORE: LibraryItem[] = [
  item("Prospecting", "dm", "template", "LinkedIn Connection Note With No Pitch", "Use when you want to connect with someone without selling anything, so the first touch feels safe.", "linkedin, connection request, no pitch", `
Hi [First name], I came across your work on [their area of focus] and really liked [one specific thing]. I am building a network of people who care about [shared topic], and I would be glad to have you in it. No agenda, just good company. Either way, I wish you a great week.
`),

  item("Prospecting", "dm", "template", "LinkedIn First Message After They Accept", "Use right after a new connection accepts, to say thanks and start a real conversation without pitching.", "linkedin, new connection, first message", `
Hi [First name], thank you for connecting. I noticed [something specific from their profile or post], and it made me curious. What is the part of [their work or industry] you are most excited about right now? I would love to hear. If you would rather keep things quiet and just stay connected, that is completely fine too.
`),

  item("Prospecting", "dm", "template", "LinkedIn Message After They Engage With Your Post", "Use when someone likes or comments on your post and you want to thank them and open a conversation.", "linkedin, engagement, warm follow-up", `
Hi [First name], thank you for [liking or commenting on] my post about [post topic]. Your point about [their comment or a detail] stuck with me. Is [post topic] something you are working on in [their business] at the moment? If so, I would be happy to share what has worked for others. If not, no worries at all, and thanks again for the support.
`),

  item("Prospecting", "dm", "template", "Instagram DM After They Comment", "Use when someone leaves a thoughtful comment on your post or reel and you want to continue the conversation privately.", "instagram, comment, warm dm", `
Hi [First name], I loved your comment on my post about [post topic]. It made me smile. I am curious, what made it resonate with you? I am always keen to hear how people are experiencing [topic] in real life. Feel free to ignore this if you are busy, and thank you for being part of the conversation here.
`),

  item("Prospecting", "dm", "template", "Facebook Group DM After a Helpful Exchange", "Use when you have traded helpful comments with a group member and want to move to a private chat respectfully.", "facebook group, dm, community", `
Hi [First name], we have both been chatting in [group name], and I really enjoyed your thoughts on [topic]. I do not want to be that person who messages out of nowhere, so I will keep it simple. I help [who you help] with [what you help with], and I would be glad to answer any questions you have. If you would rather keep things in the group, that is perfectly fine.
`),

  item("Prospecting", "dm", "template", "Comment Then DM Sequence", "Use when you want to warm someone up with a genuine public comment first and follow with a short private message a day or two later.", "comment first, dm sequence, social selling", `
STEP 1, public comment on their post (day one):
[Specific, genuine reaction to something in their post. One or two sentences, no link, no pitch.]

STEP 2, direct message (one or two days later):
Hi [First name], I left a comment on your post about [post topic] the other day. It stayed with me, so I wanted to say thank you for sharing it. Are you planning more on [topic]? I would love to see it. No need to reply if you are busy.
`),

  item("Prospecting", "dm", "template", "Text Message After Meeting in Person", "Use within a day of meeting someone at an event or in a casual setting, to keep the connection warm.", "text message, in person, networking", `
Hi [First name], it is [your first name] from [where you met]. It was great talking with you about [what you discussed]. I would enjoy continuing the conversation sometime. Would a quick call or coffee in the next couple of weeks suit you? If your schedule is full, no pressure at all, I am just glad we met.
`),

  item("Prospecting", "dm", "template", "Webinar or MasterClass Invitation DM", "Use to invite a warm contact to a free session in a way that feels like a gift, not a pitch.", "webinar invite, masterclass, event dm", `
Hi [First name], I am hosting a free [webinar or MasterClass] on [date and time] called [event title]. We will cover [one or two things they will learn], and I thought of you because of [reason]. Here is the link if you would like a seat: [registration link]. If the timing is not right, I can send the replay instead. No pressure either way.
`),

  item("Prospecting", "email", "template", "Cold Email Compliment First", "Use when you have a genuine, specific thing to appreciate about a prospect's work before you mention how you help.", "cold email, compliment, personalised", `
Subject: Your [recent post, project or episode]

Hi [First name],

I recently read [their specific work] and especially liked [one specific detail]. It is a clear example of [quality you admire].

I work with [type of business] to [result you help create]. Based on what you are building, I thought there might be a useful overlap, and I would be glad to share a quick idea or two if that would be welcome.

If now is not the right time, or this is not a fit, just let me know and I will leave you in peace.

Warm regards,
[Your name]
[Your business]
`),

  item("Prospecting", "email", "template", "Cold Email Case Study First", "Use when you have a relevant client result that can show a prospect what is possible, told briefly and honestly.", "cold email, case study, proof", `
Subject: How [client type] got [result]

Hi [First name],

A [type of client] came to me recently struggling with [problem]. Over [timeframe], we [what you did in one sentence], and they went from [before] to [after].

I noticed [something about their business] and wondered whether you are facing something similar. If so, I would be glad to share how it worked, with no obligation.

If this is not relevant, no worries at all, and thank you for reading.

Kind regards,
[Your name]
[Your business]
`),

  item("Prospecting", "email", "template", "Cold Email Follow-Up Number 2", "Use three to five days after a first cold email that has had no reply, adding something useful instead of just checking in.", "follow-up, cold email, second touch", `
Subject: Re: [Original subject line]

Hi [First name],

I wanted to follow up on my note from last week. In case it is useful, here is [a short tip, resource or insight related to their situation]: [link or one-line tip].

If [original topic] is on your radar, I would love to hear how you are approaching it. If the timing is off, just say the word and I will stop reaching out.

All the best,
[Your name]
[Your business]
`),

  item("Prospecting", "email", "template", "Cold Email Final Follow-Up Number 3", "Use as the last, gracious note in a cold sequence, closing the loop and leaving the door open.", "follow-up, final email, close the loop", `
Subject: Closing the loop

Hi [First name],

I have reached out a couple of times about [topic] and have not heard back, which tells me this is probably not a priority right now. That is completely fine, and I will not keep filling your inbox.

If things change, you are welcome to reach me any time at [email or phone]. In the meantime, I am cheering for [their business].

Warm wishes,
[Your name]
[Your business]
`),

  item("Prospecting", "email", "template", "Podcast Guest Pitch", "Use to pitch yourself as a guest to a show whose audience matches the people you help.", "podcast, guest pitch, visibility", `
Subject: Guest idea for [Podcast name]

Hi [Host first name],

I have been listening to [Podcast name] and especially enjoyed the episode on [episode topic]. Your audience clearly cares about [audience interest].

I help [who you help] with [what you help with], and I could share [talking point one], [talking point two] and [talking point three] with your listeners in a practical, story-led way.

Here is a short bio and a few past appearances: [link]. If it is not the right fit, no worries at all, and thank you for the work you put into the show.

Kind regards,
[Your name]
`),

  item("Prospecting", "email", "template", "Past Client Introduction Request", "Use to ask a happy past client whether they would be comfortable introducing you to someone who could benefit.", "referral, past client, introduction", `
Subject: A small favour, if you are open to it

Hi [Client first name],

I hope you are doing well. I was thinking about the progress you made with [result they achieved], and it made my day all over again.

I am looking to work with a few more people like you, namely [description of ideal client]. Do you know anyone who might benefit from a conversation? If someone comes to mind, I would be glad to write a short note you can forward, so it takes you almost no effort.

If you would rather not, that is entirely okay, and I am grateful for you either way.

Warmly,
[Your name]
`),

  item("Prospecting", "sales", "script", "Warm Lead Voicemail", "Use when a warm lead who already knows you does not pick up, to leave a short, friendly message with an easy way to reply.", "voicemail, warm lead, follow-up call", `
(Smile and speak slowly. Aim for under 30 seconds.)

Hi [First name], this is [your name] from [your business]. We connected [where or how you connected], and I wanted to follow up on [what they were interested in].

I have a couple of ideas that might help with [their goal]. If you would like to hear them, you can reach me at [phone number], or just reply to my email, whichever is easier.

If now is not a good time, no problem at all. Thanks, [First name], and I hope you have a lovely day. Again, that is [your name] at [phone number].

(Follow up with a short text or email so they have a second way to reply.)
`),

  item("Prospecting", "sales", "script", "Gatekeeper Script", "Use when an assistant or receptionist answers and you need to reach a decision maker, respectfully and without tricks.", "gatekeeper, cold call, receptionist", `
(Warm, calm and friendly. Treat the gatekeeper as a helper, not an obstacle.)

You: Hi, this is [your name] from [your business]. Could you help me? I am trying to reach [decision maker name].

(If they ask what it is about)
You: I am calling about [short, honest reason, such as how we help businesses like yours with a specific need]. I would be glad to leave a short message, or I can send an email if that is easier for them.

(If they say the person is unavailable)
You: No problem. When would be a good time to try again? And is there a best way to reach them directly?

(If they say there is no interest)
You: Understood, thank you for your time. May I leave my details in case things change?

(Always thank them by name. Note their name for next time.)
`),

  item("Prospecting", "sales", "script", "Lapsed Lead Reconnect Call", "Use to phone someone who showed interest months ago and went quiet, with no guilt and no pressure.", "lapsed lead, reconnect, follow-up call", `
You: Hi [First name], this is [your name] from [your business]. Do you have a minute? I will be brief.

(Pause for their answer.)

You: A while back we spoke about [what they were interested in]. I have been thinking of you and wanted to see how things are going with [their goal].

(Listen. Reflect back what you hear.)

You: Thank you for sharing that. A lot has changed on my side too, including [new offer, update or result]. Would it be useful for me to send you the details, or have a short chat about where you are now?

(If they decline)
You: That is completely fine. I will not keep chasing. If you ever want to pick it back up, you know where to find me. Take care, [First name].
`),

  item("Prospecting", "sales", "script", "Warm Intro Request Call to a Mutual Contact", "Use to phone a mutual contact and ask, with an easy out, whether they would introduce you to someone you want to meet.", "warm intro, mutual contact, referral call", `
You: Hi [Contact first name], it is [your name]. Do you have two minutes? I have a small favour to ask, and there is no pressure.

(Pause for their answer.)

You: I noticed you know [Target person]. I would love to meet them because [honest, specific reason that helps them too]. Would you feel comfortable making an introduction?

(If yes)
You: Thank you, that means a lot. I can write a short note you can forward, so it takes you no time. Is email best?

(If hesitant)
You: Of course. Only if it feels right to you. I appreciate you hearing me out either way.

(Send a thank you message afterwards and keep them updated on how it goes.)
`),
];
