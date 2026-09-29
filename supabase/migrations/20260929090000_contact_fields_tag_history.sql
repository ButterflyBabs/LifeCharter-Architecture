-- Contacts: standard fields, relationships, custom fields, and a tag history.

alter table seq_contacts
  add column if not exists company text,
  add column if not exists job_title text,
  add column if not exists website text,
  add column if not exists address_line1 text,
  add column if not exists address_line2 text,
  add column if not exists city text,
  add column if not exists region text,
  add column if not exists postal_code text,
  add column if not exists country text,
  add column if not exists birthday date,
  add column if not exists relationships text[] not null default '{}',
  add column if not exists custom jsonb not null default '{}'::jsonb,
  -- Where the latest tag change came from (a form, an import, a person). Writers set
  -- it alongside tags; the trigger below copies it onto each history row.
  add column if not exists tag_source text;

-- The account's own extra contact fields (values live in seq_contacts.custom by key).
create table if not exists crm_custom_fields (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null references client_master_plans(id) on delete cascade,
  key text not null,
  label text not null,
  type text not null default 'text' check (type in ('text', 'long_text', 'number', 'date', 'url', 'select')),
  options text[] not null default '{}',
  position int not null default 0,
  created_at timestamptz not null default now(),
  unique (master_plan_id, key)
);
alter table crm_custom_fields enable row level security;

-- Every tag added to or removed from a contact, and when.
create table if not exists crm_tag_history (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null,
  contact_id uuid not null references seq_contacts(id) on delete cascade,
  tag text not null,
  action text not null check (action in ('added', 'removed')),
  source text,
  approximate boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists crm_tag_history_contact on crm_tag_history (contact_id, created_at desc);
create index if not exists crm_tag_history_plan_tag on crm_tag_history (master_plan_id, tag, created_at desc);
alter table crm_tag_history enable row level security;

create or replace function crm_log_tag_changes() returns trigger language plpgsql as $$
declare
  t text;
  src text;
begin
  if tg_op = 'INSERT' then
    src := coalesce(new.tag_source, new.source);
    foreach t in array coalesce(new.tags, '{}') loop
      insert into crm_tag_history (master_plan_id, contact_id, tag, action, source) values (new.master_plan_id, new.id, t, 'added', src);
    end loop;
  elsif new.tags is distinct from old.tags then
    src := new.tag_source;
    foreach t in array coalesce(new.tags, '{}') loop
      if not (t = any(coalesce(old.tags, '{}'))) then
        insert into crm_tag_history (master_plan_id, contact_id, tag, action, source) values (new.master_plan_id, new.id, t, 'added', src);
      end if;
    end loop;
    foreach t in array coalesce(old.tags, '{}') loop
      if not (t = any(coalesce(new.tags, '{}'))) then
        insert into crm_tag_history (master_plan_id, contact_id, tag, action, source) values (new.master_plan_id, new.id, t, 'removed', src);
      end if;
    end loop;
  end if;
  return new;
end $$;

drop trigger if exists seq_contacts_tag_history on seq_contacts;
create trigger seq_contacts_tag_history after insert or update of tags on seq_contacts
  for each row execute function crm_log_tag_changes();

-- Tags already on contacts before history began: dated by the contact's first
-- "Tagged …" timeline entry naming the tag, else when the contact was created.
insert into crm_tag_history (master_plan_id, contact_id, tag, action, source, approximate, created_at)
select c.master_plan_id, c.id, t.tag, 'added', c.source,
       ev.created_at is null,
       coalesce(ev.created_at, c.created_at)
from seq_contacts c
cross join lateral unnest(c.tags) as t(tag)
left join lateral (
  select e.created_at from crm_events e
  where e.contact_id = c.id and e.kind = 'tag' and e.title ilike '%' || t.tag || '%'
  order by e.created_at limit 1
) ev on true
where not exists (select 1 from crm_tag_history h where h.contact_id = c.id and h.tag = t.tag);

-- Form sign-ups give the exact moment (and form) for the tags that form adds.
update crm_tag_history h set created_at = s.created_at, source = 'form:' || s.key, approximate = false
from (
  select distinct on (sub.contact_id, t.tag) sub.contact_id, t.tag, sub.created_at, f.key
  from crm_submissions sub join crm_forms f on f.id = sub.form_id cross join lateral unnest(f.tags) t(tag)
  order by sub.contact_id, t.tag, sub.created_at
) s
where h.contact_id = s.contact_id and h.tag = s.tag and h.approximate;
update crm_tag_history set source = null where approximate;
