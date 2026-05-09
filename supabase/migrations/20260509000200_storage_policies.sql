-- Storage RLS and policies captured from the MINKA Supabase project.
-- This file also keeps the legacy avatar policy intent previously stored in
-- src/lib/supabase/utils/setup_storage_policy.sql.

alter table storage.objects enable row level security;

drop policy if exists "minka_public_read" on storage.objects;
create policy "minka_public_read"
on storage.objects
for select
to public
using (bucket_id = 'minka'::text);

drop policy if exists "public_read_minka" on storage.objects;
create policy "public_read_minka"
on storage.objects
for select
to public
using (bucket_id = 'minka'::text);

drop policy if exists "minka_authenticated_upload" on storage.objects;
create policy "minka_authenticated_upload"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'minka'::text);

drop policy if exists "campaign_owner_can_delete_images" on storage.objects;
create policy "campaign_owner_can_delete_images"
on storage.objects
for delete
to public
using (
  bucket_id = 'minka'::text
  and exists (
    select 1
    from public.campaign_media cm
    join public.campaigns c on cm.campaign_id = c.id
    where split_part(cm.media_url, 'minka/'::text, 2) = objects.name
      and c.organizer_id = auth.uid()
  )
);

drop policy if exists "Allow authenticated uploads" on storage.objects;
create policy "Allow authenticated uploads"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and auth.uid() = owner
);

drop policy if exists "Allow public viewing of avatars" on storage.objects;
create policy "Allow public viewing of avatars"
on storage.objects
for select
to public
using (bucket_id = 'avatars');
