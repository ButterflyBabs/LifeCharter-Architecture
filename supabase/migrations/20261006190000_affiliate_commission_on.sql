-- What a product link earns commission on: 'all' (every credited payment, the old behaviour) or
-- 'implementation' (only the Command Suite implementation fee: not monthly payments, not other products).
alter table affiliate_links add column if not exists commission_on text not null default 'all' check (commission_on in ('all', 'implementation'));
