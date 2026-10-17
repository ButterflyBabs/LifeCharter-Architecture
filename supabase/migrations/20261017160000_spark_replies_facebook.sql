-- LC Spark: reply from the Suite (owner messages, take-over switch) and a Facebook Pages channel.
alter table spark_conversations drop constraint if exists spark_conversations_channel_check;
alter table spark_conversations add constraint spark_conversations_channel_check check (channel in ('web','instagram','facebook'));
alter table spark_conversations
  add column if not exists ai_paused boolean not null default false,
  add column if not exists needs_reply boolean not null default false,
  add column if not exists visitor_handle text,
  add column if not exists last_visitor_at timestamptz;
update spark_conversations c set last_visitor_at = (select max(created_at) from spark_messages m where m.conversation_id = c.id and m.role = 'visitor') where last_visitor_at is null;

alter table spark_messages drop constraint if exists spark_messages_role_check;
alter table spark_messages add constraint spark_messages_role_check check (role in ('visitor','assistant','system','owner'));

alter table spark_settings
  add column if not exists fb_enabled boolean not null default false,
  add column if not exists fb_page_id text,
  add column if not exists fb_page_name text,
  add column if not exists fb_user_id text,
  add column if not exists fb_access_token text;

-- Pages the owner can pick from right after Facebook sign-in (tokens inside, 15 minutes, service role only).
create table if not exists spark_fb_pending (
  master_plan_id uuid primary key,
  fb_user_id text not null,
  pages jsonb not null default '[]'::jsonb,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
alter table spark_fb_pending enable row level security;
