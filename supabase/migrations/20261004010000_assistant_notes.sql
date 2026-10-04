-- "Teach me": facts the client wants their AI assistant to always keep in mind.
alter table public.profiles
  add column if not exists assistant_notes text
    check (assistant_notes is null or char_length(assistant_notes) <= 3000);
