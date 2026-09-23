-- Private file storage for the Collective (post attachments, avatars, library files).
-- Files are read through short-lived signed URLs by signed-in Collective members.
insert into storage.buckets (id, name, public, file_size_limit)
values ('community', 'community', false, 52428800)
on conflict (id) do nothing;

-- Members upload into their own folder (<uid>/...); admins also into library/.
create policy "cm community upload own" on storage.objects for insert to authenticated
  with check (bucket_id = 'community' and public.cm_in_collective()
              and ((storage.foldername(name))[1] = auth.uid()::text
                   or ((storage.foldername(name))[1] = 'library' and public.cm_is_admin())));
create policy "cm community read" on storage.objects for select to authenticated
  using (bucket_id = 'community' and public.cm_in_collective());
create policy "cm community delete own" on storage.objects for delete to authenticated
  using (bucket_id = 'community' and ((storage.foldername(name))[1] = auth.uid()::text or public.cm_is_admin()));
