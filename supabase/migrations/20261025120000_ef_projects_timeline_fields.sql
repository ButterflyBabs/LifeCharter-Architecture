-- Embraced;Fully gets the same project fields as the Suite's Projects (dates, colour, notes, board order), in its OWN tables.
alter table ef_projects add column if not exists start_date date, add column if not exists color text, add column if not exists notes text;
alter table ef_projects drop constraint if exists ef_projects_status_check;
alter table ef_projects add constraint ef_projects_status_check check (status = any (array['planning','active','on_hold','done']));
alter table ef_tasks add column if not exists start_date date, add column if not exists board_position integer not null default 0;
alter table ef_tasks add column if not exists num_id bigint generated always as identity;
create unique index if not exists ef_tasks_num_id_idx on ef_tasks (num_id);
update ef_projects p set color = (array['#2E7C83','#c9a227','#7b6b8d','#c9855e','#4a9b9b','#8fb58a'])[1 + (r.rn % 6)::int]
from (select id, row_number() over (order by sort_order, created_at) - 1 as rn from ef_projects) r where r.id = p.id and p.color is null;
