-- Lead forms from more than one place (Meta lead ads, LinkedIn Lead Gen Forms) land in the same log.
alter table meta_leads add column if not exists source text not null default 'meta';
