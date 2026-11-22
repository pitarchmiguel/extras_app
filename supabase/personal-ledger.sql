-- Applied after schema.sql. Existing records and ownership policies are retained.
-- Only the server API writes ownerless records; direct anonymous access remains denied.
alter table public.overtime_entries alter column user_id drop not null;
alter table public.overtime_entries alter column user_id drop default;
comment on table public.overtime_entries is 'Personal ledger accessed by the private server API.';
