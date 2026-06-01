alter table public.campaigns
add column submitted_for_review_at timestamp(6),
add column reviewed_at timestamp(6);

create index campaigns_pending_review_idx
on public.campaigns(submitted_for_review_at)
where campaign_status = 'draft'
  and submitted_for_review_at is not null;
