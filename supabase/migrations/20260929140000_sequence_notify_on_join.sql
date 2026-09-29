-- Email the account owner whenever someone joins a campaign (any route: form, added by hand, booking).
alter table sequences add column if not exists notify_on_join boolean not null default false;
update sequences set notify_on_join = true where key = 'suite-sneak-peek' and master_plan_id = 'acc142bf-68d5-4d44-97dc-f25b00a3cef1';
