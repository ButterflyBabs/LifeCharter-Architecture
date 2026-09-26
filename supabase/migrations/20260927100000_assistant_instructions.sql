-- Standing instructions from the client for how their AI assistant replies.
alter table public.profiles
  add column if not exists assistant_instructions text
    check (assistant_instructions is null or char_length(assistant_instructions) <= 1500);
