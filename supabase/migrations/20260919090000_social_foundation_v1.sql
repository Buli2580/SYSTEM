-- SYSTEM SOCIAL FOUNDATION v1
-- Applied to Supabase on 2026-09-19. Keep this file as the repository source of truth.

create table if not exists public.social_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  handle text,
  public_name text,
  bio text,
  visibility text not null default 'private' check (visibility in ('private','public')),
  continent_code text,
  country_code text,
  region_code text,
  city_label text,
  real_level integer not null default 1 check (real_level >= 1),
  rank text not null default 'E',
  real_total_xp bigint not null default 0 check (real_total_xp >= 0),
  follower_count integer not null default 0 check (follower_count >= 0),
  following_count integer not null default 0 check (following_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint social_profiles_handle_format check (handle is null or handle ~ '^[a-z0-9_]{3,24}$'),
  constraint social_profiles_continent_code check (continent_code is null or continent_code ~ '^[A-Z]{2}$'),
  constraint social_profiles_country_code check (country_code is null or country_code ~ '^[A-Z]{2}$'),
  constraint social_profiles_region_code_len check (region_code is null or char_length(region_code) between 1 and 32),
  constraint social_profiles_city_label_len check (city_label is null or char_length(city_label) between 1 and 80),
  constraint social_profiles_public_name_len check (public_name is null or char_length(public_name) between 1 and 40),
  constraint social_profiles_bio_len check (bio is null or char_length(bio) <= 240)
);

create unique index if not exists social_profiles_handle_unique
  on public.social_profiles ((lower(handle))) where handle is not null;
create index if not exists social_profiles_world_rank_idx
  on public.social_profiles (real_total_xp desc, user_id) where visibility = 'public';
create index if not exists social_profiles_continent_rank_idx
  on public.social_profiles (continent_code, real_total_xp desc, user_id) where visibility = 'public';
create index if not exists social_profiles_country_rank_idx
  on public.social_profiles (country_code, real_total_xp desc, user_id) where visibility = 'public';
create index if not exists social_profiles_region_rank_idx
  on public.social_profiles (region_code, real_total_xp desc, user_id) where visibility = 'public';
create index if not exists social_profiles_city_rank_idx
  on public.social_profiles (city_label, real_total_xp desc, user_id) where visibility = 'public';

create table if not exists public.follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  followed_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followed_id),
  constraint follows_no_self check (follower_id <> followed_id)
);
create index if not exists follows_followed_idx on public.follows(followed_id, created_at desc);
create index if not exists follows_follower_idx on public.follows(follower_id, created_at desc);

alter table public.social_profiles enable row level security;
alter table public.follows enable row level security;

revoke all on table public.social_profiles from anon, authenticated;
grant select on table public.social_profiles to authenticated;
grant update (handle, public_name, bio, visibility, continent_code, country_code, region_code, city_label)
  on public.social_profiles to authenticated;

revoke all on table public.follows from anon, authenticated;
grant select, insert, delete on table public.follows to authenticated;

create policy social_profiles_select_visible
on public.social_profiles for select to authenticated
using ((select auth.uid()) is not null and (user_id = (select auth.uid()) or visibility = 'public'));

create policy social_profiles_update_own
on public.social_profiles for update to authenticated
using ((select auth.uid()) is not null and user_id = (select auth.uid()))
with check ((select auth.uid()) is not null and user_id = (select auth.uid()));

create policy follows_select_related
on public.follows for select to authenticated
using ((select auth.uid()) is not null and (follower_id = (select auth.uid()) or followed_id = (select auth.uid())));

create policy follows_insert_own_public_target
on public.follows for insert to authenticated
with check (
  (select auth.uid()) is not null
  and follower_id = (select auth.uid())
  and exists (
    select 1 from public.social_profiles sp
    where sp.user_id = followed_id and sp.visibility = 'public'
  )
);

create policy follows_delete_own
on public.follows for delete to authenticated
using ((select auth.uid()) is not null and follower_id = (select auth.uid()));

create or replace function public.social_profiles_set_updated_at()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  new.handle := case when new.handle is null then null else lower(trim(new.handle)) end;
  new.public_name := nullif(trim(new.public_name), '');
  new.bio := nullif(trim(new.bio), '');
  new.continent_code := case when new.continent_code is null then null else upper(trim(new.continent_code)) end;
  new.country_code := case when new.country_code is null then null else upper(trim(new.country_code)) end;
  new.region_code := nullif(trim(new.region_code), '');
  new.city_label := nullif(trim(new.city_label), '');
  new.updated_at := now();
  return new;
end;
$$;

create trigger social_profiles_set_updated_at
before insert or update on public.social_profiles
for each row execute function public.social_profiles_set_updated_at();

create or replace function public.sync_social_progress_projection()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.social_profiles(user_id, real_level, rank, real_total_xp)
  values (new.user_id, new.real_level, new.rank, new.real_total_xp)
  on conflict (user_id) do update
    set real_level = excluded.real_level,
        rank = excluded.rank,
        real_total_xp = excluded.real_total_xp,
        updated_at = now();
  return new;
end;
$$;

create trigger player_progress_sync_social_projection
after insert or update of real_level, rank, real_total_xp on public.player_progress
for each row execute function public.sync_social_progress_projection();

create or replace function public.sync_follow_counts()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  v_follower uuid;
  v_followed uuid;
begin
  if tg_op = 'DELETE' then
    v_follower := old.follower_id;
    v_followed := old.followed_id;
  else
    v_follower := new.follower_id;
    v_followed := new.followed_id;
  end if;

  update public.social_profiles
  set following_count = (select count(*)::integer from public.follows f where f.follower_id = v_follower),
      updated_at = now()
  where user_id = v_follower;

  update public.social_profiles
  set follower_count = (select count(*)::integer from public.follows f where f.followed_id = v_followed),
      updated_at = now()
  where user_id = v_followed;

  return coalesce(new, old);
end;
$$;

create trigger follows_sync_counts
after insert or delete on public.follows
for each row execute function public.sync_follow_counts();

insert into public.social_profiles(user_id, real_level, rank, real_total_xp)
select pp.user_id, pp.real_level, pp.rank, pp.real_total_xp
from public.player_progress pp
on conflict (user_id) do update
set real_level = excluded.real_level,
    rank = excluded.rank,
    real_total_xp = excluded.real_total_xp;

create or replace function public.handle_new_system_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, locale)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'display_name', ''),
    nullif(new.raw_user_meta_data ->> 'locale', '')
  ) on conflict (id) do nothing;

  insert into public.player_progress (user_id)
  values (new.id) on conflict (user_id) do nothing;

  insert into public.skill_progress (user_id, skill_key)
  values
    (new.id, 'STR'), (new.id, 'VIT'), (new.id, 'INT'), (new.id, 'WIL'),
    (new.id, 'CHA'), (new.id, 'CRE'), (new.id, 'RES')
  on conflict (user_id, skill_key) do nothing;

  insert into public.user_settings (user_id)
  values (new.id) on conflict (user_id) do nothing;

  insert into public.streak_progress (user_id)
  values (new.id) on conflict (user_id) do nothing;

  insert into public.social_profiles (user_id)
  values (new.id) on conflict (user_id) do nothing;

  return new;
end;
$$;

create or replace function public.get_leaderboard(
  p_scope text default 'WORLD',
  p_scope_value text default null,
  p_limit integer default 50
)
returns table (
  rank_position bigint,
  user_id uuid,
  handle text,
  public_name text,
  real_level integer,
  rank text,
  real_total_xp bigint,
  follower_count integer,
  continent_code text,
  country_code text,
  region_code text,
  city_label text
)
language sql stable security invoker set search_path = ''
as $$
  with scoped as (
    select sp.*
    from public.social_profiles sp
    where sp.visibility = 'public'
      and (
        upper(coalesce(p_scope,'WORLD')) = 'WORLD'
        or (upper(p_scope) = 'CONTINENT' and sp.continent_code = upper(p_scope_value))
        or (upper(p_scope) = 'COUNTRY' and sp.country_code = upper(p_scope_value))
        or (upper(p_scope) = 'REGION' and sp.region_code = p_scope_value)
        or (upper(p_scope) = 'CITY' and sp.city_label = p_scope_value)
      )
  )
  select
    row_number() over (order by s.real_total_xp desc, s.real_level desc, s.user_id),
    s.user_id, s.handle, s.public_name, s.real_level, s.rank, s.real_total_xp,
    s.follower_count, s.continent_code, s.country_code, s.region_code, s.city_label
  from scoped s
  order by s.real_total_xp desc, s.real_level desc, s.user_id
  limit greatest(1, least(coalesce(p_limit,50), 100));
$$;

revoke all on function public.get_leaderboard(text,text,integer) from public, anon;
grant execute on function public.get_leaderboard(text,text,integer) to authenticated;
