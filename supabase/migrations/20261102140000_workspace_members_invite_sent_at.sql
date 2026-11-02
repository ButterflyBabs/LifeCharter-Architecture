alter table public.workspace_members add column if not exists invite_sent_at timestamptz;
comment on column public.workspace_members.invite_sent_at is 'When the latest team invitation email was sent (null = never sent, or the last send failed).';
