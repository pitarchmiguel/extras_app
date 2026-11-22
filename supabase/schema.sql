create table public.overtime_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  work_date date not null,
  kind text not null check (kind in ('extra', 'holiday')),
  duration_minutes integer not null check (duration_minutes between 1 and 1440),
  is_paid boolean not null default false,
  is_signed boolean not null default false,
  notes text not null default '' check (length(notes) <= 2000),
  attachment_path text,
  attachment_name text,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint own_attachment check (attachment_path is null or split_part(attachment_path, '/', 1) = user_id::text)
);
create index overtime_entries_user_date_idx on public.overtime_entries(user_id, work_date desc);
alter table public.overtime_entries enable row level security;
revoke all on public.overtime_entries from anon;
grant select, insert, update, delete on public.overtime_entries to authenticated;
create policy entries_select on public.overtime_entries for select to authenticated using ((select auth.uid()) = user_id);
create policy entries_insert on public.overtime_entries for insert to authenticated with check ((select auth.uid()) = user_id);
create policy entries_update on public.overtime_entries for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy entries_delete on public.overtime_entries for delete to authenticated using ((select auth.uid()) = user_id);
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('overtime-sheets','overtime-sheets',false,10485760,ARRAY['image/jpeg','image/png','image/webp','application/pdf']);
create policy sheets_select on storage.objects for select to authenticated using (bucket_id='overtime-sheets' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy sheets_insert on storage.objects for insert to authenticated with check (bucket_id='overtime-sheets' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy sheets_delete on storage.objects for delete to authenticated using (bucket_id='overtime-sheets' and (storage.foldername(name))[1] = (select auth.uid())::text);
