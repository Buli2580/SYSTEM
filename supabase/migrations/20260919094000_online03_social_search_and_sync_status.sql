create index if not exists social_profiles_handle_prefix_idx
  on public.social_profiles ((lower(handle)) text_pattern_ops)
  where handle is not null and visibility = 'public';

create or replace function public.search_players(
  p_query text,
  p_limit integer default 20
)
returns table (
  user_id uuid,
  handle text,
  public_name text,
  bio text,
  visibility text,
  continent_code text,
  country_code text,
  region_code text,
  city_label text,
  real_level integer,
  rank text,
  real_total_xp bigint,
  follower_count integer,
  following_count integer
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    sp.user_id, sp.handle, sp.public_name, sp.bio, sp.visibility,
    sp.continent_code, sp.country_code, sp.region_code, sp.city_label,
    sp.real_level, sp.rank, sp.real_total_xp, sp.follower_count, sp.following_count
  from public.social_profiles sp
  where sp.visibility = 'public'
    and sp.handle is not null
    and lower(sp.handle) like lower(trim(coalesce(p_query,''))) || '%'
    and char_length(trim(coalesce(p_query,''))) >= 2
  order by
    case when lower(sp.handle) = lower(trim(p_query)) then 0 else 1 end,
    sp.real_total_xp desc,
    sp.user_id
  limit greatest(1, least(coalesce(p_limit,20),50));
$$;

revoke all on function public.search_players(text,integer) from public, anon;
grant execute on function public.search_players(text,integer) to authenticated;

create or replace function public.get_sync_status()
returns table (
  total bigint,
  received bigint,
  processing bigint,
  processed bigint,
  rejected bigint,
  latest_event_at timestamptz
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    count(*)::bigint as total,
    count(*) filter (where se.processing_status = 'RECEIVED')::bigint as received,
    count(*) filter (where se.processing_status = 'PROCESSING')::bigint as processing,
    count(*) filter (where se.processing_status = 'PROCESSED')::bigint as processed,
    count(*) filter (where se.processing_status = 'REJECTED')::bigint as rejected,
    max(se.created_at) as latest_event_at
  from public.sync_events se
  where se.user_id = (select auth.uid());
$$;

revoke all on function public.get_sync_status() from public, anon;
grant execute on function public.get_sync_status() to authenticated;
