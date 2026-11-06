-- A third left-menu section for custom pages: the Coaching Partner Program (Babs and the team members she gives the page to).
alter table custom_pages drop constraint if exists custom_pages_nav_section_check;
alter table custom_pages add constraint custom_pages_nav_section_check check (nav_section in ('my_pages', 'alignment_architect', 'coaching_partner_program'));
