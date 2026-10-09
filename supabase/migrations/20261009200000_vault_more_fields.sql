-- Logins & Passwords: two-step sign-in (2FA) flag and method, a recovery email or phone, and when the password last changed.
-- The secret answer/PIN and recovery codes are stored with the password and notes in the encrypted secret.
alter table public.vault_items add column if not exists twofa boolean not null default false;
alter table public.vault_items add column if not exists twofa_method text;
alter table public.vault_items add column if not exists recovery_contact text;
alter table public.vault_items add column if not exists password_changed_at timestamptz;
update public.vault_items set password_changed_at = coalesce(password_changed_at, created_at) where password_changed_at is null;
