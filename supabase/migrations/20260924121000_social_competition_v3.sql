-- SYSTEM SOCIAL COMPETITION v3
-- Rich read models + season cosmetic claim loop.
-- Scores remain server-authoritative.

create table if not exists public.season_claims_v3 (
  season_id uuid not null references public.seasons(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reward_level integer not null check (reward_level in (5,15,30,50)),
  claimed_at timestamptz not null default now(),
  primary key(season_id,user_id,reward_level)
);
alter table public.season_claims_v3 enable row level security;
drop policy if exists season_claims_v3_own_read on public.season_claims_v3;
create policy season_claims_v3_own_read on public.season_claims_v3
for select to authenticated using(user_id=(select auth.uid()));
revoke all on table public.season_claims_v3 from anon,authenticated;
grant select on table public.season_claims_v3 to authenticated;

create or replace function public.get_my_pvp_challenges_v3()
returns table(
  id uuid,
  creator_id uuid,
  opponent_id uuid,
  creator_name text,
  opponent_name text,
  metric text,
  target bigint,
  creator_score bigint,
  opponent_score bigint,
  starts_at timestamptz,
  ends_at timestamptz,
  status text,
  my_side text,
  my_score bigint,
  rival_score bigint,
  progress_percent integer
)
language plpgsql security definer set search_path=''
as $$
declare v_uid uuid:=auth.uid();
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;

  update public.pvp_challenges
  set status='COMPLETE'
  where status in ('OPEN','ACTIVE') and ends_at<=now();

  return query
  select
    c.id,c.creator_id,c.opponent_id,
    coalesce(pc.display_name,'PLAYER'),
    coalesce(po.display_name,'PLAYER'),
    c.metric,c.target,c.creator_score,c.opponent_score,c.starts_at,c.ends_at,c.status,
    case when c.creator_id=v_uid then 'CREATOR' else 'OPPONENT' end,
    case when c.creator_id=v_uid then c.creator_score else c.opponent_score end,
    case when c.creator_id=v_uid then c.opponent_score else c.creator_score end,
    least(100,greatest(0,round(
      100.0*case when c.creator_id=v_uid then c.creator_score else c.opponent_score end
      /greatest(c.target,1)
    )::integer))
  from public.pvp_challenges c
  left join public.profiles pc on pc.id=c.creator_id
  left join public.profiles po on po.id=c.opponent_id
  where v_uid in (c.creator_id,c.opponent_id)
  order by
    case c.status when 'ACTIVE' then 0 when 'OPEN' then 1 else 2 end,
    c.created_at desc
  limit 50;
end $$;

create or replace function public.get_my_guild_wars_v3()
returns table(
  id uuid,
  guild_a uuid,
  guild_b uuid,
  guild_a_name text,
  guild_a_tag text,
  guild_b_name text,
  guild_b_tag text,
  score_a bigint,
  score_b bigint,
  starts_at timestamptz,
  ends_at timestamptz,
  status text,
  my_guild_id uuid,
  my_side text,
  my_contribution bigint,
  my_verified_events bigint
)
language plpgsql security definer set search_path=''
as $$
declare v_uid uuid:=auth.uid();v_guild uuid;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  select gm.guild_id into v_guild
  from public.guild_members gm where gm.user_id=v_uid limit 1;
  if v_guild is null then return; end if;

  update public.guild_wars
  set status='COMPLETE'
  where status='ACTIVE' and ends_at<=now();

  return query
  select
    w.id,w.guild_a,w.guild_b,
    ga.name,ga.tag,gb.name,gb.tag,
    w.score_a,w.score_b,w.starts_at,w.ends_at,w.status,
    v_guild,
    case when v_guild=w.guild_a then 'A' else 'B' end,
    coalesce((
      select sum(e.value)::bigint from public.guild_war_events e
      where e.war_id=w.id and e.user_id=v_uid
    ),0)::bigint,
    coalesce((
      select count(*)::bigint from public.guild_war_events e
      where e.war_id=w.id and e.user_id=v_uid
    ),0)::bigint
  from public.guild_wars w
  join public.guilds ga on ga.id=w.guild_a
  join public.guilds gb on gb.id=w.guild_b
  where v_guild in (w.guild_a,w.guild_b)
  order by
    case w.status when 'ACTIVE' then 0 else 1 end,
    w.created_at desc
  limit 30;
end $$;

create or replace function public.get_active_raids_v3()
returns table(
  id uuid,
  title text,
  boss_hp bigint,
  damage bigint,
  starts_at timestamptz,
  ends_at timestamptz,
  status text,
  participant_count bigint,
  my_damage bigint,
  my_event_count bigint,
  my_rank bigint
)
language plpgsql security definer set search_path=''
as $$
declare v_uid uuid:=auth.uid();
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;

  update public.raids
  set status='EXPIRED'
  where status='ACTIVE' and ends_at<=now() and damage<boss_hp;

  return query
  with totals as (
    select rd.raid_id,rd.user_id,sum(rd.damage)::bigint as user_damage,count(*)::bigint as event_count
    from public.raid_damage rd
    group by rd.raid_id,rd.user_id
  ),
  ranked as (
    select t.*,dense_rank() over(partition by t.raid_id order by t.user_damage desc,t.user_id)::bigint as rank_no
    from totals t
  )
  select
    r.id,r.title,r.boss_hp,r.damage,r.starts_at,r.ends_at,r.status,
    coalesce((select count(*)::bigint from totals t where t.raid_id=r.id),0),
    coalesce((select t.user_damage from totals t where t.raid_id=r.id and t.user_id=v_uid),0),
    coalesce((select t.event_count from totals t where t.raid_id=r.id and t.user_id=v_uid),0),
    coalesce((select rr.rank_no from ranked rr where rr.raid_id=r.id and rr.user_id=v_uid),0)
  from public.raids r
  where
    (r.starts_at<=now() and r.ends_at>now())
    or (r.ends_at<=now() and r.ends_at>=now()-interval '3 days')
  order by r.starts_at desc
  limit 20;
end $$;

create or replace function public.get_raid_leaderboard_v3(p_raid uuid,p_limit integer default 10)
returns table(
  user_id uuid,
  display_name text,
  damage bigint,
  verified_events bigint,
  rank_no bigint
)
language plpgsql stable security definer set search_path=''
as $$
declare v_uid uuid:=auth.uid();
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if not exists(
    select 1 from public.raids r
    where r.id=p_raid and (r.ends_at>now()-interval '7 days')
  ) then raise exception 'RAID_NOT_AVAILABLE'; end if;

  return query
  with totals as (
    select rd.user_id,sum(rd.damage)::bigint as total_damage,count(*)::bigint as cnt
    from public.raid_damage rd where rd.raid_id=p_raid
    group by rd.user_id
  ),
  ranked as (
    select t.*,dense_rank() over(order by t.total_damage desc,t.user_id)::bigint as rank_no
    from totals t
  )
  select
    x.user_id,
    coalesce(p.display_name,'PLAYER'),
    x.total_damage,
    x.cnt,
    x.rank_no
  from ranked x
  left join public.profiles p on p.id=x.user_id
  order by x.rank_no,x.user_id
  limit greatest(1,least(coalesce(p_limit,10),25));
end $$;

create or replace function public.get_current_season_v3()
returns table(
  id uuid,
  name text,
  starts_at timestamptz,
  ends_at timestamptz,
  verified_events integer,
  season_points bigint,
  track_level integer,
  claimed_levels integer[],
  next_reward_level integer,
  global_players bigint,
  global_points bigint
)
language plpgsql stable security definer set search_path=''
as $$
declare v_uid uuid:=auth.uid();
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;

  return query
  select
    s.id,s.name,s.starts_at,s.ends_at,
    coalesce(p.verified_events,0),
    coalesce(p.season_points,0),
    greatest(0,least(50,coalesce(p.season_points,0)::integer)),
    coalesce((
      select array_agg(c.reward_level order by c.reward_level)
      from public.season_claims_v3 c
      where c.season_id=s.id and c.user_id=v_uid
    ),array[]::integer[]),
    (
      select min(x.level)
      from (values(5),(15),(30),(50)) x(level)
      where x.level>greatest(0,least(50,coalesce(p.season_points,0)::integer))
    ),
    coalesce((
      select count(*)::bigint from public.season_progress_v2 gp where gp.season_id=s.id
    ),0),
    coalesce((
      select sum(gp.season_points)::bigint from public.season_progress_v2 gp where gp.season_id=s.id
    ),0)
  from public.seasons s
  left join public.season_progress_v2 p
    on p.season_id=s.id and p.user_id=v_uid
  where now()>=s.starts_at and now()<s.ends_at
  order by s.starts_at desc
  limit 1;
end $$;

create or replace function public.claim_season_reward_v3(p_level integer)
returns integer
language plpgsql security definer set search_path=''
as $$
declare v_uid uuid:=auth.uid();v_season uuid;v_track integer;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_level not in (5,15,30,50) then raise exception 'INVALID_REWARD_LEVEL'; end if;

  select s.id,greatest(0,least(50,coalesce(p.season_points,0)::integer))
  into v_season,v_track
  from public.seasons s
  left join public.season_progress_v2 p
    on p.season_id=s.id and p.user_id=v_uid
  where now()>=s.starts_at and now()<s.ends_at
  order by s.starts_at desc
  limit 1;

  if v_season is null then raise exception 'NO_ACTIVE_SEASON'; end if;
  if v_track<p_level then raise exception 'SEASON_REWARD_LOCKED'; end if;

  insert into public.season_claims_v3(season_id,user_id,reward_level)
  values(v_season,v_uid,p_level)
  on conflict do nothing;
  return p_level;
end $$;

revoke all on function public.get_my_pvp_challenges_v3() from public,anon;
revoke all on function public.get_my_guild_wars_v3() from public,anon;
revoke all on function public.get_active_raids_v3() from public,anon;
revoke all on function public.get_raid_leaderboard_v3(uuid,integer) from public,anon;
revoke all on function public.get_current_season_v3() from public,anon;
revoke all on function public.claim_season_reward_v3(integer) from public,anon;
grant execute on function public.get_my_pvp_challenges_v3() to authenticated;
grant execute on function public.get_my_guild_wars_v3() to authenticated;
grant execute on function public.get_active_raids_v3() to authenticated;
grant execute on function public.get_raid_leaderboard_v3(uuid,integer) to authenticated;
grant execute on function public.get_current_season_v3() to authenticated;
grant execute on function public.claim_season_reward_v3(integer) to authenticated;
