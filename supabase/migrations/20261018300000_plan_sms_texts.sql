-- Task 1151: monthly text allowance per plan (applied 2026-10-18).
update public.plans set capabilities = coalesce(capabilities,'{}'::jsonb) || jsonb_build_object('sms_texts', case id when 'starter' then 500 when 'growth' then 1000 when 'vip' then 2500 end) where id in ('starter','growth','vip');
