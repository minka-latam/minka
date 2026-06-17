CREATE OR REPLACE FUNCTION public.refresh_profile_active_campaigns_count(
  p_organizer_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_organizer_id IS NULL THEN
    RETURN;
  END IF;

  UPDATE public.profiles p
  SET active_campaigns_count = (
    SELECT COUNT(*)::integer
    FROM public.campaigns c
    WHERE c.organizer_id = p_organizer_id
      AND c.campaign_status IN ('active', 'completed')
  )
  WHERE p.id = p_organizer_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_active_campaigns_count_from_campaign()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.refresh_profile_active_campaigns_count(OLD.organizer_id);
    RETURN OLD;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.organizer_id IS DISTINCT FROM NEW.organizer_id THEN
    PERFORM public.refresh_profile_active_campaigns_count(OLD.organizer_id);
    PERFORM public.refresh_profile_active_campaigns_count(NEW.organizer_id);
    RETURN NEW;
  END IF;

  PERFORM public.refresh_profile_active_campaigns_count(NEW.organizer_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_active_campaigns_count_after_campaign_change
ON public.campaigns;

CREATE TRIGGER sync_active_campaigns_count_after_campaign_change
AFTER INSERT OR UPDATE OF organizer_id, campaign_status OR DELETE
ON public.campaigns
FOR EACH ROW
EXECUTE FUNCTION public.sync_active_campaigns_count_from_campaign();

UPDATE public.profiles p
SET active_campaigns_count = COALESCE(c.active_count, 0)
FROM (
  SELECT
    p_inner.id,
    COUNT(c.id)::integer AS active_count
  FROM public.profiles p_inner
  LEFT JOIN public.campaigns c
    ON c.organizer_id = p_inner.id
   AND c.campaign_status IN ('active', 'completed')
  GROUP BY p_inner.id
) c
WHERE p.id = c.id;
