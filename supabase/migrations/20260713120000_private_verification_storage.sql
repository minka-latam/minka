-- Keep public campaign/profile media in the public bucket, and move
-- sensitive verification documents to a private bucket.

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'minka_private',
  'minka_private',
  false,
  5242880,
  array[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'application/pdf'
  ]
)
on conflict (id) do update
set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public buckets can serve objects through their public URLs without granting
-- broad SELECT on storage.objects. This removes client-side listing.
drop policy if exists "minka_public_read" on storage.objects;
drop policy if exists "public_read_minka" on storage.objects;

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
    'campaign-updates',
    'profile-pictures'
  )
);
