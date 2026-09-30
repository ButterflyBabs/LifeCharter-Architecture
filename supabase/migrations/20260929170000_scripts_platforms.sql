-- Scripts & Templates: where each one is used (IG, FB, LI, YT, Spotify, Email, DM, TXT).
alter table scripts_templates add column if not exists platforms text[] not null default '{}';
update scripts_templates set platforms = case channel when 'email' then array['Email'] when 'dm' then array['DM'] else '{}'::text[] end where platforms = '{}';
