with affected_organizers as (
  update public.campaigns
  set campaign_status = 'active'
  where campaign_status = 'draft'
    and submitted_for_review_at is not null
    and reviewed_at is null
  returning organizer_id
),
organizer_counts as (
  select
    campaigns.organizer_id,
    count(*)::integer as active_campaigns_count
  from public.campaigns
  where campaigns.campaign_status in ('active', 'completed')
    and campaigns.organizer_id in (
      select distinct organizer_id from affected_organizers
    )
  group by campaigns.organizer_id
)
update public.profiles
set active_campaigns_count = organizer_counts.active_campaigns_count
from organizer_counts
where profiles.id = organizer_counts.organizer_id;

drop index if exists campaigns_pending_review_idx;

create index campaigns_pending_review_idx
on public.campaigns(submitted_for_review_at)
where campaign_status = 'active'
  and submitted_for_review_at is not null
  and reviewed_at is null;
