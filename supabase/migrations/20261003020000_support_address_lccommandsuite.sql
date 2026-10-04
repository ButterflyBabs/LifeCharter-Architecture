-- The Command Suite support address is support@lccommandsuite.com (it forwards to the owner's inbox).
alter table public.sequences alter column reply_to set default 'support@lccommandsuite.com';
alter table public.crm_broadcasts alter column reply_to set default 'support@lccommandsuite.com';
update public.sequences set reply_to = 'support@lccommandsuite.com' where reply_to = 'support@amilynnecarroll.com';
update public.crm_broadcasts set reply_to = 'support@lccommandsuite.com' where reply_to = 'support@amilynnecarroll.com' and status in ('draft', 'scheduled');
