-- LCCS Academy: what someone wrote for a lesson's "try it in your account". Their assistant reads it, and a lesson
-- with an answer and a passed quiz gives its dimension a small lift (academyLift in computeScores.ts).
create table if not exists public.academy_answers (
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id text not null,
  master_plan_id uuid references public.client_master_plans(id) on delete cascade,
  name text,
  question text not null,
  answer text not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);
create index if not exists academy_answers_plan_idx on public.academy_answers (master_plan_id, updated_at desc);
alter table public.academy_answers enable row level security;
