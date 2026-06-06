alter table public.profiles
drop column if exists address;

alter table public.legal_entities
drop column if exists is_active;
