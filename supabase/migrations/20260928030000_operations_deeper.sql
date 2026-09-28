-- "Go deeper" answers for each operational pillar (Babs, 2026-09-28).
alter table public.operations_pillars add column if not exists answers jsonb not null default '{}'::jsonb;
alter table public.operations_pillars add column if not exists answers_updated_at timestamptz;
