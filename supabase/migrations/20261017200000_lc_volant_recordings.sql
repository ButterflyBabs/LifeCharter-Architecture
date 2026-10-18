-- LC Volant Phase 2: audio and video recordings. The browser uploads the file straight into a private bucket, the
-- Suite hands a short-lived link to the transcription service (AssemblyAI), and when the transcript comes back the
-- recording is deleted from storage AND from the service. Only the text (and who-said-what with times) is kept.
create table if not exists public.volant_recordings (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null,
  file_name text not null default '',
  size_bytes bigint not null default 0,
  storage_path text,                                  -- null once the recording is deleted
  status text not null default 'uploading',           -- uploading | transcribing | ready | failed
  provider_id text,                                   -- the transcription service's id for this job
  utterances jsonb,                                   -- [{speaker:"A", start_ms, end_ms, text}]
  speakers jsonb not null default '{}'::jsonb,        -- {"A": "Babs", "B": "Eloise"} names the person gave each voice
  duration_seconds integer,
  error text,
  consent_at timestamptz,
  used_at timestamptz,                                -- when it was turned into a report (clears the bell)
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists volant_recordings_plan_idx on public.volant_recordings (master_plan_id, created_at desc);
alter table public.volant_recordings enable row level security;

-- Private bucket, up to 2 GB a file (about 2 hours of Zoom video). Only the server hands out upload and read links.
insert into storage.buckets (id, name, public, file_size_limit)
values ('volant-recordings', 'volant-recordings', false, 2147483648)
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit;
