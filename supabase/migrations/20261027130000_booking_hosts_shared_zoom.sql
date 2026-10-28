-- A host whose calls run on a shared Zoom user (they do not sign in as that user): people may join before the host so the
-- host can simply open the join link and start the call. A Call to Close consultant's calls run on support@amilynnecarroll.com.
alter table booking_hosts add column if not exists shared_zoom boolean not null default false;
update booking_hosts set zoom_email = 'support@amilynnecarroll.com', shared_zoom = true where name = 'Call to Close' and master_plan_id = 'acc142bf-68d5-4d44-97dc-f25b00a3cef1';
