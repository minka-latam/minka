UPDATE public.campaigns
SET days_remaining = GREATEST(
  0,
  end_date - ((now() AT TIME ZONE 'America/La_Paz')::date)
)
WHERE end_date IS NOT NULL;
