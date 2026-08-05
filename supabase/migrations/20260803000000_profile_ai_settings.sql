-- Per-account AI assistant settings: a custom assistant name and the account's
-- own OpenAI API key (used by the /api/mariposa assistant when present).
alter table public.profiles
  add column if not exists assistant_name text,
  add column if not exists openai_api_key text;
