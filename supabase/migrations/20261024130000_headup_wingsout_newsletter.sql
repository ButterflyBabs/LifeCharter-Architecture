-- Head Up, Wings Out newsletter list: every new house contact is tagged on insert unless unsubscribed,
-- do-not-contact, or newsletter-unsubscribed.
create or replace function crm_tag_newsletter_on_insert() returns trigger language plpgsql as $$
begin
  if new.master_plan_id = 'acc142bf-68d5-4d44-97dc-f25b00a3cef1'
     and new.unsubscribed_at is null
     and not (coalesce(new.tags, '{}') && array['do-not-contact','newsletter-unsubscribed','headup-wingsout']) then
    new.tags := array_append(coalesce(new.tags, '{}'), 'headup-wingsout');
  end if;
  return new;
end $$;
drop trigger if exists seq_contacts_newsletter_tag on seq_contacts;
create trigger seq_contacts_newsletter_tag before insert on seq_contacts for each row execute function crm_tag_newsletter_on_insert();
