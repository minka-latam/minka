-- Public schema RLS and policies captured from the MINKA Supabase project.
-- Prisma does not model these objects; keep them versioned separately.

alter table public.profiles enable row level security;
alter table public.campaigns enable row level security;
alter table public.campaign_media enable row level security;
alter table public.campaign_updates enable row level security;
alter table public.campaign_verifications enable row level security;
alter table public.donations enable row level security;
alter table public.comments enable row level security;
alter table public.saved_campaigns enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.notifications enable row level security;
alter table public.system_notification_logs enable row level security;
alter table public.fund_transfers enable row level security;
alter table public.legal_entities enable row level security;
alter table public.bisa_tokens enable row level security;
alter table public.payment_logs enable row level security;

drop policy if exists "public_read_all_profiles" on public.profiles;
create policy "public_read_all_profiles"
on public.profiles
for select
to public
using (true);

drop policy if exists "update_own_profile" on public.profiles;
create policy "update_own_profile"
on public.profiles
for update
to public
using (auth.uid() = id);

drop policy if exists "admin_update_profiles" on public.profiles;
create policy "admin_update_profiles"
on public.profiles
for update
to public
using ((auth.jwt() ->> 'role'::text) = 'admin'::text);

drop policy if exists "public_read_campaigns" on public.campaigns;
create policy "public_read_campaigns"
on public.campaigns
for select
to public
using (true);

drop policy if exists "owner_insert_campaign" on public.campaigns;
create policy "owner_insert_campaign"
on public.campaigns
for insert
to public
with check (auth.uid() = organizer_id);

drop policy if exists "owner_update_campaign" on public.campaigns;
create policy "owner_update_campaign"
on public.campaigns
for update
to public
using (auth.uid() = organizer_id);

drop policy if exists "admin_manage_campaigns" on public.campaigns;
create policy "admin_manage_campaigns"
on public.campaigns
for all
to public
using ((auth.jwt() ->> 'role'::text) = 'admin'::text);

drop policy if exists "public_read_campaign_media" on public.campaign_media;
create policy "public_read_campaign_media"
on public.campaign_media
for select
to public
using (true);

drop policy if exists "organizer_manage_own_media" on public.campaign_media;
create policy "organizer_manage_own_media"
on public.campaign_media
for all
to authenticated
using (
  exists (
    select 1
    from public.campaigns c
    where c.id = campaign_media.campaign_id
      and c.organizer_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.campaigns c
    where c.id = campaign_media.campaign_id
      and c.organizer_id = auth.uid()
  )
);

drop policy if exists "campaign_updates_policy" on public.campaign_updates;
create policy "campaign_updates_policy"
on public.campaign_updates
for all
to public
using (true)
with check (
  auth.uid() = (
    select campaigns.organizer_id
    from public.campaigns
    where campaigns.id = campaign_updates.campaign_id
  )
);

drop policy if exists "campaign_verifications_policy" on public.campaign_verifications;
create policy "campaign_verifications_policy"
on public.campaign_verifications
for all
to public
using (
  auth.uid() = (
    select campaigns.organizer_id
    from public.campaigns
    where campaigns.id = campaign_verifications.campaign_id
  )
)
with check (
  auth.uid() = (
    select campaigns.organizer_id
    from public.campaigns
    where campaigns.id = campaign_verifications.campaign_id
  )
);

drop policy if exists "read_own_donations" on public.donations;
create policy "read_own_donations"
on public.donations
for select
to authenticated
using (donor_id = auth.uid());

drop policy if exists "admin_read_donations" on public.donations;
create policy "admin_read_donations"
on public.donations
for select
to authenticated
using ((auth.jwt() ->> 'role'::text) = 'admin'::text);

drop policy if exists "insert_own_donation" on public.donations;
create policy "insert_own_donation"
on public.donations
for insert
to authenticated
with check (donor_id = auth.uid());

drop policy if exists "insert_anonymous_donation" on public.donations;
create policy "insert_anonymous_donation"
on public.donations
for insert
to anon
with check (donor_id is null);

drop policy if exists "public_read_comments" on public.comments;
create policy "public_read_comments"
on public.comments
for select
to public
using (true);

drop policy if exists "insert_comment" on public.comments;
create policy "insert_comment"
on public.comments
for insert
to public
with check (auth.uid() = profile_id);

drop policy if exists "update_own_comment" on public.comments;
create policy "update_own_comment"
on public.comments
for update
to public
using (auth.uid() = profile_id);

drop policy if exists "delete_own_comment" on public.comments;
create policy "delete_own_comment"
on public.comments
for delete
to public
using (auth.uid() = profile_id);

drop policy if exists "admin_manage_comments" on public.comments;
create policy "admin_manage_comments"
on public.comments
for all
to public
using ((auth.jwt() ->> 'role'::text) = 'admin'::text);

drop policy if exists "read_own_saves" on public.saved_campaigns;
create policy "read_own_saves"
on public.saved_campaigns
for select
to public
using (auth.uid() = profile_id);

drop policy if exists "insert_own_save" on public.saved_campaigns;
create policy "insert_own_save"
on public.saved_campaigns
for insert
to public
with check (auth.uid() = profile_id);

drop policy if exists "delete_own_save" on public.saved_campaigns;
create policy "delete_own_save"
on public.saved_campaigns
for delete
to public
using (auth.uid() = profile_id);

drop policy if exists "read_own_preferences" on public.notification_preferences;
create policy "read_own_preferences"
on public.notification_preferences
for select
to public
using (auth.uid() = user_id);

drop policy if exists "insert_own_preferences" on public.notification_preferences;
create policy "insert_own_preferences"
on public.notification_preferences
for insert
to public
with check (auth.uid() = user_id);

drop policy if exists "update_own_preferences" on public.notification_preferences;
create policy "update_own_preferences"
on public.notification_preferences
for update
to public
using (auth.uid() = user_id);

drop policy if exists "read_own_notifications" on public.notifications;
create policy "read_own_notifications"
on public.notifications
for select
to public
using (auth.uid() = user_id);

drop policy if exists "service_insert_notifications" on public.notifications;
create policy "service_insert_notifications"
on public.notifications
for insert
to service_role
with check (true);

drop policy if exists "admin_read_logs" on public.system_notification_logs;
create policy "admin_read_logs"
on public.system_notification_logs
for select
to public
using (
  auth.uid() = admin_id
  or (auth.jwt() ->> 'role'::text) = 'admin'::text
);

drop policy if exists "service_insert_logs" on public.system_notification_logs;
create policy "service_insert_logs"
on public.system_notification_logs
for insert
to service_role
with check (true);

drop policy if exists "admin_read_transfers" on public.fund_transfers;
create policy "admin_read_transfers"
on public.fund_transfers
for select
to public
using ((auth.jwt() ->> 'role'::text) = 'admin'::text);

drop policy if exists "admin_insert_transfer" on public.fund_transfers;
create policy "admin_insert_transfer"
on public.fund_transfers
for insert
to public
with check ((auth.jwt() ->> 'role'::text) = 'admin'::text);

drop policy if exists "owner_read_own_transfers" on public.fund_transfers;
create policy "owner_read_own_transfers"
on public.fund_transfers
for select
to public
using (
  auth.uid() = (
    select campaigns.organizer_id
    from public.campaigns
    where campaigns.id = fund_transfers.campaign_id
  )
);

drop policy if exists "admin_read_entities" on public.legal_entities;
create policy "admin_read_entities"
on public.legal_entities
for select
to public
using ((auth.jwt() ->> 'role'::text) = 'admin'::text);

drop policy if exists "admin_insert_entities" on public.legal_entities;
create policy "admin_insert_entities"
on public.legal_entities
for insert
to public
with check ((auth.jwt() ->> 'role'::text) = 'admin'::text);

drop policy if exists "admin_update_entities" on public.legal_entities;
create policy "admin_update_entities"
on public.legal_entities
for update
to public
using ((auth.jwt() ->> 'role'::text) = 'admin'::text);

drop policy if exists "admin_delete_entities" on public.legal_entities;
create policy "admin_delete_entities"
on public.legal_entities
for delete
to public
using ((auth.jwt() ->> 'role'::text) = 'admin'::text);

drop policy if exists "admin_read_payment_logs" on public.payment_logs;
create policy "admin_read_payment_logs"
on public.payment_logs
for select
to public
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'::"UserRole"
  )
);
