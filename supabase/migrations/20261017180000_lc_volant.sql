-- LC Volant: a transcript (any app, any device) becomes a templated report. One row per report: the template used,
-- the transcript, the AI report (sections + action items, each item remembers the task it became) and, when the
-- session was with someone, the contact it is saved on. Recordings are never stored (Phase 2 deletes them after
-- transcription); only the text is kept.
create table if not exists public.volant_reports (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null,
  template_key text not null,
  title text not null default '',
  session_date date not null default current_date,
  contact_id uuid,
  transcript text not null default '',
  report jsonb,                                       -- {sections:[{title,content,kind}], action_items:[{id,text,owner,due,task_id}], made_at, clipped}
  consent_at timestamptz,                             -- when the person ticked that everyone agreed to be recorded
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists volant_reports_plan_idx on public.volant_reports (master_plan_id, session_date desc, created_at desc);
create index if not exists volant_reports_contact_idx on public.volant_reports (contact_id) where contact_id is not null;
alter table public.volant_reports enable row level security;

-- Each account's own names: what the feature is called in their menu and on the page, and their name for each template.
create table if not exists public.volant_settings (
  master_plan_id uuid primary key,
  label text,
  template_names jsonb not null default '{}'::jsonb,  -- {template_key: "their name"}
  updated_at timestamptz not null default now()
);
alter table public.volant_settings enable row level security;

-- The contact a report is saved on (the list shows their name); deleting the contact keeps the report.
alter table public.volant_reports add constraint volant_reports_contact_fk foreign key (contact_id) references public.seq_contacts(id) on delete set null;
