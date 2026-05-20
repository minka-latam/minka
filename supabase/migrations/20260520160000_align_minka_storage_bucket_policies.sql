-- Align Minka campaign storage around one public bucket with explicit prefixes.
-- Buckets must be provisioned by migrations/setup, not from app request handlers.

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'minka',
  'minka',
  true,
  10485760,
  array[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
    'video/mp4',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
on conflict (id) do update
set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "minka_public_read" on storage.objects;
drop policy if exists "public_read_minka" on storage.objects;
create policy "minka_public_read"
on storage.objects
for select
to public
using (bucket_id = 'minka');

drop policy if exists "minka_authenticated_upload" on storage.objects;
create policy "minka_authenticated_upload"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'minka'
  and (storage.foldername(name))[1] in (
    'campaign-images',
    'campaign-videos',
    'campaign-documents'
  )
);

drop policy if exists "campaign_owner_can_delete_images" on storage.objects;
create policy "campaign_owner_can_delete_images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'minka'
  and exists (
    select 1
    from public.campaign_media cm
    join public.campaigns c on cm.campaign_id = c.id
    where split_part(cm.media_url, 'minka/'::text, 2) = objects.name
      and c.organizer_id = auth.uid()
  )
);
