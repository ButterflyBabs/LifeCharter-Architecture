-- The LifeCharter Collective — starting spaces, channels and invite codes.
-- Idempotent: re-running leaves existing spaces/channels/codes untouched.

-- Super admin: the account owner.
insert into public.cm_admins (user_id)
select id from auth.users where lower(email) = 'amilynne@amilynnecarroll.com'
on conflict do nothing;

insert into public.cm_spaces (slug, name, tagline, description, emoji, section, visibility, is_default, sort_order) values
  ('start-here', 'Start Here', 'Welcome to The LifeCharter Collective',
   'How the Collective works, who''s here, and what''s happening.', '👋', 'start', 'public', true, 10),
  ('commons', 'The Commons', 'Purpose, Clarity and Aligned Action — together',
   'The heartbeat of the Collective. Open to every member.', '🧭', 'community', 'public', true, 20),
  ('lifecharter-program', 'LifeCharter Program', 'Your flagship transformation experience',
   'The private space for LifeCharter Program participants.', '🦋', 'programs', 'private', false, 30),
  ('command-suite', 'LifeCharter Command Suite', 'Where we build it',
   'Implementation, systems and support for Command Suite members.', '⚙️', 'programs', 'private', false, 40),
  ('coaching-certification', 'Coaching Certification', 'Become a Certified LifeCharter Coach',
   'Training, practice and case discussion for certification candidates.', '🎓', 'programs', 'private', false, 50),
  ('command-shift-masterclass', 'Command Shift MasterClass', 'Stop living by reaction. Start living by command.',
   'The MasterClass learning space.', '⚡', 'programs', 'private', false, 60),
  ('command-shift-challenge', 'Command Shift 21 Day Challenge', '21 days to reclaim your time, energy and aligned action',
   'Challenge HQ — daily shifts, actions and check-ins.', '🔥', 'programs', 'private', false, 70),
  ('incubator', 'LifeCharter Incubator', 'We build things here',
   'Hope seats, implementation and feedback for Incubator members.', '🚀', 'programs', 'private', false, 80),
  ('soul-sessions', 'SOUL Sessions', 'Sessions, reflections and resources',
   'The private space for SOUL Sessions members.', '✨', 'programs', 'private', false, 90),
  ('alumni', 'LifeCharter Alumni', 'Always part of the Collective',
   'For everyone who has completed a LifeCharter program.', '🌟', 'alumni', 'private', false, 100),
  ('certified-coaches', 'Certified LifeCharter Coaches', 'The professional community',
   'For Certified LifeCharter Coaches.', '🧭', 'alumni', 'private', false, 110)
on conflict (slug) do nothing;

-- Channels: (space slug, channel slug, name, emoji, kind, post policy, prompt, order)
insert into public.cm_channels (space_id, slug, name, emoji, kind, post_policy, prompt, sort_order)
select s.id, c.slug, c.name, c.emoji, c.kind, c.policy, c.prompt, c.ord
from (values
  ('start-here', 'welcome', 'Welcome to LifeCharter', '👋', 'announcements', 'moderators', null, 10),
  ('start-here', 'introductions', 'Introduce Yourself', '🦋', 'discussion', 'members',
     'Where are you right now, what are you creating, and what does alignment look like for you today?', 20),
  ('start-here', 'announcements', 'Announcements', '📣', 'announcements', 'moderators', null, 30),
  ('start-here', 'whats-happening', 'What''s Happening', '📅', 'announcements', 'moderators', null, 40),

  ('commons', 'alignment-anchor', 'Alignment Anchor', '⚓', 'announcements', 'moderators', null, 10),
  ('commons', 'ask-the-collective', 'Ask the Collective', '💬', 'discussion', 'members',
     'Ask a question — perspective, ideas, recommendations or support.', 20),
  ('commons', 'wins', 'Wins & Aligned Action', '🏆', 'discussion', 'members',
     'What did you move forward? Big or small, it counts.', 30),
  ('commons', 'this-weeks-intention', 'This Week''s Intention', '🎯', 'discussion', 'members',
     'What are you aligning with this week?', 40),
  ('commons', 'connect-collaborate', 'Connect & Collaborate', '🤝', 'discussion', 'members',
     'I need someone who… / I''d love to collaborate with… / Does anyone have experience with…', 50),

  ('lifecharter-program', 'home', 'Program Home', '🏠', 'announcements', 'moderators', null, 10),
  ('lifecharter-program', 'lessons', 'Lessons & Resources', '📘', 'announcements', 'moderators', null, 20),
  ('lifecharter-program', 'questions', 'Questions & Coaching', '💬', 'discussion', 'members', null, 30),
  ('lifecharter-program', 'reflections', 'Reflections', '🪞', 'discussion', 'members', null, 40),
  ('lifecharter-program', 'aligned-action', 'Aligned Action', '🎯', 'discussion', 'members', null, 50),
  ('lifecharter-program', 'replays', 'Replays', '▶️', 'announcements', 'moderators', null, 60),

  ('command-suite', 'home', 'Command Suite Home', '🏠', 'announcements', 'moderators', null, 10),
  ('command-suite', 'implementation-lab', 'Implementation Lab', '🛠️', 'discussion', 'members', null, 20),
  ('command-suite', 'systems-automation', 'Systems & Automation', '⚙️', 'discussion', 'members', null, 30),
  ('command-suite', 'questions', 'Questions & Support', '💬', 'discussion', 'members', null, 40),
  ('command-suite', 'show-your-build', 'Show Your Build', '✨', 'discussion', 'members',
     'Look what I created this week…', 50),

  ('coaching-certification', 'home', 'Certification Home', '🏠', 'announcements', 'moderators', null, 10),
  ('coaching-certification', 'curriculum', 'Training & Curriculum', '📘', 'announcements', 'moderators', null, 20),
  ('coaching-certification', 'practice-lab', 'Practice Lab', '🧪', 'discussion', 'members', null, 30),
  ('coaching-certification', 'case-discussions', 'Case Discussions', '🗂️', 'discussion', 'members', null, 40),
  ('coaching-certification', 'requirements', 'Certification Requirements', '✅', 'announcements', 'moderators', null, 50),
  ('coaching-certification', 'coach-resources', 'Coach Resources', '📚', 'announcements', 'moderators', null, 60),

  ('command-shift-masterclass', 'start-here', 'Start Here', '👋', 'announcements', 'moderators', null, 10),
  ('command-shift-masterclass', 'masterclass', 'MasterClass', '⚡', 'announcements', 'moderators', null, 20),
  ('command-shift-masterclass', 'implementation', 'Implementation', '🛠️', 'discussion', 'members', null, 30),
  ('command-shift-masterclass', 'questions', 'Questions', '💬', 'discussion', 'members', null, 40),
  ('command-shift-masterclass', 'replay', 'Replay & Resources', '▶️', 'announcements', 'moderators', null, 50),

  ('command-shift-challenge', 'hq', 'Challenge HQ', '🏁', 'announcements', 'moderators', null, 10),
  ('command-shift-challenge', 'daily-shift', 'Daily Command Shift', '☀️', 'announcements', 'moderators', null, 20),
  ('command-shift-challenge', 'todays-action', 'Today''s Action', '🎯', 'discussion', 'members',
     'What''s your action today?', 30),
  ('command-shift-challenge', 'check-in', 'Check In', '✅', 'discussion', 'members', 'Day __ — here''s where I am…', 40),
  ('command-shift-challenge', 'wins', 'Wins', '🏆', 'discussion', 'members', null, 50),

  ('incubator', 'hq', 'Incubator HQ', '🏠', 'announcements', 'moderators', null, 10),
  ('incubator', 'this-weeks-focus', 'This Week''s Focus', '🎯', 'announcements', 'moderators', null, 20),
  ('incubator', 'hope-seats', 'Hope Seats', '🌱', 'discussion', 'members', null, 30),
  ('incubator', 'implementation-lab', 'Implementation Lab', '🛠️', 'discussion', 'members', null, 40),
  ('incubator', 'feedback', 'Feedback & Review', '🔍', 'discussion', 'members', null, 50),
  ('incubator', 'resources', 'Resources', '📚', 'announcements', 'moderators', null, 60),
  ('incubator', 'wins', 'Wins', '🏆', 'discussion', 'members', null, 70),

  ('soul-sessions', 'home', 'Sessions Home', '🏠', 'announcements', 'moderators', null, 10),
  ('soul-sessions', 'reflections', 'Reflections', '🪞', 'discussion', 'members', null, 20),
  ('soul-sessions', 'resources', 'Resources', '📚', 'announcements', 'moderators', null, 30),

  ('alumni', 'home', 'Alumni Home', '🏠', 'announcements', 'moderators', null, 10),
  ('alumni', 'stay-connected', 'Stay Connected', '🤝', 'discussion', 'members', null, 20),
  ('alumni', 'wins', 'Wins', '🏆', 'discussion', 'members', null, 30),

  ('certified-coaches', 'home', 'Coaches Home', '🏠', 'announcements', 'moderators', null, 10),
  ('certified-coaches', 'coach-lounge', 'Coach Lounge', '☕', 'discussion', 'members', null, 20),
  ('certified-coaches', 'referrals', 'Referrals & Opportunities', '🤝', 'discussion', 'members', null, 30)
) as c(space_slug, slug, name, emoji, kind, policy, prompt, ord)
join public.cm_spaces s on s.slug = c.space_slug
on conflict (space_id, slug) do nothing;

-- One random 8-character invite code per space (no 0/O/1/I to avoid misreads).
insert into public.cm_space_codes (space_id, code)
select s.id, (
  select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 1 + floor(random() * 32)::int, 1), '')
  from generate_series(1, 8) where s.id is not null
)
from public.cm_spaces s
on conflict (space_id) do nothing;

-- Discover cards — what free members glimpse on the home screen.
insert into public.cm_discover_cards (space_id, title, blurb, teaser, cta_label, cta_url, sort_order)
select s.id, d.title, d.blurb, d.teaser, 'Learn more', d.url, d.ord
from (values
  ('command-shift-challenge', 'The Command Shift 21 Day Challenge',
   'A guided journey to reclaim your time, energy and aligned action.',
   null,
   'https://command-shift-landing.vercel.app/', 10),
  ('lifecharter-program', 'The LifeCharter Program',
   'The flagship transformation experience — Purpose, Clarity, Aligned Action.',
   null, null, 20),
  ('command-suite', 'LifeCharter Command Suite',
   'Your business, aligned and running — with the systems to match.',
   null, null, 30)
) as d(space_slug, title, blurb, teaser, url, ord)
join public.cm_spaces s on s.slug = d.space_slug
where not exists (select 1 from public.cm_discover_cards x where x.space_id = s.id);

-- The owner joins every space as its admin.
insert into public.cm_profiles (user_id, display_name, headline)
select id, 'AmiLynne Carroll', 'Founder, LifeCharter' from auth.users
where lower(email) = 'amilynne@amilynnecarroll.com'
on conflict (user_id) do nothing;

insert into public.cm_space_members (space_id, user_id, role, joined_via)
select s.id, u.id, 'admin', 'admin'
from public.cm_spaces s cross join auth.users u
where lower(u.email) = 'amilynne@amilynnecarroll.com'
on conflict do nothing;
