-- Contacts and affiliates point at each other (referred_by / contact_id), so the demo
-- reset can't restore one before the other. Make those two links checked at the end
-- of the transaction during the reset (normal use still checks them immediately).
alter table seq_contacts alter constraint seq_contacts_referred_by_affiliate_id_fkey deferrable initially immediate;
alter table affiliates alter constraint affiliates_contact_id_fkey deferrable initially immediate;
do $do$
declare d text;
begin
  d := pg_get_functiondef('public.demo_reset'::regproc);
  if position('set constraints all deferred' in d) = 0 then
    d := replace(d, E'perform set_config(''app.demo_restore'', ''1'', true);', E'perform set_config(''app.demo_restore'', ''1'', true);\n  set constraints all deferred;');
    execute d;
  end if;
end $do$;
