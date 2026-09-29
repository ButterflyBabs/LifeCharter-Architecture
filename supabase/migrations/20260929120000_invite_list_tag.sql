-- Invite lists are driven by a tag: everyone in Contacts with the list's tag is invited.
-- crm_invites now only records when the invite went out (one row per contact email).
alter table crm_invite_lists add column if not exists invite_tag text;
update crm_invite_lists set invite_tag = 'sneak-peek-invite' where form_id = '9a26396f-82a9-4e80-a838-9c53ea63f17e' and invite_tag is null;

-- Like a broadcast's "Who gets it": a list can follow several tags (anyone with any of them).
-- invite_tag stays the tag given to people added from the tracker page.
alter table crm_invite_lists add column if not exists invite_tags text[] not null default '{}';
update crm_invite_lists set invite_tags = array[invite_tag] where invite_tag is not null and invite_tags = '{}';
