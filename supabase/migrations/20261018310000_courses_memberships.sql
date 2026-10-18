-- Task 1152: Programs grow into Courses & Memberships (applied 2026-10-18). A program is a group cohort, a self-paced
-- course or a membership; lessons sit in modules and can open N days after each member joins; members tick lessons
-- complete; a course can have an access length; a membership ends when its subscription is cancelled.
alter table public.programs add column if not exists kind text not null default 'cohort';
alter table public.programs drop constraint if exists programs_kind_check;
alter table public.programs add constraint programs_kind_check check (kind in ('cohort','course','membership'));
alter table public.programs add column if not exists access_days int check (access_days is null or access_days between 1 and 3650);
alter table public.programs add column if not exists completion_message text;
alter table public.program_lessons add column if not exists module text;
alter table public.program_lessons add column if not exists open_after_days int check (open_after_days is null or open_after_days between 0 and 3650);
create table if not exists public.program_lesson_done (
  lesson_id uuid not null references public.program_lessons(id) on delete cascade,
  contact_id uuid not null references public.seq_contacts(id) on delete cascade,
  done_at timestamptz not null default now(),
  primary key (lesson_id, contact_id)
);
alter table public.program_lesson_done enable row level security;
alter table public.program_members add column if not exists ended_at timestamptz;
alter table public.program_members add column if not exists end_reason text;
