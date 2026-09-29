-- Invite Tracker: who you invited to an event, whether the invite went out, and
-- (from the event's sign-up form) whether and when they registered.
create table if not exists crm_invite_lists (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null references client_master_plans(id) on delete cascade,
  name text not null,
  form_id uuid references crm_forms(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table crm_invite_lists enable row level security;

create table if not exists crm_invites (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references crm_invite_lists(id) on delete cascade,
  master_plan_id uuid not null,
  contact_id uuid references seq_contacts(id) on delete set null,
  name text,
  email text not null,
  sent_at timestamptz,
  note text,
  created_at timestamptz not null default now(),
  unique (list_id, email)
);
create index if not exists crm_invites_list on crm_invites (list_id, created_at);
alter table crm_invites enable row level security;

insert into crm_invite_lists (master_plan_id, name, form_id)
select 'acc142bf-68d5-4d44-97dc-f25b00a3cef1', 'Behind the Scenes Sneak Peek (Fri Oct 2)', '9a26396f-82a9-4e80-a838-9c53ea63f17e'
where not exists (select 1 from crm_invite_lists where form_id = '9a26396f-82a9-4e80-a838-9c53ea63f17e');
