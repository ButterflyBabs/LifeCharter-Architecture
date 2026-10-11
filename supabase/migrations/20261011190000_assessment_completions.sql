-- One row per account and assessment (brain, soul) when the client actually FINISHES it (the final save, not the
-- per-answer progress saves). "Assessments done" for the setup checklist, the Next Chapter Call invitation and the
-- coach review used to mean "at least one saved answer", which fired too early.
create table if not exists assessment_completions (
  master_plan_id uuid not null,
  assessment_type text not null check (assessment_type in ('brain','soul','profit')),
  completed_at timestamptz not null default now(),
  answers_at_completion integer,
  primary key (master_plan_id, assessment_type)
);
alter table assessment_completions enable row level security;
-- service role only (no policies)

-- Accounts that finished before this existed: the owner's own plan (535 Brain, 261 Soul answers, scores saved).
insert into assessment_completions (master_plan_id, assessment_type, completed_at, answers_at_completion)
select p.id, t.assessment_type, coalesce(p.last_assessment_at, now()), t.n
from client_master_plans p
join (select master_plan_id, assessment_type, count(*) n from unified_client_responses where assessment_type in ('brain','soul') group by 1,2) t on t.master_plan_id = p.id
where p.last_assessment_at is not null and p.domain_scores is not null and p.domain_scores::text not in ('{}','null')
on conflict do nothing;
insert into assessment_completions (master_plan_id, assessment_type, completed_at)
select p.id, 'profit', coalesce(p.last_assessment_at, now())
from client_master_plans p
where p.domain_scores is not null and p.domain_scores::text not in ('{}','null')
on conflict do nothing;
