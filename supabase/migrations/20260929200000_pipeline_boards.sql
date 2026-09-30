-- Many outreach pipelines per account. The DM Pipeline becomes one board of several;
-- each board has its own stages (add, remove, reorder), a short tag, and a tag per
-- stage that follows the contact from stage to stage.
create table if not exists pipeline_boards (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null references client_master_plans(id) on delete cascade,
  name text not null,
  tag text,                         -- short prefix, e.g. "masterclass-dm"; also given to everyone on the board
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists pipeline_boards_plan on pipeline_boards (master_plan_id, sort_order);
alter table pipeline_boards enable row level security;

alter table dm_stages add column if not exists board_id uuid references pipeline_boards(id) on delete cascade;
alter table dm_stages add column if not exists tag text;
alter table dm_cards add column if not exists board_id uuid references pipeline_boards(id) on delete cascade;
alter table dm_cards alter column platform drop not null;
alter table dm_cards alter column platform drop default;
alter table dm_cards drop constraint if exists dm_cards_platform_check;
alter table dm_cards add constraint dm_cards_platform_check check (platform is null or platform in ('IG', 'FB', 'LI', 'Email', 'TXT'));

-- One board for every account that already has DM stages.
insert into pipeline_boards (master_plan_id, name, tag)
select distinct s.master_plan_id,
  coalesce(nullif(p.dm_pipeline_name, ''), 'DM Pipeline'),
  case when p.id = 'acc142bf-68d5-4d44-97dc-f25b00a3cef1' then 'masterclass-dm' else 'dm' end
from dm_stages s join client_master_plans p on p.id = s.master_plan_id
where not exists (select 1 from pipeline_boards b where b.master_plan_id = s.master_plan_id);
update dm_stages s set board_id = b.id from pipeline_boards b where b.master_plan_id = s.master_plan_id and s.board_id is null;
update dm_cards c set board_id = s.board_id from dm_stages s where s.id = c.stage_id and c.board_id is null;
update dm_stages s set tag = b.tag || '-' || case s.key
    when 'to_reach' then 'reach-out' when 'sent' then 'sent' when 'followed_up' then 'followed-up'
    when 'conversation' then 'conversation' when 'invited' then 'invited' when 'booked' then 'booked'
    when 'nurture' then 'nurture' when 'not_now' then 'not-now' else 'stage' end
  from pipeline_boards b where b.id = s.board_id and s.tag is null;
alter table dm_stages alter column board_id set not null;
alter table dm_cards alter column board_id set not null;
create index if not exists dm_stages_board on dm_stages (board_id, sort_order);
create index if not exists dm_cards_board on dm_cards (board_id, stage_id, sort_order);
