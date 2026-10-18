-- Task 1072 (pulled forward 2026-10-18): native e-signature. A document (agreement or proposal) is written in the
-- Suite or uploaded; signers sign in order by an emailed link plus a 6-digit code; every step is in the audit trail;
-- the finished document is sealed into a PDF with a certificate of completion and its SHA-256 hash.
create table if not exists public.sign_documents (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid not null references public.client_master_plans(id) on delete cascade,
  title text not null,
  kind text not null default 'agreement' check (kind in ('agreement','proposal')),
  source text not null default 'written' check (source in ('written','upload')),
  body text,
  file_path text,
  file_name text,
  contact_id uuid references public.seq_contacts(id) on delete set null,
  offer_id uuid references public.sales_offers(id) on delete set null,
  amount numeric,
  message text,
  status text not null default 'draft' check (status in ('draft','sent','completed','declined','voided','expired')),
  owner_signs boolean not null default false,
  expires_on date,
  sent_at timestamptz,
  completed_at timestamptz,
  final_path text,
  final_hash text,
  original_hash text,
  external_ref text,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists sign_documents_plan_idx on public.sign_documents (master_plan_id, created_at desc);
alter table public.sign_documents enable row level security;

create table if not exists public.sign_signers (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.sign_documents(id) on delete cascade,
  order_no int not null default 1,
  name text not null,
  email text not null,
  is_owner boolean not null default false,
  token_hash text not null unique,
  status text not null default 'waiting' check (status in ('waiting','sent','viewed','signed','declined')),
  code_hash text,
  code_expires_at timestamptz,
  code_attempts int not null default 0,
  verified_at timestamptz,
  consented_at timestamptz,
  signed_at timestamptz,
  signature_type text check (signature_type in ('typed','drawn')),
  signature_text text,
  signature_image text,
  ip text,
  user_agent text,
  decline_reason text,
  last_reminded_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists sign_signers_doc_idx on public.sign_signers (document_id, order_no);
alter table public.sign_signers enable row level security;

create table if not exists public.sign_events (
  id bigint generated always as identity primary key,
  document_id uuid not null references public.sign_documents(id) on delete cascade,
  signer_id uuid references public.sign_signers(id) on delete set null,
  event text not null,
  detail text,
  ip text,
  user_agent text,
  at timestamptz not null default now()
);
create index if not exists sign_events_doc_idx on public.sign_events (document_id, at);
alter table public.sign_events enable row level security;

create table if not exists public.sign_templates (
  id uuid primary key default gen_random_uuid(),
  master_plan_id uuid references public.client_master_plans(id) on delete cascade,
  key text,
  name text not null,
  kind text not null default 'agreement' check (kind in ('agreement','proposal')),
  body text not null,
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists sign_templates_key_idx on public.sign_templates (key) where master_plan_id is null;
alter table public.sign_templates enable row level security;

-- Reminders reuse the signer's own link (a void replaces it), so the plain token is kept too (service role only).
alter table public.sign_signers add column if not exists token text;
