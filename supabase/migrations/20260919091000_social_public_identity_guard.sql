-- Public profiles must have a stable handle before they can appear in social discovery or rankings.
alter table public.social_profiles
  add constraint social_profiles_public_requires_handle
  check (visibility <> 'public' or handle is not null) not valid;

alter table public.social_profiles
  validate constraint social_profiles_public_requires_handle;
