-- Help & FAQ for The LifeCharter Collective — editable by super admins in the app.
create table if not exists public.cm_faqs (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  question text not null,
  answer text not null,
  sort_order int not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.cm_faqs enable row level security;
create policy cm_faqs_select on public.cm_faqs for select to authenticated
  using (cm_in_collective() and (published or cm_is_admin()));
create policy cm_faqs_manage on public.cm_faqs for all to authenticated
  using (cm_is_admin()) with check (cm_is_admin());

insert into public.cm_faqs (category, question, answer, sort_order)
select * from (values
  ('Getting started', 'What is The LifeCharter Collective?',
   E'The Collective is LifeCharter''s private community — a place to create balance, build alignment and take command, alongside people who understand what that takes.\n\nEvery member has Start Here and The Commons. If you''re in a LifeCharter program, that program has its own private space inside the Collective too.', 10),
  ('Getting started', 'How do I find my way around?',
   E'Home shows what to do next: this week''s Alignment Anchor, your intention, your next session and what''s new.\n\nThe left sidebar (tap ☰ or Spaces on your phone) lists every space you belong to and its channels. Messages, Events, the LifeCharter Library, Members and this Help page are there too.', 20),
  ('Getting started', 'How do I join a program space?',
   E'Open the join link for that program, choose "Already a member", sign in, and enter the program''s invite code. The space appears in your sidebar right away.\n\nIf you don''t have the link or code, message an admin.', 30),
  ('Getting started', 'Why can''t I see some programs?',
   'Program spaces are private — you only see the ones you''ve joined. The "Explore LifeCharter" cards at the bottom of Home show other programs you might like.', 40),

  ('Posting & conversation', 'Where should I post?',
   E'Each channel has a purpose:\n• Introduce Yourself — say hello\n• Ask the Collective — questions and support\n• Wins & Aligned Action — celebrate progress, big or small\n• This Week''s Intention — name what you''re aligning with\n• Connect & Collaborate — find the people you need\n\nChannels marked as announcements are for LifeCharter updates, so you''ll see them without a post box.', 10),
  ('Posting & conversation', 'Can I add photos or videos?',
   E'Yes. Tap "Photo / video" in any post box to add up to 10 photos, videos or files. Big phone photos are resized automatically so they upload quickly.\n\nUploaded videos can be up to 50 MB (about 1–2 minutes). For longer videos, paste a YouTube, Vimeo or Loom link — it plays right in the post.\n\nYou can add photos to replies and direct messages too.', 20),
  ('Posting & conversation', 'How do I reply, react, edit or delete?',
   E'Tap "Reply" under a post to open the conversation. Tap ＋☺ to react.\n\nTo edit or delete your own post, tap ⋯ at the top right of the post. You can delete your own replies with the trash icon.', 30),
  ('Posting & conversation', 'Where can I share my offer?',
   'Every Monday a pinned "Share Your Offer" thread opens in The Commons → Connect & Collaborate. Reply there with your launch, offer, event or link — one reply per person each week. Please keep promotion out of other channels and out of direct messages unless someone asks.', 40),
  ('Posting & conversation', 'What are the community guidelines?',
   E'In short: lead with respect, what''s shared here stays here, offers go in the weekly thread, only LifeCharter records sessions, and harm ends membership.\n\nRead the full guidelines: https://lccommandsuite.com/legal/community-guidelines', 50),

  ('Messages & members', 'How do I message someone?',
   'Open Members, tap the person''s name, then tap "Message". Or go to Messages and tap "New". Conversations are private between the people in them.', 10),
  ('Messages & members', 'Can I hide my profile or turn off messages?',
   'Yes. Go to Me (your profile) → Privacy. You can hide yourself from the member directory and turn off direct messages. Your email address and phone number are never shown to other members.', 20),

  ('Events & sessions', 'How do I find and join live sessions?',
   E'Open Events. Upcoming shows what''s next; Calendar shows the month; Past & replays holds recordings.\n\nTimes are shown in your own time zone. When a session is about to start, the "Join now" button lights up gold.', 10),
  ('Events & sessions', 'Will I get a reminder?',
   'Tap "Going" on any event and you''ll get a reminder about an hour before it starts, as long as notifications are on. You can also tap "Add to calendar" to put it in your own calendar.', 20),
  ('Events & sessions', 'Can I record a session?',
   'Please don''t. Only LifeCharter records sessions, and replays are shared inside the Collective. Personal recordings, screenshots and AI notetakers aren''t allowed — please remove any notetaker from your meeting account before you join.', 30),

  ('App & notifications', 'How do I put the Collective on my phone?',
   E'Go to Me (your profile) → "Put the Collective on your phone". It shows the exact steps for your phone and browser.\n\n• iPhone, Safari: Share button at the bottom → Add to Home Screen\n• iPhone, Chrome: Share button in the address bar → Add to Home Screen\n• Android: tap "Install the Collective", or Chrome''s ⋮ menu → Install app', 10),
  ('App & notifications', 'How do I turn notifications on or off?',
   E'Open the Collective from your home-screen icon, go to Me (your profile) → Notifications, and tap "Turn on". Do this once on each device.\n\nYou''ll be notified about announcements, replies to your posts, direct messages and event reminders. You can mute a single space, or turn off email or push entirely, on the same page.', 20),
  ('App & notifications', 'I''m not getting notifications — what should I check?',
   E'• On iPhone, the Collective must be opened from its home-screen icon, not from Safari or Chrome.\n• In Me → Notifications, check it says "Push is on for this device".\n• Check the space isn''t muted in your per-space settings.\n• Check your phone''s own settings allow notifications for the Collective.\n\nNotifications can take up to 5 minutes to arrive. Emails are only sent for updates you haven''t already seen in the app.', 30),

  ('Your account', 'Is this the same login as the Command Suite?',
   'Yes. If you use LifeCharter Command Suite, sign in to the Collective with the same email and password.', 10),
  ('Your account', 'How do I change my name, photo or password?',
   E'Your name, photo and details: Me (your profile) → edit and tap "Save changes".\n\nYour password: tap "Change password" at the bottom of your profile, or "Forgot password?" on the sign-in page, and follow the email.', 20),
  ('Your account', 'How do I leave a program space?',
   'Message an admin and we''ll take care of it for you.', 30),

  ('Getting help', 'Something doesn''t look right — how do I report it?',
   'Message an admin using the button at the bottom of this page. Tell us what you saw and where. We read every report and handle each one with care.', 10)
) as v(category, question, answer, sort_order)
where not exists (select 1 from public.cm_faqs);
