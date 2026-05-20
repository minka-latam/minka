# Storage Bucket Strategy

Minka uses one public Supabase Storage bucket for campaign assets:

- Bucket: `minka`
- Images: `campaign-images/*`
- Videos: `campaign-videos/*`
- Verification documents: `campaign-documents/*`

Supabase folders are object-key prefixes, not real folders. A folder will only
appear in the dashboard while at least one object exists under that prefix.

## Provisioning

The bucket and storage policies are infrastructure. They must be applied before
uploads are tested in beta or production, and the app must not create buckets
during upload requests.

The canonical SQL lives in:

- `supabase/migrations/20260520160000_align_minka_storage_bucket_policies.sql`

Apply migrations through the normal Supabase migration flow, then verify that
the `minka` bucket exists and is public.

## Runtime Configuration

Required environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=minka`
- `SUPABASE_SERVICE_ROLE_KEY`

Browser uploads use the public Supabase anon key plus the authenticated user
session, so they depend on Storage RLS policies.

Server uploads use `SUPABASE_SERVICE_ROLE_KEY` after the app route verifies the
Minka user session. This avoids trying to upload with an anonymous server-side
Supabase client.

## Policies

The expected policies are:

- Public `SELECT` on bucket `minka`, because campaign media URLs are public.
- Authenticated `INSERT` on bucket `minka` only under:
  - `campaign-images`
  - `campaign-videos`
  - `campaign-documents`
- Authenticated `DELETE` for campaign images only when the object is referenced
  by `campaign_media` and the current user owns the campaign.

Do not add a separate `campaign-media` bucket. Campaign edit uploads should use
the `minka` bucket and the `campaign-images` prefix.

