-- Collective pathway: "Find an Accountability Partner" in Community (public to every
-- Collective member), with Babs's pinned welcome post. Members introduce themselves
-- and what kind of accountability helps; Command Suite clients then invite the person
-- they've found from Daily Operations → Accountability Partner.
insert into public.cm_channels (space_id, slug, name, emoji, description, kind, post_policy, prompt, sort_order)
select s.id, 'accountability-partners', 'Find an Accountability Partner', '💪',
  'Find someone to hold the other end: share what you''re working on and the kind of accountability that helps you.',
  'discussion', 'members',
  'I''m working on… The kind of accountability that helps me is… I''m usually free to check in…', 60
from public.cm_spaces s
where s.slug = 'commons'
  and not exists (select 1 from public.cm_channels c where c.space_id = s.id and c.slug = 'accountability-partners');

insert into public.cm_posts (space_id, channel_id, author_id, title, body, pinned)
select c.space_id, c.id, 'cde8e43e-953c-48dc-845f-10ba497b1c08', 'Find your accountability partner',
$body$Real change is easier with someone beside you. This channel is where you find that person.

How it works:

• Post below: what you're working on right now, the kind of accountability that helps you (a gentle nudge, a firm one, a weekly check-in, a quick text), and when you're usually free.
• Read what others have shared. If someone feels like a fit, reply to them or send a message.
• Command Suite clients can make it official: open Accountability Partner in Command Suite (https://lccommandsuite.com/accountability) and invite them by email. Your partner doesn't need an account. They get a private page of their own.
• You only ever share what you choose to add. Nothing else about your business is visible to your partner, and either of you can pause or end it any time.

Be kind, be specific, and start small. One partner who shows up beats three who don't.

Head up - Wings out
Babs 🦋$body$,
  true
from public.cm_channels c
where c.slug = 'accountability-partners'
  and not exists (select 1 from public.cm_posts p where p.channel_id = c.id and p.pinned);
