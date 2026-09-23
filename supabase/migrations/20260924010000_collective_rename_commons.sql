-- "The Commons" is now simply "Community" (the slug stays 'commons' so links keep working).
update public.cm_spaces set name = 'Community' where slug = 'commons';
update public.cm_faqs set answer = replace(replace(answer, 'The Commons', 'Community'), 'the Commons', 'Community'), updated_at = now() where answer ~ '[Tt]he Commons';
update public.cm_posts set body = replace(replace(body, 'THE COMMONS', 'COMMUNITY'), 'The Commons', 'Community') where title like 'Welcome — here%';
