-- Mailbox connections were one global 'primary' row per provider, shared by
-- every signed-in user. Scope them to the owning account, and allow several
-- mailboxes per account (limited by plan via plans.capabilities.mailboxes).
-- account_key stays the primary key; new rows use '<owner_id>:<email>'.

alter table public.google_credentials
  add column if not exists owner_id uuid references public.profiles(id) on delete cascade;
alter table public.microsoft_credentials
  add column if not exists owner_id uuid references public.profiles(id) on delete cascade;

-- The existing rows belong to the founding account.
update public.google_credentials
  set owner_id = (select id from public.profiles order by created_at limit 1)
  where owner_id is null;
update public.microsoft_credentials
  set owner_id = (select id from public.profiles order by created_at limit 1)
  where owner_id is null;

create index if not exists google_credentials_owner_idx on public.google_credentials(owner_id);
create index if not exists microsoft_credentials_owner_idx on public.microsoft_credentials(owner_id);

-- Connected email accounts allowed per tier (-1 = unlimited).
update public.plans set capabilities = jsonb_set(coalesce(capabilities, '{}'::jsonb), '{mailboxes}', '1'::jsonb)  where id = 'starter';
update public.plans set capabilities = jsonb_set(coalesce(capabilities, '{}'::jsonb), '{mailboxes}', '3'::jsonb)  where id = 'growth';
update public.plans set capabilities = jsonb_set(coalesce(capabilities, '{}'::jsonb), '{mailboxes}', '-1'::jsonb) where id = 'vip';
