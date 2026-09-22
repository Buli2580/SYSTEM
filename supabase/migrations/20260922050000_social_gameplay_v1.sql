-- SYSTEM SOCIAL GAMEPLAY v1
-- Repository contract only. Do not deploy to production without an explicit release decision.
-- Depends on the existing SYSTEM core/social foundation (social_profiles, follows, reward_ledger).

create table if not exists public.friend_requests (
  sender_id uuid not null references auth.users(id) on delete cascade,
  receiver_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (sender_id,receiver_id),
  constraint friend_requests_no_self check (sender_id<>receiver_id)
);
create index if not exists friend_requests_receiver_idx
  on public.friend_requests(receiver_id,status,created_at desc);
create unique index if not exists friend_requests_pair_unique
  on public.friend_requests(least(sender_id,receiver_id),greatest(sender_id,receiver_id));

create table if not exists public.social_blocks (
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id,blocked_id),
  constraint social_blocks_no_self check (blocker_id<>blocked_id)
);

create table if not exists public.social_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null check (event_type in (
    'QUEST_COMPLETED','ACHIEVEMENT_UNLOCKED','LEVEL_UP','RANK_UP',
    'STREAK_MILESTONE','BOSS_DEFEATED','WORLD_SECTOR_DISCOVERED','TITLE_UNLOCKED'
  )),
  visibility text not null default 'friends' check (visibility in ('public','friends','private')),
  source_event_key text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists social_activity_feed_idx
  on public.social_activity(created_at desc,user_id);
create unique index if not exists social_activity_source_unique
  on public.social_activity(user_id,source_event_key)
  where source_event_key is not null;

create table if not exists public.guilds (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 3 and 50),
  tag text not null check (char_length(trim(tag)) between 2 and 8),
  owner_id uuid not null references auth.users(id) on delete cascade,
  member_count integer not null default 1 check (member_count>=1),
  level integer not null default 1 check (level>=1),
  xp bigint not null default 0 check (xp>=0),
  visibility text not null default 'PUBLIC' check (visibility in ('PUBLIC','INVITE_ONLY')),
  created_at timestamptz not null default now()
);
create unique index if not exists guilds_tag_unique on public.guilds((upper(tag)));

create table if not exists public.guild_members (
  guild_id uuid not null references public.guilds(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'MEMBER' check (role in ('OWNER','OFFICER','MEMBER')),
  joined_at timestamptz not null default now(),
  primary key (guild_id,user_id)
);
create unique index if not exists guild_members_one_guild_per_user
  on public.guild_members(user_id);

create table if not exists public.raids (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  boss_hp bigint not null check (boss_hp>0),
  damage bigint not null default 0 check (damage>=0),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'UPCOMING' check (status in ('UPCOMING','ACTIVE','DEFEATED','EXPIRED')),
  created_at timestamptz not null default now(),
  constraint raids_time_order check (ends_at>starts_at)
);
create index if not exists raids_active_idx on public.raids(status,starts_at,ends_at);

create table if not exists public.raid_damage (
  raid_id uuid not null references public.raids(id) on delete cascade,
  event_key text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  damage integer not null check (damage>0),
  created_at timestamptz not null default now(),
  primary key (raid_id,event_key)
);
create unique index if not exists raid_damage_verified_event_unique
  on public.raid_damage(user_id,event_key);

create table if not exists public.seasons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint seasons_time_order check (ends_at>starts_at)
);

create table if not exists public.social_challenges (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  metric text not null check (metric in ('QUESTS','XP','DISTANCE','STREAK')),
  target bigint not null check (target>0),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  visibility text not null default 'PUBLIC' check (visibility in ('PUBLIC','FRIENDS')),
  created_at timestamptz not null default now(),
  constraint social_challenges_time_order check (ends_at>starts_at)
);

create table if not exists public.challenge_progress (
  challenge_id uuid not null references public.social_challenges(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  value bigint not null default 0 check (value>=0),
  updated_at timestamptz not null default now(),
  primary key (challenge_id,user_id)
);

alter table public.friend_requests enable row level security;
alter table public.social_blocks enable row level security;
alter table public.social_activity enable row level security;
alter table public.guilds enable row level security;
alter table public.guild_members enable row level security;
alter table public.raids enable row level security;
alter table public.raid_damage enable row level security;
alter table public.seasons enable row level security;
alter table public.social_challenges enable row level security;
alter table public.challenge_progress enable row level security;

create or replace function public.is_social_blocked(p_target uuid)
returns boolean
language sql
stable
security definer
set search_path=''
as $$
  select exists(
    select 1
    from public.social_blocks b
    where (b.blocker_id=(select auth.uid()) and b.blocked_id=p_target)
       or (b.blocker_id=p_target and b.blocked_id=(select auth.uid()))
  )
$$;

create or replace function public.is_guild_member(p_guild uuid)
returns boolean
language sql
stable
security definer
set search_path=''
as $$
  select exists(
    select 1 from public.guild_members gm
    where gm.guild_id=p_guild and gm.user_id=(select auth.uid())
  )
$$;

drop policy if exists friend_requests_related on public.friend_requests;
create policy friend_requests_related
on public.friend_requests for select to authenticated
using ((select auth.uid()) in (sender_id,receiver_id));

drop policy if exists social_blocks_own on public.social_blocks;
create policy social_blocks_own
on public.social_blocks for select to authenticated
using (blocker_id=(select auth.uid()));

drop policy if exists social_blocks_delete_own on public.social_blocks;
create policy social_blocks_delete_own
on public.social_blocks for delete to authenticated
using (blocker_id=(select auth.uid()));

drop policy if exists social_activity_insert_own on public.social_activity;

drop policy if exists guilds_read_authenticated on public.guilds;
create policy guilds_read_authenticated
on public.guilds for select to authenticated
using (visibility='PUBLIC' or owner_id=(select auth.uid()) or public.is_guild_member(id));

drop policy if exists guild_members_read_related on public.guild_members;
create policy guild_members_read_related
on public.guild_members for select to authenticated
using (user_id=(select auth.uid()) or public.is_guild_member(guild_id));

drop policy if exists raids_read_authenticated on public.raids;
create policy raids_read_authenticated
on public.raids for select to authenticated using (true);

drop policy if exists seasons_read_authenticated on public.seasons;
create policy seasons_read_authenticated
on public.seasons for select to authenticated using (true);

drop policy if exists challenges_read_authenticated on public.social_challenges;
create policy challenges_read_authenticated
on public.social_challenges for select to authenticated using (true);

drop policy if exists challenge_progress_own on public.challenge_progress;
create policy challenge_progress_own
on public.challenge_progress for select to authenticated
using (user_id=(select auth.uid()));

-- Override foundation visibility/follow policies so blocking is symmetric.
drop policy if exists social_profiles_select_visible on public.social_profiles;
create policy social_profiles_select_visible
on public.social_profiles for select to authenticated
using (
  (select auth.uid()) is not null
  and (
    user_id=(select auth.uid())
    or (visibility='public' and not public.is_social_blocked(user_id))
  )
);

drop policy if exists follows_insert_own_public_target on public.follows;
create policy follows_insert_own_public_target
on public.follows for insert to authenticated
with check (
  (select auth.uid()) is not null
  and follower_id=(select auth.uid())
  and not public.is_social_blocked(followed_id)
  and exists(
    select 1 from public.social_profiles sp
    where sp.user_id=followed_id and sp.visibility='public'
  )
);

create or replace function public.social_followers_count()
returns table(count bigint)
language sql stable security invoker set search_path=''
as $$
  select count(*)::bigint
  from public.follows
  where followed_id=(select auth.uid())
$$;

create or replace function public.social_following_count()
returns table(count bigint)
language sql stable security invoker set search_path=''
as $$
  select count(*)::bigint
  from public.follows
  where follower_id=(select auth.uid())
$$;

create or replace function public.social_friends_count()
returns table(count bigint)
language sql stable security invoker set search_path=''
as $$
  select count(*)::bigint
  from public.friend_requests fr
  where fr.status='accepted'
    and (fr.sender_id=(select auth.uid()) or fr.receiver_id=(select auth.uid()))
$$;

create or replace function public.send_friend_request(p_target uuid)
returns void
language plpgsql security definer set search_path=''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_target=v_uid then raise exception 'SELF_FRIEND'; end if;
  if public.is_social_blocked(p_target) then raise exception 'BLOCKED'; end if;
  if not exists(
    select 1 from public.social_profiles sp
    where sp.user_id=p_target and sp.visibility='public'
  ) then raise exception 'PROFILE_NOT_AVAILABLE'; end if;

  if exists(
    select 1 from public.friend_requests fr
    where fr.status='accepted'
      and ((fr.sender_id=v_uid and fr.receiver_id=p_target)
        or (fr.sender_id=p_target and fr.receiver_id=v_uid))
  ) then
    return;
  elsif exists(
    select 1 from public.friend_requests fr
    where fr.sender_id=p_target and fr.receiver_id=v_uid and fr.status='pending'
  ) then
    update public.friend_requests
      set status='accepted',updated_at=now()
      where sender_id=p_target and receiver_id=v_uid;
  else
    begin
      insert into public.friend_requests(sender_id,receiver_id,status)
      values(v_uid,p_target,'pending')
      on conflict(sender_id,receiver_id) do update set updated_at=now();
    exception when unique_violation then
      update public.friend_requests
        set status='accepted',updated_at=now()
        where sender_id=p_target and receiver_id=v_uid and status='pending';
      if not found and not exists(
        select 1 from public.friend_requests fr
        where fr.status='accepted'
          and ((fr.sender_id=v_uid and fr.receiver_id=p_target)
            or (fr.sender_id=p_target and fr.receiver_id=v_uid))
      ) then
        raise;
      end if;
    end;
  end if;
end
$$;

create or replace function public.respond_friend_request(p_sender uuid,p_accept boolean)
returns void
language plpgsql security definer set search_path=''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if public.is_social_blocked(p_sender) then raise exception 'BLOCKED'; end if;

  if p_accept then
    update public.friend_requests
      set status='accepted',updated_at=now()
      where sender_id=p_sender and receiver_id=v_uid and status='pending';
    if not found then raise exception 'NO_REQUEST'; end if;
    delete from public.friend_requests
      where sender_id=v_uid and receiver_id=p_sender and status='pending';
  else
    delete from public.friend_requests
      where sender_id=p_sender and receiver_id=v_uid and status='pending';
  end if;
end
$$;

create or replace function public.remove_friend(p_target uuid)
returns void
language plpgsql security definer set search_path=''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  delete from public.friend_requests
  where status='accepted'
    and ((sender_id=v_uid and receiver_id=p_target)
      or (sender_id=p_target and receiver_id=v_uid));
end
$$;

create or replace function public.block_social_player(p_target uuid)
returns void
language plpgsql security definer set search_path=''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_target=v_uid then raise exception 'SELF_BLOCK'; end if;

  insert into public.social_blocks(blocker_id,blocked_id)
  values(v_uid,p_target)
  on conflict do nothing;

  delete from public.follows
  where (follower_id=v_uid and followed_id=p_target)
     or (follower_id=p_target and followed_id=v_uid);

  delete from public.friend_requests
  where (sender_id=v_uid and receiver_id=p_target)
     or (sender_id=p_target and receiver_id=v_uid);
end
$$;

create or replace function public.get_friend_network()
returns table(
  user_id uuid,
  handle text,
  public_name text,
  real_level integer,
  rank text,
  status text
)
language sql stable security definer set search_path=''
as $$
  select
    case when fr.sender_id=(select auth.uid()) then fr.receiver_id else fr.sender_id end,
    sp.handle,
    sp.public_name,
    sp.real_level,
    sp.rank,
    case
      when fr.status='accepted' then 'FRIENDS'
      when fr.sender_id=(select auth.uid()) then 'REQUEST_SENT'
      else 'REQUEST_RECEIVED'
    end
  from public.friend_requests fr
  join public.social_profiles sp
    on sp.user_id=case when fr.sender_id=(select auth.uid()) then fr.receiver_id else fr.sender_id end
  where (fr.sender_id=(select auth.uid()) or fr.receiver_id=(select auth.uid()))
    and not public.is_social_blocked(sp.user_id)
  order by fr.updated_at desc
$$;

create or replace function public.publish_verified_social_activity(p_event_key text)
returns void
language plpgsql security definer set search_path=''
as $$
declare
  v_uid uuid := auth.uid();
  v_source text;
  v_reward text;
  v_xp bigint;
  v_energy bigint;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_event_key is null or p_event_key !~ '^verified:[A-Za-z0-9._:-]{1,180}$' then
    raise exception 'INVALID_EVENT';
  end if;

  select l.source_id,l.reward_code,l.real_xp,l.energy
    into v_source,v_reward,v_xp,v_energy
  from public.reward_ledger l
  where l.user_id=v_uid
    and l.evidence_event_key=p_event_key
    and l.source_type='VERIFIED_EVENT'
  limit 1;

  if v_source is null then raise exception 'UNVERIFIED_EVENT'; end if;

  insert into public.social_activity(
    user_id,event_type,visibility,source_event_key,metadata
  )
  values(
    v_uid,
    'QUEST_COMPLETED',
    'friends',
    p_event_key,
    jsonb_build_object(
      'quest_id',v_source,
      'reward_code',v_reward,
      'real_xp',coalesce(v_xp,0),
      'energy',coalesce(v_energy,0)
    )
  )
  on conflict(user_id,source_event_key)
    where source_event_key is not null
    do nothing;
end
$$;

create or replace function public.get_social_feed(p_limit integer default 50)
returns table(
  id uuid,
  player_id uuid,
  event_type text,
  created_at timestamptz,
  visibility text,
  metadata jsonb
)
language sql stable security definer set search_path=''
as $$
  select
    a.id,a.user_id,a.event_type,a.created_at,upper(a.visibility),a.metadata
  from public.social_activity a
  where
    (a.user_id=(select auth.uid()) or not public.is_social_blocked(a.user_id))
    and (
      a.user_id=(select auth.uid())
      or a.visibility='public'
      or (
        a.visibility='friends'
        and exists(
          select 1 from public.friend_requests fr
          where fr.status='accepted'
            and ((fr.sender_id=(select auth.uid()) and fr.receiver_id=a.user_id)
              or (fr.receiver_id=(select auth.uid()) and fr.sender_id=a.user_id))
        )
      )
    )
  order by a.created_at desc,a.id
  limit greatest(1,least(coalesce(p_limit,50),100))
$$;

create or replace function public.join_guild(p_guild uuid)
returns void
language plpgsql security definer set search_path=''
as $$
declare
  v_uid uuid := auth.uid();
  v_visibility text;
  v_inserted integer;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;

  select g.visibility into v_visibility
  from public.guilds g
  where g.id=p_guild;

  if v_visibility is null then raise exception 'GUILD_NOT_FOUND'; end if;
  if v_visibility<>'PUBLIC' then raise exception 'INVITE_REQUIRED'; end if;

  if exists(
    select 1 from public.guild_members gm
    where gm.user_id=v_uid and gm.guild_id<>p_guild
  ) then raise exception 'ALREADY_IN_GUILD'; end if;

  insert into public.guild_members(guild_id,user_id,role)
  values(p_guild,v_uid,'MEMBER')
  on conflict(user_id) do nothing;
  get diagnostics v_inserted = row_count;

  if v_inserted=0 and not exists(
    select 1 from public.guild_members gm
    where gm.user_id=v_uid and gm.guild_id=p_guild
  ) then
    raise exception 'ALREADY_IN_GUILD';
  end if;

  update public.guilds g
  set member_count=(
    select count(*)::integer from public.guild_members gm where gm.guild_id=g.id
  )
  where g.id=p_guild;
end
$$;

create or replace function public.get_active_raids()
returns table(
  id uuid,
  title text,
  boss_hp bigint,
  damage bigint,
  starts_at timestamptz,
  ends_at timestamptz,
  status text
)
language sql stable security invoker set search_path=''
as $$
  select
    r.id,
    r.title,
    r.boss_hp,
    r.damage,
    r.starts_at,
    r.ends_at,
    case
      when r.damage>=r.boss_hp then 'DEFEATED'
      when now()>=r.ends_at then 'EXPIRED'
      when now()>=r.starts_at then 'ACTIVE'
      else 'UPCOMING'
    end
  from public.raids r
  where r.ends_at>now()-interval '24 hours'
  order by r.starts_at asc
$$;

create or replace function public.submit_raid_damage(
  p_raid uuid,
  p_event_key text,
  p_damage integer
)
returns void
language plpgsql security definer set search_path=''
as $$
declare
  v_uid uuid := auth.uid();
  v_inserted integer;
  v_damage integer;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_event_key is null or p_event_key !~ '^verified:[A-Za-z0-9._:-]{1,180}$' then
    raise exception 'INVALID_EVENT';
  end if;

  if not exists(
    select 1 from public.raids r
    where r.id=p_raid
      and now()>=r.starts_at
      and now()<r.ends_at
      and r.damage<r.boss_hp
  ) then raise exception 'RAID_NOT_ACTIVE'; end if;

  select least(
    500,
    greatest(1,coalesce(l.real_xp,0)+coalesce(l.energy,0)*2)
  )::integer
    into v_damage
  from public.reward_ledger l
  where l.user_id=v_uid
    and l.evidence_event_key=p_event_key
    and l.source_type='VERIFIED_EVENT'
  limit 1;

  if v_damage is null then raise exception 'UNVERIFIED_EVENT'; end if;

  -- p_damage is retained in the mobile RPC signature for compatibility and is never trusted.
  insert into public.raid_damage(raid_id,event_key,user_id,damage)
  values(p_raid,p_event_key,v_uid,v_damage)
  on conflict do nothing;

  get diagnostics v_inserted = row_count;
  if v_inserted>0 then
    update public.raids r
    set damage=least(r.boss_hp,r.damage+v_damage),
        status=case when r.damage+v_damage>=r.boss_hp then 'DEFEATED' else 'ACTIVE' end
    where r.id=p_raid;
  end if;
end
$$;

create or replace function public.get_active_social_challenges()
returns table(
  id uuid,
  title text,
  metric text,
  target bigint,
  starts_at timestamptz,
  ends_at timestamptz,
  visibility text
)
language sql stable security invoker set search_path=''
as $$
  select c.id,c.title,c.metric,c.target,c.starts_at,c.ends_at,c.visibility
  from public.social_challenges c
  where now()>=c.starts_at and now()<c.ends_at
  order by c.ends_at asc
$$;

create or replace function public.search_players(
  p_query text,
  p_limit integer default 20
)
returns table(
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
language sql stable security invoker set search_path=''
as $$
  with input as (
    select lower(trim(coalesce(p_query,''))) as q
  )
  select
    sp.user_id,sp.handle,sp.public_name,sp.bio,sp.visibility,
    sp.continent_code,sp.country_code,sp.region_code,sp.city_label,
    sp.real_level,sp.rank,sp.real_total_xp,sp.follower_count,sp.following_count
  from public.social_profiles sp,input i
  where sp.visibility='public'
    and char_length(i.q) between 2 and 40
    and not public.is_social_blocked(sp.user_id)
    and (
      strpos(lower(coalesce(sp.handle,'')),i.q)=1
      or strpos(lower(coalesce(sp.public_name,'')),i.q)>0
    )
  order by
    case
      when lower(coalesce(sp.handle,''))=i.q then 0
      when lower(coalesce(sp.public_name,''))=i.q then 1
      when strpos(lower(coalesce(sp.handle,'')),i.q)=1 then 2
      else 3
    end,
    sp.real_total_xp desc,
    sp.user_id
  limit greatest(1,least(coalesce(p_limit,20),50))
$$;

revoke all on table
  public.friend_requests,
  public.social_blocks,
  public.social_activity,
  public.guilds,
  public.guild_members,
  public.raids,
  public.raid_damage,
  public.seasons,
  public.social_challenges,
  public.challenge_progress
from anon,authenticated;

grant select on table
  public.friend_requests,
  public.social_blocks,
  public.guilds,
  public.guild_members,
  public.raids,
  public.seasons,
  public.social_challenges,
  public.challenge_progress
to authenticated;

grant delete on table public.social_blocks to authenticated;

revoke all on function public.is_social_blocked(uuid) from public,anon;
revoke all on function public.is_guild_member(uuid) from public,anon;
revoke all on function public.social_followers_count() from public,anon;
revoke all on function public.social_following_count() from public,anon;
revoke all on function public.social_friends_count() from public,anon;
revoke all on function public.send_friend_request(uuid) from public,anon;
revoke all on function public.respond_friend_request(uuid,boolean) from public,anon;
revoke all on function public.remove_friend(uuid) from public,anon;
revoke all on function public.block_social_player(uuid) from public,anon;
revoke all on function public.get_friend_network() from public,anon;
revoke all on function public.publish_verified_social_activity(text) from public,anon;
revoke all on function public.get_social_feed(integer) from public,anon;
revoke all on function public.join_guild(uuid) from public,anon;
revoke all on function public.get_active_raids() from public,anon;
revoke all on function public.submit_raid_damage(uuid,text,integer) from public,anon;
revoke all on function public.get_active_social_challenges() from public,anon;
revoke all on function public.search_players(text,integer) from public,anon;

grant execute on function public.is_social_blocked(uuid) to authenticated;
grant execute on function public.is_guild_member(uuid) to authenticated;
grant execute on function public.social_followers_count() to authenticated;
grant execute on function public.social_following_count() to authenticated;
grant execute on function public.social_friends_count() to authenticated;
grant execute on function public.send_friend_request(uuid) to authenticated;
grant execute on function public.respond_friend_request(uuid,boolean) to authenticated;
grant execute on function public.remove_friend(uuid) to authenticated;
grant execute on function public.block_social_player(uuid) to authenticated;
grant execute on function public.get_friend_network() to authenticated;
grant execute on function public.publish_verified_social_activity(text) to authenticated;
grant execute on function public.get_social_feed(integer) to authenticated;
grant execute on function public.join_guild(uuid) to authenticated;
grant execute on function public.get_active_raids() to authenticated;
grant execute on function public.submit_raid_damage(uuid,text,integer) to authenticated;
grant execute on function public.get_active_social_challenges() to authenticated;
grant execute on function public.search_players(text,integer) to authenticated;
