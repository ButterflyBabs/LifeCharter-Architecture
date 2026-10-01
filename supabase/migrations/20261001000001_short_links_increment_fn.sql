-- Atomic click counter for short_links (many visitors can click at once;
-- a plain read-then-write update from the app could lose a click).
create or replace function increment_short_link_clicks(p_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update short_links set click_count = click_count + 1, updated_at = now() where id = p_id;
$$;
revoke all on function increment_short_link_clicks(uuid) from public, anon, authenticated;
