-- Website Reviews: remember whether the "your Review is ready" email went out, so the owner's page can say so.
alter table public.website_reviews
  add column if not exists email_status text check (email_status in ('sent', 'failed', 'skipped')),
  add column if not exists emailed_at timestamptz,
  add column if not exists email_to text,
  add column if not exists email_message_id text,
  add column if not exists email_error text;
comment on column public.website_reviews.email_status is 'sent = the sending service accepted it; failed = it refused or errored; skipped = no email address or no sending key. Null = published before this was recorded.';
