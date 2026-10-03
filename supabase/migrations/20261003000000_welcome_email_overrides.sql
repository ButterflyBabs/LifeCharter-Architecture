-- Edits to the LCCS New Client Welcome emails. The built-in copy lives in code; a row here replaces
-- the subject, preview line and body of one email (never its schedule). Delete the row to go back to the original.
create table if not exists public.lccs_welcome_email_overrides (
  email_key text primary key,
  subject text not null,
  preview text not null default '',
  body text not null,
  updated_by text,
  updated_at timestamptz not null default now()
);
alter table public.lccs_welcome_email_overrides enable row level security;
