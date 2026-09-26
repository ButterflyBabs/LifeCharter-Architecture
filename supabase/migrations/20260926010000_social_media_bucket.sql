-- Images and videos attached to social posts (Content Studio uploads).
--
-- Public read: PostStream fetches media by URL when it publishes. Files live
-- under <master_plan_id>/<random uuid>-<name>, so addresses are unguessable
-- and public buckets can't be listed anonymously. Uploads go straight from the
-- browser using a signed upload URL issued by /api/content/media (service
-- role, scoped to the signed-in account), so no storage.objects policies are
-- needed.
--
-- 50 MB per file: the project's default global upload limit (Pro plan; can be
-- raised in Supabase → Storage → Settings, then here).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'social-media',
  'social-media',
  true,
  52428800,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'video/mp4', 'video/quicktime']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
