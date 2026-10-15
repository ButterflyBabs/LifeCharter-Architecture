-- The day a task was put on a client's Today list by hand (dragged into Today, or added there). The Tasks page shows a
-- task in Today when it is dated today, or was put there on today's date, so the list starts fresh each day.
alter table public.tasks add column if not exists today_on date;
