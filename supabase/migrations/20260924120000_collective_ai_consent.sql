-- One-time consent before Mariposa sends a member's text to OpenAI
-- (App Store Guideline 5.1.2 — disclose and get permission before sharing
-- personal data with a third-party AI). Withdrawable from Me.
alter table public.cm_profiles add column if not exists ai_consent_at timestamptz;
comment on column public.cm_profiles.ai_consent_at is 'When the member agreed to Mariposa sending their text to OpenAI (App Store 5.1.2). Null = not agreed / withdrawn.';
