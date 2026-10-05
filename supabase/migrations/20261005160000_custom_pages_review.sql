-- A page made for the owner to review (a draft plan, a set of angles) carries a review status, so it
-- opens read-first with an Edit button and an Approved button. Ordinary pages leave it null.
alter table public.custom_pages
  add column if not exists review_status text check (review_status in ('draft','approved')),
  add column if not exists approved_at timestamptz;
