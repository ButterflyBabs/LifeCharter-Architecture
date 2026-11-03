alter table public.portal_items
  add column if not exists client_task_id bigint,
  add column if not exists client_added_at timestamptz;
comment on column public.portal_items.client_task_id is 'The task the client chose to add to their OWN Command Suite task list from the portal (in their own account). Keeps the two in step and stops it being added twice.';
