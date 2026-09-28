-- Links a Pipeline deal to the booking calendar that opened it (e.g. booking:executive-consultation).
-- Where the person first came from is written to the existing source column ("Where they came from").
alter table public.pipeline_deals add column if not exists origin text;
