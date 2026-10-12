-- Each logged DM is either a NEW first message to that person or a FOLLOW-UP to someone already messaged. The daily limit
-- (default 25 per platform per 24 hours) counts new DMs; follow-ups are counted next to it.
alter table dm_sends add column if not exists kind text not null default 'new' check (kind in ('new','follow_up'));
alter table dm_sends add column if not exists followup_n integer not null default 0;
update dm_sends s set kind = case when r.rn = 1 then 'new' else 'follow_up' end, followup_n = r.rn - 1
from (select id, row_number() over (partition by card_id order by sent_at) rn from dm_sends) r
where r.id = s.id;
