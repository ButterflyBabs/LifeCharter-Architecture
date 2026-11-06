-- Ideal Client Profiles can be scored as a prospective PARTNER (an established coach who promotes to their own clients)
-- instead of a prospective client. 'partner' switches the Audience Qualifier to the partner first pass.
alter table icp_profiles add column if not exists purpose text not null default 'client' check (purpose in ('client','partner'));
